export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // Mengambil token dari Environment Vercel (Rahasia)
  const BOT_TOKEN = process.env.BOT_TOKEN;
  const ADMIN_ID = process.env.ADMIN_ID;

  try {
    // Kita terima data dari website (tanpa token)
    // Karena kirim foto, kita pakai cara yang bisa nerima FormData
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: req.body, // Meneruskan kodingan FormData dari browser
    });

    const result = await response.json();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
