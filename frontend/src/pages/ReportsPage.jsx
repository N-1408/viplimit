// ============================================
// 📁 File: frontend/src/pages/ReportsPage.jsx — Reports & Analytics Page
// 👤 Author: User with AI
// 📝 Description: Business reports dashboard for game club owners.
//    Shows daily cash report, room profitability, revenue trends,
//    and top-selling products. Supports date filtering.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-03-13 02:50 (Tashkent) — v2.0 Gamer Redesign: Neon Yellow & 
//    Obsidian Black theme. Sharp borders and cyber layout.
// ============================================

import { useState, useEffect } from 'react';
import api from '../api/axios';
import { formatCurrency } from '../utils/formatters';
import {
    BarChart3, DollarSign, Gamepad2, Clock,
    ShoppingCart, Banknote, CreditCard, Calendar
} from 'lucide-react';

function ReportsPage() {
    const [dailyReport, setDailyReport] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);

    const fetchDailyReport = async (date) => {
        try {
            setLoading(true);
            const res = await api.get(`/reports/daily?date=${date}`);
            setDailyReport(res.data);
        } catch (err) { console.error('Report fetch error:', err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchDailyReport(selectedDate); }, [selectedDate]);

    if (loading) return <div className="flex-center" style={{ height: '50vh' }}><p className="text-muted">Yuklanmoqda...</p></div>;

    const summary = dailyReport?.summary || {};

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title"><BarChart3 size={24} /> Hisobotlar</h1>
                    <p className="page-subtitle">Kunlik kassa hisoboti</p>
                </div>
                <div className="flex gap-8" style={{ alignItems: 'center' }}>
                    <Calendar size={18} className="text-muted" />
                    <input type="date" className="form-input" style={{ width: '180px', borderColor: 'var(--border-accent)' }}
                        value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                </div>
            </div>

            <div className="grid-4 mb-24">
                <div className="stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-md)', padding: '16px', boxShadow: 'var(--shadow-md)' }}>
                    <div className="stat-card-label" style={{ color: 'var(--accent-primary-light)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={15} /> Umumiy daromad</div>
                    <div className="stat-card-value" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>{formatCurrency(summary.total_revenue || 0)}</div>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                    <div className="stat-card-label" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Gamepad2 size={15} /> Sessiyalar</div>
                    <div className="stat-card-value" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>{summary.total_sessions || 0}</div>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                    <div className="stat-card-label" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={15} /> Vaqt daromadi</div>
                    <div className="stat-card-value" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>{formatCurrency(summary.time_revenue || 0)}</div>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                    <div className="stat-card-label" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><ShoppingCart size={15} /> Mahsulot daromadi</div>
                    <div className="stat-card-value" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>{formatCurrency(summary.products_revenue || 0)}</div>
                </div>
            </div>

            <div className="grid-2 mb-24">
                <div className="stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                    <div className="stat-card-label" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Banknote size={15} /> Naqd to'lovlar</div>
                    <div className="stat-card-value" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>{summary.cash_payments || 0}</div>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                    <div className="stat-card-label" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><CreditCard size={15} /> Karta to'lovlar</div>
                    <div className="stat-card-value" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>{summary.card_payments || 0}</div>
                </div>
            </div>

            <div className="card mb-24" style={{ padding: '0', overflow: 'hidden' }}>
                <h3 className="mb-16 font-bold flex gap-8" style={{ padding: '20px 20px 0', color: 'var(--accent-primary-light)' }}><Gamepad2 size={18} /> Xonalar bo'yicha daromad</h3>
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                    <table>
                        <thead><tr><th>Xona</th><th>Console</th><th>Sessiyalar</th><th>O'rtacha (daqiqa)</th><th>Daromad</th></tr></thead>
                        <tbody>
                            {dailyReport?.rooms?.map((r, i) => (
                                <tr key={i}><td><strong>{r.room_name}</strong></td><td>{r.console_type}</td><td>{r.sessions_count}</td>
                                    <td>{Math.round(r.avg_duration_min)}</td><td><strong>{formatCurrency(r.room_revenue)}</strong></td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <h3 className="mb-16 font-bold flex gap-8" style={{ padding: '20px 20px 0', color: 'var(--accent-primary-light)' }}><ShoppingCart size={18} /> Top mahsulotlar</h3>
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                    <table>
                        <thead><tr><th>Mahsulot</th><th>Kategoriya</th><th>Sotilgan</th><th>Daromad</th></tr></thead>
                        <tbody>
                            {dailyReport?.top_products?.map((p, i) => (
                                <tr key={i}><td><strong>{p.name}</strong></td><td>{p.category}</td><td>{p.total_sold}</td>
                                    <td><strong>{formatCurrency(p.total_sales)}</strong></td></tr>
                            ))}
                            {(!dailyReport?.top_products || dailyReport.top_products.length === 0) &&
                                <tr><td colSpan="4" className="text-center text-muted">Bu kunda sotilgan mahsulot yo'q</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ReportsPage;
