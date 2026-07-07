/* ===================== LUXIANA — DATA & SHARED UTILITIES ===================== */
/* Semua data disimpan di localStorage agar persist dan bisa dibaca admin & customer */

const LUX_KEYS = {
  PRODUCTS: 'lux_products',
  USERS: 'lux_users',
  SESSION: 'lux_session',
  ORDERS: 'lux_orders',
  CART: 'lux_cart_',
  WISHLIST: 'lux_wish_',
  ADMIN_SESSION: 'lux_admin_session',
  ADDRESSES: 'lux_addr_',
  REFUNDS: 'lux_refunds'
};

const MAX_PRICE = 100000000; // 100 juta
const MAX_QTY = 1000;
const MAX_DISCOUNT_PERCENT = 80; // diskon maksimal yang boleh diberikan admin
const CUSTOM_SIZE_CATEGORIES = ['Outerwear', 'Bags', 'Dresses', 'Suits']; // kategori yang boleh punya opsi warna & custom ukuran (baju, celana/suit, tas)
const DEFAULT_PRODUCT_IMAGE = '';

const ADMIN_CREDENTIAL = { email: 'admin@gmail.com', password: '12345' };

/* ---------- Data Provinsi & Kabupaten/Kota (Indonesia) ---------- */
/* Mencakup provinsi-provinsi utama beserta kabupaten/kota besarnya, dipakai untuk searchable dropdown pada form alamat. */
const PROVINCE_CITY_DATA = {
  'DKI Jakarta': ['Jakarta Pusat', 'Jakarta Utara', 'Jakarta Barat', 'Jakarta Selatan', 'Jakarta Timur', 'Kepulauan Seribu'],
  'Jawa Barat': ['Bandung', 'Kabupaten Bandung', 'Bekasi', 'Kabupaten Bekasi', 'Bogor', 'Kabupaten Bogor', 'Depok', 'Cimahi', 'Sukabumi', 'Kabupaten Sukabumi', 'Cirebon', 'Kabupaten Cirebon', 'Karawang', 'Tasikmalaya', 'Garut'],
  'Jawa Tengah': ['Semarang', 'Kabupaten Semarang', 'Surakarta (Solo)', 'Magelang', 'Kabupaten Magelang', 'Salatiga', 'Pekalongan', 'Tegal', 'Kabupaten Tegal', 'Kudus', 'Klaten', 'Purwokerto (Banyumas)', 'Sukoharjo'],
  'DI Yogyakarta': ['Kota Yogyakarta', 'Sleman', 'Bantul', 'Kulon Progo', 'Gunungkidul'],
  'Jawa Timur': ['Surabaya', 'Malang', 'Kabupaten Malang', 'Kediri', 'Kabupaten Kediri', 'Sidoarjo', 'Gresik', 'Mojokerto', 'Madiun', 'Jember', 'Banyuwangi', 'Pasuruan', 'Probolinggo'],
  'Banten': ['Serang', 'Kabupaten Serang', 'Tangerang', 'Kabupaten Tangerang', 'Tangerang Selatan', 'Cilegon', 'Pandeglang', 'Lebak'],
  'Bali': ['Denpasar', 'Badung', 'Gianyar', 'Tabanan', 'Buleleng', 'Klungkung', 'Karangasem', 'Bangli', 'Jembrana'],
  'Aceh': ['Banda Aceh', 'Aceh Besar', 'Langsa', 'Lhokseumawe', 'Sabang', 'Aceh Utara', 'Aceh Barat', 'Aceh Tengah'],
  'Sumatera Utara': ['Medan', 'Binjai', 'Pematangsiantar', 'Tebing Tinggi', 'Deli Serdang', 'Simalungun', 'Karo', 'Padang Sidempuan', 'Nias'],
  'Sumatera Barat': ['Padang', 'Bukittinggi', 'Payakumbuh', 'Padang Panjang', 'Solok', 'Sawahlunto', 'Pariaman', 'Agam'],
  'Riau': ['Pekanbaru', 'Dumai', 'Kampar', 'Bengkalis', 'Indragiri Hulu', 'Rokan Hulu', 'Siak'],
  'Kepulauan Riau': ['Batam', 'Tanjungpinang', 'Bintan', 'Karimun', 'Natuna', 'Lingga'],
  'Jambi': ['Kota Jambi', 'Sungai Penuh', 'Muaro Jambi', 'Batanghari', 'Bungo', 'Tebo'],
  'Sumatera Selatan': ['Palembang', 'Prabumulih', 'Lubuklinggau', 'Pagar Alam', 'Ogan Komering Ilir', 'Muara Enim', 'Musi Banyuasin'],
  'Bengkulu': ['Kota Bengkulu', 'Rejang Lebong', 'Bengkulu Utara', 'Bengkulu Selatan', 'Kepahiang'],
  'Lampung': ['Bandar Lampung', 'Metro', 'Lampung Selatan', 'Lampung Tengah', 'Lampung Timur', 'Tanggamus'],
  'Kepulauan Bangka Belitung': ['Pangkalpinang', 'Bangka', 'Bangka Barat', 'Belitung', 'Belitung Timur'],
  'Kalimantan Barat': ['Pontianak', 'Singkawang', 'Kubu Raya', 'Sambas', 'Ketapang', 'Sintang'],
  'Kalimantan Tengah': ['Palangka Raya', 'Kotawaringin Barat', 'Kotawaringin Timur', 'Kapuas', 'Barito Selatan'],
  'Kalimantan Selatan': ['Banjarmasin', 'Banjarbaru', 'Banjar', 'Kotabaru', 'Hulu Sungai Selatan', 'Tanah Laut'],
  'Kalimantan Timur': ['Samarinda', 'Balikpapan', 'Bontang', 'Kutai Kartanegara', 'Kutai Timur', 'Berau', 'Paser'],
  'Kalimantan Utara': ['Tarakan', 'Bulungan', 'Nunukan', 'Malinau', 'Tana Tidung'],
  'Sulawesi Utara': ['Manado', 'Bitung', 'Tomohon', 'Kotamobagu', 'Minahasa', 'Minahasa Utara'],
  'Sulawesi Tengah': ['Palu', 'Poso', 'Banggai', 'Donggala', 'Morowali', 'Toli-Toli'],
  'Sulawesi Selatan': ['Makassar', 'Parepare', 'Palopo', 'Gowa', 'Maros', 'Bone', 'Bulukumba'],
  'Sulawesi Tenggara': ['Kendari', 'Baubau', 'Kolaka', 'Konawe', 'Muna'],
  'Sulawesi Barat': ['Mamuju', 'Majene', 'Polewali Mandar', 'Mamasa'],
  'Gorontalo': ['Kota Gorontalo', 'Gorontalo (Kabupaten)', 'Boalemo', 'Bone Bolango', 'Pohuwato'],
  'Nusa Tenggara Barat': ['Mataram', 'Bima', 'Kabupaten Bima', 'Lombok Barat', 'Lombok Tengah', 'Lombok Timur', 'Sumbawa'],
  'Nusa Tenggara Timur': ['Kupang', 'Kabupaten Kupang', 'Ende', 'Sikka (Maumere)', 'Manggarai', 'Sumba Timur', 'Belu'],
  'Maluku': ['Ambon', 'Tual', 'Maluku Tengah', 'Maluku Tenggara', 'Buru'],
  'Maluku Utara': ['Ternate', 'Tidore Kepulauan', 'Halmahera Barat', 'Halmahera Utara', 'Halmahera Selatan'],
  'Papua': ['Jayapura', 'Kabupaten Jayapura', 'Biak Numfor', 'Merauke', 'Nabire', 'Mimika (Timika)'],
  'Papua Barat': ['Manokwari', 'Sorong', 'Kabupaten Sorong', 'Fakfak', 'Kaimana', 'Raja Ampat']
};

