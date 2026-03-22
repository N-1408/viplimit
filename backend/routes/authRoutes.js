// ============================================
// 📁 File: backend/routes/authRoutes.js — Authentication API Routes
// 👤 Author: User with AI
// 📝 Description: Defines authentication routes for login, user info,
//    and initial owner setup. Protected routes require JWT token.
//    Setup route is only available when no owner exists yet.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================

const express = require('express');
const router = express.Router();
const { login, getMe, setupOwner, updateCredentials } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// 🔑 POST /api/auth/login — Login
router.post('/login', login);

// 🔧 POST /api/auth/setup — Initial owner setup (no auth required)
router.post('/setup', setupOwner);

// 👤 GET /api/auth/me — Get current user (requires auth)
router.get('/me', authenticateToken, getMe);

// ✏️ PUT /api/auth/update-credentials — Update login and password
router.put('/update-credentials', authenticateToken, updateCredentials);

module.exports = router;
