import express from 'express';
import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import Hub from '../models/Hub.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { generateRoute } from '../services/routeGenerationService.js';
import { sendDeliveryOtpEmail } from '../services/emailService.js';

const router = express.Router();
router.use(requireAuth);

// Get all available districts with hub information (for district selection)
router.get('/districts', asyncHandler(async (req, res) => {
  if (req.userRole !== 'hubmanager' && req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Hub Managers only' });
  }

  // Get all districts with their hub counts and types
  const districts = await Hub.aggregate([
    { $match: { isActive: true, district: { $exists: true, $ne: null, $ne: '' } } },
    {
      $group: {
        _id: '$district',
        hubCount: { $sum: 1 },
        hubTypes: { $addToSet: '$type' }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        district: '$_id',
        hubCount: 1,
        hubTypes: 1
      }
    }
  ]);

  // Get order counts per district (optional enhancement)
  const orderCounts = await Order.aggregate([
    {
      $match: {
        status: { $nin: ['DELIVERED', 'CANCELLED'] }
      }
    },
    {
      $lookup: {
        from: 'hubs',
        localField: 'currentHub',
        foreignField: '_id',
        as: 'hubInfo'
      }
    },
    { $unwind: '$hubInfo' },
    {
      $group: {
        _id: '$hubInfo.district',
        orderCount: { $sum: 1 }
      }
    }
  ]);

  // Merge order counts with district data
  const orderCountMap = {};
  orderCounts.forEach(oc => {
    orderCountMap[oc._id] = oc.orderCount;
  });

  const districtsWithOrders = districts.map(d => ({
    ...d,
    orderCount: orderCountMap[d.district] || 0
  }));

  res.json({ districts: districtsWithOrders });
}));

// Select a district for hub management (stores in session)
router.post('/select-district', asyncHandler(async (req, res) => {
  if (req.userRole !== 'hubmanager' && req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Hub Managers only' });
  }

  const { district } = req.body;
  
  if (!district) {
    return res.status(400).json({ error: 'District is required' });
  }

  // Find a hub in the selected district (prefer the main/first hub)
  const hub = await Hub.findOne({ 
    district: { $regex: new RegExp(`^${district}$`, 'i') },
    isActive: true
  }).sort({ order: 1 });

  if (!hub) {
    return res.status(404).json({ error: 'No hub found for this district' });
  }

  // Return hub data - the frontend will store this in session storage
  res.json({ 
    success: true, 
    hub: {
      _id: hub._id,
      name: hub.name,
      district: hub.district,
      type: hub.type,
      order: hub.order
    },
    district 
  });
}));

// Get hub by district (for fetching hub info after district selection)
router.get('/by-district/:district', asyncHandler(async (req, res) => {
  if (req.userRole !== 'hubmanager' && req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Hub Managers only' });
  }

  const district = req.params.district;
  
  const hub = await Hub.findOne({ 
    district: { $regex: new RegExp(`^${district}$`, 'i') },
    isActive: true
  }).sort({ order: 1 });

  if (!hub) {
    return res.status(404).json({ error: 'No hub found for this district' });
  }

  res.json(hub);
}));

// Middleware to check if user is a Hub Manager
// Middleware to check if user is a Hub Manager
async function requireHubManager(req, res, next) {
  if (req.userRole === 'hubmanager' || req.userRole === 'admin') {
    // We need the MongoDB _id to check the Hub relation, but req.user only has firebaseUid
    // Fetch the full user if not already present
    let mongoUserId = req.user._id;

    if (!mongoUserId) {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      if (!user) {
        return res.status(401).json({ message: 'User profile not found' });
      }
      mongoUserId = user._id;
      // Attach to request for downstream use and potential caching
      req.user = { ...req.user, ...user.toObject(), _id: user._id };
    }

    // Check if district is passed in request headers (for common hub manager account)
    const selectedDistrict = req.headers['x-selected-district'];
    
    let hub;
    
    if (selectedDistrict) {
      // District-based selection (for common hub manager)
      hub = await Hub.findOne({ 
        district: { $regex: new RegExp(`^${selectedDistrict}$`, 'i') },
        isActive: true
      }).sort({ order: 1 });
    } else {
      // Traditional hubId assignment
      hub = await Hub.findOne({ 
        managedBy: mongoUserId,
        district: { $exists: true, $ne: null, $ne: '' }
      }) || await Hub.findOne({ managedBy: mongoUserId });
    }

    if (!hub && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'You are not assigned to any Hub or no district selected', debug_id: mongoUserId });
    }

    req.userHub = hub;
    return next();
  }
  return res.status(403).json({ message: 'Hub Managers only' });
}

