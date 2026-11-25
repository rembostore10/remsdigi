import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Gunakan Service Role Key agar bisa update status
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body;

  try {
    // ============================================================
    // A. WEBHOOK KELUAR: WEBSITE -> BOT WHATSAPP ADMIN
    // ============================================================
    if (body.type === 'NEW_ORDER') {
      const { order } = body;
      const caption = 
`🛒 *PESANAN BARU REMSDIGI*
━━━━━━━━━━━━━━━━━━
🆔 *Invoice:* ${order.id}
👤 *Pembeli:* ${order.user_email}
📦 *Produk:* ${order.product_name}
🎯 *Target:* ${order.target_data}
💳 *Metode:* ${order.payment_method}
💰 *Total:* Rp ${Number(order.amount).toLocaleString('id-ID')}
⚡ *Status:* Diproses Otomatis

Balas / Klik Tombol di bawah untuk ubah status di website:`;

      // Contoh payload standar untuk Bot WhatsApp (Baileys / Fonnte / Wablas / Gateway Custom)
      await fetch(process.env.WA_BOT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WA_BOT_TOKEN || ''}`
        },
        body: JSON.stringify({
          target_number: process.env.ADMIN_WA_NUMBER, // Contoh: 6283844641151
          message: caption,
          image_url: order.proof_url, // Foto bukti TF otomatis terkirim jika ada
          // Format tombol interaktif untuk Bot WA Anda
          buttons: [
            { id: `SELESAI_${order.id}`, text: '✅ Selesai' },
            { id: `GAGAL_${order.id}`, text: '❌ Gagal' }
          ],
          order_id: order.id
        })
      });

      return res.status(200).json({ success: true, message: 'Notif pesanan terkirim ke WA Bot' });
    }

    if (body.type === 'NEW_DEPOSIT') {
      const { deposit } = body;
      const caption = 
`💎 *TOP UP SALDO REMS BARU*
━━━━━━━━━━━━━━━━━━
🆔 *ID Deposit:* ${deposit.id}
👤 *User:* ${deposit.user_email}
💰 *Nominal:* Rp ${Number(deposit.amount).toLocaleString('id-ID')}

Cek foto bukti transfer terlampir, lalu konfirmasi:`;

      await fetch(process.env.WA_BOT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WA_BOT_TOKEN || ''}`
        },
        body: JSON.stringify({
          target_number: process.env.ADMIN_WA_NUMBER,
          message: caption,
          image_url: deposit.proof_url,
          buttons: [
            { id: `ACCDEP_${deposit.id}`, text: '✅ Terima Deposit' },
            { id: `TOLAKDEP_${deposit.id}`, text: '❌ Tolak Deposit' }
          ],
          deposit_id: deposit.id
        })
      });

      return res.status(200).json({ success: true, message: 'Notif deposit terkirim ke WA Bot' });
    }

    // ============================================================
    // B. WEBHOOK MASUK: BOT WHATSAPP -> WEBSITE (UPDATE OTOMATIS)
    // ============================================================
    // Saat Anda menekan tombol "Selesai" atau "Gagal" di Bot WA,
    // arahkan Bot WA Anda untuk melakukan POST ke: https://domain-anda.vercel.app/api/wa-webhook
    // dengan body: { "action": "SELESAI_INV-1234567" } atau { "command": "SELESAI", "id": "INV-1234567" }
    const action = body.action || body.selectedButtonId || '';

    if (action.startsWith('SELESAI_')) {
      const orderId = action.replace('SELESAI_', '');
      await supabase.from('orders').update({ status: 'Selesai' }).eq('id', orderId);
      return res.status(200).json({ success: true, reply: `✅ Status pesanan ${orderId} berhasil diubah menjadi SELESAI di website!` });
    }

    if (action.startsWith('GAGAL_')) {
      const orderId = action.replace('GAGAL_', '');
      // Ambil data order untuk refund otomatis jika pakai Saldo Rems
      const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
      if (order && order.payment_method === 'SALDO_REMS' && order.status !== 'Gagal') {
        const { data: prof } = await supabase.from('profiles').select('balance').eq('id', order.user_id).single();
        await supabase.from('profiles').update({ balance: (prof.balance || 0) + order.amount }).eq('id', order.user_id);
      }
      await supabase.from('orders').update({ status: 'Gagal' }).eq('id', orderId);
      return res.status(200).json({ success: true, reply: `❌ Status pesanan ${orderId} diubah menjadi GAGAL di website.` });
    }

    if (action.startsWith('ACCDEP_')) {
      const depId = action.replace('ACCDEP_', '');
      const { data: dep } = await supabase.from('deposits').select('*').eq('id', depId).single();
      if (dep && dep.status === 'Menunggu Verifikasi') {
        const { data: prof } = await supabase.from('profiles').select('balance').eq('id', dep.user_id).single();
        await supabase.from('profiles').update({ balance: (prof?.balance || 0) + dep.amount }).eq('id', dep.user_id);
        await supabase.from('deposits').update({ status: 'Berhasil' }).eq('id', depId);
      }
      return res.status(200).json({ success: true, reply: `💎 Deposit ${depId} disetujui! Saldo otomatis masuk ke akun user.` });
    }

    if (action.startsWith('TOLAKDEP_')) {
      const depId = action.replace('TOLAKDEP_', '');
      await supabase.from('deposits').update({ status: 'Ditolak' }).eq('id', depId);
      return res.status(200).json({ success: true, reply: `❌ Deposit ${depId} ditolak.` });
    }

    return res.status(400).json({ error: 'Format payload tidak dikenali' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
