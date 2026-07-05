const mongoose = require('mongoose');

/*
  Struktur ini mengikuti bentuk objek order/refund yang sudah ada di
  data.js frontend (getOrders/getRefunds dari localStorage sebelumnya),
  supaya perpindahan ke database tetap mulus.

  Refund SENGAJA digabung sebagai sub-field di dalam order (order.refund),
  bukan collection terpisah — karena satu order maksimal punya satu
  permintaan refund (lihat canRequestRefund di data.js).
*/

const timelineEntrySchema = new mongoose.Schema({
  status: { type: String, required: true },
  date: { type: Date, default: Date.now },
  note: { type: String, default: '' }
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 },
  size: { type: String, default: '' },
  color: { type: String, default: null },
  isCustomSize: { type: Boolean, default: false }
}, { _id: false });

const refundSchema = new mongoose.Schema({
  id: { type: String, required: true }, // contoh: "RF12345678"
  reason: { type: String, default: '-' },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Diajukan', 'Diproses', 'Disetujui', 'Ditolak'],
    default: 'Diajukan'
  },
  createdAt: { type: Date, default: Date.now },
  timeline: { type: [timelineEntrySchema], default: [] }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // contoh: "LUX12345678"
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  items: { type: [orderItemSchema], default: [] },
  address: { type: String, default: '' },
  contact: { type: String, default: '' },
  recipientName: { type: String, default: '' },
  paymentMethod: { type: String, default: '' },
  shippingMethod: { type: String, default: '' },
  subtotal: { type: Number, required: true, min: 0 },
  shippingFee: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['Pending', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'],
    default: 'Pending'
  },
  timeline: { type: [timelineEntrySchema], default: [] },
  refund: { type: refundSchema, default: null }
}, { timestamps: true, suppressReservedKeysWarning: true });

module.exports = mongoose.model('Order', orderSchema);
