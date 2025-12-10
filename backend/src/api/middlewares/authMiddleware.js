const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_this';

// Standard Auth Middleware
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

// Admin Auth Middleware
const authenticateAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.sendStatus(403);
    }
  });
};

// Owner Or Admin Middleware (for History/Watchlist)
const authenticateOwnerOrAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        const { userId } = req.params;
        if (req.user && (req.user.id == userId || req.user.role === 'admin')) {
            next();
        } else {
            res.sendStatus(403);
        }
    });
};

module.exports = { authenticateToken, authenticateAdmin, authenticateOwnerOrAdmin };
