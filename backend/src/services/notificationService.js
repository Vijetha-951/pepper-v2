import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Hub from '../models/Hub.js';

/**
 * Create a notification for when an order is placed to a hub
 * @param {Object} order - The order document
 * @param {Object} hub - The hub where order is placed
 */
export async function createOrderPlacedNotification(order, hub) {
  try {
    // Find all hub managers for this hub
    const hubManagers = await User.find({
      $or: [
        { role: 'hubmanager', _id: { $in: hub.managedBy || [] } },
        { role: 'hubmanager', email: 'hubmanager@pepper.com' } // Common hub manager
      ]
    });

    if (hubManagers.length === 0) {
      console.log('⚠️ No hub managers found for hub:', hub.name);
      return [];
    }

    const customerName = order.user ? 
      `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : 
      'Customer';

    const notifications = [];

    for (const manager of hubManagers) {
      const notification = await Notification.create({
        recipient: manager._id,
        type: 'ORDER_PLACED',
        title: `New Order Placed at ${hub.district || hub.name}`,
        message: `A new order #${order._id.toString().substring(0, 8)} from ${customerName} has been placed to ${hub.name}. Total: ₹${order.totalAmount}`,
        order: order._id,
        hub: hub._id,
        isRead: false,
        metadata: {
          district: hub.district,
          orderStatus: order.status,
          customerName: customerName,
          orderId: order._id.toString()
        }
      });

      notifications.push(notification);
    }

    console.log(`✅ Created ${notifications.length} notifications for hub ${hub.name}`);
    return notifications;
  } catch (error) {
    console.error('❌ Error creating order placed notification:', error);
    return [];
  }
}

/**
 * Create a notification when order arrives at hub
 * @param {Object} order - The order document
 * @param {Object} hub - The hub where order arrived
 */
export async function createOrderArrivedNotification(order, hub) {
  try {
    const hubManagers = await User.find({
      $or: [
        { role: 'hubmanager', _id: { $in: hub.managedBy || [] } },
        { role: 'hubmanager', email: 'hubmanager@pepper.com' }
      ]
    });

    if (hubManagers.length === 0) return [];

    const customerName = order.user ? 
      `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : 
      'Customer';

    const notifications = [];

    for (const manager of hubManagers) {
      const notification = await Notification.create({
        recipient: manager._id,
        type: 'ORDER_ARRIVED',
        title: `Order Arrived at ${hub.district || hub.name}`,
        message: `Order #${order._id.toString().substring(0, 8)} from ${customerName} has arrived at ${hub.name}. Please scan to process.`,
        order: order._id,
        hub: hub._id,
        isRead: false,
        metadata: {
          district: hub.district,
          orderStatus: order.status,
          customerName: customerName,
          orderId: order._id.toString()
        }
      });

      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error('❌ Error creating order arrived notification:', error);
    return [];
  }
}

/**
 * Get unread notification count for a user
 * @param {String} userId - The user's MongoDB _id
 */
export async function getUnreadCount(userId) {
  try {
    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });
    return count;
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    return 0;
  }
}

/**
 * Get notifications for a user
 * @param {String} userId - The user's MongoDB _id
 * @param {Object} options - Query options (limit, skip, unreadOnly)
 */
