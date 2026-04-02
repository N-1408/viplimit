// ============================================
// 📁 File: frontend/src/main.jsx — React Application Entry Point
// 👤 Author: User with AI
// 📝 Description: React entry point that renders the App component
//    inside the root DOM element. Sets up BrowserRouter for
//    client-side routing.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-04-03 01:28 (Tashkent) — 🤖 TelegramProvider qo'shildi
// ============================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { TelegramProvider } from './context/TelegramContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <TelegramProvider>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </TelegramProvider>
        </BrowserRouter>
    </React.StrictMode>
);
