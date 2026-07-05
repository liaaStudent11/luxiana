require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Izinkan frontend (file HTML kamu) mengakses API ini
app.use(express.json()); // Parsing body JSON dari request

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes); // pesanan + refund (refund = sub-field di dalam order)

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Luxiana API berjalan.' });
});

// Koneksi ke MongoDB lalu jalankan server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Terhubung ke MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Gagal konek ke MongoDB:', err.message);
    process.exit(1);
  });
