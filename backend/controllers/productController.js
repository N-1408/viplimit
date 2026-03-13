// ============================================
// 📁 File: backend/controllers/productController.js — Product & Inventory Controller
// 👤 Author: User with AI
// 📝 Description: Manages product catalog and inventory for the game club.
//    Handles CRUD for products, stock tracking, low-stock alerts,
//    and product category management.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================

const { query } = require('../config/database');
const { logAction, getClientIP } = require('../middleware/auditLogger');

// 📋 GET /api/products — Get all products for current branch
const getAllProducts = async (req, res) => {
    try {
        const result = await query(
            `SELECT p.*, 
                    CASE WHEN p.quantity <= p.low_stock_threshold THEN true ELSE false END as is_low_stock,
                    CASE WHEN p.quantity = 0 THEN true ELSE false END as is_out_of_stock
             FROM products p
             WHERE p.branch_id = $1 AND p.is_active = true
             ORDER BY p.category ASC, p.name ASC`,
            [req.user.branch_id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('❌ GetAllProducts error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// ➕ POST /api/products — Create a new product
const createProduct = async (req, res) => {
    try {
        const { name, category, cost_price, sell_price, quantity, low_stock_threshold } = req.body;

        if (!name || !sell_price) {
            return res.status(400).json({ error: 'Mahsulot nomi va sotish narxi kiritilishi shart.' });
        }

        const result = await query(
            `INSERT INTO products (branch_id, name, category, cost_price, sell_price, quantity, low_stock_threshold)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                req.user.branch_id, name, category || 'Boshqa',
                cost_price || 0, sell_price, quantity || 0,
                low_stock_threshold || 5
            ]
        );

        // 📝 Log action
        await logAction({
            branchId: req.user.branch_id,
            userId: req.user.id,
            action: 'product_create',
            entityType: 'product',
            entityId: result.rows[0].id,
            newValues: result.rows[0],
            ipAddress: getClientIP(req)
        });

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('❌ CreateProduct error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// ✏️ PUT /api/products/:id — Update a product
const updateProduct = async (req, res) => {
    try {
        const { name, category, cost_price, sell_price, quantity, low_stock_threshold, is_active } = req.body;

        // 🔍 Get old values for audit
        const oldResult = await query('SELECT * FROM products WHERE id = $1 AND branch_id = $2',
            [req.params.id, req.user.branch_id]);

        if (oldResult.rows.length === 0) {
            return res.status(404).json({ error: 'Mahsulot topilmadi.' });
        }

        const result = await query(
            `UPDATE products SET
                name = COALESCE($1, name),
                category = COALESCE($2, category),
                cost_price = COALESCE($3, cost_price),
                sell_price = COALESCE($4, sell_price),
                quantity = COALESCE($5, quantity),
                low_stock_threshold = COALESCE($6, low_stock_threshold),
                is_active = COALESCE($7, is_active),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $8 AND branch_id = $9 RETURNING *`,
            [name, category, cost_price, sell_price, quantity, low_stock_threshold, is_active,
                req.params.id, req.user.branch_id]
        );

        // 📝 Log action
        await logAction({
            branchId: req.user.branch_id,
            userId: req.user.id,
            action: 'product_update',
            entityType: 'product',
            entityId: req.params.id,
            oldValues: oldResult.rows[0],
            newValues: result.rows[0],
            ipAddress: getClientIP(req)
        });

        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ UpdateProduct error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// 🗑️ DELETE /api/products/:id — Soft delete a product
const deleteProduct = async (req, res) => {
    try {
        const result = await query(
            'UPDATE products SET is_active = false WHERE id = $1 AND branch_id = $2 RETURNING *',
            [req.params.id, req.user.branch_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Mahsulot topilmadi.' });
        }

        // 📝 Log action
        await logAction({
            branchId: req.user.branch_id,
            userId: req.user.id,
            action: 'product_delete',
            entityType: 'product',
            entityId: req.params.id,
            ipAddress: getClientIP(req)
        });

        res.json({ message: '✅ Mahsulot o\'chirildi.' });
    } catch (err) {
        console.error('❌ DeleteProduct error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// 📦 PUT /api/products/:id/restock — Add stock to a product
const restockProduct = async (req, res) => {
    try {
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Qo\'shiladigan miqdorni kiriting.' });
        }

        const result = await query(
            `UPDATE products SET 
                quantity = quantity + $1, 
                updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 AND branch_id = $3 RETURNING *`,
            [quantity, req.params.id, req.user.branch_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Mahsulot topilmadi.' });
        }

        // 📝 Log action
        await logAction({
            branchId: req.user.branch_id,
            userId: req.user.id,
            action: 'product_restock',
            entityType: 'product',
            entityId: req.params.id,
            newValues: { added_quantity: quantity, new_total: result.rows[0].quantity },
            ipAddress: getClientIP(req)
        });

        res.json({
            message: `✅ ${quantity} dona qo'shildi. Yangi qoldiq: ${result.rows[0].quantity}`,
            product: result.rows[0]
        });
    } catch (err) {
        console.error('❌ RestockProduct error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

// ⚠️ GET /api/products/alerts — Get low-stock and out-of-stock products
const getStockAlerts = async (req, res) => {
    try {
        const result = await query(
            `SELECT * FROM products 
             WHERE branch_id = $1 AND is_active = true 
                AND quantity <= low_stock_threshold
             ORDER BY quantity ASC`,
            [req.user.branch_id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('❌ GetStockAlerts error:', err.message);
        res.status(500).json({ error: 'Server xatosi.' });
    }
};

module.exports = { getAllProducts, createProduct, updateProduct, deleteProduct, restockProduct, getStockAlerts };
