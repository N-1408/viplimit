// ============================================
// 📁 File: frontend/src/api/axios.js — API Client Configuration
// 👤 Author: User with AI
// 📝 Description: Axios instance pre-configured for VipLimit API.
//    Automatically attaches JWT token to all requests.
//    Handles 401 responses by redirecting to login.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-03-24 16:13 (Tashkent) — 🔒 #8: 401 va 403 ajratildi.
//    401 = token expired → logout. 403 = ruxsat yo'q → reject (logout qilmaslik).
// ============================================

import axios from 'axios';

// 🌐 Create axios instance with base URL
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// 🔑 Request interceptor — attach JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('viplimit_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ❌ Response interceptor — handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // 🔒 401 = Token expired/invalid — logout va login sahifasiga yo'naltirish
        if (error.response?.status === 401) {
            localStorage.removeItem('viplimit_token');
            localStorage.removeItem('viplimit_user');
            window.location.href = '/login';
        }
        // 🚫 403 = Ruxsat yo'q — faqat reject (logout QILMASLIK!)
        // Foydalanuvchi login qilgan, lekin bu amalni bajarish huquqi yo'q
        return Promise.reject(error);
    }
);

export default api;

