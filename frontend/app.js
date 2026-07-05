/* ===================== LUXIANA — CUSTOMER APP LOGIC ===================== */

let currentCategory = 'all';
let currentSort = 'default';
let currentProductId = null;
let selectedSize = null;
let selectedPdQty = 1;
let selectedPayment = null;

/* Foto representatif tiap kategori diambil otomatis dari produk pertama
   pada kategori tersebut (lihat getCategoryImage). */

document.addEventListener('DOMContentLoaded', async () => {
  await loadProductsCache(); // ambil data produk dari database dulu sebelum render
  await loadOrdersCache(); // ambil data pesanan + refund (embedded) dari database
  renderCategoryStrip();
  renderFilterChips();
  renderNewArrivals();
  renderSale();
  renderLimitedEdition();
  renderProductGrid();
  refreshHeaderState();
  bindGlobalEvents();
  bindAccountHubEvents();
  initScrollReveal();
  initFullBleedBanner();
  initAddressCombos();

  // Smooth page-enter transition
  requestAnimationFrame(() => {
    document.body.classList.add('page-ready');
  });
});

/* ---------- Scroll Reveal Animation ---------- */
let revealObserver = null;
function initScrollReveal() {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  }
  document.querySelectorAll('.reveal:not([data-reveal-bound])').forEach((el, i) => {
    el.setAttribute('data-reveal-bound', '1');
    el.style.transitionDelay = `${Math.min(i % 8, 8) * 0.06}s`;
    revealObserver.observe(el);
  });
}

/* ---------- Full-Bleed Banner Zoom-In ---------- */
function initFullBleedBanner() {
  const banner = document.getElementById('fullBleedBanner');
  if (!banner) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        banner.classList.add('active');
        obs.unobserve(banner);
      }
    });
  }, { threshold: 0.2 });
  obs.observe(banner);
}

/* ---------- Category Strip ---------- */
function renderCategoryStrip() {
  const products = getProducts();
  const categories = [...new Set(products.map(p => p.category))];
  const strip = document.getElementById('catStrip');
  strip.innerHTML = categories.map(cat => {
    const count = products.filter(p => p.category === cat).length;
    return `
      <div class="cat-card reveal" data-cat="${cat}">
        <h4>${cat}</h4>
        <span>${count} Produk</span>
      </div>`;
  }).join('');

  if (typeof initScrollReveal === 'function') initScrollReveal();
  strip.querySelectorAll('.cat-card').forEach(card => {
    card.addEventListener('click', () => {
      currentCategory = card.dataset.cat;
      renderFilterChips();
      renderProductGrid();
      document.getElementById('collection').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/* ---------- Filter Chips ---------- */
function renderFilterChips() {
  const products = getProducts();
  const categories = [...new Set(products.map(p => p.category))];
  const wrap = document.getElementById('filterChips');
  wrap.innerHTML = `<button class="chip ${currentCategory === 'all' ? 'active' : ''}" data-cat="all">Semua</button>` +
    categories.map(cat => `<button class="chip ${currentCategory === cat ? 'active' : ''}" data-cat="${cat}">${cat}</button>`).join('');

  wrap.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      currentCategory = chip.dataset.cat;
      renderFilterChips();
      renderProductGrid();
    });
  });
}

/* ---------- Product Card Helpers (dipakai bersama oleh Product Grid, New Arrival, Sale & Limited Edition) ---------- */
function productCardHTML(p, wishlist) {
  const isWished = wishlist.includes(p.id);
  const discounted = hasDiscount(p);
  const finalPrice = getDiscountedPrice(p);

  const badges = [];
  if (discounted) badges.push(`<span class="tag-sale">-${p.discountPercent}%</span>`);
  else if (p.isNew) badges.push(`<span class="tag-new">Baru</span>`);
  else if (p.oldPrice) badges.push(`<span class="tag-sale">Sale</span>`);
  if (p.isLimited) badges.push(`<span class="tag-limited">Limited</span>`);

  return `
    <div class="product-card reveal" data-id="${p.id}">
      <div class="product-thumb">
        <div class="badge-stack">${badges.join('')}</div>
        <button class="wish-btn ${isWished ? 'active' : ''}" data-wish="${p.id}">${isWished ? '♥' : '♡'}</button>
        <div class="ph"><img src="${p.image}" alt="${p.name}" loading="lazy"></div>
      </div>
      <div class="product-info">
        <div class="p-cat">${p.category}</div>
        <h4>${p.name}</h4>
        <div class="p-price">
          ${discounted ? `<span class="strike">${formatIDR(p.price)}</span>` : (p.oldPrice ? `<span class="strike">${formatIDR(p.oldPrice)}</span>` : '')}
          ${formatIDR(finalPrice)}
        </div>
      </div>
    </div>`;
}

function bindProductCardEvents(grid, onWishToggle) {
  if (typeof initScrollReveal === 'function') initScrollReveal();
  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.wish-btn')) return;
      openProductDetail(card.dataset.id);
    });
  });

  grid.querySelectorAll('.wish-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWishlist(btn.dataset.wish);
      onWishToggle();
      renderWishPanel();
    });
  });
}

