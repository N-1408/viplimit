// ============================================
// 📁 File: frontend/src/pages/ReportsPage.jsx — Reports & Analytics Page
// 👤 Author: User with AI
// 📝 Description: Business reports dashboard for game club owners.
//    Shows daily cash reports, room profitability, and product sales.
//    Advanced filtering by date presets.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-03-21 12:08 (Tashkent) — V6.0 Apple/Telegram UI Redesign:
//    - Reduced all extreme paddings (32px to 20px, 24px to 16px).
//    - Replaced massive margins (mb-64 -> mb-24, gap-48 -> gap-24).
//    - Standardized typography and background icon sizes for compact feel.
// 2026-03-14 22:35 (Tashkent) — V5.5 Mastery Refinement:
//    - Drastically reduced font sizes and refined vertical rhythm.
//    - Fixed 100% layout jitter via JS scrollbar compensation.
// ============================================

import { useState, useEffect } from 'react';
import api from '../api/axios';
import { formatCurrency } from '../utils/formatters';
import CustomSelect from '../components/CustomSelect';
import {
    BarChart3,
    Monitor, ShoppingCart, Users, Banknote, CreditCard
} from 'lucide-react';

function ReportsPage() {
    const [filter, setFilter] = useState('today');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async (currentFilter) => {
        setLoading(true);
        try {
            let res;
            const today = new Date().toLocaleDateString('en-CA');
            let start;

            switch (currentFilter) {
                case 'today':
                    res = await api.get(`/reports/daily?date=${today}`);
                    break;
                case 'yesterday':
                    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toLocaleDateString('en-CA');
                    res = await api.get(`/reports/daily?date=${yesterday}`);
                    break;
                case 'week':
                    start = new Date(new Date().setDate(new Date().getDate() - 7)).toLocaleDateString('en-CA');
                    res = await api.get(`/reports/range?start_date=${start}&end_date=${today}`);
                    break;
                case 'month':
                    start = new Date(new Date().setDate(new Date().getDate() - 30)).toLocaleDateString('en-CA');
                    res = await api.get(`/reports/range?start_date=${start}&end_date=${today}`);
                    break;
                case 'last_month':
                    const firstDayPrev = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString('en-CA');
                    const lastDayPrev = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toLocaleDateString('en-CA');
                    res = await api.get(`/reports/range?start_date=${firstDayPrev}&end_date=${lastDayPrev}`);
                    break;
                case 'year':
                    start = new Date(new Date().getFullYear(), 0, 1).toLocaleDateString('en-CA');
                    res = await api.get(`/reports/range?start_date=${start}&end_date=${today}`);
                    break;
                default:
                    res = await api.get(`/reports/daily?date=${today}`);
            }
            if (res) setData(res.data);
        } catch (err) {
            console.error('Report error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(filter);
    }, [filter]);

    if (loading && !data) return <div className="flex-center" style={{ height: '50vh' }}><p className="text-muted">Yuklanmoqda...</p></div>;

    const summary = data?.summary || {};

    const filterOptions = [
        { value: 'today', label: 'Bugun' },
        { value: 'yesterday', label: 'Kecha' },
        { value: 'week', label: 'Oxirgi 7 kun' },
        { value: 'month', label: 'Oxirgi 30 kun' },
        { value: 'last_month', label: 'O\'tgan oy' },
        { value: 'year', label: 'Shu yil' }
    ];

    return (
        <div className="animate-fade-in pb-24">
            {/* 📋 Header & Filters */}
            <div className="section-header flex-between" style={{ alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '1.25rem' }}><BarChart3 size={22} /> Hisobotlar</h1>
                    <p className="page-subtitle">Business tahlili va moliyaviy natijalar</p>
                </div>
                <div style={{ width: '200px' }}>
                    <CustomSelect
                        value={filter}
                        onChange={setFilter}
                        options={filterOptions}
                    />
                </div>
            </div>

            {/* 📊 Top Stats Grid - Compact Mastery */}
            <div className="grid-4 mb-24">
                <div className="card stat-card" style={{ padding: '16px' }}>
                    <div className="stat-card-header mb-16">
                        <span className="stat-card-icon" style={{ background: 'rgba(255, 214, 10, 0.1)', color: 'var(--accent-primary)', width: '32px', height: '32px' }}>$</span>
                        <span className="stat-card-label" style={{ opacity: 0.7, fontSize: '0.8rem' }}>Umumiy daromad</span>
                    </div>
                    <div className="stat-card-value" style={{ fontSize: '1.1rem' }}>{formatCurrency(summary.total_revenue || 0)}</div>
                </div>

                <div className="card stat-card" style={{ padding: '16px' }}>
                    <div className="stat-card-header mb-16">
                        <span className="stat-card-icon" style={{ background: 'rgba(52, 199, 89, 0.1)', color: 'var(--accent-success)', width: '32px', height: '32px' }}><Users size={16} /></span>
                        <span className="stat-card-label" style={{ opacity: 0.7, fontSize: '0.8rem' }}>Sessiyalar soni</span>
                    </div>
                    <div className="stat-card-value" style={{ fontSize: '1.1rem' }}>{summary.total_sessions || 0} ta</div>
                </div>

                <div className="card stat-card" style={{ padding: '16px' }}>
                    <div className="stat-card-header mb-16">
                        <span className="stat-card-icon" style={{ background: 'rgba(0, 122, 255, 0.1)', color: '#007AFF', width: '32px', height: '32px' }}><Banknote size={16} /></span>
                        <span className="stat-card-label" style={{ opacity: 0.7, fontSize: '0.8rem' }}>Naqd to'lovlar</span>
                    </div>
                    <div className="stat-card-value" style={{ fontSize: '1.1rem' }}>{summary.cash_payments || 0} ta</div>
                </div>

                <div className="card stat-card" style={{ padding: '16px' }}>
                    <div className="stat-card-header mb-16">
                        <span className="stat-card-icon" style={{ background: 'rgba(175, 82, 222, 0.1)', color: '#AF52DE', width: '32px', height: '32px' }}><CreditCard size={16} /></span>
                        <span className="stat-card-label" style={{ opacity: 0.7, fontSize: '0.8rem' }}>Karta orqali</span>
                    </div>
                    <div className="stat-card-value" style={{ fontSize: '1.1rem' }}>{summary.card_payments || 0} ta</div>
                </div>
            </div>

            {/* 📊 Bottom Stats Grid — Extreme Spacing for Rhythm */}
            <div className="grid-2 mb-24">
                <div className="card stat-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.02 }}>
                        <Monitor size={100} />
                    </div>
                    <div className="stat-card-header mb-16">
                        <span className="stat-card-icon" style={{ background: 'rgba(255, 69, 58, 0.1)', color: 'var(--accent-danger)', width: '40px', height: '40px' }}><Monitor size={20} /></span>
                        <span className="stat-card-label" style={{ fontSize: '0.95rem' }}>Vaqt daromadi</span>
                    </div>
                    <div className="stat-card-value" style={{ fontSize: '1.35rem' }}>{formatCurrency(summary.time_revenue || 0)}</div>
                </div>

                <div className="card stat-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.02 }}>
                        <ShoppingCart size={100} />
                    </div>
                    <div className="stat-card-header mb-16">
                        <span className="stat-card-icon" style={{ background: 'rgba(255, 159, 10, 0.1)', color: 'var(--accent-warning)', width: '40px', height: '40px' }}><ShoppingCart size={20} /></span>
                        <span className="stat-card-label" style={{ fontSize: '0.95rem' }}>Mahsulot daromadi</span>
                    </div>
                    <div className="stat-card-value" style={{ fontSize: '1.35rem' }}>{formatCurrency(summary.products_revenue || 0)}</div>
                </div>
            </div>

            <div className="grid-2 gap-24 mt-24">
                {/* 🚪 Rooms breakdown */}
                <div className="card" style={{ padding: '20px' }}>
                    <div className="card-header mb-16 flex items-center gap-8">
                        <Monitor size={18} className="text-secondary" />
                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Xonalar bo'yicha</h3>
                    </div>
                    <div className="table-container" style={{ border: 'none', background: 'transparent', padding: 0 }}>
                        <table>
                            <thead><tr><th>XONA</th><th>SESSIYALAR</th><th className="text-right">DAROMAD</th></tr></thead>
                            <tbody>
                                {(data?.rooms || data?.room_profitability || []).map((r, i) => (
                                    <tr key={i}>
                                        <td><strong>{r.room_name}</strong><br /><small className="text-muted">{r.console_type}</small></td>
                                        <td>{r.sessions_count || r.total_sessions}</td>
                                        <td className="text-right"><strong className="text-primary">{formatCurrency(r.room_revenue || r.total_revenue)}</strong></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 🛒 Products breakdown */}
                <div className="card" style={{ padding: '20px' }}>
                    <div className="card-header mb-16 flex items-center gap-8">
                        <ShoppingCart size={18} className="text-secondary" />
                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Mahsulotlar bo'yicha</h3>
                    </div>
                    <div className="table-container" style={{ border: 'none', background: 'transparent', padding: 0 }}>
                        <table>
                            <thead><tr><th>NOMI</th><th>SOTILDI</th><th className="text-right">DAROMAD</th></tr></thead>
                            <tbody>
                                {data?.top_products?.length > 0 ? (
                                    data.top_products.map((p, i) => (
                                        <tr key={i}>
                                            <td><strong>{p.name}</strong><br /><small className="text-muted">{p.category}</small></td>
                                            <td>{p.total_sold} ta</td>
                                            <td className="text-right"><strong className="text-success">{formatCurrency(p.total_sales)}</strong></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="text-center text-muted py-8">
                                            Mahsulotlar sotuvi mavjud emas
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReportsPage;
