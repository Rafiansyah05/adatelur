# Adatelur.com Platform

Platform pemesanan telur untuk menghubungkan peternak dan konsumen.

## Persyaratan
- Node.js 18+ atau versi terbaru.
- Package manager: npm.

## Cara Clone & Instalasi
1. Clone repositori ini:
   ```bash
   git clone https://github.com/Rafiansyah05/adatelur.git
   cd adatelur
   ```
2. Install semua dependencies:
   ```bash
   npm install
   ```
3. Copy file `.env.example` menjadi `.env.local` dan isi nilainya (hubungi tim untuk credentials):
   ```bash
   cp .env.example .env.local
   ```

## Menjalankan Project (Local Development)
Jalankan development server:
```bash
npm run dev
```
Akses `http://localhost:3000` di browser.

## Tech Stack
- Framework: Next.js 14 (App Router)
- Bahasa: TypeScript
- Styling: Tailwind CSS
- Database & Auth: Supabase
