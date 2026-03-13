// ============================================
// 📁 File: backend/config/database.js — PostgreSQL Database Connection
// 👤 Author: User with AI
// 📝 Description: Configures and exports PostgreSQL connection pool.
//    Uses environment variables for secure database credentials.
//    Provides a reusable query function for all database operations.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================

const { Pool } = require('pg');

// 🗄️ PostgreSQL connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'viplimit',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: 20,                    // 🔢 Maximum connections in pool
    idleTimeoutMillis: 30000,   // ⏱️ Close idle connections after 30s
    connectionTimeoutMillis: 2000 // ⏱️ Connection timeout 2s
});

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
