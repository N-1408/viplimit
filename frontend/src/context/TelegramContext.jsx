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
        const telegram = window.Telegram?.WebApp;

        if (telegram) {
            // 🛡️ Har bir Telegram API chaqiruvi himoyalangan — eski webview'larda
            //    ba'zi metodlar mavjud emas yoki xato tashlaydi; xato butun ilovani
            //    qora ekranga aylantirmasligi kerak.
            try { telegram.ready(); } catch (e) {}
            try { telegram.expand(); } catch (e) {}
            try {
                if (telegram.disableVerticalSwipes) {
                    telegram.disableVerticalSwipes();
                }
            } catch (e) {}

            // 🎨 Theme adaptation
            try { telegram.setHeaderColor('#030308'); } catch (e) {}
            try { telegram.setBackgroundColor('#030308'); } catch (e) {}

            // 🖥️ Full screen mode (Bot API 8.0+; eski versiyalarda expand() yetarli)
            try {
                if (telegram.requestFullscreen) {
                    const fs = telegram.requestFullscreen();
                    if (fs && typeof fs.catch === 'function') fs.catch(() => {});
                }
            } catch (e) {}

            setTg(telegram);

            // 📐 Safe area insets (Bot API 9.0+) — CSS o'zgaruvchilarga yozamiz
            const applySafeArea = () => {
                const rootStyle = document.documentElement.style;
                const sa = telegram.safeAreaInset || {};
                const csa = telegram.contentSafeAreaInset || {};
                rootStyle.setProperty('--tg-safe-area-inset-top', (sa.top || 0) + 'px');
                rootStyle.setProperty('--tg-safe-area-inset-bottom', (sa.bottom || 0) + 'px');
                rootStyle.setProperty('--tg-safe-area-inset-left', (sa.left || 0) + 'px');
                rootStyle.setProperty('--tg-safe-area-inset-right', (sa.right || 0) + 'px');
                rootStyle.setProperty('--tg-content-safe-area-inset-top', (csa.top || 0) + 'px');
                rootStyle.setProperty('--tg-content-safe-area-inset-bottom', (csa.bottom || 0) + 'px');
            };
            try {
                applySafeArea();
                if (telegram.onEvent) {
                    telegram.onEvent('viewportChanged', applySafeArea);
                    telegram.onEvent('safeAreaChanged', applySafeArea);
                }
            } catch (e) {}

            // 👤 Get TG user info
            const user = telegram.initDataUnsafe?.user;
            if (user) {
                setTgUser(user);
                // 🤖 Try auto-login (Telegram initData bilan — xavfsiz)
                tryAutoLogin();
            } else {
                setLoading(false);
            }
        } else {
            // 🖥️ Not inside Telegram — dev mode
            setLoading(false);
        }
    }, []);

    // 🤖 Auto-login via Telegram initData (server imzosini tekshiradi)
    const tryAutoLogin = useCallback(async () => {
        try {
            const initData = window.Telegram?.WebApp?.initData || '';
            const res = await api.post('/auth/tg-auto-login', { init_data: initData });
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

    // 📳 Haptic feedback helper
    const haptic = {
        impact: (style = 'light') => tg?.HapticFeedback?.impactOccurred(style),
        notify: (type = 'success') => tg?.HapticFeedback?.notificationOccurred(type),
        select: () => tg?.HapticFeedback?.selectionChanged(),
    };

    // 🔒 Is Super Admin?
    const isSuperAdmin = autoLoginResult?.is_super_admin || false;

    return (
        <TelegramContext.Provider value={{
            tg,
            tgUser,
            isTelegram,
            isSuperAdmin,
            haptic,
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
