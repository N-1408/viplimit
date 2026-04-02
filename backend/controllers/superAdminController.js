// ============================================
// 📁 File: backend/controllers/superAdminController.js — Super Admin Controller
// 👤 Author: User with AI
// 📝 Description: Handles all Super Admin panel operations including
//    dashboard stats, club management, plan CRUD, promo codes, and
//    enabling/disabling game clubs. Only accessible by platform owner.
// 📅 Created: 2026-04-03 01:28 (Tashkent Time)
// ============================================

const { query } = require('../config/database');

// ============================================
// 📊 GET /api/super/dashboard — Umumiy statistika
// ============================================
const getDashboard = async (req, res) => {
    try {
        const [clubsResult, usersResult, sessionsResult, plansResult] = await Promise.all([
            query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_enabled = true) as active FROM branches'),
            query('SELECT COUNT(*) as total FROM users'),
            query(`SELECT COUNT(*) as total, COALESCE(SUM(total_amount), 0) as revenue 
                   FROM sessions WHERE status = 'completed'`),
            query('SELECT COUNT(*) as total FROM plans WHERE is_active = true')
        ]);

        res.json({
            clubs: {
                total: parseInt(clubsResult.rows[0].total),
                active: parseInt(clubsResult.rows[0].active)
            },
            users: parseInt(usersResult.rows[0].total),
            sessions: {
                total: parseInt(sessionsResult.rows[0].total),
                revenue: parseFloat(sessionsResult.rows[0].revenue)
            },
            plans: parseInt(plansResult.rows[0].total)
        });
    } catch (err) {
        console.error('❌ Super dashboard error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// ============================================
// 🏢 GET /api/super/clubs — Barcha clublar
// ============================================
const getClubs = async (req, res) => {
    try {
        const result = await query(`
            SELECT b.id, b.name, b.phone, b.is_enabled, b.plan_id, b.subscription_until, b.created_at,
                   p.name as plan_name, p.max_rooms, p.max_products,
                   (SELECT COUNT(*) FROM rooms WHERE branch_id = b.id) as rooms_count,
                   (SELECT COUNT(*) FROM products WHERE branch_id = b.id) as products_count,
                   (SELECT COUNT(*) FROM users WHERE branch_id = b.id) as users_count
            FROM branches b
            LEFT JOIN plans p ON b.plan_id = p.id
            ORDER BY b.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Super get clubs error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// ============================================
// 🔄 PUT /api/super/clubs/:id/toggle — Club yoqish/o'chirish
// ============================================
const toggleClub = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'UPDATE branches SET is_enabled = NOT is_enabled WHERE id = $1 RETURNING id, name, is_enabled',
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Club topilmadi.' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ Super toggle club error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// ============================================
// 📦 PUT /api/super/clubs/:id/plan — Club planini o'zgartirish
// ============================================
const updateClubPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { plan_id, subscription_until } = req.body;
        const result = await query(
            `UPDATE branches SET plan_id = $1, subscription_until = $2 WHERE id = $3
             RETURNING id, name, plan_id, subscription_until`,
            [plan_id, subscription_until || null, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Club topilmadi.' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ Super update plan error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// ============================================
// 📦 PLANS — CRUD
// ============================================
const getPlans = async (req, res) => {
    try {
        const result = await query('SELECT * FROM plans ORDER BY price_monthly ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Super get plans error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

const createPlan = async (req, res) => {
    try {
        const { name, max_rooms, max_products, max_users, price_monthly } = req.body;
        const result = await query(
            `INSERT INTO plans (name, max_rooms, max_products, max_users, price_monthly)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, max_rooms || 2, max_products || 4, max_users || 2, price_monthly || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('❌ Super create plan error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, max_rooms, max_products, max_users, price_monthly, is_active } = req.body;
        const result = await query(
            `UPDATE plans SET name = $1, max_rooms = $2, max_products = $3, max_users = $4,
             price_monthly = $5, is_active = $6 WHERE id = $7 RETURNING *`,
            [name, max_rooms, max_products, max_users, price_monthly, is_active, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Plan topilmadi.' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ Super update plan error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

const deletePlan = async (req, res) => {
    try {
        const { id } = req.params;
        // 🛡️ Default plan (id=1) ni o'chirish mumkin emas
        if (parseInt(id) === 1) return res.status(400).json({ error: 'Default plan o\'chirish mumkin emas.' });
        await query('DELETE FROM plans WHERE id = $1', [id]);
        res.json({ message: 'Plan o\'chirildi.' });
    } catch (err) {
        console.error('❌ Super delete plan error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// ============================================
// 🎟️ PROMO CODES — CRUD
// ============================================
const getPromoCodes = async (req, res) => {
    try {
        const result = await query('SELECT * FROM promo_codes ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Super get promos error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

const createPromoCode = async (req, res) => {
    try {
        const { code, discount_percent, valid_until, max_uses } = req.body;
        const result = await query(
            `INSERT INTO promo_codes (code, discount_percent, valid_until, max_uses)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [code.toUpperCase(), discount_percent || 0, valid_until || null, max_uses || 100]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Bu kod allaqachon mavjud.' });
        console.error('❌ Super create promo error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

const updatePromoCode = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, discount_percent, valid_until, max_uses, is_active } = req.body;
        const result = await query(
            `UPDATE promo_codes SET code = $1, discount_percent = $2, valid_until = $3,
             max_uses = $4, is_active = $5 WHERE id = $6 RETURNING *`,
            [code.toUpperCase(), discount_percent, valid_until, max_uses, is_active, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Promo kod topilmadi.' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ Super update promo error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

const deletePromoCode = async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM promo_codes WHERE id = $1', [id]);
        res.json({ message: 'Promo kod o\'chirildi.' });
    } catch (err) {
        console.error('❌ Super delete promo error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

module.exports = {
    getDashboard, getClubs, toggleClub, updateClubPlan,
    getPlans, createPlan, updatePlan, deletePlan,
    getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode
};
