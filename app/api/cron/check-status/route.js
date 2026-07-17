// app/api/cron/check-status/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  // 1. Validasi Keamanan untuk Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Ambil API Key Provider dari tabel pengaturan di database
    const { data: configData, error: configError } = await supabase
      .from('pengaturan')
      .select('key_value')
      .eq('key_name', 'provider_api_key')
      .single();

    if (configError || !configData) {
      throw new Error(`Gagal mengambil API Key dari database: ${configError?.message || 'Data tidak ditemukan'}`);
    }

    const apiKeyPusat = configData.key_value;

    // 3. Ambil pesanan yang statusnya 'Pending' atau 'Processing'
    const { data: pesananMenggantung, error: dbError } = await supabase
      .from('pesanan')
      .select('id, provider_order_id')
      .in('status', ['Pending', 'Processing'])
      .not('provider_order_id', 'is', null);

    if (dbError) {
      throw new Error(`Database Error: ${dbError.message}`);
    }

    if (!pesananMenggantung || pesananMenggantung.length === 0) {
      return NextResponse.json({ success: true, message: 'Tidak ada pesanan yang perlu diperiksa.' });
    }

    const providerUrl = 'https://api-provider-pusat.com/v2';
    let totalDiperbarui = 0;

    // 4. Loping untuk cek status ke provider menggunakan API Key dari database
    for (const order of pesananMenggantung) {
      try {
        const payload = new URLSearchParams({
          key: apiKeyPusat, // Menggunakan key hasil query dari database
          action: 'status',
          order: order.provider_order_id
        });

        const response = await fetch(providerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: payload
        });

        if (!response.ok) continue;

        const data = await response.json();

        if (data && data.status) {
          let statusBaru = 'Processing';
          let catatanBaru = 'Pesanan sedang diproses oleh provider.';

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

          // Update status terbaru ke database
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
        console.error(`Gagal cek status order lokal ID ${order.id}:`, err.message);
        continue;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil memeriksa ${pesananMenggantung.length} pesanan. ${totalDiperbarui} status diperbarui.` 
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