/* ---------- Product Grid ---------- */
function renderProductGrid() {
  let products = getProducts();
  if (currentCategory !== 'all') {
    products = products.filter(p => p.category === currentCategory);
  }

  switch (currentSort) {
    case 'price-asc': products.sort((a, b) => getDiscountedPrice(a) - getDiscountedPrice(b)); break;
    case 'price-desc': products.sort((a, b) => getDiscountedPrice(b) - getDiscountedPrice(a)); break;
    case 'newest': products = products.filter(p => p.isNew).concat(products.filter(p => !p.isNew)); break;
    case 'bestseller': products.sort((a, b) => (b.sold || 0) - (a.sold || 0)); break;
  }

  const grid = document.getElementById('productGrid');
  const wishlist = getWishlist();

  if (products.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="ico">◇</div><p>Tidak ada produk pada kategori ini.</p></div>`;
    return;
  }

  grid.innerHTML = products.map(p => productCardHTML(p, wishlist)).join('');
  bindProductCardEvents(grid, refreshAllProductGrids);
}

/* ---------- New Arrival ---------- */
function renderNewArrivals() {
  const section = document.getElementById('newArrivalSection');
  const grid = document.getElementById('newArrivalGrid');
  if (!section || !grid) return;

  const newProducts = getProducts().filter(p => p.isNew);

  if (newProducts.length === 0) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  const wishlist = getWishlist();
  grid.innerHTML = newProducts.map(p => productCardHTML(p, wishlist)).join('');
  bindProductCardEvents(grid, refreshAllProductGrids);
}

/* ---------- Sale ---------- */
function renderSale() {
  const section = document.getElementById('saleSection');
  const grid = document.getElementById('saleGrid');
  if (!section || !grid) return;

  const saleProducts = getProducts().filter(p => hasDiscount(p));

  if (saleProducts.length === 0) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  const wishlist = getWishlist();
  grid.innerHTML = saleProducts.map(p => productCardHTML(p, wishlist)).join('');
  bindProductCardEvents(grid, refreshAllProductGrids);
}

/* ---------- Limited Edition ---------- */
function renderLimitedEdition() {
  const section = document.getElementById('limitedEditionSection');
  const grid = document.getElementById('limitedEditionGrid');
  if (!section || !grid) return;

  const limitedProducts = getProducts().filter(p => p.isLimited);

  if (limitedProducts.length === 0) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  const wishlist = getWishlist();
  grid.innerHTML = limitedProducts.map(p => productCardHTML(p, wishlist)).join('');
  bindProductCardEvents(grid, refreshAllProductGrids);
}

/* ---------- Refresh semua grid produk (dipakai saat wishlist berubah) ---------- */
function refreshAllProductGrids() {
  renderProductGrid();
  renderNewArrivals();
  renderSale();
  renderLimitedEdition();
}

document.getElementById('sortSelect').addEventListener('change', (e) => {
  currentSort = e.target.value;
  renderProductGrid();
});

/* ===================== MODAL OPEN/CLOSE HELPERS ===================== */
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

function bindGlobalEvents() {
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
  document.querySelectorAll('.overlay').forEach(ov => {
    ov.addEventListener('click', (e) => {
      if (e.target === ov) closeModal(ov.id);
    });
  });

  document.getElementById('userBtn').addEventListener('click', () => {
    renderAccountPanel();
    openModal('accountOverlay');
  });
  document.getElementById('cartBtn').addEventListener('click', () => {
    renderCartPanel();
    openModal('cartOverlay');
  });
  document.getElementById('wishBtn').addEventListener('click', () => {
    renderWishPanel();
    openModal('wishOverlay');
  });
  document.getElementById('navOrdersLink').addEventListener('click', (e) => {
    e.preventDefault();
    openOrdersPanel();
  });

  // Pindahkan garis aktif (underline emas) ke menu navigasi yang baru diklik
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
    if (link.id === 'navOrdersLink') return;
    link.addEventListener('click', () => {
      document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
      link.classList.add('active');
    });
  });

  document.getElementById('openLoginFromAccount').addEventListener('click', () => {
    closeModal('accountOverlay');
    openModal('loginOverlay');
  });
  document.getElementById('logoutBtn').addEventListener('click', () => {
    logoutUser();
    refreshHeaderState();
    renderAccountPanel();
    refreshAllProductGrids();
    showToast('Anda telah keluar dari akun.', 'success');
  });

  // Gmail login
  document.getElementById('gmailLoginBtn').addEventListener('click', () => {
    document.getElementById('gmailField').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('gmailInput').focus();
  });
  document.getElementById('gmailSubmitBtn').addEventListener('click', handleGmailLogin);
  document.getElementById('gmailInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleGmailLogin();
  });

  document.getElementById('trackSubmitBtn').addEventListener('click', handleTrackOrder);
  document.getElementById('trackOrderInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleTrackOrder();
  });

  document.getElementById('successCloseBtn').addEventListener('click', () => {
    closeModal('successOverlay');
  });
}

function handleGmailLogin() {
  const input = document.getElementById('gmailInput');
  const field = document.getElementById('gmailField');
  const email = input.value.trim();

  if (!email) {
    field.classList.add('has-error');
    document.getElementById('gmailError').textContent = 'Email tidak boleh kosong.';
    return;
  }
  if (!isValidGmail(email)) {
    field.classList.add('has-error');
    document.getElementById('gmailError').textContent = 'Masukkan alamat gmail yang valid (harus diakhiri @gmail.com).';
    return;
  }
  field.classList.remove('has-error');
  const result = loginWithGmail(email);
  if (result.ok) {
    closeModal('loginOverlay');
    input.value = '';
    refreshHeaderState();
    refreshAllProductGrids();
    showToast(`Selamat datang, ${result.user.name}!`, 'success');
  }
}

/* ===================== HEADER STATE ===================== */
function refreshHeaderState() {
  const badge = document.getElementById('cartBadge');
  const totalItems = cartTotalItems();
  if (totalItems > 0) {
    badge.textContent = totalItems > 99 ? '99+' : totalItems;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

/* ===================== ACCOUNT PANEL (MY ACCOUNT HUB) ===================== */
function renderAccountPanel() {
  const user = getCurrentUser();
  const loggedOutView = document.getElementById('accountLoggedOutView');
  const loggedInView = document.getElementById('accountLoggedInView');
  const nameEl = document.getElementById('accountUserName');
  const emailEl = document.getElementById('accountUserEmail');

  if (user) {
    nameEl.textContent = `Halo, ${user.name}`;
    emailEl.textContent = user.email;
    loggedOutView.classList.add('hidden');
    loggedInView.classList.remove('hidden');
    switchAccountTab('profile');
    renderAccProfileForm();
    renderAccAddressList();
    renderAccOrders();
    renderAccWishlist();
    renderAccRefunds();
  } else {
    nameEl.textContent = 'Akun Saya';
    emailEl.textContent = '';
    loggedOutView.classList.remove('hidden');
    loggedInView.classList.add('hidden');
  }
}

function switchAccountTab(tab) {
  document.querySelectorAll('.acc-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.acc-tab-content').forEach(c => c.classList.toggle('hidden', c.id !== 'acc-' + tab));
}

function bindAccountHubEvents() {
  document.querySelectorAll('.acc-tab').forEach(tab => {
    tab.addEventListener('click', () => switchAccountTab(tab.dataset.tab));
  });

  /* ---- Profil ---- */
  document.getElementById('accProfileName').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^A-Za-z\s]/g, '').slice(0, 30);
  });
  document.getElementById('accProfilePhone').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 14);
  });
  document.getElementById('accProfileSaveBtn').addEventListener('click', () => {
    const user = getCurrentUser();
    if (!user) return;
    const name = document.getElementById('accProfileName').value.trim();
    const phone = document.getElementById('accProfilePhone').value.trim();
    const gender = document.getElementById('accProfileGender').value;
    const birthdate = document.getElementById('accProfileBirthdate').value;

    let valid = true;
    valid = validateField('accProfileName', /^[A-Za-z\s]{2,30}$/.test(name)) && valid;
    valid = validateField('accProfilePhone', phone === '' || /^[0-9]{1,14}$/.test(phone)) && valid;

    if (!valid) {
      showToast('Mohon periksa kembali data profil Anda.', 'error');
      return;
    }
    updateUserProfile(user.id, { name, phone, gender, birthdate });
    document.getElementById('accountUserName').textContent = `Halo, ${name}`;
    showToast('Profil berhasil disimpan.', 'success');
  });

  /* ---- Alamat ---- */
  document.getElementById('accAddAddressBtn').addEventListener('click', () => { checkoutReturnAfterAddress = false; openAddressForm(null); });
  document.getElementById('afSaveBtn').addEventListener('click', saveAddressForm);
  document.getElementById('afLabel').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^A-Za-z\s]/g, '').slice(0, 20);
  });
  document.getElementById('afRecipientName').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^A-Za-z\s]/g, '').slice(0, 30);
  });
  document.getElementById('afPhone').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 14);
  });
  document.getElementById('afPostal').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 5);
  });

  /* ---- Refund ---- */
  document.getElementById('rfSubmitBtn').addEventListener('click', submitRefundRequest);
}

/* ---- Profil: isi form dengan data user saat ini ---- */
function renderAccProfileForm() {
  const user = getCurrentUser();
  if (!user) return;
  document.getElementById('accProfileName').value = user.name || '';
  document.getElementById('accProfilePhone').value = user.phone || '';
  document.getElementById('accProfileGender').value = user.gender || '';
  document.getElementById('accProfileBirthdate').value = user.birthdate || '';
  document.getElementById('accProfileEmail').value = user.email || '';
}

/* ---- Alamat: render daftar & CRUD ---- */
function renderAccAddressList() {
  const list = getAddresses();
  const container = document.getElementById('accAddressList');

  if (list.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="ico">📍</div><p>Belum ada alamat tersimpan.</p></div>`;
    return;
  }

  container.innerHTML = list.map(a => `
    <div class="address-card" data-id="${a.id}">
      <div class="address-card-top">
        <span class="address-label">${a.label}</span>
        ${a.isDefault ? '<span class="address-default-badge">Utama</span>' : ''}
      </div>
      <div class="address-name">${a.recipientName} • ${a.phone}</div>
      <div class="address-detail">${a.address}<br>${a.city}, ${a.province} ${a.postal}</div>
      <div class="address-actions">
        ${!a.isDefault ? `<span class="addr-set-default" data-id="${a.id}">Jadikan Utama</span>` : ''}
        <span class="addr-edit" data-id="${a.id}">Ubah</span>
        <span class="addr-delete" data-id="${a.id}">Hapus</span>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.addr-set-default').forEach(el => {
    el.addEventListener('click', () => { setDefaultAddress(el.dataset.id); renderAccAddressList(); showToast('Alamat utama diperbarui.', 'success'); });
  });
  container.querySelectorAll('.addr-edit').forEach(el => {
    el.addEventListener('click', () => { checkoutReturnAfterAddress = false; openAddressForm(el.dataset.id); });
  });
  container.querySelectorAll('.addr-delete').forEach(el => {
    el.addEventListener('click', () => {
      deleteAddress(el.dataset.id);
      renderAccAddressList();
      showToast('Alamat dihapus.', 'success');
    });
  });
}

/* ---------- Searchable Dropdown (Combobox) untuk Provinsi & Kota/Kabupaten ---------- */
function getAllCitiesFlat() {
  const all = new Set();
  Object.values(PROVINCE_CITY_DATA).forEach(list => list.forEach(c => all.add(c)));
  return Array.from(all).sort((a, b) => a.localeCompare(b));
}

function setupCombobox({ inputId, listId, wrapId, getOptions, onSelect }) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  const wrap = document.getElementById(wrapId);
  if (!input || !list || !wrap) return null;

  function renderList() {
    const options = getOptions() || [];
    const q = input.value.trim().toLowerCase();
    let filtered = q ? options.filter(o => o.toLowerCase().includes(q)) : options.slice();
    filtered.sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.toLowerCase().startsWith(q) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.localeCompare(b);
    });
    filtered = filtered.slice(0, 50);

    if (filtered.length === 0) {
      list.innerHTML = `<div class="combo-empty">Tidak ditemukan. Ketik nama lain atau pilih dari daftar.</div>`;
    } else {
      list.innerHTML = filtered.map(o => `<div class="combo-item" data-val="${o.replace(/"/g, '&quot;')}">${o}</div>`).join('');
    }
    wrap.classList.add('open');
  }

  input.addEventListener('input', renderList);
  input.addEventListener('focus', renderList);
  input.addEventListener('blur', () => {
    setTimeout(() => wrap.classList.remove('open'), 150);
  });

  list.addEventListener('mousedown', (e) => {
    const item = e.target.closest('.combo-item');
    if (!item) return;
    e.preventDefault();
    input.value = item.dataset.val;
    wrap.classList.remove('open');
    input.closest('.field')?.classList.remove('has-error');
    if (onSelect) onSelect(item.dataset.val);
  });

  input.addEventListener('keydown', (e) => {
    if (!wrap.classList.contains('open')) return;
    const items = Array.from(list.querySelectorAll('.combo-item'));
    if (!items.length) return;
    let idx = items.findIndex(i => i.classList.contains('active'));
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      idx = Math.min(idx + 1, items.length - 1);
      items.forEach(i => i.classList.remove('active'));
      items[idx].classList.add('active');
      items[idx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      idx = Math.max(idx - 1, 0);
      items.forEach(i => i.classList.remove('active'));
      items[idx].classList.add('active');
      items[idx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      if (idx >= 0) {
        e.preventDefault();
        items[idx].dispatchEvent(new Event('mousedown', { bubbles: true }));
      }
    } else if (e.key === 'Escape') {
      wrap.classList.remove('open');
    }
  });

  return { refresh: renderList };
}