// Get Hub Details
router.get('/my-hub', requireHubManager, asyncHandler(async (req, res) => {
  res.json(req.userHub);
}));

// Get available delivery boys for this hub's area
router.get('/available-delivery-boys', requireHubManager, asyncHandler(async (req, res) => {
  const deliveryBoys = await User.find({ role: 'deliveryboy', isActive: true })
    .select('_id firstName lastName phone email')
    .sort({ firstName: 1 });
  res.json(deliveryBoys);
}));

// Get next hub from order route
router.get('/next-hub/:orderId', requireHubManager, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate('route');
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const currentIndex = order.route.findIndex(h => h._id.toString() === req.userHub._id.toString());
  if (currentIndex === -1 || currentIndex >= order.route.length - 1) {
    return res.status(400).json({ message: 'No next hub in route' });
  }

  const nextHub = order.route[currentIndex + 1];
  res.json(nextHub);
}));

// Get Active Orders currently at the Hub (not yet dispatched)
router.get('/orders', requireHubManager, asyncHandler(async (req, res) => {
  const hub = req.userHub;
  
  console.log(`[Hub Orders] Fetching orders for hub: ${hub.name} (${hub._id})`);
  
  // Helper function to compare hub IDs
  const hubIdsMatch = (hubId1, hubId2) => {
    if (!hubId1 || !hubId2) return false;
    const id1 = typeof hubId1 === 'object' && hubId1._id ? hubId1._id.toString() : hubId1.toString();
    const id2 = typeof hubId2 === 'object' && hubId2._id ? hubId2._id.toString() : hubId2.toString();
    return id1 === id2;
  };
  
  // Find orders at this hub that haven't been dispatched yet
  // Include IN_TRANSIT orders that are heading to this hub
  const orders = await Order.find({ 
    currentHub: hub._id,
    status: { $nin: ['DELIVERED', 'CANCELLED', 'OUT_FOR_DELIVERY'] }
  })
    .populate('user', 'firstName lastName email phone name')
    .populate('route', 'name district order type location')
    .populate('currentHub', 'name district type')
    .lean();
  
  console.log(`[Hub Orders] Found ${orders.length} orders at this hub before filtering`);

  // Filter out orders that have been dispatched from this hub
  const activeOrders = orders.filter(order => {
    const dispatchedFromHub = order.trackingTimeline?.some(
      entry => entry.status === 'IN_TRANSIT' && 
      entry.hub && hubIdsMatch(entry.hub, hub._id)
    );
    return !dispatchedFromHub;
  });

  console.log(`[Hub Orders] After filtering out dispatched: ${activeOrders.length} active orders`);
  console.log(`[Hub Orders] Order statuses:`, activeOrders.map(o => ({ id: o._id, status: o.status, currentHub: o.currentHub?.name })));

  // Sort by priority: IN_TRANSIT (incoming) first, then PENDING, then APPROVED, then by creation date (newest first)
  activeOrders.sort((a, b) => {
    const statusPriority = { 'IN_TRANSIT': 1, 'PENDING': 2, 'APPROVED': 3 };
    const aPriority = statusPriority[a.status] || 4;
    const bPriority = statusPriority[b.status] || 4;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  res.json(activeOrders);
}));

// Get Dispatched Orders from the Hub
router.get('/dispatched-orders', requireHubManager, asyncHandler(async (req, res) => {
  const hub = req.userHub;
  
  // Find orders that have been dispatched from this hub
  const allOrders = await Order.find({ 
    $or: [
      { currentHub: hub._id },
      { 'trackingTimeline.hub': hub._id }
    ]
  })
    .populate('user', 'firstName lastName email phone name')
    .populate('route', 'name district order type location')
    .populate('currentHub', 'name district type')
    .lean();

  // Helper function to compare hub IDs
  const hubIdsMatch = (hubId1, hubId2) => {
    if (!hubId1 || !hubId2) return false;
    const id1 = typeof hubId1 === 'object' && hubId1._id ? hubId1._id.toString() : hubId1.toString();
    const id2 = typeof hubId2 === 'object' && hubId2._id ? hubId2._id.toString() : hubId2.toString();
    return id1 === id2;
  };

  // Filter to only dispatched orders from this hub
  const dispatchedOrders = allOrders.filter(order => {
    if (!order.trackingTimeline || order.trackingTimeline.length === 0) {
      return false;
    }

    // Check if dispatched to delivery boy from this hub
    if (order.status === 'OUT_FOR_DELIVERY') {
      const outForDeliveryEvent = order.trackingTimeline.find(
        entry => entry.status === 'OUT_FOR_DELIVERY' && 
        entry.hub && hubIdsMatch(entry.hub, hub._id)
      );
      if (outForDeliveryEvent) return true;
    }

    // Check if dispatched to another hub from this hub
    const dispatchedFromHub = order.trackingTimeline.some(
      entry => entry.status === 'IN_TRANSIT' && 
      entry.hub && hubIdsMatch(entry.hub, hub._id)
    );
    return dispatchedFromHub;
  });

  // Sort by dispatch time (most recent first)
  dispatchedOrders.sort((a, b) => {
    const getDispatchTime = (order) => {
      const events = order.trackingTimeline?.filter(
        entry => (entry.status === 'IN_TRANSIT' || entry.status === 'OUT_FOR_DELIVERY') &&
        entry.hub && hubIdsMatch(entry.hub, hub._id)
      ) || [];
      if (events.length === 0) return 0;
      const latestEvent = events[events.length - 1];
      return new Date(latestEvent.timestamp || latestEvent.createdAt).getTime();
    };
    
    return getDispatchTime(b) - getDispatchTime(a);
  });

  res.json(dispatchedOrders);
}));

// Scan In (Receive Package at Hub)
router.post('/scan-in', requireHubManager, asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const hub = req.userHub;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  // Verify if this hub is in the route
  const hubIndex = order.route.findIndex(h => h.toString() === hub._id.toString());
  if (hubIndex === -1) {
    return res.status(400).json({ message: 'This hub is not in the delivery route for this order' });
  }

  // Check sequence: Previous hub must be the currentHub
  if (hubIndex > 0) {
    const previousHubId = order.route[hubIndex - 1].toString();
    if (order.currentHub && order.currentHub.toString() !== previousHubId && order.currentHub.toString() !== hub._id.toString()) {
      return res.status(400).json({
        message: 'Order sequence violation. Package skipped a hub or is off-route.',
        expectedFrom: previousHubId,
        actualCurrent: order.currentHub
      });
    }
  }

  // Check if already scanned at this hub (check all timeline events, not just the last one)
  const alreadyScannedAtHub = order.trackingTimeline.some(
    event => event.hub && event.hub.toString() === hub._id.toString() && event.status === 'ARRIVED_AT_HUB'
  );
  
  if (alreadyScannedAtHub) {
    return res.status(400).json({ message: 'Package already scanned at this hub' });
  }

  order.currentHub = hub._id;
  
  // Update order status to APPROVED after scan-in at any hub
  // This makes the order ready for dispatch from this hub
  if (order.status === 'PENDING' || order.status === 'IN_TRANSIT') {
    order.status = 'APPROVED';
  }
  
  order.trackingTimeline.push({
    status: 'ARRIVED_AT_HUB',
    location: hub.name,
    hub: hub._id,
    description: `Package arrived at ${hub.name} (${hub.type})`
  });

  await order.save();
  
  // Re-fetch and populate the order before returning
  const populatedOrder = await Order.findById(order._id)
    .populate('route', 'name district order type location')
    .populate('currentHub', 'name district type')
    .populate('user', 'firstName lastName email phone name');
  
  res.json(populatedOrder);
}));

