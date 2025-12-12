const { fetchFromAPI } = require('../../infrastructure/cache');
const { View } = require('../../infrastructure/database');

const KKPHIM_BASE_URL = "https://kkphim.vip";
const KKPHIM_BACKUP_URL = "https://kkphim1.com";
const PHIMAPI_BASE_URL = "https://phimapi.com";
const OPHIM_BASE_URL = "https://ophim1.com/phim";
const NGUONC_BASE_URL = "https://phim.nguonc.com/api/film";

let popularCache = { data: null, timestamp: 0 };
let topViewedCache = { data: null, timestamp: 0 };

// Helper: Clean raw movie data
const cleanMovie = (movie) => {
    if (!movie) return null;
    
    // 1. Clean Title (Remove [HD], (2024), etc.)
    let cleanName = movie.name || movie.title || movie.origin_name;
    cleanName = cleanName
        .replace(/\[.*?\]/g, '') // Remove [HD]
        .replace(/\(.*?\)/g, '') // Remove (2024)
        .replace(/- Tập \d+.*$/, '') // Remove - Tập 1...
        .trim();

    // 2. Extract Year Smartly
    let year = movie.year;
    if (!year && movie.category && Array.isArray(movie.category)) {
        const yearCat = movie.category.find(c => c.name && /(?:Năm\s+)?(\d{4})/.test(c.name));
        if (yearCat) {
             const match = yearCat.name.match(/(?:Năm\s+)?(\d{4})/);
             if (match) year = match[1];
        }
    }
    if (!year) {
         // Try regex on title or original name
         const nameYear = (movie.name || '').match(/\((\d{4})\)/);
         if (nameYear) year = nameYear[1];
         else {
             const originYear = (movie.origin_name || '').match(/\b(\d{4})\b/);
             if (originYear) year = originYear[1];
         }
    }

    return {
        ...movie,
        original_name: movie.origin_name || movie.original_name, // Keep ref
        clean_name: cleanName, // Smart title
        // Ensure poster is never null
        poster_url: movie.poster_url || movie.thumb_url || '',
        thumb_url: movie.thumb_url || movie.poster_url || '',
        year: year || '', 
    };
};

class MovieService {
    async getGenres(req, res) {
        try { res.json(await fetchFromAPI(`${KKPHIM_BASE_URL}/the-loai`, { ttl: 86400000 })); } // Cache 24h
        catch (e) { res.status(500).json({ error: "Error" }); }
    }
    
    async getCountries(req, res) {
        try { res.json(await fetchFromAPI(`${KKPHIM_BASE_URL}/quoc-gia`, { ttl: 86400000 })); }
        catch (e) { res.status(500).json({ error: "Error" }); }
    }

    async getMoviesByGenre(req, res) {
        try { 
            const data = await fetchFromAPI(`${KKPHIM_BASE_URL}/the-loai/${req.params.slug}?page=${req.query.page||1}`);
            if (data.items) data.items = data.items.map(cleanMovie);
            res.json(data); 
        }
        catch (e) { res.status(500).json({ error: "Error" }); }
    }

    async getMoviesByCountry(req, res) {
        try { 
            const data = await fetchFromAPI(`${KKPHIM_BASE_URL}/quoc-gia/${req.params.slug}?page=${req.query.page||1}`);
            if (data.items) data.items = data.items.map(cleanMovie);
            res.json(data);
        }
        catch (e) { res.status(500).json({ error: "Error" }); }
    }
    
    async getMoviesByYear(req, res) {
        try { 
            const data = await fetchFromAPI(`${KKPHIM_BASE_URL}/nam-phat-hanh/${req.params.year}?page=${req.query.page||1}`);
            if (data.items) data.items = data.items.map(cleanMovie);
            res.json(data);
        }
        catch (e) { res.json({ title: "Movies", items: [] }); } 
    }

