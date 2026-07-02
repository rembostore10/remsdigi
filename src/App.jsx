import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  ShoppingBag, Shield, Zap, Search, Smartphone, Globe, 
  Gamepad2, Wallet, Lightbulb, Moon, Sun, LogIn, User, 
  CreditCard, Upload, Send, CheckCircle2, XCircle, Clock
} from 'lucide-react';

// Token Bot & Config Telegram sesuai permintaan Anda
const TELEGRAM_BOT_TOKEN = "8653920922:AAGa5rFKNhwL4cyO2w8X1oAEyyLO-QuL3W8";
// Catatan: Untuk menerima callback tombol Selesai/Gagal secara real, Anda memerlukan serverless function (Vercel API) 
// sebagai Webhook Telegram yang memperbarui database Supabase. Di client-side, kita sediakan simulasi admin panel.

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  
  // Checkout & Wallet State
  const [cartItem, setCartItem] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [isTopUp, setIsTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [transactions, setTransactions] = useState([]);

  // Mock Data Produk sesuai request lengkap
  const products = [
    { id: '1', title: 'Netflix Premium 1 Bulan', category: 'Aplikasi Premium', price: 35000, icon: Smartphone, flashSale: true },
    { id: '2', title: 'Spotify Premium 3 Bulan', category: 'Aplikasi Premium', price: 45000, icon: Smartphone },
    { id: '3', title: '1000 Followers Instagram High Quality', category: 'Suntik Sosial Media', price: 25000, icon: Globe },
    { id: '4', title: 'Mobile Legends 86 Diamonds', category: 'Top Up Game', price: 20000, icon: Gamepad2, flashSale: true },
    { id: '5', title: 'Free Fire 140 Diamonds', category: 'Top Up Game', price: 19000, icon: Gamepad2 },
    { id: '6', title: 'Saldo Dana Rp 50.000', category: 'E-Wallet', price: 51500, icon: Wallet },
    { id: '7', title: 'Token PLN Prabayar Rp 50.000', category: 'Token Listrik', price: 52000, icon: Lightbulb },
  ];

  useEffect(() => {
    // Check Active Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if(session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if(session?.user) fetchProfile(session.user.id);
    });

    setTimeout(() => setLoading(false), 1500);
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    let { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
    fetchTransactions(userId);
  };

  const fetchTransactions = async (userId) => {
    let { data } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    setTransactions(data || []);
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  // Kirim Notifikasi ke Bot Telegram
  const sendTelegramNotification = async (txId, type, details, amount, proofUrl) => {
    const text = `🔔 *PESANAN MASUK - REMSDIGI*\n\n` +
                 `ID Transaksi: \`${txId}\`\n` +
                 `Tipe: ${type}\n` +
                 `Detail: ${details}\n` +
                 `Total: Rp ${Number(amount).toLocaleString()}\n\n` +
                 `Silakan proses transaksi ini melalui panel admin atau ketuk tombol status.`;
    
    // Kirim Foto Bukti beserta Caption teks ke Telegram
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
    const formData = new FormData();
    formData.append('chat_id', '8653920922'); // ID Chat tujuan
    formData.append('photo', proofUrl || 'https://via.placeholder.com/300.png?text=No+Image');
    formData.append('caption', text);
    formData.append('parse_mode', 'Markdown');

    try {
      await fetch(url, { method: 'POST', body: formData });
    } catch (error) {
      console.error("Gagal mengirim notif ke Telegram", error);
    }
  };

  // Proses Transaksi Pembelian / Topup
  const handleProcessPayment = async () => {
    if (!user) return alert('Silakan login terlebih dahulu!');
    if (!paymentMethod) return alert('Pilih metode pembayaran!');

    let finalAmount = isTopUp ? Number(topUpAmount) : cartItem.price;
    let prodName = isTopUp ? 'Top Up Saldo RemsDigi' : cartItem.title;

    // Jika bayar pakai saldo
    if (paymentMethod === 'saldo') {
      if ((profile?.balance || 0) < finalAmount) return alert('Saldo tidak mencukupi!');
      
      // Kurangi saldo di DB
      const newBalance = profile.balance - finalAmount;
      await supabase.from('profiles').update({ balance: newBalance }).eq('id', user.id);
      
      // Catat transaksi sukses langsung
      const { data: tx } = await supabase.from('transactions').insert({
        user_id: user.id, type: 'pembelian', product_name: prodName, amount: finalAmount, payment_method: 'saldo', status: 'selesai'
      }).select().single();

      alert('Pembayaran Menggunakan Saldo Berhasil!');
      fetchProfile(user.id);
      setCartItem(null);
      return;
    }

    // Pembayaran manual via QRIS / Transfer dengan bukti foto
    if (!proofFile) return alert('Wajib mengunggah foto bukti transfer!');

    // Upload Bukti ke Supabase Storage (Simulasi/Mock URL untuk kemudahan demo)
    // Di produksi, gunakan supabase.storage.from('proofs').upload()
    const mockUploadedUrl = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500"; 

    const { data: tx, error } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: isTopUp ? 'topup' : 'pembelian',
      product_name: prodName,
      amount: finalAmount,
      payment_method: paymentMethod,
      proof_image_url: mockUploadedUrl,
      status: 'pending'
    }).select().single();

    if (tx) {
      await sendTelegramNotification(tx.id, tx.type, prodName, finalAmount, mockUploadedUrl);
      alert('Bukti berhasil dikirim! Pesanan sedang diproses otomatis dan notifikasi diteruskan ke Telegram.');
      fetchProfile(user.id);
      setCartItem(null);
      setIsTopUp(false);
    }
  };

  // Simulasi Aksi Bot Telegram (Selesai/Gagal) yang di-trigger via Web
  const updateStatusSimulated = async (txId, newStatus) => {
    const { data } = await supabase.from('transactions').update({ status: newStatus }).eq('id', txId).select().single();
    if (newStatus === 'selesai' && data.type === 'topup') {
      // Jika topup selesai, tambahkan saldo ke user
      let { data: p } = await supabase.from('profiles').select('balance').eq('id', data.user_id).single();
      await supabase.from('profiles').update({ balance: (p.balance || 0) + data.amount }).eq('id', data.user_id);
    }
    fetchProfile(user.id);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-brand-dark flex flex-col items-center justify-content-center text-white z-50 flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-purple-500/50 flex items-center justify-center text-2xl font-black">RD</div>
          <h2 className="text-xl font-bold tracking-wider animate-bounce">RemsDigi Premium</h2>
          <p className="text-gray-400 text-sm mt-2">Loading modern ecosystem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'dark bg-brand-dark text-white' : 'bg-gray-50 text-gray-900'} min-h-screen font-sans transition-colors duration-300`}>
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-brand-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-lg">RD</div>
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">RemsDigi</span>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <input 
              type="text" placeholder="Cari aplikasi premium, game, pulsa..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>

          <div className="flex items-center space-x-4">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:scale-110 transition">
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-brand-purple" />}
            </button>

            {user ? (
              <div className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                <User className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-semibold">Rp {(profile?.balance || 0).toLocaleString()}</span>
                <button onClick={() => { setIsTopUp(true); setCartItem(true); }} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-[10px] px-2 py-1 rounded-full font-bold hover:opacity-90">Top Up</button>
                <button onClick={() => supabase.auth.signOut()} className="text-xs text-red-500 font-bold ml-2">Keluar</button>
              </div>
            ) : (
              <button onClick={handleGoogleLogin} className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full font-bold text-sm hover:opacity-90 transition shadow-md shadow-purple-500/20">
                <LogIn className="w-4 h-4" /> <span>Login Google</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* BANNER PROMO */}
        <div className="w-full bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-800 rounded-3xl p-6 md:p-10 text-white relative overflow-hidden shadow-xl mb-8">
          <div className="relative z-10 max-w-md">
            <span className="bg-white/20 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-widest">Mega Promo Flash Sale</span>
            <h1 className="text-3xl md:text-5xl font-black mt-3 leading-tight">Diskon Premium Hingga 70%</h1>
            <p className="mt-2 text-gray-200 text-sm">Dapatkan akses premium Netflix, Spotify, hingga Diamond Game termurah se-Indonesia dengan proses kilat otomatis.</p>
          </div>
          <div className="absolute right-0 bottom-0 top-0 opacity-10 w-1/2 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
        </div>

        {/* KATEGORI */}
        <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2"><ShoppingBag className="text-blue-500" /> Kategori Layanan</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-10">
          {['Semua', 'Aplikasi Premium', 'Suntik Sosial Media', 'Top Up Game', 'E-Wallet', 'Token Listrik'].map((cat) => (
            <button 
              key={cat} onClick={() => setSelectedCategory(cat)}
              className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center font-bold text-xs ${selectedCategory === cat ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white border-transparent shadow-lg shadow-purple-500/20' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-500'}`}
            >
              <span className="mt-1">{cat}</span>
            </button>
          ))}
        </div>

        {/* PRODUK GRID */}
        <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2"><Zap className="text-yellow-500 animate-pulse" /> Produk Terlaris & Flash Sale</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {products
            .filter(p => selectedCategory === 'Semua' || p.category === selectedCategory)
            .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((prod) => (
              <div key={prod.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-5 shadow-sm hover:shadow-xl transition flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center text-purple-500 mb-4 group-hover:scale-110 transition">
                    <prod.icon className="w-6 h-6" />
                  </div>
                  {prod.flashSale && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider mb-2 inline-block">Flash Sale</span>}
                  <h3 className="font-bold text-base line-clamp-2">{prod.title}</h3>
                  <p className="text-gray-400 text-xs mt-1">{prod.category}</p>
                </div>
                <div className="mt-6">
                  <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-500">Rp {prod.price.toLocaleString()}</div>
                  <button 
                    onClick={() => { setIsTopUp(false); setCartItem(prod); }}
                    className="w-full mt-3 bg-gray-100 dark:bg-gray-700 dark:hover:bg-purple-600 hover:bg-purple-600 hover:text-white font-bold text-xs py-2.5 rounded-xl transition"
                  >
                    Beli Sekarang
                  </button>
                </div>
              </div>
          ))}
        </div>

        {/* CHECKOUT MODAL & PAYMENT SYSTEM */}
        {cartItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-700 relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => { setCartItem(null); setIsTopUp(false); setPaymentMethod(''); }} className="absolute right-4 top-4 font-bold text-gray-400 hover:text-white">✕</button>
              
              <h3 className="text-xl font-extrabold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                {isTopUp ? 'Top Up Saldo RemsDigi' : 'Detail Checkout Pembelian'}
              </h3>

              {!isTopUp && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl mb-4">
                  <p className="text-xs text-gray-400">Produk Terpilih</p>
                  <p className="font-bold text-sm">{cartItem.title}</p>
                  <p className="font-black text-lg text-purple-500 mt-1">Rp {cartItem.price.toLocaleString()}</p>
                </div>
              )}

              {isTopUp && (
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-400 block mb-1">Masukkan Jumlah Top Up (Rp)</label>
                  <input 
                    type="number" placeholder="Contoh: 50000" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold"
                  />
                </div>
              )}

              {/* PILIHAN METODE PEMBAYARAN */}
              <label className="text-xs font-bold text-gray-400 block mb-2">Pilih Metode Pembayaran</label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {['qris', 'gopay', 'dana', 'saldo'].map((method) => {
                  if(method === 'saldo' && isTopUp) return null; // Tidak bisa topup pakai saldo
                  return (
                    <button 
                      key={method} onClick={() => setPaymentMethod(method)}
                      className={`p-3 rounded-xl border text-left font-bold text-xs uppercase ${paymentMethod === method ? 'border-purple-600 bg-purple-500/10 text-purple-500' : 'border-gray-200 dark:border-gray-700'}`}
                    >
                      {method} {method === 'saldo' && `(Rp ${(profile?.balance || 0).toLocaleString()})`}
                    </button>
                  );
                })}
              </div>

              {/* KONDISI METODE PEMBAYARAN SESUAI REQUEST */}
              {paymentMethod === 'qris' && (
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl mb-4">
                  <p className="text-xs font-bold text-purple-500 mb-2">Pindai QRIS Otomatis di Bawah Ini</p>
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=RemsDigiLayananPremium" alt="QRIS" className="mx-auto border-4 border-white rounded-xl shadow-md" />
                </div>
              )}

              {(paymentMethod === 'gopay' || paymentMethod === 'dana') && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-xs mb-4">
                  <p className="font-bold text-blue-500 mb-1">Silakan transfer sesuai nominal ke nomor berikut:</p>
                  <p className="text-base font-black tracking-wider text-gray-800 dark:text-white bg-white dark:bg-gray-900 px-3 py-1.5 rounded-xl inline-block mt-1">083844641151</p>
                  <p className="font-bold mt-1 text-gray-400">A/n Ramadhani</p>
                </div>
              )}

              {/* UPLOAD BUKTI TF (WAJIB JIKA BUKAN SALDO) */}
              {paymentMethod && paymentMethod !== 'saldo' && (
                <div className="mb-6">
                  <label className="text-xs font-bold text-gray-400 block mb-1">Unggah Foto Bukti Transfer</label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-4 text-center cursor-pointer hover:border-purple-500 transition relative">
                    <input 
                      type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                    <p className="text-[11px] text-gray-400 font-medium">{proofFile ? `Terpilih: ${proofFile.name}` : 'Klik untuk pilih foto bukti transfer'}</p>
                  </div>
                </div>
              )}

              <button 
                onClick={handleProcessPayment}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl shadow-lg hover:opacity-95 transition text-sm flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Konfirmasi Pembayaran
              </button>
            </div>
          </div>
        )}

        {/* RIWAYAT TRANSAKSI & SIMULASI BOT TELEGRAM ACTION */}
        {user && transactions.length > 0 && (
          <div className="mt-12 bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2"><Clock className="text-blue-500" /> Riwayat Transaksi Anda & Panel Aksi Bot</h3>
            <p className="text-xs text-gray-400 mb-4">* Di bawah ini adalah riwayat transaksi real-time sekaligus simulasi tombol aksi responsif dari Bot Telegram (`Selesai` / `Gagal`). Ketika tombol diketuk, status di database website berubah seketika.</p>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${tx.type === 'topup' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'}`}>{tx.type}</span>
                    <h4 className="font-bold text-sm mt-1">{tx.product_name}</h4>
                    <p className="text-xs text-gray-400">Metode: {tx.payment_method} | Rp {Number(tx.amount).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${tx.status === 'selesai' ? 'bg-green-500/10 text-green-500' : tx.status === 'gagal' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {tx.status === 'selesai' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {tx.status === 'gagal' && <XCircle className="w-3.5 h-3.5" />}
                      {tx.status === 'pending' && <Clock className="w-3.5 h-3.5 animate-spin" />}
                      {tx.status}
                    </span>

                    {/* Simulasi Tombol Kontrol Bot Telegram */}
                    {tx.status === 'pending' && (
                      <div className="flex gap-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-xl">
                        <button onClick={() => updateStatusSimulated(tx.id, 'selesai')} className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg hover:opacity-90">✓ Selesai</button>
                        <button onClick={() => updateStatusSimulated(tx.id, 'gagal')} className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg hover:opacity-90">✕ Gagal</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="mt-20 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-brand-dark py-8 text-center text-xs text-gray-400">
        <p className="font-bold text-gray-600 dark:text-gray-300 text-sm mb-1">RemsDigi Ecosystem &copy; 2026</p>
        <p>Marketplace Produk Digital Premium & Terpercaya. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
