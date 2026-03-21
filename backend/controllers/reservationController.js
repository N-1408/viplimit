// ============================================
// 📁 File: backend/controllers/reservationController.js — Reservation Controller
// 👤 Author: User with AI
// 📝 Description: Handles logic for booking rooms.
// 📅 Created: 2026-03-21 (Tashkent Time)
// ============================================

const { query } = require('../config/database');
const { logAction, getClientIP } = require('../middleware/auditLogger');

// ➕ POST /api/reservations — Create a new reservation
const createReservation = async (req, res) => {
    try {
        const { room_id, customer_name, customer_phone, reserved_from, reserved_until, notes } = req.body;
        console.log('📝 Reservation attempt:', { room_id, customer_phone, reserved_from, reserved_until });

        if (!room_id || !customer_phone || !reserved_from || !reserved_until) {
            return res.status(400).json({ error: 'Xona, Telefon raqami, Boshlanish va Tugash vaqti kiritilishi shart.' });
        }

        // Optional: Check if the room is already booked in that timeframe
        const overlapCheck = await query(
            `SELECT id FROM reservations 
             WHERE room_id = $1 
               AND status IN ('pending', 'confirmed')
               AND (
                   (reserved_from < $3 AND reserved_until > $2)
               )`,
            [room_id, reserved_from, reserved_until]
        );

        if (overlapCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Ushbu xona tanlangan vaqtda allaqachon bron qilingan.' });
        }

        const result = await query(
            `INSERT INTO reservations (room_id, branch_id, customer_name, customer_phone, reserved_from, reserved_until, status, notes, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8) RETURNING *`,
            [room_id, req.user.branch_id, customer_name, customer_phone || null, reserved_from, reserved_until, notes || null, req.user.id]
        );

        // 📝 Log action
        await logAction({
            branchId: req.user.branch_id,
            userId: req.user.id,
            action: 'reservation_create',
            entityType: 'reservation',
            entityId: result.rows[0].id,
            newValues: result.rows[0],
            ipAddress: getClientIP(req)
        });

        // Emit socket event to update clients
        if (req.io) {
            req.io.to(`branch_${req.user.branch_id}`).emit('rooms_updated');
        }

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('❌ CreateReservation error:', err.message);
        res.status(500).json({ error: 'Server xatosi joriy qilinishda.' });
    }
};

// ❌ PUT /api/reservations/:id/cancel — Cancel a reservation
const cancelReservation = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `UPDATE reservations 
             SET status = 'cancelled' 
             WHERE id = $1 AND branch_id = $2 RETURNING *`,
            [id, req.user.branch_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Bron topilmadi.' });
        }

        // 📝 Log action
        await logAction({
            branchId: req.user.branch_id,
            userId: req.user.id,
            action: 'reservation_cancel',
            entityType: 'reservation',
            entityId: id,
            ipAddress: getClientIP(req)
        });

        // Emit socket event to update clients
        if (req.io) {
            req.io.to(`branch_${req.user.branch_id}`).emit('rooms_updated');
        }

        res.json({ message: '✅ Bron bekor qilindi!' });
    } catch (err) {
        console.error('❌ CancelReservation error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

module.exports = { createReservation, cancelReservation };
