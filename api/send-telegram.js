export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Gunakan POST Bos' });

    const BOT_TOKEN = process.env.BOT_TOKEN;

    try {
        // Ambil contentType dari header (multipart/form-data)
        const contentType = req.headers['content-type'];

        // Kita kirim ulang request-nya ke Telegram secara utuh
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            headers: {
                'Content-Type': contentType
            },
            body: req.body // Meneruskan isi FormData secara mentah
        });

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
