// ============================================
// 📁 File: backend/routes/productRoutes.js — Product & Inventory API Routes
// 👤 Author: User with AI
// 📝 Description: Defines CRUD routes for products and inventory management.
//    Includes stock alerts and restock functionality.
//    All routes require authentication.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================

const express = require('express');
const router = express.Router();
const {
    getAllProducts, createProduct, updateProduct,
    deleteProduct, restockProduct, getStockAlerts
} = require('../controllers/productController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// 🔒 All routes require authentication
router.use(authenticateToken);

// ⚠️ GET /api/products/alerts — Low-stock alerts (must be before /:id)
router.get('/alerts', getStockAlerts);

// 📋 GET /api/products — List all products
router.get('/', getAllProducts);

// ➕ POST /api/products — Create product (manager/owner only)
router.post('/', authorizeRoles('manager', 'owner'), createProduct);

// ✏️ PUT /api/products/:id — Update product (manager/owner only)
router.put('/:id', authorizeRoles('manager', 'owner'), updateProduct);

// 📦 PUT /api/products/:id/restock — Restock product (manager/owner only)
router.put('/:id/restock', authorizeRoles('manager', 'owner'), restockProduct);

// 🗑️ DELETE /api/products/:id — Delete product (owner only)
router.delete('/:id', authorizeRoles('owner'), deleteProduct);

module.exports = router;
