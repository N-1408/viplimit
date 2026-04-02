// ============================================
// 📁 File: frontend/src/pages/ProductsPage.jsx — Products & Inventory Page
// 👤 Author: User with AI
// 📝 Description: Product catalog and inventory management page.
//    Shows all products in a table with stock levels, low-stock alerts,
//    and out-of-stock warnings. Supports CRUD and restocking.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-03-21 12:08 (Tashkent) — V6.0 Apple/Telegram UI Redesign:
//    - Inherited global CSS variables for tighter grid and paddings.
//    - Standardized list UI spacing.
// 2026-03-13 01:53 (Tashkent) — Redesigned with Lucide icons, improved
//    table styling, and modern modal design.
// 2026-03-13 05:22 (Tashkent) — UI Polish:
//    - Native <select> replaced with CustomSelect component
//    - 'Bekor' buttons renamed to 'Bekor qilish'
// 2026-03-14 21:26 (Tashkent) — Added premium DeleteConfirmModal (V5.0)
// 2026-03-14 21:42 (Tashkent) — Matched Delete Modal style to RoomsPage (V5.1)
// 2026-03-21 12:15 (Tashkent) — V6.1 Bug Fixes:
//    - Added global `Escape` key listener to intelligently collapse modals.
//    - Activated `autoFocus` on the form inputs for rapid keyboard `Enter` ops.
// ============================================

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import CustomSelect from '../components/CustomSelect';
import {
    Plus, Pencil, Trash2, Package, X, AlertTriangle,
    PackagePlus, ShoppingBag, Check, XCircle
} from 'lucide-react';

