'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

interface WalletCardProps {
  hideCairkanDana?: boolean;
}

export function WalletCard({ hideCairkanDana }: WalletCardProps = {}) {
  const [balance, setBalance] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [fullName, setFullName] = useState<string>('Memuat...');
  const [joinDate, setJoinDate] = useState<string>('--/--/--');

  useEffect(() => {
    fetch('/api/peternak/wallet')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setBalance(Number(data.balance));
          if (data.peternak) {
            setFullName(data.peternak.full_name || 'Peternak');
            if (data.peternak.created_at) {
              const date = new Date(data.peternak.created_at);
              const day = date.getDate().toString().padStart(2, '0');
              const month = (date.getMonth() + 1).toString().padStart(2, '0');
              const year = date.getFullYear().toString().slice(2);
              setJoinDate(`${day}/${month}/${year}`);
            }
          }
        }
      })
      .catch(() => { });
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#FFD500] p-6 shadow-md transition-all hover:shadow-lg h-full min-h-[220px]">
      {/* Decorative Circles Background */}
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full border-[24px] border-white/20 opacity-50"></div>
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full border-[32px] border-white/10 opacity-50"></div>

      <div className="relative z-10 flex flex-col h-full justify-between gap-8">
        {/* Top Section */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-primary-950/80">Saldo Bisnis</p>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl md:text-4xl font-black text-primary-950 tracking-tight">
                {balance === null ? '...' : isVisible ? `Rp${balance.toLocaleString('id-ID')}` : 'Rp ••••••••'}
              </h2>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsVisible(!isVisible);
                }}
                className="text-primary-950/70 hover:text-primary-950 transition-colors p-1"
              >
                {isVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {/* Action text */}
            {!hideCairkanDana && (
              <Link href="/dashboard/wallet" className="text-xs font-bold text-primary-800 hover:text-primary-950 transition-colors mt-2 underline underline-offset-4 decoration-primary-800/30 hover:decoration-primary-950">
                Cairkan Dana &rarr;
              </Link>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex justify-between items-end mt-6">
          <div className="flex flex-col">
            <p className="text-xs font-medium text-primary-950/80 mb-0.5">Sejak</p>
            <p className="text-base font-bold text-primary-950 tracking-wide">{joinDate}</p>
          </div>
          <div className="flex flex-col text-right">
            <p className="text-xs font-medium text-primary-950/80 mb-0.5">Peternak</p>
            <p className="text-base font-bold text-primary-950 tracking-wide line-clamp-1 max-w-[150px] md:max-w-[200px]">{fullName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
