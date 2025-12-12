const { fetchFromAPI } = require('../../infrastructure/cache');
const { View } = require('../../infrastructure/database');

// User requested KKPhim, which documentation points to PhimAPI.com
const KKPHIM_BASE_URL = "https://phimapi.com";
const IPHIM_BASE_URL = "https://iphim.cc/api/films"; // Backup

let popularCache = { data: null, timestamp: 0 };
let topViewedCache = { data: null, timestamp: 0 };

// Helper: Clean raw movie data
const cleanMovie = (movie) => {
    if (!movie) return null;
    
    // 1. Clean Title
    let cleanName = movie.name || movie.title || movie.origin_name || 'Unknown';
    cleanName = cleanName
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '')
        .replace(/- Tập \d+.*$/, '')
        .trim();

    // 2. Extract Year 
    let year = movie.year;
    if (!year && movie.category && Array.isArray(movie.category)) {
        const yearCat = movie.category.find(c => c.name && /(?:Năm\s+)?(\d{4})/.test(c.name));
        if (yearCat) {
             const match = yearCat.name.match(/(?:Năm\s+)?(\d{4})/);
             if (match) year = match[1];
        }
    }
    if (!year) {
         const nameYear = (movie.name || '').match(/\((\d{4})\)/);
         if (nameYear) year = nameYear[1];
         else {
             const originYear = (movie.origin_name || '').match(/\b(\d{4})\b/);
             if (originYear) year = originYear[1];
         }
    }

    return {
        ...movie,
        original_name: movie.origin_name || movie.original_name, 
        clean_name: cleanName,
        poster_url: movie.poster_url || movie.thumb_url || '',
        thumb_url: movie.thumb_url || movie.poster_url || '',
        year: year || '', 
    };
};

class MovieService {
    async getGenres(req, res) {
        try { res.json(await fetchFromAPI(`${KKPHIM_BASE_URL}/the-loai`, { ttl: 86400000 })); }
        catch (e) { res.status(500).json({ error: "Error" }); }
    }
    
    async getCountries(req, res) {
        try { res.json(await fetchFromAPI(`${KKPHIM_BASE_URL}/quoc-gia`, { ttl: 86400000 })); }
        catch (e) { res.status(500).json({ error: "Error" }); }
    }

    async getMoviesByGenre(req, res) {
        try { 
            // PhimAPI uses /v1/api/the-loai
            const data = await fetchFromAPI(`${KKPHIM_BASE_URL}/v1/api/the-loai/${req.params.slug}?page=${req.query.page||1}`);
            // Structure is data.data.items usually for v1, or just data.items?
            // Test showed data.items for /danh-sach but /v1/api/the-loai return might be wrapped.
            // Let's handle both.
            let items = data.items || (data.data && data.data.items) || [];
            if (items) items = items.map(cleanMovie);
            res.json({ ...data, items }); 
        }
        catch (e) { res.status(500).json({ error: "Error" }); }
    }

    async getMoviesByCountry(req, res) {
        try { 
             const data = await fetchFromAPI(`${KKPHIM_BASE_URL}/v1/api/quoc-gia/${req.params.slug}?page=${req.query.page||1}`);
             let items = data.items || (data.data && data.data.items) || [];
             if (items) items = items.map(cleanMovie);
             res.json({ ...data, items });
        }
        catch (e) { res.status(500).json({ error: "Error" }); }
    }
    
    async getMoviesByYear(req, res) {
        try { 
            // Fallback to IPHIM for year if PhimAPI fails
            const data = await fetchFromAPI(`${IPHIM_BASE_URL}/nam-phat-hanh/${req.params.year}?page=${req.query.page||1}`);
            if (data.items) data.items = data.items.map(cleanMovie);
            res.json(data);
        }
        catch (e) { res.json({ title: "Movies", items: [] }); } 
    }

    async getPopular(req, res) {
        const page = req.query.page || 1;
        if (page == 1 && popularCache.data && (Date.now() - popularCache.timestamp < 1800000)) return res.json(popularCache.data);
        try {
            // /danh-sach/phim-moi-cap-nhat works at root
            const data = await fetchFromAPI(`${KKPHIM_BASE_URL}/danh-sach/phim-moi-cap-nhat?page=${page}`);
            
            if (data.items) {
                data.items = data.items
                    .map(cleanMovie)
                    .filter(m => m.poster_url && !m.poster_url.includes('not-found'));
            }

            if (page == 1 && data.items) popularCache = { data, timestamp: Date.now() };
            res.json(data);
        } catch (e) { res.status(500).json({ error: "Error" }); }
    }

