// ============================================
// 📁 File: backend/routes/reportRoutes.js — Reports API Routes
// 👤 Author: User with AI
// 📝 Description: Defines routes for business reports and analytics.
//    Restricted to manager and owner roles.
//    Provides daily, range-based, and product sales reports.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================

const express = require('express');
const router = express.Router();
const { getDailyReport, getRangeReport, getProductSalesReport } = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// 🔒 All routes require authentication + manager/owner role
router.use(authenticateToken);
router.use(authorizeRoles('manager', 'owner'));

// 💰 GET /api/reports/daily — Daily cash report
router.get('/daily', getDailyReport);

// 📊 GET /api/reports/range — Revenue for date range
router.get('/range', getRangeReport);

// 🛒 GET /api/reports/products — Product sales report
router.get('/products', getProductSalesReport);

module.exports = router;
