// ============================================
// 📁 File: backend/routes/roomRoutes.js — Room Management API Routes
// 👤 Author: User with AI
// 📝 Description: Defines CRUD routes for game rooms.
//    All routes require authentication. Create/update/delete
//    require manager or owner role.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================

const express = require('express');
const router = express.Router();
const { getAllRooms, getRoomById, createRoom, updateRoom, deleteRoom, reorderRooms } = require('../controllers/roomController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// 🔒 All routes require authentication
router.use(authenticateToken);

// 📋 GET /api/rooms — List all rooms
router.get('/', getAllRooms);

// 🔍 GET /api/rooms/:id — Get single room
router.get('/:id', getRoomById);

// 🔄 PUT /api/rooms/reorder — Reorder rooms (manager/owner)
router.put('/reorder', authorizeRoles('manager', 'owner'), reorderRooms);

// ➕ POST /api/rooms — Create room (manager/owner only)
router.post('/', authorizeRoles('manager', 'owner'), createRoom);

// ✏️ PUT /api/rooms/:id — Update room (manager/owner only)
router.put('/:id', authorizeRoles('manager', 'owner'), updateRoom);

// 🗑️ DELETE /api/rooms/:id — Delete room (owner only)
router.delete('/:id', authorizeRoles('owner'), deleteRoom);

module.exports = router;
