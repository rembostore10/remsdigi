import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { service, target, qty, price, username, proofBase64 } = req.body;

  try {
    // 1. Simpan data pesanan ke Supabase
    const { data, error } = await supabase.from('orders').insert([
      { service_name: service, target, quantity: qty, total_price: price, status: 'pending' }
    ]);

    if (error) throw error;

    // 2. Kirim Notifikasi ke Telegram Admin
    const botToken = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.ADMIN_CHAT_ID;
    const teks = `🛒 *PESANAN BARU*\n\n` +
                 `👤 User: ${username}\n` +
                 `📦 Layanan: ${service}\n` +
                 `🔗 Target: ${target}\n` +
                 `🔢 Jumlah: ${qty}\n` +
                 `💰 Total: Rp ${price.toLocaleString('id')}\n\n` +
                 `📢 *Segera cek mutasi & proses!*`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: teks, parse_mode: 'Markdown' })
    });

    return res.status(200).json({ success: true, message: 'Pesanan terkirim!' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
