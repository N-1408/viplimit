// ============================================
// 📁 File: frontend/src/context/AuthContext.jsx — Authentication Context
// 👤 Author: User with AI
// 📝 Description: React Context for global authentication state.
//    Manages user login/logout, token storage, and role checking.
//    Provides auth state to all child components.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

// 🔑 Create Auth Context
const AuthContext = createContext(null);

// 📦 Auth Provider Component
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 🔄 Check for existing token on mount
    useEffect(() => {
        const token = localStorage.getItem('viplimit_token');
        const savedUser = localStorage.getItem('viplimit_user');

        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch {
                localStorage.removeItem('viplimit_token');
                localStorage.removeItem('viplimit_user');
            }
        }
        setLoading(false);
    }, []);

    // 🔑 Login function — accepts user data and token directly
    const login = (userData, token) => {
        localStorage.setItem('viplimit_token', token);
        localStorage.setItem('viplimit_user', JSON.stringify(userData));
        setUser(userData);
    };

    // 🚪 Logout function
    const logout = () => {
        localStorage.removeItem('viplimit_token');
        localStorage.removeItem('viplimit_user');
        setUser(null);
    };

    // 🎭 Check role
    const hasRole = (...roles) => {
        return user && roles.includes(user.role);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
}

// 🪝 Custom hook for using auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