function initAddressCombos() {
  setupCombobox({
    inputId: 'afProvince', listId: 'afProvinceList', wrapId: 'afProvinceCombo',
    getOptions: () => PROVINCE_LIST,
    onSelect: (province) => {
      const cityInput = document.getElementById('afCity');
      const validCities = PROVINCE_CITY_DATA[province] || [];
      if (cityInput.value.trim() && !validCities.includes(cityInput.value.trim())) {
        cityInput.value = '';
      }
    }
  });

  setupCombobox({
    inputId: 'afCity', listId: 'afCityList', wrapId: 'afCityCombo',
    getOptions: () => {
      const province = document.getElementById('afProvince').value.trim();
      return (province && PROVINCE_CITY_DATA[province]) ? PROVINCE_CITY_DATA[province] : getAllCitiesFlat();
    }
  });
}

function openAddressForm(id) {
  const eyebrow = document.getElementById('addressFormEyebrow');
  const title = document.getElementById('addressFormTitle');
  document.querySelectorAll('#addressFormOverlay .field').forEach(f => f.classList.remove('has-error'));

  if (id) {
    const addr = getAddresses().find(a => a.id === id);
    if (!addr) return;
    eyebrow.textContent = 'Ubah Alamat';
    title.textContent = 'Ubah Alamat';
    document.getElementById('afId').value = addr.id;
    document.getElementById('afLabel').value = addr.label;
    document.getElementById('afRecipientName').value = addr.recipientName;
    document.getElementById('afPhone').value = addr.phone;
    document.getElementById('afAddress').value = addr.address;
    document.getElementById('afCity').value = addr.city;
    document.getElementById('afPostal').value = addr.postal;
    document.getElementById('afProvince').value = addr.province;
    document.getElementById('afIsDefault').checked = !!addr.isDefault;
  } else {
    eyebrow.textContent = 'Alamat Baru';
    title.textContent = 'Tambah Alamat';
    document.getElementById('afId').value = '';
    document.getElementById('afLabel').value = '';
    document.getElementById('afRecipientName').value = '';
    document.getElementById('afPhone').value = '';
    document.getElementById('afAddress').value = '';
    document.getElementById('afCity').value = '';
    document.getElementById('afPostal').value = '';
    document.getElementById('afProvince').value = '';
    document.getElementById('afIsDefault').checked = false;
  }
  openModal('addressFormOverlay');
}

function saveAddressForm() {
  const id = document.getElementById('afId').value;
  const label = document.getElementById('afLabel').value.trim() || 'Alamat';
  const recipientName = document.getElementById('afRecipientName').value.trim();
  const phone = document.getElementById('afPhone').value.trim();
  const address = document.getElementById('afAddress').value.trim();
  const city = document.getElementById('afCity').value.trim();
  const postal = document.getElementById('afPostal').value.trim();
  const province = document.getElementById('afProvince').value.trim();
  const isDefault = document.getElementById('afIsDefault').checked;

  let valid = true;
  valid = validateField('afLabel', /^[A-Za-z\s]{2,20}$/.test(label)) && valid;
  valid = validateField('afRecipientName', /^[A-Za-z\s]{2,30}$/.test(recipientName)) && valid;
  valid = validateField('afPhone', /^[0-9]{1,14}$/.test(phone)) && valid;
  valid = validateField('afAddress', address.length >= 20) && valid;
  valid = validateField('afCity', city.length >= 2) && valid;
  valid = validateField('afPostal', /^[0-9]{1,5}$/.test(postal)) && valid;
  valid = validateField('afProvince', province.length >= 2) && valid;

  if (!valid) {
    showToast('Mohon lengkapi data alamat dengan benar.', 'error');
    return;
  }

  const data = { label, recipientName, phone, address, city, postal, province, isDefault };
  let savedAddr;
  if (id) {
    savedAddr = updateAddress(id, data);
    showToast('Alamat berhasil diperbarui.', 'success');
  } else {
    savedAddr = addAddress(data);
    showToast('Alamat berhasil ditambahkan.', 'success');
  }
  closeModal('addressFormOverlay');
  renderAccAddressList();

  if (checkoutReturnAfterAddress) {
    checkoutReturnAfterAddress = false;
    if (savedAddr) selectedAddressId = savedAddr.id;
    if (renderCheckoutPage()) openModal('checkoutOverlay');
  }
}

/* ---- Riwayat Pesanan (dalam Akun) ---- */
const ACC_STATUS_CLASS_MAP = {
  'Pending': 'status-pending',
  'Diproses': 'status-processed',
  'Dikirim': 'status-shipped',
  'Selesai': 'status-delivered',
  'Dibatalkan': 'status-cancelled'
};

function renderAccOrders() {
  const user = getCurrentUser();
  const orders = getOrdersByUser(user.id);
  const container = document.getElementById('accOrdersListContainer');

  if (orders.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="ico">📦</div><p>Anda belum memiliki pesanan.</p></div>`;
    return;
  }

  container.innerHTML = orders.map(o => `
    <div class="order-card">
      <div class="order-card-top">
        <div>
          <div class="order-id">${o.id}</div>
          <div class="order-date">${formatDate(o.createdAt)}</div>
        </div>
        <span class="status-badge ${ACC_STATUS_CLASS_MAP[o.status]}">${o.status}</span>
      </div>
      <div class="order-items-row">
        ${o.items.map(i => `<div class="order-mini-thumb" title="${i.name} ×${i.qty}"><img src="${getProductById(i.productId)?.image || DEFAULT_PRODUCT_IMAGE}" alt="${i.name}"></div>`).join('')}
      </div>
      <div class="order-card-bottom">
        <span class="order-total">${formatIDR(o.total)}</span>
        <div style="display:flex;gap:10px;">
          ${canCancelOrder(o) ? `<button class="btn btn-sm btn-outline acc-cancel-order" data-id="${o.id}">Batalkan</button>` : ''}
          ${canRequestRefund(o) ? `<button class="btn btn-sm btn-outline acc-request-refund" data-id="${o.id}">Ajukan Refund</button>` : ''}
          <button class="btn btn-sm btn-outline acc-track-order" data-id="${o.id}">Lacak Pengiriman</button>
        </div>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.acc-track-order').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal('accountOverlay');
      document.getElementById('trackOrderInput').value = btn.dataset.id;
      handleTrackOrder();
      openModal('trackOverlay');
    });
  });
  container.querySelectorAll('.acc-cancel-order').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const updated = await cancelOrder(btn.dataset.id);
      btn.disabled = false;
      if (updated) showToast('Pesanan berhasil dibatalkan.', 'success');
      renderAccOrders();
    });
  });
  container.querySelectorAll('.acc-request-refund').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('rfOrderId').value = btn.dataset.id;
      document.getElementById('rfOrderIdLabel').textContent = btn.dataset.id;
      document.getElementById('rfReason').value = '';
      document.querySelector('#refundFormOverlay .field')?.classList.remove('has-error');
      openModal('refundFormOverlay');
    });
  });
}

