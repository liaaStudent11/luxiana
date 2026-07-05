/* ===================== LUXIANA — ADMIN PANEL LOGIC ===================== */

/* ---------- KONEKSI KE BACKEND API (MongoDB) — khusus halaman Kelola Produk ---------- */
/* LUX_API_ORIGIN didefinisikan di data.js (dimuat sebelum admin.js), jadi cukup ganti di 1 tempat itu saja. */
const API_BASE_URL = `${LUX_API_ORIGIN}/api/products`;

async function apiGetProducts() {
  const res = await fetch(API_BASE_URL);
  if (!res.ok) throw new Error('Gagal mengambil data produk dari server.');
  return res.json();
}

async function apiCreateProduct(data) {
  const res = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Gagal menambahkan produk.');
  return result;
}

async function apiUpdateProduct(id, data) {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Gagal mengubah produk.');
  return result;
}

async function apiDeleteProduct(id) {
  const res = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Gagal menghapus produk.');
  return result;
}

let deleteTargetId = null;
let currentOrderStatusFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  await loadProductsCache(); // muat data produk dari database (dipakai laporan & detail pesanan)
  await loadOrdersCache(); // muat data pesanan + refund (embedded) dari database
  checkAdminSession();
  bindAdminLoginEvents();
  bindAdminNavEvents();
  bindModalCloseEvents();

  // Smooth page-enter transition
  requestAnimationFrame(() => {
    document.body.classList.add('page-ready');
  });
});

/* ===================== ADMIN AUTH ===================== */
function checkAdminSession() {
  const session = getAdminSession();
  if (session) {
    showAdminDashboard();
  } else {
    showAdminLogin();
  }
}

function showAdminLogin() {
  document.getElementById('adminLoginWrap').classList.remove('hidden');
  document.getElementById('adminShell').classList.add('hidden');
}

function showAdminDashboard() {
  document.getElementById('adminLoginWrap').classList.add('hidden');
  document.getElementById('adminShell').classList.remove('hidden');
  renderDashboardPage();
}

function bindAdminLoginEvents() {
  document.getElementById('adminLoginBtn').addEventListener('click', handleAdminLogin);
  document.getElementById('adminPasswordInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAdminLogin();
  });
  document.getElementById('adminLogoutBtn').addEventListener('click', () => {
    logoutAdmin();
    showAdminLogin();
    document.getElementById('adminEmailInput').value = '';
    document.getElementById('adminPasswordInput').value = '';
  });
}

function handleAdminLogin() {
  const email = document.getElementById('adminEmailInput').value.trim();
  const password = document.getElementById('adminPasswordInput').value;
  const emailField = document.getElementById('adminEmailInput').closest('.field');
  const passField = document.getElementById('adminPasswordInput').closest('.field');

  emailField.classList.remove('has-error');
  passField.classList.remove('has-error');

  if (!email) {
    emailField.classList.add('has-error');
    document.getElementById('adminEmailError').textContent = 'Email tidak boleh kosong.';
    return;
  }

  if (loginAdmin(email, password)) {
    showAdminDashboard();
  } else {
    if (email.toLowerCase() !== ADMIN_CREDENTIAL.email) {
      emailField.classList.add('has-error');
      document.getElementById('adminEmailError').textContent = 'Email admin tidak dikenali.';
    } else {
      passField.classList.add('has-error');
      document.getElementById('adminPasswordError').textContent = 'Kata sandi salah.';
    }
  }
}

/* ===================== NAVIGATION ===================== */
function bindAdminNavEvents() {
  document.querySelectorAll('.admin-nav button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav button[data-page]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.admin-page').forEach(p => p.classList.add('hidden'));
      document.getElementById('page-' + btn.dataset.page).classList.remove('hidden');

      if (btn.dataset.page === 'dashboard') renderDashboardPage();
      if (btn.dataset.page === 'products') renderProductsPage();
      if (btn.dataset.page === 'orders') renderOrdersPage();
      if (btn.dataset.page === 'refunds') renderRefundsPage();
      if (btn.dataset.page === 'report') renderReportPage();
      if (btn.dataset.page === 'customers') renderCustomersPage();
    });
  });
}

function bindModalCloseEvents() {
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeAdminModal(btn.dataset.close));
  });
  document.querySelectorAll('.overlay').forEach(ov => {
    ov.addEventListener('click', (e) => {
      if (e.target === ov) closeAdminModal(ov.id);
    });
  });
}
function openAdminModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeAdminModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

