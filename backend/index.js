const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const { User, History, View, Watchlist, sequelize } = require('./models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const IPHIM_BASE_URL = "https://iphim.cc/api/films";
const PHIMAPI_BASE_URL = "https://phimapi.com";
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_this';

// Sync Database
sequelize.sync({ alter: true }).then(() => {
  console.log("Database synced");
}).catch(err => {
  console.error("Failed to sync database:", err);
});

app.use(cors());
app.use(express.json());

// Health Check
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Simple in-memory cache
const apiCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Helper function for API requests with caching
const fetchFromAPI = async (url) => {
  const now = Date.now();
  if (apiCache.has(url)) {
    const { data, timestamp } = apiCache.get(url);
    if (now - timestamp < CACHE_TTL) {
      return data;
    }
    apiCache.delete(url);
  }

  try {
    const response = await axios.get(url);
    apiCache.set(url, { data: response.data, timestamp: now });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    throw error;
  }
};

// --- AUTH ROUTES ---

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing fields" });
    
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, password: hashedPassword });

    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET);

    res.json({ 
      user: { id: newUser.id, username: newUser.username },
      token 
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Register failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);

    res.json({ 
      user: { id: user.id, username: user.username, avatar: user.avatar },
      token 
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ...

// Ensure uploads directory exists
// Ensure uploads directory exists (Only locally)
const uploadDir = path.join(__dirname, 'uploads');
if (!process.env.VERCEL && !fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir);
  } catch (err) {
    console.warn("Could not create uploads directory:", err.message);
  }
}

// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ...

app.put("/api/user/profile", authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.id;

    if (!username) return res.status(400).json({ error: "Username is required" });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.username = username;
    
    if (req.file) {
      // Assuming server runs on localhost:5000 or similar. In production, use full URL or relative path handling in frontend.
      // For now, we store the relative path.
      const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      user.avatar = avatarUrl;
    } else if (req.body.avatarUrl) {
       // Allow updating via URL string if provided (fallback)
       user.avatar = req.body.avatarUrl;
    }
    
    await user.save();

    res.json({ success: true, user: { id: user.id, username: user.username, avatar: user.avatar } });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// --- HISTORY ROUTES ---
app.get("/api/history/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.id != userId) return res.sendStatus(403);

    const history = await History.findAll({ 
      where: { userId },
      order: [['watchedAt', 'DESC']]
    });
    
    const detailedHistory = await Promise.all(history.map(async (item) => {
      try {
        const data = await fetchFromAPI(`${PHIMAPI_BASE_URL}/phim/${item.movieId}`);
        if (data.status && data.movie) {
             return { 
              ...data.movie, 
              watchedAt: item.watchedAt, 
              durationWatched: item.durationWatched 
            };
        }
        return null;
      } catch (e) {
        return null;
      }
    }));

    res.json(detailedHistory.filter(Boolean));
  } catch (error) {
    console.error("History fetch error:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.post("/api/history", authenticateToken, async (req, res) => {
  try {
    const { userId, movieId, duration, progress } = req.body;
    if (!userId || !movieId) return res.status(400).json({ error: "Missing data" });

    if (req.user.id != userId) return res.sendStatus(403);

    const existingEntry = await History.findOne({ where: { userId, movieId } });
    
    if (existingEntry) {
      existingEntry.watchedAt = new Date();
      existingEntry.durationWatched = (existingEntry.durationWatched || 0) + (duration || 0);
      if (progress !== undefined) existingEntry.progress = progress;
      await existingEntry.save();
    } else {
      await History.create({
        userId,
        movieId,
        durationWatched: duration || 0,
        progress: progress || 0,
        watchedAt: new Date()
      });
    }

    const [view, created] = await View.findOrCreate({
      where: { movieId },
      defaults: { count: 0 }
    });
    
    await view.increment('count');

    res.json({ success: true });
  } catch (error) {
    console.error("Save history error:", error);
    res.status(500).json({ error: "Failed to save history" });
  }
});

app.get("/api/history/progress/:movieId", authenticateToken, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.id;

    const entry = await History.findOne({ where: { userId, movieId } });
    res.json({ progress: entry ? entry.progress : 0 });
  } catch (error) {
    console.error("Get progress error:", error);
    res.status(500).json({ error: "Failed to get progress" });
  }
});

// --- WATCHLIST ROUTES ---
app.get("/api/watchlist/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.id != userId) return res.sendStatus(403);
    
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
      } catch (e) {
        return null;
      }
    }));

    res.json(detailedWatchlist.filter(Boolean));
  } catch (error) {
    console.error("Watchlist fetch error:", error);
    res.status(500).json({ error: "Failed to fetch watchlist" });
  }
});

app.get("/api/watchlist/check/:movieId", authenticateToken, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.id;

    const entry = await Watchlist.findOne({ where: { userId, movieId } });
    res.json({ inWatchlist: !!entry });
  } catch (error) {
    res.status(500).json({ error: "Failed to check watchlist" });
  }
});

