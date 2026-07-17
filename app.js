// Data Layanan SMM Dummy Internal
const SMM_SERVICES = {
    tiktok: [
        { id: "tk-fol", name: "TikTok Followers [Real] — Rp 15", price: 15 },
        { id: "tk-lik", name: "TikTok Likes [Super Fast] — Rp 5", price: 5 }
    ],
    instagram: [
        { id: "ig-fol", name: "Instagram Followers [Garansi] — Rp 20", price: 20 }
    ]
};

// State User App global
let currentUser = null;
let currentBalance = 500000; // Default saldo dummy jika profile baru

// ================= DOM INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
    checkAuthState();
    setupEventListeners();
});

// Memantau perubahan status login Supabase Auth
function checkAuthState() {
    supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
            currentUser = session.user;
            document.getElementById("page-login").classList.add("hidden");
            document.getElementById("main-panel").classList.remove('hidden');
            
            // Set data profile di UI
            document.getElementById("user-email-display").innerText = currentUser.email;
            document.getElementById("user-avatar").innerText = currentUser.email.substring(0,2).toUpperCase();
            
            loadDashboardData();
            switchPage('dashboard');
        } else {
            currentUser = null;
            document.getElementById("main-panel").classList.add("hidden");
            document.getElementById("page-login").classList.remove('hidden');
        }
    });
}

function setupEventListeners() {
    // Event Login Email
    document.getElementById("form-login").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const pass = document.getElementById("login-password").value;
        try {
            await signInWithEmail(email, pass);
        } catch (error) {
            alert("Gagal Login: " + error.message);
        }
    });

    // Event Login Google
    document.getElementById("btn-google-login").addEventListener("click", async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            alert("Google OAuth Error: " + error.message);
        }
    });

    // Event Logout
    document.getElementById("btn-logout").addEventListener("click", async () => {
        if(confirm("Keluar dari Remsdigi?")) await logoutUser();
    });

    // Event dinamis kategori di form order
    document.getElementById("order-category").addEventListener("change", (e) => {
        populateServices(e.target.value);
    });

    // Event hitung harga saat jumlah / opsi berubah
    document.getElementById("layanan").addEventListener("change", hitungTotal);
    document.getElementById("jumlah").addEventListener("input", hitungTotal);

    // Event form order submit
    document.getElementById("form-order").addEventListener("submit", handleOrderSubmit);
}

// ================= LOGIKA CORE PROGRAM =================

function populateServices(category) {
    const serviceSelect = document.getElementById("layanan");
    serviceSelect.innerHTML = "";
    
    if(!SMM_SERVICES[category]) return;
    
    SMM_SERVICES[category].forEach(srv => {
        const opt = document.createElement("option");
        opt.value = srv.price;
        opt.dataset.name = srv.name;
        opt.innerText = srv.name;
        serviceSelect.appendChild(opt);
    });
    hitungTotal();
}

function hitungTotal() {
    const hargaPerQty = parseFloat(document.getElementById('layanan').value) || 0;
    const jumlah = parseInt(document.getElementById('jumlah').value) || 0;
    const total = hargaPerQty * jumlah;
    
    document.getElementById('total-harga').innerText = formatRupiah(total);
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    const serviceSelect = document.getElementById("layanan");
    const selectedOpt = serviceSelect.options[serviceSelect.selectedIndex];
    
    const serviceName = selectedOpt.dataset.name;
    const pricePerQty = parseFloat(serviceSelect.value);
    const qty = parseInt(document.getElementById("jumlah").value);
    const target = document.getElementById("order-target").value;
    const totalCost = pricePerQty * qty;

    if (currentBalance < totalCost) {
        alert("Saldo anda tidak mencukupi!");
        return;
    }

    // 1. Potong Saldo Lokal
    currentBalance -= totalCost;

    // 2. Simpan ke Supabase Database (`orders` table)
    try {
        const { error } = await supabase.from('orders').insert([
            { 
                user_id: currentUser.id, 
                layanan: serviceName, 
                jumlah: qty, 
                harga: totalCost, 
                status: 'Processing',
                target: target
            }
        ]);

        if (error) throw error;
        
        alert("Pesanan berhasil dikirim dan masuk antrean!");
        document.getElementById("form-order").reset();
        
        // Refresh data dashboard & riwayat langsung tanpa reload halaman
        loadDashboardData();
        switchPage('riwayat');
        
    } catch (err) {
        alert("Database error: " + err.message);
    }
}

async function loadDashboardData() {
    // Update Tampilan Saldo
    document.getElementById("user-balance").innerText = formatRupiah(currentBalance);

    try {
        // Ambil Data Riwayat dari Supabase
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Injeksi Baris ke Tabel Riwayat
        const tbody = document.getElementById("table-history-body");
        tbody.innerHTML = "";

        let totalSpent = 0;
        let activeProcess = 0;

        orders.forEach((ord, index) => {
            totalSpent += ord.harga;
            if(ord.status === 'Processing') activeProcess++;

            const row = `
                <tr class="hover:bg-gray-800/30">
                    <td class="px-6 py-4 font-semibold">#${ord.id.toString().substring(0, 5)}</td>
                    <td class="px-6 py-4">${ord.layanan}</td>
                    <td class="px-6 py-4">${ord.jumlah.toLocaleString()}</td>
                    <td class="px-6 py-4 text-cyan-400">${formatRupiah(ord.harga)}</td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 text-[10px] font-bold ${ord.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'} rounded-full">
                            ${ord.status}
                        </span>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        // Hitung & Pasang Statistik di Dashboard Utama
        document.getElementById("stat-total-orders").innerText = orders.length;
        document.getElementById("stat-process-orders").innerText = activeProcess;
        document.getElementById("stat-total-spent").innerText = formatRupiah(totalSpent);

    } catch(err) {
        console.error("Gagal mengambil data riwayat:", err.message);
    }
}

// Helper Utilities
function switchPage(pageId) {
    document.querySelectorAll('.page-content').forEach(s => s.classList.add('hidden'));
    document.getElementById(`content-${pageId}`).classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white', 'shadow-lg');
        btn.classList.add('text-gray-400');
    });
    const activeBtn = document.getElementById(`nav-${pageId}`);
    if (activeBtn) activeBtn.classList.add('bg-blue-600', 'text-white');
    
    if(pageId === 'pemesanan') populateServices('tiktok');
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
    document.getElementById('sidebar-overlay').classList.toggle('hidden');
}

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}