const PROVINCE_LIST = Object.keys(PROVINCE_CITY_DATA);

/* ---------- Produk Default (Seed) ---------- */
const DEFAULT_PRODUCTS = [
  
    {
    id: 'P002', name: 'Luna Polka Dot Midi Dress', category: 'Dresses',
    price: 3999000, oldPrice: 28900000, stock: 8, image: '',
    desc: 'A timeless polka dot midi dress crafted from luxurious silk crepe. Designed with an elegant silhouette and refined details, it offers effortless sophistication for both daytime occasions and evening events.',
    sizes: ['S','M','L'], isNew: false, sold: 41,
    material: '100% Silk', origin: 'Made in Indonesia', care: 'Dry Clean Only',
    colors: ['Black', 'Navy', 'White'], allowCustomSize: true, customSizeFee: 1500000,
    discountPercent: 10
  },
  {
    id: 'P003', name: 'Monroe Midi Dress', category: 'Dresses',
    price: 32000000, oldPrice: null, stock: 6, image: '',
    desc: 'The Monroe Midi Dress is a timeless expression of elegance, crafted in a pristine white silhouette that embodies effortless sophistication. Designed with a flattering fit and refined tailoring, this dress offers both comfort and grace for formal occasions, intimate celebrations, or elegant daytime wear.',
    sizes: ['S','M','L'], isNew: true, sold: 17,
    material: 'Premium Crepe (95% Polyester, 5% Spandex)', origin: 'Made in Indonesia', care: 'Dry Clean Only',
    colors: ['Black', 'White', 'Burgundy'], allowCustomSize: true, customSizeFee: 1500000,
    discountPercent: 0
  },
  {
    id: 'P004', name: 'Vesper Pearl Clutch', category: 'Bags',
    price: 15750000, oldPrice: null, stock: 15, image: '',
    desc: 'Clutch satin dengan aplikasi mutiara air tawar asli, sempurna untuk acara formal malam.',
    sizes: ['One Size'], isNew: false, sold: 33,
    material: 'Silk Satin & Pearl', origin: 'Made in Italy', care: 'Spot Clean Only'
  },
  {
    id: 'P005', name: 'Lumière Crystal Heels', category: 'Shoes',
    price: 12300000, oldPrice: 14500000, stock: 20, image: 'https://placehold.co/1200x1600/EFEAE1/9C8048?text=Lumiere+Crystal+Heels',
    desc: 'Heels satin dengan hiasan kristal Swarovski. Tinggi hak 9.5cm dengan sol anti slip premium.',
    sizes: ['36','37','38','39','40'], isNew: false, sold: 56,
    material: 'Satin & Crystal', origin: 'Made in Italy', care: 'Store in Box',
    colors: [], allowCustomSize: false, customSizeFee: 0, discountPercent: 15
  },
  {
    id: 'P006', name: 'Marchetti Oxford Loafer', category: 'Shoes',
    price: 9800000, oldPrice: null, stock: 18, image: 'https://placehold.co/1200x1600/EFEAE1/9C8048?text=Marchetti+Oxford+Loafer',
    desc: 'Loafer kulit kelas atas dengan finishing patina tangan, sol kulit yang dapat diganti.',
    sizes: ['39','40','41','42','43'], isNew: true, sold: 29,
    material: 'Patina Leather', origin: 'Made in Italy', care: 'Shoe Polish Recommended'
  },
  {
    id: 'P007', name: 'Seraphine Evening Gown', category: 'Dresses',
    price: 45000000, oldPrice: null, stock: 5, image: 'https://placehold.co/1200x1600/EFEAE1/9C8048?text=Seraphine+Evening+Gown',
    desc: 'Gown sutra dengan detail draping tangan, dipotong khusus untuk siluet yang jatuh sempurna.',
    sizes: ['XS','S','M','L'], isNew: true, sold: 9,
    material: '100% Silk', origin: 'Made in France', care: 'Dry Clean Only',
    colors: ['Emerald', 'Hitam', 'Champagne'], allowCustomSize: true, customSizeFee: 3000000,
    discountPercent: 0, isLimited: true
  },
  {
    id: 'P008', name: 'Aria Linen Midi Dress', category: 'Dresses',
    price: 8900000, oldPrice: null, stock: 22, image: 'https://placehold.co/1200x1600/EFEAE1/9C8048?text=Aria+Linen+Midi+Dress',
    desc: 'Midi dress linen premium dengan potongan minimalis, ideal untuk gaya sehari-hari yang chic.',
    sizes: ['XS','S','M','L','XL'], isNew: false, sold: 48,
    material: '100% Linen', origin: 'Made in Portugal', care: 'Machine Wash Cold'
  },
  {
    id: 'P009', name: 'Cartouche Gold Necklace', category: 'Jewelry',
    price: 28500000, oldPrice: null, stock: 10, image: 'https://placehold.co/1200x1600/EFEAE1/9C8048?text=Cartouche+Gold+Necklace',
    desc: 'Kalung emas 18K dengan liontin signature Luxiana, dilapis rhodium untuk kilau tahan lama.',
    sizes: ['One Size'], isNew: false, sold: 14,
    material: '18K Gold', origin: 'Made in Switzerland', care: 'Polish Cloth Only'
  },
  {
    id: 'P010', name: 'Solene Diamond Earrings', category: 'Jewelry',
    price: 52000000, oldPrice: null, stock: 4, image: 'https://placehold.co/1200x1600/EFEAE1/9C8048?text=Solene+Diamond+Earrings',
    desc: 'Anting berlian potongan brilliant 0.5 carat per sisi dengan setting emas putih 18K.',
    sizes: ['One Size'], isNew: true, sold: 6, isLimited: true,
    material: '18K White Gold & Diamond', origin: 'Made in Switzerland', care: 'Professional Cleaning'
  },
  {
    id: 'P011', name: 'Brennan Wool Tailored Suit', category: 'Suits',
    price: 21000000, oldPrice: 23500000, stock: 9, image: 'https://placehold.co/1200x1600/EFEAE1/9C8048?text=Brennan+Tailored+Suit',
    desc: 'Setelan jas wol Super 150s dengan jahitan tangan di setiap kancing dan kerah.',
    sizes: ['46','48','50','52'], isNew: false, sold: 19,
    material: 'Super 150s Wool', origin: 'Made in Italy', care: 'Dry Clean Only',
    colors: ['Navy', 'Hitam', 'Abu Charcoal'], allowCustomSize: true, customSizeFee: 2000000,
    discountPercent: 0
  },
  {
    id: 'P012', name: 'Imperial Silk Scarf', category: 'Accessories',
    price: 6500000, oldPrice: null, stock: 30, image: 'https://placehold.co/1200x1600/EFEAE1/9C8048?text=Imperial+Silk+Scarf',
    desc: 'Scarf sutra twill dengan motif eksklusif Luxiana, dicetak dengan teknik screen printing 18 warna.',
    sizes: ['One Size'], isNew: false, sold: 67,
    material: '100% Silk Twill', origin: 'Made in France', care: 'Hand Wash Cold'
  }
];

