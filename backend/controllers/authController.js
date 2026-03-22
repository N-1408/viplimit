// ============================================
// 📁 File: backend/controllers/authController.js — Authentication Controller
// 👤 Author: User with AI
// 📝 Description: Handles user authentication including login, token refresh,
//    and initial owner account setup. Uses bcrypt for password hashing
//    and JWT for stateless session management.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { logAction, getClientIP } = require('../middleware/auditLogger');

// 🔑 POST /api/auth/login — User login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // ✅ Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username va password kiritilishi shart.' });
        }

        // 🔍 Find user by username
        const result = await query(
            'SELECT * FROM users WHERE username = $1 AND is_active = true',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: '❌ Username yoki parol noto\'g\'ri.' });
        }

        const user = result.rows[0];

        // 🔒 Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: '❌ Username yoki parol noto\'g\'ri.' });
        }

        // 🎫 Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role,
                branch_id: user.branch_id,
                full_name: user.full_name
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // ⏱️ Token 24 soat amal qiladi
        );

        // 📝 Log login action
        await logAction({
            branchId: user.branch_id,
            userId: user.id,
            action: 'login',
            entityType: 'user',
            entityId: user.id,
            ipAddress: getClientIP(req)
        });

        // ✅ Return token and user info
        res.json({
            message: '✅ Muvaffaqiyatli kirildi!',
            token,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                role: user.role,
                branch_id: user.branch_id
            }
        });
    } catch (err) {
        console.error('❌ Login error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// 👤 GET /api/auth/me — Get current user info
const getMe = async (req, res) => {
    try {
        const result = await query(
            'SELECT id, username, full_name, role, branch_id, is_active, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ GetMe error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// 🔧 POST /api/auth/setup — Initial owner setup (first run only)
const setupOwner = async (req, res) => {
    try {
        // 🔍 Check if any owner exists
        const existing = await query('SELECT id FROM users WHERE role = $1', ['owner']);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Owner allaqachon mavjud.' });
        }

        const { username, password, full_name } = req.body;

        if (!username || !password || !full_name) {
            return res.status(400).json({ error: 'Username, password va full_name kiritilishi shart.' });
        }

        // 🔒 Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 📥 Create owner user (branch_id = 1, default branch)
        const result = await query(
            `INSERT INTO users (branch_id, username, password_hash, full_name, role)
             VALUES (1, $1, $2, $3, 'owner') RETURNING id, username, full_name, role`,
            [username, password_hash, full_name]
        );

        res.status(201).json({
            message: '✅ Owner muvaffaqiyatli yaratildi!',
            user: result.rows[0]
        });
    } catch (err) {
        console.error('❌ Setup error:', err.message);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Bu username allaqachon band.' });
        }
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// ✏️ PUT /api/auth/update-credentials — Update login and password
const updateCredentials = async (req, res) => {
    try {
        const { currentPassword, newUsername, newPassword } = req.body;

        if (!currentPassword || (!newUsername && !newPassword)) {
            return res.status(400).json({ error: "Barcha kerakli maydonlarni to'ldiring." });
        }

        const result = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Foydalanuvchi topilmadi." });

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: "Eski parol noto'g'ri." });
        }

        let updates = [];
        let values = [];
        let idx = 1;

        if (newUsername && newUsername !== user.username) {
            const existing = await query('SELECT id FROM users WHERE username = $1', [newUsername]);
            if (existing.rows.length > 0) return res.status(400).json({ error: "Bu username band." });

            updates.push(`username = $${idx++}`);
            values.push(newUsername);
        }

        if (newPassword) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(newPassword, salt);
            updates.push(`password_hash = $${idx++}`);
            values.push(password_hash);
        }

        if (updates.length > 0) {
            values.push(req.user.id);
            await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, values);
        }

        res.json({ message: "Ma'lumotlar muvaffaqiyatli yangilandi!" });
    } catch (err) {
        console.error('Update credentials error:', err.message);
        res.status(500).json({ error: "Server xatosi." });
    }
};

module.exports = { login, getMe, setupOwner, updateCredentials };
