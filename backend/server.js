// ============================================
// 📁 File: backend/server.js — VipLimit Backend Server Entry Point
// 👤 Author: User with AI
// 📝 Description: Main server file for VipLimit Game Club Management System.
//    Initializes Express server with CORS, Socket.io for real-time updates,
//    and registers all API routes. Handles graceful shutdown.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================

// 🔧 Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { pool } = require('./config/database');

// 📦 Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// 🔌 Initialize Socket.io for real-time room status updates
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

// ============================================
// 🔧 MIDDLEWARE
// ============================================

// 🌐 CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// 📥 Parse JSON request bodies
app.use(express.json());

// 🔌 Make io accessible in routes (for real-time events)
app.use((req, res, next) => {
    req.io = io;
    next();
});

// ============================================
// 📋 API ROUTES
// ============================================

// 🔑 Authentication routes
app.use('/api/auth', require('./routes/authRoutes'));

// 🚪 Room management routes
app.use('/api/rooms', require('./routes/roomRoutes'));

// 📅 Reservation routes
app.use('/api/reservations', require('./routes/reservationRoutes'));

// 🎮 Session & billing routes
app.use('/api/sessions', require('./routes/sessionRoutes'));

// 🛒 Product & inventory routes
app.use('/api/products', require('./routes/productRoutes'));

// 📊 Reports & analytics routes
app.use('/api/reports', require('./routes/reportRoutes'));

// ============================================
// 🏠 HEALTH CHECK
// ============================================

// ✅ GET / — Server health check
app.get('/', (req, res) => {
    res.json({
        status: '✅ VipLimit API is running!',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// ✅ GET /api/health — Detailed health check
app.get('/api/health', async (req, res) => {
    try {
        // 🗄️ Test database connection
        await pool.query('SELECT 1');
        res.json({
            status: 'healthy',
            database: 'connected',
            uptime: process.uptime()
        });
    } catch (err) {
        res.status(500).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: err.message
        });
    }
});

// ============================================
// 🔌 SOCKET.IO — Real-time events
// ============================================

io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // 📋 Join branch room for targeted updates
    socket.on('join_branch', (branchId) => {
        socket.join(`branch_${branchId}`);
        console.log(`👤 Socket ${socket.id} joined branch_${branchId}`);
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
    });
});

// ============================================
// ❌ ERROR HANDLING
// ============================================

// 🚫 404 handler
app.use((req, res) => {
    res.status(404).json({ error: '❌ Endpoint topilmadi.' });
});

// 💥 Global error handler
app.use((err, req, res, next) => {
    console.error('💥 Server error:', err.message);
    res.status(500).json({ error: 'Server xatosi yuz berdi.' });
});

// ============================================
// 🚀 START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log('');
    console.log('🎮 ============================================');
    console.log(`🚀 VipLimit API server running on port ${PORT}`);
    console.log(`📅 Started at: ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`);
    console.log('🎮 ============================================');
    console.log('');
});

// 🔄 Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 Graceful shutdown initiated...');
    server.close(() => {
        pool.end();
        console.log('✅ Server stopped gracefully.');
        process.exit(0);
    });
});
