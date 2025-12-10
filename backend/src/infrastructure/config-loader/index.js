const fs = require('fs');
const path = require('path');

const loadConfig = (configName) => {
  const configPath = path.resolve(__dirname, '../../../../config', configName);
  try {
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading config ${configName}:`, error);
    return null;
  }
};

module.exports = { loadConfig };
