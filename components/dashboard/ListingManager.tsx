'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

export function ListingManager({ initialData }: { initialData?: any }) {
  const [price, setPrice] = useState(initialData?.price_per_rak || 0);
  const [stock, setStock] = useState(initialData?.stock_rak || 0);
  const [isActive, setIsActive] = useState(initialData ? initialData.is_listing_active : true);
  const [msg, setMsg] = useState('');

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Gagal menyimpan listing');
      return res.json();
    },
    onSuccess: () => {
      setMsg('Listing berhasil diperbarui!');
      setTimeout(() => setMsg(''), 3000);
    },
    onError: () => {
      setMsg('Terjadi kesalahan.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ price_per_rak: price, stock_rak: stock, is_listing_active: isActive });
  };

  return (
    <div className="rounded-md border border-border bg-white p-4">
      <h2 className="mb-4 text-h3 text-text-main">Listing Hari Ini</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Harga per Rak (Rp)</Label>
          <Input 
            type="number" 
            value={price} 
            onChange={(e) => setPrice(Number(e.target.value))} 
            required 
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Stok (Jumlah Rak)</Label>
          <Input 
            type="number" 
            value={stock} 
            onChange={(e) => setStock(Number(e.target.value))} 
            required 
          />
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={isActive} 
            onChange={(e) => setIsActive(e.target.checked)} 
            className="h-5 w-5 accent-primary-400"
          />
          <Label>Aktifkan Penjualan Hari Ini</Label>
        </div>
        {msg && <p className="text-[14px] font-semibold text-primary-950">{msg}</p>}
        <Button type="submit" variant="primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Menyimpan...' : 'Simpan Listing'}
        </Button>
      </form>
    </div>
  );
}
