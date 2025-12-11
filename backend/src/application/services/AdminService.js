const { User, Comment, View, Notification, History } = require('../../infrastructure/database');
const { Op } = require('sequelize');

class AdminService {
    async getStats(req, res) {
        try {
            const userCount = await User.count();
            const commentCount = await Comment.count();
            const viewCount = await View.sum('count') || 0;
            const topViews = await View.findAll({ order: [['count', 'DESC']], limit: 5 });

             // Chart Data: Last 7 days
             const chartData = [];
             const today = new Date();
             for (let i = 6; i >= 0; i--) {
                 const date = new Date(today);
                 date.setDate(date.getDate() - i);
                 const startOfDay = new Date(date.setHours(0,0,0,0));
                 const endOfDay = new Date(date.setHours(23,59,59,999));
                 
                 const userCnt = await User.count({
                     where: {
                         createdAt: {
                             [Op.between]: [startOfDay, endOfDay]
                         }
                     }
                 });
                 
                 // Views from members (History)
                  const historyCnt = await History.count({
                     where: {
                         watchedAt: {
                             [Op.between]: [startOfDay, endOfDay]
                         }
                     }
                 });
 
                 chartData.push({
                     name: startOfDay.toLocaleDateString('en-US', {weekday: 'short'}),
                     users: userCnt,
                     views: historyCnt
                 });
             }
        
            res.json({ userCount, commentCount, viewCount, topViews, chartData });
        } catch (error) {
            console.error(error);
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

    async getUsers(req, res) {
        try {
            const users = await User.findAll({
                attributes: ['id', 'username', 'email', 'role', 'createdAt', 'avatar'],
                order: [['createdAt', 'DESC']]
            });
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch users" });
        }
    }

    async getMovies(req, res) {
        try {
             // Get movies sorted by views
            const views = await View.findAll({
                order: [['count', 'DESC']],
                limit: 100 // Limit to top 100 for now
            });
            // We might enrich this with History data for titles if View doesn't have it.
            // But View model currently only has movieId and count.
            // Let's return what we have. Frontend can potentially fetch details or we enhance View model later.
            res.json(views);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch movies" });
        }
    }
}

module.exports = AdminService;
