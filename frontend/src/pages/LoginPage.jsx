// ============================================
// 📁 File: frontend/src/pages/LoginPage.jsx — Login & Onboarding Page
// 👤 Author: User with AI
// 📝 Description: Authentication page with tab-based onboarding.
//    Tab 1: Yangi Game Club yaratish (register).
//    Tab 2: Mavjud clubga kirish (login).
//    Telegram WebApp ichida auto-login qo'llab-quvvatlanadi.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-04-03 01:28 (Tashkent) — 🤖 Onboarding tablar: Yangi Club / Login.
//    TG auto-login integratsiyasi. Register endpoint bilan bog'lash.
// ============================================

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTelegram } from '../context/TelegramContext';
import api from '../api/axios';
import { Gamepad2, User, Lock, AlertCircle, UserPlus, Key, Building2, Phone } from 'lucide-react';

function LoginPage() {
    const { login } = useAuth();
    const { tgUser, isTelegram, autoLoginResult } = useTelegram();

    const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 📝 Login form
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });

    // 📝 Register form
    const [registerForm, setRegisterForm] = useState({
        club_name: '', username: '', password: '', full_name: ''
    });

    // 🤖 TG auto-login effect
    useEffect(() => {
        if (autoLoginResult?.registered && autoLoginResult?.token) {
            login(autoLoginResult.user, autoLoginResult.token);
        }
    }, [autoLoginResult]);

    // 🔑 Login handler
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/login', {
                username: loginForm.username,
                password: loginForm.password
            });

            // 🤖 Agar TG ichida bo'lsa — telegram_users ni bog'lash
            if (tgUser?.id) {
                try {
                    await api.post('/auth/tg-auto-login', { telegram_id: tgUser.id });
                } catch (e) { /* ignore */ }
            }

            login(res.data.user, res.data.token);
        } catch (err) {
            setError(err.response?.data?.error || 'Kirishda xatolik');
        } finally {
            setLoading(false);
        }
    };

    // 🆕 Register handler
    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/register', {
                club_name: registerForm.club_name,
                username: registerForm.username,
                password: registerForm.password,
                full_name: registerForm.full_name,
                telegram_id: tgUser?.id || null
            });
            login(res.data.user, res.data.token);
        } catch (err) {
            setError(err.response?.data?.error || 'Ro\'yxatdan o\'tishda xatolik');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-bg" />

            <div className="login-card animate-fade-in" style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-accent)',
                boxShadow: 'var(--shadow-lg)',
                borderRadius: 'var(--radius-lg)',
                maxWidth: '420px',
                width: '90%'
            }}>
                {/* 🎮 Logo */}
                <div className="login-logo" style={{ background: '#facc15', color: '#050505', borderRadius: '10px' }}>
                    <Gamepad2 size={28} strokeWidth={2.5} />
                </div>
                <h1 className="login-title" style={{ background: 'none', color: '#f8fafc', WebkitTextFillColor: 'initial' }}>
                    VipLimit <span style={{ color: '#facc15' }}>PRO</span>
                </h1>
                <p className="login-subtitle" style={{ color: '#eab308' }}>
                    Game Club Management System
                </p>

                {/* 🤖 TG User greeting */}
                {tgUser && (
                    <div style={{
                        background: 'rgba(250,204,21,0.08)',
                        border: '1px solid rgba(250,204,21,0.2)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 16px',
                        marginBottom: '16px',
                        fontSize: '0.9rem',
                        color: '#facc15',
                        textAlign: 'center'
                    }}>
                        👋 Salom, {tgUser.first_name}!
                    </div>
                )}

                {/* 📑 Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    padding: '4px',
                    marginBottom: '20px'
                }}>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('login'); setError(''); }}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            transition: 'all 0.2s',
                            background: activeTab === 'login' ? 'var(--accent-primary)' : 'transparent',
                            color: activeTab === 'login' ? '#000' : 'var(--text-muted)'
                        }}
                    >
                        <Key size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        Kirish
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('register'); setError(''); }}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            transition: 'all 0.2s',
                            background: activeTab === 'register' ? 'var(--accent-primary)' : 'transparent',
                            color: activeTab === 'register' ? '#000' : 'var(--text-muted)'
                        }}
                    >
                        <UserPlus size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        Yangi Club
                    </button>
                </div>

                {/* ❌ Error */}
                {error && (
                    <div className="login-error">
                        <AlertCircle size={15} /> {error}
                    </div>
                )}

                {/* 🔑 Login Form */}
                {activeTab === 'login' && (
                    <form onSubmit={handleLogin} className="animate-fade-in">
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input type="text" className="form-input" placeholder="Username kiriting"
                                required value={loginForm.username} autoFocus
                                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Parol</label>
                            <input type="password" className="form-input" placeholder="Parol kiriting"
                                required value={loginForm.password}
                                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}
                            style={{ marginTop: '8px' }}>
                            {loading ? 'Kutilmoqda...' : <><Key size={18} /> Kirish</>}
                        </button>
                    </form>
                )}

                {/* 🆕 Register Form */}
                {activeTab === 'register' && (
                    <form onSubmit={handleRegister} className="animate-fade-in">
                        <div className="form-group">
                            <label className="form-label">Game Club nomi</label>
                            <input type="text" className="form-input" placeholder="Masalan: Gamer Zone"
                                required value={registerForm.club_name} autoFocus
                                onChange={e => setRegisterForm({ ...registerForm, club_name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Ismingiz</label>
                            <input type="text" className="form-input" placeholder="To'liq ism"
                                required value={registerForm.full_name}
                                onChange={e => setRegisterForm({ ...registerForm, full_name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input type="text" className="form-input" placeholder="Admin username"
                                required value={registerForm.username}
                                onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Parol</label>
                            <input type="password" className="form-input" placeholder="Kuchli parol tanlang"
                                required value={registerForm.password} minLength={4}
                                onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} />
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}
                            style={{ marginTop: '8px' }}>
                            {loading ? 'Yaratilmoqda...' : <><UserPlus size={18} /> Club yaratish</>}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default LoginPage;
