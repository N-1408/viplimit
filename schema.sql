-- ============================================
-- 📁 File: schema.sql — VipLimit Full Database Schema
-- 👤 Author: User with AI
-- 📝 Description: Complete PostgreSQL database schema for VipLimit
--    Game Club Management System. Contains all 13 tables:
--    branches, users, rooms, pricing_rules, sessions,
--    reservations, products, session_products, audit_logs,
--    expenses, telegram_users, plans, promo_codes.
-- 📅 Created: 2026-03-12 05:51 (Tashkent Time)
-- ============================================
-- 📋 CHANGE LOG:
-- 2026-04-03 01:28 (Tashkent) — 🤖 Telegram Mini App + Super Admin:
--    - telegram_users jadvali qo'shildi (TG ↔ Club bog'lanishi)
--    - plans jadvali qo'shildi (Free/Pro/Enterprise tariflar)
--    - promo_codes jadvali qo'shildi
--    - branches jadvaliga plan_id, is_enabled, subscription_until qo'shildi
--    - users.username constraint: GLOBALLY UNIQUE → BRANCH-SCOPED UNIQUE
-- ============================================

-- 🧹 Drop existing tables (for fresh install only)
DROP TABLE IF EXISTS telegram_users CASCADE;
DROP TABLE IF EXISTS promo_codes CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS session_products CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS pricing_rules CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS branches CASCADE;

-- 🔧 Drop custom ENUM types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS room_status CASCADE;
DROP TYPE IF EXISTS rule_type CASCADE;
DROP TYPE IF EXISTS session_type CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS reservation_status CASCADE;

-- ============================================
-- 📊 ENUM Types
-- ============================================

-- 👤 User roles
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'admin');

-- 🚪 Room statuses
CREATE TYPE room_status AS ENUM ('free', 'busy', 'maintenance');

-- 💰 Pricing rule types
CREATE TYPE rule_type AS ENUM ('time_of_day', 'day_of_week', 'minimum_charge', 'overtime', 'promo');

-- 🎮 Session types
CREATE TYPE session_type AS ENUM ('walk_in', 'reserved', 'scheduled');

-- ⏱️ Session statuses
CREATE TYPE session_status AS ENUM ('active', 'completed', 'cancelled');

-- 💳 Payment methods
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer');

-- 📅 Reservation statuses
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'started', 'cancelled', 'no_show');

-- ============================================
-- 🏢 1. BRANCHES — Filiallar
-- ============================================
CREATE TABLE branches (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,                      -- 🏷️ Filial nomi
    address             TEXT,                                       -- 📍 Manzil
    phone               VARCHAR(20),                                -- 📞 Telefon
    settings            JSONB DEFAULT '{"consoles": ["PS3", "PS4", "PS5"]}', -- ⚙️ Filial sozlamalari
    plan_id             INT DEFAULT 1,                              -- 📦 Tarif rejasi (default: Free)
    is_enabled          BOOLEAN DEFAULT true,                       -- ✅ Super Admin tomonidan yoqilganmi
    subscription_until  TIMESTAMP,                                  -- 📅 Obuna muddati
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP         -- 📅 Yaratilgan vaqt
);

-- 🏷️ Default filial (MVP uchun)
INSERT INTO branches (name, address, phone) 
VALUES ('Asosiy Filial', 'Toshkent shahar', '+998901234567');

-- ============================================
-- 👤 2. USERS — Foydalanuvchilar
-- ============================================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    branch_id       INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,  -- 🏢 Filial
    username        VARCHAR(50) NOT NULL,                                     -- 🔑 Login
    password_hash   VARCHAR(255) NOT NULL,                                    -- 🔒 Hashed parol
    full_name       VARCHAR(100) NOT NULL,                                    -- 👤 Ism familiya
    role            user_role NOT NULL DEFAULT 'admin',                       -- 🎭 Rol (owner/manager/admin)
    is_active       BOOLEAN DEFAULT true,                                     -- ✅ Faolmi
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP                       -- 📅 Yaratilgan vaqt
);

-- 🔑 Branch-scoped unique username (har bir club ichida unique)
CREATE UNIQUE INDEX idx_users_branch_username ON users(branch_id, username);
CREATE INDEX idx_users_username ON users(username);