    async getTopViewed(req, res) {
        if (topViewedCache.data && (Date.now() - topViewedCache.timestamp < 3600000)) return res.json(topViewedCache.data);
        try {
            const topViews = await View.findAll({ order: [['count', 'DESC']], limit: 12 });
            const movies = await Promise.all(topViews.map(async (v) => {
                try {
                    const d = await fetchFromAPI(`${KKPHIM_BASE_URL}/phim/${v.movieId}`, { timeout: 2000 });
                    return d.status ? { ...cleanMovie(d.movie), viewCount: v.count } : null;
                } catch { return null; }
            }));
            const result = movies.filter(Boolean).slice(0, 10);
            topViewedCache = { data: result, timestamp: Date.now() };
            res.json(result);
        } catch (e) { res.status(500).json({ error: "Error" }); }
    }

    async getMoviesByList(req, res) {
        try { 
            const data = await fetchFromAPI(`${KKPHIM_BASE_URL}/danh-sach/${req.params.listSlug}?page=${req.query.page||1}`);
            if(data.items) data.items = data.items.map(cleanMovie);
            res.json(data);
        }
        catch (e) { res.status(500).json({ error: "Error" }); }
    }

    async searchMovies(req, res) {
        let query = req.query.query;
        if (!query) return res.json({ items: [] });
        
        try { 
            // PhimAPI Search: /v1/api/tim-kiem?keyword=...
            let data = await fetchFromAPI(`${KKPHIM_BASE_URL}/v1/api/tim-kiem?keyword=${query}`, { ttl: 1800000 });
            let items = data.data && data.data.items ? data.data.items : (data.items || []);
            
            // Check for image domain in search response
            const imgDomain = data.data && data.data.APP_DOMAIN_CDN_IMAGE ? data.data.APP_DOMAIN_CDN_IMAGE : "";
            
            items = items.map(m => {
                let cm = cleanMovie(m);
                // Search sometimes returns relative paths or full
                if(imgDomain && cm.poster_url && !cm.poster_url.startsWith('http')) {
                    cm.poster_url = `${imgDomain}/${cm.poster_url}`;
                }
                if(imgDomain && cm.thumb_url && !cm.thumb_url.startsWith('http')) {
                    cm.thumb_url = `${imgDomain}/${cm.thumb_url}`;
                }
                return cm;
            });

            res.json({ ...data, items }); 
        }
        catch (e) { res.status(500).json({ error: "Error" }); }
    }

    async getRecommendations(req, res) {
        try {
            let { genres } = req.body; 
            if (!genres || genres.length === 0) genres = ['hanh-dong'];
            const randomGenre = genres[Math.floor(Math.random() * genres.length)];
            
            const data = await fetchFromAPI(`${KKPHIM_BASE_URL}/v1/api/the-loai/${randomGenre}`);
             let items = data.data && data.data.items ? data.data.items : (data.items || []);

            if (items.length > 0) {
                // Shuffle
                for (let i = items.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [items[i], items[j]] = [items[j], items[i]];
                }
                const cleanItems = items.map(cleanMovie).slice(0, 12);
                return res.json({ items: cleanItems, source_genre: randomGenre });
            }
            res.json({ items: [] });
        } catch (error) {
            console.error("Smart Recommend Failed", error);
            res.json({ items: [] });
        }
    }

    async getDetail(req, res) {
        const { slug } = req.params;
        res.setHeader('Cache-Control', 'public, max-age=300'); 

        const sources = [
            { url: `${KKPHIM_BASE_URL}/phim/${slug}`, name: "KKPHIM" },
            { url: `${IPHIM_BASE_URL}/phim/${slug}`, name: "IPHIM" },
        ];

        try {
            const winner = await Promise.any(sources.map(src => {
                return fetchFromAPI(src.url, { timeout: 3000 })
                    .then(data => {
                        if (!data || (!data.movie && !data.status)) throw new Error("Invalid");
                        return data;
                    });
            }));
            
            const rawMovie = winner.movie || winner;
            const clean = cleanMovie(rawMovie);

            const movieData = { ...clean, episodes: winner.episodes || rawMovie.episodes };
            res.json(movieData);

        } catch (error) {
            console.error(`[MovieDetail] Failed: ${slug}`);
            res.status(404).json({ error: "NotFound" });
        }
    }
}

module.exports = MovieService;