/* ---- Wishlist (dalam Akun) ---- */
function renderAccWishlist() {
  const wishIds = getWishlist();
  const products = getProducts();
  const container = document.getElementById('accWishItemsContainer');

  if (wishIds.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="ico">♡</div><p>Belum ada produk favorit.</p></div>`;
    return;
  }

  container.innerHTML = wishIds.map(id => {
    const p = products.find(pp => pp.id === id);
    if (!p) return '';
    return `
      <div class="cart-item" data-pid="${p.id}">
        <div class="cart-thumb"><img src="${p.image}" alt="${p.name}"></div>
        <div class="cart-item-info">
          <h5>${p.name}</h5>
          <div class="meta">${p.category}</div>
          <div class="price">${formatIDR(p.price)}</div>
        </div>
        <div style="text-align:right;display:flex;flex-direction:column;gap:8px;justify-content:center;">
          <button class="btn-sm btn btn-outline acc-wish-view-btn" data-id="${p.id}">Lihat</button>
          <div class="cart-remove acc-wish-remove-btn" data-id="${p.id}">Hapus</div>
        </div>
      </div>`;
  }).join('');

  container.querySelectorAll('.acc-wish-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal('accountOverlay');
      openProductDetail(btn.dataset.id);
    });
  });
  container.querySelectorAll('.acc-wish-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleWishlist(btn.dataset.id);
      renderAccWishlist();
      refreshAllProductGrids();
    });
  });
}

/* ---- Refund (dalam Akun) ---- */
const REFUND_STATUS_CLASS_MAP = {
  'Diajukan': 'status-refund-diajukan',
  'Diproses': 'status-refund-diproses',
  'Disetujui': 'status-refund-disetujui',
  'Ditolak': 'status-refund-ditolak'
};

function renderAccRefunds() {
  const user = getCurrentUser();
  const refunds = getRefundsByUser(user.id);
  const container = document.getElementById('accRefundListContainer');

  if (refunds.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="ico">↩</div><p>Belum ada permintaan refund. Refund dapat diajukan dari tab Riwayat Pesanan untuk pesanan berstatus Selesai.</p></div>`;
    return;
  }

  container.innerHTML = refunds.map(r => `
    <div class="refund-card">
      <div class="refund-card-top">
        <span class="refund-order-id">${r.orderId}</span>
        <span class="status-badge ${REFUND_STATUS_CLASS_MAP[r.status]}">${r.status}</span>
      </div>
      <div class="refund-reason">${r.reason}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span class="refund-amount">${formatIDR(r.amount)}</span>
        <span style="font-size:11px;color:#999;">${formatDate(r.createdAt)}</span>
      </div>
    </div>
  `).join('');
}

async function submitRefundRequest() {
  const orderId = document.getElementById('rfOrderId').value;
  const reason = document.getElementById('rfReason').value.trim();
  const valid = validateField('rfReason', reason.length >= 10);
  if (!valid) {
    showToast('Mohon jelaskan alasan refund (minimal 10 karakter).', 'error');
    return;
  }
  const submitBtn = document.getElementById('rfSubmitBtn');
  submitBtn.disabled = true;
  const refund = await createRefundRequest(orderId, reason);
  submitBtn.disabled = false;
  if (!refund) {
    showToast('Pesanan tidak memenuhi syarat untuk refund.', 'error');
    return;
  }
  closeModal('refundFormOverlay');
  renderAccOrders();
  renderAccRefunds();
  showToast('Permintaan refund berhasil dikirim.', 'success');
}

/* ===================== PRODUCT DETAIL ===================== */
let selectedColor = null;
let selectedCustomSize = false;

function openProductDetail(productId) {
  const p = getProductById(productId);
  if (!p) return;
  currentProductId = productId;
  selectedSize = p.sizes[0];
  selectedPdQty = 1;
  selectedColor = (p.colors && p.colors.length) ? p.colors[0] : null;
  selectedCustomSize = false;

  const discounted = hasDiscount(p);
  const hasColors = p.colors && p.colors.length > 0;

  const content = document.getElementById('productDetailContent');
  content.innerHTML = `
    <div class="pd-grid">
      <div class="pd-gallery">
        <div class="pd-gallery-main" id="pdGalleryMain"><img src="${p.image}" alt="${p.name}"></div>
      </div>
      <div class="pd-info">
        <div class="p-cat">${p.category}</div>
        <h1>${p.name}</h1>
        <div class="price" id="pdPriceDisplay">${discounted ? `<span class="strike">${formatIDR(p.price)}</span>` : (p.oldPrice ? `<span class="strike">${formatIDR(p.oldPrice)}</span>` : '')}<span id="pdPriceValue">${formatIDR(getUnitPrice(p, false))}</span>${discounted ? `<span class="tag-sale" style="position:static;display:inline-block;vertical-align:middle;">-${p.discountPercent}%</span>` : ''}</div>
        <p class="desc">${p.desc}</p>

        <div class="field" style="max-width:280px;">
          <label>Pilih Ukuran</label>
          <div class="pd-size-list" id="pdSizeList">
            ${p.sizes.map(s => `<div class="size-opt ${s === selectedSize ? 'active' : ''}" data-size="${s}">${s}</div>`).join('')}
          </div>
        </div>

        ${hasColors ? `
        <div class="field" style="max-width:280px;">
          <label>Pilih Warna</label>
          <div class="pd-size-list" id="pdColorList">
            ${p.colors.map(c => `<div class="size-opt ${c === selectedColor ? 'active' : ''}" data-color="${c}">${c}</div>`).join('')}
          </div>
        </div>` : ''}

        ${p.allowCustomSize ? `
        <div class="field" style="max-width:380px;">
          <label class="pd-custom-size-label">
            <input type="checkbox" id="pdCustomSizeCheck">
            Ukuran Custom (+${formatIDR(p.customSizeFee || 0)})
          </label>
          <div class="field-hint">Centang jika Anda ingin ukuran disesuaikan khusus dengan tambahan biaya.</div>
        </div>` : ''}

        <div class="pd-qty-row">
          <label style="font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#2B2825;">Jumlah</label>
          <div class="qty-control">
            <button id="pdQtyMinus" ${p.stock <= 0 ? 'disabled' : ''}>−</button>
            <input type="text" id="pdQtyInput" value="${p.stock > 0 ? 1 : 0}" inputmode="numeric" ${p.stock <= 0 ? 'disabled' : ''}>
            <button id="pdQtyPlus" ${p.stock <= 0 ? 'disabled' : ''}>+</button>
          </div>
          <span style="font-size:12px;color:#999;">${p.stock > 0 ? `Stok: ${p.stock} (maks. ${p.stock} per pesanan)` : 'Stok habis'}</span>
        </div>

        <div class="pd-actions">
          <button class="btn btn-outline" style="flex:1;" id="pdAddCartBtn" ${p.stock <= 0 ? 'disabled' : ''}>${p.stock <= 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}</button>
          <button class="btn" style="flex:1;" id="pdBuyNowBtn" ${p.stock <= 0 ? 'disabled' : ''}>Beli Sekarang</button>
        </div>

        <div class="pd-meta-list">
          <div><strong>Material</strong> <span>${p.material}</span></div>
          <div><strong>Asal</strong> <span>${p.origin}</span></div>
          <div><strong>Perawatan</strong> <span>${p.care}</span></div>
          <div><strong>Terjual</strong> <span>${p.sold || 0} unit</span></div>
        </div>
      </div>
    </div>
  `;

  bindProductDetailEvents(p);
  openModal('productOverlay');
}

function updatePdPriceDisplay(p) {
  const el = document.getElementById('pdPriceValue');
  if (el) el.textContent = formatIDR(getUnitPrice(p, selectedCustomSize));
}

