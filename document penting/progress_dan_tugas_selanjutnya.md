# Progress dan Tugas Selanjutnya (Project Handoff)

Dokumen ini disusun untuk merekam jejak (track record) pengembangan proyek **Adatelur.com** dan mendefinisikan langkah-langkah selanjutnya. Dokumen ini sangat penting dibaca oleh *AI Agent* selanjutnya agar dapat memahami _state_ proyek saat ini dan dapat mengeksekusi sisa tugas dengan tepat tanpa mengulangi pekerjaan yang sudah selesai.

---

## 1. Progress Proyek (Yang Sudah Diselesaikan)

Berikut adalah ringkasan fitur, integrasi, dan perbaikan yang **SUDAH BERHASIL** diimplementasikan ke dalam *codebase* dan *database* (Supabase).

### A. Otentikasi & Database
- **Supabase Auth**: Telah terintegrasi untuk login/register menggunakan Email/Password dan OAuth (Google). Role pengguna (`consumer`, `peternak`, `admin`) disimpan di tabel `profiles`.
- **Skema Database & RLS**: Tabel-tabel krusial (`profiles`, `peternak_details`, `listings`, `orders`, `delivery_slots`, `consumer_addresses`, `ratings`, dll) sudah dibuat lengkap beserta *Row Level Security* (RLS) untuk keamanan akses.
- **View Publik**: Penggunaan SQL VIEW `public_listings` untuk menyembunyikan sisa stok telur asli dari API publik demi privasi peternak.
- **Storage Buckets**: Setup bucket Supabase Storage untuk `verification-photos`, `delivery-proofs`, dan `avatars`.

### B. Alur Peternak (Seller)
- **Registrasi & Verifikasi**: Peternak bisa mendaftar, memasukkan lokasi peternakan (latitude/longitude), dan mengunggah foto verifikasi.
- **Sistem Slot Waktu**: Peternak mengatur jam operasional pengiriman menggunakan sistem **Sesi 3-Jam** (misal: 00:00-03:00, 06:00-09:00). Status sesi bisa di-toggle (aktif/nonaktif) secara permanen.
- **Proof of Delivery (Bukti Pengiriman)**: Fitur bagi peternak untuk mengambil foto serah-terima pesanan secara langsung via kamera Web-API (Native Browser) ketika menekan "Pesanan Diterima".
- **Manajemen Pesanan**: Pemisahan jelas antara pesanan yang sedang aktif ("Diproses & Diantar") dengan "Riwayat Pesanan".
- **Skor & Reputasi**: Implementasi SQL/RPC untuk menghitung ulang skor peternak secara real-time berdasarkan keberhasilan transaksi dan rating.

### C. Alur Konsumen (Buyer)
- **Smart Routing & Jarak**: API Rekomendasi peternak terbaik telah mendeteksi lokasi pengguna dan menghitung jarak (`distance_km`) ke lokasi peternak secara *real-time* (baik untuk *Pickup* maupun *Delivery*).
- **Checkout & Real-time Tracking**: 
  - Delay animasi 3 detik setelah pembayaran Midtrans berhasil.
  - Lacak pesanan secara langsung (Real-time Timeline) melalui *Supabase Channels* (status: Diproses -> Diantar -> Selesai).
- **Sistem Rating**: Konsumen dapat memberikan rating (1-5 Bintang) via Modal khusus setelah pesanan *Completed*. Rata-rata rating akan tampil pada kartu (Card) rekomendasi peternak.
- **Halaman Profil Konsumen**: Desain antarmuka *Profile* dirombak menggunakan layout *Sidebar & Tabs* (Informasi Pribadi, Lokasi, Reset Password, Logout) yang responsif untuk Mobile dan Desktop. Di sini, pengguna juga bisa **Upload Foto Profil**.
- **Fitur Navigasi Tambahan**:
  - Tombol **Hubungi WA** muncul pada pesanan aktif agar pembeli/penjual bisa saling berkomunikasi.
  - Tombol **Lihat Lokasi** (di sisi peternak) langsung mengarah ke Google Maps.