function ProductsPage() {
    const { hasRole } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showRestockModal, setShowRestockModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // product object to delete
    const [editProduct, setEditProduct] = useState(null);
    const [restockProduct, setRestockProductState] = useState(null);
    const [restockQty, setRestockQty] = useState(1);

    const [form, setForm] = useState({
        name: '', category: 'Ichimliklar', cost_price: '', sell_price: '',
        quantity: '', low_stock_threshold: 5
    });

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (err) { console.error('Products fetch error:', err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchProducts();

        // ⌨️ Global Keyboard Shortcuts
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setShowModal(false);
                setShowRestockModal(false);
                setShowDeleteConfirm(null);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editProduct) { await api.put(`/products/${editProduct.id}`, form); }
            else { await api.post('/products', form); }
            setShowModal(false);
            setEditProduct(null);
            fetchProducts();
        } catch (err) { alert(err.response?.data?.error || 'Xatolik'); }
    };

    const handleRestock = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/products/${restockProduct.id}/restock`, { quantity: restockQty });
            setShowRestockModal(false);
            fetchProducts();
        } catch (err) { alert(err.response?.data?.error || 'Xatolik'); }
    };

    const confirmDelete = async () => {
        if (!showDeleteConfirm) return;
        try {
            await api.delete(`/products/${showDeleteConfirm.id}`);
            setShowDeleteConfirm(null);
            fetchProducts();
        } catch (err) {
            alert(err.response?.data?.error || 'Xatolik');
        }
    };

    const openEdit = (product) => {
        setEditProduct(product);
        setForm({
            name: product.name, category: product.category, cost_price: product.cost_price,
            sell_price: product.sell_price, quantity: product.quantity, low_stock_threshold: product.low_stock_threshold
        });
        setShowModal(true);
    };

    if (loading) return <div className="flex-center" style={{ height: '50vh' }}><p className="text-muted">Yuklanmoqda...</p></div>;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title"><ShoppingBag size={24} /> Mahsulotlar</h1>
                    <p className="page-subtitle">
                        {products.length} ta mahsulot · {products.filter(p => p.is_low_stock).length} ta kam ·
                        {' '}{products.filter(p => p.is_out_of_stock).length} ta tugagan
                    </p>
                </div>
                {hasRole('manager', 'owner') && (
                    <button className="btn btn-primary" onClick={() => {
                        setEditProduct(null);
                        setForm({ name: '', category: 'Ichimliklar', cost_price: '', sell_price: '', quantity: '', low_stock_threshold: 5 });
                        setShowModal(true);
                    }}><Plus size={18} /> Yangi mahsulot</button>
                )}
            </div>

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                    <table>
                        <thead><tr><th>Nomi</th><th>Kategoriya</th><th>Olib kelish</th><th>Sotish</th><th>Qoldiq</th><th>Holat</th><th>Amallar</th></tr></thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id} className={p.is_out_of_stock ? 'out-of-stock' : p.is_low_stock ? 'low-stock' : ''}>
                                    <td data-label="Nomi"><strong>{p.name}</strong></td>
                                    <td data-label="Kategoriya">{p.category}</td>
                                    <td data-label="Olib kelish">{formatCurrency(p.cost_price)}</td>
                                    <td data-label="Sotish">{formatCurrency(p.sell_price)}</td>
                                    <td data-label="Qoldiq"><strong style={{ color: p.is_out_of_stock ? 'var(--accent-danger)' : p.is_low_stock ? 'var(--accent-warning)' : 'var(--text-primary)' }}>{p.quantity}</strong></td>
                                    <td data-label="Holat">
                                        {p.is_out_of_stock ? <span className="badge busy"><XCircle size={12} /> Tugadi</span>
                                            : p.is_low_stock ? <span className="badge vip"><AlertTriangle size={12} /> Kam</span>
                                                : <span className="badge free"><Check size={12} /> Bor</span>}
                                    </td>
                                    <td data-label="Amallar">
                                        <div className="flex gap-8">
                                            {hasRole('manager', 'owner') && (<>
                                                <button className="btn btn-ghost btn-icon" title="Tahrirlash" onClick={() => openEdit(p)}><Pencil size={14} /></button>
                                                <button className="btn btn-ghost btn-icon" title="Skladdan qo'shish" onClick={() => { setRestockProductState(p); setRestockQty(1); setShowRestockModal(true); }}><PackagePlus size={14} /></button>
                                            </>)}
                                            {hasRole('owner') && <button className="btn btn-ghost btn-icon" title="O'chirish" onClick={() => setShowDeleteConfirm(p)}><Trash2 size={14} /></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {products.length === 0 && <div className="text-center mt-24"><p className="text-muted">Hali mahsulot qo'shilmagan</p></div>}

            {/* ➕✏️ Product Modal */}
            {showModal && createPortal(
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editProduct ? <><Pencil size={18} /> Tahrirlash</> : <><Plus size={18} /> Yangi mahsulot</>}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group"><label className="form-label">Nomi</label>
                                <input type="text" className="form-input" placeholder="Pepsi 0.5l" required autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div className="form-group"><label className="form-label">Kategoriya</label>
                                <CustomSelect
                                    value={form.category}
                                    onChange={v => setForm({ ...form, category: v })}
                                    options={[
                                        { value: 'Ichimliklar', label: 'Ichimliklar' },
                                        { value: 'Gazaklar', label: 'Gazaklar' },
                                        { value: 'Ovqatlar', label: 'Ovqatlar' },
                                        { value: 'Aksessuarlar', label: 'Aksessuarlar' },
                                        { value: 'Boshqa', label: 'Boshqa' },
                                    ]}
                                /></div>
                            <div className="grid-2">
                                <div className="form-group"><label className="form-label">Olib kelish narxi</label>
                                    <input type="number" className="form-input" placeholder="5000" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Sotish narxi</label>
                                    <input type="number" className="form-input" placeholder="8000" required value={form.sell_price} onChange={e => setForm({ ...form, sell_price: e.target.value })} /></div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group"><label className="form-label">Boshlang'ich soni</label>
                                    <input type="number" className="form-input" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Kam qoldi chegarasi</label>
                                    <input type="number" className="form-input" min="1" value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: parseInt(e.target.value) })} /></div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Bekor qilish</button>
                                <button type="submit" className="btn btn-primary">{editProduct ? <><Pencil size={16} /> Saqlash</> : <><Plus size={16} /> Qo'shish</>}</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* 📦 Restock Modal */}
            {showRestockModal && createPortal(
                <div className="modal-overlay" onClick={() => setShowRestockModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title"><PackagePlus size={18} /> Tovar kiritish — {restockProduct?.name}</h3>
                            <button className="modal-close" onClick={() => setShowRestockModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleRestock}>
                            <p className="text-muted mb-16">Hozirgi qoldiq: <strong>{restockProduct?.quantity}</strong></p>
                            <div className="form-group"><label className="form-label">Qo'shilayotgan miqdor</label>
                                <input type="number" className="form-input" min="1" required autoFocus value={restockQty} onChange={e => setRestockQty(parseInt(e.target.value) || 1)} /></div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowRestockModal(false)}>Bekor qilish</button>
                                <button type="submit" className="btn btn-success"><PackagePlus size={16} /> Kiritish</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* 🗑️ Delete Confirmation Modal */}
            {showDeleteConfirm && createPortal(
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
                    <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                        <div className="text-center" style={{ padding: '20px 0' }}>
                            <div style={{ color: 'var(--accent-danger)', marginBottom: '16px' }}>
                                <Trash2 size={48} strokeWidth={1.5} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Mahsulotni o'chirish</h3>
                            <p className="text-muted" style={{ lineHeight: '1.6' }}>
                                Rostdan ham <b>{showDeleteConfirm.name}</b> mahsulotini o'chirib tashlamoqchimisiz?
                                <br />Bu amalni ortga qaytarib bo'lmaydi.
                            </p>
                        </div>
                        <div className="flex gap-12 mt-24">
                            <button className="btn btn-secondary w-full" onClick={() => setShowDeleteConfirm(null)}>
                                Bekor qilish
                            </button>
                            <button className="btn btn-danger w-full" onClick={confirmDelete}>
                                Ha, o'chirish
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

export default ProductsPage;
