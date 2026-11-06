// ============================================
// 📁 File: backend/bot.js — Telegram Bot for VipLimit Mini App
// 📝 Description: Chat mantiqi (2026-11 qayta qurilgan):
//    1) /start — ro'yxatdan o'tgan foydalanuvchiga telefon SO'RALMAYDI,
//       darhol Mini App tugmasi beriladi. Yangi foydalanuvchidan bir marta
//       telefon so'raladi.
//    2) Barcha tugmalar inline web_app uslubida (doimiy reply keyboard olib
//       tashlanadi), Chat Menu Button o'zi Mini App ochadi.
//    3) /shep — Super Admin maxsus komandasi (parol env'dan).
// ============================================

const TelegramBot = require('node-telegram-bot-api');
const https = require('https');
const { query } = require('./config/database');

const DEFAULT_APP_URL = 'https://viplimit.onrender.com';

let bot = null;
let botToken = null;
let appUrl = DEFAULT_APP_URL;
const shepState = {};

/**
 * 🌐 Telegram Bot API'ga xom so'rov (node-telegram-bot-api qo'llab-quvvatlamagan
 *    metodlar uchun: setChatMenuButton va h.k.)
 */
function callApi(method, payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload || {});
        const req = https.request({
            hostname: 'api.telegram.org',
            path: `/bot${botToken}/${method}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            },
            timeout: 15000
        }, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (parsed.ok) {
                        resolve(parsed.result);
                    } else {
                        reject(new Error(`${method}: ${parsed.description || 'unknown error'}`));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => req.destroy(new Error('timeout')));
        req.write(data);
        req.end();
    });
}

/**
 * 🔍 telegram_users jadvalidan foydalanuvchini topish
 */
async function findTgUser(telegramId) {
    const res = await query(
        'SELECT id, phone FROM telegram_users WHERE telegram_id = $1 LIMIT 1',
        [String(telegramId)]
    );
    return res.rows[0] || null;
}

/**
 * 🎮 Inline Mini App tugmasi
 */
function inlineWebApp(text) {
    return { inline_keyboard: [[{ text: text || '🎮 VipLimitni ochish', web_app: { url: appUrl } }]] };
}

/**
 * 🤖 Initialize and start the Telegram bot
 */
async function startBot(token, webAppUrl) {
    if (!token) {
        console.log('⚠️ BOT_TOKEN topilmadi — bot ishga tushmaydi.');
        return null;
    }

    botToken = token;
    appUrl = webAppUrl || DEFAULT_APP_URL;

    // ⏳ Deploy transitioni kutish (409 Conflict oldini olish)
    console.log('🤖 Bot 3 sekunddan keyin ishga tushadi...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    bot = new TelegramBot(token, {
        polling: {
            interval: 2000,
            autoStart: true,
            params: { timeout: 10 }
        }
    });

    console.log('🤖 Telegram bot ishga tushdi!');

    // ============================================
    // 🧹 Menyuni yangilash: buyruqlar ro'yxatini bo'shatish,
    //    Chat Menu Button'ni to'g'ridan-to'g'ri Mini App qilish
    // ============================================
    callApi('setMyCommands', { commands: [] }).catch(() => {});
    callApi('setChatMenuButton', {
        menu_button: {
            type: 'web_app',
            text: '🎮 VipLimit',
            web_app: { url: appUrl }
        }
    }).catch((err) => console.log('⚠️ setChatMenuButton:', err.message));

    // ============================================
    // 🚀 /start — holatga qarab ikki yo'l
    // ============================================
    bot.onText(/^\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const firstName = msg.from.first_name || 'dost';

        try {
            const existing = await findTgUser(msg.from.id);

            if (existing) {
                // ✅ Allaqachon ro'yxatdan o'tgan — telefon SO'RALMAYDI
                await bot.sendMessage(
                    chatId,
                    `Xush kelibsiz, ${firstName}! 👋\n\n` +
                    `🎮 VipLimit — Game Club boshqaruv tizimi.\n\n` +
                    `Pastdagi tugma orqali panelni ochingiz:`,
                    { reply_markup: inlineWebApp('🎮 Admin panelni ochish') }
                );
            } else {
                // 📱 Yangi foydalanuvchi — bir marta telefon so'raladi
                await bot.sendMessage(
                    chatId,
                    `Assalomu alaykum, ${firstName}! 👋\n\n` +
                    `🎮 VipLimit — Game Club boshqaruv tizimiga xush kelibsiz.\n\n` +
                    `📱 Davom etish uchun pastdagi tugma bilan raqamingizni yuboring:`,
                    {
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
            }
        } catch (err) {
            console.error('❌ Bot /start error:', err.message);
            await bot.sendMessage(chatId, '⚠️ Xatolik yuz berdi. Qaytadan /start bosing.');
        }
    });

    // ============================================
    // 📞 Contact — raqam kelganda bir marta saqlash
    // ============================================
    bot.on('contact', async (msg) => {
        const chatId = msg.chat.id;
        const telegramId = msg.from.id;
        const phone = msg.contact.phone_number;

        try {
            await query(
                `INSERT INTO telegram_users (telegram_id, phone)
                 VALUES ($1, $2)
                 ON CONFLICT (telegram_id) DO UPDATE SET phone = $2`,
                [String(telegramId), phone]
            );

            // 🧹 Eski doimiy klaviaturani tozalash
            await bot.sendMessage(chatId, '✅ Raqamingiz saqlandi!', {
                reply_markup: { remove_keyboard: true, selective: false }
            });

            // 🎮 Mini App tugmasi (inline uslubda)
            await bot.sendMessage(
                chatId,
                '🎮 Tayyor! VipLimit panelini ochingiz:',
                { reply_markup: inlineWebApp('🎮 Admin panelni ochish') }
            );
        } catch (err) {
            console.error('❌ Bot contact error:', err.message);
            await bot.sendMessage(chatId, '❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
        }
    });

    // ============================================
    // 🕵️‍♂️ Secret /shep command for Super Admin
    // ============================================
    bot.onText(/^\/shep$/, async (msg) => {
        const chatId = msg.chat.id;
        const superAdminId = process.env.SUPER_ADMIN_TG_ID;
        if (superAdminId && String(chatId) === String(superAdminId)) {
            shepState[chatId] = true;
            await bot.sendMessage(chatId, 'Parolni kiriting:');
        }
    });

    // ============================================
    // 💬 Oddiy matn xabarlar — holatga qarab yo'naltirish
    // ============================================
    bot.on('message', async (msg) => {
        if (!msg.text || msg.text.startsWith('/')) return;

        const chatId = msg.chat.id;

        // 🔐 /shep parol bosqichi
        if (shepState[chatId]) {
            const expectedPassword = process.env.SUPER_ADMIN_PASSWORD;
            delete shepState[chatId];
            if (expectedPassword && msg.text === expectedPassword) {
                const base = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
                await bot.sendMessage(chatId, '🧹 Eski klaviatura tozalandi.', {
                    reply_markup: { remove_keyboard: true, selective: false }
                });
                await bot.sendMessage(
                    chatId,
                    '🛡️ Super admin huquqi tasdiqlandi. Panelni ochingiz:',
                    {
                        reply_markup: {
                            inline_keyboard: [[{
                                text: '🛡️ Super Admin panel',
                                web_app: { url: `${base}/super-admin` }
                            }]]
                        }
                    }
                );
            }
            return;
        }

        // 💬 Boshqa matnlar — foydali qisqa yo'naltirish
        try {
            const existing = await findTgUser(msg.from.id);
            if (existing) {
                await bot.sendMessage(
                    chatId,
                    '🎮 Barcha amallar Mini App ichida bajariladi:',
                    { reply_markup: inlineWebApp('🎮 VipLimitni ochish') }
                );
            } else {
                await bot.sendMessage(
                    chatId,
                    '📱 Avval raqamingizni yuboring:',
                    {
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
            }
        } catch (err) {
            console.error('❌ Bot message error:', err.message);
        }
    });

    // ============================================
    // ❌ Error handling — 409 recovery
    // ============================================
    bot.on('polling_error', (err) => {
        if (err.code === 'ETELEGRAM' && err.message.includes('409')) {
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
