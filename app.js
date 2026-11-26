// ==========================================
// 1. KONFIGURASI SUPABASE
// ==========================================
const SUPABASE_URL = 'https://feauaohofwtzaqntpyxs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2VGWriNh8pu6qniQUmV0CQ_8Ym9lrvC';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let userProfile = null;
let selectedProduct = null;
let authMode = 'login';
let activeCategory = 'ALL';

// Katalog Produk Lengkap Sesuai Kategori RemsDigi
const PRODUCTS = [
  // Aplikasi Premium
  { id: 'app-1', name: 'Netflix Premium 4K UHD (1 Bulan)', category: 'Aplikasi Premium', price: 35000, original: 65000, badge: 'Terlaris', flash: true, icon: '🎬' },
  { id: 'app-2', name: 'Spotify Premium Individual (1 Bulan)', category: 'Aplikasi Premium', price: 18000, original: 54000, badge: 'Promo', flash: false, icon: '🎧' },
  { id: 'app-3', name: 'YouTube Premium + Music (1 Bulan)', category: 'Aplikasi Premium', price: 12000, original: 59000, badge: 'Instan', flash: true, icon: '▶️' },
  { id: 'app-4', name: 'Canva Pro Lifetime / Edu', category: 'Aplikasi Premium', price: 15000, original: 99000, badge: 'Garansi', flash: false, icon: '🎨' },
  { id: 'app-5', name: 'CapCut Pro Private (1 Bulan)', category: 'Aplikasi Premium', price: 25000, original: 75000, badge: 'Hot', flash: true, icon: '✂️' },
  { id: 'app-6', name: 'ChatGPT Plus Shared/Private', category: 'Aplikasi Premium', price: 45000, original: 300000, badge: 'AI Pro', flash: false, icon: '🤖' },
  { id: 'app-7', name: 'Disney+ Hotstar & Vidio Platinum', category: 'Aplikasi Premium', price: 28000, original: 69000, badge: 'Bundle', flash: false, icon: '📺' },
  { id: 'app-8', name: 'Alight Motion Pro & Adobe CC', category: 'Aplikasi Premium', price: 20000, original: 120000, badge: 'Editor', flash: false, icon: '✨' },

  // Suntik Sosial Media
  { id: 'smm-1', name: '1.000 Followers Instagram Permanen', category: 'Suntik Sosmed', price: 14000, original: 30000, badge: 'No Drop', flash: true, icon: '📸' },
  { id: 'smm-2', name: '1.000 Followers TikTok Real Mix', category: 'Suntik Sosmed', price: 16000, original: 35000, badge: 'FYP', flash: false, icon: '🎵' },
  { id: 'smm-3', name: '10.000 Views TikTok + 500 Likes', category: 'Suntik Sosmed', price: 8000, original: 20000, badge: 'Kilat', flash: false, icon: '🚀' },
  { id: 'smm-4', name: '1.000 Subscriber YouTube + Watchtime', category: 'Suntik Sosmed', price: 85000, original: 150000, badge: 'Monetisasi', flash: false, icon: '📹' },

  // Top Up Game
  { id: 'game-1', name: 'Mobile Legends: 86 Diamonds', category: 'Top Up Game', price: 21500, original: 26000, badge: 'Otomatis', flash: false, icon: '⚔️' },
  { id: 'game-2', name: 'Free Fire: 140 Diamonds', category: 'Top Up Game', price: 19000, original: 24000, badge: 'Instan', flash: false, icon: '🔥' },
  { id: 'game-3', name: 'PUBG Mobile: 60 UC + Bonus', category: 'Top Up Game', price: 14500, original: 18000, badge: 'Global', flash: false, icon: '🔫' },
  { id: 'game-4', name: 'Roblox 400 Robux / Genshin Welkin', category: 'Top Up Game', price: 62000, original: 79000, badge: 'Legal', flash: false, icon: '🎮' },
  { id: 'game-5', name: 'Valorant 475 Points / Steam Wallet', category: 'Top Up Game', price: 54000, original: 65000, badge: 'Kode/ID', flash: false, icon: '🎯' },

  // Pulsa, Kuota, E-Wallet & Token Listrik
  { id: 'pulsa-1', name: 'Pulsa All Operator 25.000 (Telkomsel/XL/Axis/Indosat)', category: 'Pulsa', price: 24500, original: 27000, badge: '24 Jam', flash: false, icon: '📞' },
  { id: 'kuota-1', name: 'Kuota Internet 15GB Full 30 Hari (All Operator)', category: 'Kuota Internet', price: 38000, original: 50000, badge: 'Combo', flash: false, icon: '🌐' },
  { id: 'ewallet-1', name: 'Top Up Saldo DANA / GoPay / OVO / ShopeePay 50.000', category: 'E-Wallet', price: 50500, original: 52500, badge: 'Bebas Admin', flash: false, icon: '💰' },
  { id: 'pln-1', name: 'Token Listrik PLN Prabayar 50.000', category: 'Token Listrik', price: 50200, original: 53000, badge: 'Detik Masuk', flash: false, icon: '⚡' },
  { id: 'pln-2', name: 'Token Listrik PLN Prabayar 100.000', category: 'Token Listrik', price: 100200, original: 103000, badge: 'Hemat', flash: false, icon: '⚡' }
];

