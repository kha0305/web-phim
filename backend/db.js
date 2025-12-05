const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('webphim', 'root', '190705', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

module.exports = sequelize;
