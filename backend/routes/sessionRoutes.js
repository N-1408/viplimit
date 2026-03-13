// ============================================
// 📁 File: backend/routes/sessionRoutes.js — Session & Billing API Routes
// 👤 Author: User with AI
// 📝 Description: Defines routes for game session management.
//    Includes starting/stopping sessions, VIP toggle,
//    adding products, and viewing active sessions.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================

const express = require('express');
const router = express.Router();
const {
    startSession, stopSession, toggleVip,
    addProductToSession, getActiveSessions, getSessionDetails
} = require('../controllers/sessionController');
const { authenticateToken } = require('../middleware/auth');

// 🔒 All routes require authentication
router.use(authenticateToken);

// 📋 GET /api/sessions/active — Get all active sessions
router.get('/active', getActiveSessions);

// 🔍 GET /api/sessions/:id — Get session details with products
router.get('/:id', getSessionDetails);

// ▶️ POST /api/sessions/start — Start a new session
router.post('/start', startSession);

// ⏹️ POST /api/sessions/:id/stop — Stop a session & calculate bill
router.post('/:id/stop', stopSession);

// 💎 PUT /api/sessions/:id/vip — Toggle VIP mode
router.put('/:id/vip', toggleVip);

// 🛒 POST /api/sessions/:id/products — Add product to session
router.post('/:id/products', addProductToSession);

module.exports = router;
