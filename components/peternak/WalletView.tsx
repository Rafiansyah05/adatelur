'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { WalletCard } from '@/components/peternak/WalletCard';

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
  const [amountRaw, setAmountRaw] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'semua' | 'mutasi' | 'pencairan'>('semua');

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
    const value = parseInt(amountRaw.replace(/\D/g, ''), 10);
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
      setAmountRaw('');
      await load();
      // Reset wallet card somehow? The wallet card fetches on mount. 
      // We can trigger a reload by reloading the page if success, so it updates the card too.
      window.location.reload();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Terjadi kesalahan' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val === '') {
      setAmountRaw('');
      return;
    }
    setAmountRaw(Number(val).toLocaleString('id-ID'));
  };

  const combinedHistory = useMemo(() => {
    if (!data) return [];
    const arr: any[] = [];
    data.transactions.forEach((t) => {
      arr.push({ ...t, _sortDate: new Date(t.created_at).getTime(), _recordType: 'transaction' });
    });
    data.withdrawals.forEach((w) => {
      arr.push({ ...w, _sortDate: new Date(w.requested_at).getTime(), _recordType: 'withdrawal' });
    });
    arr.sort((a, b) => b._sortDate - a._sortDate);
    return arr;
  }, [data]);

  if (loading) {
    return <div className="py-10 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div></div>;
  }

  if (!data) {
    return <p className="text-body text-danger-text">Gagal memuat data saldo.</p>;
  }

  const canWithdraw = data.bank.filled && data.balance > 0;

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 items-start">
      {/* Kolom Kiri: Card Saldo & Form Pencairan */}
      <div className="lg:col-span-5 flex flex-col gap-6 w-full">
        <div className="h-[220px]">
          <WalletCard hideCairkanDana={true} />
        </div>

        {!data.bank.filled && (
          <div className="bg-danger-light border border-border rounded-xl p-4">
            <p className="text-body-medium text-danger-text mb-2">
              Rekening bank belum diisi. Isi dulu sebelum mencairkan saldo.
            </p>
            <Link href="/dashboard/profile" className="text-body-medium font-bold text-danger hover:underline">
              Isi rekening di halaman Akun &rarr;
            </Link>
          </div>
        )}

        {/* Cairkan Saldo Section */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-neutral-100">
            <h2 className="text-lg font-bold text-neutral-900">Cairkan Saldo</h2>
            <p className="text-sm text-neutral-500 mt-1">Masukkan jumlah saldo yang ingin Anda cairkan ke rekening bank.</p>
          </div>
          <div className="p-5">
            <form onSubmit={handleWithdraw} className="flex flex-col gap-4">
              <div className="relative flex items-center">
                <span className="absolute left-4 font-semibold text-neutral-500">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountRaw}
                  onChange={handleAmountChange}
                  placeholder="0"
                  disabled={!canWithdraw}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 font-medium text-neutral-900 transition-colors disabled:bg-neutral-100"
                />
              </div>
              <Button variant="primary" type="submit" disabled={!canWithdraw || submitting || !amountRaw} className="w-full h-[48px] rounded-xl font-bold">
                {submitting ? 'Memproses...' : 'Ajukan Pencairan'}
              </Button>
            </form>
            {message && (
              <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-success-light text-success-text' : 'bg-danger-light text-danger-text'}`}>
                {message.text}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Tab Riwayat */}
      <div className="lg:col-span-7 flex flex-col w-full">
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-neutral-200 overflow-x-auto hide-scrollbar">
            <button 
              onClick={() => setActiveTab('semua')}
              className={`flex-1 min-w-max py-4 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'semua' ? 'border-primary-500 text-primary-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
            >
              Semua
            </button>
            <button 
              onClick={() => setActiveTab('mutasi')}
              className={`flex-1 min-w-max py-4 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'mutasi' ? 'border-primary-500 text-primary-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
            >
              Riwayat Mutasi
            </button>
            <button 
              onClick={() => setActiveTab('pencairan')}
              className={`flex-1 min-w-max py-4 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'pencairan' ? 'border-primary-500 text-primary-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
            >
              Pencairan Dana
            </button>
          </div>

          <div className="p-0">
            {activeTab === 'semua' && (
              <div className="flex flex-col">
                {combinedHistory.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 text-sm">Belum ada riwayat transaksi.</div>
                ) : (
                  <ul className="flex flex-col divide-y divide-neutral-100">
                    {combinedHistory.map((item, idx) => {
                      if (item._recordType === 'transaction') {
                        return (
                          <li key={`tx-${item.id}`} className="flex items-center justify-between p-5 hover:bg-neutral-50 transition-colors">
                            <div className="flex flex-col gap-1">
                              <p className="text-sm font-bold text-neutral-900">{item.note || (item.type === 'credit' ? 'Pemasukan' : 'Pengeluaran')}</p>
                              <p className="text-xs text-neutral-500">{formatDate(item.created_at)}</p>
                            </div>
                            <span className={`font-bold ${item.type === 'credit' ? 'text-success-text' : 'text-danger-text'}`}>
                              {item.type === 'credit' ? '+' : '-'}{formatRupiah(item.amount)}
                            </span>
                          </li>
                        );
                      } else {
                        return (
                          <li key={`wd-${item.id}`} className="flex items-center justify-between p-5 hover:bg-neutral-50 transition-colors">
                            <div className="flex flex-col gap-1">
                              <p className="text-sm font-bold text-neutral-900">Penarikan Saldo</p>
                              <p className="text-xs text-neutral-500">
                                {item.bank_name} - {item.bank_account_number}
                              </p>
                              <p className="text-xs text-neutral-500">{formatDate(item.requested_at)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-bold text-neutral-900">
                                {formatRupiah(item.amount)}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${withdrawalStatusStyle[item.status as WithdrawalRecord['status']].className}`}>
                                {withdrawalStatusStyle[item.status as WithdrawalRecord['status']].label}
                              </span>
                            </div>
                          </li>
                        );
                      }
                    })}
                  </ul>
                )}
              </div>
            )}

            {activeTab === 'mutasi' && (
              <div className="flex flex-col">
                {data.transactions.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 text-sm">Belum ada riwayat mutasi.</div>
                ) : (
                  <ul className="flex flex-col divide-y divide-neutral-100">
                    {data.transactions.map((item) => (
                      <li key={`mut-${item.id}`} className="flex items-center justify-between p-5 hover:bg-neutral-50 transition-colors">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-bold text-neutral-900">{item.note || (item.type === 'credit' ? 'Pemasukan' : 'Pengeluaran')}</p>
                          <p className="text-xs text-neutral-500">{formatDate(item.created_at)}</p>
                        </div>
                        <span className={`font-bold ${item.type === 'credit' ? 'text-success-text' : 'text-danger-text'}`}>
                          {item.type === 'credit' ? '+' : '-'}{formatRupiah(item.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === 'pencairan' && (
              <div className="flex flex-col">
                {data.withdrawals.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 text-sm">Belum ada pengajuan pencairan.</div>
                ) : (
                  <ul className="flex flex-col divide-y divide-neutral-100">
                    {data.withdrawals.map((item) => (
                      <li key={`wd2-${item.id}`} className="flex items-center justify-between p-5 hover:bg-neutral-50 transition-colors">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-bold text-neutral-900">Penarikan Saldo</p>
                          <p className="text-xs text-neutral-500">
                            {item.bank_name} - {item.bank_account_number}
                          </p>
                          <p className="text-xs text-neutral-500">{formatDate(item.requested_at)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-bold text-neutral-900">
                            {formatRupiah(item.amount)}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${withdrawalStatusStyle[item.status as WithdrawalRecord['status']].className}`}>
                            {withdrawalStatusStyle[item.status as WithdrawalRecord['status']].label}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
