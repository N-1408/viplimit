// ============================================
// 📁 File: frontend/src/pages/SuperAdminPage.jsx — Super Admin Panel
// 👤 Author: User with AI
// 📝 Description: Hidden Super Admin panel accessible only by the platform
//    owner's Telegram ID. Manages game clubs, subscription plans,
//    promo codes, and provides dashboard analytics.
// 📅 Created: 2026-04-03 01:28 (Tashkent Time)
// ============================================

import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    Shield, Building2, Package, Tag, ToggleLeft, ToggleRight,
    Plus, Pencil, Trash2, Users, Monitor, ShoppingCart, Crown,
    TrendingUp, X, Check, AlertTriangle
} from 'lucide-react';

function SuperAdminPage() {
    // 📊 Dashboard stats
    const [stats, setStats] = useState(null);
    // 🏢 Clubs
    const [clubs, setClubs] = useState([]);
    // 📦 Plans
    const [plans, setPlans] = useState([]);
    // 🎟️ Promo codes
    const [promoCodes, setPromoCodes] = useState([]);
    // 📑 Active tab
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);

    // 📦 Plan modal
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [editPlan, setEditPlan] = useState(null);
    const [planForm, setPlanForm] = useState({ name: '', max_rooms: 2, max_products: 4, max_users: 2, price_monthly: 0 });

    // 🎟️ Promo modal
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [promoForm, setPromoForm] = useState({ code: '', discount_percent: 0, max_uses: 100, valid_until: '' });

    // 🔄 Load data
    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [dashRes, clubsRes, plansRes, promosRes] = await Promise.all([
                api.get('/super/dashboard'),
                api.get('/super/clubs'),
                api.get('/super/plans'),
                api.get('/super/promo-codes')
            ]);
            setStats(dashRes.data);
            setClubs(clubsRes.data);
            setPlans(plansRes.data);
            setPromoCodes(promosRes.data);
        } catch (err) {
            console.error('Super Admin load error:', err);
        } finally {
            setLoading(false);
        }
    };

    // 🔄 Toggle club
    const handleToggleClub = async (id) => {
        try {
            await api.put(`/super/clubs/${id}/toggle`);
            loadAll();
        } catch (err) {
            alert('Xatolik: ' + (err.response?.data?.error || err.message));
        }
    };

    // 📦 Save plan
    const handleSavePlan = async (e) => {
        e.preventDefault();
        try {
            if (editPlan) {
                await api.put(`/super/plans/${editPlan.id}`, { ...planForm, is_active: true });
            } else {
                await api.post('/super/plans', planForm);
            }
            setShowPlanModal(false);
            loadAll();
        } catch (err) {
            alert('Xatolik: ' + (err.response?.data?.error || err.message));
        }
    };

    // 🎟️ Save promo
    const handleSavePromo = async (e) => {
        e.preventDefault();
        try {
            await api.post('/super/promo-codes', promoForm);
            setShowPromoModal(false);
            setPromoForm({ code: '', discount_percent: 0, max_uses: 100, valid_until: '' });
            loadAll();
        } catch (err) {
            alert('Xatolik: ' + (err.response?.data?.error || err.message));
        }
    };

    // 🗑️ Delete promo
    const handleDeletePromo = async (id) => {
        if (!window.confirm('Promokodni o\'chirmoqchimisiz?')) return;
        try {
            await api.delete(`/super/promo-codes/${id}`);
            loadAll();
        } catch (err) {
            alert('Xatolik');
        }
    };

    const formatCurrency = (n) => Number(n || 0).toLocaleString('uz-UZ') + " so'm";

    if (loading) return (
        <div style={{ padding: 48, textAlign: 'center' }}>
            <Shield size={48} className="text-muted" style={{ opacity: 0.4 }} />
            <p className="text-muted mt-16">Super Admin yuklanmoqda...</p>
        </div>
    );

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
        { id: 'clubs', label: 'Clublar', icon: Building2 },
        { id: 'plans', label: 'Tariflar', icon: Package },
        { id: 'promos', label: 'Promokodlar', icon: Tag }
    ];

    return (
        <div className="page-content">
            {/* 🔒 Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Shield size={24} color="#facc15" /> Super Admin
                    </h1>
                    <p className="text-muted">Platform boshqaruv paneli</p>
                </div>
            </div>

            {/* 📑 Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {tabs.map(tab => (
                    <button key={tab.id}
                        className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab(tab.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* 📊 Dashboard */}
            {activeTab === 'dashboard' && stats && (
                <div className="grid-2 gap-16">
                    {[
                        { label: 'Game Clublar', value: stats.clubs.total, sub: `${stats.clubs.active} ta aktiv`, icon: Building2, color: '#facc15' },
                        { label: 'Foydalanuvchilar', value: stats.users, icon: Users, color: '#10b981' },
                        { label: 'Sessiyalar', value: stats.sessions.total, icon: Monitor, color: '#3b82f6' },
                        { label: 'Umumiy daromad', value: formatCurrency(stats.sessions.revenue), icon: TrendingUp, color: '#f59e0b' }
                    ].map((s, i) => (
                        <div key={i} className="card" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>{s.label}</p>
                                    <h2 style={{ margin: '4px 0 0', fontSize: '1.5rem' }}>{s.value}</h2>
                                    {s.sub && <p className="text-muted" style={{ fontSize: '0.8rem' }}>{s.sub}</p>}
                                </div>
                                <s.icon size={32} color={s.color} opacity={0.6} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 🏢 Clubs */}
            {activeTab === 'clubs' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Club</th><th>Plan</th><th>Xonalar</th><th>Mahsulotlar</th><th>Holat</th><th>Amal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clubs.map(c => (
                                    <tr key={c.id}>
                                        <td data-label="Club">
                                            <strong>{c.name}</strong>
                                            <br /><small className="text-muted">{c.phone || '—'}</small>
                                        </td>
                                        <td data-label="Plan">
                                            <span className="badge free">{c.plan_name || 'Free'}</span>
                                        </td>
                                        <td data-label="Xonalar">{c.rooms_count}/{c.max_rooms}</td>
                                        <td data-label="Mahsulotlar">{c.products_count}/{c.max_products}</td>
                                        <td data-label="Holat">
                                            {c.is_enabled
                                                ? <span className="badge free"><Check size={12} /> Aktiv</span>
                                                : <span className="badge busy"><X size={12} /> O'chiq</span>}
                                        </td>
                                        <td data-label="Amal">
                                            <button className="btn btn-ghost btn-icon" onClick={() => handleToggleClub(c.id)}
                                                title={c.is_enabled ? "O'chirish" : "Yoqish"}>
                                                {c.is_enabled ? <ToggleRight size={18} color="#10b981" /> : <ToggleLeft size={18} color="#ef4444" />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 📦 Plans */}
            {activeTab === 'plans' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                        <button className="btn btn-primary" onClick={() => {
                            setEditPlan(null);
                            setPlanForm({ name: '', max_rooms: 2, max_products: 4, max_users: 2, price_monthly: 0 });
                            setShowPlanModal(true);
                        }}>
                            <Plus size={16} /> Yangi Plan
                        </button>
                    </div>
                    <div className="grid-2 gap-16">
                        {plans.map(p => (
                            <div key={p.id} className="card" style={{ padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <h3 style={{ margin: 0 }}><Crown size={16} color="#facc15" /> {p.name}</h3>
                                    <button className="btn btn-ghost btn-icon" onClick={() => {
                                        setEditPlan(p);
                                        setPlanForm(p);
                                        setShowPlanModal(true);
                                    }}><Pencil size={14} /></button>
                                </div>
                                <p style={{ fontSize: '1.3rem', fontWeight: 700, color: '#facc15' }}>{formatCurrency(p.price_monthly)}<span className="text-muted" style={{ fontSize: '0.8rem' }}>/oy</span></p>
                                <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: 8 }}>
                                    <div>🚪 {p.max_rooms} xona</div>
                                    <div>🛒 {p.max_products} mahsulot</div>
                                    <div>👥 {p.max_users} foydalanuvchi</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* 🎟️ Promo Codes */}
            {activeTab === 'promos' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                        <button className="btn btn-primary" onClick={() => {
                            setPromoForm({ code: '', discount_percent: 0, max_uses: 100, valid_until: '' });
                            setShowPromoModal(true);
                        }}>
                            <Plus size={16} /> Yangi Kod
                        </button>
                    </div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                            <table>
                                <thead>
                                    <tr><th>Kod</th><th>Chegirma</th><th>Ishlatildi</th><th>Muddat</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {promoCodes.map(p => (
                                        <tr key={p.id}>
                                            <td data-label="Kod"><strong style={{ color: '#facc15' }}>{p.code}</strong></td>
                                            <td data-label="Chegirma">{p.discount_percent}%</td>
                                            <td data-label="Ishlatildi">{p.used_count}/{p.max_uses}</td>
                                            <td data-label="Muddat">{p.valid_until ? new Date(p.valid_until).toLocaleDateString('uz-UZ') : '♾️'}</td>
                                            <td data-label="Amal">
                                                <button className="btn btn-ghost btn-icon" onClick={() => handleDeletePromo(p.id)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {promoCodes.length === 0 && (
                                        <tr><td colSpan="5" className="text-center text-muted" style={{ padding: 32 }}>Promokodlar mavjud emas</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* 📦 Plan Modal */}
            {showPlanModal && (
                <div className="modal-overlay" onClick={() => setShowPlanModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editPlan ? 'Plan tahrirlash' : 'Yangi Plan'}</h3>
                            <button className="modal-close" onClick={() => setShowPlanModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSavePlan}>
                            <div className="form-group">
                                <label className="form-label">Nomi</label>
                                <input className="form-input" required value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} />
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Xonalar limiti</label>
                                    <input type="number" className="form-input" required value={planForm.max_rooms} onChange={e => setPlanForm({ ...planForm, max_rooms: parseInt(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mahsulotlar limiti</label>
                                    <input type="number" className="form-input" required value={planForm.max_products} onChange={e => setPlanForm({ ...planForm, max_products: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Userlar limiti</label>
                                    <input type="number" className="form-input" required value={planForm.max_users} onChange={e => setPlanForm({ ...planForm, max_users: parseInt(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Oylik narx</label>
                                    <input type="number" className="form-input" required value={planForm.price_monthly} onChange={e => setPlanForm({ ...planForm, price_monthly: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowPlanModal(false)}>Bekor</button>
                                <button type="submit" className="btn btn-primary">{editPlan ? 'Saqlash' : 'Yaratish'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 🎟️ Promo Modal */}
            {showPromoModal && (
                <div className="modal-overlay" onClick={() => setShowPromoModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Yangi Promokod</h3>
                            <button className="modal-close" onClick={() => setShowPromoModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSavePromo}>
                            <div className="form-group">
                                <label className="form-label">Kod</label>
                                <input className="form-input" required placeholder="WELCOME50" value={promoForm.code}
                                    onChange={e => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })} />
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Chegirma (%)</label>
                                    <input type="number" className="form-input" min="0" max="100" required value={promoForm.discount_percent}
                                        onChange={e => setPromoForm({ ...promoForm, discount_percent: parseInt(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Limit</label>
                                    <input type="number" className="form-input" min="1" required value={promoForm.max_uses}
                                        onChange={e => setPromoForm({ ...promoForm, max_uses: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Amal qilish muddati</label>
                                <input type="date" className="form-input" value={promoForm.valid_until}
                                    onChange={e => setPromoForm({ ...promoForm, valid_until: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowPromoModal(false)}>Bekor</button>
                                <button type="submit" className="btn btn-primary">Yaratish</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SuperAdminPage;
