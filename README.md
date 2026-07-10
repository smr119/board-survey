# نظرسنجی اهداف و استراتژی

یک سایت رایگان برای جمع‌آوری نظرات درباره اهداف و استراتژی‌ها، با **QR Code**، **سوالات قابل ویرایش** و **داشبورد ابر واژگان**.

## امکانات

- **صفحه نظرسنجی** — شرکت‌کنندگان با اسکن QR Code به سایت می‌آیند و نظر می‌دهند
- **پنل مدیریت** — سوالات را اضافه، ویرایش، فعال/غیرفعال یا حذف کنید
- **داشبورد** — نمایش ابر واژگان فارسی از پاسخ‌ها
- **هاست رایگان** — با GitHub Pages

## راه‌اندازی (حدود ۱۵ دقیقه)

### مرحله ۱: ساخت دیتابیس رایگان (Supabase)

1. به [supabase.com](https://supabase.com) بروید و حساب رایگان بسازید
2. یک پروژه جدید بسازید (New Project)
3. از منوی **SQL Editor**، محتوای فایل `supabase-setup.sql` را اجرا کنید
4. از **Settings > API** این دو مقدار را کپی کنید:
   - Project URL
   - anon public key

### مرحله ۲: تنظیم config

فایل `config.js` را باز کنید و مقادیر را جایگزین کنید:

```js
window.APP_CONFIG = {
  supabaseUrl: 'https://xxxxx.supabase.co',
  supabaseAnonKey: 'eyJhbGciOi...',
  adminPassword: 'رمز-قوی-خودتان',
};
```

### مرحله ۳: آپلود در GitHub

```bash
git init
git add .
git commit -m "نظرسنجی اهداف و استراتژی"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

### مرحله ۴: فعال‌سازی GitHub Pages

1. در ریپوی GitHub بروید به **Settings > Pages**
2. در بخش **Build and deployment**:
   - Source: **GitHub Actions**
3. بعد از push، workflow خودکار سایت را deploy می‌کند
4. آدرس سایت: `https://USERNAME.github.io/REPO/`

### مرحله ۵: QR Code

1. به آدرس `https://USERNAME.github.io/REPO/admin.html` بروید
2. با رمز مدیریت وارد شوید
3. QR Code را دانلود و چاپ کنید

## صفحات

| صفحه | آدرس | توضیح |
|------|------|-------|
| نظرسنجی | `/index.html` | فرم پاسخ‌دهی برای شرکت‌کنندگان |
| مدیریت | `/admin.html` | ویرایش سوالات + QR Code |
| داشبورد | `/dashboard.html` | ابر واژگان و آمار |

## سوالات پیشنهادی

- مهم‌ترین هدف سازمان/تیم شما در سال جاری چیست؟
- بهترین استراتژی برای رسیدن به این اهداف چیست؟
- بزرگ‌ترین چالش در مسیر دستیابی به اهداف چیست؟
- چه پیشنهادی برای بهبود عملکرد دارید؟

## ساختار پروژه

```
Board/
├── index.html          # صفحه نظرسنجی
├── admin.html          # پنل مدیریت
├── dashboard.html      # داشبورد ابر واژگان
├── config.js           # تنظیمات Supabase
├── css/style.css       # استایل
├── js/app.js           # توابع مشترک
├── supabase-setup.sql  # اسکریپت دیتابیس
└── .github/workflows/  # deploy خودکار
```

## نکات

- **رمز مدیریت** را در `config.js` حتماً عوض کنید
- Supabase در پلن رایگان تا ۵۰۰ مگابایت دیتابیس و ۵۰ هزار درخواست ماهانه دارد
- برای نظرسنجی جدید، سوالات قبلی را غیرفعال کنید و سوالات جدید اضافه کنید
- داشبورد را روی صفحه بزرگ (پروژکتور/TV) باز کنید تا ابر واژگان نمایش داده شود

## لایسنس

MIT — آزاد برای استفاده