function bindProductDetailEvents(p) {
  document.querySelectorAll('#pdSizeList .size-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('#pdSizeList .size-opt').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedSize = opt.dataset.size;
    });
  });

  const colorList = document.getElementById('pdColorList');
  if (colorList) {
    colorList.querySelectorAll('.size-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        colorList.querySelectorAll('.size-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        selectedColor = opt.dataset.color;
      });
    });
  }

  const customSizeCheck = document.getElementById('pdCustomSizeCheck');
  if (customSizeCheck) {
    customSizeCheck.addEventListener('change', () => {
      selectedCustomSize = customSizeCheck.checked;
      updatePdPriceDisplay(p);
    });
  }

  const qtyInput = document.getElementById('pdQtyInput');
  document.getElementById('pdQtyMinus').addEventListener('click', () => {
    let val = clampQty(parseInt(qtyInput.value) - 1, p.stock);
    qtyInput.value = val;
    selectedPdQty = val;
  });
  document.getElementById('pdQtyPlus').addEventListener('click', () => {
    const current = parseInt(qtyInput.value) || 0;
    if (current >= p.stock) {
      showToast(`Stok produk ini hanya tersedia ${p.stock} unit.`, 'error');
      return;
    }
    let val = clampQty(current + 1, p.stock);
    qtyInput.value = val;
    selectedPdQty = val;
  });
  qtyInput.addEventListener('input', () => {
    let raw = qtyInput.value.replace(/[^0-9]/g, '');
    qtyInput.value = raw;
  });
  qtyInput.addEventListener('blur', () => {
    let raw = parseInt(qtyInput.value) || 1;
    if (raw > p.stock) {
      showToast(`Jumlah melebihi stok. Maksimal pembelian adalah ${p.stock} unit.`, 'error');
    }
    let val = clampQty(raw, p.stock);
    qtyInput.value = val;
    selectedPdQty = val;
  });

  document.getElementById('pdAddCartBtn').addEventListener('click', () => {
    if (!requireLogin()) return;
    addToCart(p.id, selectedPdQty, selectedSize, selectedColor, selectedCustomSize);
    refreshHeaderState();
    showToast(`${p.name} ditambahkan ke keranjang.`, 'success');
    closeModal('productOverlay');
  });

  document.getElementById('pdBuyNowBtn').addEventListener('click', () => {
    if (!requireLogin()) return;
    addToCart(p.id, selectedPdQty, selectedSize, selectedColor, selectedCustomSize);
    refreshHeaderState();
    closeModal('productOverlay');
    if (renderCheckoutPage()) openModal('checkoutOverlay');
  });
}

function requireLogin() {
  const user = getCurrentUser();
  if (!user) {
    closeModal('productOverlay');
    closeModal('cartOverlay');
    openModal('loginOverlay');
    showToast('Silakan masuk dengan Gmail untuk melanjutkan.', 'error');
    return false;
  }
  return true;
}

/* ===================== CART PANEL ===================== */
function renderCartPanel() {
  const cart = getCart();
  const products = getProducts();
  const itemsContainer = document.getElementById('cartItemsContainer');
  const summaryContainer = document.getElementById('cartSummaryContainer');

  if (cart.length === 0) {
    itemsContainer.innerHTML = `<div class="empty-state"><div class="ico">🛍️</div><p>Keranjang Anda masih kosong.</p></div>`;
    summaryContainer.innerHTML = '';
    return;
  }

  itemsContainer.innerHTML = cart.map(c => {
    const p = products.find(pp => pp.id === c.productId);
    if (!p) return '';
    const unitPrice = getUnitPrice(p, c.isCustomSize);
    return `
      <div class="cart-item" data-pid="${c.productId}" data-size="${c.size}" data-color="${c.color || ''}" data-custom="${c.isCustomSize ? '1' : '0'}">
        <div class="cart-thumb"><img src="${p.image}" alt="${p.name}"></div>
        <div class="cart-item-info">
          <h5>${p.name}</h5>
          <div class="meta">Ukuran: ${c.size}${c.color ? ` • Warna: ${c.color}` : ''}${c.isCustomSize ? ' • Custom Ukuran' : ''}</div>
          <div class="meta" style="font-size:11px;">Maks. stok: ${p.stock}</div>
          <div class="qty-control">
            <button class="cart-qty-minus">−</button>
            <input type="text" class="cart-qty-input" value="${c.qty}" inputmode="numeric">
            <button class="cart-qty-plus">+</button>
          </div>
        </div>
        <div style="text-align:right;">
          <div class="price">${formatIDR(unitPrice * c.qty)}</div>
          <div class="cart-remove">Hapus</div>
        </div>
      </div>`;
  }).join('');

  const subtotal = cartSubtotal();
  summaryContainer.innerHTML = `
    <div class="cart-summary">
      <div class="summary-row"><span>Subtotal</span><span>${formatIDR(subtotal)}</span></div>
      <div class="summary-row"><span>Pengiriman</span><span>Dihitung saat checkout</span></div>
      <div class="summary-row total"><span>Total</span><span>${formatIDR(subtotal)}</span></div>
    </div>
    <button class="btn btn-block" id="checkoutBtn" style="margin-top:20px;">Lanjut ke Checkout</button>
  `;

  bindCartEvents();

  document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (!requireLogin()) return;
    closeModal('cartOverlay');
    if (renderCheckoutPage()) openModal('checkoutOverlay');
  });
}

function bindCartEvents() {
  const products = getProducts();
  document.querySelectorAll('.cart-item').forEach(item => {
    const pid = item.dataset.pid;
    const size = item.dataset.size;
    const color = item.dataset.color || null;
    const isCustomSize = item.dataset.custom === '1';
    const input = item.querySelector('.cart-qty-input');
    const p = products.find(pp => pp.id === pid);
    const stock = p ? p.stock : MAX_QTY;

    item.querySelector('.cart-qty-minus').addEventListener('click', () => {
      const newQty = clampQty(parseInt(input.value) - 1, stock);
      updateCartQty(pid, size, color, isCustomSize, newQty < 1 ? 1 : newQty);
      renderCartPanel();
      refreshHeaderState();
    });
    item.querySelector('.cart-qty-plus').addEventListener('click', () => {
      const current = parseInt(input.value) || 0;
      if (current >= stock) {
        showToast(`Stok produk ini hanya tersedia ${stock} unit.`, 'error');
        return;
      }
      const newQty = clampQty(current + 1, stock);
      updateCartQty(pid, size, color, isCustomSize, newQty);
      renderCartPanel();
      refreshHeaderState();
    });
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9]/g, '');
    });
    input.addEventListener('blur', () => {
      updateCartQty(pid, size, color, isCustomSize, clampQty(input.value || 1, stock));
      renderCartPanel();
      refreshHeaderState();
    });
    item.querySelector('.cart-remove').addEventListener('click', () => {
      removeFromCart(pid, size, color, isCustomSize);
      renderCartPanel();
      refreshHeaderState();
      showToast('Produk dihapus dari keranjang.');
    });
  });
}

