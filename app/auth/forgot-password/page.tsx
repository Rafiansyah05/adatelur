'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501430654243-c934cec2e1c0?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&q=80',
];

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [bgIndex, setBgIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim email reset password');
      }

      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-neutral-900">
      {BACKGROUND_IMAGES.map((src, idx) => (
        <div
          key={src}
          className="absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: bgIndex === idx ? 0.4 : 0 }}
        >
          <Image
            src={src}
            alt="Background"
            fill
            className="object-cover"
            priority={idx === 0}
          />
        </div>
      ))}
      <div className="absolute inset-0 z-0 bg-black/40" />

      <div className="relative z-10 flex w-full h-screen">
        <div className="hidden lg:flex w-[55%] flex-col justify-between p-16 xl:p-24">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/icon-512x512.png"
              alt="adatelur Logo"
              width={48}
              height={48}
              className="rounded-sm object-contain"
            />
            <span className="text-[28px] font-extrabold text-white tracking-tight">adatelur.</span>
          </div>

          <div>
            <h1 className="text-[52px] font-extrabold text-white mb-4 leading-[1.1] tracking-tight">
              Akses Kembali<br />Akun Anda.
            </h1>
            <p className="text-[18px] text-neutral-200 max-w-md leading-relaxed font-medium">
              Kami bantu memulihkan akses akun Anda dengan cepat dan aman.
            </p>
          </div>
        </div>

        <div className="flex w-full lg:w-[45%] flex-col justify-center items-center p-6">
          <div className="w-full max-w-[420px]">
            <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
              <Image
                src="/icons/icon-512x512.png"
                alt="adatelur Logo"
                width={48}
                height={48}
                className="rounded-sm object-contain"
              />
              <span className="text-[28px] font-extrabold text-white tracking-tight">adatelur.</span>
            </div>

            <div className="p-8 sm:p-10 bg-white rounded-sm">
              <div className="mb-8">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors mb-6"
                >
                  <ArrowLeft className="h-4 w-4" /> Kembali ke Masuk
                </Link>
                <h2 className="text-[24px] font-extrabold text-neutral-900 mb-2 tracking-tight">Lupa Kata Sandi?</h2>
                <p className="text-[14px] text-neutral-500 font-medium leading-relaxed">
                  Masukkan email terdaftar Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi.
                </p>
              </div>

              {success ? (
                <div className="space-y-6 text-center py-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-2">Tautan Terkirim!</h3>
                    <p className="text-sm text-neutral-600 leading-relaxed font-medium">
                      Instruksi atur ulang kata sandi telah dikirim ke <strong className="text-neutral-900">{email}</strong>. Silakan cek kotak masuk atau folder spam Anda.
                    </p>
                  </div>
                  <Link href="/login" className="block w-full">
                    <Button type="button" className="w-full min-h-[52px] text-[15px] font-bold rounded-sm text-neutral-900 bg-primary-400 hover:bg-primary-500 transition-none">
                      Kembali ke Halaman Masuk
                    </Button>
                  </Link>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Alamat Email Terdaftar"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="min-h-[52px] rounded-sm bg-white border border-neutral-200 focus:bg-white focus:border-primary-400 focus:outline-none transition-none font-medium placeholder:text-neutral-400 px-5 hover:border-neutral-300"
                      required
                    />
                  </div>

                  {errorMessage && (
                    <p className="text-[13px] text-red-500 font-medium text-center bg-red-50 p-3 rounded-sm border border-red-100">
                      {errorMessage}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full min-h-[52px] text-[15px] font-bold rounded-sm text-neutral-900 bg-primary-400 hover:bg-primary-500 transition-none"
                    disabled={loading}
                  >
                    {loading ? 'Mengirim Tautan...' : 'Kirim Tautan Reset'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
