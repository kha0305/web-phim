const { User, Comment, View, Notification, History } = require('../../infrastructure/database');
const { Op } = require('sequelize');
const { fetchFromAPI } = require('../../infrastructure/cache');

const KKPHIM_BASE_URL = "https://phimapi.com";

// Helper matches MovieService
const cleanMovieSimple = (movie) => {
    if (!movie) return { name: 'Unknown', year: 'N/A' };
    let cleanName = movie.name || movie.title || movie.origin_name || 'Unknown';
    cleanName = cleanName
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '')
        .replace(/- Tập \d+.*$/, '')
        .trim();
    
    let year = movie.year;
    // Attempt to extract year from category if missing
    if (!year && movie.category && Array.isArray(movie.category)) {
         const yearCat = movie.category.find(c => c.name && /(?:Năm\s+)?(\d{4})/.test(c.name));
         if (yearCat) year = yearCat.name.match(/(?:Năm\s+)?(\d{4})/)[1];
    }
    // Fallback regex on name
    if (!year) {
        const match = cleanName.match(/\((\d{4})\)/);
        if (match) year = match[1];
    }
    
    return { 
        name: cleanName, 
        year: year || 'N/A', 
        poster_url: movie.poster_url || movie.thumb_url 
    };
};
// ... rest of class ...
class AdminService {
    // ... stats methods ...
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
                limit: 100 // Limit to top 100
            });
            
            // Enrich with details from API
            const enriched = await Promise.all(views.map(async (v) => {
                try {
                    const info = await fetchFromAPI(`${KKPHIM_BASE_URL}/phim/${v.movieId}`, { ttl: 7200000 }); // Cache 2h
                    const details = cleanMovieSimple(info.movie || info);
                    return { ...v.toJSON(), ...details };
                } catch (e) {
                    return { ...v.toJSON(), name: 'Unknown', year: 'N/A' };
                }
            }));
            
            res.json(enriched);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to fetch movies" });
        }
    }
}

module.exports = AdminService;
