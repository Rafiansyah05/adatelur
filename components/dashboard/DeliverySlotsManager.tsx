'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

export function DeliverySlotsManager({ initialSlots }: { initialSlots: any[] }) {
  const [slots, setSlots] = useState<any[]>(initialSlots);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const addSlotMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/delivery-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Gagal menambah slot');
      return res.json();
    },
    onSuccess: (res) => {
      setSlots((prev) => [...prev, res.data]);
      setDate('');
      setStartTime('');
      setEndTime('');
    }
  });

  const toggleSlotMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await fetch(`/api/delivery-slots/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active }),
      });
      if (!res.ok) throw new Error('Gagal mengubah slot');
      return res.json();
    },
    onSuccess: (res) => {
      setSlots((prev) => prev.map((s) => (s.id === res.data.id ? res.data : s)));
    }
  });

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    addSlotMutation.mutate({ slot_date: date, start_time: startTime, end_time: endTime });
  };

  return (
    <div className="mt-6 rounded-md border border-border bg-white p-4">
      <h2 className="mb-4 text-h3 text-text-main">Manajemen Slot Pengiriman</h2>
      
      <div className="mb-6 flex flex-col gap-3">
        {slots.length === 0 ? (
          <p className="text-[14px] text-text-desc">Belum ada slot tersedia.</p>
        ) : (
          slots.map((slot) => (
            <div key={slot.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-text-main">{slot.slot_date}</span>
                <span className="text-[14px] text-text-desc">{slot.start_time} - {slot.end_time}</span>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => toggleSlotMutation.mutate({ id: slot.id, is_active: !slot.is_active })}
                disabled={toggleSlotMutation.isPending}
                className={slot.is_active ? 'border-primary-400 bg-primary-50 text-primary-950' : 'bg-gray-100 text-gray-500'}
              >
                {slot.is_active ? 'Aktif' : 'Nonaktif'}
              </Button>
            </div>
          ))
        )}
      </div>

      <h3 className="mb-3 text-[14px] font-semibold text-text-main">Tambah Slot Baru</h3>
      <form onSubmit={handleAddSlot} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Tanggal</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="flex gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <Label>Jam Mulai</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <Label>Jam Selesai</Label>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </div>
        </div>
        <Button type="submit" variant="primary" disabled={addSlotMutation.isPending}>
          {addSlotMutation.isPending ? 'Menambahkan...' : 'Tambah Slot'}
        </Button>
      </form>
    </div>
  );
}
