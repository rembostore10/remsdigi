// api/telegram-webhook.js
import { createClient } from '@supabase/supabase-js';

// Ganti dengan URL dan Service Role Key / Anon Key Supabase Anda
const SUPABASE_URL = 'https://fnwpyxtjdvriaiansowz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZud3B5eHRqZHZyaWFpYW5zb3d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNDAyMTEsImV4cCI6MjA5NzkxNjIxMX0.VSFuCNdmHyIcTYk2a6VCsAAnmwyJ1cBfWjo1l9CqxZk';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TELEGRAM_BOT_TOKEN = '8653920922:AAGa5rFKNhwL4cyO2w8X1oAEyyLO-QuL3W8';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = req.body;

        // 1. Menerima interaksi tombol (Callback Query)
        if (body.callback_query) {
            const callbackQuery = body.callback_query;
            const chatId = callbackQuery.message.chat.id;
            const messageId = callbackQuery.message.message_id;
            const data = callbackQuery.data; // Format: "selesai_ORD-123" atau "gagal_ORD-123"

            const [action, orderId] = data.split('_');
            const statusTarget = action === 'selesai' ? 'Selesai' : 'Gagal';

            // Update status transaksi di Supabase
            const { error: updateError } = await supabase
                .from('transactions')
                .update({ status: statusTarget })
                .eq('id', orderId);

            if (updateError) throw new Error(updateError.message);

            // Beri tahu admin di Telegram bahwa status sukses diubah
            const textResponse = `✅ Pesanan *${orderId}* telah diubah menjadi *${statusTarget.toUpperCase()}* oleh Admin.`;
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    message_id: messageId,
                    text: textResponse,
                    parse_mode: 'Markdown'
                })
            });

            return res.status(200).send('OK');
        }

        // 2. Menerima input text / nominal manual dari Admin (Format: /topup [UID] [NOMINAL])
        if (body.message && body.message.text) {
            const text = body.message.text;
            const chatId = body.message.chat.id;

            if (text.startsWith('/topup')) {
                const parts = text.split(' '); // /topup REMS-1234 50000
                if (parts.length < 3) {
                    return sendTelegramMessage(chatId, "⚠️ Format salah! Gunakan: `/topup [UID] [NOMINAL]`\nContoh: `/topup REMS-7712 50000`");
                }

                const uid = parts[1];
                const nominal = parseInt(parts[2]);

                if (isNaN(nominal)) {
                    return sendTelegramMessage(chatId, "⚠️ Nominal harus berupa angka!");
                }

                // Ambil data user dari database Supabase
                const { data: userData, error: userError } = await supabase
                    .from('profiles')
                    .select('saldo')
                    .eq('uid', uid)
                    .single();

                if (userError || !userData) {
                    return sendTelegramMessage(chatId, `❌ User dengan UID *${uid}* tidak ditemukan di database.`);
                }

                // Hitung saldo baru
                const saldoBaru = userData.saldo + nominal;

                // Update saldo di database
                await supabase
                    .from('profiles')
                    .update({ saldo: saldoBaru })
                    .eq('uid', uid);

                // Catat mutasi sukses ke tabel transaksi
                await supabase
                    .from('transactions')
                    .insert([{ uid: uid, product: 'Top Up Saldo via Admin', price: nominal, method: 'QRIS', status: 'Selesai' }]);

                return sendTelegramMessage(chatId, `💰 *TOP UP BERHASIL!*\n\nUID: \`${uid}\`\nNominal Tambahan: *Rp ${nominal.toLocaleString('id-ID')}*\nTotal Saldo Sekarang: *Rp ${saldoBaru.toLocaleString('id-ID')}*`);
            }
        }

        return res.status(200).send('Event diabaikan');
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}

async function sendTelegramMessage(chatId, text) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' })
    });
}
