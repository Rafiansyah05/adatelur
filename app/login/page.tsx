import * as React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-h1 text-text-main mb-2">Selamat Datang</h1>
          <p className="text-body text-text-desc">Silakan masuk ke akun adatelur.com Anda</p>
        </div>

        <Card className="space-y-6">
          <form className="space-y-4">
            <div className="space-y-2">
              <label className="text-body-medium text-text-main">Email atau Nomor HP</label>
              <Input type="text" placeholder="Contoh: 08123456789" />
            </div>
            
            <div className="space-y-2">
              <label className="text-body-medium text-text-main">Password</label>
              <Input type="password" placeholder="Masukkan password" />
            </div>

            <Button variant="primary" className="w-full">
              Masuk
            </Button>
          </form>

          <div className="text-center text-body text-text-main border-t border-border pt-4">
            Belum punya akun?{' '}
            <Link href="/register" className="font-semibold text-primary-600 hover:underline">
              Daftar di sini
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
