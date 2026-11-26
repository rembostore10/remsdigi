import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
const TG_ADMIN_CHAT_ID = process.env.TG_ADMIN_CHAT_ID; // ID Chat / Grup Telegram Admin

async function sendTelegramMessage(chatId, text, replyMarkup = null, photoUrl = null) {
  if (photoUrl) {
    const res = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      })
    });
    return res.json();
  } else {
    const res = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      })
    });
    return res.json();
  }
}

async function answerCallbackQuery(callbackQueryId, text) {
  await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text,
      show_alert: false
    })
  });
}

async function editMessageCaptionOrText(chatId, messageId, newText, isPhoto = false) {
  const endpoint = isPhoto ? 'editMessageCaption' : 'editMessageText';
  const payload = isPhoto
    ? { chat_id: chatId, message_id: messageId, caption: newText, parse_mode: 'HTML' }
    : { chat_id: chatId, message_id: messageId, text: newText, parse_mode: 'HTML' };

  await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body;

  try {
    // ============================================================
    // 1. KIRIM NOTIFIKASI PESANAN BARU KE BOT TELEGRAM
    // ============================================================
    if (body.type === 'NEW_ORDER') {
      const { order } = body;
      const caption =
`🛒 <b>PESANAN BARU REMSDIGI</b>
━━━━━━━━━━━━━━━━━━━━
🆔 <b>Invoice:</b> <code>${order.id}</code>
👤 <b>Pembeli:</b> ${order.user_email}
📦 <b>Produk:</b> ${order.product_name}
🎯 <b>Target:</b> <code>${order.target_data}</code>
💳 <b>Metode:</b> ${order.payment_method}
💰 <b>Total:</b> Rp ${Number(order.amount).toLocaleString('id-ID')}
⚡ <b>Status:</b> Diproses Otomatis`;

      const inlineKeyboard = {
        inline_keyboard: [
          [
            { text: '✅ Selesai', callback_data: `SELESAI_${order.id}` },
            { text: '❌ Gagal', callback_data: `GAGAL_${order.id}` }
          ]
        ]
      };

      await sendTelegramMessage(TG_ADMIN_CHAT_ID, caption, inlineKeyboard, order.proof_url || null);
      return res.status(200).json({ success: true, message: 'Notif pesanan terkirim ke Telegram' });
    }

    // ============================================================
    // 2. KIRIM NOTIFIKASI DEPOSIT SALDO REMS KE BOT TELEGRAM
    // ============================================================
    if (body.type === 'NEW_DEPOSIT') {
      const { deposit } = body;
      const caption =
`💎 <b>TOP UP SALDO REMS BARU</b>
━━━━━━━━━━━━━━━━━━━━
🆔 <b>ID Deposit:</b> <code>${deposit.id}</code>
👤 <b>User:</b> ${deposit.user_email}
💰 <b>Nominal:</b> Rp ${Number(deposit.amount).toLocaleString('id-ID')}`;

      const inlineKeyboard = {
        inline_keyboard: [
          [
            { text: '✅ Terima Saldo', callback_data: `ACCDEP_${deposit.id}` },
            { text: '❌ Tolak Saldo', callback_data: `TOLAKDEP_${deposit.id}` }
          ]
        ]
      };

      await sendTelegramMessage(TG_ADMIN_CHAT_ID, caption, inlineKeyboard, deposit.proof_url || null);
      return res.status(200).json({ success: true, message: 'Notif deposit terkirim ke Telegram' });
    }

    // ============================================================
    // 3. TERIMA KLIK TOMBOL DARI TELEGRAM (CALLBACK_QUERY)
    // ============================================================
    if (body.callback_query) {
      const cq = body.callback_query;
      const data = cq.data || '';
      const chatId = cq.message.chat.id;
      const messageId = cq.message.message_id;
      const isPhoto = Boolean(cq.message.photo);
      const oldText = cq.message.caption || cq.message.text || '';

      if (data.startsWith('SELESAI_')) {
        const orderId = data.replace('SELESAI_', '');
        await supabase.from('orders').update({ status: 'Selesai' }).eq('id', orderId);
        await answerCallbackQuery(cq.id, `Pesanan ${orderId} ditandai SELESAI!`);
        await editMessageCaptionOrText(chatId, messageId, `${oldText}\n\n🟢 <b>STATUS DIPERBARUI: SELESAI</b>`, isPhoto);
        return res.status(200).json({ ok: true });
      }

      if (data.startsWith('GAGAL_')) {
        const orderId = data.replace('GAGAL_', '');
        const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();

        if (order && order.payment_method === 'SALDO_REMS' && order.status !== 'Gagal') {
          const { data: prof } = await supabase.from('profiles').select('balance').eq('id', order.user_id).single();
          await supabase.from('profiles').update({ balance: (prof?.balance || 0) + order.amount }).eq('id', order.user_id);
        }

        await supabase.from('orders').update({ status: 'Gagal' }).eq('id', orderId);
        await answerCallbackQuery(cq.id, `Pesanan ${orderId} ditandai GAGAL!`);
        await editMessageCaptionOrText(chatId, messageId, `${oldText}\n\n🔴 <b>STATUS DIPERBARUI: GAGAL</b>`, isPhoto);
        return res.status(200).json({ ok: true });
      }

      if (data.startsWith('ACCDEP_')) {
        const depId = data.replace('ACCDEP_', '');
        const { data: dep } = await supabase.from('deposits').select('*').eq('id', depId).single();

        if (dep && dep.status === 'Menunggu Verifikasi') {
          const { data: prof } = await supabase.from('profiles').select('balance').eq('id', dep.user_id).single();
          await supabase.from('profiles').update({ balance: (prof?.balance || 0) + dep.amount }).eq('id', dep.user_id);
          await supabase.from('deposits').update({ status: 'Berhasil' }).eq('id', depId);
        }

        await answerCallbackQuery(cq.id, `Deposit ${depId} BERHASIL & saldo masuk!`);
        await editMessageCaptionOrText(chatId, messageId, `${oldText}\n\n🟢 <b>DEPOSIT DISETUJUI (SALDO MASUK)</b>`, isPhoto);
        return res.status(200).json({ ok: true });
      }

      if (data.startsWith('TOLAKDEP_')) {
        const depId = data.replace('TOLAKDEP_', '');
        await supabase.from('deposits').update({ status: 'Ditolak' }).eq('id', depId);
        await answerCallbackQuery(cq.id, `Deposit ${depId} DITOLAK!`);
        await editMessageCaptionOrText(chatId, messageId, `${oldText}\n\n🔴 <b>DEPOSIT DITOLAK</b>`, isPhoto);
        return res.status(200).json({ ok: true });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
