import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ScoreCard } from '@/components/ui/ScoreCard';

export default function StyleGuidePage() {
  return (
    <div className="min-h-screen bg-cream p-8">
      <div className="mx-auto max-w-4xl space-y-12">
        
        <div>
          <h1 className="text-h1 text-text-main mb-2">Style Guide - adatelur.com</h1>
          <p className="text-text-desc text-body">
            Validasi visual komponen UI. Pastikan tidak ada shadow, gradient, atau warna ungu.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-h2 text-text-main border-b border-border pb-2">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Outline</Button>
            <Button variant="success">Success Button</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-h2 text-text-main border-b border-border pb-2">Badges (Status)</h2>
          <div className="flex flex-wrap gap-4">
            <Badge status="Tersedia" />
            <Badge status="Menunggu" />
            <Badge status="Diterima" />
            <Badge status="Ditolak" />
            <Badge status="Kadaluarsa" />
            <Badge status="Selesai" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-h2 text-text-main border-b border-border pb-2">Input Form</h2>
          <div className="max-w-md space-y-4">
            <Input type="text" placeholder="Masukkan nama Anda..." />
            <Input type="number" placeholder="Jumlah rak..." />
            <Input type="text" placeholder="Disabled input" disabled />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-h2 text-text-main border-b border-border pb-2">ScoreCard (Peternak Card)</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-caption text-text-desc mb-2">Default</p>
              <ScoreCard
                peternakName="Sentra Telur Cimahi"
                avatarInitials="ST"
                rating={4.8}
                score={87}
                pricePerRak={35000}
                estimatedOngkir={12000}
              />
            </div>
            <div>
              <p className="text-caption text-text-desc mb-2">Top Pick (Highlight)</p>
              <ScoreCard
                peternakName="Peternakan Bahagia"
                avatarInitials="PB"
                rating={4.9}
                score={99}
                pricePerRak={34500}
                estimatedOngkir={10000}
                isTopPick
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-h2 text-text-main border-b border-border pb-2">Generic Card</h2>
          <div className="max-w-md">
            <Card>
              <h3 className="text-h3 text-text-main mb-2">Informasi Pesanan</h3>
              <p className="text-body text-text-desc mb-4">
                Ini adalah card biasa untuk menampung konten umum. Bebas bayangan, flat design.
              </p>
              <Button variant="secondary">Lihat Detail</Button>
            </Card>
          </div>
        </section>

      </div>
    </div>
  );
}
