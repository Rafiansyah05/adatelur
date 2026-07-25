'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

const codeLength = 6;
const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501430654243-c934cec2e1c0?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&q=80'
];

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const [token, setToken] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [infoMessage, setInfoMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(300); // 5 minutes

  React.useEffect(() => {
    if (timeLeft <= 0) {
      router.push('/register-consumer');
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, router]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setInfoMessage('');
    setIsSubmitting(true);

    try {
      // 1. Verify OTP using custom API
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: token.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error || 'Verifikasi gagal.');
        setIsSubmitting(false);
        return;
      }

      router.push('/');
    } catch (err) {
      setErrorMessage('Terjadi kesalahan sistem.');
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setErrorMessage('');
    setInfoMessage('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error || 'Gagal mengirim ulang kode.');
        return;
      }

      setInfoMessage('Kode baru sudah dikirim ke email Anda.');
      setTimeLeft(300); // Reset timer
    } catch (err) {
      setErrorMessage('Terjadi kesalahan sistem.');
    }
  };

  if (!email) {
    return (
      <div className="p-8 sm:p-10 bg-white rounded-sm text-center">
        <p className="text-[14px] text-neutral-800 font-medium mb-6">Alamat email tidak ditemukan.</p>
        <Button
          variant="secondary"
          className="w-full min-h-[52px] bg-white border border-neutral-200 text-neutral-700 hover:bg-white hover:border-neutral-400 font-bold rounded-sm transition-none"
          onClick={() => router.push('/register-consumer')}
        >
          Kembali ke Pendaftaran
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 sm:p-10 bg-white rounded-sm">
      <div className="mb-8 text-center">
        <h2 className="text-[24px] font-extrabold text-neutral-900 mb-2 tracking-tight">Verifikasi Email</h2>
        <p className="text-[14px] text-neutral-500 font-medium mb-1">
          Kami telah mengirim 6 digit kode OTP ke <span className="font-bold text-neutral-800">{email}</span>
        </p>
        <p className="text-[13px] text-neutral-400 font-medium">
          Mohon periksa folder <span className="font-semibold text-neutral-500">Inbox</span>, <span className="font-semibold text-neutral-500">Spam</span>, atau <span className="font-semibold text-neutral-500">Draft</span> Anda.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            value={token}
            onChange={(event) =>
              setToken(event.target.value.replace(/\D/g, '').slice(0, codeLength))
            }
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Kode verifikasi"
          />
          <div className="pointer-events-none flex justify-center gap-2">
            {Array.from({ length: codeLength }).map((_, index) => (
              <div
                key={index}
                className={
                  index === token.length
                    ? 'flex h-14 flex-1 items-center justify-center rounded-sm border-2 border-primary-400 text-[20px] font-bold text-neutral-900 bg-white'
                    : 'flex h-14 flex-1 items-center justify-center rounded-sm border border-neutral-200 text-[20px] font-bold text-neutral-900 bg-neutral-50'
                }
              >
                {token[index] ?? ''}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="text-[13px] font-medium text-neutral-500">
            Waktu tersisa: <span className="font-bold text-neutral-800 font-mono">{formatTime(timeLeft)}</span>
          </div>
          {errorMessage && <p className="text-[13px] text-red-500 font-medium">{errorMessage}</p>}
          {infoMessage && <p className="text-[13px] text-green-600 font-medium">{infoMessage}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            className="flex-1 min-h-[52px] bg-white border border-neutral-200 text-neutral-700 hover:bg-white hover:border-neutral-400 font-bold rounded-sm transition-none"
            onClick={() => router.push('/register-consumer')}
          >
            Batal
          </Button>
          <Button type="submit" className="flex-1 min-h-[52px] bg-primary-400 border border-transparent hover:bg-primary-400 hover:border-primary-600 text-neutral-900 font-bold rounded-sm transition-none" disabled={isSubmitting || token.length !== 6}>
            {isSubmitting ? 'Memproses...' : 'Verifikasi'}
          </Button>
        </div>
      </form>

      <div className="mt-8 text-center text-[13px] text-neutral-500 font-medium">
        Belum menerima kode?{' '}
        <button
          type="button"
          onClick={handleResend}
          className="font-bold text-primary-600 hover:underline focus:outline-none"
        >
          Kirim ulang sekarang
        </button>
      </div>
    </div>
  );
}

export default function VerifyConsumerPage() {
  const [bgIndex, setBgIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-neutral-900">
      {/* Background Slideshow */}
      {BACKGROUND_IMAGES.map((src, idx) => (
        <div
          key={src}
          className="absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: bgIndex === idx ? 0.4 : 0 }}
        >
          <Image
            src={src}
            alt="Background eggs"
            fill
            className="object-cover"
            priority={idx === 0}
          />
        </div>
      ))}
      <div className="absolute inset-0 z-0 bg-black/40" />

      {/* Content Container */}
      <div className="relative z-10 flex w-full h-screen">
        {/* Left Panel */}
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
              Satu Langkah Lagi.
            </h1>
            <p className="text-[18px] text-neutral-200 max-w-md leading-relaxed font-medium">
              Selesaikan verifikasi email Anda untuk mulai bertransaksi di ekosistem kami.
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex w-full lg:w-[45%] flex-col justify-center items-center p-6 overflow-y-auto">
          <div className="w-full max-w-[420px] py-10">
            {/* Logo on mobile only */}
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

            <React.Suspense fallback={<div className="p-8 sm:p-10 bg-white rounded-sm text-center font-medium text-neutral-500">Memuat formulir...</div>}>
              <VerifyForm />
            </React.Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
