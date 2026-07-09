// Database Mock Produk Komplit (SMM & Premium Account)
const dataProduk = [
    { id: 1, nama: "1,000 Followers Instagram Real", kategori: "smm", harga: 25000, icon: "fa-instagram text-pink-500" },
    { id: 2, nama: "Premium Netflix 1 Bulan (Shared UltraHD)", kategori: "premium", harga: 35000, icon: "fa-netflix text-red-500" },
    { id: 3, nama: "Spotify Premium 3 Bulan (Keluarga/Individu)", kategori: "premium", harga: 45000, icon: "fa-spotify text-emerald-500" },
    { id: 4, nama: "4,000 Jam Tayang YouTube Permanen", kategori: "smm", harga: 120000, icon: "fa-youtube text-red-600" },
    { id: 5, nama: "Canva Pro 1 Tahun Bergaransi", kategori: "premium", harga: 29000, icon: "fa-crown text-amber-400" },
    { id: 6, nama: "500 Likes TikTok Instant", kategori: "smm", harga: 15000, icon: "fa-tiktok text-white" }
];

let produkTerpilih = null;
let metodeTerpilih = null;

// Render data produk ke HTML
function renderProduk(filter = "all") {
    const grid = document.getElementById("product-grid");
    grid.innerHTML = "";

    const produkDisaring = filter === "all" ? dataProduk : dataProduk.filter(p => p.kategori === filter);

    produkDisaring.forEach(p => {
        const card = document.createElement("div");
        card.className = "bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition flex flex-col justify-between group hover:-translate-y-1 duration-300 backdrop-blur-sm";
        card.innerHTML = `
            <div>
                <div class="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition">
                    <i class="fa-brands ${p.icon.includes('fa-') ? p.icon : 'fa-box text-cyan-400'}"></i>
                </div>
                <h3 class="text-lg font-bold text-white group-hover:text-cyan-400 transition tracking-tight">${p.nama}</h3>
                <p class="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">${p.kategori === 'smm' ? 'Social Media Services' : 'Premium Account'}</p>
            </div>
            <div class="mt-8 pt-5 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                    <span class="text-xs text-slate-400 block">Harga</span>
                    <span class="text-xl font-extrabold text-white">Rp ${p.harga.toLocaleString('id-ID')}</span>
                </div>
                <button onclick="openModal(${p.id})" class="bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 font-bold px-4 py-2.5 rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer">
                    Beli <i class="fa-solid fa-cart-shopping"></i>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Handler Filter Menu Kategori
function filterProduk(kategori) {
    document.querySelectorAll(".btn-filter").forEach(btn => {
        btn.classList.remove("bg-cyan-500", "text-slate-950");
        btn.classList.add("bg-slate-800", "text-slate-300");
    });
    event.currentTarget.classList.remove("bg-slate-800", "text-slate-300");
    event.currentTarget.classList.add("bg-cyan-500", "text-slate-950");
    renderProduk(kategori);
}

// Logic Modal Box Pembayaran
function openModal(id) {
    produkTerpilih = dataProduk.find(p => p.id === id);
    document.getElementById("modal-product-name").innerText = produkTerpilih.nama;
    document.getElementById("modal-product-price").innerText = `Rp ${produkTerpilih.harga.toLocaleString('id-ID')}`;
    document.getElementById("payment-modal").classList.remove("hidden");
    metodeTerpilih = null;
    document.querySelectorAll(".payment-card").forEach(c => c.className = c.className.replace(/active(-wa)?/g, ""));
}

function closeModal() {
    document.getElementById("payment-modal").classList.add("hidden");
    document.getElementById("target-input").value = "";
}

function selectPayment(metode) {
    metodeTerpilih = metode;
    const cards = document.querySelectorAll(".payment-card");
    cards.forEach(c => c.className = c.className.replace(/active(-wa)?/g, "").trim());
    
    if (metode === 'qris') {
        event.currentTarget.classList.add("active");
    } else {
        event.currentTarget.classList.add("active-wa");
    }
}

// Checkout & Integrasi Sistem Pembayaran Modern
function prosesCheckout() {
    const targetInput = document.getElementById("target-input").value.trim();
    if (!targetInput) return alert("Mohon isi data target orderan kamu!");
    if (!metodeTerpilih) return alert("Pilih metode pembayaran terlebih dahulu!");

    if (metodeTerpilih === "wa") {
        // Alur Pembayaran Ekonomis 100% Bebas Admin Fee (Via WhatsApp)
        const noWhatsAppAdmin = "6281234567890"; // GANTI DENGAN NOMOR WHATSAPP ANDA
        const teksWA = encodeURIComponent(`Halo Admin RemsDigi,\nSaya ingin melakukan order:\n\n• *Produk:* ${produkTerpilih.nama}\n• *Harga:* Rp ${produkTerpilih.harga.toLocaleString('id-ID')}\n• *Target Data:* ${targetInput}\n• *Metode:* Transfer / Manual WhatsApp\n\nMohon dibantu instruksi pembayarannya.`);
        window.open(`https://wa.me/${noWhatsAppAdmin}?text=${teksWA}`, "_blank");
    } else if (metodeTerpilih === "qris") {
        // Simulasi Integrasi Payment Gateway Otomatis (Duitku / Midtrans API)
        alert(`Sistem mengalihkan Anda ke API Payment Gateway...\n[Menghasilkan QRIS Otomatis untuk: Rp ${produkTerpilih.harga.toLocaleString('id-ID')}]`);
        
        /* 
        NOTE PENGEMBANGAN LANJUTAN:
        Untuk mengaktifkan QRIS Real-time otomatis, Anda cukup melakukan fetch API ke Duitku/Midtrans:
        fetch('/api/create-transaction', {
            method: 'POST',
            body: JSON.stringify({ amount: produkTerpilih.harga, item: produkTerpilih.nama, target: targetInput })
        }).then(res => res.json()).then(data => window.location.href = data.paymentUrl);
        */
        
        window.open("https://aswinr.github.io/sample-qris/", "_blank"); // Hanya contoh simulasi halaman QRIS sukses
    }
    closeModal();
}

// Inisialisasi awal saat website dimuat
document.addEventListener("DOMContentLoaded", () => renderProduk("all"));
