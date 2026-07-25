'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if user is actually authenticated from the recovery link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Sometimes the session is not immediately available, supabase client handles the hash on load
        const { data: hashSession } = await supabase.auth.getSession();
        if (!hashSession.session) {
          setErrorMsg('Tautan reset password tidak valid atau sudah kadaluarsa.');
        }
      }
    };
    checkSession();
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password minimal 6 karakter');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      setSuccess(true);
      // Wait a moment before redirecting
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mereset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 border border-border">
        <div className="text-center mb-8">
          <h1 className="text-display text-text-main mb-2">Buat Password Baru</h1>
          <p className="text-body-small text-text-desc">
            Silakan masukkan password baru Anda.
          </p>
        </div>

        {success ? (
          <div className="rounded-md bg-success-bg p-4 text-center border border-success">
            <p className="text-success-text font-medium mb-4">
              Password berhasil diubah! Anda akan dialihkan ke halaman Login...
            </p>
            <Link href="/login" className="text-primary-700 font-bold hover:underline">
              Masuk Sekarang
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <Label htmlFor="password" className="mb-2 block">Password Baru</Label>
              <Input
                id="password"
                type="password"
                required
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="confirmPassword" className="mb-2 block">Konfirmasi Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                placeholder="Tulis ulang password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            
            {errorMsg && (
              <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-md border border-red-100">
                {errorMsg}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold">
              {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
