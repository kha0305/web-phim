const axios = require('axios');

async function check() {
  try {
    const res = await axios.get('https://iphim.cc/api/films/phim-moi-cap-nhat');
    console.log("First item:", JSON.stringify(res.data.items[0], null, 2));
  } catch (e) {
    console.log(e);
  }
}

check();
