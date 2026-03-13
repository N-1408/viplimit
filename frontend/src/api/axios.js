// ============================================
// 📁 File: frontend/src/api/axios.js — API Client Configuration
// 👤 Author: User with AI
// 📝 Description: Axios instance pre-configured for VipLimit API.
//    Automatically attaches JWT token to all requests.
//    Handles 401 responses by redirecting to login.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
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
        if (error.response?.status === 401 || error.response?.status === 403) {
            // 🔒 Token expired or invalid — redirect to login
            localStorage.removeItem('viplimit_token');
            localStorage.removeItem('viplimit_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
