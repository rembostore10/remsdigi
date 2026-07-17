// app/api/cron/check-status/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase menggunakan Environment Variables demi keamanan
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  // 1. Validasi Keamanan (Opsional tapi sangat disarankan untuk Vercel Cron)
  // Memastikan bahwa yang menembak endpoint ini hanya sistem Cron resmi, bukan orang iseng
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Ambil pesanan dari database lokal yang statusnya masih menggantung ('Pending' atau 'Processing')
    // dan pastikan kolom provider_order_id tidak kosong
    const { data: pesananMenggantung, error: dbError } = await supabase
      .from('pesanan')
      .select('id, provider_order_id')
      .in('status', ['Pending', 'Processing'])
      .not('provider_order_id', 'is', null);

    if (dbError) {
      throw new Error(`Database Error: ${dbError.message}`);
    }

    // Jika tidak ada pesanan yang perlu diperiksa, hentikan proses lebih awal
    if (!pesananMenggantung || pesananMenggantung.length === 0) {
      return NextResponse.json({ success: true, message: 'Tidak ada pesanan yang perlu diproses.' });
    }

    const providerUrl = 'https://api-provider-pusat.com/v2';
    const apiKey = process.env.PROVIDER_API_KEY; 
    let totalDiperbarui = 0;

    // 3. Iterasi setiap pesanan untuk mengecek statusnya satu per satu ke API Provider Pusat
    for (const order of pesananMenggantung) {
      try {
        const payload = new URLSearchParams({
          key: apiKey,
          action: 'status',
          order: order.provider_order_id
        });

        const response = await fetch(providerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: payload
        });

        if (!response.ok) continue; // Skip jika server provider overload atau return non-200

        const data = await response.json();

        if (data && data.status) {
          let statusBaru = 'Processing';
          let catatanBaru = 'Pesanan sedang diproses oleh provider.';

          // Pemetaan status dari API pusat ke database Remsdigi
          if (data.status === 'Completed' || data.status === 'Success') {
            statusBaru = 'Success';
            catatanBaru = 'Pesanan telah selesai diisi!';
          } else if (data.status === 'Canceled' || data.status === 'Failed') {
            statusBaru = 'Error';
            catatanBaru = `Dibatalkan provider: ${data.error || 'Gagal otomatis'}`;
          } else if (data.status === 'Partial') {
            statusBaru = 'Partial';
            catatanBaru = `Terisi sebagian. Sisa: ${data.remains || 0}`;
          }

          // 4. Update perubahan status ke database Supabase
          const { error: updateError } = await supabase
            .from('pesanan')
            .update({ 
              status: statusBaru, 
              catatan: catatanBaru 
            })
            .eq('id', order.id);

          if (!updateError) {
            totalDiperbarui++;
          }
        }
      } catch (err) {
        // Log error untuk satu orderan spesifik tanpa menghentikan looping orderan lainnya
        console.error(`Gagal cek status order lokal ID ${order.id}:`, err.message);
        continue;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil memeriksa ${pesananMenggantung.length} pesanan. ${totalDiperbarui} data status diperbarui.` 
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
