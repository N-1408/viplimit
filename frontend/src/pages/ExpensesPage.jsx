// ============================================
// 📁 File: frontend/src/pages/ExpensesPage.jsx — Expenses Management Page
// 👤 Author: User with AI
// 📝 Description: Provides administrators and managers a workspace to
//    manually log operational expenses (rent, salaries, supplies, etc).
//    Supports filtering by date range, multiple currencies (UZS, USD),
//    and expense categories. Expense totals are automatically calculated.
// 📅 Created: 2026-03-22 16:32 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-03-22 16:40 (Tashkent) — Replaced native <select> with CustomSelect
//    for both category and currency. Replaced native date inputs with
//    segmented CustomSelect period filter (Bugun, Kecha, 7 kun, 30 kun,
//    O'tgan oy, Shu yil). Renamed Arenda → Ijara (arenda). Removed
//    Jarimalar and Uskunalar categories. Changed "Bekor" → "Bekor qilish".
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axios';
import CustomSelect from '../components/CustomSelect';
import {
    Wallet, Plus, Trash2, X,
    TrendingDown, DollarSign, Banknote, AlertCircle
} from 'lucide-react';

// 🗓️ Uzbek month names (to'liq)
const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
function formatDateUz(dateStr) {
    const d = new Date(dateStr);
    return `${d.getDate()}-${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function formatTimeUz(dateStr) {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 💰 Expense categories
const CATEGORIES = [
    { value: 'Ijara (arenda)', label: 'Ijara (arenda)' },
    { value: 'Oylik (Maosh)', label: 'Oylik (Maosh)' },
    { value: 'Mahsulot kiritish', label: 'Mahsulot kiritish' },
    { value: "Kommunal to'lov", label: "Kommunal to'lov" },
    { value: 'Reklama', label: 'Reklama' },
    { value: 'Boshqa', label: 'Boshqa' },
];

// 💱 Currency options
const CURRENCY_OPTIONS = [
    { value: 'UZS', label: 'UZS' },
    { value: 'USD', label: 'USD' },
];

// 📅 Date filter options (same style as ReportsPage)
const FILTER_OPTIONS = [
    { value: 'today', label: 'Bugun' },
    { value: 'yesterday', label: 'Kecha' },
    { value: 'week', label: 'Oxirgi 7 kun' },
    { value: 'month', label: 'Oxirgi 30 kun' },
    { value: 'last_month', label: "O'tgan oy" },
    { value: 'year', label: 'Shu yil' },
];

// 🌿 Format currency nicely
function formatAmount(amount, currency) {
    const num = parseFloat(amount);
    if (currency === 'USD') return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    return `${num.toLocaleString('uz-UZ')} so'm`;
}

// 🗓️ Helper: compute date range from filter name
function getDateRange(filterValue) {
    const today = new Date().toLocaleDateString('en-CA');
    switch (filterValue) {
        case 'today':
            return { from: today, to: today };
        case 'yesterday': {
            const y = new Date(new Date().setDate(new Date().getDate() - 1)).toLocaleDateString('en-CA');
            return { from: y, to: y };
        }
        case 'week': {
            const s = new Date(new Date().setDate(new Date().getDate() - 7)).toLocaleDateString('en-CA');
            return { from: s, to: today };
        }
        case 'month': {
            const s = new Date(new Date().setDate(new Date().getDate() - 30)).toLocaleDateString('en-CA');
            return { from: s, to: today };
        }
        case 'last_month': {
            const f = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString('en-CA');
            const l = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toLocaleDateString('en-CA');
            return { from: f, to: l };
        }
        case 'year': {
            const s = new Date(new Date().getFullYear(), 0, 1).toLocaleDateString('en-CA');
            return { from: s, to: today };
        }
        default:
            return { from: today, to: today };
    }
}

// 🏷️ Category badge color map
const categoryColors = {
    'Ijara (arenda)': '#f59e0b',
    'Oylik (Maosh)': '#3b82f6',
    'Mahsulot kiritish': '#10b981',
    "Kommunal to'lov": '#06b6d4',
    'Reklama': '#ec4899',
    'Boshqa': '#6b7280',
};