/* ---------- Init Storage ---------- */
/* Catatan: produk, pesanan, & refund sekarang diambil dari database
   (lihat loadProductsCache & loadOrdersCache di bawah), jadi tidak lagi
   di-seed ke localStorage. Hanya user (auth ringan) yang masih localStorage. */
function luxInit() {
  if (!localStorage.getItem(LUX_KEYS.USERS)) {
    localStorage.setItem(LUX_KEYS.USERS, JSON.stringify([]));
  }
}
luxInit();

/* ---------- Product Helpers (sekarang bersumber dari database via API) ---------- */
/* ⚙️ SATU-SATUNYA BARIS YANG PERLU DIGANTI KALAU BACKEND SUDAH DI-DEPLOY ONLINE.
   Contoh setelah deploy ke Render: 'https://luxiana-backend.onrender.com' */
const LUX_API_ORIGIN = 'https://luxianabackend-u9v7fu22.b4a.run';

const PRODUCTS_API_URL = `${LUX_API_ORIGIN}/api/products`;
let productsCache = [];

/* Dipanggil sekali di awal (DOMContentLoaded) sebelum halaman dirender,
   supaya getProducts() di bawah selalu punya data terbaru dari database. */
async function loadProductsCache() {
  try {
    const res = await fetch(PRODUCTS_API_URL);
    if (!res.ok) throw new Error('Gagal memuat produk dari server.');
    productsCache = await res.json();
  } catch (err) {
    console.error('Gagal memuat produk dari server:', err.message);
    showToast('Tidak bisa terhubung ke server produk. Pastikan backend sedang berjalan.', 'error');
    productsCache = [];
  }
  return productsCache;
}

