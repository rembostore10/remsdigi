// api/pay.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { amount, order_id, customer_name, customer_email } = req.body;

  // AUTH KE MIDTRANS (Ganti dengan Server Key Bos nanti)
  // Format: "Basic BASE64(ServerKey:)"
  const authString = Buffer.from("Mid-client-HrGGI6LKuehJJmyN").toString('base64');

  const response = await fetch('https://app.midtrans.com/snap/v1/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${authString}`
    },
    body: JSON.stringify({
      transaction_details: { order_id, gross_amount: amount },
      customer_details: { first_name: customer_name, email: customer_email }
    })
  });

  const data = await response.json();
  res.status(200).json(data);
}