export async function getUserNotifications(userId, options = {}) {
  try {
    const {
      limit = 20,
      skip = 0,
      unreadOnly = false
    } = options;

    const query = { recipient: userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('order', 'status totalAmount')
      .populate('hub', 'name district')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return notifications;
  } catch (error) {
    console.error('❌ Error getting user notifications:', error);
    return [];
  }
}

/**
 * Mark notification as read
 * @param {String} notificationId - The notification ID
 * @param {String} userId - The user's MongoDB _id (for security)
 */
export async function markNotificationAsRead(notificationId, userId) {
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return { success: false, message: 'Notification not found' };
    }

    await notification.markAsRead();
    return { success: true, notification };
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Mark all notifications as read for a user
 * @param {String} userId - The user's MongoDB _id
 */
export async function markAllAsRead(userId) {
  try {
    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return { success: true, modifiedCount: result.modifiedCount };
  } catch (error) {
    console.error('❌ Error marking all as read:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Delete old read notifications (cleanup)
 * @param {Number} daysOld - Delete notifications older than this many days
 */
export async function deleteOldNotifications(daysOld = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Notification.deleteMany({
      isRead: true,
      readAt: { $lt: cutoffDate }
    });

    console.log(`🗑️ Deleted ${result.deletedCount} old notifications`);
    return result.deletedCount;
  } catch (error) {
    console.error('❌ Error deleting old notifications:', error);
    return 0;
  }
}

/**
 * Create a notification for admin when restock is needed
 * @param {Object} restockRequest - The restock request document
 * @param {Object} hub - The requesting hub
 * @param {Object} product - The product that needs restocking
 */
export async function createRestockRequestNotification(restockRequest, hub, product) {
  try {
    // Find all admins
    const admins = await User.find({ role: 'admin' });

    if (admins.length === 0) {
      console.log('⚠️ No admins found for restock notification');
      return [];
    }

    const notifications = [];

    for (const admin of admins) {
      const notification = await Notification.create({
        recipient: admin._id,
        type: 'RESTOCK_REQUEST',
        title: `🔴 Restock Request - ${hub.district}`,
        message: `${hub.name} needs ${restockRequest.requestedQuantity} units of "${product.name}". Priority: ${restockRequest.priority}`,
        hub: hub._id,
        isRead: false,
        metadata: {
          restockRequestId: restockRequest._id.toString(),
          hubName: hub.name,
          district: hub.district,
          productId: product._id.toString(),
          productName: product.name,
          quantity: restockRequest.requestedQuantity,
          priority: restockRequest.priority,
          reason: restockRequest.reason
        }
      });

      notifications.push(notification);
    }

    console.log(`✅ Created ${notifications.length} restock request notifications for admins`);
    return notifications;
  } catch (error) {
    console.error('❌ Error creating restock request notification:', error);
    return [];
  }
}

/**
 * Delete a specific notification
 * @param {String} notificationId - The notification ID
 * @param {String} userId - The user's MongoDB _id (for security)
 */
export async function deleteNotification(notificationId, userId) {
  try {
    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!result) {
      return { success: false, message: 'Notification not found or unauthorized' };
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Create a notification for customer when order is dispatched
 * @param {Object} order - The order document
 */
export async function createOrderDispatchedNotification(order) {
  try {
    if (!order.user) {
      console.log('⚠️ Order has no user, cannot create notification');
      return null;
    }

    const notification = await Notification.create({
      recipient: order.user._id || order.user,
      type: 'ORDER_DISPATCHED',
      title: 'Order Dispatched',
      message: `Your order #${order._id.toString().substring(0, 8)} has been dispatched and is on the way!`,
      order: order._id,
      isRead: false,
      metadata: {
        orderId: order._id.toString(),
        orderStatus: order.status,
        totalAmount: order.totalAmount
      }
    });

    console.log(`✅ Created dispatch notification for customer order ${order._id}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating dispatch notification:', error);
    return null;
  }
}

/**
 * Create a notification for customer when order is ready for collection
 * @param {Object} order - The order document
 * @param {Object} hub - The hub where order is ready
 */
export async function createOrderReadyNotification(order, hub) {
  try {
    if (!order.user) {
      console.log('⚠️ Order has no user, cannot create notification');
      return null;
    }

    const notification = await Notification.create({
      recipient: order.user._id || order.user,
      type: 'ORDER_READY',
      title: 'Order Ready for Collection',
      message: `Your order #${order._id.toString().substring(0, 8)} is ready for collection at ${hub.name}!`,
      order: order._id,
      hub: hub._id,
      isRead: false,
      metadata: {
        orderId: order._id.toString(),
        orderStatus: order.status,
        totalAmount: order.totalAmount,
        hubName: hub.name,
        hubAddress: hub.address
      }
    });

    console.log(`✅ Created ready notification for customer order ${order._id}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating ready notification:', error);
    return null;
  }
}

/**
 * Create a notification for customer when order is delivered
 * @param {Object} order - The order document
 */
export async function createOrderDeliveredNotification(order) {
  try {
    if (!order.user) {
      console.log('⚠️ Order has no user, cannot create notification');
      return null;
    }

    const notification = await Notification.create({
      recipient: order.user._id || order.user,
      type: 'ORDER_DELIVERED',
      title: 'Order Delivered Successfully',
      message: `Your order #${order._id.toString().substring(0, 8)} has been delivered successfully!`,
      order: order._id,
      isRead: false,
      metadata: {
        orderId: order._id.toString(),
        orderStatus: order.status,
        totalAmount: order.totalAmount
      }
    });

    console.log(`✅ Created delivery notification for customer order ${order._id}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating delivery notification:', error);
    return null;
  }
}
