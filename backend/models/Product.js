const mongoose = require('mongoose');

/*
  Struktur ini mengikuti bentuk objek produk yang sudah ada
  di DEFAULT_PRODUCTS pada data.js frontend kamu, supaya
  perpindahan dari localStorage ke database tetap mulus.
*/
const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // contoh: "P013"
  name: { type: String, required: true, minlength: 2 },
  category: { type: String, required: true, minlength: 2 },
  price: { type: Number, required: true, min: 1, max: 1000000000 },
  oldPrice: { type: Number, default: null },
  stock: { type: Number, required: true, min: 0 },
  image: { type: String, default: '' },
  desc: { type: String, required: true, minlength: 5 },
  sizes: { type: [String], default: [] },
  colors: { type: [String], default: [] },
  isNew: { type: Boolean, default: false },
  isLimited: { type: Boolean, default: false },
  sold: { type: Number, default: 0 },
  material: { type: String, default: '' },
  origin: { type: String, default: '' },
  care: { type: String, default: '' },
  allowCustomSize: { type: Boolean, default: false },
  customSizeFee: { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 80 }
}, { timestamps: true, suppressReservedKeysWarning: true });

module.exports = mongoose.model('Product', productSchema);
