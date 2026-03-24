// ============================================
// 📁 File: backend/controllers/sessionController.js — Session & Billing Controller
// 👤 Author: User with AI
// 📝 Description: Core billing engine. Handles starting, stopping, and managing
//    game sessions. Calculates time-based charges automatically using per-minute
//    rates. VIP = unlimited time (same price). Supports time-limited sessions.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-03-24 16:13 (Tashkent) — 🔒 #3: addProductToSession race condition tuzatildi
//    (transaction + FOR UPDATE lock). #4: stopSession transaction ichiga olindi.
//    #5: toggleVip da is_unlimited ham yangilanadi endi.
// 2026-03-13 01:53 (Tashkent) — VIP logikasi to'g'irlandi: VIP = cheksiz vaqt,
//    narx oddiy narx bilan bir xil. Batafsil chek (bill receipt) session stop da
//    qaytariladi. 'transfer' to'lov turi olib tashlandi.
// ============================================

const { query, pool } = require('../config/database');
const { logAction, getClientIP } = require('../middleware/auditLogger');
const { calculateDurationMinutes, calculateTimeCost } = require('../utils/helpers');

// ▶️ POST /api/sessions/start — Start a new session (open a room)
// 💎 VIP = cheksiz vaqt (is_vip=true, is_unlimited=true), narx bir xil
const startSession = async (req, res) => {
    try {
        const { room_id, is_vip, duration_minutes, session_type, notes } = req.body;

        if (!room_id) {
            return res.status(400).json({ error: 'Xona tanlanishi shart.' });
        }

        // 🔍 Check if room exists and is free
        const roomResult = await query(
            'SELECT * FROM rooms WHERE id = $1 AND branch_id = $2 AND is_active = true',
            [room_id, req.user.branch_id]
        );

        if (roomResult.rows.length === 0) {
            return res.status(404).json({ error: 'Xona topilmadi.' });
        }

        const room = roomResult.rows[0];

        if (room.status === 'busy') {
            return res.status(400).json({ error: 'Bu xona hozir band.' });
        }

        if (room.status === 'maintenance') {
            return res.status(400).json({ error: 'Bu xona texnik xizmatda.' });
        }

        // 💎 VIP = cheksiz vaqt rejimi (same price)
        const isVip = is_vip || false;
        const isUnlimited = isVip; // VIP = unlimited

        // ⏱️ Calculate scheduled_end from duration_minutes (only for non-VIP)
        let scheduledEnd = null;
        if (!isVip && duration_minutes && duration_minutes > 0) {
            scheduledEnd = new Date(Date.now() + duration_minutes * 60 * 1000);
        }

        // 📥 Create session
        const sessionResult = await query(
            `INSERT INTO sessions 
             (room_id, started_by, is_vip, is_unlimited, scheduled_end, session_type, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                room_id, req.user.id, isVip, isUnlimited,
                scheduledEnd, session_type || 'walk_in', notes || null
            ]
        );

        // 🔄 Update room status to 'busy'
        await query('UPDATE rooms SET status = $1 WHERE id = $2', ['busy', room_id]);

        // 📝 Log action
        await logAction({
            branchId: req.user.branch_id,
            userId: req.user.id,
            action: 'session_start',
            entityType: 'session',
            entityId: sessionResult.rows[0].id,
            newValues: { room_id, is_vip: isVip, duration_minutes, scheduled_end: scheduledEnd },
            ipAddress: getClientIP(req)
        });

        res.status(201).json({
            message: 'Sessiya boshlandi!',
            session: sessionResult.rows[0],
            room: room.name
        });
    } catch (err) {
        console.error('❌ StartSession error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// ⏹️ POST /api/sessions/:id/stop — Stop a session & generate bill receipt
// 🔒 FIX #4: Transaction bilan atomik operatsiya (session update + room status)
const stopSession = async (req, res) => {
    const client = await pool.connect();
    try {
        const { payment_method, discount_amount, discount_reason } = req.body;

        // 🔒 Begin transaction
        await client.query('BEGIN');

        // 🔍 Get active session
        const sessionResult = await client.query(
            `SELECT s.*, r.hourly_rate, r.name as room_name, r.console_type
             FROM sessions s
             JOIN rooms r ON s.room_id = r.id
             WHERE s.id = $1 AND s.status = 'active'`,
            [req.params.id]
        );

        if (sessionResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Faol sessiya topilmadi.' });
        }

        const session = sessionResult.rows[0];
        const endTime = new Date();

        // ⏱️ Calculate duration
        const durationMinutes = calculateDurationMinutes(session.start_time, endTime);

        // 💰 Calculate time cost (VIP = same price as regular)
        const hourlyRate = parseFloat(session.hourly_rate);
        const timeCost = calculateTimeCost(durationMinutes, hourlyRate);

        // 🛒 Get products list + total for this session
        const productsListResult = await client.query(
            `SELECT sp.quantity, sp.price_at_sale, p.name as product_name, p.category
             FROM session_products sp
             JOIN products p ON sp.product_id = p.id
             WHERE sp.session_id = $1
             ORDER BY sp.created_at ASC`,
            [req.params.id]
        );
        const productItems = productsListResult.rows;
        const productsTotal = productItems.reduce((sum, p) => sum + (p.quantity * parseFloat(p.price_at_sale)), 0);

        // 💵 Calculate total
        const discount = parseFloat(discount_amount) || 0;
        const totalAmount = Math.max(0, timeCost + productsTotal - discount);

        // 📥 Update session (in transaction)
        await client.query(
            `UPDATE sessions SET
                end_time = $1, closed_by = $2, time_amount = $3,
                products_amount = $4, discount_amount = $5, discount_reason = $6,
                total_amount = $7, payment_method = $8, status = 'completed'
             WHERE id = $9`,
            [
                endTime, req.user.id, timeCost, productsTotal,
                discount, discount_reason || null, totalAmount,
                payment_method || 'cash', req.params.id
            ]
        );

        // 🔄 Update room status to 'free' (in same transaction)
        await client.query('UPDATE rooms SET status = $1 WHERE id = $2', ['free', session.room_id]);

        // ✅ Commit transaction — both updates succeed or both fail
        await client.query('COMMIT');

        // 📝 Log action (outside transaction — non-critical)
        await logAction({
            branchId: req.user.branch_id,
            userId: req.user.id,
            action: 'session_stop',
            entityType: 'session',
            entityId: req.params.id,
            newValues: {
                duration_minutes: Math.round(durationMinutes),
                time_amount: timeCost,
                products_amount: productsTotal,
                discount_amount: discount,
                total_amount: totalAmount,
                payment_method: payment_method || 'cash'
            },
            ipAddress: getClientIP(req)
        });

        // 🧾 Return detailed bill receipt
        res.json({
            message: 'Sessiya yakunlandi!',
            bill: {
                room_name: session.room_name,
                console_type: session.console_type,
                mode: session.is_vip ? 'VIP (cheksiz)' : 'Oddiy',
                start_time: session.start_time,
                end_time: endTime,
                duration_minutes: Math.round(durationMinutes),
                hourly_rate: hourlyRate,
                time_amount: timeCost,
                products: productItems.map(p => ({
                    name: p.product_name,
                    category: p.category,
                    quantity: p.quantity,
                    unit_price: parseFloat(p.price_at_sale),
                    subtotal: p.quantity * parseFloat(p.price_at_sale)
                })),
                products_amount: productsTotal,
                discount_amount: discount,
                discount_reason: discount_reason || null,
                total_amount: totalAmount,
                payment_method: payment_method || 'cash'
            }
        });
    } catch (err) {
        // 🔒 Rollback on any error
        await client.query('ROLLBACK');
        console.error('❌ StopSession error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    } finally {
        // 🔓 Always release client back to pool
        client.release();
    }
};

// 💎 PUT /api/sessions/:id/vip — Toggle VIP mode on active session
// 🔒 FIX #5: is_unlimited ham is_vip bilan birga yangilanadi
const toggleVip = async (req, res) => {
    try {
        const result = await query(
            `UPDATE sessions SET is_vip = NOT is_vip, is_unlimited = NOT is_unlimited
             WHERE id = $1 AND status = 'active' RETURNING *`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Faol sessiya topilmadi.' });
        }

        // 📝 Log action
        await logAction({
            branchId: req.user.branch_id,
            userId: req.user.id,
            action: 'session_vip_toggle',
            entityType: 'session',
            entityId: req.params.id,
            newValues: { is_vip: result.rows[0].is_vip, is_unlimited: result.rows[0].is_unlimited },
            ipAddress: getClientIP(req)
        });

        res.json({
            message: result.rows[0].is_vip ? '💎 VIP yoqildi!' : '📋 VIP o\'chirildi.',
            session: result.rows[0]
        });
    } catch (err) {
        console.error('❌ ToggleVip error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// 🛒 POST /api/sessions/:id/products — Add product to session
// 🔒 FIX #3: Transaction + FOR UPDATE lock — race condition oldini olish
const addProductToSession = async (req, res) => {
    const client = await pool.connect();
    try {
        const { product_id, quantity } = req.body;

        if (!product_id || !quantity || quantity < 1) {
            client.release();
            return res.status(400).json({ error: 'Mahsulot va soni kiritilishi shart.' });
        }

        // 🔒 Begin transaction
        await client.query('BEGIN');

        // 🔍 Check session is active
        const sessionCheck = await client.query(
            'SELECT id FROM sessions WHERE id = $1 AND status = $2',
            [req.params.id, 'active']
        );
        if (sessionCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).json({ error: 'Faol sessiya topilmadi.' });
        }

        // 🔒 Get product info with FOR UPDATE lock — prevents race condition!
        const productResult = await client.query(
            'SELECT * FROM products WHERE id = $1 AND branch_id = $2 AND is_active = true FOR UPDATE',
            [product_id, req.user.branch_id]
        );

        if (productResult.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).json({ error: 'Mahsulot topilmadi.' });
        }

        const product = productResult.rows[0];

        // 📊 Check stock — now safe from race condition!
        if (product.quantity < quantity) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(400).json({
                error: `⚠️ Yetarli mahsulot yo'q. Qoldiq: ${product.quantity}`
            });
        }

        // 📥 Add product to session (in transaction)
        await client.query(
            `INSERT INTO session_products (session_id, product_id, quantity, price_at_sale, added_by)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.params.id, product_id, quantity, product.sell_price, req.user.id]
        );

        // 📉 Decrease product stock (in transaction)
        await client.query(
            'UPDATE products SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [quantity, product_id]
        );

        // 💰 Update session products_amount (in transaction)
        const totalResult = await client.query(
            'SELECT COALESCE(SUM(quantity * price_at_sale), 0) as total FROM session_products WHERE session_id = $1',
            [req.params.id]
        );
        await client.query(
            'UPDATE sessions SET products_amount = $1 WHERE id = $2',
            [totalResult.rows[0].total, req.params.id]
        );

        // ✅ Commit transaction — all operations succeed atomically
        await client.query('COMMIT');

        // 📝 Log action (outside transaction — non-critical)
        await logAction({
            branchId: req.user.branch_id,
            userId: req.user.id,
            action: 'session_product_add',
            entityType: 'session_product',
            entityId: req.params.id,
            newValues: { product_id, product_name: product.name, quantity, price: product.sell_price },
            ipAddress: getClientIP(req)
        });

        res.json({
            message: `✅ ${product.name} x${quantity} qo'shildi!`,
            product_name: product.name,
            quantity,
            price: product.sell_price,
            remaining_stock: product.quantity - quantity
        });
    } catch (err) {
        // 🔒 Rollback on any error
        await client.query('ROLLBACK');
        console.error('❌ AddProduct error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    } finally {
        // 🔓 Always release client back to pool
        client.release();
    }
};

