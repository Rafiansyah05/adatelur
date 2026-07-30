# Tech Stack — adatelur

Versi: 1.0 | Tanggal: 21 Juli 2026
Rujukan: `prd.md`, `schema_database.md`
Constraint utama: **Build dalam 9 hari (21–29 Juli 2026), tim 3 orang.**

---

## 1. Prinsip Pemilihan Stack

Setiap keputusan di dokumen ini dioptimalkan untuk **kecepatan build**, bukan skalabilitas jangka panjang. Prioritas:

1. Minimalkan jumlah service/infra terpisah yang harus di-setup & di-deploy.
2. Pilih tools dengan dokumentasi Bahasa Indonesia/komunitas lokal kuat (mempercepat troubleshooting saat stuck).
3. Hindari integrasi yang butuh approval/verifikasi bisnis (mis. WhatsApp Business API resmi Meta bisa makan waktu berhari-hari untuk verified) — pilih alternatif yang bisa langsung jalan hari itu juga.
4. Satu bahasa (TypeScript) di seluruh stack — tidak perlu context-switch antara Python/Node/dll.

---

## 2. Stack Utama (Ringkasan)

| Layer | Pilihan | Alasan |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | Frontend + API routes dalam 1 project — tidak perlu backend terpisah |
| Styling | **Tailwind CSS** | Cepat, konsisten dengan design token (lihat `design_system.md`) |
| Font | **Plus Jakarta Sans** (via `next/font/google`) | Wajib dipakai di seluruh sistem (lihat `design_system.md`) |
| Database + Auth + Storage | **Supabase** | Postgres + Auth (Google OAuth built-in) + Storage (foto) + Realtime dalam satu platform, free tier cukup untuk MVP |
| State/data fetching | **TanStack Query (React Query)** | Cache, refetch, sinkron dengan Supabase Realtime |
| PWA | **`next-pwa`** (atau manual service worker + manifest.json) | Wajib untuk kedua role sesuai PRD |
| WhatsApp Gateway | **Fonnte** | Unofficial WA API berbasis QR-scan device linking, tidak perlu approval bisnis, cocok untuk hackathon/demo, ada free tier/trial |
| Payment | **Midtrans Snap (Sandbox)** | Integrasi Next.js mudah, cukup sandbox mode untuk demo (tidak perlu transaksi uang asli saat presentasi) |
| Jarak/Ongkir | **Formula Haversine** (built-in JS, tanpa API eksternal) | Hindari dependency ke Google Maps Distance Matrix API (butuh billing account + quota) |
| Push Notification | **Web Push API (VAPID keys)** | Native browser API, tidak perlu service pihak ketiga |
| Kamera in-app | **`react-webcam`** atau native `getUserMedia` | Untuk fitur ambil foto langsung (bukan upload galeri) di bukti pengiriman & verifikasi peternak |
| Hosting | **Vercel** (frontend + API routes) | Deploy otomatis dari GitHub, gratis untuk kebutuhan demo |
| Version Control | **GitHub** (1 repo, monorepo Next.js) | Tidak perlu pisah repo FE/BE — kurangi overhead koordinasi tim 3 orang |
| AI (opsional/stretch) | **Claude API (Anthropic)** | Untuk fitur chat asisten operasional peternak (stretch goal) |

---

## 3. Detail & Justifikasi Per Komponen

### 3.1 Next.js — Single Codebase, Bukan Monorepo Terpisah

Tim sempat berdiskusi apakah backend & frontend dipisah repo. **Rekomendasi: JANGAN dipisah.** Dengan 9 hari & 3 orang, memisah FE/BE menambah overhead deployment ganda, environment variable ganda, dan CORS handling yang tidak perlu.

Next.js API Routes (`app/api/*/route.ts`) sudah cukup untuk seluruh business logic:
- Endpoint smart routing (`/api/orders/recommend`)
- Endpoint scoring recalculation (`/api/peternak/[id]/recalculate-score`)
- Webhook Midtrans (`/api/payment/webhook`)
- Webhook Fonnte (`/api/whatsapp/webhook`) — untuk menerima balasan Terima/Tolak dari peternak

### 3.2 Supabase — Kenapa Bukan Firebase atau Backend Custom

- Postgres relasional cocok dengan kebutuhan schema yang cukup kompleks (order, scoring, rating saling terkait) — dibanding Firestore (NoSQL) yang akan menyulitkan query smart routing.
- Auth Google OAuth sudah built-in, tidak perlu setup Firebase Auth terpisah.
- Storage untuk foto (verifikasi peternak, bukti pengiriman) langsung terintegrasi, tidak perlu S3/Cloudinary terpisah.
- Realtime subscription native — pas untuk update status order secara live di layar konsumen tanpa polling manual.