/* ===================== DASHBOARD PAGE ===================== */
function renderDashboardPage() {
  const report = getSalesReport();
  const orders = getOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const kpiGrid = document.getElementById('dashKpiGrid');
  kpiGrid.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">Total Pendapatan</div>
      <div class="kpi-value">${formatIDR(report.totalRevenue)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Pesanan</div>
      <div class="kpi-value">${report.totalOrders}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Produk Terjual</div>
      <div class="kpi-value">${report.totalItemsSold}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Rata-rata Nilai Pesanan</div>
      <div class="kpi-value">${formatIDR(report.avgOrderValue)}</div>
    </div>
  `;

  renderBarChart('dashBarChart', report.days);

  const recentBody = document.getElementById('dashRecentOrders');
  const recent = orders.slice(0, 6);
  if (recent.length === 0) {
    recentBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#999;padding:30px;">Belum ada pesanan.</td></tr>`;
  } else {
    recentBody.innerHTML = recent.map(o => `
      <tr>
        <td>${o.id}</td>
        <td>${o.userEmail}</td>
        <td>${formatIDR(o.total)}</td>
        <td><span class="status-badge ${statusBadgeClass(o.status)}">${o.status}</span></td>
        <td>${formatDate(o.createdAt)}</td>
      </tr>
    `).join('');
  }
}

function renderBarChart(containerId, days) {
  const container = document.getElementById(containerId);
  const maxRevenue = Math.max(...days.map(d => d.revenue), 1);
  container.innerHTML = days.map(d => {
    const heightPct = Math.max((d.revenue / maxRevenue) * 100, 2);
    return `
      <div class="bar-col">
        <div class="bar-value">${d.revenue > 0 ? formatIDR(d.revenue) : ''}</div>
        <div class="bar-fill" style="height:${heightPct}%;"></div>
        <div class="bar-label">${d.label}</div>
      </div>`;
  }).join('');
}

function statusBadgeClass(status) {
  const map = {
    'Pending': 'status-pending',
    'Diproses': 'status-processed',
    'Dikirim': 'status-shipped',
    'Selesai': 'status-delivered',
    'Dibatalkan': 'status-cancelled'
  };
  return map[status] || 'status-pending';
}

/* ===================== PRODUCTS PAGE (CRUD) ===================== */
let productSearchTerm = '';

// Cache produk dari server, dipakai supaya "Ubah" bisa isi form tanpa fetch ulang
let adminProductsCache = [];

function renderProductsPage() {
  document.getElementById('addProductBtn').onclick = () => openProductForm(null);
  document.getElementById('productSearchInput').oninput = (e) => {
    productSearchTerm = e.target.value.toLowerCase();
    renderProductsTable();
  };
  loadAndRenderProducts();
}

async function loadAndRenderProducts() {
  const tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#999;padding:30px;">Memuat data produk...</td></tr>`;
  try {
    adminProductsCache = await apiGetProducts();
    renderProductsTable();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#c0392b;padding:30px;">Gagal memuat produk. Pastikan server backend (npm start) sedang berjalan.</td></tr>`;
    showToast(err.message, 'error');
  }
}

function renderProductsTable() {
  let products = adminProductsCache;
  if (productSearchTerm) {
    products = products.filter(p =>
      p.name.toLowerCase().includes(productSearchTerm) ||
      p.category.toLowerCase().includes(productSearchTerm)
    );
  }

  const tbody = document.getElementById('productsTableBody');
  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#999;padding:30px;">Tidak ada produk ditemukan.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr>
      <td style="display:flex;align-items:center;gap:12px;">
        <img src="${p.image}" alt="${p.name}" style="width:40px;height:50px;object-fit:cover;background:#F7F4ED;flex-shrink:0;">
        <span>${p.name}</span>
      </td>
      <td>${p.category}</td>
      <td>${formatIDR(p.price)}</td>
      <td>${p.discountPercent > 0 ? `<span class="status-badge status-shipped">-${p.discountPercent}%</span>` : '—'}</td>
      <td>${p.stock}</td>
      <td>${p.sold || 0}</td>
      <td>
        <div class="row-actions">
          <button data-edit="${p.id}">Ubah</button>
          <button data-delete="${p.id}">Hapus</button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openProductForm(btn.dataset.edit));
  });
  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteTargetId = btn.dataset.delete;
      openAdminModal('confirmDeleteOverlay');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (deleteTargetId) {
      try {
        await apiDeleteProduct(deleteTargetId);
        deleteTargetId = null;
        closeAdminModal('confirmDeleteOverlay');
        await loadAndRenderProducts();
        showToast('Produk berhasil dihapus.', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  });

  document.getElementById('pfSaveBtn').addEventListener('click', saveProductForm);

  // Numeric-only enforcement on price fields
  ['pfPrice', 'pfOldPrice', 'pfStock', 'pfCustomSizeFee', 'pfDiscountPercent'].forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
  });
});

