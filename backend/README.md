# Luxiana Backend — Setup Guide

Backend sederhana pakai Node.js + Express + MongoDB (Mongoose) untuk toko Luxiana.

## 1. Bikin Database di MongoDB Atlas (gratis)

1. Daftar/login di https://mongodb.com/atlas
2. Bikin **Cluster baru** → pilih plan **M0 (Free)**
3. Di menu **Database Access**, bikin user database (username & password) — simpan baik-baik
4. Di menu **Network Access**, klik **Add IP Address** → pilih **Allow Access from Anywhere** (`0.0.0.0/0`) — cukup buat belajar, nanti bisa dipersempit
5. Klik **Connect** pada cluster → **Drivers** → copy connection string-nya, bentuknya:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## 2. Setup Project

```bash
cd luxiana-backend
npm install
```

## 3. Isi file `.env`

Copy `.env.example` jadi `.env`:

```bash
cp .env.example .env
```

Lalu edit `.env`, ganti `USERNAME`, `PASSWORD` sesuai punya kamu, dan tambahin nama database `luxiana` sebelum tanda tanya:

```
MONGODB_URI=mongodb+srv://username_kamu:password_kamu@cluster0.xxxxx.mongodb.net/luxiana?retryWrites=true&w=majority
PORT=5000
```

> ⚠️ Kalau password kamu ada karakter spesial (`@`, `#`, `%`, dll), harus di-encode dulu. Contoh `@` jadi `%40`.

## 4. Jalankan server

```bash
npm start
```

Kalau berhasil, akan muncul:
```
✅ Terhubung ke MongoDB
🚀 Server berjalan di http://localhost:5000
```

Cek di browser: buka `http://localhost:5000` → harus muncul `{"status":"ok",...}`

## 5. Test API-nya

Bisa pakai Postman, Thunder Client (extension VS Code), atau langsung dari browser (untuk GET):

- `GET  http://localhost:5000/api/products` → lihat semua produk (masih kosong di awal)
- `POST http://localhost:5000/api/products` → body JSON contoh:
  ```json
  {
    "name": "Test Dress",
    "category": "Dresses",
    "price": 5000000,
    "stock": 10,
    "desc": "Ini produk percobaan",
    "sizes": ["S", "M", "L"]
  }
  ```

## 6. Langkah selanjutnya: sambungkan ke frontend

Ini backend/API-nya doang. Langkah berikutnya adalah **ubah `admin.js` dan `app.js`** kamu, ganti pemanggilan `getProducts()`/`saveProducts()` (localStorage) jadi `fetch()` ke `http://localhost:5000/api/products`.

Kalau kamu udah coba jalanin backend ini dan berhasil connect, bilang aja — nanti kita lanjut ubah bagian `admin.js` & `app.js` biar nyambung ke API ini.

## Struktur Folder

```
luxiana-backend/
├── server.js           → entry point
├── .env                → rahasia koneksi database (jangan di-share/commit)
├── .env.example         → contoh format .env
├── models/
│   └── Product.js      → schema produk
├── routes/
│   └── products.js      → endpoint GET/POST/PUT/DELETE produk
└── package.json
```
