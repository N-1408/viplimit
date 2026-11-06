// ============================================
// 📁 File: frontend/src/App.jsx — Main Application Router
// 👤 Author: User with AI
// 📝 Description: Root React component with client-side routing.
//    Wraps authenticated pages with sidebar layout.
//    Redirects unauthenticated users to login page.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-04-03 01:28 (Tashkent) — 🤖 TelegramProvider, SuperAdminPage route qo'shildi
// ============================================

import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTelegram } from './context/TelegramContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import RoomsPage from './pages/RoomsPage';
import ProductsPage from './pages/ProductsPage';
import ExpensesPage from './pages/ExpensesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import SuperAdminPage from './pages/SuperAdminPage';

// 🔒 Protected Route wrapper — requires authentication
function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth();

    // ⏳ Wait for auth check
    if (loading) {
        return (
            <div className="flex-center" style={{ height: '100dvh' }}>
                <p className="text-muted">⏳ Yuklanmoqda...</p>
            </div>
        );
    }

    // 🔒 Not logged in — redirect to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 🎭 Role check
    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
}

// 🔙 Telegram native Back Button — routerga ulangan
function TelegramBackButton() {
    const { tg } = useTelegram();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    // Register/unregister the click handler once
    useEffect(() => {
        if (!tg?.BackButton) return undefined;
        const onClick = () => navigate(-1);
        tg.BackButton.onClick(onClick);
        return () => tg.BackButton.offClick(onClick);
    }, [tg, navigate]);

    // Show on inner pages, hide on root and login
    useEffect(() => {
        if (!tg?.BackButton) return;
        if (pathname === '/' || pathname === '/login') {
            tg.BackButton.hide();
        } else {
            tg.BackButton.show();
        }
    }, [tg, pathname]);

    return null;
}

// 📐 Layout wrapper — adds sidebar to authenticated pages
function AppLayout({ children }) {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-main">
                {children}
            </main>
        </div>
    );
}

function App() {
    const { user } = useAuth();
    // Removed unused isSuperAdmin from useTelegram since AuthContext provides the backend-verified status
    // const { isSuperAdmin } = useTelegram();

    return (
        <>
            <TelegramBackButton />
            <Routes>
            {/* 🔑 Login page (no sidebar) */}
            <Route path="/login" element={
                user ? <Navigate to="/" replace /> : <LoginPage />
            } />

            {/* 🎮 Rooms Dashboard (all roles) */}
            <Route path="/" element={
                <ProtectedRoute>
                    <AppLayout><RoomsPage /></AppLayout>
                </ProtectedRoute>
            } />

            {/* 🛒 Products (all roles) */}
            <Route path="/products" element={
                <ProtectedRoute>
                    <AppLayout><ProductsPage /></AppLayout>
                </ProtectedRoute>
            } />

            {/* 💸 Expenses (manager + owner) */}
            <Route path="/expenses" element={
                <ProtectedRoute roles={['manager', 'owner']}>
                    <AppLayout><ExpensesPage /></AppLayout>
                </ProtectedRoute>
            } />

            {/* 📊 Reports (manager + owner) */}
            <Route path="/reports" element={
                <ProtectedRoute roles={['manager', 'owner']}>
                    <AppLayout><ReportsPage /></AppLayout>
                </ProtectedRoute>
            } />

            {/* ⚙️ Settings (manager + owner) */}
            <Route path="/settings" element={
                <ProtectedRoute roles={['manager', 'owner']}>
                    <AppLayout><SettingsPage /></AppLayout>
                </ProtectedRoute>
            } />

            {/* 🔒 Super Admin (hidden, DB protected) */}
            {user?.isSuperAdmin && (
                <Route path="/super-admin" element={
                    <ProtectedRoute>
                        <AppLayout><SuperAdminPage /></AppLayout>
                    </ProtectedRoute>
                } />
            )}

            {/* 🚫 Catch-all — redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </>
    );
}

export default App;
