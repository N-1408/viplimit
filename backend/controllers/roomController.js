// ============================================
// 📁 File: backend/controllers/roomController.js — Room Management Controller
// 👤 Author: User with AI
// 📝 Description: Handles CRUD operations for game rooms.
//    Includes creating, updating, listing, and managing room statuses.
//    Room data includes console type, pricing, capacity, and availability.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-03-24 16:13 (Tashkent) — 🔒 #6: reorderRooms transaction ichiga olindi.
//    N+1 muammo hal qilindi — barcha UPDATE'lar atomik.
// ============================================

const { query, pool } = require('../config/database');
const { logAction, getClientIP } = require('../middleware/auditLogger');

// 📋 GET /api/rooms — Get all rooms for current branch
const getAllRooms = async (req, res) => {
    try {
        const result = await query(
            `SELECT r.*, 
                    s.id as active_session_id,
                    s.start_time as session_start,
                    s.is_vip as session_is_vip,
                    s.is_unlimited as session_is_unlimited,
                    s.scheduled_end as session_scheduled_end,
                    s.products_amount as session_products_amount,
                    res.id as reservation_id,
                    res.customer_name as reservation_customer,
                    res.customer_phone as reservation_phone,
                    res.reserved_from as reservation_from,
                    res.reserved_until as reservation_until,
                    res.notes as reservation_notes
             FROM rooms r
             LEFT JOIN sessions s ON r.id = s.room_id AND s.status = 'active'
             LEFT JOIN LATERAL (
                 SELECT * FROM reservations 
                 WHERE room_id = r.id AND status IN ('pending', 'confirmed') 
                   AND reserved_until > NOW()
                 ORDER BY reserved_from ASC
                 LIMIT 1
             ) res ON true
             WHERE r.branch_id = $1 AND r.is_active = true
             ORDER BY r.sort_order ASC, r.id ASC`,
            [req.user.branch_id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('❌ GetAllRooms error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// 🔍 GET /api/rooms/:id — Get single room details
const getRoomById = async (req, res) => {
    try {
        const result = await query(
            `SELECT r.*, 
                    s.id as active_session_id,
                    s.start_time as session_start,
                    s.is_vip as session_is_vip,
                    s.is_unlimited as session_is_unlimited,
                    s.scheduled_end as session_scheduled_end,
                    res.id as reservation_id,
                    res.customer_name as reservation_customer,
                    res.customer_phone as reservation_phone,
                    res.reserved_from as reservation_from,
                    res.reserved_until as reservation_until,
                    res.notes as reservation_notes
             FROM rooms r
             LEFT JOIN sessions s ON r.id = s.room_id AND s.status = 'active'
             LEFT JOIN LATERAL (
                 SELECT * FROM reservations 
                 WHERE room_id = r.id AND status IN ('pending', 'confirmed') 
                   AND reserved_until > NOW()
                 ORDER BY reserved_from ASC
                 LIMIT 1
             ) res ON true
             WHERE r.id = $1 AND r.branch_id = $2`,
            [req.params.id, req.user.branch_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Xona topilmadi.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ GetRoomById error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// ➕ POST /api/rooms — Create a new room
const createRoom = async (req, res) => {
    try {
        const { name, console_type, capacity, hourly_rate, vip_hourly_rate } = req.body;

        // ✅ Validate required fields
        if (!name || !hourly_rate || !vip_hourly_rate) {
            return res.status(400).json({ error: 'Xona nomi, oddiy narx va VIP narx kiritilishi shart.' });
        }

        const result = await query(
            `INSERT INTO rooms (branch_id, name, console_type, capacity, hourly_rate, vip_hourly_rate)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [req.user.branch_id, name, console_type || 'PS5', capacity || 2, hourly_rate, vip_hourly_rate]
        );

        // 📝 Log action
        await logAction({
            branchId: req.user.branch_id,
            userId: req.user.id,
            action: 'room_create',
            entityType: 'room',
            entityId: result.rows[0].id,
            newValues: result.rows[0],
            ipAddress: getClientIP(req)
        });

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('❌ CreateRoom error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// ✏️ PUT /api/rooms/:id — Update a room
const updateRoom = async (req, res) => {
    try {
        const { name, console_type, capacity, hourly_rate, vip_hourly_rate, is_active } = req.body;

        // 🔍 Get old values for audit log
        const oldResult = await query('SELECT * FROM rooms WHERE id = $1 AND branch_id = $2',
            [req.params.id, req.user.branch_id]);

        if (oldResult.rows.length === 0) {
            return res.status(404).json({ error: 'Xona topilmadi.' });
        }

        const result = await query(
            `UPDATE rooms SET 
                name = COALESCE($1, name),
                console_type = COALESCE($2, console_type),
                capacity = COALESCE($3, capacity),
                hourly_rate = COALESCE($4, hourly_rate),
                vip_hourly_rate = COALESCE($5, vip_hourly_rate),
                is_active = COALESCE($6, is_active)
             WHERE id = $7 AND branch_id = $8 RETURNING *`,
            [name, console_type, capacity, hourly_rate, vip_hourly_rate, is_active, req.params.id, req.user.branch_id]
        );

        // 📝 Log action
        await logAction({
            branchId: req.user.branch_id,
            userId: req.user.id,
            action: 'room_update',
            entityType: 'room',
            entityId: req.params.id,
            oldValues: oldResult.rows[0],
            newValues: result.rows[0],
            ipAddress: getClientIP(req)
        });

        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ UpdateRoom error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// 🗑️ DELETE /api/rooms/:id — Soft delete a room
const deleteRoom = async (req, res) => {
    try {
        const result = await query(
            'UPDATE rooms SET is_active = false WHERE id = $1 AND branch_id = $2 RETURNING *',
            [req.params.id, req.user.branch_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Xona topilmadi.' });
        }

        // 📝 Log action
        await logAction({
            branchId: req.user.branch_id,
            userId: req.user.id,
            action: 'room_delete',
            entityType: 'room',
            entityId: req.params.id,
            ipAddress: getClientIP(req)
        });

        res.json({ message: '✅ Xona o\'chirildi.' });
    } catch (err) {
        console.error('❌ DeleteRoom error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// 🔄 PUT /api/rooms/reorder — Reorder rooms
// 🔒 FIX #6: Transaction ichida — barcha UPDATE'lar atomik
const reorderRooms = async (req, res) => {
    const client = await pool.connect();
    try {
        const { order } = req.body; // [{ id: 1, sort_order: 0 }, { id: 2, sort_order: 1 }, ...]
        if (!order || !Array.isArray(order)) {
            client.release();
            return res.status(400).json({ error: "Noto'g'ri ma'lumot." });
        }

        // 🔒 Begin transaction — barcha xonalar tartibi atomik yangilanadi
        await client.query('BEGIN');

        for (const item of order) {
            await client.query(
                'UPDATE rooms SET sort_order = $1 WHERE id = $2 AND branch_id = $3',
                [item.sort_order, item.id, req.user.branch_id]
            );
        }

        // ✅ Commit — barcha tartiblar muvaffaqiyatli yangilandi
        await client.query('COMMIT');

        res.json({ message: '✅ Xonalar tartibi saqlandi.' });
    } catch (err) {
        // 🔒 Rollback on error
        await client.query('ROLLBACK');
        console.error('❌ ReorderRooms error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    } finally {
        // 🔓 Always release client back to pool
        client.release();
    }
};

module.exports = { getAllRooms, getRoomById, createRoom, updateRoom, deleteRoom, reorderRooms };
