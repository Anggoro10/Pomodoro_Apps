# Panduan Deploy ke Vercel (Gratis + Domain Bawaan)

## 📋 Prasyarat
- Akun GitHub (gratis)
- Akun Vercel (gratis, login via GitHub)
- Akun Database PostgreSQL gratis (pilih salah satu):
  - **Neon** (recommended): https://neon.tech - 512MB gratis
  - **Supabase**: https://supabase.com - 500MB gratis
  - **PlanetScale**: https://planetscale.com - 1GB gratis (MySQL, but need adapter)

---

## 🗄️ Langkah 1: Setup Database PostgreSQL (Neon - Recommended)

1. Daftar di https://neon.tech
2. Buat project baru → "Create Project"
3. Copy **Connection String** (pooled connection):
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
   ```
4. Simpan untuk nanti dipakai di Vercel

---

## 🚀 Langkah 2: Push ke GitHub

```bash
cd /Users/anggoro/Pomodoro_Apps
git init
git add .
git commit -m "Initial commit for Vercel deployment"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

---

## ⚙️ Langkah 3: Deploy ke Vercel

### Opsi A: Via Dashboard Vercel (Paling Mudah & Disarankan)

1. Buka https://vercel.com/dashboard
2. Klik **"Add New..."** → **"Project"**
3. Import repository GitHub Anda (`Pomodoro_Apps`)
4. **Framework Preset**: **Other** (Biarkan default)
5. **Root Directory**: `./` (Biarkan default)
6. *Catatan:* **Build Command** dan **Output Directory** sudah diatur otomatis oleh `vercel.json` (`npm run build` dan `Client/dist`).
7. Buka bagian **"Environment Variables"** dan tambahkan:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` (dari Neon atau Supabase) | Production, Preview, Development |
| `JWT_SECRET` | string acak rahasia minimal 32 karakter | Production, Preview, Development |
| `JWT_EXPIRES_IN` | `1d` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

8. Klik **"Deploy"**

### Opsi B: Via Vercel CLI

```bash
npm i -g vercel
cd /Users/anggoro/Pomodoro_Apps
vercel login
vercel
# Ikuti prompt, set environment variables di dashboard setelah deploy pertama
```

---

## 🔧 Langkah 4: Setup Database Schema (Setelah Deploy)

Setelah deploy pertama berhasil, jalankan migration:

```bash
# Local development dengan DATABASE_URL production
cd Server
npx prisma migrate deploy
# atau
npx prisma db push
```

Atau gunakan Vercel CLI:
```bash
vercel env pull .env.production
cd Server
DATABASE_URL="$(grep DATABASE_URL .env.production | cut -d '=' -f2-)" npx prisma migrate deploy
```

---

## 🌐 Langkah 5: Update FRONTEND_URL

Setelah deploy, Anda akan dapat URL seperti: `https://pomodoro-apps-xxx.vercel.app`

1. Buka Vercel Dashboard → Project → Settings → Environment Variables
2. Update `FRONTEND_URL` = `https://your-actual-url.vercel.app`
3. Redeploy: **Deployments** → **Redeploy** (paling atas)

---

## 📱 Langkah 6: Test Aplikasi

1. Buka URL Vercel Anda
2. Register akun baru
3. Test fitur Pomodoro, Tasks, Statistics
4. Cek apakah API berfungsi: `https://your-app.vercel.app/api/ping`

---

## 🛠️ Troubleshooting

### Error: "Prisma Client not generated"
```bash
# Di lokal, generate client lalu push
cd Server
npx prisma generate
git add .
git commit -m "Generate Prisma client"
git push
```

### Error: "Function timeout"
- Vercel free tier max 30s (sudah dikonfigurasi di vercel.json)
- Optimasi query database

### Error: "CORS"
- Pastikan `FRONTEND_URL` di environment variables sudah benar
- Format: `https://xxx.vercel.app` (tanpa slash di akhir)

### Database connection failed
- Pastikan `DATABASE_URL` menggunakan **pooled connection** (Neon: `-pooler` di host)
- Pastikan `sslmode=require` ada di connection string
- Neon: gunakan connection string yang diawali `postgresql://` bukan `postgres://`

### Build failed: "expo export not found"
```bash
# Pastikan expo-cli terinstall
cd Client
npx expo export --platform web
```

---

## 💰 Estimasi Biaya (Gratis Selamanya)

| Service | Free Tier Limit |
|---------|-----------------|
| Vercel | Unlimited personal projects, 100GB bandwidth/bulan |
| Neon | 512MB storage, 10GB transfer/bulan |
| Supabase | 500MB database, 2GB bandwidth/bulan |

**Total: $0/bulan** ✨

---

## 🔄 Update Deploy Otomatis

Setiap `git push` ke branch `main` akan otomatis trigger deploy baru di Vercel.

---

## 📁 Struktur File yang Dibuat/Diubah

```
Pomodoro_Apps/
├── api/
│   └── index.js              # Vercel Serverless Function entry point
├── vercel.json               # Vercel configuration
├── Server/
│   ├── .env.example          # Template environment variables
│   ├── prisma/schema.prisma  # Updated ke PostgreSQL
│   ├── package.json          # Updated dependencies (pg adapter)
│   └── src/config/db.js      # Singleton Prisma client
├── Client/
│   ├── .env.example          # Template environment variables
│   ├── package.json          # Added build:web script
│   └── src/config/api.js     # Support EXPO_PUBLIC_API_URL
└── DEPLOYMENT_GUIDE.md       # This file
```

---

## 🆘 Butuh Bantuan?

Jika ada error saat deploy:
1. Cek **Vercel Function Logs** di dashboard
2. Cek **Build Logs** untuk error build
3. Pastikan semua environment variables sudah di-set
4. Pastikan database accessible dari Vercel (allow all IPs di Neon/Supabase)

---

**Catatan**: Aplikasi ini menggunakan React Native Web via Expo. Fitur native (push notification, background timer) tidak akan berfungsi di web, tapi core Pomodoro timer dan CRUD tasks akan berjalan normal.