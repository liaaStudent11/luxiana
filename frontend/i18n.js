/* =====================================================================
   LUXIANA — LANGUAGE TOGGLE (ID / EN) ADD-ON
   File ini murni TAMBAHAN. Tidak ada satu baris pun di app.js, data.js,
   index.html, atau style.css yang diubah oleh file ini.
   Cara kerja singkat:
   1. Menyuntikkan tombol toggle "EN / ID" ke header lewat JavaScript.
   2. Menyuntikkan CSS kecil untuk tombol tersebut lewat <style> yang
      dibuat sendiri (tidak menyentuh style.css).
   3. Menerjemahkan teks yang sudah ada di DOM (statis) dan memantau
      perubahan DOM (produk, keranjang, checkout, toast, dll — yang
      di-render ulang oleh app.js) lalu menerjemahkannya juga.
   4. Default bahasa: English ('en'). Pilihan disimpan di localStorage
      supaya tetap sama ketika halaman dibuka lagi.
   ===================================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'luxiana_lang';
  var currentLang = localStorage.getItem(STORAGE_KEY) || 'en'; // default English

  /* -------------------------------------------------------------------
     1) KAMUS TERJEMAHAN — kalimat/kata statis (exact match, trimmed)
     ------------------------------------------------------------------- */
  var DICT = {
    // Announcement bar
    'Gratis Ongkir Untuk Semua Pesanan • Layanan Personal Shopper Tersedia':
      'Free Shipping On All Orders • Personal Shopper Service Available',

    // Header / nav
    'Koleksi': 'Collection',
    'Kategori': 'Categories',
    'Tentang': 'About',
    'Pesanan Saya': 'My Orders',
    'Wishlist': 'Wishlist',
    'Keranjang': 'Cart',
    'Akun': 'Account',

    // Hero
    'Koleksi Eksklusif': 'Exclusive Collections',
    'Pelanggan Setia': 'Loyal Customers',
    'Toko Rating Tertinggi': 'Top-Rated Store',

    // Collection section
    'Atelier Luxiana': 'Luxiana Atelier',
    'Koleksi Lengkap': 'Full Collection',
    'Setiap karya dibuat dengan presisi tinggi oleh para maestro pengrajin kami.':
      'Every piece is crafted with the utmost precision by our master artisans.',
    'Semua': 'All',
    'Urutkan: Rekomendasi': 'Sort: Recommended',
    'Harga: Rendah ke Tinggi': 'Price: Low to High',
    'Harga: Tinggi ke Rendah': 'Price: High to Low',
    'Terbaru': 'Newest',
    'Terlaris': 'Bestseller',
    'Tidak ada produk pada kategori ini.': 'No products in this category.',

    // New Arrival
    'Baru Tiba': 'Just Arrived',
    'New Arrival': 'New Arrival',
    'Koleksi terbaru yang baru saja tiba di atelier kami, dipilih khusus untuk Anda yang selalu ingin tampil terdepan.':
      'Our newest pieces, fresh from the atelier, curated for those who always want to stay ahead of the trend.',

    // Categories
    'Kategori Pilihan': 'Featured Categories',
    'Belanja Berdasarkan Kategori': 'Shop By Category',

    // Limited Edition
    'Koleksi Terbatas': 'Limited Collection',
    'Limited Edition': 'Limited Edition',
    'Diproduksi dalam jumlah sangat terbatas — begitu habis, tidak akan diproduksi kembali.':
      'Produced in extremely limited numbers — once sold out, they will never be made again.',

    // Sale
    'Penawaran Terbatas': 'Limited-Time Offer',
    'Sedang Sale': 'On Sale',
    'Nikmati potongan harga eksklusif untuk pilihan produk terbaik kami, selama persediaan masih ada.':
      'Enjoy exclusive discounts on a selection of our finest pieces, while supplies last.',

    // Editorial / About
    'Filosofi Kami': 'Our Philosophy',
    'Dibuat untuk Bertahan Melampaui Tren': 'Made to Outlast Every Trend',
    'Sejak awal, Luxiana berkomitmen pada keahlian tangan, material premium, dan desain abadi — bukan sekadar mengikuti musim, namun menciptakan warisan.':
      'From the very beginning, Luxiana has been committed to hand craftsmanship, premium materials, and timeless design — not just following seasons, but creating a legacy.',
    'Temukan Koleksi Kami': 'Discover Our Collection',
    'Browser Anda tidak mendukung tag video.': 'Your browser does not support the video tag.',

    // Footer
    'Rumah mode adibusana yang menghadirkan keanggunan klasik melalui material terbaik dan keahlian tangan tanpa kompromi.':
      'A high-fashion house delivering classic elegance through the finest materials and uncompromising craftsmanship.',
    'Navigasi': 'Navigation',
    'Beranda': 'Home',
    'Tentang Kami': 'About Us',
    'Layanan': 'Services',
    'Lacak Pesanan': 'Track Order',
    'Panduan Ukuran': 'Size Guide',
    'Kebijakan Retur': 'Return Policy',
    'Hubungi Kami': 'Contact Us',
    'Seluruh hak cipta dilindungi.': 'All rights reserved.',
    'Dibuat dengan dedikasi pada keanggunan.': 'Made with dedication to elegance.',

    // Login modal
    'Selamat Datang': 'Welcome',
    'Masuk ke Luxiana': 'Sign In to Luxiana',
    'Masuk dengan Google': 'Sign in with Google',
    'atau masukkan email gmail': 'or enter your gmail address',
    'Alamat Gmail': 'Gmail Address',
    'Masukkan alamat gmail yang valid (harus diakhiri @gmail.com).':
      'Enter a valid gmail address (must end with @gmail.com).',
    'Lanjutkan': 'Continue',
    'Tidak perlu kata sandi — cukup gunakan akun Gmail Anda untuk berbelanja di Luxiana.':
      'No password needed — simply use your Gmail account to shop at Luxiana.',

    // Account hub
    'Akun Saya': 'My Account',
    'Tamu': 'Guest',
    'Anda belum masuk. Masuk untuk mengakses profil, alamat, pesanan, wishlist, dan refund Anda.':
      'You are not signed in. Sign in to access your profile, addresses, orders, wishlist, and refunds.',
    'Masuk Sekarang': 'Sign In Now',
    '👤 Profil': '👤 Profile',
    '📍 Alamat': '📍 Address',
    '📦 Riwayat Pesanan': '📦 Order History',
    '♡ Wishlist': '♡ Wishlist',
    '↩ Refund': '↩ Refund',
    'Nama Lengkap': 'Full Name',
    'Nama lengkap Anda': 'Your full name',
    'Huruf saja, maksimal 30 karakter.': 'Letters only, maximum 30 characters.',
    'Nama hanya boleh berisi huruf (tanpa angka), maksimal 30 karakter.':
      'Name may only contain letters (no numbers), maximum 30 characters.',
    'Nomor Telepon': 'Phone Number',
    'Contoh: 081234567890': 'e.g. 081234567890',
    'Hanya angka, maksimal 14 digit.': 'Numbers only, maximum 14 digits.',
    'Nomor telepon harus berupa angka, maksimal 14 digit.':
      'Phone number must be numeric, maximum 14 digits.',
    'Jenis Kelamin': 'Gender',
    'Pilih (opsional)': 'Select (optional)',
    'Perempuan': 'Female',
    'Laki-laki': 'Male',
    'Tanggal Lahir': 'Date of Birth',
    'Email': 'Email',
    'Email terhubung dengan akun Gmail Anda dan tidak dapat diubah.':
      'Email is linked to your Gmail account and cannot be changed.',
    'Simpan Profil': 'Save Profile',
    'Kelola alamat pengiriman Anda.': 'Manage your shipping addresses.',
    '+ Tambah Alamat': '+ Add Address',
    'Ajukan refund untuk pesanan yang sudah selesai, atau pantau status refund Anda di bawah.':
      'Request a refund for completed orders, or track your refund status below.',
    'Keluar': 'Log Out',

    // Address form
    'Alamat Baru': 'New Address',
    'Tambah Alamat': 'Add Address',
    'Ubah Alamat': 'Edit Address',
    'Label Alamat': 'Address Label',
    'Contoh: Rumah, Kantor': 'e.g. Home, Office',
    'Tidak boleh mengandung angka.': 'Must not contain numbers.',
    'Label alamat tidak boleh mengandung angka.': 'Address label must not contain numbers.',
    'Nama Penerima': 'Recipient Name',
    'Nama lengkap penerima': "Recipient's full name",
    'Nama penerima hanya boleh berisi huruf (tanpa angka), maksimal 30 karakter.':
      "Recipient name may only contain letters (no numbers), maximum 30 characters.",
    'Alamat Lengkap': 'Full Address',
    'Nama jalan, nomor rumah, RT/RW, Kelurahan, Kecamatan':
      'Street name, house number, RT/RW, sub-district, district',
    'Alamat harus detail (minimal 20 karakter).': 'Address must be detailed (minimum 20 characters).',
    'Kota / Kabupaten': 'City / Regency',
    'Contoh: Jakarta Selatan': 'e.g. South Jakarta',
    'Kota wajib diisi.': 'City is required.',
    'Kode Pos': 'Postal Code',
    'Contoh: 12190': 'e.g. 12190',
    'Hanya angka, maksimal 5 digit.': 'Numbers only, maximum 5 digits.',
    'Kode pos harus berupa angka, maksimal 5 digit.': 'Postal code must be numeric, maximum 5 digits.',
    'Provinsi': 'Province',
    'Contoh: DKI Jakarta': 'e.g. DKI Jakarta',
    'Provinsi wajib diisi.': 'Province is required.',
    'Jadikan alamat utama': 'Set as primary address',
    'Simpan Alamat': 'Save Address',
    'Belum ada alamat tersimpan.': 'No saved addresses yet.',
    'Utama': 'Primary',
    'Jadikan Utama': 'Set Primary',
    'Ubah': 'Edit',
    'Hapus': 'Delete',

    // Refund form
    'Ajukan Refund': 'Request Refund',
    'Permintaan Refund': 'Refund Request',
    'Alasan Refund': 'Refund Reason',
    'Jelaskan alasan Anda mengajukan refund...': 'Explain your reason for requesting a refund...',
    'Alasan wajib diisi (minimal 10 karakter).': 'Reason is required (minimum 10 characters).',
    'Kirim Permintaan Refund': 'Submit Refund Request',

    // Cart panel
    'Tas Belanja': 'Shopping Bag',
    'Keranjang Anda': 'Your Cart',
    'Keranjang Anda masih kosong.': 'Your cart is still empty.',
    'Subtotal': 'Subtotal',
    'Dihitung saat checkout': 'Calculated at checkout',
    'Pengiriman': 'Shipping',
    'Total': 'Total',
    'Lanjut ke Checkout': 'Proceed to Checkout',

    // Wishlist panel
    'Favorit Anda': 'Your Favorites',
    'Belum ada produk favorit.': 'No favorite products yet.',
    'Lihat': 'View',

    // Product badges
    'Baru': 'New',
    'Sale': 'Sale',
    'Limited': 'Limited',

    // Product detail
    'Pilih Ukuran': 'Select Size',
    'Pilih Warna': 'Select Color',
    'Centang jika Anda ingin ukuran disesuaikan khusus dengan tambahan biaya.':
      'Check this if you want a custom-tailored size for an extra fee.',
    'Jumlah': 'Quantity',
    'Stok habis': 'Out of stock',
    'Stok Habis': 'Out of Stock',
    'Tambah ke Keranjang': 'Add to Cart',
    'Beli Sekarang': 'Buy Now',
    'Material': 'Material',
    'Asal': 'Origin',
    'Perawatan': 'Care Instructions',
    'Terjual': 'Sold',

    // Checkout
    'Selesaikan Pesanan': 'Complete Your Order',
    'Checkout': 'Checkout',
    'Informasi Penerima': 'Recipient Information',
    'Ubah di My Account': 'Edit in My Account',
    'Nama': 'Name',
    'Telepon': 'Phone',
    'Alamat Pengiriman': 'Shipping Address',
    'Opsi Pengiriman': 'Shipping Options',
    'Metode Pembayaran': 'Payment Method',
    'QRIS': 'QRIS',
    'Bayar dengan scan QRIS via e-wallet atau m-banking apapun':
      'Pay by scanning the QRIS code via any e-wallet or mobile banking app',
    'Kartu Kredit': 'Credit Card',
    'Jenis Kartu': 'Card Type',
    'Pilih jenis kartu': 'Select card type',
    'Nomor Kartu': 'Card Number',
    'Nomor kartu tidak valid.': 'Invalid card number.',
    'Nama Pemegang Kartu': 'Cardholder Name',
    'Nama pemegang kartu wajib diisi.': 'Cardholder name is required.',
    'Masa Berlaku (MM/YY)': 'Expiry Date (MM/YY)',
    'Format masa berlaku tidak valid (MM/YY).': 'Invalid expiry format (MM/YY).',
    'CVV': 'CVV',
    'Kartu Debit': 'Debit Card',
    'Jenis Kartu Debit': 'Debit Card Type',
    'Pilih jenis kartu debit': 'Select debit card type',
    'Nomor Kartu Debit': 'Debit Card Number',
    'Ringkasan Pesanan': 'Order Summary',
    'Ongkos Kirim (': 'Shipping Fee (',
    'Buat Pesanan': 'Place Order',
    'Gratis': 'Free',

    // Shipping options (from data.js)
    'Hemat': 'Economy',
    'Standar': 'Standard',
    'Instan': 'Instant',
    'Estimasi 7 hari': 'Estimated 7 days',
    'Estimasi 2–3 hari': 'Estimated 2–3 days',
    'Estimasi 1 hari': 'Estimated 1 day',
    'Pilihan paling terjangkau untuk pengiriman non-mendesak.':
      'The most affordable option for non-urgent shipping.',
    'Kecepatan seimbang dengan biaya wajar.': 'Balanced speed at a reasonable cost.',
    'Pengiriman tercepat untuk kebutuhan mendesak.': 'The fastest delivery for urgent needs.',

    // Orders panel
    'Riwayat Belanja': 'Purchase History',
    'Anda belum memiliki pesanan.': "You don't have any orders yet.",
    'Batalkan': 'Cancel',

    // Order statuses
    'Pending': 'Pending',
    'Diproses': 'Processing',
    'Dikirim': 'Shipped',
    'Selesai': 'Completed',
    'Dibatalkan': 'Cancelled',
    'Diajukan': 'Requested',
    'Disetujui': 'Approved',
    'Ditolak': 'Rejected',

    // Track order
    'Lacak Pengiriman': 'Track Shipment',
    'Lacak Pesanan': 'Track Order',
    'Masukkan Nomor Pesanan': 'Enter Order Number',
    'Contoh: LUX12345678': 'e.g. LUX12345678',
    'Lacak Sekarang': 'Track Now',
    'Masukkan nomor pesanan.': 'Enter an order number.',
    'Nomor pesanan tidak ditemukan. Periksa kembali nomor pesanan Anda.':
      'Order number not found. Please check your order number again.',
    'Menunggu': 'Waiting',
    'Pesanan diterima, menunggu konfirmasi pembayaran.': 'Order received, awaiting payment confirmation.',
    'Pembayaran terverifikasi, pesanan sedang disiapkan oleh tim kami.':
      'Payment verified, your order is being prepared by our team.',
    'Pesanan telah diserahkan ke kurir dan sedang dalam pengiriman.':
      'Order has been handed to the courier and is on its way.',
    'Pesanan telah diterima oleh pelanggan. Terima kasih telah berbelanja di Luxiana.':
      'Order has been received by the customer. Thank you for shopping at Luxiana.',

    // Success modal
    'Pesanan Berhasil Dibuat': 'Order Successfully Placed',
    'Nomor pesanan Anda:': 'Your order number:',
    'Simpan nomor ini untuk melacak status pengiriman pesanan Anda.':
      'Save this number to track your order shipment status.',

    // Size guide
    'Referensi Ukuran': 'Size Reference',
    'Ukuran': 'Size',
    'Lingkar Dada (cm)': 'Chest (cm)',
    'Lingkar Pinggang (cm)': 'Waist (cm)',
    'Panjang (cm)': 'Length (cm)',
    'Ukuran dapat bervariasi ±2cm tergantung model produk. Jika ragu, silakan hubungi kami sebelum memesan.':
      'Sizes may vary by ±2cm depending on the product style. If unsure, please contact us before ordering.',

    // Return policy
    'Ketentuan Layanan': 'Terms of Service',
    '1. Masa Retur': '1. Return Period',
    'Retur dapat diajukan maksimal 7 hari setelah barang diterima.':
      'Returns can be requested up to 7 days after the item is received.',
    '2. Syarat Barang': '2. Item Requirements',
    'Barang harus dalam kondisi belum dipakai, label masih terpasang, dan disertai bukti pembelian.':
      'Items must be unused, with tags still attached, and accompanied by proof of purchase.',
    '3. Barang Custom': '3. Custom Items',
    'Produk dengan ukuran custom tidak dapat diretur, kecuali terdapat cacat produksi.':
      'Custom-sized products cannot be returned, except in the case of a manufacturing defect.',
    '4. Proses Refund': '4. Refund Process',
    'Dana akan dikembalikan dalam 3–7 hari kerja setelah barang retur diverifikasi.':
      'Funds will be refunded within 3–7 business days after the returned item is verified.',

    // Contact modal
    'Kami Siap Membantu': "We're Here to Help",

    // Toasts (static ones)
    'Alamat berhasil diperbarui.': 'Address successfully updated.',
    'Alamat berhasil ditambahkan.': 'Address successfully added.',
    'Alamat dihapus.': 'Address deleted.',
    'Alamat utama diperbarui.': 'Primary address updated.',
    'Anda telah keluar dari akun.': 'You have been signed out.',
    'Keranjang Anda kosong.': 'Your cart is empty.',
    'Lengkapi nama & nomor telepon Anda di My Account sebelum checkout.':
      'Complete your name & phone number in My Account before checking out.',
    'Mohon jelaskan alasan refund (minimal 10 karakter).':
      'Please explain your refund reason (minimum 10 characters).',
    'Mohon lengkapi data alamat dengan benar.': 'Please fill in the address details correctly.',
    'Mohon lengkapi semua data dengan benar.': 'Please fill in all the details correctly.',
    'Mohon periksa kembali data profil Anda.': 'Please double-check your profile details.',
    'Permintaan refund berhasil dikirim.': 'Refund request submitted successfully.',
    'Pesanan berhasil dibatalkan.': 'Order successfully cancelled.',
    'Pesanan tidak memenuhi syarat untuk refund.': 'This order is not eligible for a refund.',
    'Produk dihapus dari keranjang.': 'Product removed from cart.',
    'Profil Anda belum lengkap. Silakan lengkapi di My Account.':
      'Your profile is incomplete. Please complete it in My Account.',
    'Profil berhasil disimpan.': 'Profile saved successfully.',
    'Silakan masuk dengan Gmail untuk melanjutkan checkout.':
      'Please sign in with Gmail to continue checkout.',
    'Silakan masuk dengan Gmail untuk melanjutkan.': 'Please sign in with Gmail to continue.',
    'Silakan masuk untuk melihat pesanan Anda.': 'Please sign in to view your orders.',
    'Silakan pilih alamat pengiriman.': 'Please select a shipping address.',
    'Tambahkan alamat pengiriman di My Account sebelum checkout.':
      'Add a shipping address in My Account before checking out.',
    'Total pesanan tidak boleh melebihi Rp 1.000.000.000.': 'Order total cannot exceed Rp 1,000,000,000.',
    'Email tidak boleh kosong.': 'Email cannot be empty.',
    'Tidak bisa terhubung ke server produk. Pastikan backend sedang berjalan.':
      'Unable to connect to the product server. Please make sure the backend is running.',
    'Tidak bisa terhubung ke server pesanan. Pastikan backend sedang berjalan.':
      'Unable to connect to the order server. Please make sure the backend is running.',
    'Gagal mengajukan refund.': 'Failed to submit refund request.',
    'Gagal memperbarui status refund.': 'Failed to update refund status.',
    'Gagal membuat pesanan. Pastikan backend sedang berjalan.':
      'Failed to place order. Please make sure the backend is running.'
  };

  /* -------------------------------------------------------------------
     2) POLA DINAMIS — kalimat yang punya bagian variabel (nama produk,
     angka stok, dsb). Diterapkan dengan regex + fungsi pengganti.
     ------------------------------------------------------------------- */
  var DYNAMIC_PATTERNS = [
    { re: /^Selamat datang, (.+)!$/, en: function (m) { return 'Welcome, ' + m[1] + '!'; } },
    { re: /^Stok produk ini hanya tersedia (.+) unit\.$/, en: function (m) { return 'Only ' + m[1] + ' units of this product are available.'; } },
    { re: /^Jumlah melebihi stok\. Maksimal pembelian adalah (.+) unit\.$/, en: function (m) { return 'Quantity exceeds stock. Maximum purchase is ' + m[1] + ' units.'; } },
    { re: /^(.+) ditambahkan ke keranjang\.$/, en: function (m) { return m[1] + ' added to cart.'; } },
    { re: /^Stok: (.+) \(maks\. (.+) per pesanan\)$/, en: function (m) { return 'Stock: ' + m[1] + ' (max. ' + m[2] + ' per order)'; } },
    { re: /^(.+) unit$/, en: function (m) { return m[1] + ' sold'; } },
    { re: /^Dipesan pada (.+) • Dikirim ke (.+)$/, en: function (m) { return 'Ordered on ' + m[1] + ' • Shipped to ' + m[2]; } },
    { re: /^Pengiriman: (.+)$/, en: function (m) { return 'Shipping: ' + m[1]; } }
  ];

  // Bangun kamus terbalik (EN -> ID) untuk mode toggle kembali ke Bahasa Indonesia.
  var REVERSE_DICT = {};
  Object.keys(DICT).forEach(function (id) { REVERSE_DICT[DICT[id]] = id; });

  function translateExact(str) {
    var trimmed = str.trim();
    if (!trimmed) return null;
    if (currentLang === 'en') {
      if (Object.prototype.hasOwnProperty.call(DICT, trimmed)) return DICT[trimmed];
      for (var i = 0; i < DYNAMIC_PATTERNS.length; i++) {
        var m = trimmed.match(DYNAMIC_PATTERNS[i].re);
        if (m) return DYNAMIC_PATTERNS[i].en(m);
      }
    } else {
      if (Object.prototype.hasOwnProperty.call(REVERSE_DICT, trimmed)) return REVERSE_DICT[trimmed];
    }
    return null;
  }

  // Terjemahkan sebuah string utuh, sambil menjaga spasi di awal/akhir.
  function translateString(str) {
    if (typeof str !== 'string') return str;
    var leading = str.match(/^\s*/)[0];
    var trailing = str.match(/\s*$/)[0];
    var core = str.slice(leading.length, str.length - trailing.length);
    if (!core) return str;
    var result = translateExact(core);
    return result ? (leading + result + trailing) : str;
  }

  /* -------------------------------------------------------------------
     3) MESIN PENERJEMAH DOM
     ------------------------------------------------------------------- */
  var TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label'];
  var suppressObserver = false;

  function translateTextNode(node) {
    if (!node.nodeValue || !node.nodeValue.trim()) return;
    var translated = translateString(node.nodeValue);
    if (translated !== node.nodeValue) node.nodeValue = translated;
  }

  function translateElementAttrs(el) {
    if (el.nodeType !== 1) return;
    TRANSLATABLE_ATTRS.forEach(function (attr) {
      var val = el.getAttribute && el.getAttribute(attr);
      if (val) {
        var translated = translateString(val);
        if (translated !== val) el.setAttribute(attr, translated);
      }
    });
  }

  function walkAndTranslate(root) {
    if (!root) return;
    if (root.nodeType === 3) { translateTextNode(root); return; }
    if (root.nodeType !== 1) return;

    var tag = root.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE') return;

    translateElementAttrs(root);

    var child = root.firstChild;
    while (child) {
      walkAndTranslate(child);
      child = child.nextSibling;
    }
  }

  function fullTranslatePass() {
    suppressObserver = true;
    walkAndTranslate(document.body);
    suppressObserver = false;
  }

  // Amati perubahan DOM yang dilakukan app.js (render produk, cart, checkout, dll)
  var observer = new MutationObserver(function (mutations) {
    if (suppressObserver) return;
    suppressObserver = true;
    mutations.forEach(function (mut) {
      if (mut.type === 'characterData') {
        translateTextNode(mut.target);
      } else {
        mut.addedNodes.forEach(function (node) { walkAndTranslate(node); });
      }
    });
    suppressObserver = false;
  });

  /* -------------------------------------------------------------------
     4) BUNGKUS showToast SUPAYA PESAN TOAST IKUT DITERJEMAHKAN
     ------------------------------------------------------------------- */
  function wrapShowToast() {
    if (typeof window.showToast !== 'function' || window.showToast.__i18nWrapped) return;
    var original = window.showToast;
    var wrapped = function (message, type) {
      var translated = typeof message === 'string' ? translateString(message) : message;
      return original.call(this, translated, type);
    };
    wrapped.__i18nWrapped = true;
    window.showToast = wrapped;
  }

  /* -------------------------------------------------------------------
     5) TOMBOL TOGGLE + CSS (disuntik lewat JS, tidak menyentuh style.css)
     ------------------------------------------------------------------- */
  function injectStyles() {
    var style = document.createElement('style');
    style.textContent =
      '.lang-toggle{display:flex;align-items:center;gap:2px;border:1px solid rgba(0,0,0,0.15);' +
      'border-radius:999px;padding:3px;margin-right:4px;background:transparent;}' +
      '.lang-toggle button{border:none;background:transparent;font-family:inherit;font-size:11px;' +
      'letter-spacing:0.05em;padding:5px 11px;border-radius:999px;cursor:pointer;color:inherit;' +
      'opacity:0.55;transition:all 0.2s ease;}' +
      '.lang-toggle button.active{opacity:1;background:#161412;color:#fff;}' +
      '.lang-toggle button:not(.active):hover{opacity:0.85;}';
    document.head.appendChild(style);
  }

  function updateToggleUI() {
    var btnEn = document.getElementById('langToggleEn');
    var btnId = document.getElementById('langToggleId');
    if (!btnEn || !btnId) return;
    btnEn.classList.toggle('active', currentLang === 'en');
    btnId.classList.toggle('active', currentLang === 'id');
  }

  function setLang(lang) {
    if (lang === currentLang) return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    updateToggleUI();
    fullTranslatePass();
  }

  function injectToggleButton() {
    var actions = document.querySelector('.nav-actions');
    if (!actions) return;

    var wrap = document.createElement('div');
    wrap.className = 'lang-toggle';
    wrap.innerHTML =
      '<button type="button" id="langToggleEn">EN</button>' +
      '<button type="button" id="langToggleId">ID</button>';

    actions.insertBefore(wrap, actions.firstChild);

    document.getElementById('langToggleEn').addEventListener('click', function () { setLang('en'); });
    document.getElementById('langToggleId').addEventListener('click', function () { setLang('id'); });

    updateToggleUI();
  }

  /* -------------------------------------------------------------------
     6) INISIALISASI
     ------------------------------------------------------------------- */
  function init() {
    injectStyles();
    injectToggleButton();
    wrapShowToast();

    if (currentLang === 'en') fullTranslatePass();

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    // app.js memuat data produk secara async (loadProductsCache), jadi
    // beberapa render terjadi setelah DOMContentLoaded selesai. Lakukan
    // beberapa pass susulan untuk menangkap render tersebut.
    if (currentLang === 'en') {
      [300, 800, 1500].forEach(function (delay) {
        setTimeout(fullTranslatePass, delay);
      });
    }
  }

  // Daftarkan setelah app.js sendiri, supaya elemen (nav-actions, dll)
  // sudah pasti ada dan fungsi showToast sudah terdefinisi.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
