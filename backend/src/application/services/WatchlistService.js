const { Watchlist } = require('../../infrastructure/database');
const { fetchFromAPI } = require('../../infrastructure/cache');
const PHIMAPI_BASE_URL = "https://phimapi.com";

class WatchlistService {
    async getWatchlist(req, res) {
        try {
            const { userId } = req.params;
            const watchlist = await Watchlist.findAll({
                where: { userId },
                order: [['addedAt', 'DESC']]
            });
            
            const detailedWatchlist = await Promise.all(watchlist.map(async (item) => {
                try {
                    const data = await fetchFromAPI(`${PHIMAPI_BASE_URL}/phim/${item.movieId}`);
                    if (data.status && data.movie) {
                        return { ...data.movie, addedAt: item.addedAt };
                    }
                    return null;
                } catch (e) { return null; }
            }));

            res.json(detailedWatchlist.filter(Boolean));
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch watchlist" });
        }
    }

    async checkWatchlist(req, res) {
        try {
            const { movieId } = req.params;
            const userId = req.user.id;
            const entry = await Watchlist.findOne({ where: { userId, movieId } });
            res.json({ inWatchlist: !!entry });
        } catch (error) {
            res.status(500).json({ error: "Failed to check watchlist" });
        }
    }

    async addToWatchlist(req, res) {
         try {
             const { movieId } = req.body;
             const userId = req.user.id;
             await Watchlist.findOrCreate({ where: { userId, movieId } });
             res.json({ success: true });
         } catch (error) {
             res.status(500).json({ error: "Failed to add" });
         }
    }

    async removeFromWatchlist(req, res) {
        try {
            const { movieId } = req.params;
            const userId = req.user.id;
            await Watchlist.destroy({ where: { userId, movieId } });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed to remove" });
        }
    }
}

module.exports = WatchlistService;
