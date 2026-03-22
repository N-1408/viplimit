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
        await pool.query(`ALTER TABLE branches ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"consoles": ["PS3", "PS4", "PS5"]}'::jsonb;`);
        console.log("Migration successful: Added settings column to branches");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        pool.end();
    }
}

migrate();