// ==========================================
// 2. INISIALISASI UI, LOADING & REALTIME
// ==========================================
window.addEventListener('DOMContentLoaded', async () => {
  setTimeout(() => {
    const loader = document.getElementById('loading-screen');
    loader.classList.add('opacity-0');
    setTimeout(() => loader.remove(), 500);
  }, 800);

  renderProducts();
  startCountdown();
  await checkUserSession();
  setupRealtimeListeners();
});

function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  document.getElementById('theme-icon').className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function showSection(section) {
  ['home', 'dashboard', 'admin'].forEach(s => {
    document.getElementById(`section-${s}`).classList.add('hidden');
  });
  document.getElementById(`section-${section}`).classList.remove('hidden');
  if (section === 'dashboard') loadUserHistory();
  if (section === 'admin') loadAdminData();
}

function openModal(id) {
  const el = document.getElementById(id);
  el.classList.remove('hidden');
  el.classList.add('flex');
}

function closeModal(id) {
  const el = document.getElementById(id);
  el.classList.add('hidden');
  el.classList.remove('flex');
}

// ==========================================
// 3. SISTEM AUTENTIKASI SUPABASE (GMAIL & GOOGLE)
// ==========================================
function openAuthModal() { openModal('auth-modal'); }
function setAuthMode(mode) { authMode = mode; }

async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
  if (error) alert('Gagal login Google: ' + error.message);
}

async function handleEmailAuth(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;

  if (authMode === 'register') {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return alert('Gagal daftar: ' + error.message);
    alert('Pendaftaran berhasil! Silakan cek Gmail Anda atau langsung masuk.');
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert('Login gagal: ' + error.message);
    closeModal('auth-modal');
    await checkUserSession();
  }
}

async function checkUserSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  currentUser = session.user;
  document.getElementById('auth-buttons').classList.add('hidden');
  document.getElementById('user-menu').classList.remove('hidden');
  document.getElementById('user-menu').classList.add('flex');
  document.getElementById('nav-balance-btn').classList.remove('hidden');
  document.getElementById('user-name-display').textContent = currentUser.email.split('@')[0];
  document.getElementById('dash-user-email').textContent = currentUser.email;

  await fetchUserProfile();
}

async function fetchUserProfile() {
  if (!currentUser) return;
  const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
  if (data) {
    userProfile = data;
    const formattedSaldo = formatRupiah(data.balance || 0);
    document.getElementById('nav-balance-text').textContent = formattedSaldo;
    document.getElementById('dash-balance').textContent = formattedSaldo;
    if (data.role === 'admin') {
      document.getElementById('admin-nav-btn').classList.remove('hidden');
    }
  }
}

async function logoutUser() {
  await supabase.auth.signOut();
  window.location.reload();
}

// ==========================================
// 4. RENDER PRODUK & FILTER
// ==========================================
function renderProducts() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const filtered = PRODUCTS.filter(p => {
    const matchCat = activeCategory === 'ALL' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query);
    return matchCat && matchSearch;
  });

  document.getElementById('product-count').textContent = `${filtered.length} produk tersedia`;

  const flashContainer = document.getElementById('flash-sale-grid');
  flashContainer.innerHTML = PRODUCTS.filter(p => p.flash).map(p => createProductCard(p)).join('');

  const gridContainer = document.getElementById('product-grid');
  gridContainer.innerHTML = filtered.map(p => createProductCard(p)).join('');
}