// Dispatch (Send to next Hub or Out for Delivery)
router.post('/dispatch', requireHubManager, asyncHandler(async (req, res) => {
  const { orderId, nextHubId, deliveryBoyId } = req.body;
  const hub = req.userHub;

  const order = await Order.findById(orderId).populate('user');
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (order.currentHub && order.currentHub.toString() !== hub._id.toString()) {
    return res.status(400).json({ message: 'Order is not currently at your hub' });
  }

  // Prevent dispatching if already dispatched
  if (order.status === 'OUT_FOR_DELIVERY') {
    return res.status(400).json({ message: 'Order is already out for delivery and cannot be dispatched again' });
  }

  // Check if already dispatched from this hub (has IN_TRANSIT entry from this hub)
  const alreadyDispatchedFromHub = order.trackingTimeline.some(
    entry => entry.status === 'IN_TRANSIT' && 
    entry.hub && entry.hub.toString() === hub._id.toString()
  );

  if (alreadyDispatchedFromHub) {
    return res.status(400).json({ message: 'Order has already been dispatched from this hub' });
  }

  // Check if it's the last hub (Local Hub) -> Out for Delivery
  if (hub.type === 'LOCAL_HUB') {
    // Dispatch to Delivery Boy
    if (!deliveryBoyId) {
      // If no delivery boy specified, maybe just mark as READY_FOR_DELIVERY?
      // For now, let's require deliveryBoyId or handle it.
      // Or maybe we just mark it 'DISPATCHED_LOCALLY' and wait for delivery boy to accept?
      // Let's assume we assign it here.
    }

    if (deliveryBoyId) {
      order.deliveryBoy = deliveryBoyId;
      order.deliveryStatus = 'ASSIGNED'; // Or OUT_FOR_DELIVERY directly?
      // Usually: Assigned -> Accepted -> Out for Delivery.
      // But if Hub Manager physically hands it over, maybe 'OUT_FOR_DELIVERY'.

      // Let's generate OTP here if it's going out for delivery
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      order.deliveryOtp = otp;

      order.status = 'OUT_FOR_DELIVERY';
      order.deliveryStatus = 'OUT_FOR_DELIVERY';

      order.trackingTimeline.push({
        status: 'OUT_FOR_DELIVERY',
        location: 'Out for Delivery',
        hub: hub._id,
        description: `Package is out for delivery from ${hub.name}`
      });

      // Send OTP Email
      if (order.user && order.user.email) {
        await sendDeliveryOtpEmail({
          to: order.user.email,
          userName: order.user.firstName,
          order: order,
          otp: order.deliveryOtp
        });
      }
    } else {
      // Just mark as processed at hub, waiting for assignment
      order.status = 'APPROVED'; // Keep as approved?
      order.trackingTimeline.push({
        status: 'PROCESSED_AT_HUB',
        location: hub.name,
        hub: hub._id,
        description: `Package processed at ${hub.name}, waiting for delivery assignment`
      });
    }

  } else {
    // Dispatch to Next Hub
    // If nextHubId is provided, use it. Otherwise try to find from route.
    let nextHub = null;
    if (nextHubId) {
      nextHub = await Hub.findById(nextHubId);
    } else {
      // Find next hub in route
      // This requires finding index of current hub in route array
      const currentIndex = order.route.findIndex(h => h.toString() === hub._id.toString());
      if (currentIndex !== -1 && currentIndex < order.route.length - 1) {
        nextHub = await Hub.findById(order.route[currentIndex + 1]);
      }
    }

    if (nextHub) {
      console.log(`[Dispatch] Dispatching order ${order._id} from ${hub.name} to ${nextHub.name}`);
      console.log(`[Dispatch] Setting currentHub from ${order.currentHub} to ${nextHub._id}`);
      
      order.trackingTimeline.push({
        status: 'IN_TRANSIT',
        location: `In Transit to ${nextHub.name}`,
        hub: hub._id,
        description: `Package dispatched from ${hub.name} to ${nextHub.name}`
      });
      
      // Update currentHub to nextHub so it appears in next hub manager's list
      order.currentHub = nextHub._id;
      order.status = 'IN_TRANSIT';
      
      console.log(`[Dispatch] Order updated - currentHub: ${order.currentHub}, status: ${order.status}`);
    } else {
      return res.status(400).json({ message: 'Next Hub not determined' });
    }
  }

  await order.save();
  
  // Re-fetch and populate the order before returning
  const populatedOrder = await Order.findById(order._id)
    .populate('route', 'name district order type location')
    .populate('currentHub', 'name district type')
    .populate('user', 'firstName lastName email phone name');
  
  res.json(populatedOrder);
}));

