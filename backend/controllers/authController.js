// ============================================
// 📁 File: backend/controllers/authController.js — Authentication Controller
// 👤 Author: User with AI
// 📝 Description: Handles user authentication including login, token refresh,
//    and initial owner account setup. Uses bcrypt for password hashing
//    and JWT for stateless session management.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { query, pool } = require('../config/database');
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
            { expiresIn: '30d' } // ⏱️ Token 30 kun amal qiladi
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
            `SELECT u.id, u.username, u.full_name, u.role, u.branch_id, u.is_active, u.created_at, b.name as branch_name 
             FROM users u 
             LEFT JOIN branches b ON u.branch_id = b.id
             WHERE u.id = $1`,
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
            // 🔍 Branch-scoped unique check
            const existing = await query(
                'SELECT id FROM users WHERE branch_id = $1 AND username = $2',
                [user.branch_id, newUsername]
            );
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

// ============================================
// 🆕 POST /api/auth/register — Yangi Game Club yaratish
// Telegram bog'lanishi faqat tekshirilgan initData orqali amalga oshiriladi.
// ============================================
const register = async (req, res) => {
    const client = await pool.connect();
    try {
        const { club_name, username, password, full_name, init_data } = req.body;

        // ✅ Validate
        if (!club_name || !username || !password || !full_name) {
            client.release();
            return res.status(400).json({ error: "Club nomi, username, password va ism kiritilishi shart." });
        }

        // ✅ Parol va username formatini tekshirish
        if (String(password).length < 6) {
            client.release();
            return res.status(400).json({ error: "Parol kamida 6 belgidan iborat bo'lishi kerak." });
        }
        if (!/^[a-zA-Z0-9_]{3,30}$/.test(String(username))) {
            client.release();
            return res.status(400).json({ error: "Username 3-30 belgi, faqat harf, raqam va _ bo'lishi kerak." });
        }

        // 🔒 Telegram initData tekshirish (bor bo'lsa)
        const tgUser = verifyTelegramInitData(init_data);
        const telegramId = tgUser && tgUser.id ? String(tgUser.id) : null;

        await client.query('BEGIN');

        // 🏢 Yangi branch (game club) yaratish
        const branchResult = await client.query(
            `INSERT INTO branches (name, plan_id) VALUES ($1, 1) RETURNING id`,
            [String(club_name).trim()]
        );
        const branchId = branchResult.rows[0].id;

        // 🔒 Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // 👤 Owner user yaratish
        const userResult = await client.query(
            `INSERT INTO users (branch_id, username, password_hash, full_name, role)
             VALUES ($1, $2, $3, $4, 'owner') RETURNING id, username, full_name, role, branch_id`,
            [branchId, username, password_hash, full_name]
        );
        const user = userResult.rows[0];

        // 🤖 Telegram bog'lanishi — faqat imzosi tekshirilgan ID bilan
        if (telegramId) {
            await client.query(
                `INSERT INTO telegram_users (telegram_id, branch_id, user_id)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (telegram_id) DO UPDATE SET branch_id = $2, user_id = $3`,
                [telegramId, branchId, user.id]
            );
        }

        await client.query('COMMIT');

        // 🎫 JWT Token yaratish
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role,
                branch_id: user.branch_id,
                full_name: user.full_name,
                telegram_id: telegramId
            },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            message: '✅ Game Club muvaffaqiyatli yaratildi!',
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
        try { await client.query('ROLLBACK'); } catch (e) { /* noop */ }
        console.error('❌ Register error:', err.message);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Bu username allaqachon band.' });
        }
        res.status(500).json({ error: 'Server xatosi.' });
    } finally {
        client.release();
    }
};

// ============================================
// 🔒 Telegram initData tekshirish (HMAC-SHA256, rasmiy Telegram algoritmi)
// initData Telegram tomonidan imzolanadi — bu tashqaridan soxta telegram_id
// yuborib, boshqa foydalanuvchi nomidan kirishni (account takeover) imkonsiz qiladi.
// ============================================
const verifyTelegramInitData = (initData) => {
    const token = process.env.BOT_TOKEN;
    if (!token || !initData || typeof initData !== 'string') return null;

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;
    params.delete('hash');

    const dataCheckString = [...params.entries()]
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const a = Buffer.from(computedHash, 'hex');
    const b = Buffer.from(hash, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    // auth_date 24 soatdan eskirgan bo'lsa — qabul qilmaymiz
    const authDate = parseInt(params.get('auth_date') || '0', 10);
    if (authDate && Date.now() / 1000 - authDate > 86400) return null;

    try {
        return JSON.parse(params.get('user') || 'null');
    } catch (e) {
        return null;
    }
};

// ============================================
// 🤖 POST /api/auth/tg-auto-login — Telegram initData orqali avtomatik kirish
// Endi faqat Telegram o'zi imzolagan initData qabul qilinadi.
// ============================================
const tgAutoLogin = async (req, res) => {
    try {
        const { init_data } = req.body;

        // 🔒 initData imzosini tekshirish
        const tgUser = verifyTelegramInitData(init_data);
        if (!tgUser || !tgUser.id) {
            return res.status(401).json({ registered: false, error: "Telegram imzosi yaroqsiz." });
        }
        const telegram_id = String(tgUser.id);

        // 🔍 Telegram userni topish
        const tgResult = await query(
            'SELECT * FROM telegram_users WHERE telegram_id = $1',
            [telegram_id]
        );

        if (tgResult.rows.length === 0 || !tgResult.rows[0].user_id) {
            return res.json({ registered: false });
        }

        const tgUserRow = tgResult.rows[0];

        // 👤 User ma'lumotlarini olish
        const userResult = await query(
            'SELECT id, username, full_name, role, branch_id FROM users WHERE id = $1 AND is_active = true',
            [tgUserRow.user_id]
        );

        if (userResult.rows.length === 0) {
            return res.json({ registered: false });
        }

        const user = userResult.rows[0];

        // 🏢 Branch faolligini tekshirish
        const branchResult = await query(
            'SELECT is_enabled FROM branches WHERE id = $1',
            [user.branch_id]
        );

        if (branchResult.rows.length === 0 || !branchResult.rows[0].is_enabled) {
            return res.status(403).json({ error: "🚫 Sizning Game Club vaqtincha to'xtatilgan." });
        }

        // 🔒 Check if this user is Super Admin (faqat env orqali — hardcoded ID yo'q)
        const isSuperAdmin = String(telegram_id) === String(process.env.SUPER_ADMIN_TG_ID || '');

        // 🎫 JWT Token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role,
                branch_id: user.branch_id,
                full_name: user.full_name,
                telegram_id: telegram_id
            },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            registered: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                role: user.role,
                branch_id: user.branch_id
            },
            is_super_admin: isSuperAdmin
        });
    } catch (err) {
        console.error('❌ TG auto-login error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

module.exports = { login, getMe, setupOwner, updateCredentials, register, tgAutoLogin };