function openProductForm(productId) {
  const isEdit = !!productId;
  document.getElementById('productFormEyebrow').textContent = isEdit ? 'Ubah Produk' : 'Produk Baru';
  document.getElementById('productFormTitle').textContent = isEdit ? 'Ubah Detail Produk' : 'Tambah Produk Baru';

  // Clear all error states
  document.querySelectorAll('#productFormOverlay .field').forEach(f => f.classList.remove('has-error'));

  if (isEdit) {
    const p = adminProductsCache.find(pp => pp.id === productId);
    document.getElementById('pfId').value = p.id;
    document.getElementById('pfName').value = p.name;
    document.getElementById('pfCategory').value = p.category;
    document.getElementById('pfPrice').value = p.price;
    document.getElementById('pfOldPrice').value = p.oldPrice || '';
    document.getElementById('pfStock').value = p.stock;
    document.getElementById('pfImage').value = p.image || '';
    document.getElementById('pfSizes').value = p.sizes.join(',');
    document.getElementById('pfColors').value = (p.colors || []).join(', ');
    document.getElementById('pfAllowCustomSize').checked = !!p.allowCustomSize;
    document.getElementById('pfCustomSizeFee').value = p.customSizeFee || '';
    document.getElementById('pfDiscountPercent').value = p.discountPercent || 0;
    document.getElementById('pfMaterial').value = p.material || '';
    document.getElementById('pfOrigin').value = p.origin || '';
    document.getElementById('pfCare').value = p.care || '';
    document.getElementById('pfDesc').value = p.desc || '';
    document.getElementById('pfIsNew').checked = !!p.isNew;
    document.getElementById('pfIsLimited').checked = !!p.isLimited;
  } else {
    document.getElementById('pfId').value = '';
    document.getElementById('pfName').value = '';
    document.getElementById('pfCategory').value = '';
    document.getElementById('pfPrice').value = '';
    document.getElementById('pfOldPrice').value = '';
    document.getElementById('pfStock').value = '';
    document.getElementById('pfImage').value = '';
    document.getElementById('pfSizes').value = 'S,M,L,XL';
    document.getElementById('pfColors').value = '';
    document.getElementById('pfAllowCustomSize').checked = false;
    document.getElementById('pfCustomSizeFee').value = '';
    document.getElementById('pfDiscountPercent').value = 0;
    document.getElementById('pfMaterial').value = '';
    document.getElementById('pfOrigin').value = '';
    document.getElementById('pfCare').value = '';
    document.getElementById('pfDesc').value = '';
    document.getElementById('pfIsNew').checked = false;
    document.getElementById('pfIsLimited').checked = false;
  }

  openAdminModal('productFormOverlay');
}

