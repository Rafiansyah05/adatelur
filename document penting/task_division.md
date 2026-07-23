# Task Division & Sprint Plan — adatelur.com (SISA 4 SPRINT)

Tim: **Rafi**, **Rian**, **Alvin**
Durasi Tersisa: **4 Sprint** (Mulai dari Sprint 3 sampai 6)
Fokus: Skalabilitas Fitur Mandiri (Frontend + Backend), Desain Premium ala Gojek/Tokopedia, dan WhatsApp-First.

## 🔴 Pembagian Sprint (Satu Sprint = Fitur Lengkap Full-Stack)

| Sprint | Anggota (PIC) | Fokus Fitur (Full-Stack Frontend + Backend) |
|---|---|---|
| **Sprint 3** | Rafi | Rombak Ulang UI/UX Auth (Login/Registrasi), Struktur Layout Dasar App (Mobile Bottom Nav, Desktop Sidebar). |
| **Sprint 4** | Rafi | Core Marketplace (Smart Routing Algoritma, Home Konsumen, Manajemen Listing Peternak). |
| **Sprint 5** | Rian | Integrasi WhatsApp (Fonnte), Webhook, dan Lifecycle Order (Countdown 5 menit, Accept/Reject). |
| **Sprint 6** | Alvin | Payment (Midtrans), Kamera Delivery Proof, dan Finalisasi Scoring Peternak. |

---

## SPRINT 3: Rombak UI/UX, Auth & Core Layout
**PIC: Rafi**

Sprint ini merombak besar-besaran tampilan aplikasi yang sebelumnya kaku menjadi super premium dan elegan (soft shadow, input chunky, rounded corners) layaknya aplikasi Gojek/Tokopedia. 

**Prompt untuk AI Agent (Copy-Paste Utuh):**
```text
Saya ingin merombak besar-besaran UI dan logika Auth di proyek adatelur.com agar tampilannya sangat premium, profesional, dan elegan seperti aplikasi Gojek atau Tokopedia.

Konteks Sebelumnya: Kita sudah memiliki skema Supabase dan layout monorepo dasar dengan route groups (consumer) dan (peternak), namun desainnya masih terlalu kaku dan "terlihat seperti buatan AI".

Tugas Anda dalam Sprint 3 (Kerjakan Frontend + Backend sekaligus):
1. BACA TERLEBIH DAHULU: @[document penting/design_system.md] untuk aturan estetika terbaru (wajib pakai soft shadows, rounded corners, input chunky, dan warna soft kuning/hijau) serta @[document penting/Aturan_Struktur_Folder.md] untuk peletakan file.
2. FRONTEND (Auth): Rombak total halaman `/login` dan form registrasi di `app/(peternak)/register/page.tsx` & `app/(consumer)/register-consumer/page.tsx`. Buat formnya berukuran proporsional (min-height 48px), tombol melengkung elegan, dan letakkan form di dalam Card putih bershadow lembut (shadow-md) di atas background abu-abu muda (--color-background). Pastikan layout mobile memenuhi layar, sementara desktop berada di tengah (centered max-width container).
3. FRONTEND (Layout): Rombak `DesktopSidebar` dan `MobileBottomNav`. Buat bottom nav persis seperti aplikasi native (tinggi 64px, icon solid/outline jelas, font weight tebal saat aktif).
4. BACKEND (Auth Logic): Pastikan proses registrasi konsumen dan peternak berjalan sempurna menggunakan Supabase Auth (Client-side OTP verification). Setelah OTP sukses diverifikasi, insert data ke tabel `profiles` dan redirect ke `/dashboard` (untuk peternak) atau `/` (untuk konsumen).
5. Terapkan logout function di Sidebar/Bottom Nav.

Kerjakan sampai selesai, pastikan responsif dan tampil menakjubkan. JANGAN buat UI yang kotak kaku dan membosankan.
```

---

## SPRINT 4: Core Marketplace & Smart Routing
**PIC: Rafi**

Sprint ini berfokus pada logika krusial pencarian peternak terdekat (Haversine) dan fungsionalitas manajemen stok/harga harian oleh peternak.

**Prompt untuk AI Agent (Copy-Paste Utuh):**
```text
Proyek adatelur.com sudah memiliki layout premium dan sistem Auth yang kokoh dari Sprint sebelumnya. Sekarang kita masuk ke Core Marketplace. 

Konteks Sebelumnya: Tabel `listings`, `orders`, dan `peternak_details` sudah ada di database. 

Tugas Anda dalam Sprint 4 (Kerjakan Frontend + Backend sekaligus):
1. BACA: @[document penting/prd.md] bagian 5.3 (Smart Routing) dan 6.6 (Manajemen Listing).
2. BACKEND (Smart Routing): Buat API endpoint `POST /api/orders/recommend`. Endpoint ini menerima parameter lokasi konsumen (lat, lng), jumlah rak, dan metode (pickup/delivery). Hitung jarak menggunakan formula Haversine. Hitung Ongkir. Kembalikan array peternak terdekat yang diurutkan berdasarkan `total harga + ongkir`. JANGAN EXPOSE `stock_rak` ke JSON response ini.
3. FRONTEND (Konsumen): Buat halaman beranda (Home) `/` yang super elegan. Di paling atas, taruh form raksasa melengkung untuk menginput "Berapa rak?" dan "Metode: Delivery/Pickup". Saat form disubmit, render hasil dari endpoint rekomendasi dalam bentuk deretan `Score Card Peternak` yang mewah (ada avatar, jarak dalam KM, rating, dan tombol CTA "Pesan").
4. FRONTEND & BACKEND (Peternak): Buat halaman `/dashboard` untuk peternak. Sediakan form elegan untuk mengupdate "Harga Jual Hari Ini" dan "Stok Rak". Stok ini langsung update/insert ke tabel `listings`. Tampilkan status Toggle "Buka/Tutup Toko Hari Ini".

Semua antarmuka harus mempertahankan estetika modern, soft shadow, dan warna soft dari Sprint 3. Pastikan tidak ada bug dari sisi backend.
```

