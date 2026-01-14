import express from 'express';
import asyncHandler from 'express-async-handler';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification
} from '../services/notificationService.js';

const router = express.Router();
router.use(requireAuth);

// Get all notifications for the logged-in user
router.get('/', asyncHandler(async (req, res) => {
  const firebaseUid = req.user.uid;
  const { limit = 20, skip = 0, unreadOnly = false } = req.query;

  // Get user document by Firebase UID to get MongoDB _id
  const user = await User.findOne({ firebaseUid });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const notifications = await getUserNotifications(user._id, {
    limit: parseInt(limit),
    skip: parseInt(skip),
    unreadOnly: unreadOnly === 'true'
  });

  res.json(notifications);
}));

// Get unread notification count
router.get('/unread-count', asyncHandler(async (req, res) => {
  const firebaseUid = req.user.uid;

  const user = await User.findOne({ firebaseUid });
  if (!user) {
    return res.status(404).json({ message: 'User not found', count: 0 });
  }

  const count = await getUnreadCount(user._id);
  res.json({ count });
}));

// Mark a specific notification as read
router.patch('/:notificationId/read', asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const firebaseUid = req.user.uid;

  const user = await User.findOne({ firebaseUid });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const result = await markNotificationAsRead(notificationId, user._id);
  
  if (!result.success) {
    return res.status(404).json({ message: result.message });
  }

  res.json(result.notification);
}));

// Mark all notifications as read
router.patch('/read-all', asyncHandler(async (req, res) => {
  const firebaseUid = req.user.uid;

  const user = await User.findOne({ firebaseUid });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const result = await markAllAsRead(user._id);
  
  if (!result.success) {
    return res.status(400).json({ message: result.message });
  }

  res.json({ message: 'All notifications marked as read', count: result.modifiedCount });
}));

// Delete a specific notification
router.delete('/:notificationId', asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const firebaseUid = req.user.uid;

  const user = await User.findOne({ firebaseUid });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const result = await deleteNotification(notificationId, user._id);
  
  if (!result.success) {
    return res.status(404).json({ message: result.message });
  }

  res.json({ message: 'Notification deleted successfully' });
}));

export default router;