async function saveProductForm() {
  const id = document.getElementById('pfId').value;
  const name = document.getElementById('pfName').value.trim();
  const category = document.getElementById('pfCategory').value.trim();
  const price = parseInt(document.getElementById('pfPrice').value) || 0;
  const oldPriceRaw = document.getElementById('pfOldPrice').value.trim();
  const oldPrice = oldPriceRaw ? parseInt(oldPriceRaw) : null;
  const stock = parseInt(document.getElementById('pfStock').value);
  const imageRaw = document.getElementById('pfImage').value.trim();
  const image = imageRaw || DEFAULT_PRODUCT_IMAGE;
  const sizesRaw = document.getElementById('pfSizes').value.trim();
  const sizes = sizesRaw ? sizesRaw.split(',').map(s => s.trim()).filter(Boolean) : ['One Size'];
  const colorsRaw = document.getElementById('pfColors').value.trim();
  const colors = colorsRaw ? colorsRaw.split(',').map(c => c.trim()).filter(Boolean) : [];
  const allowCustomSize = document.getElementById('pfAllowCustomSize').checked;
  const customSizeFee = parseInt(document.getElementById('pfCustomSizeFee').value) || 0;
  const discountPercentRaw = document.getElementById('pfDiscountPercent').value;
  const discountPercent = discountPercentRaw === '' ? 0 : parseInt(discountPercentRaw);
  const material = document.getElementById('pfMaterial').value.trim();
  const origin = document.getElementById('pfOrigin').value.trim();
  const care = document.getElementById('pfCare').value.trim();
  const desc = document.getElementById('pfDesc').value.trim();
  const isNew = document.getElementById('pfIsNew').checked;
  const isLimited = document.getElementById('pfIsLimited').checked;

  let valid = true;
  valid = setFieldError('pfName', name.length >= 2) && valid;
  valid = setFieldError('pfCategory', category.length >= 2) && valid;
  valid = setFieldError('pfPrice', price > 0 && price <= MAX_PRICE) && valid;
  valid = setFieldError('pfStock', !isNaN(stock) && stock >= 0) && valid;
  valid = setFieldError('pfDesc', desc.length >= 5) && valid;
  valid = setFieldError('pfDiscountPercent', !isNaN(discountPercent) && discountPercent >= 0 && discountPercent <= MAX_DISCOUNT_PERCENT) && valid;

  if (oldPrice && oldPrice > MAX_PRICE) {
    setFieldError('pfOldPrice', false);
    valid = false;
  }

  if (customSizeFee < 0 || customSizeFee > MAX_PRICE) {
    setFieldError('pfCustomSizeFee', false);
    valid = false;
  }

  if (!valid) {
    showToast('Mohon periksa kembali data produk. Harga maksimal Rp 1.000.000.000 dan diskon maksimal 80%.', 'error');
    return;
  }

  const fields = {
    name, category, price, oldPrice, stock, image, sizes,
    colors, allowCustomSize, customSizeFee: allowCustomSize ? customSizeFee : 0,
    discountPercent: clampDiscountPercent(discountPercent),
    material, origin, care, desc, isNew, isLimited
  };

  const saveBtn = document.getElementById('pfSaveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Menyimpan...';

  try {
    if (id) {
      await apiUpdateProduct(id, fields);
    } else {
      await apiCreateProduct(fields);
    }
    closeAdminModal('productFormOverlay');
    await loadAndRenderProducts();
    showToast(id ? 'Produk berhasil diperbarui.' : 'Produk baru berhasil ditambahkan.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Simpan Produk';
  }
}

function setFieldError(id, condition) {
  const field = document.getElementById(id).closest('.field');
  if (!condition) {
    field.classList.add('has-error');
    return false;
  }
  field.classList.remove('has-error');
  return true;
}

/* ===================== ORDERS PAGE (KELOLA PESANAN) ===================== */
function renderOrdersPage() {
  document.querySelectorAll('#orderStatusTabs .tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#orderStatusTabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentOrderStatusFilter = btn.dataset.status;
      renderOrdersTable();
    };
  });
  renderOrdersTable();
}

