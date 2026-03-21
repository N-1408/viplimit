// ============================================
// 📁 File: frontend/src/pages/LoginPage.jsx — Login & Owner Setup Page
// 👤 Author: User with AI
// 📝 Description: Authentication page with glassmorphism design.
//    Supports login for existing users and initial owner creation.
//    Features animated gradient background for premium first impression.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-03-21 12:08 (Tashkent) — V6.0 Apple/Telegram UI Redesign:
//    - Inherited global CSS variables for tighter card paddings.
// 2026-03-13 03:20 (Tashkent) — v3.0 Premium Elite UI: Switched to Apple/TG
//    clean aesthetic. Removed aggressive glows and simplified layout.
// ============================================

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Gamepad2, User, Lock, AlertCircle, UserPlus, Key } from 'lucide-react';

function LoginPage() {
    const { login } = useAuth();
    const [isSetup, setIsSetup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 📝 Form state
    const [form, setForm] = useState({
        username: '', password: '', full_name: ''
    });

    // 🔑 Login handler
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/login', {
                username: form.username, password: form.password
            });
            login(res.data.user, res.data.token);
        } catch (err) {
            setError(err.response?.data?.error || 'Kirishda xatolik');
        } finally {
            setLoading(false);
        }
    };

    // 🔧 Owner setup handler
    const handleSetup = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/setup', {
                username: form.username, password: form.password,
                full_name: form.full_name
            });
            login(res.data.user, res.data.token);
        } catch (err) {
            setError(err.response?.data?.error || 'Setup xatoligi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-bg" />

            <div className="login-card animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', boxShadow: 'var(--shadow-lg)', borderRadius: 'var(--radius-lg)' }}>
                {/* 🎮 Logo */}
                <div className="login-logo" style={{ background: '#facc15', color: '#050505', borderRadius: '10px' }}>
                    <Gamepad2 size={28} strokeWidth={2.5} />
                </div>
                <h1 className="login-title" style={{ background: 'none', color: '#f8fafc', WebkitTextFillColor: 'initial' }}>
                    VipLimit <span style={{ color: '#facc15' }}>PRO</span>
                </h1>
                <p className="login-subtitle" style={{ color: '#eab308' }}>
                    {isSetup ? 'Birinchi owner akkaunt yarating' : 'Game Club Manager'}
                </p>

                {/* ❌ Error */}
                {error && (
                    <div className="login-error">
                        <AlertCircle size={15} /> {error}
                    </div>
                )}

                <form onSubmit={isSetup ? handleSetup : handleLogin}>
                    {/* 👤 Full name (setup only) */}
                    {isSetup && (
                        <div className="form-group">
                            <label className="form-label">Ism Familiya</label>
                            <input type="text" className="form-input" placeholder="To'liq ism"
                                required value={form.full_name}
                                onChange={e => setForm({ ...form, full_name: e.target.value })} />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input type="text" className="form-input" placeholder="Username kiriting"
                            required value={form.username}
                            onChange={e => setForm({ ...form, username: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Parol</label>
                        <input type="password" className="form-input" placeholder="Parol kiriting"
                            required value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })} />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}
                        style={{ marginTop: '8px' }}>
                        {loading ? 'Kutilmoqda...' : isSetup ? (
                            <><UserPlus size={18} /> Owner yaratish</>
                        ) : (
                            <><Key size={18} /> Kirish</>
                        )}
                    </button>
                </form>

                <div className="text-center mt-16">
                    <button className="btn btn-ghost btn-sm" onClick={() => {
                        setIsSetup(!isSetup);
                        setError('');
                        setForm({ username: '', password: '', full_name: '' });
                    }}>
                        {isSetup ? 'Akkauntim bor → Kirish' : 'Birinchi marta? Owner yarating →'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
