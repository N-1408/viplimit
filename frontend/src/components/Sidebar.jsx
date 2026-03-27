// ============================================
// 📁 File: frontend/src/components/Sidebar.jsx — Navigation Sidebar
// 👤 Author: User with AI
// 📝 Description: Main navigation sidebar with role-based menu links.
//    Shows VipLimit branding, user info, and logout button.
//    Uses Lucide React icons for modern look.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-03-24 17:15 (Tashkent) — 📱 Mobile Bottom Nav support: NavLinks now stack icons/text and logo hides on mobile (via CSS).
// 2026-03-13 03:20 (Tashkent) — v3.0 Premium Elite UI: Switched to Apple/TG
//    clean aesthetic. Used a solid #FFD60A squircle for the logo icon.
// ============================================

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Gamepad2, ShoppingBag, BarChart3,
    Settings, Shield, LogOut, Wallet
} from 'lucide-react';

function Sidebar() {
    const { user, logout, hasRole } = useAuth();
    const navigate = useNavigate();

    // 🔗 Navigation links with Lucide icons
    const navLinks = [
        { path: '/', label: 'Xonalar', icon: Gamepad2, roles: ['admin', 'manager', 'owner'] },
        { path: '/products', label: 'Mahsulotlar', icon: ShoppingBag, roles: ['admin', 'manager', 'owner'] },
        { path: '/expenses', label: 'Xarajatlar', icon: Wallet, roles: ['manager', 'owner'] },
        { path: '/reports', label: 'Hisobotlar', icon: BarChart3, roles: ['manager', 'owner'] },
        { path: '/settings', label: 'Sozlamalar', icon: Settings, roles: ['manager', 'owner'] },
    ];

    // 🚪 Logout handler
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // 👤 User initials for avatar
    const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    return (
        <aside className="app-sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon" style={{ background: 'var(--accent-primary)', color: 'var(--accent-text)', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Gamepad2 size={24} />
                </div>
                <h2>VipLimit <span style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>PRO</span></h2>
            </div>

            {/* 🧭 Navigation */}
            <nav className="sidebar-nav">
                {navLinks.filter(link =>
                    link.roles.some(r => hasRole(r))
                ).map(link => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        end={link.path === '/'}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                        <link.icon className="link-icon" size={20} />
                        {link.label}
                    </NavLink>
                ))}
            </nav>

            {/* 👤 User info & logout */}
            <div className="sidebar-user">
                <div className="sidebar-user-avatar">{initials}</div>
                <div className="sidebar-user-info">
                    <div className="sidebar-user-name">{user?.full_name}</div>
                    <div className="sidebar-user-role">{user?.role}</div>
                </div>
                <button className="sidebar-logout" onClick={logout} title="Tizimdan chiqish" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