    async getPopular(req, res) {
        const page = req.query.page || 1;
        if (page == 1 && popularCache.data && (Date.now() - popularCache.timestamp < 1800000)) return res.json(popularCache.data);
        try {
            // Standard Ophim/PhimApi structure usually has /danh-sach/phim-moi-cap-nhat
            const data = await fetchFromAPI(`${KKPHIM_BASE_URL}/danh-sach/phim-moi-cap-nhat?page=${page}`);
            
            // Smart Filter: Remove items with no images or weird names
            if (data.items) {
                data.items = data.items
                    .map(cleanMovie)
                    .filter(m => m.poster_url && !m.poster_url.includes('not-found')); // Filter bad data
            }

            if (page == 1) popularCache = { data, timestamp: Date.now() };
            res.json(data);
        } catch (e) { res.status(500).json({ error: "Error" }); }
    }

    async getTopViewed(req, res) {
        if (topViewedCache.data && (Date.now() - topViewedCache.timestamp < 3600000)) return res.json(topViewedCache.data);
        try {
            const topViews = await View.findAll({ order: [['count', 'DESC']], limit: 12 }); // Get 12 to have buffer
            const movies = await Promise.all(topViews.map(async (v) => {
                try {
                    const d = await fetchFromAPI(`${KKPHIM_BASE_URL}/phim/${v.movieId}`, { timeout: 2000 });
                    return d.status ? { ...cleanMovie(d.movie), viewCount: v.count } : null;
                } catch { return null; }
            }));
            const result = movies.filter(Boolean).slice(0, 10); // Return top 10 valid
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
            // 1. Standard Search
            let data = await fetchFromAPI(`${KKPHIM_BASE_URL}/tim-kiem?keyword=${query}`, { ttl: 1800000 });
            
            // 2. Smart Fallback: If no results, try removing spaces for short keywords or trying English?
            // Actually, removing spaces is risky. Let's just return what we have but cleaned.
            
            if (data.items) data.items = data.items.map(cleanMovie);
            res.json(data); 
        }
        catch (e) { res.status(500).json({ error: "Error" }); }
    }

    // --- NEW: SMART RECOMMENDATION ---
    async getRecommendations(req, res) {
        try {
            // Genres can come from analyzing user history in DB, or passed from frontend localstorage
            // Format: ['hanh-dong', 'kinh-di']
            let { genres } = req.body; 

            // If no genres provided, default to 'hanh-dong' (Action) as it's popular
            if (!genres || genres.length === 0) genres = ['hanh-dong'];

            // Pick one random genre to fetch (We can't fetch all at once easily)
            const randomGenre = genres[Math.floor(Math.random() * genres.length)];
            
            // Fetch page 1 of that genre
            const data = await fetchFromAPI(`${KKPHIM_BASE_URL}/the-loai/${randomGenre}`);
            
            if (data && data.items) {
                // Shuffle Array (Fisher-Yates) to make it look "AI generated" and not just list order
                for (let i = data.items.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [data.items[i], data.items[j]] = [data.items[j], data.items[i]];
                }
                
                // Return top 12 clean items
                const cleanItems = data.items.map(cleanMovie).slice(0, 12);
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
        const start = Date.now();
        res.setHeader('Cache-Control', 'public, max-age=300'); 

        const sources = [
            { url: `${KKPHIM_BASE_URL}/phim/${slug}`, name: "KKPHIM" },
            { url: `${KKPHIM_BACKUP_URL}/phim/${slug}`, name: "KKPHIM_BACKUP" },
            { url: `${PHIMAPI_BASE_URL}/phim/${slug}`, name: "PHIMAPI" },
            { url: `${NGUONC_BASE_URL}/${slug}`, name: "NGUONC" },
            { url: `${OPHIM_BASE_URL}/${slug}`, name: "OPHIM" }
        ];

        try {
            const winner = await Promise.any(sources.map(src => {
                return fetchFromAPI(src.url, { timeout: 2500 })
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
