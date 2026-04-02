// ============================================
// 📁 File: backend/bot.js — Telegram Bot for VipLimit Mini App
// 👤 Author: User with AI
// 📝 Description: Telegram bot that collects user phone numbers
//    and provides a WebApp button to open the VipLimit Mini App.
//    Uses long-polling in development, webhook in production.
// 📅 Created: 2026-04-03 01:28 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-04-03 03:15 (Tashkent) — 🐛 409 Conflict fix: graceful shutdown,
//    startup delay, va error retry logic qo'shildi
// ============================================

const TelegramBot = require('node-telegram-bot-api');
const { query } = require('./config/database');

let bot = null;

/**
 * 🤖 Initialize and start the Telegram bot
 * @param {string} token - Bot API token from BotFather
 * @param {string} webAppUrl - URL of the deployed Mini App
 */
async function startBot(token, webAppUrl) {
    if (!token) {
        console.log('⚠️ BOT_TOKEN topilmadi — bot ishga tushmaydi.');
        return null;
    }

    // ⏳ Deploy transitioni kutish (409 Conflict oldini olish)
    console.log('🤖 Bot 3 sekunddan keyin ishga tushadi...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 🤖 Create bot instance (polling mode with error recovery)
    bot = new TelegramBot(token, {
        polling: {
            interval: 2000,           // 📡 2 sekund oralatib so'rash
            autoStart: true,
            params: { timeout: 10 }   // ⏱️ Long polling timeout
        }
    });

    console.log('🤖 Telegram bot ishga tushdi!');

    // ============================================
    // 📋 /start — Telefon raqam so'rash
    // ============================================
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
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
                [String(telegramId), phone]
            );

            // ✅ Raqamingiz qabul qilindi va WebApp tugmasini doimiy klaviaturaga qo'shish
            await bot.sendMessage(chatId,
                `✅ Raqamingiz qabul qilindi!\n\n🎮 Endi VipLimit Admin panelini ochishingiz mumkin. Pastdagi tugmani bosing:`,
                {
                    reply_markup: {
                        keyboard: [[{
                            text: '🎮 Admin panel (VipLimit PRO)',
                            web_app: { url: webAppUrl || 'https://viplimit.onrender.com' }
                        }]],
                        resize_keyboard: true,
                        is_persistent: true
                    }
                }
            );

        } catch (err) {
            console.error('❌ Bot contact error:', err.message);
            await bot.sendMessage(chatId, '❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
        }
    });

    // ============================================
    // ❌ Error handling — 409 recovery
    // ============================================
    bot.on('polling_error', (err) => {
        // 🔇 409 Conflict — deploy paytida normal holat, logni kamaytirish
        if (err.code === 'ETELEGRAM' && err.message.includes('409')) {
            // Har 30 sekundda faqat bir marta log chiqarish
            if (!bot._lastConflictLog || Date.now() - bot._lastConflictLog > 30000) {
                console.log('⚠️ Bot 409: boshqa instance hali to\'xtamagan, kutilmoqda...');
                bot._lastConflictLog = Date.now();
            }
            return;
        }
        console.error('🤖 Bot error:', err.code, err.message);
    });

    return bot;
}

/**
 * 🛑 Graceful bot shutdown
 */
function stopBot() {
    if (bot) {
        console.log('🛑 Bot polling to\'xtatilmoqda...');
        bot.stopPolling();
        bot = null;
    }
}

module.exports = { startBot, stopBot };
