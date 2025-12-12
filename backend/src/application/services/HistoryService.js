const { History } = require('../../infrastructure/database');
const { fetchFromAPI } = require('../../infrastructure/cache');

const KKPHIM_BASE_URL = "https://phimapi.com";

class HistoryService {
    async getHistory(req, res) {
        try {
            const userId = req.user.id;
            const history = await History.findAll({ 
                where: { userId },
                order: [['watchedAt', 'DESC']]
            });

            // Fetch details
            const movies = await Promise.all(history.map(async (item) => {
                try {
                    // Cache duration should be short or use memory
                    const data = await fetchFromAPI(`${KKPHIM_BASE_URL}/phim/${item.movieId}`);
                    if (!data || !data.movie) return null;
                    return {
                        ...data.movie,
                        progress: item.progress,
                        durationTotal: item.duration,
                        lastEpisodeName: item.episodeName, // e.g. "Tập 1"
                        watchedAt: item.watchedAt
                    };
                } catch (e) { return null; }
            }));

            res.json(movies.filter(Boolean));
        } catch (error) {
            res.status(500).json({ error: "Failed" });
        }
    }

    async saveHistory(req, res) {
        try {
            const userId = req.user.id;
            const { movieId, progress, duration, episodeName } = req.body;

            // Upsert
            const [record, created] = await History.findOrCreate({
                where: { userId, movieId },
                defaults: { progress, duration, episodeName, watchedAt: new Date() }
            });

            if (!created) {
                record.progress = progress;
                record.duration = duration;
                record.episodeName = episodeName;
                record.watchedAt = new Date();
                await record.save();
            }

            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed" });
        }
    }
    
    async removeHistory(req, res) {
        try {
            const userId = req.user.id;
            const { movieId } = req.params;
            await History.destroy({ where: { userId, movieId } });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed" });
        }
    }
}

module.exports = HistoryService;
