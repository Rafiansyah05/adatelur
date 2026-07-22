'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

const authErrorMessages: Record<string, string> = {
  'Invalid login credentials': 'Email atau password salah.',
  'Email not confirmed': 'Email Anda belum diverifikasi. Silakan cek email untuk kode verifikasi.',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleGoogleLogin = async () => {
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMessage(authErrorMessages[error.message] ?? error.message);
      setIsSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    router.push(profile?.role === 'peternak' ? '/dashboard' : '/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-4">
      <div className="w-full max-w-md">
        <div className="mb-4 text-center">
          <h1 className="text-h1 text-text-main mb-2">Selamat Datang</h1>
          <p className="text-body text-text-desc">Silakan masuk ke akun adatelur.com Anda</p>
        </div>

        <Card className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
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
                placeholder="Masukkan password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {errorMessage && <p className="text-[12px] text-[#E23D28]">{errorMessage}</p>}

            <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses...' : 'Masuk'}
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
            onClick={handleGoogleLogin}
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
            Masuk dengan Google
          </Button>
        </Card>

        <div className="mt-4 text-center text-body text-text-main flex flex-col gap-2">
          <span>
            Konsumen baru?{' '}
            <Link href="/register-consumer" className="font-semibold text-primary-600 hover:underline">
              Daftar di sini
            </Link>
          </span>
          <span>
            Peternak baru?{' '}
            <Link href="/register" className="font-semibold text-primary-600 hover:underline">
              Daftar Mitra Peternak
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
