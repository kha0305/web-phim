const { Watchlist } = require('../../infrastructure/database');
const { fetchFromAPI } = require('../../infrastructure/cache');

const KKPHIM_BASE_URL = "https://phimapi.com";

class WatchlistService {
    async getWatchlist(req, res) {
        try {
            const userId = req.user.id;
            const list = await Watchlist.findAll({ 
                where: { userId },
                order: [['createdAt', 'DESC']]
            });

            // Fetch details for each (Parallel)
            const movies = await Promise.all(list.map(async (item) => {
                try {
                    const data = await fetchFromAPI(`${KKPHIM_BASE_URL}/phim/${item.movieId}`);
                    if (!data || !data.movie) return null;
                    return {
                        ...data.movie,
                        addedAt: item.createdAt
                    };
                } catch (e) { return null; }
            }));

            res.json(movies.filter(Boolean));
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed" });
        }
    }

    async addToWatchlist(req, res) {
        try {
            const userId = req.user.id;
            const { movieId } = req.body;
            if (!movieId) return res.status(400).json({ error: "Missing movieId" });
            
            await Watchlist.findOrCreate({ where: { userId, movieId } });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed" });
        }
    }

    async removeFromWatchlist(req, res) {
        try {
            const userId = req.user.id;
            const { movieId } = req.params;
            
            await Watchlist.destroy({ where: { userId, movieId } });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed" });
        }
    }
    
    async checkStatus(req, res) {
        try {
             const userId = req.user.id;
             const { movieId } = req.params;
             const exists = await Watchlist.findOne({ where: { userId, movieId } });
             res.json({ isFavorite: !!exists });
        } catch (error) {
             res.status(500).json({ error: "Error" });
        }
    }
}

module.exports = WatchlistService;
