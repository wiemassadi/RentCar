const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authAny = require('../middlewares/auth.middleware');

// Routes pour tous les types d'utilisateurs (avec leurs middlewares respectifs)
router.get('/me', authAny, notificationController.getMyNotifications);
router.get('/unread-count', authAny, notificationController.getUnreadCount);
router.put('/:id/read', authAny, notificationController.markAsRead);
router.put('/mark-all-read', authAny, notificationController.markAllAsRead);
router.delete('/:id', authAny, notificationController.deleteNotification);

module.exports = router;
