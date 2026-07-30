import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { PwaInstallPrompt } from '@/components/pwa/PwaInstallPrompt';
import { GlobalToast } from '@/components/ui/toast';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
});

export const viewport: Viewport = {
  themeColor: '#FFDC36',
};

export const metadata: Metadata = {
  title: 'Adatelur',
  description: 'Platform pemesanan telur untuk menghubungkan peternak dan konsumen.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'adatelur',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

import Providers from './providers';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${plusJakartaSans.variable} font-sans antialiased bg-white text-text-main`}>
        <Providers>
          {children}
          <PwaInstallPrompt />
          <GlobalToast />
        </Providers>
      </body>
    </html>
  );
}
