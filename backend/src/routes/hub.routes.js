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

    // Find the hub managed by this user
    const hub = await Hub.findOne({ managedBy: mongoUserId });

    if (!hub && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'You are not assigned to any Hub', debug_id: mongoUserId });
    }

    // If admin is not assigned to a hub, maybe give them the first one or a dummy?
    // For now, let admins pass but userHub might be null if not assigned.
    // Better to just let admins view any hub via different routes or assign them temporarily.
    // If admin, and no hub found, we might want to return all hubs? 
    // This middleware specifically sets ONE userHub.

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

// Get Orders currently at the Hub
router.get('/orders', requireHubManager, asyncHandler(async (req, res) => {
  const filter = { currentHub: req.userHub._id };
  // Optionally filter by status (e.g., exclude dispatched ones if they are still linked to this hub but in transit? 
  // Actually, if it's dispatched, currentHub might still be this one until scanned in at next hub, 
  // OR we update currentHub to null or next hub upon dispatch.
  // Let's assume currentHub points to the hub where it physically IS or is EXPECTED to be.
  // If status is 'IN_TRANSIT', it's moving TO currentHub? Or FROM currentHub?
  // Let's say: currentHub is where it is. When dispatched, it's still associated with this hub until next hub scans it?
  // Better: currentHub is the LAST hub it was scanned at.

  const orders = await Order.find(filter)
    .sort({ updatedAt: -1 })
    .populate('route', 'name type location')
    .populate('currentHub', 'name type');
  res.json(orders);
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

  order.currentHub = hub._id;
  order.trackingTimeline.push({
    status: 'ARRIVED_AT_HUB',
    location: hub.name,
    hub: hub._id,
    description: `Package arrived at ${hub.name} (${hub.type})`
  });

  await order.save();
  res.json(order);
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
      order.trackingTimeline.push({
        status: 'IN_TRANSIT',
        location: `In Transit to ${nextHub.name}`,
        hub: hub._id,
        description: `Package dispatched from ${hub.name} to ${nextHub.name}`
      });
      // We don't change currentHub yet? Or we do?
      // If we change currentHub to nextHub, it will show up in nextHub's list?
      // Maybe nextHub's list should show "Incoming"?
      // For simplicity, let's keep currentHub as this hub until next hub scans it in.
      // But we need a way to know it's "In Transit".
    } else {
      return res.status(400).json({ message: 'Next Hub not determined' });
    }
  }

  await order.save();
  res.json(order);
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
