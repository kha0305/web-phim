const fs = require('fs');
const path = require('path');

const loadConfig = (configName) => {
  // Fix: Use 3 levels up to reach backend/config from backend/src/infrastructure/config-loader
  const configPath = path.resolve(__dirname, '../../../config', configName);
  try {
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading config ${configName}:`, error);
    return null;
  }
};

module.exports = { loadConfig };