function getProducts() {
  return productsCache;
}
/* Update cache lokal saja (dipakai misalnya setelah stok dikurangi saat checkout).
   Perubahan yang perlu permanen ke database dikirim terpisah lewat persistProductStock(). */
function saveProducts(products) {
  productsCache = products;
}
function getProductById(id) {
  return productsCache.find(p => p.id === id);
}
/* Kirim perubahan stok & jumlah terjual ke database (dipanggil setelah checkout). */
async function persistProductStock(product) {
  try {
    await fetch(`${PRODUCTS_API_URL}/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: product.stock, sold: product.sold })
    });
  } catch (err) {
    console.error(`Gagal menyimpan stok produk ${product.id} ke server:`, err.message);
  }
}

/* ---------- User / Auth Helpers ---------- */
function getUsers() {
  return JSON.parse(localStorage.getItem(LUX_KEYS.USERS) || '[]');
}
function saveUsers(users) {
  localStorage.setItem(LUX_KEYS.USERS, JSON.stringify(users));
}
function isValidGmail(email) {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email.trim().toLowerCase());
}
function loginWithGmail(email) {
  email = email.trim().toLowerCase();
  if (!isValidGmail(email)) return { ok: false, msg: 'Email harus menggunakan format @gmail.com yang valid.' };
  let users = getUsers();
  let user = users.find(u => u.email === email);
  if (!user) {
    user = { id: 'U' + Date.now(), email, name: email.split('@')[0], joined: new Date().toISOString() };
    users.push(user);
    saveUsers(users);
  }
  localStorage.setItem(LUX_KEYS.SESSION, JSON.stringify(user));
  return { ok: true, user };
}
function getCurrentUser() {
  const s = localStorage.getItem(LUX_KEYS.SESSION);
  return s ? JSON.parse(s) : null;
}
function logoutUser() {
  localStorage.removeItem(LUX_KEYS.SESSION);
}
function updateUserProfile(userId, data) {
  let users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  if (typeof data.name === 'string') user.name = data.name.trim();
  if (typeof data.phone === 'string') user.phone = data.phone.trim();
  if (typeof data.gender === 'string') user.gender = data.gender;
  if (typeof data.birthdate === 'string') user.birthdate = data.birthdate;
  saveUsers(users);
  const current = getCurrentUser();
  if (current && current.id === userId) {
    localStorage.setItem(LUX_KEYS.SESSION, JSON.stringify(user));
  }
  return user;
}

/* ---------- Admin Auth ---------- */
function loginAdmin(email, password) {
  if (email.trim().toLowerCase() === ADMIN_CREDENTIAL.email && password === ADMIN_CREDENTIAL.password) {
    localStorage.setItem(LUX_KEYS.ADMIN_SESSION, JSON.stringify({ email, loginAt: new Date().toISOString() }));
    return true;
  }
  return false;
}
function getAdminSession() {
  const s = localStorage.getItem(LUX_KEYS.ADMIN_SESSION);
  return s ? JSON.parse(s) : null;
}
function logoutAdmin() {
  localStorage.removeItem(LUX_KEYS.ADMIN_SESSION);
}

/* ---------- Cart Helpers (per-user) ---------- */
function cartKey() {
  const u = getCurrentUser();
  return LUX_KEYS.CART + (u ? u.id : 'guest');
}
function getCart() {
  return JSON.parse(localStorage.getItem(cartKey()) || '[]');
}
function saveCart(cart) {
  localStorage.setItem(cartKey(), JSON.stringify(cart));
}
function addToCart(productId, qty, size, color, isCustomSize) {
  const product = getProductById(productId);
  const stock = product ? product.stock : MAX_QTY;
  qty = clampQty(qty, stock);
  color = color || null;
  isCustomSize = !!isCustomSize;
  let cart = getCart();
  const existing = cart.find(c => c.productId === productId && c.size === size && c.color === color && !!c.isCustomSize === isCustomSize);
  if (existing) {
    existing.qty = clampQty(existing.qty + qty, stock);
  } else {
    if (qty < 1) return cart; // stok habis
    cart.push({ productId, qty, size, color, isCustomSize });
  }
  saveCart(cart);
  return cart;
}
function updateCartQty(productId, size, color, isCustomSize, qty) {
  let cart = getCart();
  const item = cart.find(c => c.productId === productId && c.size === size && c.color === color && !!c.isCustomSize === !!isCustomSize);
  if (item) {
    const product = getProductById(productId);
    const stock = product ? product.stock : MAX_QTY;
    item.qty = clampQty(qty, stock);
    if (item.qty < 1) item.qty = 1;
  }
  saveCart(cart);
  return cart;
}
function removeFromCart(productId, size, color, isCustomSize) {
  let cart = getCart().filter(c => !(c.productId === productId && c.size === size && c.color === color && !!c.isCustomSize === !!isCustomSize));
  saveCart(cart);
  return cart;
}
function clearCart() {
  saveCart([]);
}
function clampQty(qty, maxStock) {
  qty = parseInt(qty) || 1;
  if (qty < 1) qty = 1;
  let cap = MAX_QTY;
  if (typeof maxStock === 'number' && maxStock >= 0) {
    cap = Math.min(MAX_QTY, maxStock);
  }
  if (cap < 1) cap = 0; // produk habis, tidak bisa ditambahkan
  if (qty > cap) qty = cap;
  return qty;
}
function cartTotalItems() {
  return getCart().reduce((sum, c) => sum + c.qty, 0);
}
function cartSubtotal() {
  const products = getProducts();
  return getCart().reduce((sum, c) => {
    const p = products.find(pp => pp.id === c.productId);
    return p ? sum + (getUnitPrice(p, c.isCustomSize) * c.qty) : sum;
  }, 0);
}

/* ---------- Wishlist ---------- */
function wishKey() {
  const u = getCurrentUser();
  return LUX_KEYS.WISHLIST + (u ? u.id : 'guest');
}
function getWishlist() {
  return JSON.parse(localStorage.getItem(wishKey()) || '[]');
}
function toggleWishlist(productId) {
  let wish = getWishlist();
  if (wish.includes(productId)) {
    wish = wish.filter(id => id !== productId);
  } else {
    wish.push(productId);
  }
  localStorage.setItem(wishKey(), JSON.stringify(wish));
  return wish;
}

/* ---------- Address Book (per-user) ---------- */
function addressKey() {
  const u = getCurrentUser();
  return LUX_KEYS.ADDRESSES + (u ? u.id : 'guest');
}
function getAddresses() {
  return JSON.parse(localStorage.getItem(addressKey()) || '[]');
}
function saveAddresses(list) {
  localStorage.setItem(addressKey(), JSON.stringify(list));
}
function getDefaultAddress() {
  return getAddresses().find(a => a.isDefault) || null;
}
function addAddress(data) {
  const list = getAddresses();
  const addr = {
    id: 'ADDR' + Date.now(),
    label: data.label || 'Rumah',
    recipientName: data.recipientName || '',
    phone: data.phone || '',
    address: data.address || '',
    city: data.city || '',
    province: data.province || '',
    postal: data.postal || '',
    isDefault: list.length === 0 ? true : !!data.isDefault
  };
  if (addr.isDefault) list.forEach(a => a.isDefault = false);
  list.push(addr);
  saveAddresses(list);
  return addr;
}
function updateAddress(id, data) {
  const list = getAddresses();
  const addr = list.find(a => a.id === id);
  if (!addr) return null;
  Object.assign(addr, {
    label: data.label ?? addr.label,
    recipientName: data.recipientName ?? addr.recipientName,
    phone: data.phone ?? addr.phone,
    address: data.address ?? addr.address,
    city: data.city ?? addr.city,
    province: data.province ?? addr.province,
    postal: data.postal ?? addr.postal
  });
  if (data.isDefault) list.forEach(a => a.isDefault = (a.id === id));
  saveAddresses(list);
  return addr;
}
function deleteAddress(id) {
  let list = getAddresses().filter(a => a.id !== id);
  if (list.length && !list.some(a => a.isDefault)) list[0].isDefault = true;
  saveAddresses(list);
  return list;
}
function setDefaultAddress(id) {
  const list = getAddresses();
  list.forEach(a => a.isDefault = (a.id === id));
  saveAddresses(list);
  return list;
}

/* ---------- Orders (sekarang bersumber dari database via API) ---------- */
/* Refund TIDAK punya collection/API terpisah — refund tersimpan sebagai
   sub-field (order.refund) di dalam dokumen order yang sama, dan otomatis
   ikut ter-load bareng orders lewat loadOrdersCache(). */
const ORDERS_API_URL = `${LUX_API_ORIGIN}/api/orders`;
let ordersCache = [];

/* Dipanggil sekali di awal (DOMContentLoaded), sama seperti loadProductsCache(),
   supaya getOrders()/getRefunds() di bawah selalu punya data terbaru dari database. */
async function loadOrdersCache() {
  try {
    const res = await fetch(ORDERS_API_URL);
    if (!res.ok) throw new Error('Gagal memuat pesanan dari server.');
    ordersCache = await res.json();
  } catch (err) {
    console.error('Gagal memuat pesanan dari server:', err.message);
    showToast('Tidak bisa terhubung ke server pesanan. Pastikan backend sedang berjalan.', 'error');
    ordersCache = [];
  }
  return ordersCache;
}

function getOrders() {
  return ordersCache;
}
function getOrdersByUser(userId) {
  return ordersCache.filter(o => o.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
function getOrderById(orderId) {
  return ordersCache.find(o => o.id === orderId);
}
/* Timpa 1 order di cache lokal dengan versi terbaru dari server (dipakai setelah create/update). */
function upsertOrderInCache(order) {
  const idx = ordersCache.findIndex(o => o.id === order.id);
  if (idx !== -1) ordersCache[idx] = order;
  else ordersCache.unshift(order);
  return order;
}

const ORDER_STATUS_FLOW = ['Pending', 'Diproses', 'Dikirim', 'Selesai'];

/* ---------- Refund (embedded di order.refund) ---------- */
const REFUND_STATUS_FLOW = ['Diajukan', 'Diproses', 'Disetujui', 'Ditolak'];

/* Turunkan daftar refund langsung dari ordersCache (bukan dari API/localStorage sendiri),
   supaya selalu sinkron dengan order yang bersangkutan. */
function getRefunds() {
  return ordersCache.filter(o => o.refund).map(o => ({ ...o.refund, orderId: o.id, userId: o.userId, userEmail: o.userEmail }));
}
function getRefundsByUser(userId) {
  return getRefunds().filter(r => r.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
function getRefundByOrderId(orderId) {
  const order = getOrderById(orderId);
  return order && order.refund ? { ...order.refund, orderId: order.id, userId: order.userId, userEmail: order.userEmail } : null;
}
function canRequestRefund(order) {
  if (!order) return false;
  if (order.status !== 'Selesai') return false;
  return !order.refund;
}

/* Ajukan refund → POST ke server, lalu sinkronkan order yang berubah ke cache lokal. */
async function createRefundRequest(orderId, reason) {
  const order = getOrderById(orderId);
  if (!canRequestRefund(order)) return null;
  try {
    const res = await fetch(`${ORDERS_API_URL}/${orderId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || '-' })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Gagal mengajukan refund.');
    upsertOrderInCache(result);
    return getRefundByOrderId(result.id);
  } catch (err) {
    console.error('Gagal mengajukan refund:', err.message);
    showToast(err.message || 'Gagal mengajukan refund.', 'error');
    return null;
  }
}

