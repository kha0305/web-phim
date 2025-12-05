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

const nodemailer = require('nodemailer');

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or use 'smtp.gmail.com' directly
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS  // Your email password or app-specific password
  }
});

// Helper to send welcome email
const sendWelcomeEmail = async (email, username) => {
  console.log("Attempting to send welcome email to:", email);
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("Email credentials missing in .env! EMAIL_USER or EMAIL_PASS is not set.");
    return;
  }

  const mailOptions = {
    from: `"PhimChill Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to PhimChill! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #e50914; text-align: center;">Welcome to PhimChill, ${username}!</h2>
        <p>Thank you for joining our community. We are excited to have you on board.</p>
        <p>Start exploring thousands of movies and TV shows right now!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://movie.server.id.vn" style="background-color: #e50914; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Start Watching</a>
        </div>
        <p style="color: #888; font-size: 12px; text-align: center;">If you did not create this account, please ignore this email.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent: ${info.messageId}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
};

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password || !email) return res.status(400).json({ error: "Missing fields" });
    
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, password: hashedPassword, email });

    // Send Welcome Email asynchronously (don't block response)
    sendWelcomeEmail(email, username);

    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET);

    res.json({ 
      user: { id: newUser.id, username: newUser.username, email: newUser.email },
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

const { Otp } = require('./models');

// Generate Random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Email
const sendOtpEmail = async (email, otp) => {
  console.log("Attempting to send OTP email to:", email);
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("Email credentials missing for OTP!");
    return;
  }

  const mailOptions = {
    from: `"PhimChill Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #e50914; text-align: center;">Password Reset Request</h2>
        <p>You requested to reset your password. Use the code below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="background-color: #f4f4f4; padding: 10px 20px; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px;">${otp}</span>
        </div>
        <p style="color: #888; font-size: 12px; text-align: center;">This code will expire in 10 minutes.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`OTP email sent: ${info.messageId}`);
  } catch (error) {
    console.error("Error sending OTP email:", error);
  }
};

// 1. Forgot Password - Send OTP
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Remove existing OTPs for this email
    await Otp.destroy({ where: { email } });

    // Save new OTP
    await Otp.create({ email, otp, expiresAt });

    // Send Email
    await sendOtpEmail(email, otp);

    res.json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// 2. Verify OTP
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Missing fields" });

    const record = await Otp.findOne({ where: { email, otp } });
    
    if (!record) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date() > record.expiresAt) {
      return res.status(400).json({ error: "OTP expired" });
    }

    res.json({ success: true, message: "OTP verified" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: "Verification failed" });
  }
});

// 3. Reset Password
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: "Missing fields" });

    // Verify OTP again to be safe
    const record = await Otp.findOne({ where: { email, otp } });
    if (!record || new Date() > record.expiresAt) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Update Password
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Delete used OTP
    await record.destroy();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
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

// Configure Multer (Use Memory Storage for Vercel Blob)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Vercel Blob
const { put } = require('@vercel/blob');

// Manual DB Sync Route (for Vercel)
app.get("/api/sync-db", async (req, res) => {
  try {
    await sequelize.sync({ alter: true });
    res.send("Database synced successfully!");
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).send("Failed to sync database: " + error.message);
  }
});

// app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Not needed with Blob

// ...

app.put("/api/user/profile", authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const { username, gender } = req.body;
    const userId = req.user.id;

    if (!username) return res.status(400).json({ error: "Username is required" });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.username = username;
    if (gender) user.gender = gender;
    
    if (req.file) {
      // Check for token
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
         console.error("Missing BLOB_READ_WRITE_TOKEN");
         return res.status(500).json({ error: "Server configuration error: Missing Blob Token" });
      }

      // Upload to Vercel Blob
      try {
        const filename = `${Date.now()}-${req.file.originalname}`;
        const blob = await put(filename, req.file.buffer, { 
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN
        });
        user.avatar = blob.url;
      } catch (uploadError) {
        console.error("Vercel Blob upload failed:", uploadError);
        return res.status(500).json({ error: "Failed to upload image: " + uploadError.message });
      }
    } else if (req.body.avatarUrl) {
       // Allow updating via URL string if provided (fallback)
       user.avatar = req.body.avatarUrl;
    }
    
    await user.save();

    res.json({ success: true, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, gender: user.gender } });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Change Password Route
app.post("/api/user/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect current password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Request Email Change - Send OTP to NEW email
app.post("/api/user/request-email-change", authenticateToken, async (req, res) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ error: "New email is required" });

    // Check if email is already taken
    const existingUser = await User.findOne({ where: { email: newEmail } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Remove existing OTPs for this email
    await Otp.destroy({ where: { email: newEmail } });

    // Save new OTP
    await Otp.create({ email: newEmail, otp, expiresAt });

    // Send OTP Email
    await sendOtpEmail(newEmail, otp);

    res.json({ success: true, message: "OTP sent to new email" });
  } catch (error) {
    console.error("Request email change error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify Email Change - Update Email
app.post("/api/user/verify-email-change", authenticateToken, async (req, res) => {
  try {
    const { newEmail, otp } = req.body;
    const userId = req.user.id;

    if (!newEmail || !otp) return res.status(400).json({ error: "Missing fields" });

    const record = await Otp.findOne({ where: { email: newEmail, otp } });
    
    if (!record) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date() > record.expiresAt) {
      return res.status(400).json({ error: "OTP expired" });
    }

    // Update User Email
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.email = newEmail;
    await user.save();

    // Delete used OTP
    await record.destroy();

    res.json({ success: true, message: "Email updated successfully", user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar } });
  } catch (error) {
    console.error("Verify email change error:", error);
    res.status(500).json({ error: "Failed to update email" });
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
