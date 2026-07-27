'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

interface BankAccountFormProps {
  initialBankName: string;
  initialAccountNumber: string;
  initialAccountHolder: string;
}

export function BankAccountForm({
  initialBankName,
  initialAccountNumber,
  initialAccountHolder,
}: BankAccountFormProps) {
  const [bankName, setBankName] = useState(initialBankName);
  const [accountNumber, setAccountNumber] = useState(initialAccountNumber);
  const [accountHolder, setAccountHolder] = useState(initialAccountHolder);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/peternak/bank-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_name: bankName,
          bank_account_number: accountNumber,
          bank_account_holder: accountHolder,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan rekening');
      setMessage({ type: 'success', text: 'Rekening berhasil disimpan.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Terjadi kesalahan' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="bankName">Nama Bank</Label>
        <Input
          id="bankName"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          placeholder="Contoh: BCA, BRI, Mandiri"
        />
      </div>
      <div>
        <Label htmlFor="accountNumber">Nomor Rekening</Label>
        <Input
          id="accountNumber"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          inputMode="numeric"
          placeholder="Nomor rekening tujuan"
        />
      </div>
      <div>
        <Label htmlFor="accountHolder">Nama Pemilik Rekening</Label>
        <Input
          id="accountHolder"
          value={accountHolder}
          onChange={(e) => setAccountHolder(e.target.value)}
          placeholder="Sesuai buku tabungan"
        />
      </div>

      {message && (
        <p
          className={
            message.type === 'success'
              ? 'text-body-medium text-success-text'
              : 'text-body-medium text-danger-text'
          }
        >
          {message.text}
        </p>
      )}

      <Button type="submit" disabled={saving} className="self-start">
        {saving ? 'Menyimpan...' : 'Simpan Rekening'}
      </Button>
    </form>
  );
}
