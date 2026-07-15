// Data Dummy untuk struktur awal sebelum digabungkan dengan response API v1pedia
// Catatan: Di produksi, data ini diambil langsung dari endpoint layanan v1pedia.
const mockServicesFromApi = [
    { id: 101, category: "tiktok", type: "followers", name: "TikTok Followers [Real / Murah]", pricePer1000: 25000, min: 100, max: 10000, desc: "Proses 1-24 jam, Garansi 30 hari." },
    { id: 102, category: "tiktok", type: "followers", name: "TikTok Followers [Sultan / Instant]", pricePer1000: 45000, min: 500, max: 50000, desc: "Instant masuk, No drop." },
    { id: 103, category: "tiktok", type: "likes", name: "TikTok Likes [High Quality]", pricePer1000: 12000, min: 50, max: 5000, desc: "Meningkatkan engagement VT Anda." },
    { id: 104, category: "tiktok", type: "views", name: "TikTok Views [Super Flash]", pricePer1000: 500, min: 1000, max: 100000, desc: "Sangat cepat, cocok untuk kejar FYP." },
    { id: 201, category: "instagram", type: "followers", name: "Instagram Followers Indo [Aktif]", pricePer1000: 35000, min: 100, max: 5000, desc: "Akun Indonesia asli." },
    { id: 202, category: "instagram", type: "likes", name: "Instagram Likes [Garansi]", pricePer1000: 8000, min: 50, max: 10000, desc: "Drop? Auto refill." },
    { id: 301, category: "youtube", type: "views", name: "YouTube Views [No Drop]", pricePer1000: 60000, min: 1000, max: 20000, desc: "Aman untuk Monetisasi." }
];

// DOM Elements
const categorySelect = document.getElementById('categorySelect');
const typeSelect = document.getElementById('typeSelect');
const serviceSelect = document.getElementById('serviceSelect');
const quantityInput = document.getElementById('quantityInput');
const quantityLimit = document.getElementById('quantityLimit');
const serviceDesc = document.getElementById('serviceDesc');
const totalPriceText = document.getElementById('totalPrice');
const orderForm = document.getElementById('orderForm');

let currentFilteredServices = [];
let selectedService = null;

// 1. Event jika kategori berubah
categorySelect.addEventListener('change', (e) => {
    const category = e.target.value;
    typeSelect.innerHTML = '<option value="">-- Pilih Tipe --</option>';
    serviceSelect.innerHTML = '<option value="">-- Pilih Varian --</option>';
    serviceSelect.disabled = true;
    quantityInput.disabled = true;
    resetCalculator();

    if (category) {
        typeSelect.disabled = false;
        // Dapatkan tipe unik dari kategori yang dipilih (followers, likes, atau views)
        const types = [...new Set(mockServicesFromApi.filter(s => s.category === category).map(s => s.type))];
        types.forEach(type => {
            const opt = document.createElement('option');
            opt.value = type;
            opt.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            typeSelect.appendChild(opt);
        });
    } else {
        typeSelect.disabled = true;
    }
});

// 2. Event jika tipe berubah
typeSelect.addEventListener('change', (e) => {
    const type = e.target.value;
    const category = categorySelect.value;
    serviceSelect.innerHTML = '<option value="">-- Pilih Varian --</option>';
    quantityInput.disabled = true;
    resetCalculator();

    if (type) {
        serviceSelect.disabled = false;
        currentFilteredServices = mockServicesFromApi.filter(s => s.category === category && s.type === type);
        currentFilteredServices.forEach(service => {
            const opt = document.createElement('option');
            opt.value = service.id;
            opt.textContent = `${service.name} - Rp ${service.pricePer1000.toLocaleString('id-ID')}/1000`;
            serviceSelect.appendChild(opt);
        });
    } else {
        serviceSelect.disabled = true;
    }
});

// 3. Event jika varian service dipilih
serviceSelect.addEventListener('change', (e) => {
    const serviceId = parseInt(e.target.value);
    selectedService = currentFilteredServices.find(s => s.id === serviceId);

    if (selectedService) {
        quantityInput.disabled = false;
        quantityLimit.textContent = `Minimal pembelian: ${selectedService.min} | Maksimal: ${selectedService.max}`;
        serviceDesc.textContent = `Info: ${selectedService.desc}`;
        serviceDesc.classList.remove('hidden');
        calculatePrice();
    } else {
        resetCalculator();
    }
});

// 4. Kalkulasi harga berdasarkan input manual jumlah item
quantityInput.addEventListener('input', calculatePrice);

function calculatePrice() {
    if (!selectedService || !quantityInput.value) {
        totalPriceText.textContent = 'Rp 0';
        return;
    }

    const qty = parseInt(quantityInput.value);
    
    // Rumus kalkulasi harga panel SMM: (Jumlah / 1000) * Harga per 1000
    const calculatedPrice = (qty / 1000) * selectedService.pricePer1000;

    if (qty > 0) {
        totalPriceText.textContent = `Rp ${Math.round(calculatedPrice).toLocaleString('id-ID')}`;
    } else {
        totalPriceText.textContent = 'Rp 0';
    }
}

function resetCalculator() {
    quantityInput.value = '';
    quantityLimit.textContent = '';
    serviceDesc.textContent = '';
    serviceDesc.classList.add('hidden');
    totalPriceText.textContent = 'Rp 0';
    selectedService = null;
}

// 5. Submit Form & Integrasi API Penempatan Pesanan (Order)
orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const target = document.getElementById('targetInput').value;
    const qty = parseInt(quantityInput.value);

    // Validasi Min/Max quantity
    if (qty < selectedService.min || qty > selectedService.max) {
        alert(`Jumlah pesanan tidak valid! Harus di antara ${selectedService.min} dan ${selectedService.max}`);
        return;
    }

    // Payload data untuk dikirim ke API V1pedia
    // Berdasarkan dokumentasi v1pedia.com/page/api_documentation
    const orderPayload = {
        api_id: 'CONTOH_API_ID_ANDA',     // Ganti dengan API ID dari profile V1pedia Anda
        api_key: 'CONTOH_API_KEY_ANDA',   // Ganti dengan API Key dari profile V1pedia Anda
        service: selectedService.id,      // ID layanan dari v1pedia
        target: target,                   // Link target inputan pembeli
        quantity: qty                     // Jumlah inputan manual pembeli
    };

    alert(`Pesanan Berhasil Dibuat!\nLayanan: ${selectedService.name}\nTarget: ${target}\nJumlah: ${qty}\nTotal Bayar: ${totalPriceText.textContent}`);

    // PENTING: Karena masalah CORS pada browser, pengiriman ini idealnya diarahkan ke 
    // endpoint Backend Anda terlebih dahulu (seperti Node.js/PHP) baru diteruskan ke v1pedia.
    /* try {
        const response = await fetch('https://v1pedia.com/api/order', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });
        const resData = await response.json();
        if(resData.status) {
             alert('Pesanan diproses! ID Order: ' + resData.data.id);
        } else {
             alert('Gagal: ' + resData.message);
        }
    } catch (err) {
        console.error(err);
    }
    */
});