function createProductCard(p) {
  return `
    <div onclick="openCheckout('${p.id}')" class="cursor-pointer group bg-white dark:bg-darkCard rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-2xl">${p.icon}</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300">${p.badge}</span>
        </div>
        <p class="text-[11px] text-slate-400">${p.category}</p>
        <h4 class="font-bold text-xs sm:text-sm mt-0.5 line-clamp-2 group-hover:text-blue-600 transition">${p.name}</h4>
      </div>
      <div class="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <p class="text-[10px] line-through text-slate-400">${formatRupiah(p.original)}</p>
        <div class="flex items-center justify-between">
          <p class="font-extrabold text-sm text-blue-600 dark:text-cyan-400">${formatRupiah(p.price)}</p>
          <span class="w-7 h-7 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center text-xs"><i class="fa-solid fa-bag-shopping"></i></span>
        </div>
      </div>
    </div>
  `;
}

function selectCategory(cat) {
  activeCategory = cat;
  document.getElementById('catalog-title').textContent = cat === 'ALL' ? 'Semua Produk Digital' : `Kategori: ${cat}`;
  renderProducts();
}

function filterProducts() { renderProducts(); }

// ==========================================
// 5. CHECKOUT, METODE PEMBAYARAN & UPLOAD BUKTI
// ==========================================
function openCheckout(productId) {
  if (!currentUser) {
    alert('Silakan masuk/daftar akun terlebih dahulu untuk melakukan transaksi.');
    return openAuthModal();
  }
  selectedProduct = PRODUCTS.find(p => p.id === productId);
  document.getElementById('co-product-name').textContent = selectedProduct.name;
  document.getElementById('co-product-cat').textContent = selectedProduct.category;
  document.getElementById('co-product-price').textContent = formatRupiah(selectedProduct.price);
  document.getElementById('co-user-saldo').textContent = formatRupiah(userProfile?.balance || 0);

  updatePaymentInstruction();
  openModal('checkout-modal');
}

function updatePaymentInstruction() {
  const method = document.querySelector('input[name="pay_method"]:checked').value;
  const box = document.getElementById('payment-instruction-box');
  const uploadSec = document.getElementById('proof-upload-section');
  const fileInput = document.getElementById('co-proof-file');

  if (method === 'SALDO_REMS') {
    uploadSec.classList.add('hidden');
    fileInput.required = false;
    box.innerHTML = `
      <p class="font-bold text-purple-600">💎 Bayar Instan dengan Saldo Rems</p>
      <p>Saldo akun Anda akan otomatis terpotong sebesar <b>${formatRupiah(selectedProduct.price)}</b> dan pesanan langsung diproses otomatis.</p>
    `;
  } else if (method === 'QRIS') {
    uploadSec.classList.remove('hidden');
    fileInput.required = true;
    box.innerHTML = `
      <div class="text-center space-y-2">
        <p class="font-bold text-blue-600">Scan QRIS RemsDigi (Total: ${formatRupiah(selectedProduct.price)})</p>
        <img src="/qris-remsdigi.png" onerror="this.src='https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=QRIS-REMSDIGI-083844641151'" class="w-40 h-40 mx-auto rounded-lg border-2 border-white shadow" />
        <p class="text-[11px]">Setelah transfer berhasil, wajib unggah screenshot bukti pembayaran di bawah.</p>
      </div>
    `;
  } else if (method === 'DANA' || method === 'GOPAY') {
    uploadSec.classList.remove('hidden');
    fileInput.required = true;
    box.innerHTML = `
      <p class="font-bold text-blue-600">Transfer Manual via ${method}</p>
      <div class="p-3 bg-white dark:bg-slate-900 rounded-lg border border-blue-500/30 my-1">
        <p class="text-slate-500">Nomor Tujuan ${method}:</p>
        <p class="text-base font-extrabold text-slate-900 dark:text-white tracking-wide">083844641151</p>
        <p class="font-semibold text-purple-600">A/n Ramadhani</p>
      </div>
      <p class="text-[11px]">Transfer tepat sebesar <b>${formatRupiah(selectedProduct.price)}</b> lalu upload foto bukti transfernya.</p>
    `;
  }
}