/* ===================== WISHLIST PANEL ===================== */
function renderWishPanel() {
  const wishIds = getWishlist();
  const products = getProducts();
  const container = document.getElementById('wishItemsContainer');

  if (wishIds.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="ico">♡</div><p>Belum ada produk favorit.</p></div>`;
    return;
  }

  container.innerHTML = wishIds.map(id => {
    const p = products.find(pp => pp.id === id);
    if (!p) return '';
    return `
      <div class="cart-item" data-pid="${p.id}">
        <div class="cart-thumb"><img src="${p.image}" alt="${p.name}"></div>
        <div class="cart-item-info">
          <h5>${p.name}</h5>
          <div class="meta">${p.category}</div>
          <div class="price">${formatIDR(p.price)}</div>
        </div>
        <div style="text-align:right;display:flex;flex-direction:column;gap:8px;justify-content:center;">
          <button class="btn-sm btn btn-outline wish-view-btn" data-id="${p.id}">Lihat</button>
          <div class="cart-remove wish-remove-btn" data-id="${p.id}">Hapus</div>
        </div>
      </div>`;
  }).join('');

  container.querySelectorAll('.wish-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal('wishOverlay');
      openProductDetail(btn.dataset.id);
    });
  });
  container.querySelectorAll('.wish-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleWishlist(btn.dataset.id);
      renderWishPanel();
      refreshAllProductGrids();
    });
  });
}

/* ===================== CHECKOUT ===================== */
let selectedShipping = null;
let selectedAddressId = null;
let checkoutReturnAfterAddress = false;

function isProfileCompleteForCheckout(user) {
  return !!(user && user.name && user.name.trim().length >= 3 && user.phone && user.phone.trim().length > 0);
}

function renderCheckoutPage() {
  const cart = getCart();
  const products = getProducts();
  const user = getCurrentUser();

  if (cart.length === 0) {
    closeModal('checkoutOverlay');
    showToast('Keranjang Anda kosong.', 'error');
    return false;
  }

  if (!user) {
    closeModal('checkoutOverlay');
    openModal('loginOverlay');
    showToast('Silakan masuk dengan Gmail untuk melanjutkan checkout.', 'error');
    return false;
  }

  // Data profil (nama & telepon) wajib lengkap sebelum checkout — ambil dari My Account
  if (!isProfileCompleteForCheckout(user)) {
    closeModal('checkoutOverlay');
    openModal('accountOverlay');
    renderAccountPanel();
    switchAccountTab('profile');
    showToast('Lengkapi nama & nomor telepon Anda di My Account sebelum checkout.', 'error');
    return false;
  }

  // Alamat pengiriman wajib tersedia di buku alamat My Account
  const addressList = getAddresses();
  if (addressList.length === 0) {
    closeModal('checkoutOverlay');
    openModal('accountOverlay');
    renderAccountPanel();
    switchAccountTab('address');
    showToast('Tambahkan alamat pengiriman di My Account sebelum checkout.', 'error');
    return false;
  }

  const subtotal = cartSubtotal();
  selectedShipping = 'standar'; // pilihan default, pengguna tetap bisa mengganti
  selectedPayment = null;
  if (!addressList.some(a => a.id === selectedAddressId)) {
    const defaultAddr = addressList.find(a => a.isDefault) || addressList[0];
    selectedAddressId = defaultAddr.id;
  }
  let total = subtotal + getShippingOption(selectedShipping).fee;

  if (total > MAX_PRICE) {
    showToast('Total pesanan tidak boleh melebihi Rp 1.000.000.000.', 'error');
    closeModal('checkoutOverlay');
    return false;
  }

  const content = document.getElementById('checkoutContent');
  content.innerHTML = `
    <div class="panel-header">
      <span class="eyebrow">Selesaikan Pesanan</span>
      <h3>Checkout</h3>
    </div>

    <div class="checkout-grid">
      <div>
        <div class="checkout-box">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;">
            <h3 style="margin-bottom:0;">Informasi Penerima</h3>
            <span id="checkoutEditProfileBtn" style="font-size:12px;color:var(--charcoal);cursor:pointer;text-decoration:underline;text-underline-offset:3px;">Ubah di My Account</span>
          </div>
          <div class="pd-meta-list" style="border-top:none;padding-top:0;">
            <div><strong>Nama</strong><span>${user.name}</span></div>
            <div><strong>Telepon</strong><span>${user.phone}</span></div>
            <div><strong>Email</strong><span>${user.email}</span></div>
          </div>
        </div>

        <div class="checkout-box">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;">
            <h3 style="margin-bottom:0;">Alamat Pengiriman</h3>
            <span id="checkoutAddAddressBtn" style="font-size:12px;color:var(--charcoal);cursor:pointer;text-decoration:underline;text-underline-offset:3px;">+ Tambah Alamat Baru</span>
          </div>
          <div id="checkoutAddressList"></div>
        </div>

        <div class="checkout-box">
          <h3>Opsi Pengiriman</h3>
          <div id="shippingOptionList">
            ${SHIPPING_OPTIONS.map(opt => `
              <div class="pay-method shipping-method ${opt.id === selectedShipping ? 'active' : ''}" data-shipping="${opt.id}">
                <span class="pm-icon">${opt.id === 'hemat' ? '🐢' : opt.id === 'standar' ? '🚚' : '⚡'}</span>
                <div style="flex:1;">
                  <div class="pm-label">${opt.label} <span style="font-weight:400;color:#999;">— ${opt.eta}</span></div>
                  <div class="pm-sub">${opt.desc}</div>
                </div>
                <div style="font-size:14px;font-weight:500;white-space:nowrap;">${opt.fee === 0 ? 'Gratis' : formatIDR(opt.fee)}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="checkout-box">
          <h3>Metode Pembayaran</h3>
          <div class="pay-method payment-method" data-method="qris">
            <span class="pm-icon">▣</span>
            <div>
              <div class="pm-label">QRIS</div>
              <div class="pm-sub">Bayar dengan scan QRIS via e-wallet atau m-banking apapun</div>
            </div>
          </div>
          <div class="pay-detail-box" id="qrisDetailBox">
            <div class="qris-box"></div>
            <p style="font-size:13px;color:#888;">Scan kode QRIS di atas menggunakan aplikasi e-wallet atau m-banking Anda untuk membayar <strong id="qrisAmount"></strong>.</p>
          </div>

          <div class="pay-method payment-method" data-method="card">
            <span class="pm-icon">💳</span>
            <div>
              <div class="pm-label">Kartu Kredit</div>
              <div class="pm-sub">American Express, OCBC Premier Visa Infinite, HSBC Premier World Elite Mastercard</div>
            </div>
          </div>
          <div class="pay-detail-box" id="cardDetailBox">
            <div class="field">
              <label>Jenis Kartu</label>
              <select id="coCardType">
                <option value="">Pilih jenis kartu</option>
                <option value="American Express">American Express</option>
                <option value="OCBC Premier Visa Infinite">OCBC Premier Visa Infinite</option>
                <option value="HSBC Premier World Elite Mastercard">HSBC Premier World Elite Mastercard</option>
              </select>
              <div class="field-error">Pilih salah satu jenis kartu yang didukung.</div>
            </div>
            <div class="field">
              <label>Nomor Kartu</label>
              <input type="text" id="coCardNumber" inputmode="numeric" placeholder="Contoh: 4111 1111 1111 1111" maxlength="19">
              <div class="field-hint">Hanya angka, 13–19 digit sesuai jenis kartu.</div>
              <div class="field-error">Nomor kartu tidak valid.</div>
            </div>
            <div class="field-row">
              <div class="field">
                <label>Nama Pemegang Kartu</label>
                <input type="text" id="coCardName" placeholder="Contoh: Sarah Amelia">
                <div class="field-error">Nama pemegang kartu wajib diisi.</div>
              </div>
              <div class="field">
                <label>Masa Berlaku (MM/YY)</label>
                <input type="text" id="coCardExpiry" placeholder="Contoh: 09/29" maxlength="5">
                <div class="field-error">Format masa berlaku tidak valid (MM/YY).</div>
              </div>
            </div>
            <div class="field">
              <label>CVV</label>
              <input type="text" id="coCardCVV" inputmode="numeric" placeholder="Contoh: 123" maxlength="4">
              <div class="field-error">CVV tidak valid (3–4 digit).</div>
            </div>
            <p style="font-size:12px;color:#888;margin-top:4px;">Pembayaran kartu kredit hanya berlaku untuk American Express, OCBC Premier Visa Infinite, dan HSBC Premier World Elite Mastercard.</p>
          </div>

          <div class="pay-method payment-method" data-method="debit">
            <span class="pm-icon">💳</span>
            <div>
              <div class="pm-label">Kartu Debit</div>
              <div class="pm-sub">BCA Visa Debit, Mandiri Debit Visa, OCTO Debit, OCBC Debit, HSBC Debit Card, Maybank Debit, UOB Debit Card, Danamon Debit</div>
            </div>
          </div>
          <div class="pay-detail-box" id="debitDetailBox">
            <div class="field">
              <label>Jenis Kartu Debit</label>
              <select id="coDebitType">
                <option value="">Pilih jenis kartu debit</option>
                <option value="BCA Visa Debit">BCA Visa Debit</option>
                <option value="Mandiri Debit Visa">Mandiri Debit Visa</option>
                <option value="OCTO Debit">OCTO Debit</option>
                <option value="OCBC Debit">OCBC Debit</option>
                <option value="HSBC Debit Card">HSBC Debit Card</option>
                <option value="Maybank Debit">Maybank Debit</option>
                <option value="UOB Debit Card">UOB Debit Card</option>
                <option value="Danamon Debit">Danamon Debit</option>
              </select>
              <div class="field-error">Pilih salah satu jenis kartu debit yang didukung.</div>
            </div>
            <div class="field">
              <label>Nomor Kartu Debit</label>
              <input type="text" id="coDebitNumber" inputmode="numeric" placeholder="Contoh: 4123 4567 8901 2345" maxlength="16">
              <div class="field-hint">Hanya angka, maksimal 16 digit.</div>
              <div class="field-error">Nomor kartu debit tidak valid (maksimal 16 digit).</div>
            </div>
            <div class="field-row">
              <div class="field">
                <label>Nama Pemegang Kartu</label>
                <input type="text" id="coDebitName" placeholder="Contoh: Sarah Amelia">
                <div class="field-error">Nama pemegang kartu wajib diisi.</div>
              </div>
              <div class="field">
                <label>Masa Berlaku (MM/YY)</label>
                <input type="text" id="coDebitExpiry" placeholder="Contoh: 09/29" maxlength="5">
                <div class="field-error">Format masa berlaku tidak valid (MM/YY).</div>
              </div>
            </div>
            <div class="field">
              <label>CVV</label>
              <input type="text" id="coDebitCVV" inputmode="numeric" placeholder="Contoh: 123" maxlength="4">
              <div class="field-error">CVV tidak valid (3–4 digit).</div>
            </div>
            <p style="font-size:12px;color:#888;margin-top:4px;">Pembayaran kartu debit hanya berlaku untuk BCA Visa Debit, Mandiri Debit Visa, OCTO Debit, OCBC Debit, HSBC Debit Card, Maybank Debit, UOB Debit Card, dan Danamon Debit.</p>
          </div>

          <div class="field-error" id="paymentError" style="margin-top:10px;">Silakan pilih salah satu metode pembayaran.</div>
        </div>
      </div>

      <div>
        <div class="checkout-box">
          <h3>Ringkasan Pesanan</h3>
          <div id="checkoutItemsList"></div>
          <div class="cart-summary">
            <div class="summary-row"><span>Subtotal</span><span id="coSubtotalValue">${formatIDR(subtotal)}</span></div>
            <div class="summary-row"><span>Ongkos Kirim (<span id="coShippingLabel">${getShippingOption(selectedShipping).label}</span>)</span><span id="coShippingValue">${getShippingOption(selectedShipping).fee === 0 ? 'Gratis' : formatIDR(getShippingOption(selectedShipping).fee)}</span></div>
            <div class="summary-row total"><span>Total</span><span id="coTotalValue">${formatIDR(total)}</span></div>
          </div>
          <button class="btn btn-block" id="placeOrderBtn" style="margin-top:20px;">Buat Pesanan</button>
          <p style="font-size:11px;color:#999;text-align:center;margin-top:12px;">Dengan membuat pesanan, Anda menyetujui kebijakan toko Luxiana.</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('checkoutItemsList').innerHTML = cart.map(c => {
    const p = products.find(pp => pp.id === c.productId);
    if (!p) return '';
    const unitPrice = getUnitPrice(p, c.isCustomSize);
    return `
      <div style="display:flex;justify-content:space-between;font-size:13px;padding:10px 0;border-bottom:1px solid #DDD6C8;">
        <span>${p.name} <span style="color:#999;">(${c.size}${c.color ? ', ' + c.color : ''}${c.isCustomSize ? ', Custom' : ''}) ×${c.qty}</span></span>
        <span>${formatIDR(unitPrice * c.qty)}</span>
      </div>`;
  }).join('');

  renderCheckoutAddressList();

  document.getElementById('checkoutEditProfileBtn').addEventListener('click', () => {
    closeModal('checkoutOverlay');
    openModal('accountOverlay');
    renderAccountPanel();
    switchAccountTab('profile');
  });

  document.getElementById('checkoutAddAddressBtn').addEventListener('click', () => {
    checkoutReturnAfterAddress = true;
    closeModal('checkoutOverlay');
    openAddressForm(null);
  });

  document.getElementById('coCardNumber').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 19);
  });
  document.getElementById('coCardCVV').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
  });
  document.getElementById('coCardExpiry').addEventListener('input', (e) => {
    let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    e.target.value = v;
  });
  document.getElementById('coDebitNumber').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 16);
  });
  document.getElementById('coDebitCVV').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
  });
  document.getElementById('coDebitExpiry').addEventListener('input', (e) => {
    let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    e.target.value = v;
  });

  bindShippingOptionEvents(subtotal);
  bindPaymentMethodEvents(total);

  document.getElementById('placeOrderBtn').addEventListener('click', () => {
    const currentTotal = subtotal + getShippingOption(selectedShipping).fee;
    submitOrder(cart, products, subtotal, currentTotal);
  });

  return true;
}

function renderCheckoutAddressList() {
  const container = document.getElementById('checkoutAddressList');
  if (!container) return;
  const addressList = getAddresses();

  if (addressList.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="ico">📍</div><p>Belum ada alamat tersimpan.</p></div>`;
    return;
  }

  if (!addressList.some(a => a.id === selectedAddressId)) {
    selectedAddressId = (addressList.find(a => a.isDefault) || addressList[0]).id;
  }

  container.innerHTML = addressList.map(a => `
    <div class="pay-method address-method ${a.id === selectedAddressId ? 'active' : ''}" data-address-id="${a.id}" style="align-items:flex-start;">
      <span class="pm-icon">📍</span>
      <div style="flex:1;">
        <div class="pm-label">${a.label} ${a.isDefault ? '<span class="address-default-badge" style="margin-left:8px;">Utama</span>' : ''}</div>
        <div class="pm-sub" style="margin-top:4px;">${a.recipientName} • ${a.phone}</div>
        <div class="pm-sub">${a.address}, ${a.city}, ${a.province} ${a.postal}</div>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.address-method').forEach(el => {
    el.addEventListener('click', () => {
      selectedAddressId = el.dataset.addressId;
      container.querySelectorAll('.address-method').forEach(m => m.classList.remove('active'));
      el.classList.add('active');
    });
  });
}

function bindShippingOptionEvents(subtotal) {
  document.querySelectorAll('.shipping-method').forEach(method => {
    method.addEventListener('click', () => {
      document.querySelectorAll('.shipping-method').forEach(m => m.classList.remove('active'));
      method.classList.add('active');
      selectedShipping = method.dataset.shipping;
      recalcCheckoutTotals(subtotal);
    });
  });
}

function recalcCheckoutTotals(subtotal) {
  const opt = getShippingOption(selectedShipping);
  const total = subtotal + opt.fee;
  document.getElementById('coShippingLabel').textContent = opt.label;
  document.getElementById('coShippingValue').textContent = opt.fee === 0 ? 'Gratis' : formatIDR(opt.fee);
  document.getElementById('coTotalValue').textContent = formatIDR(total);
  const qrisAmount = document.getElementById('qrisAmount');
  if (qrisAmount) qrisAmount.textContent = formatIDR(total);
}

function bindPaymentMethodEvents(total) {
  document.getElementById('qrisAmount').textContent = formatIDR(total);

  document.querySelectorAll('.payment-method').forEach(method => {
    method.addEventListener('click', () => {
      document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
      method.classList.add('active');
      selectedPayment = method.dataset.method;

      document.getElementById('qrisDetailBox').classList.toggle('show', selectedPayment === 'qris');
      document.getElementById('cardDetailBox').classList.toggle('show', selectedPayment === 'card');
      document.getElementById('debitDetailBox').classList.toggle('show', selectedPayment === 'debit');
      document.getElementById('paymentError').style.display = 'none';
    });
  });
}

function validateField(id, condition) {
  const field = document.getElementById(id).closest('.field');
  if (!condition) {
    field.classList.add('has-error');
    return false;
  }
  field.classList.remove('has-error');
  return true;
}

async function submitOrder(cart, products, subtotal, total) {
  const user = getCurrentUser();
  let valid = true;

  if (!isProfileCompleteForCheckout(user)) {
    showToast('Profil Anda belum lengkap. Silakan lengkapi di My Account.', 'error');
    closeModal('checkoutOverlay');
    openModal('accountOverlay');
    renderAccountPanel();
    switchAccountTab('profile');
    return;
  }

  const selectedAddr = getAddresses().find(a => a.id === selectedAddressId);
  const addressListEl = document.getElementById('checkoutAddressList');
  if (!selectedAddr) {
    if (addressListEl) addressListEl.closest('.checkout-box').classList.add('has-error');
    showToast('Silakan pilih alamat pengiriman.', 'error');
    valid = false;
  } else if (addressListEl) {
    addressListEl.closest('.checkout-box').classList.remove('has-error');
  }

  const ALLOWED_CARDS = ['American Express', 'OCBC Premier Visa Infinite', 'HSBC Premier World Elite Mastercard'];
  const ALLOWED_DEBIT_CARDS = ['BCA Visa Debit', 'Mandiri Debit Visa', 'OCTO Debit', 'OCBC Debit', 'HSBC Debit Card', 'Maybank Debit', 'UOB Debit Card', 'Danamon Debit'];
  let cardType = '', cardNumber = '', cardName = '', cardExpiry = '', cardCVV = '';
  let debitType = '', debitNumber = '', debitName = '', debitExpiry = '', debitCVV = '';

  const paymentError = document.getElementById('paymentError');
  if (!selectedPayment) {
    paymentError.style.display = 'block';
    valid = false;
  } else {
    paymentError.style.display = 'none';
  }

  if (selectedPayment === 'card') {
    cardType = document.getElementById('coCardType').value;
    cardNumber = document.getElementById('coCardNumber').value.trim();
    cardName = document.getElementById('coCardName').value.trim();
    cardExpiry = document.getElementById('coCardExpiry').value.trim();
    cardCVV = document.getElementById('coCardCVV').value.trim();

    valid = validateField('coCardType', ALLOWED_CARDS.includes(cardType)) && valid;
    valid = validateField('coCardNumber', /^[0-9]{13,19}$/.test(cardNumber)) && valid;
    valid = validateField('coCardName', cardName.length >= 2) && valid;
    valid = validateField('coCardExpiry', /^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(cardExpiry)) && valid;
    valid = validateField('coCardCVV', /^[0-9]{3,4}$/.test(cardCVV)) && valid;
  }

  if (selectedPayment === 'debit') {
    debitType = document.getElementById('coDebitType').value;
    debitNumber = document.getElementById('coDebitNumber').value.trim();
    debitName = document.getElementById('coDebitName').value.trim();
    debitExpiry = document.getElementById('coDebitExpiry').value.trim();
    debitCVV = document.getElementById('coDebitCVV').value.trim();

    valid = validateField('coDebitType', ALLOWED_DEBIT_CARDS.includes(debitType)) && valid;
    valid = validateField('coDebitNumber', /^[0-9]{1,16}$/.test(debitNumber) && debitNumber.length > 0) && valid;
    valid = validateField('coDebitName', debitName.length >= 2) && valid;
    valid = validateField('coDebitExpiry', /^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(debitExpiry)) && valid;
    valid = validateField('coDebitCVV', /^[0-9]{3,4}$/.test(debitCVV)) && valid;
  }

  if (total > MAX_PRICE) {
    showToast('Total pesanan tidak boleh melebihi Rp 1.000.000.000.', 'error');
    valid = false;
  }

  if (!valid) {
    showToast('Mohon lengkapi semua data dengan benar.', 'error');
    document.querySelector('.field.has-error, .checkout-box.has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const fullAddress = `${selectedAddr.address}, ${selectedAddr.city}, ${selectedAddr.province} ${selectedAddr.postal}`;

  const orderItems = cart.map(c => {
    const p = products.find(pp => pp.id === c.productId);
    return { productId: p.id, name: p.name, price: getUnitPrice(p, c.isCustomSize), qty: c.qty, size: c.size, color: c.color || null, isCustomSize: !!c.isCustomSize };
  });

  let paymentMethodLabel = 'QRIS';
  if (selectedPayment === 'card') paymentMethodLabel = `Kartu Kredit (${cardType})`;
  else if (selectedPayment === 'debit') paymentMethodLabel = `Kartu Debit (${debitType})`;

  const placeOrderBtn = document.getElementById('placeOrderBtn');
  if (placeOrderBtn) placeOrderBtn.disabled = true;

  const order = await createOrder({
    userId: user.id,
    userEmail: user.email,
    items: orderItems,
    address: fullAddress,
    contact: user.phone,
    recipientName: user.name,
    paymentMethod: paymentMethodLabel,
    shippingMethod: selectedShipping,
    subtotal,
    shippingFee: getShippingOption(selectedShipping).fee,
    total
  });

  if (placeOrderBtn) placeOrderBtn.disabled = false;

  if (!order) {
    // createOrder sudah menampilkan toast error; batalkan proses checkout, jangan kosongkan keranjang.
    return;
  }

  clearCart();
  refreshHeaderState();
  selectedPayment = null;
  selectedShipping = null;
  selectedAddressId = null;
  closeModal('checkoutOverlay');

  document.getElementById('successOrderId').textContent = order.id;
  openModal('successOverlay');
}

/* ===================== ORDERS PANEL (RIWAYAT PESANAN CUSTOMER) ===================== */
function openOrdersPanel() {
  const user = getCurrentUser();
  if (!user) {
    openModal('loginOverlay');
    showToast('Silakan masuk untuk melihat pesanan Anda.', 'error');
    return;
  }
  renderOrdersList();
  openModal('ordersOverlay');
}

function renderOrdersList() {
  const user = getCurrentUser();
  const orders = getOrdersByUser(user.id);
  const container = document.getElementById('ordersListContainer');

  if (orders.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="ico">📦</div><p>Anda belum memiliki pesanan.</p></div>`;
    return;
  }

  const statusClassMap = {
    'Pending': 'status-pending',
    'Diproses': 'status-processed',
    'Dikirim': 'status-shipped',
    'Selesai': 'status-delivered',
    'Dibatalkan': 'status-cancelled'
  };

  container.innerHTML = orders.map(o => `
    <div class="order-card">
      <div class="order-card-top">
        <div>
          <div class="order-id">${o.id}</div>
          <div class="order-date">${formatDate(o.createdAt)}</div>
        </div>
        <span class="status-badge ${statusClassMap[o.status]}">${o.status}</span>
      </div>
      <div class="order-items-row">
        ${o.items.map(i => `<div class="order-mini-thumb" title="${i.name} ×${i.qty}"><img src="${getProductById(i.productId)?.image || DEFAULT_PRODUCT_IMAGE}" alt="${i.name}"></div>`).join('')}
      </div>
      <div class="order-card-bottom">
        <span class="order-total">${formatIDR(o.total)}</span>
        <button class="btn btn-sm btn-outline track-this-order" data-id="${o.id}">Lacak Pengiriman</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.track-this-order').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal('ordersOverlay');
      document.getElementById('trackOrderInput').value = btn.dataset.id;
      handleTrackOrder();
      openModal('trackOverlay');
    });
  });
}

/* ===================== TRACK ORDER ===================== */
function handleTrackOrder() {
  const input = document.getElementById('trackOrderInput');
  const orderId = input.value.trim().toUpperCase();
  const container = document.getElementById('trackResultContainer');
  renderTrackResultInto(container, orderId);
}

function renderTrackResultInto(container, orderId) {
  if (!orderId) {
    showToast('Masukkan nomor pesanan.', 'error');
    return;
  }

  const order = getOrderById(orderId);
  if (!order) {
    container.innerHTML = `<div class="empty-state"><div class="ico">✕</div><p>Nomor pesanan tidak ditemukan. Periksa kembali nomor pesanan Anda.</p></div>`;
    return;
  }

  if (order.status === 'Selesai') {
    container.innerHTML = `
      <div class="track-result">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <h3 style="font-size:20px;">${order.id}</h3>
          <span class="status-badge status-delivered">Selesai</span>
        </div>
        <div class="empty-state">
          <div class="ico">✓</div>
          <p>Selesai</p>
        </div>
      </div>
    `;
    return;
  }

  const flow = ORDER_STATUS_FLOW;
  const currentIndex = flow.indexOf(order.status);
  const isCancelled = order.status === 'Dibatalkan';

  const stepDescriptions = {
    'Pending': 'Pesanan diterima, menunggu konfirmasi pembayaran.',
    'Diproses': 'Pembayaran terverifikasi, pesanan sedang disiapkan oleh tim kami.',
    'Dikirim': 'Pesanan telah diserahkan ke kurir dan sedang dalam pengiriman.',
    'Selesai': 'Pesanan telah diterima oleh pelanggan. Terima kasih telah berbelanja di Luxiana.'
  };

  container.innerHTML = `
    <div class="track-result">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <h3 style="font-size:20px;">${order.id}</h3>
        <span class="status-badge ${isCancelled ? 'status-cancelled' : 'status-' + (order.status === 'Pending' ? 'pending' : order.status === 'Diproses' ? 'processed' : order.status === 'Dikirim' ? 'shipped' : 'delivered')}">${order.status}</span>
      </div>
      <p style="font-size:13px;color:#888;margin-bottom:20px;">Dipesan pada ${formatDate(order.createdAt)} • Dikirim ke ${order.address}</p>
      <p style="font-size:13px;color:#888;margin-bottom:20px;">Pengiriman: <strong style="color:#161412;">${getShippingOption(order.shippingMethod).label}</strong> (${getShippingOption(order.shippingMethod).eta})</p>

      <div class="track-timeline">
        ${isCancelled ? `
          <div class="track-step done">
            <div class="track-dot">✕</div>
            <div><h5>Dibatalkan</h5><span>${formatDate(order.timeline[order.timeline.length-1].date)}</span><p class="desc-t">${order.timeline[order.timeline.length-1].note}</p></div>
          </div>
        ` : flow.map((status, idx) => {
          const stepData = order.timeline.find(t => t.status === status);
          const done = idx < currentIndex;
          const current = idx === currentIndex;
          return `
            <div class="track-step ${done ? 'done' : ''} ${current ? 'current' : ''}">
              <div class="track-dot">${done ? '✓' : idx + 1}</div>
              <div>
                <h5>${status}</h5>
                <span>${stepData ? formatDate(stepData.date) : 'Menunggu'}</span>
                <p class="desc-t">${stepData ? stepData.note : stepDescriptions[status]}</p>
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>
  `;
}