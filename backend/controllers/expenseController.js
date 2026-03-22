// ============================================
// 📁 File: backend/controllers/expenseController.js — Expenses Controller
// 👤 Author: User with AI
// 📝 Description: Handles CRUD operations for the expenses (xarajatlar) table.
//    Allows managers and owners to add, view, and delete expense records
//    for their branch. Supports optional date-range filtering.
// 📅 Created: 2026-03-22 16:30 (Tashkent Time)
// ============================================

const { query } = require('../config/database');

// 📋 GET /api/expenses — Get all expenses for the current branch
const getExpenses = async (req, res) => {
    try {
        const { from, to } = req.query;

        // 🗓️ Build optional date filters
        let conditions = ['e.branch_id = $1'];
        let values = [req.user.branch_id];
        let idx = 2;

        if (from) {
            conditions.push(`e.created_at >= $${idx++}`);
            values.push(from);
        }
        if (to) {
            conditions.push(`e.created_at <= $${idx++}`);
            values.push(to + ' 23:59:59');
        }

        const whereClause = conditions.join(' AND ');

        const result = await query(
            `SELECT e.*, u.full_name AS added_by
             FROM expenses e
             LEFT JOIN users u ON e.user_id = u.id
             WHERE ${whereClause}
             ORDER BY e.created_at DESC`,
            values
        );

        // 📊 Calculate total per currency
        const totals = result.rows.reduce((acc, r) => {
            acc[r.currency] = (acc[r.currency] || 0) + parseFloat(r.amount);
            return acc;
        }, {});

        res.json({ expenses: result.rows, totals });
    } catch (err) {
        console.error('❌ getExpenses error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// ➕ POST /api/expenses — Add new expense
const addExpense = async (req, res) => {
    try {
        const { amount, currency, category, description } = req.body;

        if (!amount || !category) {
            return res.status(400).json({ error: "Summa va kategoriya kiritilishi shart." });
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ error: "Noto'g'ri summa." });
        }

        const result = await query(
            `INSERT INTO expenses (branch_id, user_id, amount, currency, category, description)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [req.user.branch_id, req.user.id, parsedAmount, currency || 'UZS', category, description || '']
        );

        res.status(201).json({ expense: result.rows[0] });
    } catch (err) {
        console.error('❌ addExpense error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// 🗑️ DELETE /api/expenses/:id — Delete an expense
const deleteExpense = async (req, res) => {
    try {
        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            return res.status(403).json({ error: "Sizda bunday huquq yo'q." });
        }

        const result = await query(
            `DELETE FROM expenses WHERE id = $1 AND branch_id = $2 RETURNING id`,
            [req.params.id, req.user.branch_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Xarajat topilmadi." });
        }

        res.json({ message: "Xarajat o'chirildi." });
    } catch (err) {
        console.error('❌ deleteExpense error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

module.exports = { getExpenses, addExpense, deleteExpense };
