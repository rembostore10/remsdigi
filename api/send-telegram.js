export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Harus pakai POST Bos' });
    }

    // Ambil Token & ID dari Environment Vercel
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const ADMIN_ID = process.env.ADMIN_ID;

    // Cek apakah variabel terbaca di server Vercel
    if (!BOT_TOKEN || !ADMIN_ID) {
        return res.status(500).json({ 
            ok: false, 
            error: 'Variabel BOT_TOKEN atau ADMIN_ID belum terpasang di Vercel' 
        });
    }

    try {
        // Kita teruskan request ke Telegram
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: req.body, // Ini FormData dari script.js
        });

        const result = await response.json();

        if (response.ok) {
            return res.status(200).json(result);
        } else {
            console.error('Telegram Error:', result);
            return res.status(response.status).json(result);
        }
    } catch (err) {
        return res.status(500).json({ ok: false, error: err.message });
    }
}
