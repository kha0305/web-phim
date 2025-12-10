const express = require("express");
const cors = require("cors");
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
require("dotenv").config();

// Imports
const { loadConfig } = require('./src/infrastructure/config-loader');
const GenericController = require('./src/api/controllers/GenericController');
const { authenticateToken, authenticateAdmin, authenticateOwnerOrAdmin } = require('./src/api/middlewares/authMiddleware');
const logger = require('./src/infrastructure/logger');
const AppError = require('./src/shared/AppError');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Performance Middlewares
app.use(helmet()); // Set security headers
app.use(compression());

// Logger
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  standardHeaders: true, 
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
  handler: (req, res, next, options) => {
      next(new AppError(options.message, 429));
  }
});
app.use('/api', limiter); // Apply only to API routes

// CORS configuration
const corsOptions = {
    origin: process.env.CLIENT_URL || '*', // Restrict in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Upload config
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Dynamic Routes Loading
const routesConfig = loadConfig('routes.config.json');

if (routesConfig) {
  routesConfig.forEach(route => {
    const middlewares = [];

    // 1. Permission Middleware
    if (route.permissions) {
      if (route.permissions.includes('authenticated')) middlewares.push(authenticateToken);
      if (route.permissions.includes('admin')) middlewares.push(authenticateAdmin);
      if (route.permissions.includes('owner_or_admin')) middlewares.push(authenticateOwnerOrAdmin);
    }

    // 2. Upload Middleware
    if (route.upload) {
        const [type, field] = route.upload.split(':');
        if (type === 'single') middlewares.push(upload.single(field));
    }

    // 3. Handler Assignment
    const method = route.method.toLowerCase();
    if (app[method]) {
      // Async Handler Wrapper
      const asyncHandler = fn => (req, res, next) => {
          Promise.resolve(fn(req, res, next)).catch(next);
      };

      app[method](route.path, ...middlewares, (req, res, next) => {
          GenericController.handle(req, res, route.handler).catch(next);
      });
      logger.info(`[Route] ${route.method} ${route.path} -> ${route.handler}`);
    }
  });
}

// 404 Handler
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  if (statusCode === 500) {
      logger.error(`[ERROR] ${err.stack}`); // Log critical errors
  }

  res.status(statusCode).json({
    status: status,
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start Server
if (require.main === module) {
    const { sequelize } = require('./src/infrastructure/database');
    sequelize.sync({ alter: true }).then(() => {
        logger.info("Database synced");
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    }).catch(err => {
        logger.error(`Failed to sync database: ${err.message}`);
    });
}

module.exports = app;