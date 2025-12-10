const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Constants
const CACHE_FILE = path.join(__dirname, '../../data/cache_store.json');
const SAVE_INTERVAL = 60 * 1000; 

// 1. Initialize Cache
let apiCache = new Map();

// 2. Load Cache (Try/Catch)
try {
  if (fs.existsSync(CACHE_FILE)) {
    const rawData = fs.readFileSync(CACHE_FILE, 'utf8');
    apiCache = new Map(JSON.parse(rawData));
  }
} catch (err) {
  // console.error("Cache load error", err);
}

// 3. Auto Save
setInterval(() => {
  try {
    const cacheArray = Array.from(apiCache.entries());
    const now = Date.now();
    // Keep items for 24h
    const validCache = cacheArray.filter(([k, v]) => now - v.timestamp < 24 * 60 * 60 * 1000);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(validCache), 'utf8');
  } catch (err) { }
}, SAVE_INTERVAL);

// 4. Cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of apiCache.entries()) {
    if (now - value.timestamp > 2 * 60 * 60 * 1000) apiCache.delete(key);
  }
}, 10 * 60 * 1000);

// Helper: HTTP Client with Aggressive Timeouts
const http = axios.create({
  timeout: 3000, // Reduced to 3 seconds global timeout
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
});

const fetchFromAPI = async (url, options = {}) => {
  const now = Date.now();
  const cached = apiCache.get(url);
  const ttl = options.ttl || 10 * 60 * 1000;
  const timeout = options.timeout || 3000; // Allow override

  if (cached) {
    const { data, timestamp } = cached;
    // Stale-While-Revalidate
    if (now - timestamp > ttl) {
       http.get(url, { timeout }).then(res => {
         apiCache.set(url, { data: res.data, timestamp: Date.now() });
       }).catch(() => {});
    }
    return data;
  }

  // Cold Fetch
  try {
    const response = await http.get(url, { timeout });
    apiCache.set(url, { data: response.data, timestamp: now });
    return response.data;
  } catch (error) {
    // console.log(`Fetch failed for ${url}: ${error.message}`);
    throw error;
  }
};

module.exports = { apiCache, fetchFromAPI };
