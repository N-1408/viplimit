// ============================================
// 📁 File: backend/controllers/reportController.js — Reports & Analytics Controller
// 👤 Author: User with AI
// 📝 Description: Generates business reports for game club owners.
//    Includes daily cash reports, room profitability analysis,
//    product sales analytics, and revenue trends over time.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================

const { query } = require('../config/database');

// 💰 GET /api/reports/daily — Daily cash report
const getDailyReport = async (req, res) => {
    try {
        const { date } = req.query; // 📅 Format: YYYY-MM-DD
        const reportDate = date || new Date().toISOString().split('T')[0];

        // 💵 Total revenue for the day
        const revenueResult = await query(
            `SELECT 
                COUNT(*) as total_sessions,
                COALESCE(SUM(total_amount), 0) as total_revenue,
                COALESCE(SUM(time_amount), 0) as time_revenue,
                COALESCE(SUM(products_amount), 0) as products_revenue,
                COALESCE(SUM(discount_amount), 0) as total_discounts,
                COUNT(CASE WHEN is_vip = true THEN 1 END) as vip_sessions,
                COUNT(CASE WHEN payment_method = 'cash' THEN 1 END) as cash_payments,
                COUNT(CASE WHEN payment_method = 'card' THEN 1 END) as card_payments,
                COUNT(CASE WHEN payment_method = 'transfer' THEN 1 END) as transfer_payments
             FROM sessions
             WHERE DATE(start_time + interval '5 hours') = $1 AND status = 'completed'
               AND room_id IN (SELECT id FROM rooms WHERE branch_id = $2)`,
            [reportDate, req.user.branch_id]
        );

        // 🚪 Revenue by room
        const roomRevenueResult = await query(
            `SELECT r.name as room_name, r.console_type,
                    COUNT(s.id) as sessions_count,
                    COALESCE(SUM(s.total_amount), 0) as room_revenue,
                    COALESCE(AVG(EXTRACT(EPOCH FROM (s.end_time - s.start_time))/60), 0) as avg_duration_min
             FROM rooms r
             LEFT JOIN sessions s ON r.id = s.room_id 
                AND DATE(s.start_time + interval '5 hours') = $1 AND s.status = 'completed'
             WHERE r.branch_id = $2 AND r.is_active = true
             GROUP BY r.id, r.name, r.console_type
             ORDER BY room_revenue DESC`,
            [reportDate, req.user.branch_id]
        );

        // 🛒 Top sold products
        const productSalesResult = await query(
            `SELECT p.name, p.category,
                    SUM(sp.quantity) as total_sold,
                    SUM(sp.quantity * sp.price_at_sale) as total_sales
             FROM session_products sp
             JOIN products p ON sp.product_id = p.id
             JOIN sessions s ON sp.session_id = s.id
             WHERE DATE(s.start_time + interval '5 hours') = $1 AND s.status = 'completed'
               AND p.branch_id = $2
             GROUP BY p.id, p.name, p.category
             ORDER BY total_sales DESC
             LIMIT 10`,
            [reportDate, req.user.branch_id]
        );

        res.json({
            date: reportDate,
            summary: revenueResult.rows[0],
            rooms: roomRevenueResult.rows,
            top_products: productSalesResult.rows
        });
    } catch (err) {
        console.error('❌ DailyReport error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// 📊 GET /api/reports/range — Revenue report for a date range
const getRangeReport = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'start_date va end_date kiritilishi shart.' });
        }

        // 📈 Daily revenue trend
        const trendResult = await query(
            `SELECT DATE(start_time + interval '5 hours') as date,
                    COUNT(*) as sessions,
                    COALESCE(SUM(total_amount), 0) as revenue,
                    COALESCE(SUM(time_amount), 0) as time_revenue,
                    COALESCE(SUM(products_amount), 0) as products_revenue
             FROM sessions
             WHERE DATE(start_time + interval '5 hours') BETWEEN $1 AND $2 
               AND status = 'completed'
               AND room_id IN (SELECT id FROM rooms WHERE branch_id = $3)
             GROUP BY DATE(start_time + interval '5 hours')
             ORDER BY date ASC`,
            [start_date, end_date, req.user.branch_id]
        );

        // 🏆 Room profitability
        const roomProfitResult = await query(
            `SELECT r.name as room_name, r.console_type,
                    COUNT(s.id) as total_sessions,
                    COALESCE(SUM(s.total_amount), 0) as total_revenue,
                    COALESCE(AVG(s.total_amount), 0) as avg_per_session
             FROM rooms r
             LEFT JOIN sessions s ON r.id = s.room_id 
                AND DATE(s.start_time + interval '5 hours') BETWEEN $1 AND $2 AND s.status = 'completed'
             WHERE r.branch_id = $3 AND r.is_active = true
             GROUP BY r.id, r.name, r.console_type
             ORDER BY total_revenue DESC`,
            [start_date, end_date, req.user.branch_id]
        );

        // 📊 Summary with full fields (cash, card, products_amount, etc)
        const summaryResult = await query(
            `SELECT 
                COUNT(*) as total_sessions,
                COALESCE(SUM(total_amount), 0) as total_revenue,
                COALESCE(SUM(time_amount), 0) as time_revenue,
                COALESCE(SUM(products_amount), 0) as products_revenue,
                COALESCE(SUM(discount_amount), 0) as total_discounts,
                COUNT(CASE WHEN is_vip = true THEN 1 END) as vip_sessions,
                COUNT(CASE WHEN payment_method = 'cash' THEN 1 END) as cash_payments,
                COUNT(CASE WHEN payment_method = 'card' THEN 1 END) as card_payments,
                COUNT(CASE WHEN payment_method = 'transfer' THEN 1 END) as transfer_payments
             FROM sessions
             WHERE DATE(start_time AT TIME ZONE 'Asia/Tashkent') BETWEEN $1 AND $2 AND status = 'completed'
               AND room_id IN (SELECT id FROM rooms WHERE branch_id = $3)`,
            [start_date, end_date, req.user.branch_id]
        );

        // 🛒 Top sold products for range
        const productSalesResult = await query(
            `SELECT p.name, p.category,
                    SUM(sp.quantity) as total_sold,
                    SUM(sp.quantity * sp.price_at_sale) as total_sales
             FROM session_products sp
             JOIN products p ON sp.product_id = p.id
             JOIN sessions s ON sp.session_id = s.id
             WHERE DATE(s.start_time + interval '5 hours') BETWEEN $1 AND $2 AND s.status = 'completed'
               AND p.branch_id = $3
             GROUP BY p.id, p.name, p.category
             ORDER BY total_sales DESC
             LIMIT 10`,
            [start_date, end_date, req.user.branch_id]
        );

        res.json({
            period: { start_date, end_date },
            summary: summaryResult.rows[0],
            daily_trend: trendResult.rows,
            room_profitability: roomProfitResult.rows,
            top_products: productSalesResult.rows
        });
    } catch (err) {
        console.error('❌ RangeReport error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// 🛒 GET /api/reports/products — Product sales report
const getProductSalesReport = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const startDate = start_date || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
        const endDate = end_date || new Date().toISOString().split('T')[0];

        const result = await query(
            `SELECT p.name, p.category, p.sell_price, p.cost_price, p.quantity as current_stock,
                    COALESCE(SUM(sp.quantity), 0) as total_sold,
                    COALESCE(SUM(sp.quantity * sp.price_at_sale), 0) as total_revenue,
                    COALESCE(SUM(sp.quantity * p.cost_price), 0) as total_cost,
                    COALESCE(SUM(sp.quantity * (sp.price_at_sale - p.cost_price)), 0) as profit
             FROM products p
             LEFT JOIN session_products sp ON p.id = sp.product_id
                AND sp.session_id IN (
                    SELECT id FROM sessions WHERE DATE(start_time AT TIME ZONE 'Asia/Tashkent') BETWEEN $1 AND $2 AND status = 'completed'
                )
             WHERE p.branch_id = $3 AND p.is_active = true
             GROUP BY p.id, p.name, p.category, p.sell_price, p.cost_price, p.quantity
             ORDER BY total_sold DESC`,
            [startDate, endDate, req.user.branch_id]
        );

        res.json({
            period: { start_date: startDate, end_date: endDate },
            products: result.rows
        });
    } catch (err) {
        console.error('❌ ProductSalesReport error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

module.exports = { getDailyReport, getRangeReport, getProductSalesReport };
