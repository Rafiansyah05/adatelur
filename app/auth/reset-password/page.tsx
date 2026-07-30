'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501430654243-c934cec2e1c0?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&q=80',
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [bgIndex, setBgIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const initSession = async () => {
      const supabase = createClient();
      const params = new URLSearchParams(window.location.search);
      const email = params.get('email');
      const token = params.get('token');
      const token_hash = params.get('token_hash');
      const code = params.get('code');

      if (email && token) {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'recovery',
        });
        if (error) {
          setErrorMessage('Tautan reset kata sandi tidak valid atau telah kadaluarsa.');
        }
      } else if (token_hash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'recovery',
        });
        if (error) {
          setErrorMessage('Tautan reset kata sandi tidak valid atau telah kadaluarsa.');
        }
      } else if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
    };
    initSession();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal harus 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw new Error(error.message || 'Gagal memperbarui kata sandi. Tautan mungkin telah kadaluarsa.');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
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
              Kata Sandi Baru,<br />Keamanan Baru.
            </h1>
            <p className="text-[18px] text-neutral-200 max-w-md leading-relaxed font-medium">
              Buat kata sandi baru yang kuat untuk melindung akun Anda.
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
              {isSuccess ? (
                <div className="space-y-6 text-center py-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-neutral-900 mb-2">Kata Sandi Diperbarui!</h3>
                    <p className="text-sm text-neutral-600 leading-relaxed font-medium">
                      Kata sandi akun Anda telah berhasil diubah. Silakan masuk menggunakan kata sandi baru Anda.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="w-full min-h-[52px] text-[15px] font-bold rounded-sm text-neutral-900 bg-primary-400 hover:bg-primary-500 transition-none"
                  >
                    Masuk Sekarang
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-8 text-center">
                    <h2 className="text-[24px] font-extrabold text-neutral-900 mb-2 tracking-tight">Buat Kata Sandi Baru</h2>
                    <p className="text-[14px] text-neutral-500 font-medium">Masukkan kata sandi baru untuk akun Anda.</p>
                  </div>

                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Kata Sandi Baru"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          className="min-h-[52px] rounded-sm bg-white border border-neutral-200 focus:bg-white focus:border-primary-400 focus:outline-none transition-none font-medium placeholder:text-neutral-400 px-5 pr-12 hover:border-neutral-300"
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Konfirmasi Kata Sandi Baru"
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          className="min-h-[52px] rounded-sm bg-white border border-neutral-200 focus:bg-white focus:border-primary-400 focus:outline-none transition-none font-medium placeholder:text-neutral-400 px-5 pr-12 hover:border-neutral-300"
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {errorMessage && (
                      <p className="text-[13px] text-red-500 font-medium text-center bg-red-50 p-3 rounded-sm border border-red-100">
                        {errorMessage}
                      </p>
                    )}

                    <Button
                      type="submit"
                      className="w-full min-h-[52px] text-[15px] font-bold rounded-sm text-neutral-900 bg-primary-400 hover:bg-primary-500 transition-none"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Memperbarui...' : 'Simpan Kata Sandi Baru'}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
