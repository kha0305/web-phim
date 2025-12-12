const axios = require('axios');

async function checkSearch() {
    const urls = [
        "https://phimapi.com/v1/api/tim-kiem?keyword=batman",
        "https://phimapi.com/ads/search?keyword=batman", // unlikely
        "https://phimapi.com/search?keyword=batman" // unlikely
    ];
    for(const u of urls) {
        try {
            const res = await axios.get(u, { validateStatus: null });
            console.log(`[${res.status}] ${u}`);
            if(res.status === 200) console.log("Success");
        } catch(e) { console.log(e.message); }
    }
}
checkSearch();
