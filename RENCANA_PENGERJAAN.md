# Rencana Pengerjaan — Backlog adatelur.com

Dokumen ini adalah peta kerja step-by-step untuk menyelesaikan seluruh backlog di `document penting/progress_dan_tugas_selanjutnya.md`, lengkap dengan tahap-tahap di dalam tiap fitur dan nama branch-nya.

Konvensi branch mengikuti branch yang sedang berjalan: `Feat/NamaFitur`.

Status dipakai: `Belum` / `Proses` / `Selesai`.

## Ringkasan Urutan

| No | Fitur | Branch | Status |
|---|---|---|---|
| 1 | AI Asisten Peternak (chatbot + grounding data) | `Feat/PeternakAssistant` | Selesai |
| 2 | Dashboard Analitik Peternak (+ restrukturisasi dashboard) | `Feat/PeternakAnalytics` | Proses |
| 3 | Sistem Saldo Peternak (Withdrawal) | `Feat/PeternakWallet` | Belum |
| 4 | Verifikasi Push Notification | `Feat/PushNotification` | Belum |
| 5 | Integrasi WhatsApp Peternak | `Feat/WhatsappPeternak` | Belum |
| 6 | Polishing Layout Keseluruhan | `Feat/UiPolishing` | Belum |

Alasan urutan: AI Asisten dulu (isolated, sudah selesai). Analitik menyusul karena ringan dan tidak menyentuh logika transaksi. Saldo setelahnya karena butuh skema database baru. Verifikasi Push Notification dan Integrasi WhatsApp ditaruh berdekatan di belakang karena sama-sama jalur notifikasi, dan WhatsApp sengaja paling akhir karena paling berat (butuh gateway pihak ketiga). Polishing jadi sapuan finishing menyeluruh setelah semua fitur ada.

---

## 1. AI Asisten Peternak

Branch: `Feat/PeternakAssistant` — Status: Selesai

Asisten chat berbasis Gemini API (Google) di dalam dashboard peternak, dipanggil lewat raw fetch tanpa dependency SDK tambahan. Chatbot dengan system instruction konteks operasional ternak, plus grounding ke data peternak yang sedang login.

Model dan endpoint terverifikasi (Juli 2026):
- Model: `gemini-3.6-flash`
- Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- API key dikirim lewat header `x-goog-api-key`
- Teks balasan ada di `candidates[0].content.parts[0].text`

### Tahap 1.1 — Persiapan (selesai)
- `GEMINI_API_KEY` ditambahkan ke `.env.example`.

### Tahap 1.2 — API Route (selesai)
- `app/api/assistant/chat/route.ts`: gate role peternak `approved`, kirim riwayat pesan ke Gemini, kembalikan jawaban.
- Grounding: menyuntikkan data peternak (nama, alamat, jumlah ayam, produksi, pakan, listing, skor) ke system instruction.

### Tahap 1.3 — Halaman Chat (selesai)
- Halaman `app/(peternak)/dashboard/assistant/page.tsx` + komponen `components/peternak/AssistantChat.tsx`.
- Entry point berupa kartu "Asisten AI" di dashboard.
- Render `**tebal**` markdown dirapikan di bubble balasan.

---

## 2. Dashboard Analitik Peternak (+ restrukturisasi dashboard)

Branch: `Feat/PeternakAnalytics`

Dashboard peternak diubah menjadi halaman ringkasan dan analitik. Manajemen listing (harga/stok) dan sesi ketersediaan (slot) dipindahkan keluar dari dashboard ke halaman baru "Atur Ketersediaan" yang diakses lewat menu top navbar.

Struktur menu setelah perubahan:

| Menu | Isi |
|---|---|
| Dashboard | Kartu ringkasan + kartu Asisten AI + grafik analitik |
| Atur Ketersediaan (baru) | Listing Hari Ini (harga/stok) + Sesi Ketersediaan (slot), pindahan dari dashboard |
| Pesanan Masuk | Tetap |
| Akun | Tetap |

