// ============================================
// 📁 File: frontend/src/pages/SettingsPage.jsx — Settings & User Management
// 👤 Author: User with AI
// 📝 Description: Settings page for managing users (admins/managers),
//    branch info, and system configuration. Restricted to
//    manager and owner roles.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-03-21 12:08 (Tashkent) — V6.0 Apple/Telegram UI Redesign:
//    - Inherited global CSS variables for tighter section paddings.
// ============================================

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function SettingsPage() {
    const { user, hasRole } = useAuth();
    const [showUserModal, setShowUserModal] = useState(false);
    const [userForm, setUserForm] = useState({
        username: '', password: '', full_name: '', role: 'admin'
    });
    const [message, setMessage] = useState('');

    // ➕ Create new user (manager/admin)
    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            // 🔧 For now, create via auth setup (will be expanded later)
            setMessage('✅ Foydalanuvchi tizimi kengaytiriladi!');
            setShowUserModal(false);
        } catch (err) {
            setMessage(err.response?.data?.error || '❌ Xatolik yuz berdi');
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">⚙️ Sozlamalar</h1>
                    <p className="page-subtitle">Tizim sozlamalari va foydalanuvchilar</p>
                </div>
            </div>

            {message && (
                <div className="card mb-24" style={{ borderColor: 'var(--accent-success)' }}>
                    <p>{message}</p>
                </div>
            )}

            {/* 👤 Current User Info */}
            <div className="card mb-24">
                <h3 className="mb-16 font-bold">👤 Joriy foydalanuvchi</h3>
                <div className="grid-2">
                    <div>
                        <p className="text-muted" style={{ fontSize: '0.85rem' }}>Ism</p>
                        <p className="font-bold">{user?.full_name}</p>
                    </div>
                    <div>
                        <p className="text-muted" style={{ fontSize: '0.85rem' }}>Username</p>
                        <p className="font-bold">{user?.username}</p>
                    </div>
                    <div>
                        <p className="text-muted" style={{ fontSize: '0.85rem' }}>Rol</p>
                        <p className="font-bold" style={{ textTransform: 'capitalize' }}>
                            {user?.role === 'owner' ? '👑 Owner' : user?.role === 'manager' ? '📋 Manager' : '🎮 Admin'}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted" style={{ fontSize: '0.85rem' }}>Filial ID</p>
                        <p className="font-bold">{user?.branch_id}</p>
                    </div>
                </div>
            </div>

            {/* ℹ️ System Info */}
            <div className="card mb-24">
                <h3 className="mb-16 font-bold">ℹ️ Tizim haqida</h3>
                <div className="grid-2">
                    <div>
                        <p className="text-muted" style={{ fontSize: '0.85rem' }}>Dastur</p>
                        <p className="font-bold">VipLimit v1.0.0</p>
                    </div>
                    <div>
                        <p className="text-muted" style={{ fontSize: '0.85rem' }}>Turdagi</p>
                        <p className="font-bold">Game Club Management System</p>
                    </div>
                </div>
            </div>

            {/* 🔮 Coming soon features */}
            <div className="card">
                <h3 className="mb-16 font-bold">🔮 Tez kunda</h3>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: '2' }}>
                    <li>👥 Foydalanuvchi qo'shish va boshqarish</li>
                    <li>🏢 Filial sozlamalari</li>
                    <li>💰 Narxlash qoidalari (tungi tarif, promo)</li>
                    <li>🔔 Bildirishnoma sozlamalari</li>
                    <li>🖨️ Chek chiqarish sozlamalari</li>
                </ul>
            </div>
        </div>
    );
}

export default SettingsPage;