-- ============================================
-- 🚪 3. ROOMS — Xonalar
-- ============================================
CREATE TABLE rooms (
    id              SERIAL PRIMARY KEY,
    branch_id       INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,  -- 🏢 Filial
    name            VARCHAR(50) NOT NULL,                                     -- 🏷️ Xona nomi ("Room 1", "VIP 2")
    console_type    VARCHAR(30) NOT NULL DEFAULT 'PS5',                      -- 🎮 Console turi (PS3/PS4/PS5/PS5 Pro)
    capacity        INT NOT NULL DEFAULT 2,                                   -- 👥 Sig'im (necha o'yinchi)
    hourly_rate     DECIMAL(12,2) NOT NULL,                                  -- 💰 Oddiy narx (soatiga)
    vip_hourly_rate DECIMAL(12,2) NOT NULL,                                  -- 💎 VIP narx (soatiga)
    status          room_status NOT NULL DEFAULT 'free',                     -- 🚦 Holati (free/busy/maintenance)
    is_active       BOOLEAN DEFAULT true,                                     -- ✅ Faolmi
    sort_order      INT DEFAULT 0,                                             -- 🔄 Tartiblash uchun
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP                       -- 📅 Yaratilgan vaqt
);

-- 🔑 Index for filtering by branch and status
CREATE INDEX idx_rooms_branch_status ON rooms(branch_id, status);

-- ============================================
-- 💰 4. PRICING_RULES — Narxlash qoidalari
-- ============================================
CREATE TABLE pricing_rules (
    id              SERIAL PRIMARY KEY,
    branch_id       INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,  -- 🏢 Filial
    room_id         INT REFERENCES rooms(id) ON DELETE CASCADE,              -- 🚪 Maxsus xona (NULL = hammaga)
    name            VARCHAR(100) NOT NULL,                                    -- 🏷️ Qoida nomi ("Tungi tarif")
    rule_type       rule_type NOT NULL,                                       -- 📋 Qoida turi
    conditions      JSONB NOT NULL DEFAULT '{}',                              -- 📊 Shartlar ({"start_hour":22, "end_hour":6})
    rate_modifier   DECIMAL(5,2) NOT NULL DEFAULT 1.00,                      -- 📈 Narx koeffitsienti (0.80=20% off, 1.50=50% up)
    priority        INT NOT NULL DEFAULT 0,                                   -- 🔢 Ustuvorlik (katta = birinchi)
    is_active       BOOLEAN DEFAULT true,                                     -- ✅ Faolmi
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP                       -- 📅 Yaratilgan vaqt
);

-- ============================================
-- 🎮 5. SESSIONS — O'yin sessiyalari (Billing asosi)
-- ============================================
CREATE TABLE sessions (
    id              SERIAL PRIMARY KEY,
    room_id         INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,     -- 🚪 Xona
    started_by      INT NOT NULL REFERENCES users(id),                       -- 👤 Kim ochgan
    closed_by       INT REFERENCES users(id),                                -- 👤 Kim yopgan (NULL = hali ochiq)
    start_time      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,            -- ⏰ Boshlanish vaqti
    end_time        TIMESTAMP,                                               -- ⏰ Tugash vaqti (NULL = davom etyapti)
    scheduled_end   TIMESTAMP,                                               -- ⏳ Rejalashtirilgan tugash ("1 soatga")
    is_vip          BOOLEAN NOT NULL DEFAULT false,                          -- 💎 VIP rejimi
    is_unlimited    BOOLEAN NOT NULL DEFAULT false,                          -- ♾️ Cheksiz rejim
    session_type    session_type NOT NULL DEFAULT 'walk_in',                 -- 📋 Turi (walk_in/reserved/scheduled)
    time_amount     DECIMAL(12,2) NOT NULL DEFAULT 0,                        -- 💰 Vaqt bo'yicha hisob
    products_amount DECIMAL(12,2) NOT NULL DEFAULT 0,                        -- 🛒 Mahsulotlar summasi
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,                        -- 🎁 Chegirma
    discount_reason TEXT,                                                     -- 📝 Chegirma sababi
    total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,                        -- 💵 Yakuniy summa
    payment_method  payment_method,                                          -- 💳 To'lov usuli
    status          session_status NOT NULL DEFAULT 'active',                -- 🔄 Holati
    notes           TEXT,                                                     -- 📝 Izoh
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP                       -- 📅 Yaratilgan vaqt
);