/* Update status refund (dipakai admin) → PUT ke server berdasarkan refundId,
   backend yang mencari order pemilik refund tsb. */
async function updateRefundStatus(refundId, newStatus, note) {
  try {
    const res = await fetch(`${ORDERS_API_URL}/refund/${refundId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, note })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Gagal memperbarui status refund.');
    upsertOrderInCache(result);
    return getRefundByOrderId(result.id);
  } catch (err) {
    console.error('Gagal memperbarui status refund:', err.message);
    showToast(err.message || 'Gagal memperbarui status refund.', 'error');
    return null;
  }
}

function canCancelOrder(order) {
  return !!order && order.status === 'Pending';
}
async function cancelOrder(orderId) {
  return updateOrderStatus(orderId, 'Dibatalkan', 'Pesanan dibatalkan oleh pelanggan.');
}

/* ---------- Opsi Pengiriman ---------- */
const SHIPPING_OPTIONS = [
  { id: 'hemat', label: 'Hemat', eta: 'Estimasi 7 hari', desc: 'Pilihan paling terjangkau untuk pengiriman non-mendesak.', fee: 0 },
  { id: 'standar', label: 'Standar', eta: 'Estimasi 2–3 hari', desc: 'Kecepatan seimbang dengan biaya wajar.', fee: 35000 },
  { id: 'instan', label: 'Instan', eta: 'Estimasi 1 hari', desc: 'Pengiriman tercepat untuk kebutuhan mendesak.', fee: 95000 }
];
function getShippingOption(id) {
  return SHIPPING_OPTIONS.find(s => s.id === id) || SHIPPING_OPTIONS[0];
}

async function createOrder(orderData) {
  let order;
  try {
    const res = await fetch(ORDERS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: orderData.userId,
        userEmail: orderData.userEmail,
        items: orderData.items, // [{productId, name, price, qty, size, color, isCustomSize}]
        address: orderData.address,
        contact: orderData.contact,
        recipientName: orderData.recipientName,
        paymentMethod: orderData.paymentMethod,
        shippingMethod: orderData.shippingMethod,
        subtotal: orderData.subtotal,
        shippingFee: orderData.shippingFee,
        total: orderData.total
      })
    });
    order = await res.json();
    if (!res.ok) throw new Error(order.error || 'Gagal membuat pesanan.');
  } catch (err) {
    console.error('Gagal membuat pesanan:', err.message);
    showToast(err.message || 'Gagal membuat pesanan. Pastikan backend sedang berjalan.', 'error');
    return null;
  }
  upsertOrderInCache(order);

  // Reduce stock (di cache) dan simpan perubahannya ke database
  const products = getProducts();
  const affectedProducts = [];
  orderData.items.forEach(item => {
    const p = products.find(pp => pp.id === item.productId);
    if (p) {
      p.stock = Math.max(0, p.stock - item.qty);
      p.sold = (p.sold || 0) + item.qty;
      affectedProducts.push(p);
    }
  });
  saveProducts(products);
  await Promise.all(affectedProducts.map(p => persistProductStock(p)));

  return order;
}

/* Update status pesanan (dipakai admin & pelanggan/batal) → PUT ke server,
   lalu sinkronkan hasilnya ke cache lokal. */
async function updateOrderStatus(orderId, newStatus, note) {
  try {
    const res = await fetch(`${ORDERS_API_URL}/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, note })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Gagal memperbarui status pesanan.');
    upsertOrderInCache(result);
    return result;
  } catch (err) {
    console.error('Gagal memperbarui status pesanan:', err.message);
    showToast(err.message || 'Gagal memperbarui status pesanan.', 'error');
    return null;
  }
}

