// ============================================
// 📁 File: frontend/src/utils/formatters.js — Formatting Utilities
// 👤 Author: User with AI
// 📝 Description: Utility functions for formatting time, currency,
//    and dates in the VipLimit frontend. All currency values
//    are formatted in Uzbek Som (UZS).
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================

// 💰 Format number as UZS currency
export const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return num.toLocaleString('uz-UZ') + ' so\'m';
};

// ⏱️ Format duration from minutes to "Xh Ym" string
export const formatDuration = (minutes) => {
    const mins = Math.round(minutes);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0) {
        return `${hours}h ${remainingMins}m`;
    }
    return `${remainingMins}m`;
};

// ⏱️ Format elapsed time from start timestamp (live timer)
export const getElapsedTime = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.max(0, now - start);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
        formatted: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
        totalMinutes: diff / (1000 * 60),
        hours,
        minutes,
        seconds
    };
};

// ⏱️ Format remaining time until scheduled end
export const getRemainingTime = (scheduledEnd) => {
    if (!scheduledEnd) return null;
    const end = new Date(scheduledEnd);
    const now = new Date();
    const diff = Math.max(0, end - now);

    if (diff === 0) return { formatted: '00:00:00', expired: true };

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
        formatted: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
        expired: false,
        totalMinutes: diff / (1000 * 60)
    };
};

// 📅 Format date nicely
export const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// 📅 Format date and time
export const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('uz-UZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 📅 Get today's date as YYYY-MM-DD
export const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
};
