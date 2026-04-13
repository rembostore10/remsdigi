export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;
    // Gunakan ADMIN_ID dari env agar lebih aman, jangan kirim dari frontend
    const ADMIN_ID = process.env.ADMIN_ID; 

    try {
        // Kita teruskan data mentah (FormData) ke Telegram
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: req.body,
        });

        const data = await response.json();

        if (!data.ok) {
            console.error('Telegram API Error:', data);
            return res.status(400).json(data);
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('Fetch Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
