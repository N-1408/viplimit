// ============================================
// 📁 File: frontend/src/main.jsx — React Application Entry Point
// 👤 Author: User with AI
// 📝 Description: React entry point that renders the App component
//    inside the root DOM element. Sets up BrowserRouter for
//    client-side routing.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);
