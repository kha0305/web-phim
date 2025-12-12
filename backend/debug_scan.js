const axios = require('axios');

const DOMAINS = [
    "https://kkphim.com",
    "https://kkphim.vip",
    "https://phimapi.com" // Control
];

const PATHS = [
    "/danh-sach/phim-moi-cap-nhat",
    "/api/danh-sach/phim-moi-cap-nhat",
    "/api/films/phim-moi-cap-nhat",
    "/phim-moi-cap-nhat"
];

async function scan() {
    console.log(`Scanning...`);
    
    for (const domain of DOMAINS) {
        console.log(`\n--- ${domain} ---`);
        try {
            // Root check
             await axios.get(domain, { timeout: 3000 }).catch(() => {});
        } catch(e) {}

        for (const path of PATHS) {
            try {
                const url = `${domain}${path}`;
                const res = await axios.get(url, { timeout: 5000, validateStatus: null });
                const type = res.headers['content-type'] || '';
                
                let info = `[${res.status}] Type: ${type.split(';')[0]}`;
                if (type.includes('json')) info += ' (JSON)';
                if (res.status === 200 && type.includes('json')) info += ' >>> MATCH <<<';
                
                console.log(`${path.padEnd(35)} : ${info}`);
            } catch (error) {
                console.log(`${path.padEnd(35)} : [ERR] ${error.message}`);
            }
        }
    }
}

scan();