/* ---------- Diskon & Harga Efektif ---------- */
function clampDiscountPercent(pct) {
  pct = parseInt(pct) || 0;
  if (pct < 0) pct = 0;
  if (pct > MAX_DISCOUNT_PERCENT) pct = MAX_DISCOUNT_PERCENT;
  return pct;
}
function getDiscountedPrice(product) {
  const pct = clampDiscountPercent(product.discountPercent || 0);
  if (pct <= 0) return product.price;
  return Math.round(product.price * (1 - pct / 100));
}
function hasDiscount(product) {
  return clampDiscountPercent(product.discountPercent || 0) > 0;
}
/* Harga satuan final untuk sebuah item: harga (setelah diskon) + biaya custom ukuran jika dipilih */
function getUnitPrice(product, isCustomSize) {
  let price = getDiscountedPrice(product);
  if (isCustomSize && product.allowCustomSize) {
    price += (product.customSizeFee || 0);
  }
  return price;
}

/* ---------- Format Helpers ---------- */
function formatIDR(num) {
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
}
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) +
    ' • ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
function onlyDigits(str) {
  return str.replace(/[^0-9+]/g, '');
}
function isValidPhone(str) {
  // No letters allowed, must be digits (optionally leading +), max 13 digits
  const cleaned = str.trim();
  return /^\+?[0-9]{1,13}$/.test(cleaned);
}