-- 🔑 Indexes for session queries
CREATE INDEX idx_sessions_room_status ON sessions(room_id, status);
CREATE INDEX idx_sessions_start_time ON sessions(start_time);
CREATE INDEX idx_sessions_status ON sessions(status);

-- ============================================
-- 📅 6. RESERVATIONS — Bron qilish
-- ============================================
CREATE TABLE reservations (
    id              SERIAL PRIMARY KEY,
    room_id         INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,     -- 🚪 Xona
    branch_id       INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,  -- 🏢 Filial
    customer_name   VARCHAR(100) NOT NULL,                                    -- 👤 Mijoz ismi
    customer_phone  VARCHAR(20),                                             -- 📞 Telefon
    reserved_from   TIMESTAMP NOT NULL,                                      -- ⏰ Boshlanish
    reserved_until  TIMESTAMP NOT NULL,                                      -- ⏰ Tugash
    is_vip          BOOLEAN NOT NULL DEFAULT false,                          -- 💎 VIP
    status          reservation_status NOT NULL DEFAULT 'pending',           -- 📋 Holati
    notes           TEXT,                                                     -- 📝 Izoh
    created_by      INT NOT NULL REFERENCES users(id),                       -- 👤 Kim yaratgan
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP                       -- 📅 Yaratilgan vaqt
);

-- 🔑 Index for reservation queries
CREATE INDEX idx_reservations_room_date ON reservations(room_id, reserved_from);

-- ============================================
-- 🛒 7. PRODUCTS — Mahsulotlar (Inventory)
-- ============================================
CREATE TABLE products (
    id                  SERIAL PRIMARY KEY,
    branch_id           INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,  -- 🏢 Filial
    name                VARCHAR(100) NOT NULL,                                    -- 🏷️ Nomi ("Pepsi 0.5l")
    category            VARCHAR(50) NOT NULL DEFAULT 'Boshqa',                   -- 📂 Kategoriya ("Ichimliklar")
    cost_price          DECIMAL(12,2) NOT NULL DEFAULT 0,                        -- 📥 Olib kelish narxi
    sell_price          DECIMAL(12,2) NOT NULL,                                  -- 📤 Sotish narxi
    quantity            INT NOT NULL DEFAULT 0,                                   -- 📊 Qoldiq soni
    low_stock_threshold INT NOT NULL DEFAULT 5,                                  -- ⚠️ Kam qoldi chegarasi
    is_active           BOOLEAN DEFAULT true,                                     -- ✅ Faolmi
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                      -- 📅 Yaratilgan vaqt
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP                       -- 🔄 Yangilangan vaqt
);

-- 🔑 Index for product queries
CREATE INDEX idx_products_branch ON products(branch_id);

-- ============================================
-- 🛒 8. SESSION_PRODUCTS — Sessiyada sotilganlar
-- ============================================
CREATE TABLE session_products (
    id              SERIAL PRIMARY KEY,
    session_id      INT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,  -- 🎮 Sessiya
    product_id      INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,  -- 🛒 Mahsulot
    quantity        INT NOT NULL DEFAULT 1,                                   -- 📊 Soni
    price_at_sale   DECIMAL(12,2) NOT NULL,                                  -- 💰 Sotilgan paytdagi narx
    added_by        INT NOT NULL REFERENCES users(id),                       -- 👤 Kim qo'shgan
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP                       -- 📅 Qo'shilgan vaqt
);

-- 🔑 Index for session product queries
CREATE INDEX idx_session_products_session ON session_products(session_id);

-- ============================================
-- 🔒 9. AUDIT_LOGS — Nazorat jurnali
-- ============================================
CREATE TABLE audit_logs (
    id              SERIAL PRIMARY KEY,
    branch_id       INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,  -- 🏢 Filial
    user_id         INT NOT NULL REFERENCES users(id),                       -- 👤 Kim qilgan
    action          VARCHAR(50) NOT NULL,                                     -- 📋 "session_start", "price_edit"
    entity_type     VARCHAR(50) NOT NULL,                                     -- 📂 "session", "room", "product"
    entity_id       INT,                                                      -- 🔗 Tegishli yozuv ID
    old_values      JSONB,                                                    -- 📥 Eski qiymatlar
    new_values      JSONB,                                                    -- 📤 Yangi qiymatlar
    ip_address      VARCHAR(45),                                             -- 🌐 IP manzil
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP                       -- 📅 Vaqt
);

