const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

/* GET /api/products → ambil semua produk */
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data produk.', detail: err.message });
  }
});

/* GET /api/products/:id → ambil 1 produk */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil produk.', detail: err.message });
  }
});

/* POST /api/products → tambah produk baru (dipanggil saat klik "Simpan Produk") */
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    // Validasi dasar (mirror validasi yang sudah ada di admin.js)
    if (!body.name || body.name.trim().length < 2) {
      return res.status(400).json({ error: 'Nama produk minimal 2 karakter.' });
    }
    if (!body.category || body.category.trim().length < 2) {
      return res.status(400).json({ error: 'Kategori minimal 2 karakter.' });
    }
    if (!body.price || body.price <= 0 || body.price > 1000000000) {
      return res.status(400).json({ error: 'Harga harus lebih dari 0 dan maksimal Rp 1.000.000.000.' });
    }
    if (body.stock === undefined || body.stock < 0) {
      return res.status(400).json({ error: 'Stok wajib diisi (angka, minimal 0).' });
    }
    if (!body.desc || body.desc.trim().length < 5) {
      return res.status(400).json({ error: 'Deskripsi minimal 5 karakter.' });
    }

    // Generate ID otomatis kalau belum ada (format: P013, P014, dst)
    // PENTING: cari nomor ID TERTINGGI dari SEMUA produk yang ada,
    // bukan cuma dari produk yang paling terakhir dibuat (createdAt).
    // Sebelumnya pakai sort({createdAt:-1}) → bisa tabrakan kalau produk
    // dengan nomor ID tertinggi bukan yang paling terakhir dibuat.
    if (!body.id) {
      const allProducts = await Product.find({}, { id: 1 });
      let maxNum = 0;
      allProducts.forEach(p => {
        const match = p.id && p.id.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      body.id = 'P' + String(maxNum + 1).padStart(3, '0');
    }

    // Retry sekali kalau tetap kena duplicate key (jaga-jaga race condition,
    // misal 2 request submit hampir bersamaan).
    try {
      const newProduct = new Product(body);
      await newProduct.save();
      return res.status(201).json(newProduct);
    } catch (err) {
      if (err.code === 11000 && !req.body.id) {
        const retryProducts = await Product.find({}, { id: 1 });
        let retryMax = 0;
        retryProducts.forEach(p => {
          const match = p.id && p.id.match(/\d+/);
          if (match) {
            const num = parseInt(match[0], 10);
            if (num > retryMax) retryMax = num;
          }
        });
        body.id = 'P' + String(retryMax + 1).padStart(3, '0');
        const retryProduct = new Product(body);
        await retryProduct.save();
        return res.status(201).json(retryProduct);
      }
      throw err;
    }
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'ID produk sudah dipakai.' });
    }
    res.status(500).json({ error: 'Gagal menyimpan produk.', detail: err.message });
  }
});

/* PUT /api/products/:id → edit produk */
router.put('/:id', async (req, res) => {
  try {
    const updated = await Product.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengubah produk.', detail: err.message });
  }
});

/* DELETE /api/products/:id → hapus produk */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    res.json({ message: 'Produk berhasil dihapus.', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus produk.', detail: err.message });
  }
});

module.exports = router;
