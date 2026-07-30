import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const geminiModel = 'gemini-3.6-flash';
const geminiStreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?alt=sse`;

const systemInstruction = `Kamu adalah AdaSisten, AI asisten operasional dan penasihat bisnis khusus untuk peternak ayam petelur di platform adatelur.
Tugas utama kamu adalah membantu peternak mengelola operasional peternakan, keuangan, stok telur, strategi penetapan harga, peningkatan rating toko, dan memberikan analisis tren penjualan serta saran konkret untuk penjual.

Aturan Penting:
1. Kamu diberikan data lengkap dari peternak yang sedang login. Gunakan data angka dan fakta tersebut untuk memberikan analisis yang akurat, spesifik, dan valid.
2. Jawablah pertanyaan peternak dengan LENGKAP, TERSTRUKTUR, dan MENDALAM. Dilarang memberikan jawaban setengah-setengah, menggantung, atau terpotong.
3. DILARANG KERAS menggunakan simbol markdown mentah seperti ####, ###, ##, #, *, ---, atau garis pemisah dalam teks jawaban.
4. Gunakan penulisan paragraf yang rapi, penomoran angka sederhana (1., 2.), dan cetak tebal (contoh: **Judul**) untuk bagian penting agar tampilan sangat bersih dan profesional seperti AI chatbot modern.
5. Saat memberikan saran bisnis (Saran untuk Penjual), berikan analisis berdasarkan data riil peternak (misalnya: jika persentase telur rusak tinggi, berikan solusi pakan/kebersihan kandang; jika stok menipis, ingatkan untuk update batch stok; jika rating/akurasi pengiriman kurang, beri langkah perbaikannya; jika tren penjualan menurun, sarankan penyesuaian harga).
6. Gunakan Bahasa Indonesia yang profesional, ramah, dan mudah dipahami oleh peternak.
7. Jika pertanyaan sama sekali di luar topik peternakan, bisnis telur, atau platform adatelur, tolak dengan sopan dan arahkan kembali ke topik peternakan.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function formatRupiah(value: number) {
  return `Rp${Math.round(value).toLocaleString('id-ID')}`;
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: peternakDetail, error: peternakError } = await supabase
      .from('peternak_details')
      .select(
        'id, verification_status, farm_address, chicken_count, daily_egg_production, daily_clean_eggs, daily_damaged_eggs, feed_type, farming_experience_years, is_active, current_price_per_rak'
      )
      .eq('profile_id', user.id)
      .maybeSingle();

    if (peternakError) {
      return NextResponse.json({ error: peternakError.message }, { status: 500 });
    }

    if (!peternakDetail || peternakDetail.verification_status !== 'approved') {
      return NextResponse.json({ error: 'Akun peternak belum disetujui' }, { status: 403 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Asisten belum dikonfigurasi' }, { status: 503 });
    }

    const body = await request.json();
    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];

    if (messages.length === 0) {
      return NextResponse.json({ error: 'Pesan tidak boleh kosong' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const [
      { data: profile },
      { data: listing },
      { data: score },
      { data: wallet },
      { data: transactions },
      { data: orders },
      { data: ratings },
    ] = await Promise.all([
      adminSupabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
      adminSupabase
        .from('listings')
        .select('price_per_rak, stock_rak, is_listing_active, is_available, updated_at')
        .eq('peternak_id', peternakDetail.id)
        .maybeSingle(),
      adminSupabase
        .from('peternak_scores')
        .select('final_score, average_rating, delivery_accuracy_pct, total_transaction_value')
        .eq('peternak_id', peternakDetail.id)
        .maybeSingle(),
      adminSupabase
        .from('wallets')
        .select('balance')
        .eq('peternak_id', peternakDetail.id)
        .maybeSingle(),
      adminSupabase
        .from('wallet_transactions')
        .select('amount, type, balance_after, description, created_at')
        .eq('peternak_id', peternakDetail.id)
        .order('created_at', { ascending: false })
        .limit(15),
      adminSupabase
        .from('orders')
        .select('id, total_amount, subtotal, rak_quantity, order_status, payment_status, created_at')
        .eq('peternak_id', peternakDetail.id)
        .order('created_at', { ascending: false }),
      adminSupabase
        .from('ratings')
        .select('rating_value, review_text, created_at')
        .eq('peternak_id', peternakDetail.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const allOrders = orders ?? [];
    const completedOrders = allOrders.filter((o) => o.order_status === 'completed');
    const pendingOrders = allOrders.filter(
      (o) => o.order_status === 'pending' || o.order_status === 'paid' || o.order_status === 'preparing' || o.order_status === 'delivering'
    );
    const txs = transactions ?? [];
    const ratingList = ratings ?? [];

    const walletBalance = Number(wallet?.balance ?? 0);
    const totalCreditRevenue = txs
      .filter((tx) => tx.type === 'credit')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const totalDebitWithdrawal = txs
      .filter((tx) => tx.type === 'debit')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const todayStr = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
    let todayRevenue = 0;
    let todayRakSold = 0;
    let todayCompletedOrdersCount = 0;

    for (const tx of txs) {
      const txDateStr = new Date(new Date(tx.created_at).getTime() + 7 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      if (txDateStr === todayStr && tx.type === 'credit') {
        todayRevenue += Number(tx.amount);
      }
    }

    for (const order of completedOrders) {
      const orderDateStr = new Date(new Date(order.created_at).getTime() + 7 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      if (orderDateStr === todayStr) {
        todayRakSold += Number(order.rak_quantity);
        todayCompletedOrdersCount += 1;
      }
    }

    const totalRakSold = completedOrders.reduce((sum, order) => sum + Number(order.rak_quantity), 0);

    const startOfTodayMs = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    const listingUpdatedMs = listing?.updated_at ? new Date(listing.updated_at).getTime() : 0;
    const cutoffTime = new Date(Math.max(startOfTodayMs, listingUpdatedMs)).toISOString();

    const paidOrdersAfterCutoff = allOrders.filter(
      (o) => o.payment_status === 'paid' && new Date(o.created_at).getTime() >= new Date(cutoffTime).getTime()
    );
    const soldSinceUpdate = paidOrdersAfterCutoff.reduce((sum, o) => sum + Number(o.rak_quantity), 0);
    const initialBatchStock = listing?.stock_rak ?? 0;
    const remainingStock = Math.max(0, initialBatchStock - soldSinceUpdate);

    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    const dailySalesMap = new Map<string, { revenue: number; rak: number }>();

    for (let i = 0; i < 7; i++) {
      const d = new Date(now - i * msPerDay + 7 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split('T')[0];
      dailySalesMap.set(dateKey, { revenue: 0, rak: 0 });
    }

    for (const order of completedOrders) {
      const orderDateKey = new Date(new Date(order.created_at).getTime() + 7 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      if (dailySalesMap.has(orderDateKey)) {
        const current = dailySalesMap.get(orderDateKey)!;
        current.revenue += Number(order.subtotal || order.total_amount);
        current.rak += Number(order.rak_quantity);
      }
    }

    const dailyTrendLines: string[] = [];
    dailySalesMap.forEach((val, key) => {
      dailyTrendLines.push(`  - ${key}: ${formatRupiah(val.revenue)} (${val.rak} rak terjual)`);
    });

    const totalEggProd = Number(peternakDetail.daily_egg_production || 0);
    const cleanEggs = Number(peternakDetail.daily_clean_eggs || 0);
    const damagedEggs = Number(peternakDetail.daily_damaged_eggs || 0);
    const damagePct = totalEggProd > 0 ? ((damagedEggs / totalEggProd) * 100).toFixed(1) : '0';

    const farmerFacts: string[] = [
      'DATA PROFIL DAN OPERASIONAL PETERNAK:',
      `- Nama Peternak: ${profile?.full_name || 'Peternak'}`,
      `- Alamat Peternakan: ${peternakDetail.farm_address}`,
      `- Jumlah Ayam: ${peternakDetail.chicken_count} ekor`,
      `- Estimasi Produksi Harian: ${totalEggProd} butir/hari (Telur Bersih: ${cleanEggs} butir, Telur Rusak: ${damagedEggs} butir / ${damagePct}%)`,
      `- Jenis Pakan: ${peternakDetail.feed_type}`,
      `- Pengalaman Beternak: ${peternakDetail.farming_experience_years} tahun`,
      `- Status Toko: ${peternakDetail.is_active ? 'Aktif' : 'Nonaktif'}`,
      '',
      'DATA STOK DAN LISTING PENJUALAN:',
      `- Harga Per Rak Saat Ini: ${listing?.price_per_rak ? formatRupiah(Number(listing.price_per_rak)) : 'Belum diatur'}`,
      `- Stok Awal Batch Terakhir: ${initialBatchStock} rak`,
      `- Terjual Sejak Update Batch: ${soldSinceUpdate} rak`,
      `- Sisa Stok Rak Tersedia untuk Pembeli: ${remainingStock} rak`,
      `- Status Availability Listing: ${listing?.is_available ? 'Tersedia untuk dibeli' : 'Tidak tersedia'}`,
      '',
      'DATA KEUANGAN DAN DOMPET:',
      `- Saldo Kas Dompet Saat Ini: ${formatRupiah(walletBalance)}`,
      `- Total Pemasukan Kotor (Pencairan Kredit): ${formatRupiah(totalCreditRevenue)}`,
      `- Total Penarikan Dana (Withdrawal Debit): ${formatRupiah(totalDebitWithdrawal)}`,
      `- Pendapatan Hari Ini (00:00 - Sekarang): ${formatRupiah(todayRevenue)}`,
      `- Riwayat Transaksi Dompet Terbaru:`,
    ];

    if (txs.length > 0) {
      txs.slice(0, 5).forEach((tx) => {
        const txDate = new Date(tx.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        farmerFacts.push(
          `  - [${txDate}] ${tx.type === 'credit' ? 'Pemasukan' : 'Penarikan'}: ${formatRupiah(Number(tx.amount))} (${tx.description || 'Transaksi dompet'})`
        );
      });
    } else {
      farmerFacts.push('  - Belum ada transaksi dompet');
    }

    farmerFacts.push(
      '',
      'STATISTIK PENJUALAN DAN TREN:',
      `- Total Pesanan Selesai (Lifetime): ${completedOrders.length} pesanan`,
      `- Total Rak Terjual (Lifetime): ${totalRakSold} rak`,
      `- Pesanan Sedang Diproses / Menunggu: ${pendingOrders.length} pesanan`,
      `- Rak Terjual Hari Ini: ${todayRakSold} rak (${todayCompletedOrdersCount} pesanan selesai hari ini)`,
      `- Tren Penjualan 7 Hari Terakhir:`,
      ...dailyTrendLines,
      '',
      'REPUTASI, RATING DAN ULASAN PEMBELI:',
      `- Skor Reputasi Toko (Final Score): ${score?.final_score ?? 0} / 100`,
      `- Rata-rata Rating Pembeli: ${score?.average_rating ? Number(score.average_rating).toFixed(1) : 'Belum ada rating'} / 5.0`,
      `- Akurasi Pengiriman Tepat Waktu: ${score?.delivery_accuracy_pct ?? 0}%`,
      `- Ulasan Dan Komentar Pembeli Terbaru:`
    );

    if (ratingList.length > 0) {
      ratingList.forEach((r) => {
        const rDate = new Date(r.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
        });
        farmerFacts.push(
          `  - [${rDate}] Rating ${r.rating_value}/5: "${r.review_text || 'Tanpa ulasan tertulis'}"`
        );
      });
    } else {
      farmerFacts.push('  - Belum ada ulasan pembeli');
    }

    const contents = messages
      .filter((message) => typeof message.content === 'string' && message.content.trim() !== '')
      .map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      }));

    const geminiResponse = await fetch(geminiStreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }, { text: farmerFacts.join('\n') }],
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!geminiResponse.ok || !geminiResponse.body) {
      return NextResponse.json({ error: 'Gagal menghubungi asisten' }, { status: 502 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const upstream = geminiResponse.body.getReader();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await upstream.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;

              const payload = trimmed.slice(5).trim();
              if (!payload || payload === '[DONE]') continue;

              try {
                const parsed = JSON.parse(payload);
                const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  controller.enqueue(encoder.encode(text));
                }
              } catch {}
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