-- 🔑 Indexes for audit log queries
CREATE INDEX idx_audit_logs_branch ON audit_logs(branch_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================
-- ✅ Schema created successfully!
-- ============================================

-- ============================================
-- 💸 10. EXPENSES — Xarajatlar
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
    id          SERIAL PRIMARY KEY,
    branch_id   INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,    -- 🏢 Filial
    user_id     INT REFERENCES users(id) ON DELETE SET NULL,               -- 👤 Kim qo'shdi
    amount      DECIMAL(14, 2) NOT NULL,                                   -- 💰 Summa
    currency    VARCHAR(5) NOT NULL DEFAULT 'UZS',                         -- 💱 Valyuta (UZS / USD)
    category    VARCHAR(50) NOT NULL DEFAULT 'Boshqa',                     -- 🏷️ Kategoriya
    description TEXT,                                                       -- 📝 Izoh
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP                        -- 📅 Vaqt
);

CREATE INDEX idx_expenses_branch ON expenses(branch_id);
CREATE INDEX idx_expenses_created ON expenses(created_at);

-- ============================================
-- 📦 11. PLANS — Tarif rejalar (Super Admin boshqaradi)
-- ============================================
CREATE TABLE plans (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL,                    -- 🏷️ Plan nomi (Free, Pro, Enterprise)
    max_rooms       INT NOT NULL DEFAULT 2,                  -- 🚩 Maksimal xonalar soni
    max_products    INT NOT NULL DEFAULT 4,                  -- 🚩 Maksimal mahsulotlar soni
    max_users       INT NOT NULL DEFAULT 2,                  -- 🚩 Maksimal foydalanuvchilar
    price_monthly   DECIMAL(12,2) DEFAULT 0,                 -- 💰 Oylik narx (so'm)
    is_active       BOOLEAN DEFAULT true,                    -- ✅ Faolmi
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP      -- 📅 Yaratilgan vaqt
);

-- 🏷️ Default tarif rejalar
INSERT INTO plans (name, max_rooms, max_products, max_users, price_monthly) VALUES
    ('Free', 2, 4, 2, 0),
    ('Pro', 10, 20, 5, 99000),
    ('Enterprise', 999, 999, 999, 249000);

-- 🔗 Foreign key: branches.plan_id → plans.id
ALTER TABLE branches ADD CONSTRAINT fk_branches_plan FOREIGN KEY (plan_id) REFERENCES plans(id);

-- ============================================
-- 🎟️ 12. PROMO_CODES — Promokodlar
-- ============================================
CREATE TABLE promo_codes (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(30) UNIQUE NOT NULL,             -- 🏷️ Kod (WELCOME50, VIPFREE)
    discount_percent INT NOT NULL DEFAULT 0,                 -- 💸 Chegirma foizi (0-100)
    valid_until     TIMESTAMP,                               -- 📅 Amal qilish muddati
    max_uses        INT DEFAULT 100,                         -- 🚩 Maksimal ishlatishlar
    used_count      INT DEFAULT 0,                           -- 📊 Ishlatilganlar soni
    is_active       BOOLEAN DEFAULT true,                    -- ✅ Faolmi
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP      -- 📅 Yaratilgan vaqt
);

-- ============================================
-- 🤖 13. TELEGRAM_USERS — TG ↔ Game Club bog'lanishi
-- ============================================
CREATE TABLE telegram_users (
    id          SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,                      -- 🤖 Telegram user ID
    phone       VARCHAR(20),                                 -- 📞 Telefon raqam
    branch_id   INT REFERENCES branches(id),                 -- 🏢 Bog'langan club
    user_id     INT REFERENCES users(id),                    -- 👤 Bog'langan user
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP          -- 📅 Yaratilgan vaqt
);

CREATE INDEX idx_telegram_users_tgid ON telegram_users(telegram_id);
