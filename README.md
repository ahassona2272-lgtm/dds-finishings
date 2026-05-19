# DDS التشطيبات - نظام إدارة المشاريع

نظام متكامل لإدارة شركة تشطيبات مع 6 إدارات والربط بين العميل والفريق.

## المميزات

- **إدارة العملاء والمشاريع**
- **إدارة التصميم** - مهام التصميم وتتبع الحالة
- **إدارة التنفيذ** - تقارير الموقع ورفع الصور وطلبات الصرف
- **إدارة التسعير والعقود**
- **إدارة الحسابات** - المدفوعات والمصروفات
- **إدارة المشتريات**
- **لوحة العميل** - يتابع كل حاجة ويكلم الفريق
- **نظام رسائل** بين جميع المستخدمين

## الأدوار

| الدور | الوصف |
|-------|-------|
| admin | مدير النظام - كل الصلاحيات |
| design | إدارة التصميم |
| execution | إدارة التنفيذ |
| accounting | إدارة الحسابات |
| pricing | إدارة التسعير |
| purchasing | إدارة المشتريات |
| sales | التسويق والمبيعات |
| client | عميل |

## التشغيل المحلي

### 1. تثبيت التبعيات

```bash
# Server
cd server
npm install

# Client
cd client
npm install
```

### 2. تشغيل السيرفر

```bash
cd server
npm run dev
```

السيرفر هيشتغل على: http://localhost:3001

### 3. تشغيل الواجهة

```bash
cd client
npm run dev
```

الواجهة هتتاح على: http://localhost:3000

### 4. بيانات الدخول

- **البريد:** admin@dds.com
- **كلمة المرور:** admin123

## النشر على Railway

1. ارفع المشروع على GitHub
2. اربط Repository مع Railway
3. Railway هيبني وتشغل المشروع تلقائياً

## هيكل المشروع

```
dds-finishings/
├── server/
│   ├── src/
│   │   ├── database.js    # Database schema
│   │   ├── index.js       # Server entry point
│   │   ├── routes/        # API routes
│   │   └── middleware/     # Auth middleware
│   └── package.json
├── client/
│   ├── src/
│   │   ├── api/           # API calls
│   │   ├── context/       # React context
│   │   ├── components/    # Shared components
│   │   └── pages/         # Page components
│   └── package.json
└── railway.json
```

## التقنيات المستخدمة

- **Frontend:** React + Tailwind CSS + Vite
- **Backend:** Node.js + Express
- **Database:** SQLite
- **Auth:** JWT