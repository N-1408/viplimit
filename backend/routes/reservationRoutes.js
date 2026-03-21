// ============================================
// 📁 File: backend/routes/reservationRoutes.js
// 📅 Created: 2026-03-21
// ============================================

const express = require('express');
const router = express.Router();
const { createReservation, cancelReservation } = require('../controllers/reservationController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken); // Only authenticated users

router.post('/', createReservation);
router.put('/:id/cancel', cancelReservation);

module.exports = router;
