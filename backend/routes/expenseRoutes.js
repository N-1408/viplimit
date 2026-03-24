// ============================================
// 📁 File: backend/routes/expenseRoutes.js — Expense API Routes
// 👤 Author: User with AI
// 📝 Description: Express router for expenses CRUD endpoints.
//    All routes require authentication. Only managers and owners
//    can delete records (enforced via authorizeRoles middleware).
// 📅 Created: 2026-03-22 16:30 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-03-24 16:13 (Tashkent) — 🔒 #7: deleteExpense rol tekshiruvi
//    controller'dan middleware'ga ko'chirildi (authorizeRoles).
// ============================================

const express = require('express');
const router = express.Router();
const { getExpenses, addExpense, deleteExpense } = require('../controllers/expenseController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// 🔒 All expense routes require authentication
router.use(authenticateToken);

// 📋 GET /api/expenses — List expenses (supports ?from=&to= filters)
router.get('/', getExpenses);

// ➕ POST /api/expenses — Add new expense
router.post('/', addExpense);

// 🗑️ DELETE /api/expenses/:id — Remove an expense (🔒 owner/manager only)
router.delete('/:id', authorizeRoles('owner', 'manager'), deleteExpense);

module.exports = router;