---

## SPRINT 5: WhatsApp Integration & Order Lifecycle
**PIC: Rian**

Fokus pada pengiriman notifikasi instan ke WhatsApp dan siklus hidup pesanan (5 menit kadaluarsa). Ini meminimalkan friction bagi peternak yang gaptek.

**Prompt untuk AI Agent (Copy-Paste Utuh):**
```text
Proyek adatelur.com sekarang sudah punya UI premium dan Smart Routing. Di Sprint 5 ini, kita fokus pada Notifikasi WhatsApp dan Lifecycle Pesanan.

Konteks Sebelumnya: Peternak lebih sering membuka WhatsApp daripada dashboard web. Kita menggunakan Fonnte untuk API WhatsApp.

Tugas Anda dalam Sprint 5 (Kerjakan Frontend + Backend sekaligus):
1. BACA: @[document penting/prd.md] bagian 5.6 (Proses Order 5 Menit).
2. BACKEND (WhatsApp Fonnte): Buat file utilitas `lib/fonnte.ts` untuk mengirim pesan WA. Buat webhook `POST /api/whatsapp/webhook` untuk menerima balasan teks "Terima" atau "Tolak" dari peternak.
3. BACKEND (Order Lifecycle): Buat endpoint `POST /api/orders/checkout`. Saat konsumen menekan tombol beli, simpan row ke tabel `orders` dengan status `waiting`. Endpoint ini harus langsung men-trigger pesan WhatsApp via Fonnte ke nomor HP peternak.
4. BACKEND (Cron): Implementasikan Cron Job ringan (Route Handler `/api/cron/check-expired`) yang mencari semua order `waiting` berumur > 5 menit, lalu update jadi `expired`.
5. FRONTEND (Order Tracking): Di sisi konsumen, setelah checkout, arahkan ke `/orders/[id]`. Buat UI tracking order yang interaktif (Stepper UI: Menunggu -> Diproses -> Selesai) yang auto-refresh (Supabase Realtime) ketika status order berubah (karena peternak menekan "Terima" di WA). Jika order expired, munculkan tombol besar "Cari Peternak Lain".

Pastikan pesan WhatsApp terkirim dengan format yang ramah. UI order tracking harus memanjakan mata dan mirip aplikasi ojek online (bersih, font besar, margin lapang).
```

---

## SPRINT 6: Payment, Delivery Proof, & Scoring
**PIC: Alvin (Minimised) / Rafi**

Tahap pamungkas. Sistem pembayaran digital (sandbox), kamera in-app untuk kurir peternak, dan kalkulasi ulang sistem skor.

**Prompt untuk AI Agent (Copy-Paste Utuh):**
```text
Ini adalah Sprint Terakhir (Sprint 6) untuk proyek adatelur.com. Kita sudah memiliki order lifecycle yang terhubung ke WhatsApp. Sekarang saatnya penutupan transaksi.

Tugas Anda dalam Sprint 6 (Kerjakan Frontend + Backend sekaligus):
1. BACA: @[document penting/prd.md] bagian 5.7 (Bukti Pengiriman) dan 7 (Sistem Scoring).
2. BACKEND (Payment): Integrasikan Midtrans Snap. Buat endpoint `POST /api/payment/create` saat status pesanan menjadi `accepted`. Buat juga `POST /api/payment/webhook` untuk mengupdate status pesanan jadi `paid`.
3. FRONTEND (Payment UI): Di halaman tracking konsumen, jika order `accepted` oleh peternak, munculkan tombol hijau besar "Bayar Sekarang" yang men-trigger popup Midtrans Snap.
4. FRONTEND & BACKEND (Kamera & Bukti): Di web fallback peternak `/dashboard/orders`, buat tombol "Selesaikan Pesanan & Foto Bukti". Buka kamera native browser (react-webcam atau input capture). Upload ke Supabase Storage, insert ke tabel `delivery_proof`, lalu ubah order jadi `completed`.
5. BACKEND (Scoring): Begitu order selesai (`completed`), jalankan fungsi penghitung skor `lib/scoring.ts` yang mengkalkulasi ulang rating, total omzet, dan kecepatan konfirmasi peternak, lalu update di tabel `peternak_scores`.

Desain kamera dan UI pembayaran harus semulus dan senatural mungkin di mobile device. Buat elemen UI yang besar agar tidak salah pencet. Selesaikan seluruh flow sehingga platform ini 100% siap dipresentasikan.
```

---

*Setiap prompt di atas harus dijalankan secara berurutan per sprint di jendela chat AI. AI agent akan menganalisa file dan langsung menuliskan kodenya.*