### 3.3 WhatsApp Integration — Fonnte, Bukan WhatsApp Business API Resmi

WhatsApp Business API resmi (Meta Cloud API) butuh proses verifikasi bisnis yang bisa makan waktu berhari-hari — **tidak feasible untuk timeline 9 hari.**

**Fonnte** dipilih karena:
- Aktivasi cukup **scan QR code** dari nomor WhatsApp biasa (persis seperti yang didiskusikan tim: *"pakai font, dia login ke WhatsApp di website, scan QR, backend cukup melakukan request API doang"*).
- API sederhana: kirim pesan via HTTP POST, terima webhook untuk pesan masuk (termasuk quick-reply button Terima/Tolak dari peternak).
- Ada free trial/tier murah, cukup untuk kebutuhan demo dengan volume pesan rendah.

**Alternatif cadangan jika Fonnte bermasalah:** Wablas (model serupa, QR-based).

**Catatan risiko:** layanan unofficial seperti ini berjalan di atas WhatsApp Web protocol — ada risiko nomor ter-flag jika volume pesan tinggi dalam waktu singkat. Untuk demo kompetisi, risiko ini dapat diabaikan (volume rendah, terkontrol), tapi wajib dicatat sebagai catatan "Phase 2: migrasi ke WhatsApp Business API resmi" di dokumentasi jika ditanya juri soal skalabilitas produksi.

### 3.4 Ongkir — Haversine Formula, Bukan Google Maps API

Tim menyebutkan ongkir dihitung "per kilometer". Untuk MVP, **hindari Google Maps Distance Matrix API** karena:
- Butuh billing account aktif (walau ada free credit, setup memakan waktu & rawan admin friction).
- Menambah 1 dependency eksternal lagi yang bisa gagal saat demo (rate limit, quota habis, dsb).

**Solusi: Formula Haversine** — menghitung jarak garis lurus antar 2 titik koordinat (lat/long), murni matematika, tanpa API call:

```typescript
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // radius bumi dalam km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateOngkir(distanceKm: number, tarifPerKm: number = 3000): number {
  return Math.ceil(distanceKm) * tarifPerKm;
}
```

Koordinat lat/long peternak & konsumen bisa diambil dari **HTML5 Geolocation API** (browser) atau input alamat manual + geocoding sekali di awal (misal pakai Nominatim/OpenStreetMap gratis, dipanggil hanya saat registrasi — bukan tiap kali order).

### 3.5 Payment — Midtrans Snap Sandbox

- Snap.js menyediakan UI pembayaran siap pakai (popup), integrasi minimal effort.
- **Gunakan Sandbox Mode** untuk seluruh proses build & demo — tidak perlu transaksi uang asli, cukup simulasikan status `paid` via sandbox test card/e-wallet dummy.
- Webhook Midtrans (`notification_url`) dipakai untuk update `payment_status` di tabel `orders` secara otomatis.

### 3.6 PWA — Fitur Wajib, Bukan Opsional

Sesuai PRD, kedua role (konsumen & peternak) mengakses lewat PWA yang sama (1 domain, `adatelur`), dibedakan lewat routing berdasarkan `role` di tabel `profiles`.

Yang wajib ada:
- `manifest.json` — berisi nama app, icon set (192px, 512px), `theme_color` = `#FFDC36` (warna primer, lihat `design_system.md`), `background_color` = `#FFFFFF`, `display: standalone`.
- Service worker (bisa pakai `next-pwa` untuk auto-generate, atau manual jika butuh kontrol custom untuk push notification).
- `beforeinstallprompt` event handler untuk menampilkan tombol "Pasang ke Layar Utama" secara custom (bukan native browser prompt yang kurang menarik).

### 3.7 Push Notification (untuk trigger 3-menit)

Gunakan **Web Push API** dengan VAPID keys:
1. Generate VAPID key pair sekali (`web-push generate-vapid-keys`).
2. Simpan `push_subscription` peternak saat mereka approve permission notifikasi (simpan endpoint & keys di kolom baru pada `peternak_details` atau tabel terpisah `push_subscriptions`).
3. Trigger dari server (via cron job / scheduled function) memanggil `web-push` library untuk push ke browser peternak yang bersangkutan.

**Catatan realistis:** Web Push di PWA bisa tricky di iOS Safari (dukungan lebih baru & terbatas). **Fallback wajib**: WhatsApp tetap jadi kanal utama notifikasi order baru — push notification PWA adalah lapisan tambahan (bonus polish), bukan satu-satunya jalur. Jangan sampai seluruh sistem approval bergantung 100% pada push notification yang gagal terkirim di sebagian device.

