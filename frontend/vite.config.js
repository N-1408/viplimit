// ============================================
// 📁 File: frontend/vite.config.js — Vite Build Configuration
// 👤 Author: User with AI
// 📝 Description: Vite configuration for VipLimit frontend.
//    Uses React plugin and proxies API requests to backend.
//    Optimized for development and production builds.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true
            }
        }
    }
});
