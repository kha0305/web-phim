const { sequelize } = require('../../infrastructure/database');

class SystemService {
  async check(req, res) {
    res.send("Backend is running! (Refactored)");
  }

  async syncDb(req, res) {
    try {
      await sequelize.sync({ alter: true });
      res.send("Database synced successfully!");
    } catch (error) {
      console.error("Sync error:", error);
      res.status(500).send("Failed to sync database: " + error.message);
    }
  }
}

module.exports = SystemService;