// Fix order route - regenerate with correct hub IDs
router.post('/fix-route/:orderId', requireHubManager, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId)
    .populate('currentHub')
    .populate('route');
  
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  
  console.log(`[Fix Route] Order ${order._id} current route:`, order.route?.map(h => h.name));
  console.log(`[Fix Route] Destination: ${order.shippingAddress?.destinationDistrict || order.shippingAddress?.district}`);
  
  // Regenerate route
  const destination = order.shippingAddress?.destinationDistrict || order.shippingAddress?.district;
  if (!destination) {
    return res.status(400).json({ message: 'Order destination not found' });
  }
  
  const { generateRoute } = await import('../services/routeGenerationService.js');
  const newRoute = await generateRoute(destination);
  
  console.log(`[Fix Route] New route:`, newRoute.map(h => h.name));
  
  // Update order route
  order.route = newRoute.map(h => h._id);
  
  // If order is IN_TRANSIT, update currentHub to match the correct hub in the new route
  if (order.status === 'IN_TRANSIT') {
    // Find which hub it should be at based on tracking timeline
    const lastDispatch = [...order.trackingTimeline].reverse().find(t => t.status === 'IN_TRANSIT');
    if (lastDispatch) {
      const dispatchFromHubIndex = newRoute.findIndex(h => h._id.toString() === lastDispatch.hub?.toString());
      if (dispatchFromHubIndex !== -1 && dispatchFromHubIndex < newRoute.length - 1) {
        const correctNextHub = newRoute[dispatchFromHubIndex + 1];
        order.currentHub = correctNextHub._id;
        console.log(`[Fix Route] Updated currentHub to: ${correctNextHub.name} (${correctNextHub._id})`);
      }
    }
  }
  
  await order.save();
  
  const updatedOrder = await Order.findById(order._id)
    .populate('route', 'name _id')
    .populate('currentHub', 'name _id');
  
  res.json({
    message: 'Route fixed successfully',
    order: {
      _id: updatedOrder._id,
      status: updatedOrder.status,
      currentHub: updatedOrder.currentHub,
      route: updatedOrder.route
    }
  });
}));

