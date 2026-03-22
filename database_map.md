# 🗄️ VipLimit — Database Map

> Bu fayl loyihadagi barcha jadvallar va ularning o'zaro aloqalarini ko'rsatadi.
> Har bir yangi sahifa yoki bo'lim qo'shilganda ushbu fayl yangilanadi.

## 📊 Jadvallar ro'yxati

| # | Jadval nomi | Izoh | Sahifa |
|---|-------------|------|--------|
| 1 | `branches` | Filiallar (multi-branch uchun) | Settings |
| 2 | `users` | Adminlar, Managerlar, Ownerlar | Settings / Login |
| 3 | `rooms` | Xonalar va ularning narxlari | Rooms Dashboard |
| 4 | `pricing_rules` | Narxlash qoidalari (tungi, promo) | Settings |
| 5 | `sessions` | O'yin sessiyalari (asosiy billing) | Rooms Dashboard |
| 6 | `reservations` | Xona bron qilish | Rooms Dashboard |
| 7 | `products` | Mahsulotlar (inventory) | Products Page |
| 8 | `session_products` | Sessiyada sotilgan mahsulotlar | Rooms Dashboard |
| 9 | `audit_logs` | Nazorat jurnali (xavfsizlik) | Owner Panel |
| 10 | `expenses` | Operatsion xarajatlar | Expenses Page |

## 🔗 Jadvallar aloqalari

```mermaid
erDiagram
    branches ||--o{ users : "has"
    branches ||--o{ rooms : "has"
    branches ||--o{ products : "has"
    branches ||--o{ pricing_rules : "has"
    branches ||--o{ reservations : "has"
    branches ||--o{ audit_logs : "has"
    
    rooms ||--o{ sessions : "has"
    rooms ||--o{ reservations : "has"
    rooms ||--o{ pricing_rules : "may have"
    
    users ||--o{ sessions : "starts"
    users ||--o{ reservations : "creates"
    users ||--o{ session_products : "adds"
    users ||--o{ audit_logs : "generates"
    
    sessions ||--o{ session_products : "contains"
    products ||--o{ session_products : "sold in"
    branches ||--o{ expenses : "has"
    users ||--o{ expenses : "logs"
```

## 📄 Sahifalar va jadvallar bog'lanishi

| Sahifa | Ishlatadigan jadvallar | Izoh |
|--------|----------------------|------|
| **Login** | `users` | Foydalanuvchi autentifikatsiyasi |
| **Rooms Dashboard** | `rooms`, `sessions`, `session_products`, `reservations`, `products` | Asosiy ish paneli |
| **Products** | `products` | Mahsulotlar CRUD + Inventory |
| **Reports** | `sessions`, `session_products`, `products`, `rooms` | Hisobotlar |
| **Expenses** | `expenses`, `users` | Xarajatlar kiritish va ko'rish |
| **Settings** | `users`, `branches`, `pricing_rules`, `rooms` | Sozlamalar |
| **Audit Logs** | `audit_logs` | Nazorat jurnali (faqat Owner) |
