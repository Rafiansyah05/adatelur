'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim email reset password');
      
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 border border-border">
        <div className="text-center mb-8">
          <h1 className="text-display text-text-main mb-2">Lupa Password?</h1>
          <p className="text-body-small text-text-desc">
            Masukkan email Anda dan kami akan mengirimkan link untuk mereset password.
          </p>
        </div>

        {success ? (
          <div className="rounded-md bg-success-bg p-4 text-center border border-success">
            <p className="text-success-text font-medium mb-4">
              Email instruksi reset password telah dikirim ke {email}. Silakan cek kotak masuk atau folder spam Anda.
            </p>
            <Link href="/login" className="text-primary-700 font-bold hover:underline">
              Kembali ke Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <Label htmlFor="email" className="mb-2 block">Email</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            {errorMsg && (
              <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-md border border-red-100">
                {errorMsg}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold">
              {loading ? 'Mengirim...' : 'Kirim Link Reset'}
            </Button>
            
            <p className="text-center text-sm text-text-desc mt-4">
              Ingat password Anda? <Link href="/login" className="text-primary-700 font-bold hover:underline">Masuk</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
