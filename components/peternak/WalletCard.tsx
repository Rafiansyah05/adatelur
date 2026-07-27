'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wallet } from 'lucide-react';

export function WalletCard() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/peternak/wallet')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setBalance(Number(data.balance));
      })
      .catch(() => {});
  }, []);

  return (
    <Link
      href="/dashboard/wallet"
      className="mb-6 block rounded-lg border border-border bg-white p-5 shadow-md transition-colors hover:border-primary-400"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-caption text-text-desc">Saldo Saya</p>
            <p className="text-h2 text-text-main">
              {balance === null ? '...' : `Rp${balance.toLocaleString('id-ID')}`}
            </p>
          </div>
        </div>
        <span className="text-body-medium text-primary-700">Cairkan &rarr;</span>
      </div>
    </Link>
  );
}