async function uploadProofImage(file, prefix) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${prefix}-${Date.now()}.${fileExt}`;
  const { error } = await supabase.storage.from('payment-proofs').upload(fileName, file);
  if (error) throw error;
  const { data } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);
  return data.publicUrl;
}

async function submitOrder(e) {
  e.preventDefault();
  const btn = document.getElementById('co-submit-btn');
  btn.disabled = true;
  btn.textContent = 'Memproses Pesanan...';

  try {
    const target = document.getElementById('co-target').value;
    const method = document.querySelector('input[name="pay_method"]:checked').value;
    const invoiceId = 'INV-' + Date.now().toString().slice(-7);
    let proofUrl = null;

    if (method === 'SALDO_REMS') {
      if ((userProfile?.balance || 0) < selectedProduct.price) {
        alert('Saldo Rems tidak mencukupi! Silakan Top Up Saldo Rems terlebih dahulu.');
        closeModal('checkout-modal');
        return openDepositModal();
      }
      // Potong Saldo Rems
      const newBalance = userProfile.balance - selectedProduct.price;
      await supabase.from('profiles').update({ balance: newBalance }).eq('id', currentUser.id);
      await fetchUserProfile();
    } else {
      const file = document.getElementById('co-proof-file').files[0];
      if (!file) throw new Error('Foto bukti transfer wajib diunggah!');
      proofUrl = await uploadProofImage(file, invoiceId);
    }

    // Simpan ke Database Supabase (Status otomatis: Diproses)
    const orderData = {
      id: invoiceId,
      user_id: currentUser.id,
      user_email: currentUser.email,
      product_name: selectedProduct.name,
      target_data: target,
      amount: selectedProduct.price,
      payment_method: method,
      proof_url: proofUrl,
      status: 'Diproses'
    };

    const { error } = await supabase.from('orders').insert([orderData]);
    if (error) throw error;

    // Di dalam submitOrder(e), ganti fetch('/api/wa-webhook', ...) menjadi:
await fetch('/api/tg-webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'NEW_ORDER', order: orderData })
});

    alert(`Pesanan ${invoiceId} berhasil masuk & sedang otomatis diproses!`);
    closeModal('checkout-modal');
    showSection('dashboard');
  } catch (err) {
    alert('Terjadi kesalahan: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Konfirmasi & Proses Pesanan';
  }
}

// ==========================================
// 6. SISTEM DEPOSIT SALDO REMS (QRIS + BUKTI TF)
// ==========================================
function openDepositModal() {
  if (!currentUser) {
    alert('Silakan login terlebih dahulu untuk top up Saldo Rems.');
    return openAuthModal();
  }
  openModal('deposit-modal');
}

async function submitDeposit(e) {
  e.preventDefault();
  const btn = document.getElementById('dep-submit-btn');
  btn.disabled = true;
  btn.textContent = 'Mengirim Bukti Deposit...';

  try {
    const amount = Number(document.getElementById('dep-amount').value);
    const file = document.getElementById('dep-proof-file').files[0];
    const depId = 'DEP-' + Date.now().toString().slice(-7);

    const proofUrl = await uploadProofImage(file, depId);

    const depositData = {
      id: depId,
      user_id: currentUser.id,
      user_email: currentUser.email,
      amount: amount,
      proof_url: proofUrl,
      status: 'Menunggu Verifikasi'
    };

    const { error } = await supabase.from('deposits').insert([depositData]);
    if (error) throw error;

    // Di dalam submitDeposit(e), ganti fetch('/api/wa-webhook', ...) menjadi:
await fetch('/api/tg-webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'NEW_DEPOSIT', deposit: depositData })
});

    alert(`Permintaan deposit ${formatRupiah(amount)} terkirim! Saldo akan bertambah setelah diverifikasi.`);
    closeModal('deposit-modal');
    showSection('dashboard');
  } catch (err) {
    alert('Gagal mengirim deposit: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Kirim Bukti Top Up Saldo';
  }
}

// ==========================================
// 7. REALTIME UPDATE STATUS DARI BOT WHATSAPP
// ==========================================
function setupRealtimeListeners() {
  supabase.channel('remsdigi-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
      if (!document.getElementById('section-dashboard').classList.contains('hidden')) loadUserHistory();
      if (!document.getElementById('section-admin').classList.contains('hidden')) loadAdminData();
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
      fetchUserProfile();
    })
    .subscribe();
}

async function loadUserHistory() {
  if (!currentUser) return;
  const { data: orders } = await supabase.from('orders').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
  const tbody = document.getElementById('user-orders-tbody');
  tbody.innerHTML = (orders || []).map(o => `
    <tr>
      <td class="py-3 px-2 font-bold">${o.id}</td>
      <td class="py-3 px-2">${o.product_name}</td>
      <td class="py-3 px-2 text-slate-500">${o.target_data}</td>
      <td class="py-3 px-2">${o.payment_method}</td>
      <td class="py-3 px-2 font-bold">${formatRupiah(o.amount)}</td>
      <td class="py-3 px-2">${getStatusBadge(o.status)}</td>
    </tr>
  `).join('');

  const { data: deposits } = await supabase.from('deposits').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
  document.getElementById('user-deposits-tbody').innerHTML = (deposits || []).map(d => `
    <tr>
      <td class="py-3 px-2 font-bold">${d.id}</td>
      <td class="py-3 px-2 font-bold text-blue-600">${formatRupiah(d.amount)}</td>
      <td class="py-3 px-2"><a href="${d.proof_url}" target="_blank" class="text-purple-600 underline">Lihat Bukti</a></td>
      <td class="py-3 px-2">${getStatusBadge(d.status)}</td>
    </tr>
  `).join('');
}

// ==========================================
// 8. ADMIN PANEL CONTROLS
// ==========================================
async function loadAdminData() {
  const { data: deposits } = await supabase.from('deposits').select('*').order('created_at', { ascending: false });
  document.getElementById('admin-deposits-tbody').innerHTML = (deposits || []).map(d => `
    <tr class="border-b dark:border-slate-800">
      <td class="py-2 font-bold">${d.id}</td>
      <td>${d.user_email}</td>
      <td class="font-bold">${formatRupiah(d.amount)}</td>
      <td><a href="${d.proof_url}" target="_blank" class="text-blue-500 underline">Foto TF</a></td>
      <td>${d.status}</td>
      <td class="space-x-1">
        ${d.status === 'Menunggu Verifikasi' ? `
          <button onclick="approveDeposit('${d.id}', '${d.user_id}', ${d.amount})" class="px-2 py-1 bg-emerald-600 text-white rounded">ACC Saldo</button>
        ` : '-'}
      </td>
    </tr>
  `).join('');

  const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  document.getElementById('admin-orders-tbody').innerHTML = (orders || []).map(o => `
    <tr class="border-b dark:border-slate-800">
      <td class="py-2 font-bold">${o.id}</td>
      <td>${o.user_email}</td>
      <td>${o.product_name}</td>
      <td>${o.target_data}</td>
      <td>${o.proof_url ? `<a href="${o.proof_url}" target="_blank" class="text-blue-500 underline">Foto</a>` : 'Saldo'}</td>
      <td>${getStatusBadge(o.status)}</td>
      <td class="space-x-1">
        <button onclick="updateOrderStatus('${o.id}', 'Selesai')" class="px-2 py-1 bg-emerald-600 text-white rounded">Selesai</button>
        <button onclick="updateOrderStatus('${o.id}', 'Gagal')" class="px-2 py-1 bg-rose-600 text-white rounded">Gagal</button>
      </td>
    </tr>
  `).join('');
}

async function approveDeposit(depId, userId, amount) {
  const { data: prof } = await supabase.from('profiles').select('balance').eq('id', userId).single();
  const updatedBalance = (prof?.balance || 0) + amount;
  await supabase.from('profiles').update({ balance: updatedBalance }).eq('id', userId);
  await supabase.from('deposits').update({ status: 'Berhasil' }).eq('id', depId);
  alert('Deposit disetujui & saldo user bertambah!');
  loadAdminData();
}

async function updateOrderStatus(orderId, status) {
  await supabase.from('orders').update({ status }).eq('id', orderId);
  loadAdminData();
}

function getStatusBadge(status) {
  if (status === 'Selesai' || status === 'Berhasil') return `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">✅ ${status}</span>`;
  if (status === 'Gagal' || status === 'Ditolak') return `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">❌ ${status}</span>`;
  return `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 animate-pulse">⏳ ${status}</span>`;
}

function formatRupiah(num) {
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

function startCountdown() {
  let seconds = 9919;
  setInterval(() => {
    seconds--;
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    document.getElementById('countdown-timer').innerHTML = `
      <span class="bg-slate-900 px-2 py-1 rounded">${h}</span>:
      <span class="bg-slate-900 px-2 py-1 rounded">${m}</span>:
      <span class="bg-slate-900 px-2 py-1 rounded">${s}</span>
    `;
  }, 1000);
}
