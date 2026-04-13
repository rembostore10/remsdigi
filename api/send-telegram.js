export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Gunakan POST Bos' });

    const BOT_TOKEN = process.env.BOT_TOKEN;

    try {
        // Kita langsung tembak ke Telegram menggunakan data mentah dari request
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            headers: {
                // Teruskan header asli termasuk boundary multipart
                'Content-Type': req.headers['content-type']
            },
            body: req.body 
        });

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// --- PENTING: TAMBAHKAN INI DI PALING BAWAH ---
export const config = {
    api: {
        bodyParser: false, // MATIKAN body parser agar Vercel nggak ngerusak file foto
    },
};
