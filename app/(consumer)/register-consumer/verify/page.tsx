'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const codeLength = 6;

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const [token, setToken] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [infoMessage, setInfoMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setInfoMessage('');
    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: token.trim(),
      type: 'signup',
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    if (!data.user) {
      setErrorMessage('Verifikasi gagal. Silakan kirim ulang kode.');
      setIsSubmitting(false);
      return;
    }

    const response = await fetch('/api/auth/complete-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'consumer',
        full_name: data.user.user_metadata.full_name,
        phone_number: data.user.user_metadata.phone_number,
      }),
    });

    if (!response.ok) {
      const result = await response.json();
      setErrorMessage(result.error ?? 'Gagal menyimpan profil.');
      setIsSubmitting(false);
      return;
    }

    router.push('/');
  };

  const handleResend = async () => {
    setErrorMessage('');
    setInfoMessage('');

    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: 'signup', email });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setInfoMessage('Kode baru sudah dikirim ke email Anda.');
  };

  if (!email) {
    return (
      <Card className="space-y-4 text-center">
        <p className="text-[14px] text-text-main">Alamat email tidak ditemukan.</p>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => router.push('/register-consumer')}
        >
          Kembali ke Pendaftaran
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-6 text-center">
      <div className="space-y-3">
        <Image
          src="/icons/icon-192x192.png"
          alt="adatelur.com"
          width={56}
          height={56}
          className="mx-auto rounded-full"
        />
        <div>
          <h1 className="text-[20px] font-bold leading-tight text-text-main">
            Masukkan Kode Verifikasi
          </h1>
          <p className="mt-1 text-[14px] text-text-main">
            Kami mengirim kode ke <span className="font-semibold">{email}</span>
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
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
          <div className="pointer-events-none flex justify-center gap-1.5">
            {Array.from({ length: codeLength }).map((_, index) => (
              <div
                key={index}
                className={
                  index === token.length
                    ? 'flex h-12 flex-1 items-center justify-center rounded-sm border border-primary-400 text-[18px] font-semibold text-text-main'
                    : 'flex h-12 flex-1 items-center justify-center rounded-sm border border-border text-[18px] font-semibold text-text-main'
                }
              >
                {token[index] ?? ''}
              </div>
            ))}
          </div>
        </div>

        {errorMessage && <p className="text-[12px] text-[#E23D28]">{errorMessage}</p>}
        {infoMessage && <p className="text-[12px] text-success-text">{infoMessage}</p>}

        <p className="text-[12px] text-text-main">
          Belum menerima kode?{' '}
          <button
            type="button"
            onClick={handleResend}
            className="font-semibold text-primary-600 hover:underline"
          >
            Kirim ulang
          </button>
        </p>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => router.push('/register-consumer')}
          >
            Batal
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Memverifikasi...' : 'Verifikasi'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function VerifyConsumerPage() {
  return (
    <div className="flex w-full items-center justify-center bg-cream p-4 h-full min-h-[60vh] mt-4 rounded-md">
      <div className="w-full max-w-md">
        <React.Suspense fallback={<p className="text-center text-[14px] text-text-main">Memuat...</p>}>
          <VerifyForm />
        </React.Suspense>
      </div>
    </div>
  );
}
