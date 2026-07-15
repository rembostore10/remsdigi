'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

// Mock data v1pedia (Silakan fetch dari API v1pedia langsung pada implementasi aslinya)
const services = [
  { id: 101, category: "tiktok", type: "followers", name: "TikTok Followers [Murah]", pricePer1000: 25000, min: 100, max: 10000 },
  { id: 103, category: "tiktok", type: "likes", name: "TikTok Likes [HQ]", pricePer1000: 12000, min: 50, max: 5000 },
  { id: 201, category: "instagram", type: "followers", name: "IG Followers Indo", pricePer1000: 35000, min: 100, max: 5000 },
];

export default function Home() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [target, setTarget] = useState('');
  const [quantity, setQuantity] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    async function checkUserAndFetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        // Fetch riwayat pesanan dari Supabase
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (orders) setOrderHistory(orders);
      }
      setLoading(false);
    }
    checkUserAndFetchData();
  }, [supabase]);

  // Kalkulasi harga realtime
  useEffect(() => {
    if (selectedService && quantity) {
      const price = (parseInt(quantity) / 1000) * selectedService.pricePer1000;
      setTotalPrice(Math.round(price) || 0);
    } else {
      setTotalPrice(0);
    }
  }, [quantity, selectedService]);

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Anda wajib login terlebih dahulu!");
      router.push('/login');
      return;
    }

    if (quantity < selectedService.min || quantity > selectedService.max) {
      alert(`Jumlah salah. Min: ${selectedService.min}, Max: ${selectedService.max}`);
      return;
    }

    // 1. Kirim order ke API v1pedia (Disarankan via Next.js API route untuk mengamankan api_key)
    // Di sini asumsi pesanan diproses sukses oleh API v1pedia

    // 2. Simpan transaksi ke tabel 'orders' Supabase untuk dicatat di riwayat pesanan
    const { data, error } = await supabase.from('orders').insert([{
      user_id: user.id,
      service_id: selectedService.id,
      service_name: selectedService.name,
      target: target,
      quantity: parseInt(quantity),
      total_price: totalPrice,
      status: 'Processing' // Status awal orderan SMM
    }]).select();

    if (error) {
      alert('Gagal mencatat transaksi: ' + error.message);
    } else {
      alert('Pesanan sukses dibuat dan sedang diproses!');
      setOrderHistory([data[0], ...orderHistory]); // Update UI riwayat secara langsung
      // Reset Form
      setTarget('');
      setQuantity('');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setOrderHistory([]);
    router.refresh();
  };

  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading Remsdigi...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-slate-900/50 backdrop-blur p-4 flex justify-between items-center max-w-6xl mx-auto">
        <div className="text-xl font-bold tracking-wider text-cyan-400">REMSDIGI</div>
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400 hidden md:inline">{user.email}</span>
              <button onClick={handleLogout} className="px-4 py-2 bg-rose-600/20 text-rose-400 border border-rose-800 rounded-lg text-sm hover:bg-rose-600 hover:text-white transition">Logout</button>
            </div>
          ) : (
            <button onClick={() => router.push('/login')} className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 font-medium rounded-lg text-sm text-white transition">Login / Daftar</button>
          )}
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto p-4 md:py-8 space-y-8">
        
        {/* Form Pemesanan */}
        <div className="bg-slate-900 border border-gray-800 p-6 md:p-8 rounded-2xl shadow-xl">
          <h2 className="text-xl font-semibold mb-6 text-white text-center">Buat Pesanan Baru</h2>
          
          {!user && (
            <div className="bg-cyan-950/40 border border-cyan-800 text-cyan-400 p-4 rounded-lg mb-6 text-center text-sm">
              🔒 Anda harus masuk/login akun Remsdigi terlebih dahulu sebelum dapat memesan layanan.
            </div>
          )}

          <form onSubmit={handleOrderSubmit} className="space-y-4">
            {/* Dropdown Kategori & Layanan */}
            <div>
              <label className="text-sm text-gray-400">Pilih Kategori</label>
              <select onChange={(e) => { setCategory(e.target.value); setSelectedService(null); }} className="w-full mt-1 p-3 bg-slate-950 border border-gray-700 rounded-lg text-white">
                <option value="">-- Kategori --</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>

            {/* Varian Layanan */}
            <div>
              <label className="text-sm text-gray-400">Pilih Varian Layanan</label>
              <select 
                disabled={!category} 
                onChange={(e) => setSelectedService(services.find(s => s.id === parseInt(e.target.value)))}
                className="w-full mt-1 p-3 bg-slate-950 border border-gray-700 rounded-lg text-white disabled:opacity-50"
              >
                <option value="">-- Pilih Layanan --</option>
                {services.filter(s => s.category === category).map(s => (
                  <option key={s.id} value={s.id}>{s.name} - (Rp {s.pricePer1000}/1000)</option>
                ))}
              </select>
            </div>

            {/* Input Link Target */}
            <div>
              <label className="text-sm text-gray-400">Target / Link URL</label>
              <input 
                type="text" 
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="https://tiktok.com/@username/video/..." 
                className="w-full mt-1 p-3 bg-slate-950 border border-gray-700 rounded-lg text-white"
                required 
              />
            </div>

            {/* Input Manual Jumlah & Hitung Harga Otomatis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Jumlah Pesanan (Input Manual)</label>
                <input 
                  type="number" 
                  value={quantity}
                  disabled={!selectedService}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={selectedService ? `Min: ${selectedService.min} - Max: ${selectedService.max}` : "Pilih layanan dulu"}
                  className="w-full mt-1 p-3 bg-slate-950 border border-gray-700 rounded-lg text-white disabled:opacity-50"
                  required 
                />
              </div>
              <div className="bg-slate-950 border border-gray-800 p-4 rounded-lg flex flex-col justify-center">
                <span className="text-xs text-gray-400 uppercase">Total Harga</span>
                <span className="text-xl font-bold text-emerald-400">Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={!user || !selectedService}
              className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 font-semibold rounded-lg text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              🚀 Kirim Pesanan
            </button>
          </form>
        </div>

        {/* Tabel Riwayat Pesanan User */}
        {user && (
          <div className="bg-slate-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-white"><i className="fa-solid fa-clock-rotate-left text-cyan-400 mr-2"></i>Riwayat Pesanan Anda</h2>
            {orderHistory.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Belum ada riwayat pemesanan.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-slate-950 text-gray-400 border-b border-gray-800">
                    <tr>
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">Layanan</th>
                      <th className="p-3">Target</th>
                      <th className="p-3 text-center">Jumlah</th>
                      <th className="p-3">Total Harga</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {orderHistory.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 text-xs">{new Date(order.created_at).toLocaleDateString('id-ID')}</td>
                        <td className="p-3 font-medium text-white">{order.service_name}</td>
                        <td className="p-3 max-w-[150px] truncate text-xs text-cyan-400">{order.target}</td>
                        <td className="p-3 text-center font-mono">{order.quantity}</td>
                        <td className="p-3 text-emerald-400 font-semibold">Rp {order.total_price.toLocaleString('id-ID')}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                            order.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-900' :
                            order.status === 'Processing' ? 'bg-amber-500/10 text-amber-400 border border-amber-900' : 
                            'bg-gray-500/10 text-gray-400 border border-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
