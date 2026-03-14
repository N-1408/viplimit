// ============================================
// 📁 File: frontend/src/pages/ReportsPage.jsx — Reports & Analytics Page
// 👤 Author: User with AI
// 📝 Description: Business reports dashboard for game club owners.
//    Shows daily cash reports, room profitability, and product sales.
//    Advanced filtering by date presets.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-03-14 22:15 (Tashkent) — V5.2 Premium UI:
//    - Replaced native Select/Calendar with custom components.
// 2026-03-14 22:30 (Tashkent) — V5.3 UI Cleanup:
//    - Removed custom date range picker (simplified UI).
//    - Fixed spacing & font sizes (compact Apple-style).
//    - Auto-update on selection (removed refresh btn).
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
        <div className="animate-fade-in pb-40">
            {/* 📋 Header & Filters */}
            <div className="section-header flex-between" style={{ alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '1.4rem' }}><BarChart3 size={22} /> Hisobotlar</h1>
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
            <div className="grid-4 mb-64">
                <div className="card stat-card" style={{ padding: '24px' }}>
                    <div className="stat-card-header mb-20">
                        <span className="stat-card-icon" style={{ background: 'rgba(255, 214, 10, 0.1)', color: 'var(--accent-primary)', width: '32px', height: '32px' }}>$</span>
                        <span className="stat-card-label" style={{ opacity: 0.7, fontSize: '0.8rem' }}>Umumiy daromad</span>
                    </div>
                    <div className="stat-card-value">{formatCurrency(summary.total_revenue || 0)}</div>
                </div>

                <div className="card stat-card" style={{ padding: '24px' }}>
                    <div className="stat-card-header mb-20">
                        <span className="stat-card-icon" style={{ background: 'rgba(52, 199, 89, 0.1)', color: 'var(--accent-success)', width: '32px', height: '32px' }}><Users size={16} /></span>
                        <span className="stat-card-label" style={{ opacity: 0.7, fontSize: '0.8rem' }}>Sessiyalar soni</span>
                    </div>
                    <div className="stat-card-value">{summary.total_sessions || 0} ta</div>
                </div>

                <div className="card stat-card" style={{ padding: '24px' }}>
                    <div className="stat-card-header mb-20">
                        <span className="stat-card-icon" style={{ background: 'rgba(0, 122, 255, 0.1)', color: '#007AFF', width: '32px', height: '32px' }}><Banknote size={16} /></span>
                        <span className="stat-card-label" style={{ opacity: 0.7, fontSize: '0.8rem' }}>Naqd to'lovlar</span>
                    </div>
                    <div className="stat-card-value">{summary.cash_payments || 0} ta</div>
                </div>

                <div className="card stat-card" style={{ padding: '24px' }}>
                    <div className="stat-card-header mb-20">
                        <span className="stat-card-icon" style={{ background: 'rgba(175, 82, 222, 0.1)', color: '#AF52DE', width: '32px', height: '32px' }}><CreditCard size={16} /></span>
                        <span className="stat-card-label" style={{ opacity: 0.7, fontSize: '0.8rem' }}>Karta orqali</span>
                    </div>
                    <div className="stat-card-value">{summary.card_payments || 0} ta</div>
                </div>
            </div>

            {/* 📊 Bottom Stats Grid — Extreme Spacing for Rhythm */}
            <div className="grid-2 mb-64">
                <div className="card stat-card" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-15px', top: '-15px', opacity: 0.02 }}>
                        <Monitor size={140} />
                    </div>
                    <div className="stat-card-header mb-24">
                        <span className="stat-card-icon" style={{ background: 'rgba(255, 69, 58, 0.1)', color: 'var(--accent-danger)', width: '40px', height: '40px' }}><Monitor size={20} /></span>
                        <span className="stat-card-label" style={{ fontSize: '0.95rem' }}>Vaqt daromadi</span>
                    </div>
                    <div className="stat-card-value" style={{ fontSize: '1.6rem' }}>{formatCurrency(summary.time_revenue || 0)}</div>
                </div>

                <div className="card stat-card" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-15px', top: '-15px', opacity: 0.02 }}>
                        <ShoppingCart size={140} />
                    </div>
                    <div className="stat-card-header mb-24">
                        <span className="stat-card-icon" style={{ background: 'rgba(255, 159, 10, 0.1)', color: 'var(--accent-warning)', width: '40px', height: '40px' }}><ShoppingCart size={20} /></span>
                        <span className="stat-card-label" style={{ fontSize: '0.95rem' }}>Mahsulot daromadi</span>
                    </div>
                    <div className="stat-card-value" style={{ fontSize: '1.6rem' }}>{formatCurrency(summary.products_revenue || 0)}</div>
                </div>
            </div>

            <div className="grid-2 gap-48 mt-64">
                {/* 🚪 Rooms breakdown */}
                <div>
                    <h3 className="section-title"><Monitor size={20} className="text-secondary" /> Xonalar bo'yicha</h3>
                    <div className="card" style={{ padding: '12px 12px' }}>
                        <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
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
                </div>

                {/* 🛒 Products breakdown */}
                <div>
                    <h3 className="section-title"><ShoppingCart size={20} className="text-secondary" /> Mahsulotlar bo'yicha</h3>
                    <div className="card" style={{ padding: '12px 12px' }}>
                        <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
                            <table>
                                <thead><tr><th>NOMI</th><th>SOTILDI</th><th className="text-right">JAMI</th></tr></thead>
                                <tbody>
                                    {(data?.top_products || []).map((p, i) => (
                                        <tr key={i}>
                                            <td><strong>{p.name}</strong><br /><small className="text-muted">{p.category}</small></td>
                                            <td>{p.total_sold} ta</td>
                                            <td className="text-right"><strong className="text-success">{formatCurrency(p.total_sales)}</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReportsPage;
