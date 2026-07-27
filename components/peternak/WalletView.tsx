'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  balance_after: number;
  note: string | null;
  created_at: string;
}

interface WithdrawalRecord {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  bank_name: string;
  bank_account_number: string;
  requested_at: string;
  note: string | null;
}

interface WalletData {
  balance: number;
  pending: number;
  available: number;
  bank: { filled: boolean };
  transactions: WalletTransaction[];
  withdrawals: WithdrawalRecord[];
}

function formatRupiah(value: number) {
  return `Rp${Number(value).toLocaleString('id-ID')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const withdrawalStatusStyle: Record<WithdrawalRecord['status'], { label: string; className: string }> = {
  pending: { label: 'Menunggu', className: 'bg-primary-100 text-primary-700' },
  completed: { label: 'Selesai', className: 'bg-success-light text-success-text' },
  rejected: { label: 'Ditolak', className: 'bg-danger-light text-danger-text' },
};

export function WalletView() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/peternak/wallet');
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setMessage({ type: 'error', text: 'Masukkan jumlah yang valid.' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/peternak/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: value }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mencairkan saldo');
      setMessage({ type: 'success', text: 'Saldo berhasil dicairkan.' });
      setAmount('');
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Terjadi kesalahan' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-body text-text-desc">Memuat...</p>;
  }

  if (!data) {
    return <p className="text-body text-danger-text">Gagal memuat data saldo.</p>;
  }

  const canWithdraw = data.bank.filled && data.balance > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-border rounded-lg shadow-md p-5">
        <p className="text-caption text-text-desc">Saldo</p>
        <p className="text-display text-text-main">{formatRupiah(data.balance)}</p>
      </div>

      {!data.bank.filled && (
        <div className="bg-danger-light border border-border rounded-lg p-4">
          <p className="text-body-medium text-danger-text mb-2">
            Rekening bank belum diisi. Isi dulu sebelum mencairkan saldo.
          </p>
          <Link href="/dashboard/profile" className="text-body-medium text-primary-700 underline">
            Isi rekening di halaman Akun
          </Link>
        </div>
      )}

      <div className="bg-white border border-border rounded-lg shadow-md p-5">
        <h2 className="text-h2 text-text-main mb-4">Cairkan Saldo</h2>
        <form onSubmit={handleWithdraw} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Jumlah pencairan (Rp)"
            disabled={!canWithdraw}
            className="sm:flex-1"
          />
          <Button type="submit" disabled={!canWithdraw || submitting}>
            {submitting ? 'Memproses...' : 'Cairkan'}
          </Button>
        </form>
        {message && (
          <p
            className={
              message.type === 'success'
                ? 'mt-3 text-body-medium text-success-text'
                : 'mt-3 text-body-medium text-danger-text'
            }
          >
            {message.text}
          </p>
        )}
      </div>

      <div className="bg-white border border-border rounded-lg shadow-md p-5">
        <h2 className="text-h2 text-text-main mb-4">Riwayat Pencairan</h2>
        {data.withdrawals.length === 0 ? (
          <p className="text-body text-text-desc">Belum ada pengajuan pencairan.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {data.withdrawals.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-body-medium text-text-main">{formatRupiah(w.amount)}</p>
                  <p className="text-caption text-text-desc">
                    {w.bank_name} - {w.bank_account_number}
                  </p>
                  <p className="text-caption text-text-desc">{formatDate(w.requested_at)}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-caption ${withdrawalStatusStyle[w.status].className}`}
                >
                  {withdrawalStatusStyle[w.status].label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white border border-border rounded-lg shadow-md p-5">
        <h2 className="text-h2 text-text-main mb-4">Riwayat Mutasi</h2>
        {data.transactions.length === 0 ? (
          <p className="text-body text-text-desc">Belum ada mutasi saldo.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {data.transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-body text-text-main">{t.note || (t.type === 'credit' ? 'Pemasukan' : 'Pengeluaran')}</p>
                  <p className="text-caption text-text-desc">{formatDate(t.created_at)}</p>
                </div>
                <span
                  className={
                    t.type === 'credit'
                      ? 'text-body-medium text-success-text'
                      : 'text-body-medium text-danger-text'
                  }
                >
                  {t.type === 'credit' ? '+' : '-'}
                  {formatRupiah(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
