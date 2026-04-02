// ============================================
// 📁 File: backend/middleware/superAdmin.js — Super Admin Auth Middleware
// 👤 Author: User with AI
// 📝 Description: Middleware to verify that the current user is the
//    Super Admin by checking their Telegram ID against the env variable.
//    Only the platform owner can access Super Admin routes.
// 📅 Created: 2026-04-03 01:28 (Tashkent Time)
// ============================================

const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * 🔒 Super Admin authentication middleware
 * Checks if the request comes from the Super Admin (by Telegram ID)
 */
const authenticateSuperAdmin = async (req, res, next) => {
    try {
        // 📥 Get token from header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: '🔒 Token topilmadi.' });
        }

        // ✅ Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 🤖 Check if this user's Telegram ID matches Super Admin
        const superAdminTgId = process.env.SUPER_ADMIN_TG_ID;
        if (!superAdminTgId) {
            return res.status(403).json({ error: '🚫 Super Admin sozlanmagan.' });
        }

        // 🔍 Find telegram_user linked to this user
        const tgResult = await query(
            'SELECT telegram_id FROM telegram_users WHERE user_id = $1',
            [decoded.id]
        );

        // 🔍 Also check by direct telegram_id in token (if present)
        const userTgId = decoded.telegram_id ||
            (tgResult.rows.length > 0 ? tgResult.rows[0].telegram_id : null);

        if (!userTgId || String(userTgId) !== String(superAdminTgId)) {
            return res.status(403).json({ error: '🚫 Super Admin ruxsati yo\'q.' });
        }

        req.user = decoded;
        req.isSuperAdmin = true;
        next();
    } catch (err) {
        return res.status(401).json({ error: '❌ Token yaroqsiz.' });
    }
};

module.exports = { authenticateSuperAdmin };
