const { History, View } = require('../../infrastructure/database');
const { fetchFromAPI } = require('../../infrastructure/cache');
const PHIMAPI_BASE_URL = "https://phimapi.com";

class HistoryService {
    async getHistory(req, res) {
        try {
            const { userId } = req.params;
            // Auth check handled by middleware ownership check
            
            const history = await History.findAll({ 
                where: { userId },
                order: [['watchedAt', 'DESC']]
            });
            
            const detailedHistory = await Promise.all(history.map(async (item) => {
                if (item.title) {
                    return {
                        name: item.title,
                        slug: item.movieId,
                        origin_name: item.title,
                        poster_url: item.poster_path,
                        thumb_url: item.poster_path,
                        year: parseInt(item.release_date) || 0,
                        watchedAt: item.watchedAt,
                        durationWatched: item.durationWatched,
                        progress: item.progress,
                        durationTotal: item.durationTotal,
                        lastEpisodeSlug: item.lastEpisodeSlug,
                        lastEpisodeName: item.lastEpisodeName
                    };
                }
                // Fallback for legacy data without titles in DB
                try {
                    const data = await fetchFromAPI(`${PHIMAPI_BASE_URL}/phim/${item.movieId}`);
                    if (data.status && data.movie) {
                         // Lazy update skipped for brevity
                         return { 
                          ...data.movie, 
                          watchedAt: item.watchedAt, 
                          durationWatched: item.durationWatched,
                          progress: item.progress,
                          durationTotal: item.durationTotal,
                          lastEpisodeSlug: item.lastEpisodeSlug,
                          lastEpisodeName: item.lastEpisodeName
                        };
                    }
                    return null;
                } catch (e) { return null; }
            }));

            res.json(detailedHistory.filter(Boolean));
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch history" });
        }
    }

    async saveHistory(req, res) {
        try {
            const { 
              userId, movieId, duration, progress, durationTotal, 
              episodeSlug, episodeName,
              title, poster_path, backdrop_path, release_date
            } = req.body;
        
            if (!userId || !movieId) return res.status(400).json({ error: "Missing data" });
            if (req.user.id != userId) return res.sendStatus(403);
        
            const existingEntry = await History.findOne({ where: { userId, movieId } });
            
            if (existingEntry) {
              existingEntry.watchedAt = new Date();
              existingEntry.durationWatched = (existingEntry.durationWatched || 0) + (duration || 0);
              if (progress !== undefined) existingEntry.progress = progress;
              if (durationTotal !== undefined) existingEntry.durationTotal = durationTotal;
              if (episodeSlug) existingEntry.lastEpisodeSlug = episodeSlug;
              if (episodeName) existingEntry.lastEpisodeName = episodeName;
              if (title) existingEntry.title = title;
              if (poster_path) existingEntry.poster_path = poster_path;
              if (backdrop_path) existingEntry.backdrop_path = backdrop_path;
              if (release_date) existingEntry.release_date = release_date;
              await existingEntry.save();
            } else {
              await History.create({
                userId, movieId, durationWatched: duration || 0, progress: progress || 0,
                durationTotal: durationTotal || 0, lastEpisodeSlug: episodeSlug,
                lastEpisodeName: episodeName, title, poster_path, backdrop_path, release_date,
                watchedAt: new Date()
              });
            }
        
            const [view, created] = await View.findOrCreate({ where: { movieId }, defaults: { count: 0 } });
            await view.increment('count');
        
            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to save history" });
        }
    }

    async getProgress(req, res) {
        try {
            const { movieId } = req.params;
            const userId = req.user.id;
        
            const entry = await History.findOne({ where: { userId, movieId } });
            if (entry) {
              res.json({ 
                progress: entry.progress,
                lastEpisodeSlug: entry.lastEpisodeSlug,
                lastEpisodeName: entry.lastEpisodeName
              });
            } else {
              res.json({ progress: 0, lastEpisodeSlug: null });
            }
        } catch (error) {
            res.status(500).json({ error: "Failed to get progress" });
        }
    }

    async deleteItem(req, res) {
        try {
            const { movieId } = req.params;
            const userId = req.user.id;
            await History.destroy({ where: { userId, movieId } });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed to delete history item" });
        }
    }

    async clearHistory(req, res) {
        try {
            const userId = req.user.id;
            await History.destroy({ where: { userId } });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed to clear history" });
        }
    }
}

module.exports = HistoryService;
