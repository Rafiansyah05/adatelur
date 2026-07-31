import { ChevronDown } from 'lucide-react';
import { Reveal } from '@/components/landing/Reveal';

const questions = [
  {
    question: 'Apakah daftar di adatelur berbayar?',
    answer:
      'Gratis. Baik konsumen maupun peternak bisa daftar tanpa biaya. Kamu cukup bayar untuk telur yang kamu beli.',
  },
  {
    question: 'Bagaimana cara pesan telur?',
    answer:
      'Cari peternak terdekat, pilih jumlah rak dan metode (antar atau ambil), lalu kirim pesanan. Peternak akan mengonfirmasi dan telur dikirim segar.',
  },
  {
    question: 'Apakah peternaknya terpercaya?',
    answer:
      'Ya. Setiap peternak melewati proses verifikasi sebelum bisa berjualan, dan punya rating dari pembeli sebelumnya.',
  },
  {
    question: 'Saya peternak, bagaimana cara mulai jualan?',
    answer:
      'Klik Jadi Peternak, isi data peternakanmu, dan tunggu verifikasi. Setelah disetujui, kamu bisa atur harga, stok, dan mulai menerima pesanan.',
  },
  {
    question: 'Bagaimana saya menerima pemasukan?',
    answer:
      'Hasil penjualan masuk otomatis ke dompet di dashboard peternak, dan bisa kamu cairkan kapan saja.',
  },
  {
    question: 'Apakah bisa dipakai di HP?',
    answer:
      'Bisa. adatelur adalah aplikasi web yang bisa kamu install langsung ke HP tanpa lewat app store.',
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 bg-landing-cream py-16 md:py-24">
      <div className="mx-auto max-w-[1160px] px-5 md:px-6">
        <Reveal className="mx-auto max-w-[640px] text-center">
          <p className="text-[13px] font-extrabold uppercase tracking-[0.15em] text-landing-600">FAQ</p>
          <h2 className="mt-4 text-[27px] font-bold leading-tight tracking-tight text-landing-text md:text-[36px]">
            Pertanyaan yang sering ditanya
          </h2>
        </Reveal>

        <div className="mx-auto mt-12 flex max-w-[780px] flex-col gap-3">
          {questions.map((item) => (
            <details
              key={item.question}
              className="group rounded-lg border border-landing-border bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-[15px] font-bold text-landing-text">
                {item.question}
                <ChevronDown className="h-5 w-5 shrink-0 text-landing-600 transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-6 pb-5 text-[14px] leading-relaxed text-landing-desc">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