// 📋 GET /api/sessions/active — Get all active sessions
const getActiveSessions = async (req, res) => {
    try {
        const result = await query(
            `SELECT s.*, r.name as room_name, r.hourly_rate,
                    u.full_name as started_by_name
             FROM sessions s
             JOIN rooms r ON s.room_id = r.id
             JOIN users u ON s.started_by = u.id
             WHERE s.status = 'active' AND r.branch_id = $1
             ORDER BY s.start_time ASC`,
            [req.user.branch_id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('❌ GetActiveSessions error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// 📋 GET /api/sessions/:id — Get session details with products
const getSessionDetails = async (req, res) => {
    try {
        // 🎮 Get session info
        const sessionResult = await query(
            `SELECT s.*, r.name as room_name, r.hourly_rate,
                    u1.full_name as started_by_name,
                    u2.full_name as closed_by_name
             FROM sessions s
             JOIN rooms r ON s.room_id = r.id
             JOIN users u1 ON s.started_by = u1.id
             LEFT JOIN users u2 ON s.closed_by = u2.id
             WHERE s.id = $1`,
            [req.params.id]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Sessiya topilmadi.' });
        }

        // 🛒 Get session products
        const productsResult = await query(
            `SELECT sp.*, p.name as product_name, p.category
             FROM session_products sp
             JOIN products p ON sp.product_id = p.id
             WHERE sp.session_id = $1
             ORDER BY sp.created_at ASC`,
            [req.params.id]
        );

        res.json({
            session: sessionResult.rows[0],
            products: productsResult.rows
        });
    } catch (err) {
        console.error('❌ GetSessionDetails error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

module.exports = {
    startSession, stopSession, toggleVip,
    addProductToSession, getActiveSessions, getSessionDetails
};