### D. Integrasi Pihak Ketiga
- **Midtrans Webhook**: Status pembayaran terhubung langsung (Paid, Unpaid, Expired).

---

## 2. Tugas Selanjutnya (Yang Belum Diselesaikan)

Berikut adalah daftar pekerjaan (Backlog) utama yang **BELUM** diselesaikan dan wajib menjadi prioritas eksekusi oleh AI Agent selanjutnya:

### 1. Fitur AI Asisten Peternak
- **Deskripsi**: Membuat asisten virtual berbasis kecerdasan buatan (GenAI) di dalam dashboard peternak.
- **Kebutuhan**: AI ini harus bisa memberikan rekomendasi operasional, menjawab pertanyaan peternak seputar harga pasar, kondisi ayam, serta operasional harian berdasarkan *knowledge base* Adatelur.

### 2. Integrasi WA Peternak
- **Deskripsi**: Menghubungkan notifikasi WhatsApp (otomatisasi) untuk alur peternak.
- **Kebutuhan**: Menggunakan *WhatsApp API/Gateway* pihak ketiga untuk mengirimkan konfirmasi stok otomatis, OTP (jika ada), peringatan pesanan baru, atau _price alerts_. Harus disinkronisasikan dengan tabel `notifications_log`.

### 3. Dashboard Analitik Peternak
- **Deskripsi**: Membuat halaman statistik / laporan (Charts & Graphs) untuk peternak.
- **Kebutuhan**: Menampilkan kurva/grafik pendapatan mingguan/bulanan, total penjualan telur, rating rata-rata dari waktu ke waktu, dan persentase keberhasilan pengiriman. Tampilan harus profesional (disarankan memakai library seperti `recharts` atau `chart.js`).

### 4. Periksa Kembali Sistem Push Notifications
- **Deskripsi**: Melakukan _testing_ dan _debugging_ fungsionalitas notifikasi (Push Notification / PWA / Web Push).
- **Kebutuhan**: Saat ini logika pengiriman notif (misal: "Pesanan 3 menit tak direspon") sudah dirancang secara teori. AI Agent harus memeriksa implementasi riil (misal menggunakan Firebase Cloud Messaging / OneSignal / Vapid keys) dan memastikan pop-up notifikasi benar-benar muncul di gawai pengguna.

### 5. Sistem Saldo Peternak (Withdrawal/Pencairan)
- **Deskripsi**: Membangun modul _Wallet_ / Saldo.
- **Kebutuhan**: 
  - Saat transaksi selesai (Completed), uang tidak langsung masuk ke rekening pribadi, melainkan mengendap di Saldo Peternak.
  - Total transaksi harus **dipotong Biaya Admin platform (3.5%)** sebelum dimasukkan ke saldo.
  - Fitur "Cairkan Saldo" (Withdraw) yang memungkinkan peternak menarik uang dari saldo ke rekening bank mereka.
  - Perlu skema database tambahan (misal: tabel `wallets` dan `withdrawals`).

### 6. Perbaikan Layout Keseluruhan (Polishing)
- **Deskripsi**: Merapikan seluruh antarmuka (UI/UX) peternak dan konsumen.
- **Kebutuhan**: Memastikan desain _clean, modern, tidak terlihat seperti template standar AI_, dan **sangat profesional**. Perhatikan konsistensi _padding, margin, typography, warna brand_, hover effects, spacing pada Card, serta kemudahan navigasi di Mobile View.

---

> **Pesan untuk AI Agent Selanjutnya:**
> Harap selalu merujuk pada direktori `@/document penting/` (`prd.md`, `schema_database.md`, `design_system.md`, dan `Aturan_penulisan_code.md`) sebelum menulis kode baru. Jangan lupa untuk menjaga komponen-komponen React agar tetap _Client/Server Component_ sesuai tempatnya (Next.js App Router).
