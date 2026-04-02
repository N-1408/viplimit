// ============================================
// 📁 File: backend/bot.js — Telegram Bot for VipLimit Mini App
// 👤 Author: User with AI
// 📝 Description: Telegram bot that collects user phone numbers
//    and provides a WebApp button to open the VipLimit Mini App.
//    Uses long-polling in development, webhook in production.
// 📅 Created: 2026-04-03 01:28 (Tashkent Time)
// ============================================

const TelegramBot = require('node-telegram-bot-api');
const { query } = require('./config/database');

let bot = null;

/**
 * 🤖 Initialize and start the Telegram bot
 * @param {string} token - Bot API token from BotFather
 * @param {string} webAppUrl - URL of the deployed Mini App
 */
function startBot(token, webAppUrl) {
    if (!token) {
        console.log('⚠️ BOT_TOKEN topilmadi — bot ishga tushmaydi.');
        return null;
    }

    // 🤖 Create bot instance (polling mode)
    bot = new TelegramBot(token, { polling: true });

    console.log('🤖 Telegram bot ishga tushdi!');

    // ============================================
    // 📋 /start — Telefon raqam so'rash
    // ============================================
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const telegramId = msg.from.id;
        const firstName = msg.from.first_name || 'User';

        // 📱 Telefon raqam so'rash (contact button)
        await bot.sendMessage(chatId,
            `Assalomu alaykum, ${firstName}! 👋\n\n` +
            `🎮 *VipLimit PRO* — Game Club boshqaruv tizimiga xush kelibsiz!\n\n` +
            `📱 Davom etish uchun telefon raqamingizni yuboring:`,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [[{
                        text: '📱 Telefon raqamni yuborish',
                        request_contact: true
                    }]],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            }
        );
    });

    // ============================================
    // 📞 Contact — Raqam kelganda saqlash + Mini App button
    // ============================================
    bot.on('contact', async (msg) => {
        const chatId = msg.chat.id;
        const telegramId = msg.from.id;
        const phone = msg.contact.phone_number;

        try {
            // 💾 Telegram user ni saqlash yoki yangilash
            await query(
                `INSERT INTO telegram_users (telegram_id, phone)
                 VALUES ($1, $2)
                 ON CONFLICT (telegram_id) DO UPDATE SET phone = $2`,
                [telegramId, phone]
            );

            // ✅ Raqam qabul qilindi — Mini App button yuborish
            await bot.sendMessage(chatId,
                `✅ Raqamingiz qabul qilindi!\n\n` +
                `🎮 Endi VipLimit ni ochishingiz mumkin:`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{
                            text: '🎮 VipLimit PRO ni ochish',
                            web_app: { url: webAppUrl || 'https://viplimit.onrender.com' }
                        }]],
                        // 📱 Oddiy klaviaturani olib tashlash
                        remove_keyboard: true
                    }
                }
            );

            // 🗑️ Oddiy klaviaturani ham olib tashlash
            await bot.sendMessage(chatId, '⬇️ Pastdagi tugmani bosing:', {
                reply_markup: { remove_keyboard: true }
            });

        } catch (err) {
            console.error('❌ Bot contact error:', err.message);
            await bot.sendMessage(chatId, '❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
        }
    });

    // ============================================
    // ❌ Error handling
    // ============================================
    bot.on('polling_error', (err) => {
        console.error('🤖 Bot polling error:', err.code, err.message);
    });

    return bot;
}

module.exports = { startBot };