function ExpensesPage() {
    // 📊 Data state
    const [expenses, setExpenses] = useState([]);
    const [totals, setTotals] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 📅 Date filter state (same as ReportsPage)
    const [filter, setFilter] = useState('month');

    // ➕ Modal state
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [form, setForm] = useState({ amount: '', currency: 'UZS', category: CATEGORIES[0].value, description: '' });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // 🔄 Load expenses from API
    const loadExpenses = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { from, to } = getDateRange(filter);
            const res = await api.get('/expenses', { params: { from, to } });
            setExpenses(res.data.expenses);
            setTotals(res.data.totals);
        } catch (err) {
            setError('Xarajatlarni yuklashda xatolik.');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { loadExpenses(); }, [loadExpenses]);

    // Esc key to close modals
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') {
                setShowModal(false);
                setShowDeleteConfirm(null);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // ➕ Submit new expense
    const handleAddExpense = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!form.amount || parseFloat(form.amount) <= 0) {
            setFormError("Summa to'g'ri kiritilishi kerak.");
            return;
        }
        try {
            setSaving(true);
            await api.post('/expenses', form);
            setShowModal(false);
            setForm({ amount: '', currency: 'UZS', category: CATEGORIES[0].value, description: '' });
            loadExpenses();
        } catch (err) {
            setFormError(err.response?.data?.error || 'Xatolik yuz berdi.');
        } finally {
            setSaving(false);
        }
    };

    // 🗑️ Confirm delete expense
    const confirmDelete = async () => {
        if (!showDeleteConfirm) return;
        try {
            await api.delete(`/expenses/${showDeleteConfirm.id}`);
            setShowDeleteConfirm(null);
            loadExpenses();
        } catch (err) {
            setError(err.response?.data?.error || "O'chirishda xatolik.");
            setShowDeleteConfirm(null);
        }
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>

            {/* 📌 Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title"><Wallet size={28} /> Xarajatlar</h1>
                    <p className="page-subtitle">Klub operatsion xarajatlarini kuzatib boring</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '200px' }}>
                        <CustomSelect
                            value={filter}
                            onChange={setFilter}
                            options={FILTER_OPTIONS}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> Xarajat Qo'shish
                    </button>
                </div>
            </div>

            {/* ⚠️ Error Banner */}
            {error && (
                <div className="card mb-24" style={{ borderColor: 'var(--accent-danger)', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <AlertCircle size={20} color="var(--accent-danger)" />
                    <span style={{ color: 'var(--accent-danger)' }}>{error}</span>
                </div>
            )}

            {/* 💰 Totals Summary Cards */}
            {Object.keys(totals).length > 0 && (
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
                    {Object.entries(totals).map(([cur, amt]) => (
                        <div key={cur} className="card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ background: cur === 'USD' ? 'rgba(16,185,129,0.1)' : 'rgba(255,165,0,0.1)', padding: '10px', borderRadius: 'var(--radius-md)', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {cur === 'USD' ? <DollarSign size={22} color="#10b981" /> : <Banknote size={22} color="#ffa500" />}
                            </div>
                            <div>
                                <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '2px' }}>Jami ({cur})</p>
                                <p className="font-bold" style={{ fontSize: '1.25rem' }}>{formatAmount(amt, cur)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 📋 Expenses Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center' }}>
                        <p className="text-muted">⏳ Yuklanmoqda...</p>
                    </div>
                ) : expenses.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center' }}>
                        <TrendingDown size={48} className="text-muted mb-16 mx-auto" opacity={0.4} />
                        <p className="text-muted" style={{ fontSize: '1.1rem' }}>Bu davr uchun xarajatlar mavjud emas</p>
                        <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: 6 }}>Yangi xarajat qo'shish uchun "Xarajat Qo'shish" tugmasini bosing</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Sana</th>
                                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Kategoriya</th>
                                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Izoh</th>
                                <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Summa</th>
                                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Qo'shgan</th>
                                <th style={{ padding: '14px 10px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map((exp, idx) => {
                                const d = new Date(exp.created_at);
                                const dateStr = formatDateUz(exp.created_at);
                                const timeStr = formatTimeUz(exp.created_at);
                                const catColor = categoryColors[exp.category] || '#6b7280';
                                return (
                                    <tr key={exp.id} style={{ borderBottom: idx === expenses.length - 1 ? 'none' : '1px solid var(--border-subtle)', transition: 'background 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '14px 20px' }}>
                                            <div style={{ fontSize: '0.95rem', color: '#fff' }}>{dateStr}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{timeStr}</div>
                                        </td>
                                        <td style={{ padding: '14px 20px' }}>
                                            <span style={{ background: `${catColor}20`, color: catColor, border: `1px solid ${catColor}40`, borderRadius: 'var(--radius-sm)', padding: '4px 10px', fontSize: '0.85rem', fontWeight: 600 }}>
                                                {exp.category}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '300px' }}>
                                            {exp.description || <span className="text-muted" style={{ fontStyle: 'italic' }}>—</span>}
                                        </td>
                                        <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 700, fontSize: '1.05rem', color: exp.currency === 'USD' ? '#10b981' : '#ffa500' }}>
                                            {formatAmount(exp.amount, exp.currency)}
                                        </td>
                                        <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            {exp.added_by || '—'}
                                        </td>
                                        <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                                            <button onClick={() => setShowDeleteConfirm(exp)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px', borderRadius: 'var(--radius-sm)', transition: 'all 0.2s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'var(--accent-danger)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ➕ Add Expense Modal */}
            {showModal && createPortal(
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Yangi Xarajat</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddExpense}>
                            {formError && (
                                <div className="mb-16" style={{ color: 'var(--accent-danger)', display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.9rem' }}>
                                    <AlertCircle size={16} /> {formError}
                                </div>
                            )}

                            {/* 💰 Amount + Currency */}
                            <div className="form-group mb-16">
                                <label className="form-label">Summa <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="number"
                                        step="any"
                                        min="0"
                                        className="form-input"
                                        style={{ flex: 1 }}
                                        placeholder="500000"
                                        value={form.amount}
                                        onChange={e => setForm({ ...form, amount: e.target.value })}
                                        autoFocus
                                        required
                                    />
                                    <div style={{ width: '100px' }}>
                                        <CustomSelect
                                            value={form.currency}
                                            onChange={val => setForm({ ...form, currency: val })}
                                            options={CURRENCY_OPTIONS}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 🏷️ Category */}
                            <div className="form-group mb-16">
                                <label className="form-label">Kategoriya <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
                                <CustomSelect
                                    value={form.category}
                                    onChange={val => setForm({ ...form, category: val })}
                                    options={CATEGORIES}
                                />
                            </div>

                            {/* 📝 Description */}
                            <div className="form-group mb-24">
                                <label className="form-label">Izoh</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    style={{ resize: 'none', minHeight: '80px' }}
                                    placeholder="Masalan: Coca-Cola 8 blok, aprel oyi ijarasi..."
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Bekor qilish</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saqlanmoqda...' : <><Plus size={16} /> Qo'shish</>}
                                </button>
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
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Xarajatni o'chirish</h3>
                            <p className="text-muted" style={{ lineHeight: '1.6' }}>
                                Rostdan ham <b>{showDeleteConfirm.category}</b> xarajatini o'chirib tashlamoqchimisiz?
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

export default ExpensesPage;
