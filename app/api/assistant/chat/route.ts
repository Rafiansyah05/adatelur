import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const geminiModel = 'gemini-3.6-flash';
const geminiStreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?alt=sse`;

const systemInstruction = `Kamu adalah asisten operasional untuk peternak ayam petelur di platform adatelur.com.
Bantu peternak dengan pertanyaan seputar operasional harian: perawatan ayam, pakan, kualitas dan penyimpanan telur, kebersihan kandang, estimasi produksi, serta tips harga jual.
Jawab dalam Bahasa Indonesia yang ringkas, jelas, dan praktis.
Kamu diberi data peternak yang sedang login. Gunakan data itu bila relevan untuk menjawab pertanyaan spesifik tentang peternakan mereka, misalnya soal harga, stok, produksi, atau skor reputasi.
Jika pertanyaan di luar topik peternakan ayam petelur atau operasional adatelur, tolak dengan sopan dan arahkan kembali ke topik peternakan.`;

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

    const [{ data: profile }, { data: listing }, { data: score }] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
      supabase
        .from('listings')
        .select('price_per_rak, stock_rak, is_listing_active, is_available')
        .eq('peternak_id', peternakDetail.id)
        .maybeSingle(),
      supabase
        .from('peternak_scores')
        .select('final_score, average_rating, delivery_accuracy_pct, total_transaction_value')
        .eq('peternak_id', peternakDetail.id)
        .maybeSingle(),
    ]);

    const farmerFacts: string[] = ['Data peternak yang sedang login:'];

    if (profile?.full_name) {
      farmerFacts.push(`- Nama peternak: ${profile.full_name}`);
    }
    farmerFacts.push(`- Alamat peternakan: ${peternakDetail.farm_address}`);
    farmerFacts.push(`- Jumlah ayam: ${peternakDetail.chicken_count} ekor`);
    farmerFacts.push(
      `- Estimasi produksi harian: ${peternakDetail.daily_egg_production} butir (bersih ${peternakDetail.daily_clean_eggs}, rusak ${peternakDetail.daily_damaged_eggs})`
    );
    farmerFacts.push(`- Jenis pakan: ${peternakDetail.feed_type}`);
    farmerFacts.push(`- Pengalaman beternak: ${peternakDetail.farming_experience_years} tahun`);
    farmerFacts.push(`- Status toko: ${peternakDetail.is_active ? 'aktif' : 'nonaktif'}`);

    if (listing) {
      farmerFacts.push(
        `- Listing saat ini: harga ${formatRupiah(Number(listing.price_per_rak))} per rak, stok ${listing.stock_rak} rak, ${listing.is_available ? 'tersedia untuk pembeli' : 'tidak tersedia'}`
      );
    } else {
      farmerFacts.push('- Listing saat ini: belum ada listing aktif');
    }

    if (score) {
      farmerFacts.push(
        `- Skor reputasi: ${score.final_score} dari 100 (rata-rata rating ${score.average_rating} dari 5, akurasi pengiriman ${score.delivery_accuracy_pct}%)`
      );
      farmerFacts.push(
        `- Total nilai transaksi: ${formatRupiah(Number(score.total_transaction_value))}`
      );
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
          maxOutputTokens: 1024,
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
