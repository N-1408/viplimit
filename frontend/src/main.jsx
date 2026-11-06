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

// 🛑 ErrorBoundary — har qanday render xatosida qora ekran o'rniga
//    tushunarli xabar ko'rsatadi (xato matni ekranda chiqadi)
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('App crashed:', error, info?.componentStack);
    }

    render() {
        if (this.state.error) {
            return (
                <div style={{
                    minHeight: '100dvh', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 12,
                    padding: 24, textAlign: 'center', background: '#030308', color: '#fff'
                }}>
                    <div style={{ fontSize: 40 }}>⚠️</div>
                    <div style={{ fontWeight: 600 }}>Ilovada xatolik yuz berdi</div>
                    <div style={{ fontSize: 13, color: '#9CA3AF', wordBreak: 'break-word', maxWidth: 340 }}>
                        {String(this.state.error?.message || this.state.error)}
                    </div>
                    <button
                        onClick={() => { this.setState({ error: null }); window.location.reload(); }}
                        style={{
                            marginTop: 8, padding: '10px 24px', borderRadius: 12,
                            border: 'none', background: '#FFD60A', color: '#000',
                            fontWeight: 600, fontSize: 15, cursor: 'pointer'
                        }}
                    >Qaytadan urinish</button>
                </div>
            );
        }
        return this.props.children;
    }
}
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { TelegramProvider } from './context/TelegramContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
        <React.StrictMode>
            <BrowserRouter>
                <TelegramProvider>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </TelegramProvider>
            </BrowserRouter>
        </React.StrictMode>
    </ErrorBoundary>
);
