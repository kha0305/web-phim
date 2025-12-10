const { User, Comment, View, Notification } = require('../../infrastructure/database');

class AdminService {
    async getStats(req, res) {
        try {
            const userCount = await User.count();
            const commentCount = await Comment.count();
            const viewCount = await View.sum('count') || 0;
            const topViews = await View.findAll({ order: [['count', 'DESC']], limit: 5 });
        
            res.json({ userCount, commentCount, viewCount, topViews });
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch stats" });
        }
    }

    async sendNotification(req, res) {
        try {
            const { title, message, userId } = req.body;
            await Notification.create({
                userId: userId || null,
                title,
                message,
                type: 'system'
            });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed to send notification" });
        }
    }

    async deleteComment(req, res) {
        try {
            const { id } = req.params;
            await Comment.destroy({ where: { id } });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed to delete comment" });
        }
    }
}

module.exports = AdminService;
