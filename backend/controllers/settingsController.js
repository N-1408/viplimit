const { query } = require('../config/database');

// 🔍 GET /api/settings/consoles
const getConsoles = async (req, res) => {
    try {
        const result = await query('SELECT settings FROM branches WHERE id = $1', [req.user.branch_id]);
        const settings = result.rows[0]?.settings || {};
        res.json({ consoles: settings.consoles || ['PS5', 'PS4'] });
    } catch (err) {
        console.error('Settings error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// ✏️ PUT /api/settings/consoles
const updateConsoles = async (req, res) => {
    try {
        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            return res.status(403).json({ error: "Sizda bunday huquq yo'q." });
        }

        const { consoles } = req.body;
        if (!Array.isArray(consoles)) {
            return res.status(400).json({ error: "Noto'g'ri format." });
        }

        const currentResult = await query('SELECT settings FROM branches WHERE id = $1', [req.user.branch_id]);
        const settings = currentResult.rows[0]?.settings || {};
        settings.consoles = consoles;

        await query('UPDATE branches SET settings = $1::jsonb WHERE id = $2', [settings, req.user.branch_id]);

        res.json({ message: "Konsollar yangilandi", consoles: settings.consoles });
    } catch (err) {
        console.error('Settings error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};
// 🏢 PUT /api/settings/club-name
const updateClubName = async (req, res) => {
    try {
        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            return res.status(403).json({ error: "Sizda bunday huquq yo'q." });
        }
        const { club_name } = req.body;
        if (!club_name || club_name.trim() === '') {
            return res.status(400).json({ error: "Club nomi bo'sh bo'lishi mumkin emas." });
        }
        await query('UPDATE branches SET name = $1 WHERE id = $2', [club_name, req.user.branch_id]);
        res.json({ message: "Game Club nomi muvaffaqiyatli o'zgartirildi!" });
    } catch (err) {
        console.error('Settings error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

module.exports = { getConsoles, updateConsoles, updateClubName };
