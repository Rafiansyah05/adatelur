'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Eye, EyeOff } from 'lucide-react';

const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501430654243-c934cec2e1c0?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&q=80'
];

export default function ConsumerRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [bgIndex, setBgIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (cleanedPhone.startsWith('0')) {
      setErrorMessage('Nomor telepon tidak boleh diawali dengan angka 0.');
      setIsSubmitting(false);
      return;
    }

    if (cleanedPhone.length !== 11) {
      setErrorMessage('Nomor telepon harus tepat 11 digit (setelah +62).');
      setIsSubmitting(false);
      return;
    }

    const formattedPhone = `62${cleanedPhone}`;

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone: formattedPhone,
          role: 'consumer'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error || 'Terjadi kesalahan sistem.');
        setIsSubmitting(false);
        return;
      }

      router.push(`/register-consumer/verify?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setErrorMessage('Terjadi kesalahan tidak terduga.');
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
            alt="Background eggs"
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
              Satu Langkah<br />Menuju Kemudahan.
            </h1>
            <p className="text-[18px] text-neutral-200 max-w-md leading-relaxed font-medium">
              Bergabunglah menjadi pembeli cerdas dan dapatkan telur segar langsung dari peternak terdekat.
            </p>
          </div>
        </div>

        <div className="flex w-full lg:w-[45%] flex-col justify-center items-center p-6 overflow-y-auto">
          <div className="w-full max-w-[420px] py-10">
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
              <div className="mb-10 text-center">
                <h2 className="text-[24px] font-extrabold text-neutral-900 mb-2 tracking-tight">Daftar Konsumen</h2>
                <p className="text-[14px] text-neutral-500 font-medium">Lengkapi data diri Anda di bawah ini.</p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Nama Lengkap (Contoh: Siti Rahayu)"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="min-h-[52px] rounded-sm bg-white border border-neutral-200 focus:bg-white focus:border-primary-400 focus:outline-none transition-none font-medium placeholder:text-neutral-400 px-5 hover:border-neutral-300"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="relative flex items-center">
                    <span className="absolute left-5 font-bold text-neutral-500">+62</span>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="81234567890"
                      value={phoneNumber}
                      maxLength={11}
                      onChange={(event) => {
                        const val = event.target.value.replace(/\D/g, '').slice(0, 11);
                        setPhoneNumber(val);
                      }}
                      className="min-h-[52px] rounded-sm bg-white border border-neutral-200 focus:bg-white focus:border-primary-400 focus:outline-none transition-none font-medium placeholder:text-neutral-400 pl-14 pr-5 hover:border-neutral-300 w-full"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Alamat Email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="min-h-[52px] rounded-sm bg-white border border-neutral-200 focus:bg-white focus:border-primary-400 focus:outline-none transition-none font-medium placeholder:text-neutral-400 px-5 hover:border-neutral-300"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Kata Sandi (Minimal 6 karakter)"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      minLength={6}
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

                {errorMessage && <p className="text-[13px] text-red-500 font-medium text-center">{errorMessage}</p>}

                <Button type="submit" className="w-full min-h-[52px] text-[15px] font-bold rounded-sm text-neutral-900 bg-primary-400 border border-transparent hover:bg-primary-400 hover:border-primary-600 transition-none mt-2" disabled={isSubmitting}>
                  {isSubmitting ? 'Memproses...' : 'Daftar Sekarang'}
                </Button>
              </form>

              <div className="flex items-center gap-4 my-8">
                <div className="h-[1px] flex-1 bg-neutral-200" />
                <span className="text-[12px] font-bold text-neutral-400 tracking-widest uppercase">Atau</span>
                <div className="h-[1px] flex-1 bg-neutral-200" />
              </div>

              <Button
                type="button"
                className="w-full gap-3 min-h-[52px] border border-neutral-200 bg-white rounded-sm text-[14px] font-bold text-neutral-700 hover:bg-white hover:border-neutral-400 transition-none flex items-center justify-center"
                onClick={handleGoogleRegister}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.4 5.4 0 0 1-2.4 3.58v2.77h3.86c2.26-2.09 3.56-5.17 3.56-8.59z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.77c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
                  <path fill="#FBBC05" d="M5.27 14.52a7.2 7.2 0 0 1 0-4.59V6.84H1.29a12 12 0 0 0 0 10.77l3.98-3.09z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.84l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
                </svg>
                Daftar dengan Google
              </Button>

              <div className="mt-8 text-center text-[14px] font-medium text-neutral-800">
                Sudah memiliki akun?{' '}
                <Link href="/login" className="font-bold text-primary-600 hover:underline">
                  Masuk
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
