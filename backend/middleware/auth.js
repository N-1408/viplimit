// ============================================
// 📁 File: backend/middleware/auth.js — JWT Authentication Middleware
// 👤 Author: User with AI
// 📝 Description: Middleware to verify JWT tokens on protected routes.
//    Extracts user info from token and attaches to req.user.
//    Also includes role-based access control middleware.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// 2026-03-24 16:32 (Tashkent) — 🔒 #8 fix: authenticateToken endi token xatosi 
//    uchun 401 (403 emas) qaytaradi. Bu frontendda logoutni to'g'ri ishlatadi.
// ============================================

const jwt = require('jsonwebtoken');

// 🔒 Verify JWT token middleware
const authenticateToken = (req, res, next) => {
    // 📥 Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: '🔒 Token topilmadi. Iltimos, login qiling.' });
    }

    try {
        // ✅ Verify and decode token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, username, role, branch_id }
        next();
    } catch (err) {
        // 🔒 Token EXPIRED or INVALID should be 401 (Unauthorized), not 403 (Forbidden)
        return res.status(401).json({ error: '❌ Token yaroqsiz yoki muddati o\'tgan.' });
    }
};

// 🎭 Role-based access control middleware
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: '🚫 Sizda bu amalni bajarish uchun ruxsat yo\'q.'
            });
        }
        next();
    };
};

module.exports = { authenticateToken, authorizeRoles };