---

## 4. Struktur Folder (Rekomendasi)

```
adatelur/
├── app/
│   ├── (consumer)/
│   │   ├── page.tsx                    # Home — form order
│   │   ├── peternak/[id]/page.tsx      # Detail peternak
│   │   ├── orders/[id]/page.tsx        # Tracking order
│   │   └── layout.tsx                  # Bottom nav bar (mobile)
│   ├── (peternak)/
│   │   ├── dashboard/page.tsx
│   │   ├── register/page.tsx           # 3-step registration
│   │   └── layout.tsx
│   ├── api/
│   │   ├── orders/
│   │   │   ├── route.ts
│   │   │   ├── recommend/route.ts      # smart routing logic
│   │   │   └── [id]/respond/route.ts   # accept/reject
│   │   ├── whatsapp/webhook/route.ts
│   │   ├── payment/webhook/route.ts
│   │   └── cron/
│   │       ├── check-expired-orders/route.ts
│   │       └── recalculate-scores/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                             # design system base components
│   └── ...
├── lib/
│   ├── supabase/
│   ├── fonnte/
│   ├── midtrans/
│   ├── haversine.ts
│   └── scoring.ts
├── public/
│   └── manifest.json
└── supabase/
    └── migrations/                     # dari schema_database.md
```

---

## 5. Rekomendasi Timeline Build 9 Hari (High-Level)

*(Detail pembagian tugas per anggota ada di `task_division.md` — ini hanya gambaran umum urutan prioritas teknis.)*

| Fase | Hari | Fokus |
|---|---|---|
| Fondasi | Hari 1 | Setup repo, Supabase project, jalankan seluruh migration dari `schema_database.md`, setup design tokens Tailwind |
| Auth & Registrasi | Hari 2–3 | Login (konsumen), 3-step registration (peternak), upload foto verifikasi ke Storage |
| Core Marketplace | Hari 4–5 | Listing, smart routing (Haversine + total cost), halaman detail peternak, slot waktu |
| Order Lifecycle | Hari 6 | Order create → waiting → accept/reject → 5 menit expiry (cron job) |
| Integrasi Eksternal | Hari 7 | Fonnte WhatsApp (notifikasi order + webhook balasan), Midtrans payment |
| Polish & Bukti Kirim | Hari 8 | Kamera in-app, delivery proof, rating, scoring recalculation, push notification |
| QA & Deploy | Hari 9 | Testing end-to-end, seed data dummy, deploy production Vercel, siapkan demo |

---

## 6. Rekomendasi Tambahan (Di Luar yang Dibahas Tim)

1. **Jangan bangun fitur AI web-scraping berita harga nasional di 9 hari ini.** Tim sendiri sudah sempat ragu ("kalau enggak sanggup, dipangkas") — ini benar. Fitur ini butuh scheduled scraping + NLP filtering yang effort-nya tidak sepadan dengan dampaknya ke demo. Cukup sebutkan sebagai roadmap Phase 2 di pitch, jangan coba diimplementasi.
2. **Chat asisten operasional (Claude API) bisa jadi "quick win" di hari-hari terakhir** jika waktu tersisa — cukup wrapper sederhana: kirim pertanyaan peternak (via WA text) ke Claude API dengan system prompt context seputar peternakan ayam petelur, balas jawabannya. Effort rendah, tapi impact besar untuk cerita "AI Agent" di depan juri.
3. **Gunakan Vercel Cron Jobs** (built-in di `vercel.json`) untuk job pengecekan expiry order & recalculation score — tidak perlu setup infra cron terpisah (mis. tidak perlu server tambahan atau `pg_cron` jika ingin lebih simpel, walau `pg_cron` di Supabase juga valid opsi).
4. **Siapkan environment `.env.example`** sejak Hari 1 dan commit ke repo (tanpa isi rahasia) — supaya 3 anggota tim tidak saling menunggu share API key secara manual berulang kali.
5. **Testing Midtrans & Fonnte sedini mungkin** (idealnya Hari 2, bukan Hari 7) — cukup buat 1 percobaan kirim pesan WA dummy dan 1 percobaan transaksi sandbox di awal, supaya kalau ada kendala approval/setup akun, ada waktu buffer untuk cari solusi sebelum fitur intinya digarap.
6. **Deploy ke Vercel sejak Hari 1** (walau kosong) — jangan tunggu sampai Hari 9 untuk pertama kali deploy. Continuous deployment dari awal mencegah "big bang" masalah konfigurasi di hari terakhir.

---

**Dokumen terkait:** `prd.md`, `schema_database.md`, `design_system.md`, `task_division.md`
