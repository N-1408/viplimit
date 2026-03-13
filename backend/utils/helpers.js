// ============================================
// 📁 File: backend/utils/helpers.js — Utility Helper Functions
// 👤 Author: User with AI
// 📝 Description: Common utility functions used across the backend.
//    Includes time formatting, currency formatting,
//    and billing calculation helpers.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================

// ⏱️ Calculate duration in minutes between two timestamps
const calculateDurationMinutes = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end - start;
    return Math.max(0, diffMs / (1000 * 60)); // 📊 Result in minutes
};

// ⏱️ Format duration as "Xh Ym" string
const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
};

// 💰 Calculate session cost based on time and rate
const calculateTimeCost = (durationMinutes, hourlyRate) => {
    // 📊 Price per minute = hourly rate / 60
    const perMinuteRate = hourlyRate / 60;
    return Math.round(durationMinutes * perMinuteRate * 100) / 100;
};

// 💵 Format currency in UZS
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('uz-UZ', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount) + ' so\'m';
};

// 📅 Get current Tashkent time as ISO string
const getTashkentTime = () => {
    return new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Tashkent'
    });
};

// 🔒 Sanitize input string (basic XSS prevention)
const sanitize = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>]/g, '');
};

module.exports = {
    calculateDurationMinutes,
    formatDuration,
    calculateTimeCost,
    formatCurrency,
    getTashkentTime,
    sanitize
};
