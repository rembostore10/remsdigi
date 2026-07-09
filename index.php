<?php include 'koneksi.php'; ?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SosmedBooster - Jual Suntik Followers & Likes</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
</head>
<body class="bg-gray-900 text-gray-100 font-sans">

    <!-- Navbar -->
    <nav class="bg-gray-800 p-4 border-b border-gray-700">
        <div class="container mx-auto flex justify-between items-center">
            <a href="#" class="text-xl font-bold text-blue-500">Sosmed<span class="text-white">Booster</span></a>
            <span class="text-sm bg-green-500 text-black font-semibold px-3 py-1 rounded-full">Server Online</span>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="container mx-auto max-w-4xl text-center my-12 px-4">
        <h1 class="text-4xl font-extrabold md:text-5xl tracking-tight">
            Tingkatkan <span class="text-blue-500">Social Media Engagement</span> Anda Instan!
        </h1>
        <p class="mt-4 text-gray-400 text-lg">Layanan suntik Followers, Likes, dan Views termurah dan bergaransi.</p>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto max-w-4xl px-4 grid md:grid-cols-2 gap-8 mb-12">
        
        <!-- Form Order -->
        <section class="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700">
            <h2 class="text-xl font-bold mb-4 text-blue-400">🛒 Form Pemesanan</h2>
            <form action="order.php" method="POST" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-1">Target (Username/Link Video)</label>
                    <input type="text" name="target" required placeholder="Contoh: @username atau link post" 
                        class="w-full p-3 bg-gray-950 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-1">Pilih Layanan</label>
                    <select name="layanan" required class="w-full p-3 bg-gray-950 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white">
                        <option value="IG-Followers-1000">Instagram Followers [1000] - Rp 15.000</option>
                        <option value="IG-Likes-1000">Instagram Likes [1000] - Rp 5.000</option>
                        <option value="TT-Followers-1000">TikTok Followers [1000] - Rp 25.000</option>
                        <option value="TT-Views-10000">TikTok Views [10.000] - Rp 3.000</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-1">Jumlah Pesanan</label>
                    <input type="number" name="jumlah" min="100" required placeholder="Minimal 100" 
                        class="w-full p-3 bg-gray-950 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-1">Nomor WhatsApp Anda</label>
                    <input type="text" name="whatsapp" required placeholder="Contoh: 08123456789" 
                        class="w-full p-3 bg-gray-950 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white">
                </div>

                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-lg shadow-blue-900/40">
                    Order Sekarang via WhatsApp
                </button>
            </form>
        </section>

        <!-- Price List / Keunggulan -->
        <section class="space-y-6">
            <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <h3 class="text-lg font-bold text-white mb-2">⚡ Proses Kilat</h3>
                <p class="text-sm text-gray-400">Pesanan diproses otomatis dalam 1-10 menit setelah pembayaran dikonfirmasi.</p>
            </div>
            <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <h3 class="text-lg font-bold text-white mb-2">🔒 Aman 100%</h3>
                <p class="text-sm text-gray-400">Hanya membutuhkan username atau link. Kami tidak pernah meminta password akun Anda.</p>
            </div>
            <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <h3 class="text-lg font-bold text-white mb-2">💳 Pembayaran Fleksibel</h3>
                <p class="text-sm text-gray-400">Mendukung QRIS, Dana, OVO, GOPAY, ShopeePay, dan Transfer Bank.</p>
            </div>
        </section>

    </main>

    <footer class="text-center text-gray-600 text-xs py-6 border-t border-gray-800">
        &copy; 2026 SosmedBooster. All rights reserved.
    </footer>

</body>
</html>
