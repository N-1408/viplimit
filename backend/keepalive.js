// ============================================
// File: backend/keepalive.js — Render free instance keep-alive
// Description: Render free plan instance 15 daqiqa bo'sh turishdan keyin
//   o'chadi va keyingi so'rov ~50 sekund kechikadi. Bu modul har 10 daqiqada
//   o'z URLiga kichik so'rov yuborib, instance uyg'on holda saqlaydi.
// ============================================

const http = require('http');
const https = require('https');

const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 daqiqa

function startKeepAlive() {
    // Render web service'larga RENDER_EXTERNAL_URL env variable'ni o'zi beradi
    const url = process.env.RENDER_EXTERNAL_URL || process.env.WEBAPP_URL;
    if (!url || !/^https?:\/\//.test(url)) {
        console.log("ℹ️ Keep-alive o'chirildi: tashqi URL topilmadi (RENDER_EXTERNAL_URL).");
        return;
    }

    const ping = () => {
        try {
            const mod = url.startsWith('https') ? https : http;
            const req = mod.get(`${url.replace(/\/$/, '')}/api/health`, (res) => res.resume());
            req.on('error', () => {});
            req.setTimeout(15000, () => req.destroy());
        } catch (e) {
            // Ping muvaffaqiyatsiz bo'lsa jim o'tkazamiz — keyingi intervalda qayta urinadi
        }
    };

    ping();
    setInterval(ping, PING_INTERVAL_MS);
    console.log(`⏰ Keep-alive yoqildi: har 10 daqiqada o'zini ping qiladi.`);
}

module.exports = { startKeepAlive };
