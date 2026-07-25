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

const authErrorMessages: Record<string, string> = {
  'Invalid login credentials': 'Kredensial tidak valid. Jika Anda mendaftar dengan Google, silakan gunakan tombol Google di bawah.',
  'Email not confirmed': 'Surat elektronik Anda menanti konfirmasi. Periksa kotak masuk Anda.',
};

const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501430654243-c934cec2e1c0?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&q=80'
];

export default function LoginPage() {
  const router = useRouter();
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

    if (profile?.role === 'admin') {
      router.push('/admin/dashboard');
    } else if (profile?.role === 'peternak') {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

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
      <div className="absolute inset-0 z-0 bg-black/40" /> {/* Dark Overlay */}

      {/* Content Container */}
      <div className="relative z-10 flex w-full h-screen">
        {/* Left Panel - Branding */}
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
              Merajut pertemuan antara peternak berdedikasi dan konsumen cerdas.
            </p>
          </div>
        </div>

        {/* Right Panel - Authentication */}
        <div className="flex w-full lg:w-[45%] flex-col justify-center items-center p-6">
          <div className="w-full max-w-[420px]">
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

            <div className="p-8 sm:p-10 bg-white rounded-sm">
              <div className="mb-10 text-center">
                <h2 className="text-[24px] font-extrabold text-neutral-900 mb-2 tracking-tight">Selamat Kembali</h2>
                <p className="text-[14px] text-neutral-500 font-medium">Mari mulai perjalanan Anda hari ini.</p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
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
                      placeholder="Kata Sandi"
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
                  <div className="flex justify-end pt-2">
                    <Link href="/auth/forgot-password" className="text-[13px] font-semibold text-neutral-500 hover:text-neutral-800 transition-colors">
                      Lupa Kata Sandi?
                    </Link>
                  </div>
                </div>

                {errorMessage && <p className="text-[13px] text-red-500 font-medium text-center">{errorMessage}</p>}

                <Button type="submit" className="w-full min-h-[52px] text-[15px] font-bold rounded-sm text-neutral-900 bg-primary-400 border border-transparent hover:bg-primary-400 hover:border-primary-600 transition-none" disabled={isSubmitting}>
                  {isSubmitting ? 'Membuka Akses...' : 'Masuk'}
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
                onClick={handleGoogleLogin}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.4 5.4 0 0 1-2.4 3.58v2.77h3.86c2.26-2.09 3.56-5.17 3.56-8.59z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.77c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
                  <path fill="#FBBC05" d="M5.27 14.52a7.2 7.2 0 0 1 0-4.59V6.84H1.29a12 12 0 0 0 0 10.77l3.98-3.09z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.84l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
                </svg>
                Lanjutkan dengan Google
              </Button>

              <div className="mt-8 text-center text-[14px] font-medium text-neutral-800">
                Belum memiliki akses?{' '}
                <Link href="/choose-role" className="font-bold text-neutral-900 hover:underline">
                  Daftar Sekarang
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
