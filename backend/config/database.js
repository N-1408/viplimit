// ============================================
// 📁 File: backend/config/database.js — PostgreSQL Database Connection
// 👤 Author: User with AI
// 📝 Description: Configures and exports PostgreSQL connection pool.
//    Supports both DATABASE_URL (Supabase/production) and individual
//    env variables (local development). Includes SSL for production.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-04-03 01:28 (Tashkent) — 🤖 Supabase DATABASE_URL + SSL qo'shildi
// ============================================

const { Pool } = require('pg');

// 🗄️ PostgreSQL connection — DATABASE_URL yoki alohida env variables
const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },  // 🔒 Supabase SSL
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
    }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'viplimit',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
    };

const pool = new Pool(poolConfig);

// ✅ Test database connection on startup
pool.on('connect', () => {
    console.log('✅ PostgreSQL connected successfully');
});

// ❌ Handle connection errors
pool.on('error', (err) => {
    console.error('❌ PostgreSQL connection error:', err.message);
});

module.exports = {
    pool,
    // 🔧 Helper function for queries
    query: (text, params) => pool.query(text, params)
};

