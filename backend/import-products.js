/*
  Script buat import produk dari file JSON ke database Luxiana lewat API.

  CARA PAKAI:
  1. Taruh file ini di folder `backend` kamu (sejajar sama server.js)
  2. Taruh juga file JSON produk kamu di folder yang sama, kasih nama "produk.json"
     (atau ganti nama file di bawah sesuai punya kamu)
  3. Ganti nilai API_BASE_URL di bawah ini sesuai URL Back4app yang AKTIF sekarang
  4. Buka cmd di folder backend, jalankan:
       node import-products.js
  5. Tunggu sampai semua produk selesai diimpor
*/

const fs = require('fs');
const path = require('path');

// ⚠️ GANTI INI sesuai URL Back4app yang aktif sekarang (cek dulu di data.js / Back4app)
const API_BASE_URL = 'https://luxianabackend-7u8wl33y.b4a.run/api/products';

// Nama file JSON produk kamu (taruh di folder yang sama dengan script ini)
const JSON_FILE_NAME = 'produk.json';

async function importProducts() {
  const filePath = path.join(__dirname, JSON_FILE_NAME);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File "${JSON_FILE_NAME}" tidak ditemukan di folder ini.`);
    console.error(`   Pastikan file JSON produk kamu ditaruh di: ${filePath}`);
    return;
  }

  const products = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`📦 Ditemukan ${products.length} produk di file "${JSON_FILE_NAME}".`);
  console.log(`🌐 Mengirim ke: ${API_BASE_URL}\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const product of products) {
    try {
      const res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });

      const result = await res.json();

      if (res.ok) {
        console.log(`✅ [${product.id}] ${product.name} — berhasil ditambahkan.`);
        success++;
      } else if (result.error && result.error.includes('sudah dipakai')) {
        console.log(`⏭️  [${product.id}] ${product.name} — dilewati (ID sudah ada di database).`);
        skipped++;
      } else {
        console.log(`❌ [${product.id}] ${product.name} — gagal: ${result.error || 'unknown error'}`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ [${product.id}] ${product.name} — error koneksi: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n===== SELESAI =====`);
  console.log(`✅ Berhasil: ${success}`);
  console.log(`⏭️  Dilewati (sudah ada): ${skipped}`);
  console.log(`❌ Gagal: ${failed}`);
}

importProducts();