// Get all hubs (Admin only)
router.get('/admin/all-hubs', requireAuth, asyncHandler(async (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }

  const hubs = await Hub.find({ isActive: true })
    .populate('managedBy', 'firstName lastName email phone')
    .sort({ order: 1 });

  res.json(hubs);
}));

// Get hub details with current orders
router.get('/admin/hub/:hubId/details', requireAuth, asyncHandler(async (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }

  const hub = await Hub.findById(req.params.hubId)
    .populate('managedBy', 'firstName lastName email phone');

  if (!hub) {
    return res.status(404).json({ message: 'Hub not found' });
  }

  const currentOrders = await Order.find({ currentHub: hub._id })
    .populate('user', 'firstName lastName email phone')
    .populate('route', 'name district order')
    .sort({ updatedAt: -1 });

  res.json({
    hub,
    currentOrders,
    ordersCount: currentOrders.length
  });
}));

// Get full delivery route for an order (Admin monitoring)
router.get('/admin/order/:orderId/route', requireAuth, asyncHandler(async (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }

  const order = await Order.findById(req.params.orderId)
    .populate('route', 'name district order type')
    .populate('currentHub', 'name district order type')
    .populate('user', 'firstName lastName email phone')
    .populate({
      path: 'trackingTimeline',
      populate: {
        path: 'hub',
        select: 'name district'
      }
    });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.json({
    order: {
      _id: order._id,
      user: order.user,
      status: order.status,
      shippingAddress: order.shippingAddress,
      items: order.items,
      totalAmount: order.totalAmount
    },
    route: order.route,
    currentHub: order.currentHub,
    trackingTimeline: order.trackingTimeline,
    totalHubsInRoute: order.route?.length || 0,
    currentHubIndex: order.route?.findIndex(h => h._id.toString() === order.currentHub?._id.toString()) || -1
  });
}));

// Get all orders in transit (between hubs)
router.get('/admin/in-transit', requireAuth, asyncHandler(async (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }

  const orders = await Order.find({
    status: 'OUT_FOR_DELIVERY',
    currentHub: { $exists: true }
  })
    .populate('user', 'firstName lastName email phone')
    .populate('currentHub', 'name district')
    .populate('deliveryBoy', 'firstName lastName phone')
    .sort({ updatedAt: -1 });

  res.json({
    inTransitOrders: orders,
    totalCount: orders.length
  });
}));

// Get route statistics (Admin dashboard)
router.get('/admin/stats', requireAuth, asyncHandler(async (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }

  const stats = {
    totalHubs: await Hub.countDocuments({ isActive: true }),
    totalOrders: await Order.countDocuments({}),
    pendingOrders: await Order.countDocuments({ status: 'PENDING' }),
    approvedOrders: await Order.countDocuments({ status: 'APPROVED' }),
    outForDelivery: await Order.countDocuments({ status: 'OUT_FOR_DELIVERY' }),
    deliveredOrders: await Order.countDocuments({ status: 'DELIVERED' }),
    cancelledOrders: await Order.countDocuments({ status: 'CANCELLED' })
  };

  const hubs = await Hub.find({ isActive: true }).sort({ order: 1 });
  const hubStats = await Promise.all(hubs.map(async hub => ({
    hubId: hub._id,
    hubName: hub.name,
    district: hub.district,
    order: hub.order,
    currentOrders: await Order.countDocuments({ currentHub: hub._id }),
    managerCount: hub.managedBy?.length || 0
  })));

  res.json({
    overallStats: stats,
    hubStats
  });
}));

export default router;