### Tahap 2.1 — Pindahkan Listing & Slot ke Halaman "Atur Ketersediaan"
- Bedah komponen yang sudah ada: `components/dashboard/ListingManager.tsx`, `components/dashboard/DeliverySlotsManager.tsx`, dan bagian listing/slot di `components/peternak/PeternakDashboard.tsx`.
- Buat halaman baru `app/(peternak)/dashboard/availability/page.tsx` (URL `/dashboard/availability`) berisi manajemen listing dan sesi ketersediaan.
- Pastikan logika simpan harga/stok/slot tetap berfungsi. API yang dipakai (`/api/listings`, `/api/delivery-slots/sync`) tidak diubah.

### Tahap 2.2 — Tambah Menu "Atur Ketersediaan" di Navbar
- Tambahkan nav item baru di `app/(peternak)/layout.tsx` (otomatis muncul di top navbar desktop dan bottom nav mobile).
- Pilih ikon lucide yang sesuai, pastikan tetap nyaman di mobile meski jadi 4 item.

### Tahap 2.3 — API Data Agregat
- Buat endpoint agregasi (mis. `app/api/peternak/analytics/route.ts`) dengan gate role peternak.
- Hitung pendapatan per periode, total rak terjual, tren rating, dan persentase keberhasilan pengiriman dari `orders`, `ratings`, `peternak_scores`.

### Tahap 2.4 — Grafik Analitik di Dashboard
- Tampilkan grafik di halaman dashboard (di bawah kartu ringkasan): kurva pendapatan, penjualan per periode, tren rating dan keberhasilan pengiriman.
- Pasang library chart (recharts). Ikuti design token (warna brand, tanpa warna mencolok, tanpa gradient).

### Tahap 2.5 — Testing
- Uji listing/slot masih tersimpan benar dari halaman baru, dashboard menampilkan grafik dengan data ramai dan kosong (empty state), serta navigasi 4 menu tetap enak di mobile dan desktop.

---

## 3. Sistem Saldo Peternak (Withdrawal)

Branch: `Feat/PeternakWallet`

Modul wallet: uang transaksi selesai mengendap di saldo peternak (dipotong biaya admin 3.5%), lalu bisa ditarik ke rekening bank.

### Tahap 3.1 — Skema Database
- Tambah migration untuk tabel `wallets` dan `withdrawals`.
- Definisikan kolom saldo, mutasi, dan status penarikan.

### Tahap 3.2 — Logika Saldo Masuk
- Saat order `completed`, tambahkan `total_amount` dikurangi biaya admin 3.5% ke saldo peternak.
- Catat mutasi sebagai riwayat.

### Tahap 3.3 — API Withdrawal
- Buat endpoint pengajuan penarikan: validasi saldo cukup, buat record `withdrawals` berstatus pending.

### Tahap 3.4 — Halaman Saldo & Penarikan
- Buat halaman saldo peternak: tampilan saldo, riwayat mutasi, form cairkan saldo (input rekening bank).
- Ikuti design system.

### Tahap 3.5 — Testing
- Uji perhitungan potongan admin, saldo tidak minus, dan alur pengajuan penarikan.

---

## 4. Verifikasi Push Notification

Branch: `Feat/PushNotification`

Kondisi saat ini: implementasi kirim push (`app/api/push/notify/route.ts`) dan subscribe sudah ada. Fokus tugas ini adalah pengujian dan pemastian notifikasi benar-benar muncul di gawai.

### Tahap 4.1 — Verifikasi VAPID & Subscription
- Pastikan VAPID key terpasang di environment.
- Uji alur subscribe menyimpan endpoint dengan benar ke tabel `push_subscriptions`.

