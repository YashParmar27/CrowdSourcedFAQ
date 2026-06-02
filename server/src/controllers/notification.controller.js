import Notification from '../models/Notification.js';

export const getMyNotifications = async (req, res) => {
  try {
    const { limit = 50, offset = 0, unreadOnly } = req.query;
    const filter = { user_id: req.user._id };
    
    if (unreadOnly === 'true') {
      filter.is_read = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ created_at: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit)),
      Notification.countDocuments({ user_id: req.user._id, is_read: false })
    ]);

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user_id: req.user._id },
      { is_read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user_id: req.user._id, is_read: false },
      { is_read: true }
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createNotification = async (userId, email, type, title, message, metadata = {}) => {
  try {
    const notification = new Notification({
      user_id: userId,
      email,
      type,
      title,
      message,
      metadata
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Notification creation failed:', error.message);
    return null;
  }
};