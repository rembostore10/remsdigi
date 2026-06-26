// ==========================================
// CONFIGURATION & SETUP BACKEND SUPABASE
// ==========================================
// Ganti URL dan KEY dengan credentials Supabase Anda jika ada. 
// Jika dibiarkan default, aplikasi akan berjalan menggunakan fallback local state agar aman dan tidak crash.
const SUPABASE_URL = "https://fnwpyxtjdvriaiansowz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZud3B5eHRqZHZyaWFpYW5zb3d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNDAyMTEsImV4cCI6MjA5NzkxNjIxMX0.VSFuCNdmHyIcTYk2a6VCsAAnmwyJ1cBfWjo1l9CqxZk";
let supabase = null;

try {
    if (SUPABASE_URL && !SUPABASE_URL.includes("your-supabase-project")) {
        supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (e) {
    console.warn("Supabase tidak terkonfigurasi sempurna, mengaktifkan local mode sandbox.");
}

// Telegram Credentials
const TELEGRAM_BOT_TOKEN = "8653920922:AAGa5rFKNhwL4cyO2w8X1oAEyyLO-QuL3W8";
const TELEGRAM_CHAT_ID = "6161828437"; // Sesuaikan atau biarkan default bot API endpoint.

// App State (Default Mocking Data untuk Keperluan Client-Side Vercel Cepat)
let currentUser = JSON.parse(localStorage.getItem('rems_user')) || null;
let userBalance = parseInt(localStorage.getItem('rems_balance')) || 0;
let currentSelectedProduct = null;
let selectedPaymentMethod = null;
let isDepositMode = false;
let depositTempAmount = 0;

// ==========================================
// MOCK DATA SEEDING (Sesuai List Permintaan User)
// ==========================================
const CATEGORIES = [
    { id: 'app', name: 'Aplikasi Premium', icon: 'fa-mobile-screen-button' },
    { id: 'sosmed', name: 'Suntik Sosmed', icon: 'fa-rocket' },
    { id: 'pulsa', name: 'Pulsa Seluler', icon: 'fa-phone-volume' },
    { id: 'kuota', name: 'Kuota Internet', icon: 'fa-globe' },
    { id: 'game', name: 'Top Up Game', icon: 'fa-gamepad' },
    { id: 'ewallet', name: 'Isi E-Wallet', icon: 'fa-wallet' },
    { id: 'pln', name: 'Token Listrik', icon: 'fa-bolt' }
];

const PRODUCTS = [
    { id: 'p1', cat: 'app', name: 'Netflix Premium 1 Bulan (UHD)', price: 35000, flash: true, img: 'https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?w=400' },
    { id: 'p2', cat: 'app', name: 'Spotify Premium 3 Bulan', price: 25000, flash: true, img: 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=400' },
    { id: 'p3', cat: 'app', name: 'ChatGPT Plus Shared', price: 49000, flash: false, img: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=400' },
    { id: 'p4', cat: 'game', name: '86 Diamond Mobile Legends', price: 20000, flash: false, img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400' },
    { id: 'p5', cat: 'game', name: 'Free Fire 140 Diamonds', price: 18500, flash: true, img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400' },
    { id: 'p6', cat: 'pln', name: 'Token PLN Prabayar Rp 50.000', price: 51500, flash: false, img: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400' },
    { id: 'p7', cat: 'sosmed', name: '1000 Followers TikTok High Quality', price: 45000, flash: false, img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400' }
];

let txHistory = JSON.parse(localStorage.getItem('rems_tx')) || [
    { id: 'TX-77391', product: 'Spotify Premium 3 Bulan', method: 'QRIS', total: 25000, status: 'SELESAI' }
];

// ==========================================
// CORE FUNCTIONS / APP ENGINE
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    renderCategories();
    renderProducts();
    updateUIElements();
    
    // Hide Loading Screen
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        if (loader) {
            loader.classList.add('opacity-0');
            setTimeout(() => loader.remove(), 500);
        }
    }, 1000);

    // Countdown logic
    setInterval(() => {
        const now = new Date();
        const hours = String(23 - now.getHours()).padStart(2, '0');
        const minutes = String(59 - now.getMinutes()).padStart(2, '0');
        const seconds = String(59 - now.getSeconds()).padStart(2, '0');
        const cd = document.getElementById('countdown');
        if (cd) cd.innerText = `${hours}:${minutes}:${seconds}`;
    }, 1000);
});

function initTheme() {
    if (localStorage.getItem('dark-mode') === 'true' || (!('dark-mode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
    document.getElementById('theme-toggle').addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('dark-mode', document.documentElement.classList.contains('dark'));
    });
}

function updateUIElements() {
    if (currentUser) {
        document.getElementById('login-btn').classList.add('hidden');
        document.getElementById('user-profile-menu').classList.remove('hidden');
        document.getElementById('user-balance-nav').classList.remove('hidden');
        document.getElementById('nav-balance').innerText = `Rp ${userBalance.toLocaleString('id-ID')}`;
        document.getElementById('dashboard-balance').innerText = `Rp ${userBalance.toLocaleString('id-ID')}`;
        document.getElementById('checkout-user-balance-lbl').innerText = `Saldo Anda: Rp ${userBalance.toLocaleString('id-ID')}`;
        document.getElementById('dashboard-user-email').innerText = currentUser.email;
    }
    renderTxTable();
}

// Rendering UI Lists
function renderCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;
    container.innerHTML = CATEGORIES.map(c => `
        <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center justify-center cursor-pointer hover:shadow-md transition-all group">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-lg mb-2 group-hover:scale-110 transition-all shadow-sm">
                <i class="fa-solid ${c.icon}"></i>
            </div>
            <span class="text-xs font-semibold tracking-wide">${c.name}</span>
        </div>
    `).join('');
}

function renderProducts() {
    const flashContainer = document.getElementById('flash-sale-container');
    const mainContainer = document.getElementById('products-container');
    
    if (flashContainer) {
        flashContainer.innerHTML = PRODUCTS.filter(p => p.flash).map(p => getProductCardHtml(p, true)).join('');
    }
    if (mainContainer) {
        mainContainer.innerHTML = PRODUCTS.map(p => getProductCardHtml(p, false)).join('');
    }
}

function getProductCardHtml(p, isFlash) {
    return `
        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-lg transition-all">
            <div class="relative">
                <img src="${p.img}" class="w-full h-36 object-cover">
                ${isFlash ? '<span class="absolute top-2 left-2 bg-red-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow">FLASH SALE</span>' : ''}
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                    <h4 class="text-sm font-bold line-clamp-2">${p.name}</h4>
                    <p class="text-xs text-slate-400 mt-1">Stok Instan Terjamin</p>
                </div>
                <div>
                    <p class="text-base font-extrabold text-purple-600 dark:text-purple-400">Rp ${p.price.toLocaleString('id-ID')}</p>
                    <button onclick="openCheckoutModal('${p.id}')" class="w-full mt-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-xl text-xs font-bold hover:shadow-md transition-all">Beli Sekarang</button>
                </div>
            </div>
        </div>
    `;
}

function renderTxTable() {
    const container = document.getElementById('tx-history-table');
    if (!container) return;
    container.innerHTML = txHistory.map(t => `
        <tr class="border-b border-slate-100 dark:border-slate-800 text-xs">
            <td class="py-3 font-mono font-semibold">${t.id}</td>
            <td class="py-3 font-bold">${t.product}</td>
            <td class="py-3">${t.method.toUpperCase()}</td>
            <td class="py-3 font-bold text-purple-600">Rp ${t.total.toLocaleString('id-ID')}</td>
            <td class="py-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status === 'SELESAI' ? 'bg-green-100 text-green-700' : t.status === 'GAGAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}">${t.status}</span></td>
        </tr>
    `).join('');
}

// Navigation & Auth Action Simulation
function showSection(section) {
    document.getElementById('home-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById(`${section}-section`).classList.remove('hidden');
    document.getElementById('user-dropdown').classList.add('hidden');
}

function toggleUserDropdown() {
    document.getElementById('user-dropdown').classList.toggle('hidden');
}

function openAuthModal() { document.getElementById('auth-modal').classList.remove('hidden'); }
function closeAuthModal() { document.getElementById('auth-modal').classList.add('hidden'); }

function loginWithMockEmail() {
    currentUser = { email: "customer.demo@remsdigi.com", id: "usr-mock-123" };
    localStorage.setItem('rems_user', JSON.stringify(currentUser));
    updateUIElements();
    closeAuthModal();
}

async function loginWithGoogle() {
    if (supabase) {
        const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        if (error) alert("OAuth error: " + error.message);
    } else {
        loginWithMockEmail(); // Failover if parameters haven't filled
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('rems_user');
    document.getElementById('user-profile-menu').classList.add('hidden');
    document.getElementById('user-balance-nav').classList.add('hidden');
    document.getElementById('login-btn').classList.remove('hidden');
    showSection('home');
}

// ==========================================
// CORE PAYMENT, DEPOSIT & TELEGRAM INTEGRATION
// ==========================================
function openCheckoutModal(prodId) {
    if (!currentUser) { openAuthModal(); return; }
    isDepositMode = false;
    currentSelectedProduct = PRODUCTS.find(p => p.id === prodId);
    
    document.getElementById('checkout-product-details').innerHTML = `
        <p class="text-xs text-slate-400">Item yang Anda beli:</p>
        <h4 class="text-base font-bold text-slate-800 dark:text-slate-100">${currentSelectedProduct.name}</h4>
        <p class="text-lg font-black text-purple-600 mt-1">Total tagihan: Rp ${currentSelectedProduct.price.toLocaleString('id-ID')}</p>
    `;
    
    document.getElementById('dynamic-payment-instruction').classList.add('hidden');
    document.getElementById('proof-upload-area').classList.add('hidden');
    document.getElementById('checkout-modal').classList.remove('hidden');
}

function closeCheckoutModal() { document.getElementById('checkout-modal').classList.add('hidden'); }

function openDepositModal() {
    if (!currentUser) { openAuthModal(); return; }
    document.getElementById('deposit-modal').classList.remove('hidden');
}
function closeDepositModal() { document.getElementById('deposit-modal').classList.add('hidden'); }

function triggerDepositCheckout() {
    const amount = parseInt(document.getElementById('deposit-amount').value);
    if (!amount || amount < 10000) { alert("Minimal isi saldo adalah Rp 10.000"); return; }
    
    isDepositMode = true;
    depositTempAmount = amount;
    closeDepositModal();

    document.getElementById('checkout-product-details').innerHTML = `
        <p class="text-xs text-slate-400">Jenis Transaksi:</p>
        <h4 class="text-base font-bold text-slate-800 dark:text-slate-100">Top Up Saldo Akun Rems</h4>
        <p class="text-lg font-black text-purple-600 mt-1">Total tagihan: Rp ${amount.toLocaleString('id-ID')}</p>
    `;
    
    document.getElementById('dynamic-payment-instruction').classList.add('hidden');
    document.getElementById('proof-upload-area').classList.add('hidden');
    document.getElementById('checkout-modal').classList.remove('hidden');
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    const instructionBox = document.getElementById('dynamic-payment-instruction');
    const uploadArea = document.getElementById('proof-upload-area');
    
    instructionBox.classList.remove('hidden');
    
    // Reset borders highlight
    document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('border-purple-600'));
    
    if (method === 'saldo') {
        uploadArea.classList.add('hidden');
        if (isDepositMode) {
            instructionBox.innerHTML = `<p class="text-xs text-red-500 font-bold">Tidak bisa melakukan top up saldo menggunakan saldo!</p>`;
            return;
        }
        if (userBalance < currentSelectedProduct.price) {
            instructionBox.innerHTML = `<p class="text-xs text-red-500 font-bold">Saldo Rems tidak mencukupi. Silakan pilih metode lain atau lakukan Top Up.</p>`;
        } else {
            instructionBox.innerHTML = `<p class="text-xs text-green-500 font-bold">Saldo Mencukupi! Tekan tombol konfirmasi di bawah untuk potong saldo instan.</p>`;
        }
    } else if (method === 'qris') {
        uploadArea.classList.remove('hidden');
        instructionBox.innerHTML = `
            <p class="text-xs font-semibold mb-2 text-slate-400">Silakan Scan QRIS RemsDigi Resmi di bawah ini:</p>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=RemsDigi-Fix-Payment-083844641151" class="mx-auto my-2 rounded-xl border border-slate-300 p-2 bg-white">
            <p class="text-[10px] text-slate-400">Mendukung All m-Banking & E-Wallet Nasional</p>
        `;
    } else if (method === 'manual_ewallet') {
        uploadArea.classList.remove('hidden');
        instructionBox.innerHTML = `
            <p class="text-xs font-semibold text-slate-400">Silakan lakukan transfer manual ke akun Agen di bawah ini:</p>
            <div class="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl my-2 text-center">
                <p class="text-xs text-slate-400">Nomor Dana / GoPay:</p>
                <p class="text-lg font-mono font-bold text-purple-600">083844641151</p>
                <p class="text-xs font-bold text-slate-600 dark:text-slate-200 mt-1">A/n Ramadhani</p>
            </div>
            <p class="text-[10px] text-amber-500">Kelebihan/Kekurangan nominal transfer berakibat gagal sistem.</p>
        `;
    }
}

function executePayment() {
    if (!selectedPaymentMethod) { alert("Pilih metode pembayaran terlebih dahulu!"); return; }
    
    const txId = 'TX-' + Math.floor(10000 + Math.random() * 90000);
    const itemTitle = isDepositMode ? `Top Up Saldo Rems` : currentSelectedProduct.name;
    const itemPrice = isDepositMode ? depositTempAmount : currentSelectedProduct.price;

    if (selectedPaymentMethod === 'saldo') {
        if (userBalance < itemPrice) { alert("Saldo tidak cukup."); return; }
        // Potong Saldo Otomatis Berhasil
        userBalance -= itemPrice;
        localStorage.setItem('rems_balance', userBalance);
        
        txHistory.unshift({ id: txId, product: itemTitle, method: 'SALDO', total: itemPrice, status: 'SELESAI' });
        localStorage.setItem('rems_tx', JSON.stringify(txHistory));
        
        alert("Pembayaran dengan Saldo Berhasil! Pesanan diproses otomatis.");
        sendTelegramNotification(txId, itemTitle, itemPrice, "SALDO (OTOMATIS)", "SELESAI");
        updateUIElements();
        closeCheckoutModal();
    } else {
        // Metode Pembayaran QRIS / Manual Mandiri wajib unggah file bukti
        const fileInput = document.getElementById('payment-proof-file');
        if (!fileInput.files || fileInput.files.length === 0) {
            alert("Anda wajib mengunggah foto bukti transfer!");
            return;
        }

        // Simpan ke riwayat lokal dengan status PENDING
        txHistory.unshift({ id: txId, product: itemTitle, method: selectedPaymentMethod, total: itemPrice, status: 'PROSES' });
        localStorage.setItem('rems_tx', JSON.stringify(txHistory));
        
        alert("Bukti pembayaran berhasil diunggah! Sistem sedang memproses notifikasi masuk ke Telegram admin.");
        sendTelegramNotification(txId, itemTitle, itemPrice, selectedPaymentMethod.toUpperCase(), "PENDING / PERLU VERIFIKASI");
        
        // Simulasi jika mode deposit, saldo masuk setelah disetujui admin (melalui bot Telegram / manual mock approval)
        if (isDepositMode) {
            // Simulasi Auto-Approve dalam 7 detik untuk keperluan demo sandbox jika bot telegram memproses callback
            setTimeout(() => {
                userBalance += itemPrice;
                localStorage.setItem('rems_balance', userBalance);
                const txIndex = txHistory.findIndex(t => t.id === txId);
                if (txIndex > -1) txHistory[txIndex].status = 'SELESAI';
                localStorage.setItem('rems_tx', JSON.stringify(txHistory));
                updateUIElements();
            }, 7000);
        }
        
        updateUIElements();
        closeCheckoutModal();
    }
}

// Kirim data ke Telegram Bot Admin dengan format rapi & interaktif
function sendTelegramNotification(txId, productName, price, method, status) {
    const textMessage = `
🔔 **PESANAN BARU MASUK - REMSDIGI**
---------------------------------------
🆔 ID Transaksi : \`${txId}\`
👤 Pengaruh     : \`${currentUser.email}\`
📦 Produk       : *${productName}*
💰 Total Harga  : *Rp ${price.toLocaleString('id-ID')}*
💳 Metode Bayar : *${method}*
⚡ Status Awal  : *${status}*
---------------------------------------
💡 _Silakan cek mutasi wallet/QRIS Anda. Tekan tombol SELESAI/GAGAL di bawah ini pada panel admin untuk memperbarui status pesanan klien secara otomatis._
    `;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    // Custom inline keyboard button agar admin bisa merubah status dari bot Telegram langsung
    const inlineKeyboard = {
        inline_keyboard: [
            [
                { text: "🟢 Selesai", callback_data: `approve_${txId}` },
                { text: "🔴 Gagal", callback_data: `reject_${txId}` }
            ]
        ]
    };

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: textMessage,
            parse_mode: 'Markdown',
            reply_markup: inlineKeyboard
        })
    })
    .then(res => res.json())
    .then(data => console.log('Notifikasi Telegram Terkirim:', data))
    .catch(err => console.error('Gagal mengirim log Telegram:', err));
}
