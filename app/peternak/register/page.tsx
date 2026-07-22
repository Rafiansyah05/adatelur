'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';

export default function RegisterPeternak() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    birthDate: '',
    address: '',
    lat: 0,
    lon: 0,
  });

  const handleLocationSelect = (address: string, lat: number, lon: number) => {
    setFormData((prev) => ({
      ...prev,
      address,
      lat,
      lon,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lat || !formData.lon) {
      alert('Silakan pilih lokasi kandang yang akurat terlebih dahulu.');
      return;
    }
    
    alert('Registrasi Tahap 1 Berhasil!\n\nAlamat: ' + formData.address);
  };

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="bg-primary-50 px-4 py-8">
        <h1 className="mb-2 text-display text-text-main">Daftar Jadi Peternak</h1>
        <p className="mb-6 text-[14px] text-text-main">
          Jangkau konsumen langsung dan tingkatkan omzet Anda. Mulai dari mengisi data dasar.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-md border border-border bg-white p-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Nama Pemilik Peternakan</Label>
            <Input
              id="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full"
              placeholder="Contoh: Budi Santoso"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Nomor HP (WhatsApp)</Label>
            <Input
              id="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full"
              placeholder="081234567890"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="birthDate">Tanggal Lahir</Label>
            <Input
              id="birthDate"
              type="date"
              required
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Lokasi Kandang (Titik Kordinat Maps)</Label>
            <AddressAutocomplete onLocationSelect={handleLocationSelect} />
            {formData.address && (
              <p className="mt-2 rounded-md bg-success-bg p-2 text-[12px] font-semibold text-success-text">
                ✓ Lokasi terpilih: {formData.address.split(',').slice(0, 3).join(',')}
              </p>
            )}
          </div>

          <Button type="submit" variant="primary" className="mt-4">
            Lanjut ke Tahap 2
          </Button>
        </form>
      </div>
    </main>
  );
}
