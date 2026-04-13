export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Harus POST' });

    const BOT_TOKEN = process.env.BOT_TOKEN;

    try {
        // Ambil data dalam bentuk Buffer (mentah)
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        const fullBody = Buffer.concat(chunks);

        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            headers: {
                'Content-Type': req.headers['content-type']
            },
            body: fullBody
        });

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};
