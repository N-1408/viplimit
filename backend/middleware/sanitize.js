// ============================================
// 📁 File: backend/middleware/sanitize.js — Global Input Sanitization Middleware
// 👤 Author: User with AI
// 📝 Description: Express middleware that automatically sanitizes all string
//    values in req.body to prevent XSS attacks. Strips < and > characters
//    from user input before it reaches controllers. Uses sanitize from helpers.
// 📅 Created: 2026-03-24 16:13 (Tashkent Time)
// ============================================

const { sanitize } = require('../utils/helpers');

// 🛡️ Recursively sanitize all string values in an object
const sanitizeObject = (obj) => {
    if (typeof obj === 'string') return sanitize(obj);
    if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item));
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }
    return obj; // 🔢 Numbers, booleans, null — o'zgartirmaslik
};

// 🛡️ Middleware: sanitize req.body before reaching controllers
const sanitizeBody = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    next();
};

module.exports = { sanitizeBody };
