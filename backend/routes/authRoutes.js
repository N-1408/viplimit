// ============================================
// 📁 File: backend/routes/authRoutes.js — Authentication API Routes
// 👤 Author: User with AI
// 📝 Description: Defines authentication routes for login, user info,
//    and initial owner setup. Protected routes require JWT token.
//    Setup route is only available when no owner exists yet.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-04-03 01:28 (Tashkent) — 🤖 register va tg-auto-login endpointlari qo'shildi
// 2026-03-24 16:13 (Tashkent) — 🛡️ Rate limiting qo'shildi (#2 fix)
// ============================================

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { login, getMe, setupOwner, updateCredentials, register, tgAutoLogin } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// 🛡️ Rate limiter for login — max 10 attempts per 15 minutes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // ⏱️ 15 daqiqa
    max: 10,                   // 🔢 Maksimal 10 urinish
    message: { error: "⚠️ Juda ko'p urinish. 15 daqiqadan so'ng qayta urinib ko'ring." },
    standardHeaders: true,     // 📋 RateLimit-* headers qaytarish
    legacyHeaders: false       // ❌ X-RateLimit-* headerlarni o'chirish
});

// 🛡️ Rate limiter for setup — max 5 attempts per 15 minutes
const setupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: "⚠️ Juda ko'p urinish. 15 daqiqadan so'ng qayta urinib ko'ring." },
    standardHeaders: true,
    legacyHeaders: false
});

// 🔑 POST /api/auth/login — Login (🛡️ rate limited)
router.post('/login', loginLimiter, login);

// 🔧 POST /api/auth/setup — Initial owner setup (🛡️ rate limited)
router.post('/setup', setupLimiter, setupOwner);

// 👤 GET /api/auth/me — Get current user (requires auth)
router.get('/me', authenticateToken, getMe);

// ✅ PUT /api/auth/update-credentials — Update login and password
router.put('/update-credentials', authenticateToken, updateCredentials);

// 🆕 POST /api/auth/register — Yangi Game Club yaratish (public)
router.post('/register', setupLimiter, register);

// 🤖 POST /api/auth/tg-auto-login — Telegram auto-login (public)
router.post('/tg-auto-login', tgAutoLogin);

module.exports = router;
