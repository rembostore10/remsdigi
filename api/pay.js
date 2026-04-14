// api/pay.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { amount, order_id, customer_name, customer_email } = req.body;

  // Diambil otomatis dari Environment Variables Vercel yang Bos buat tadi
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const authString = Buffer.from(serverKey + ":").toString('base64');

  try {
    const response = await fetch('https://app.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: order_id,
          gross_amount: amount
        },
        customer_details: {
          first_name: customer_name,
          email: customer_email
        },
        // MENGAKTIFKAN SEMUA METODE PEMBAYARAN
        enabled_payments: [
          "credit_card", "cimb_clicks", "bca_va", "bni_va", "bri_va", 
          "permata_va", "other_va", "gopay", "indomaret", "alfamart", 
          "shopeepay", "qris"
        ]
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
