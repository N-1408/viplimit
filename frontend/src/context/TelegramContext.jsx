// ============================================
// 📁 File: frontend/src/context/TelegramContext.jsx — Telegram WebApp Context
// 👤 Author: User with AI
// 📝 Description: React Context wrapper for Telegram WebApp SDK.
//    Handles auto-login via Telegram ID, provides TG user info,
//    and manages the connection between TG and VipLimit auth.
// 📅 Created: 2026-04-03 01:28 (Tashkent Time)
// ============================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

// 🤖 Create Telegram Context
const TelegramContext = createContext(null);

// 📦 Telegram Provider Component
export function TelegramProvider({ children }) {
    const [tg, setTg] = useState(null);
    const [tgUser, setTgUser] = useState(null);
    const [autoLoginResult, setAutoLoginResult] = useState(null); // { registered, token, user, is_super_admin }
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 🤖 Initialize Telegram WebApp
        const telegram = window.Telegram?.WebApp;

        if (telegram) {
            telegram.ready();
            telegram.expand(); // 📱 Full screen mode

            // 🎨 Theme adaptation
            telegram.setHeaderColor('#0a0a0f');
            telegram.setBackgroundColor('#0a0a0f');

            setTg(telegram);

            // 👤 Get TG user info
            const user = telegram.initDataUnsafe?.user;
            if (user) {
                setTgUser(user);
                // 🤖 Try auto-login
                tryAutoLogin(user.id);
            } else {
                setLoading(false);
            }
        } else {
            // 🖥️ Not inside Telegram — dev mode
            setLoading(false);
        }
    }, []);

    // 🤖 Auto-login by Telegram ID
    const tryAutoLogin = useCallback(async (telegramId) => {
        try {
            const res = await api.post('/auth/tg-auto-login', { telegram_id: telegramId });
            setAutoLoginResult(res.data);
        } catch (err) {
            console.error('TG auto-login error:', err);
            setAutoLoginResult({ registered: false });
        } finally {
            setLoading(false);
        }
    }, []);

    // 🔍 Is running inside Telegram?
    const isTelegram = !!tg;

    // 🔒 Is Super Admin?
    const isSuperAdmin = autoLoginResult?.is_super_admin || false;

    return (
        <TelegramContext.Provider value={{
            tg,
            tgUser,
            isTelegram,
            isSuperAdmin,
            autoLoginResult,
            loading
        }}>
            {children}
        </TelegramContext.Provider>
    );
}

// 🪝 Custom hook
export function useTelegram() {
    const context = useContext(TelegramContext);
    if (!context) {
        throw new Error('useTelegram must be used within a TelegramProvider');
    }
    return context;
}