/* ---------- Toast Notification (shared UI) ---------- */
function ensureToastWrap() {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  return wrap;
}
function showToast(message, type = 'default') {
  const wrap = ensureToastWrap();
  const toast = document.createElement('div');
  toast.className = 'toast ' + (type === 'error' ? 'error' : type === 'success' ? 'success' : '');
  toast.textContent = message;
  wrap.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

/* ---------- Sales Report Helpers (for Admin) ---------- */
function getSalesReport() {
  const orders = getOrders().filter(o => o.status !== 'Dibatalkan');
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const totalItemsSold = orders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.qty, 0), 0);
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

  // Revenue per last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('id-ID', { weekday: 'short' });
    const dayRevenue = orders
      .filter(o => o.createdAt.slice(0, 10) === key)
      .reduce((s, o) => s + o.total, 0);
    days.push({ label, key, revenue: dayRevenue });
  }

  // Top products
  const productSales = {};
  orders.forEach(o => {
    o.items.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { name: item.name, qty: 0, revenue: 0 };
      }
      productSales[item.productId].qty += item.qty;
      productSales[item.productId].revenue += item.price * item.qty;
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Revenue by category
  const products = getProducts();
  const categoryRevenue = {};
  orders.forEach(o => {
    o.items.forEach(item => {
      const p = products.find(pp => pp.id === item.productId);
      const cat = p ? p.category : 'Lainnya';
      categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (item.price * item.qty);
    });
  });

  return { totalRevenue, totalOrders, totalItemsSold, avgOrderValue, days, topProducts, categoryRevenue };
}