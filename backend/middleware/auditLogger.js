// ============================================
// 📁 File: backend/middleware/auditLogger.js — Audit Log Middleware
// 👤 Author: User with AI
// 📝 Description: Middleware and utility to log all important actions.
//    Records who did what, when, and what changed.
//    Critical for owner transparency and fraud prevention.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================

const { query } = require('../config/database');

// 📝 Log an action to audit_logs table
const logAction = async ({
    branchId,
    userId,
    action,
    entityType,
    entityId,
    oldValues = null,
    newValues = null,
    ipAddress = null
}) => {
    try {
        await query(
            `INSERT INTO audit_logs 
             (branch_id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                branchId,
                userId,
                action,
                entityType,
                entityId,
                oldValues ? JSON.stringify(oldValues) : null,
                newValues ? JSON.stringify(newValues) : null,
                ipAddress
            ]
        );
    } catch (err) {
        // ⚠️ Don't crash the app if audit logging fails, but log the error
        console.error('⚠️ Audit log error:', err.message);
    }
};

// 🔧 Get client IP from request
const getClientIP = (req) => {
    return req.headers['x-forwarded-for'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        'unknown';
};

module.exports = { logAction, getClientIP };
