// ============================================
// 📁 File: frontend/src/App.jsx — Main Application Router
// 👤 Author: User with AI
// 📝 Description: Root React component with client-side routing.
//    Wraps authenticated pages with sidebar layout.
//    Redirects unauthenticated users to login page.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import RoomsPage from './pages/RoomsPage';
import ProductsPage from './pages/ProductsPage';
import ExpensesPage from './pages/ExpensesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

// 🔒 Protected Route wrapper — requires authentication
function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth();

    // ⏳ Wait for auth check
    if (loading) {
        return (
            <div className="flex-center" style={{ height: '100vh' }}>
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

    return (
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

            {/* 🚫 Catch-all — redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
