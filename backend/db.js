const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'webphim',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '190705',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    dialectModule: require('mysql2'),
    logging: false,
    dialectOptions: process.env.DB_HOST ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
    pool: {
      max: 10,      // Maximum number of connection in pool
      min: 0,       // Minimum number of connection in pool
      acquire: 30000, // The maximum time, in milliseconds, that pool will try to get connection before throwing error
      idle: 10000   // The maximum time, in milliseconds, that a connection can be idle before being released
    }
  }
);

module.exports = sequelize;