function renderOrdersTable() {
  let orders = getOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (currentOrderStatusFilter !== 'all') {
    orders = orders.filter(o => o.status === currentOrderStatusFilter);
  }

  const tbody = document.getElementById('ordersTableBody');
  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#999;padding:30px;">Tidak ada pesanan pada status ini.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const itemCount = o.items.reduce((s, i) => s + i.qty, 0);
    return `
    <tr>
      <td><a href="#" data-detail="${o.id}" style="border-bottom:1px solid #9C8048;">${o.id}</a></td>
      <td>${o.userEmail}</td>
      <td>${itemCount} item</td>
      <td>${formatIDR(o.total)}</td>
      <td>${o.paymentMethod}</td>
      <td>
        <select class="status-select" data-status-order="${o.id}">
          ${ORDER_STATUS_FLOW.concat('Dibatalkan').map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td><div class="row-actions"><button data-detail-btn="${o.id}">Detail</button></div></td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('[data-detail]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openOrderDetail(link.dataset.detail);
    });
  });
  tbody.querySelectorAll('[data-detail-btn]').forEach(btn => {
    btn.addEventListener('click', () => openOrderDetail(btn.dataset.detailBtn));
  });
  tbody.querySelectorAll('[data-status-order]').forEach(select => {
    select.addEventListener('change', async () => {
      const orderId = select.dataset.statusOrder;
      const newStatus = select.value;
      select.disabled = true;
      const updated = await updateOrderStatus(orderId, newStatus);
      select.disabled = false;
      if (updated) showToast(`Status pesanan ${orderId} diperbarui menjadi "${newStatus}".`, 'success');
      renderOrdersTable();
    });
  });
}

function openOrderDetail(orderId) {
  const order = getOrderById(orderId);
  if (!order) return;
  const products = getProducts();

  const content = document.getElementById('orderDetailContent');
  content.innerHTML = `
    <div class="panel-header">
      <span class="eyebrow">Detail Pesanan</span>
      <h3>${order.id}</h3>
      <p style="color:#888;font-size:13px;margin-top:6px;">${formatDate(order.createdAt)}</p>
    </div>

    <div class="admin-panel" style="padding:20px;margin-bottom:18px;">
      <h3 style="font-size:14px;margin-bottom:14px;">Informasi Pelanggan & Pengiriman</h3>
      <div style="font-size:13px;line-height:1.9;">
        <div><strong>Email:</strong> ${order.userEmail}</div>
        <div><strong>Nama Penerima:</strong> ${order.recipientName}</div>
        <div><strong>Kontak:</strong> ${order.contact}</div>
        <div><strong>Alamat Lengkap:</strong> ${order.address}</div>
        <div><strong>Metode Pembayaran:</strong> ${order.paymentMethod}</div>
        <div><strong>Metode Pengiriman:</strong> ${getShippingOption(order.shippingMethod).label} (${getShippingOption(order.shippingMethod).eta}, ${getShippingOption(order.shippingMethod).fee === 0 ? 'Gratis' : formatIDR(getShippingOption(order.shippingMethod).fee)})</div>
      </div>
    </div>

    <div class="admin-panel" style="padding:20px;margin-bottom:18px;">
      <h3 style="font-size:14px;margin-bottom:14px;">Item Pesanan</h3>
      ${order.items.map(i => {
        const p = products.find(pp => pp.id === i.productId);
        const extra = [i.color ? `Warna: ${i.color}` : '', i.isCustomSize ? 'Custom Ukuran' : ''].filter(Boolean).join(' • ');
        return `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:13px;padding:8px 0;border-bottom:1px solid #DDD6C8;">
          <span style="display:flex;align-items:center;gap:10px;"><img src="${p ? p.image : DEFAULT_PRODUCT_IMAGE}" alt="${i.name}" style="width:32px;height:40px;object-fit:cover;flex-shrink:0;background:#F7F4ED;"> ${i.name} (${i.size}) ×${i.qty}${extra ? `<br><span style="color:#999;font-size:11px;">${extra}</span>` : ''}</span>
          <span>${formatIDR(i.price * i.qty)}</span>
        </div>`;
      }).join('')}
      <div class="summary-row total" style="margin-top:14px;"><span>Total</span><span>${formatIDR(order.total)}</span></div>
    </div>

    <div class="field">
      <label>Update Status Pesanan</label>
      <select id="detailStatusSelect">
        ${ORDER_STATUS_FLOW.concat('Dibatalkan').map(s => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </div>
    <button class="btn btn-block" id="detailUpdateBtn">Perbarui Status</button>

    <div style="margin-top:26px;">
      <h3 style="font-size:14px;margin-bottom:14px;">Riwayat Status</h3>
      ${order.timeline.slice().reverse().map(t => `
        <div style="font-size:12px;color:#888;padding:8px 0;border-bottom:1px solid #DDD6C8;">
          <strong style="color:#161412;">${t.status}</strong> — ${formatDate(t.date)}<br>${t.note}
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('detailUpdateBtn').addEventListener('click', async (e) => {
    const newStatus = document.getElementById('detailStatusSelect').value;
    e.target.disabled = true;
    const updated = await updateOrderStatus(order.id, newStatus);
    e.target.disabled = false;
    if (updated) showToast(`Status pesanan ${order.id} diperbarui menjadi "${newStatus}".`, 'success');
    closeAdminModal('orderDetailOverlay');
    renderOrdersTable();
  });

  openAdminModal('orderDetailOverlay');
}

/* ===================== REFUNDS PAGE (KELOLA REFUND) ===================== */
function refundStatusBadgeClass(status) {
  const map = {
    'Diajukan': 'status-pending',
    'Diproses': 'status-processed',
    'Disetujui': 'status-delivered',
    'Ditolak': 'status-cancelled'
  };
  return map[status] || 'status-pending';
}

function renderRefundsPage() {
  renderRefundsTable();
}

function renderRefundsTable() {
  const refunds = getRefunds().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const tbody = document.getElementById('refundsTableBody');

  if (refunds.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#999;padding:30px;">Belum ada permintaan refund.</td></tr>`;
    return;
  }

  tbody.innerHTML = refunds.map(r => `
    <tr>
      <td>${r.id}</td>
      <td>${r.orderId}</td>
      <td>${r.userEmail}</td>
      <td style="max-width:220px;">${r.reason}</td>
      <td>${formatIDR(r.amount)}</td>
      <td><span class="status-badge ${refundStatusBadgeClass(r.status)}">${r.status}</span></td>
      <td>
        <select class="status-select" data-status-refund="${r.id}" ${r.status === 'Disetujui' || r.status === 'Ditolak' ? 'disabled' : ''}>
          ${REFUND_STATUS_FLOW.map(s => `<option value="${s}" ${r.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-status-refund]').forEach(select => {
    select.addEventListener('change', async () => {
      const refundId = select.dataset.statusRefund;
      const newStatus = select.value;
      select.disabled = true;
      const updated = await updateRefundStatus(refundId, newStatus);
      select.disabled = false;
      if (updated) showToast(`Status refund ${refundId} diperbarui menjadi "${newStatus}".`, 'success');
      renderRefundsTable();
    });
  });
}

/* ===================== REPORT PAGE (LAPORAN PENJUALAN) ===================== */
function renderReportPage() {
  const report = getSalesReport();

  document.getElementById('reportKpiGrid').innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">Total Pendapatan</div>
      <div class="kpi-value">${formatIDR(report.totalRevenue)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Pesanan Sukses</div>
      <div class="kpi-value">${report.totalOrders}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Unit Terjual</div>
      <div class="kpi-value">${report.totalItemsSold}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Rata-rata Nilai Pesanan</div>
      <div class="kpi-value">${formatIDR(report.avgOrderValue)}</div>
    </div>
  `;

  renderBarChart('reportBarChart', report.days);

  const topBody = document.getElementById('topProductsTable');
  if (report.topProducts.length === 0) {
    topBody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#999;padding:30px;">Belum ada data penjualan.</td></tr>`;
  } else {
    topBody.innerHTML = report.topProducts.map(p => `
      <tr><td>${p.name}</td><td>${p.qty} unit</td><td>${formatIDR(p.revenue)}</td></tr>
    `).join('');
  }

  const catBody = document.getElementById('categoryRevenueTable');
  const catEntries = Object.entries(report.categoryRevenue).sort((a, b) => b[1] - a[1]);
  if (catEntries.length === 0) {
    catBody.innerHTML = `<tr><td colspan="2" style="text-align:center;color:#999;padding:30px;">Belum ada data penjualan.</td></tr>`;
  } else {
    catBody.innerHTML = catEntries.map(([cat, rev]) => `
      <tr><td>${cat}</td><td>${formatIDR(rev)}</td></tr>
    `).join('');
  }

  document.getElementById('exportReportBtn').onclick = () => exportReportCSV(report);
}

function exportReportCSV(report) {
  const orders = getOrders().filter(o => o.status !== 'Dibatalkan');
  let csv = 'ID Pesanan,Email Pelanggan,Tanggal,Status,Metode Pembayaran,Total\n';
  orders.forEach(o => {
    csv += `${o.id},${o.userEmail},${formatDate(o.createdAt)},${o.status},${o.paymentMethod},${o.total}\n`;
  });
  csv += `\nTotal Pendapatan,${report.totalRevenue}\n`;
  csv += `Total Pesanan,${report.totalOrders}\n`;
  csv += `Total Unit Terjual,${report.totalItemsSold}\n`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `laporan-penjualan-luxiana-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Laporan penjualan berhasil diunduh.', 'success');
}

/* ===================== CUSTOMERS PAGE ===================== */
function renderCustomersPage() {
  const users = getUsers();
  const orders = getOrders();
  const tbody = document.getElementById('customersTableBody');

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#999;padding:30px;">Belum ada pelanggan terdaftar.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => {
    const userOrders = orders.filter(o => o.userId === u.id);
    const totalSpend = userOrders.filter(o => o.status !== 'Dibatalkan').reduce((s, o) => s + o.total, 0);
    return `
      <tr>
        <td>${u.email}</td>
        <td>${u.name}</td>
        <td>${formatDate(u.joined)}</td>
        <td>${userOrders.length}</td>
        <td>${formatIDR(totalSpend)}</td>
      </tr>`;
  }).join('');
}