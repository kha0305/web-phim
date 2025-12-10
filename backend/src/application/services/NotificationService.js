const { Notification, NotificationRead } = require('../../infrastructure/database');
const { Op } = require('sequelize');

class NotificationService {
    async getNotifications(req, res) {
        try {
            const userId = req.user.id;
            const notifications = await Notification.findAll({
              where: { [Op.or]: [{ userId }, { userId: null }] },
              order: [['createdAt', 'DESC']],
              limit: 50
            });
        
            let readIds = new Set();
            try {
              const readRecords = await NotificationRead.findAll({
                where: { userId },
                attributes: ['notificationId']
              });
              readIds = new Set(readRecords.map(r => r.notificationId));
            } catch (dbError) {
               // Ignore
            }
        
            const result = notifications.map(n => {
              const isRead = n.userId ? n.isRead : readIds.has(n.id);
              return { ...n.toJSON(), isRead };
            });
        
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch notifications" });
        }
    }

    async markAllAsRead(req, res) {
        try {
            const userId = req.user.id;
            await Notification.update({ isRead: true }, { where: { userId, isRead: false } });
            const systemNotifs = await Notification.findAll({ where: { userId: null } });
            for (const n of systemNotifs) {
                await NotificationRead.findOrCreate({ where: { userId, notificationId: n.id } });
            }
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed to mark all as read" });
        }
    }

    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const notification = await Notification.findOne({ where: { id } });
            if (!notification) return res.status(404).json({ error: "Not found" });
        
            if (notification.userId === userId) {
                notification.isRead = true;
                await notification.save();
            } else if (notification.userId === null) {
                await NotificationRead.findOrCreate({ where: { userId, notificationId: id } });
            }
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed to update notification" });
        }
    }
}

module.exports = NotificationService;
