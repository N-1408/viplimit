// 📁 migrate_expenses.js — One-time migration to create expenses table
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrate() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS expenses (
                id          SERIAL PRIMARY KEY,
                branch_id   INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
                user_id     INT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
                amount      DECIMAL(14, 2) NOT NULL,
                currency    VARCHAR(5) NOT NULL DEFAULT 'UZS',
                category    VARCHAR(50) NOT NULL DEFAULT 'Boshqa',
                description TEXT,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ expenses table created (or already exists)');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        pool.end();
    }
}

migrate();
