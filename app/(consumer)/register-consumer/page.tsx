'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

export default function ConsumerRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleGoogleRegister = async () => {
    setErrorMessage('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setErrorMessage(error.message);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    if (data.user?.identities?.length === 0) {
      setErrorMessage('Email ini sudah terdaftar. Silakan masuk atau pakai email lain.');
      setIsSubmitting(false);
      return;
    }

    router.push(`/register-consumer/verify?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="flex w-full items-center justify-center bg-cream p-4 h-full min-h-[60vh] mt-4 rounded-md">
      <div className="w-full max-w-md">
        <div className="mb-4 text-center">
          <h1 className="text-h1 text-text-main mb-2">Daftar sebagai Konsumen</h1>
          <p className="text-body text-text-desc">Beli telur langsung dari peternak</p>
        </div>

        <Card className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Contoh: Siti Rahayu"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="phoneNumber">Nomor Telepon</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Contoh: 08123456789"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Contoh: siti@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />
            </div>

            {errorMessage && <p className="text-caption text-[#E23D28]">{errorMessage}</p>}

            <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses...' : 'Daftar'}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-border" />
            <span className="text-[12px] text-text-desc">atau</span>
            <div className="h-[1px] flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full gap-2 border-transparent bg-neutral-100 hover:border-transparent"
            onClick={handleGoogleRegister}
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.4 5.4 0 0 1-2.4 3.58v2.77h3.86c2.26-2.09 3.56-5.17 3.56-8.59z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.77c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.52a7.2 7.2 0 0 1 0-4.59V6.84H1.29a12 12 0 0 0 0 10.77l3.98-3.09z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.84l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
              />
            </svg>
            Daftar dengan Google
          </Button>
        </Card>

        <div className="mt-4 text-center text-body text-text-main">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-primary-600 hover:underline">
            Masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
