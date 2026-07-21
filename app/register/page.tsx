import * as React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export default function RegisterRoleSelectionPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-h1 text-text-main mb-2">Buat Akun</h1>
          <p className="text-body text-text-desc">Siapakah Anda?</p>
        </div>

        <div className="space-y-4">
          <Link href="/register/consumer" className="block">
            <Card className="flex items-center hover:border-primary-400 cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-[20px]">
                🍳
              </div>
              <div className="ml-4">
                <h3 className="text-h3 text-text-main">Konsumen</h3>
                <p className="text-caption text-text-desc mt-1">Saya ingin membeli telur</p>
              </div>
            </Card>
          </Link>

          <Link href="/register/peternak" className="block">
            <Card className="flex items-center hover:border-primary-400 cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-bg text-[20px]">
                🐔
              </div>
              <div className="ml-4">
                <h3 className="text-h3 text-text-main">Peternak</h3>
                <p className="text-caption text-text-desc mt-1">Saya ingin menjual telur</p>
              </div>
            </Card>
          </Link>
        </div>

        <div className="mt-8 text-center text-body text-text-main">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-primary-600 hover:underline">
            Masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