### Tahap 4.2 — Uji Trigger 3 Menit
- Pastikan job pengecekan order (`app/api/cron/`) memicu push saat order 3 menit tak direspons, dengan bunyi dan repeat.
- Cek `push_notif_sent_at` terisi agar tidak terkirim ganda.

### Tahap 4.3 — Uji Lintas Device
- Uji di Android (Chrome) dan iOS Safari. Catat keterbatasan iOS.
- Pastikan fallback WhatsApp tetap jadi kanal utama jika push gagal.

### Tahap 4.4 — Cleanup
- Pastikan subscription mati (404/410) terhapus otomatis.

---

## 5. Integrasi WhatsApp Peternak

Branch: `Feat/WhatsappPeternak`

Menyambungkan notifikasi WhatsApp dua arah untuk alur peternak via gateway pihak ketiga (Fonnte). Kondisi saat ini: webhook inbound sudah ada tapi masih stub, outbound belum ada. Fitur paling berat, sengaja dikerjakan paling akhir sebelum polishing.

### Tahap 5.1 — Persiapan Gateway
- Siapkan akun dan device Fonnte, simpan token di environment variable dan `.env.example`.
- Lengkapi helper pengirim pesan (`lib/fonnte.ts` sudah ada, cek kelengkapannya).

### Tahap 5.2 — Outbound Notifikasi Order
- Saat order masuk (status `waiting`), kirim notifikasi ke WhatsApp peternak: nama pemesan, jumlah rak, lokasi, metode, slot waktu.
- Catat setiap pengiriman ke tabel `notifications_log`.

### Tahap 5.3 — Perbaikan Webhook Inbound
- Perbaiki `app/api/whatsapp/webhook/route.ts`: cocokkan nomor pengirim dengan `peternak_details` sebelum mengizinkan accept/reject (tutup lubang keamanan saat ini).
- Pastikan hanya peternak pemilik order yang bisa merespons.

### Tahap 5.4 — Re-routing Otomatis
- Saat order ditolak atau hangus (`expired`), arahkan otomatis ke peternak rekomendasi berikutnya tanpa konsumen input ulang (PRD 5.6).

### Tahap 5.5 — Sinkronisasi Kanal
- Pastikan status yang berubah via WA tercermin real-time di halaman order konsumen dan sebaliknya.

### Tahap 5.6 — Testing
- Uji kirim notifikasi dummy, balasan terima/tolak, pencocokan nomor, dan re-routing.

---

## 6. Polishing Layout Keseluruhan

Branch: `Feat/UiPolishing`

Sapuan finishing UI/UX seluruh halaman konsumen dan peternak agar clean, modern, profesional, dan konsisten dengan design system. Dikerjakan paling akhir setelah semua fitur ada.

### Tahap 6.1 — Audit Konsistensi
- Telusuri seluruh halaman, catat ketidakkonsistenan padding, margin, typography, warna, dan spacing card terhadap design token.

### Tahap 6.2 — Perbaikan Per Halaman
- Rapikan halaman satu per satu sesuai `design_system.md`.
- Ganti nilai hardcode dengan design token.

### Tahap 6.3 — Responsif & Mobile-first
- Uji breakpoint mobile, tablet, desktop. Pastikan bottom nav (mobile) dan navbar (desktop) konsisten.

### Tahap 6.4 — QA Akhir
- Cek touch target minimal 44x44px, kontras teks, tidak ada warna ungu, tidak ada gradient background.
- Pastikan tidak ada perubahan di luar scope tampilan.

---

## Catatan

- Setiap fitur dikerjakan di branch masing-masing sesuai tabel di atas.
- Urusan git (buat branch, commit, push, merge) sepenuhnya dilakukan secara manual, bukan otomatis.
- Selalu rujuk `document penting/` (`prd.md`, `schema_database.md`, `design_system.md`, `Aturan_penulisan_code.md`) sebelum menulis kode baru.
- Perbarui kolom Status di tabel Ringkasan Urutan setiap ada progress.