app.post("/api/watchlist", authenticateToken, async (req, res) => {
  try {
    const { movieId } = req.body;
    const userId = req.user.id;

    await Watchlist.findOrCreate({
      where: { userId, movieId }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to add to watchlist" });
  }
});

app.delete("/api/watchlist/:movieId", authenticateToken, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.id;

    await Watchlist.destroy({
      where: { userId, movieId }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove from watchlist" });
  }
});

// --- MOVIE ROUTES (IPHIM & PHIMAPI) ---

// Get Genres
app.get("/api/genres", async (req, res) => {
  try {
    const data = await fetchFromAPI(`${PHIMAPI_BASE_URL}/the-loai`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch genres" });
  }
});

// Specific caches for heavy endpoints
let popularCache = { data: null, timestamp: 0 };
let topViewedCache = { data: null, timestamp: 0 };
const ENDPOINT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get Popular Movies (Phim mới cập nhật)
app.get("/api/movies/popular", async (req, res) => {
  try {
    const page = req.query.page || 1;
    // Only cache first page
    if (page == 1 && popularCache.data && (Date.now() - popularCache.timestamp < ENDPOINT_CACHE_TTL)) {
       return res.json(popularCache.data);
    }

    const data = await fetchFromAPI(`${IPHIM_BASE_URL}/phim-moi-cap-nhat?page=${page}`);
    
    if (page == 1) {
      popularCache = { data, timestamp: Date.now() };
    }
    
    res.json(data);
  } catch (error) {
    console.error("Popular movies error:", error);
    res.status(500).json({ error: "Failed to fetch popular movies" });
  }
});

// Get Top Viewed (From local DB + PhimAPI details)
app.get("/api/movies/top-viewed", async (req, res) => {
  try {
    if (topViewedCache.data && (Date.now() - topViewedCache.timestamp < ENDPOINT_CACHE_TTL)) {
      return res.json(topViewedCache.data);
    }

    const topViews = await View.findAll({
      order: [['count', 'DESC']],
      limit: 10
    });
    
    let movies = await Promise.all(topViews.map(async (v) => {
      try {
        const data = await fetchFromAPI(`${PHIMAPI_BASE_URL}/phim/${v.movieId}`);
        if (data.status && data.movie) {
            return { ...data.movie, viewCount: v.count };
        }
        return null;
      } catch (e) {
        return null;
      }
    }));

    const result = movies.filter(Boolean);
    topViewedCache = { data: result, timestamp: Date.now() };
    
    res.json(result);
  } catch (error) {
    console.error("Top movies error:", error);
    res.status(500).json({ error: "Failed to fetch top movies" });
  }
});

// Get Movies by Genre
app.get("/api/movies/genre/:genreSlug", async (req, res) => {
  try {
    const { genreSlug } = req.params;
    const page = req.query.page || 1;
    const data = await fetchFromAPI(`${IPHIM_BASE_URL}/the-loai/${genreSlug}?page=${page}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch movies by genre" });
  }
});

// Get Movies by List (Phim Le, Phim Bo, etc.)
app.get("/api/movies/list/:listSlug", async (req, res) => {
  try {
    const { listSlug } = req.params;
    const page = req.query.page || 1;
    const data = await fetchFromAPI(`${IPHIM_BASE_URL}/danh-sach/${listSlug}?page=${page}`);
    res.json(data);
  } catch (error) {
    console.error("List fetch error:", error);
    res.status(500).json({ error: "Failed to fetch movies by list" });
  }
});

// Search Movies
app.get("/api/movies/search", async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }
    const data = await fetchFromAPI(`${IPHIM_BASE_URL}/search?keyword=${query}`);
    res.json(data);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to search movies" });
  }
});

// Get Movie Details
app.get("/api/movies/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    let data;
    
    // Try primary source (PhimAPI)
    try {
      data = await fetchFromAPI(`${PHIMAPI_BASE_URL}/phim/${slug}`);
    } catch (e) {
      console.warn(`Primary API failed for ${slug}, trying fallback...`);
    }

    // Fallback to OPhim if primary fails or returns invalid status
    if (!data || !data.status) {
      try {
        data = await fetchFromAPI(`https://ophim1.com/phim/${slug}`);
      } catch (e) {
        console.warn(`Fallback API failed for ${slug}`);
      }
    }

    // If still no data, try checking if it's a "slug" mismatch issue by searching again? 
    // No, that's too complex. Just return 404.
    
    if (!data || !data.status) {
        console.error(`Movie not found: ${slug}`);
        return res.status(404).json({ error: "Movie not found" });
    }

    // Merge episodes into the movie object so frontend works as expected
    const movieData = { ...data.movie, episodes: data.episodes };
    res.json(movieData);
  } catch (error) {
    console.error(`Error in movie detail route for ${slug}:`, error.message);
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
