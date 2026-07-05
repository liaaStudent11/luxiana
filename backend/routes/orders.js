const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

const ORDER_STATUSES = ['Pending', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'];
const REFUND_STATUSES = ['Diajukan', 'Diproses', 'Disetujui', 'Ditolak'];

function generateOrderId() {
  return 'LUX' + Date.now().toString().slice(-8);
}
function generateRefundId() {
  return 'RF' + Date.now().toString().slice(-8);
}

/* GET /api/orders → ambil semua pesanan (dipakai halaman admin) */
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data pesanan.', detail: err.message });
  }
});

/* GET /api/orders/:id → ambil 1 pesanan (dipakai Lacak Pesanan & detail admin) */
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil pesanan.', detail: err.message });
  }
});

/* POST /api/orders → buat pesanan baru (dipanggil saat checkout / "Buat Pesanan") */
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    if (!body.userId || !body.userEmail) {
      return res.status(400).json({ error: 'Data pelanggan tidak lengkap.' });
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ error: 'Pesanan harus memiliki minimal 1 item.' });
    }
    if (!body.total || body.total <= 0) {
      return res.status(400).json({ error: 'Total pesanan tidak valid.' });
    }

    const now = new Date();
    const order = new Order({
      id: generateOrderId(),
      userId: body.userId,
      userEmail: body.userEmail,
      items: body.items,
      address: body.address,
      contact: body.contact,
      recipientName: body.recipientName,
      paymentMethod: body.paymentMethod,
      shippingMethod: body.shippingMethod,
      subtotal: body.subtotal,
      shippingFee: body.shippingFee,
      total: body.total,
      status: 'Pending',
      timeline: [{ status: 'Pending', date: now, note: 'Pesanan dibuat, menunggu konfirmasi pembayaran.' }]
    });

    await order.save();
    res.status(201).json(order);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'ID pesanan bentrok, coba lagi.' });
    }
    res.status(500).json({ error: 'Gagal membuat pesanan.', detail: err.message });
  }
});

/* PUT /api/orders/:id/status → ubah status pesanan (admin, atau batal/refund oleh pelanggan) */
router.put('/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status pesanan tidak valid.' });
    }

    const order = await Order.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

    order.status = status;
    order.timeline.push({
      status,
      date: new Date(),
      note: note || `Status pesanan diperbarui menjadi ${status}.`
    });

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui status pesanan.', detail: err.message });
  }
});

/* POST /api/orders/:id/refund → pelanggan mengajukan refund (tersimpan sebagai order.refund) */
router.post('/:id/refund', async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

    if (order.status !== 'Selesai') {
      return res.status(400).json({ error: 'Refund hanya bisa diajukan untuk pesanan berstatus Selesai.' });
    }
    if (order.refund) {
      return res.status(400).json({ error: 'Pesanan ini sudah memiliki permintaan refund.' });
    }

    const reason = (req.body.reason || '').trim() || '-';
    const now = new Date();

    order.refund = {
      id: generateRefundId(),
      reason,
      amount: order.total,
      status: 'Diajukan',
      createdAt: now,
      timeline: [{ status: 'Diajukan', date: now, note: 'Permintaan refund diajukan oleh pelanggan.' }]
    };

    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengajukan refund.', detail: err.message });
  }
});

/* PUT /api/orders/refund/:refundId/status → admin memperbarui status refund */
router.put('/refund/:refundId/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!REFUND_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status refund tidak valid.' });
    }

    const order = await Order.findOne({ 'refund.id': req.params.refundId });
    if (!order || !order.refund) {
      return res.status(404).json({ error: 'Refund tidak ditemukan.' });
    }

    const now = new Date();
    order.refund.status = status;
    order.refund.timeline.push({
      status,
      date: now,
      note: note || `Status refund diperbarui menjadi ${status}.`
    });

    // Kalau refund disetujui, otomatis batalkan pesanan (mirror logic lama di data.js)
    if (status === 'Disetujui') {
      order.status = 'Dibatalkan';
      order.timeline.push({
        status: 'Dibatalkan',
        date: now,
        note: 'Pesanan dibatalkan, dana dikembalikan (refund disetujui).'
      });
    }

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui status refund.', detail: err.message });
  }
});

module.exports = router;
