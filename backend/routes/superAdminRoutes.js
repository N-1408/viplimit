// ============================================
// 📁 File: backend/routes/superAdminRoutes.js — Super Admin API Routes
// 👤 Author: User with AI
// 📝 Description: RESTful routes for the hidden Super Admin panel.
//    All routes protected by Super Admin middleware (TG ID check).
//    Provides club management, plan/promo CRUD, and dashboard stats.
// 📅 Created: 2026-04-03 01:28 (Tashkent Time)
// ============================================

const express = require('express');
const router = express.Router();
const { authenticateSuperAdmin } = require('../middleware/superAdmin');
const {
    getDashboard, getClubs, toggleClub, updateClubPlan,
    getPlans, createPlan, updatePlan, deletePlan,
    getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode
} = require('../controllers/superAdminController');

// 🔒 All routes require Super Admin authentication
router.use(authenticateSuperAdmin);

// 📊 Dashboard
router.get('/dashboard', getDashboard);

// 🏢 Clubs
router.get('/clubs', getClubs);
router.put('/clubs/:id/toggle', toggleClub);
router.put('/clubs/:id/plan', updateClubPlan);

// 📦 Plans
router.get('/plans', getPlans);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);

// 🎟️ Promo Codes
router.get('/promo-codes', getPromoCodes);
router.post('/promo-codes', createPromoCode);
router.put('/promo-codes/:id', updatePromoCode);
router.delete('/promo-codes/:id', deletePromoCode);

module.exports = router;
