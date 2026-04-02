// ============================================
// 📁 File: frontend/src/pages/SettingsPage.jsx — Settings & Security
// 👤 Author: User with AI
// 📝 Description: Settings Page aligned with the global app design system.
//    Manages user credentials and displays upcoming features.
// 📅 Created: 2026-03-22 10:20 (Tashkent Time)
// ============================================

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { KeyRound, CheckCircle2, Globe2, Palette, Send, CreditCard, Users, Smartphone, Shield, AlertCircle, Sparkles, Settings } from 'lucide-react';

function SettingsPage() {
    const { user, hasRole, logout } = useAuth();
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }
    const [isSaving, setIsSaving] = useState(false);

    // --- Security Form ---
    const [securityForm, setSecurityForm] = useState({
        currentPassword: '',
        newUsername: user?.username || '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleSecuritySubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        if (securityForm.newPassword && securityForm.newPassword !== securityForm.confirmPassword) {
            setMessage({ type: 'error', text: 'Yangi parollar bir-biriga mos emas!' });
            return;
        }
        try {
            setIsSaving(true);
            const res = await api.put('/auth/update-credentials', securityForm);
            setMessage({ type: 'success', text: res.data.message });
            setSecurityForm({ ...securityForm, currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Xatolik yuz berdi' });
        } finally {
            setIsSaving(false);
        }
    };

    const upcomingFeatures = [
        { icon: <Globe2 size={24} color="#3b82f6" />, title: "Ko'p tilli interfeys", desc: "Tizimdan qulay foydalanish uchun Krill, Rus va Ingliz tillari." },
        { icon: <Palette size={24} color="#ec4899" />, title: "Tanlanma Mavzular", desc: "Light, Blue va maxsus Gaming vizual dizayn uslublari." },
        { icon: <Send size={24} color="#06b6d4" />, title: "Telegram Bot Boshqaruvi", desc: "Real vaqtda xabarnomalar va kassani bot orqali boshqarish." },
        { icon: <CreditCard size={24} color="#10b981" />, title: "Avtomatlashgan To'lovlar", desc: "Click, Payme va Paynet orqali oson onlayn to'lov qabul qilish." },
        { icon: <Users size={24} color="#f59e0b" />, title: "Adminlar Nazorati", desc: "Yangi ishchilar qo'shish, ularga rol berish va oylik hisoblash." },
        { icon: <Smartphone size={24} color="#a78bfa" />, title: "Mobil Ilova Mijozlarga", desc: "Mijozlar uydan turib bo'sh xonalarni ko'rib band qila oladilar." }
    ];

    if (!hasRole('manager', 'owner')) {
        return (
            <div className="flex-center" style={{ height: '70vh' }}>
                <div className="text-center">
                    <Shield size={56} color="var(--accent-danger)" className="mb-16 mx-auto" opacity={0.8} />
                    <h2>Ruxsat etilmagan hudud</h2>
                    <p className="text-muted mt-8">Bu sahifaga kirish uchun sizda yetarli huquqlar yo'q.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>

            <div className="page-header">
                <div>
                    <h1 className="page-title"><Settings size={28} /> Sozlamalar</h1>
                    <p className="page-subtitle">Parollarni yangilang va kelajakdagi imkoniyatlar bilan tanishing</p>
                </div>
            </div>

            {message && (
                <div className="card mb-24 animate-scale-up" style={{
                    borderColor: message.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)',
                    display: 'flex', alignItems: 'center', gap: 12
                }}>
                    {message.type === 'success' ? <CheckCircle2 color="var(--accent-success)" /> : <AlertCircle color="var(--accent-danger)" />}
                    <p className="font-bold" style={{ color: message.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{message.text}</p>
                </div>
            )}

            {/* 🛡️ Split Layout for Settings */}
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

                {/* 🔒 Security & Login (Left Panel) */}
                <div style={{ flex: '1 1 min(100%, 400px)', maxWidth: '450px' }}>

                    {/* Logout Card (Useful for Mobile where sidebar is hidden) */}
                    <div className="card mb-24" style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-12">
                                <div style={{ background: 'var(--accent-danger-soft)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                                    <LogOut color="var(--accent-danger)" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold" style={{ fontSize: '1.05rem', color: 'var(--accent-danger)' }}>Tizimdan chiqish</h3>
                                </div>
                            </div>
                            <button className="btn btn-danger btn-sm" onClick={logout}>Chiqish</button>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center gap-12 mb-24">
                            <KeyRound size={24} className="text-muted" />
                            <h3 className="font-bold" style={{ fontSize: '1.2rem' }}>Xavfsizlik va Login</h3>
                        </div>

                        <form onSubmit={handleSecuritySubmit}>
                            <div className="form-group mb-16">
                                <label className="form-label">Hozirgi Parol <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
                                <input type="password" required className="form-input"
                                    placeholder="Tasdiqlash uchun parolingizni kiriting"
                                    value={securityForm.currentPassword} onChange={e => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                                />
                            </div>

                            <div style={{ height: '1px', background: 'var(--border-glass)', margin: '24px 0' }}></div>

                            <div className="form-group mb-16">
                                <label className="form-label">Yangi Username</label>
                                <input type="text" className="form-input"
                                    placeholder="Yangi login (ixtiyoriy)"
                                    value={securityForm.newUsername} onChange={e => setSecurityForm({ ...securityForm, newUsername: e.target.value })}
                                />
                            </div>

                            <div className="form-group mb-16">
                                <label className="form-label">Yangi Parol</label>
                                <input type="password" className="form-input"
                                    placeholder="Kuchli yangi parol"
                                    value={securityForm.newPassword} onChange={e => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                                />
                            </div>

                            <div className="form-group mb-24">
                                <label className="form-label">Parolni Tasdiqlang</label>
                                <input type="password" className="form-input"
                                    placeholder="Qayta kiriting"
                                    value={securityForm.confirmPassword} onChange={e => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="btn w-full" disabled={isSaving || !securityForm.currentPassword} style={{
                                background: !securityForm.currentPassword ? 'var(--bg-elevated)' : 'rgba(255, 165, 0, 0.15)',
                                color: !securityForm.currentPassword ? 'var(--text-muted)' : '#ffa500',
                                border: `1px solid ${!securityForm.currentPassword ? 'var(--border-glass)' : 'rgba(255, 165, 0, 0.3)'}`,
                                cursor: !securityForm.currentPassword ? 'not-allowed' : 'pointer'
                            }}>
                                {isSaving ? 'Saqlanmoqda...' : 'O\'zgarishlarni Saqlash'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* 🚀 Tez Kunda Features (Right Panel) */}
                <div style={{ flex: '2 1 min(100%, 600px)' }}>
                    <div className="flex items-center gap-12 mb-24">
                        <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                            <Sparkles className="text-muted" size={20} />
                        </div>
                        <h3 className="font-bold" style={{ fontSize: '1.2rem' }}>Tez Kunda Tizimga Qo'shiladi</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        {upcomingFeatures.map((f, i) => (
                            <div key={i} className="card hover-lift" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '20px' }}>
                                <div style={{
                                    background: 'var(--bg-input)',
                                    padding: '12px',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {f.icon}
                                </div>
                                <div>
                                    <h4 className="font-bold mb-8" style={{ fontSize: '1.05rem' }}>{f.title}</h4>
                                    <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

        </div>
    );
}

export default SettingsPage;
