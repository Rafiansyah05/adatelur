'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MessageCircle, Mail, FileText, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function HelpCenterPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Bagaimana cara memesan telur?',
      a: 'Anda bisa mencari peternak dari halaman Beranda dengan memasukkan jumlah rak dan metode pengambilan. Setelah menemukan peternak yang cocok, pilih jam pengiriman lalu klik konfirmasi.'
    },
    {
      q: 'Bagaimana cara pembayarannya?',
      a: 'Pembayaran dilakukan menggunakan metode non-tunai (transfer bank, e-wallet, dll) melalui sistem Midtrans setelah pesanan dikonfirmasi oleh peternak.'
    },
    {
      q: 'Apakah telur bisa diantar?',
      a: 'Tentu, Anda bisa memilih metode "Diantar" pada saat pemesanan. Pastikan Anda telah mengisi alamat lengkap di halaman profil Anda.'
    },
    {
      q: 'Berapa lama peternak merespon?',
      a: 'Peternak memiliki waktu maksimal 3 menit untuk menyetujui pesanan Anda. Jika lebih dari 3 menit tidak ada respon, pesanan akan dibatalkan secara otomatis.'
    },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl py-4 md:py-8">
      <div className="text-center mb-10">
        <h1 className="text-display text-text-main mb-4">Pusat Bantuan</h1>
        <p className="text-body text-text-desc max-w-lg mx-auto">
          Ada pertanyaan atau mengalami masalah? Kami siap membantu Anda.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-8">

        {/* FAQ Section */}
        <div>
          <h2 className="text-h2 text-text-main mb-6">Pertanyaan yang Sering Diajukan (FAQ)</h2>
          <div className="flex flex-col gap-3">
            {faqs.map((faq, idx) => (
              <Card
                key={idx}
                className="overflow-hidden border border-border cursor-pointer transition-colors hover:border-primary-300"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <div className="flex items-center justify-between p-5">
                  <h3 className="text-body-medium font-bold text-text-main">{faq.q}</h3>
                  <ChevronDown className={`h-5 w-5 text-text-desc transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </div>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-0 text-body-small text-text-desc border-t border-border/50 mt-2">
                    {faq.a}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="flex flex-col gap-4">
          <Card className="p-6 border border-border bg-primary-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white mb-4 text-primary-600">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h3 className="text-h3 text-text-main mb-2">Chat via WhatsApp</h3>
            <p className="text-body-small text-text-desc mb-4">
              Tim Support kami siap membantu Anda 24/7 melalui chat.
            </p>
            <Button variant="primary" className="w-full">
              Hubungi CS
            </Button>
          </Card>

          <Card className="p-6 border border-border bg-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 mb-4 text-text-main">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="text-h3 text-text-main mb-2">Kirim Email</h3>
            <p className="text-body-small text-text-desc mb-4">
              Punya keluhan detail? Kirimkan email ke kami.
            </p>
            <Button variant="secondary" className="w-full font-bold border-2">
              support@adatelur
            </Button>
          </Card>
        </div>

      </div>
    </div>
  );
}
