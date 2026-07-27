'use client';

import { BellRing, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function NotificationsPage() {
  // Mock data for MVP as per PRD
  const notifications = [
    {
      id: '1',
      title: 'Pesanan Anda Diterima',
      description: 'Peternak "Sinar Terang" telah menerima pesanan Anda. Pesanan sedang disiapkan.',
      time: '10 menit yang lalu',
      type: 'success',
      icon: CheckCircle2,
      isRead: false
    },
    {
      id: '2',
      title: 'Pesanan Kadaluarsa',
      description: 'Maaf, pesanan Anda di "Ayam Maju" dibatalkan karena melewati batas waktu konfirmasi (3 menit).',
      time: '2 jam yang lalu',
      type: 'error',
      icon: XCircle,
      isRead: true
    },
    {
      id: '3',
      title: 'Menunggu Konfirmasi Peternak',
      description: 'Pesanan Anda berhasil dibuat dan sedang menunggu konfirmasi peternak "Ayam Maju".',
      time: '2 jam yang lalu',
      type: 'info',
      icon: Clock,
      isRead: true
    }
  ];

  return (
    <div className="mx-auto w-full max-w-3xl py-4 md:py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-display text-text-main">Notifikasi</h1>
        <button className="text-sm font-semibold text-primary-600 hover:text-primary-700">
          Tandai semua dibaca
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {notifications.map((notif) => {
          const Icon = notif.icon;
          return (
            <Card 
              key={notif.id} 
              className={`p-4 transition-colors hover:bg-neutral-50 ${!notif.isRead ? 'border-l-4 border-l-primary-500 bg-primary-50/30' : ''}`}
            >
              <div className="flex gap-4">
                <div className={`mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                  notif.type === 'success' ? 'bg-success-bg text-success' :
                  notif.type === 'error' ? 'bg-danger-light text-danger' :
                  'bg-primary-100 text-primary-600'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className={`text-body-medium ${!notif.isRead ? 'text-text-main font-bold' : 'text-text-main font-semibold'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-caption text-text-desc whitespace-nowrap">{notif.time}</span>
                  </div>
                  <p className="text-body-small text-text-desc mt-1">
                    {notif.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
