# Task Division & Sprint Plan — adatelur.com

Tim: **Rafi**, **Rian**, **Alvin**
Durasi: **9 hari** (21 Juli – 29 Juli 2026)
Dokumen rujukan: `prd.md`, `schema_database.md`, `tech_stack.md`, `design_system.md`

---

## Pembagian Peran Utama

| Anggota | Fokus Utama |
|---|---|
| **Rafi** | Backend, database, business logic (smart routing, scoring, order lifecycle, cron jobs, webhook handler), infra/deployment |
| **Rian** | Frontend sisi **Konsumen** (PWA, design system base component, order flow, payment, tracking) |
| **Alvin** | Frontend sisi **Peternak** (registrasi 3-tahap, dashboard, integrasi WhatsApp/Fonnte, kamera in-app) |

---

## 🔴 Instruksi Urutan Pengerjaan (WAJIB DIBACA SEBELUM MULAI)

Ini adalah dependency chain keseluruhan project — ikuti urutan ini supaya tidak ada yang saling menunggu tanpa arah:

1. **Hari 1 pagi — Rafi mengerjakan sendirian dulu (± 2–3 jam): Setup repo & Supabase project.** Ini **blocking** untuk semua orang — Rian & Alvin tidak bisa mulai coding sungguhan sebelum ini selesai (butuh akses repo + env variable Supabase).
2. **Begitu repo & Supabase project siap** (Rafi share `.env` & akses GitHub), **Rian dan Alvin mulai bekerja paralel** — keduanya tidak saling bergantung di hari-hari awal karena mengerjakan role berbeda (konsumen vs peternak).
3. **Rafi lanjut sendirian mengerjakan DB schema & migration** (Hari 1 sore–Hari 2) — ini juga **blocking** sebagian pekerjaan Rian/Alvin yang butuh query data asli (tapi mereka bisa duluan membangun UI dengan **dummy/mock data** sambil menunggu, supaya tidak idle).
4. **Smart routing & scoring algorithm (Rafi, Hari 4–5)** adalah **blocking untuk Rian** — halaman rekomendasi peternak di sisi konsumen tidak bisa final tanpa endpoint ini. Rian bisa membangun UI-nya duluan dengan mock response, lalu sambungkan ke API asli begitu Rafi selesai.
5. **Integrasi Fonnte WhatsApp (Alvin, Hari 7)** membutuhkan **endpoint order dari Rafi sudah jadi** (order create, accept/reject) — jangan mulai integrasi WA sebelum backend order lifecycle (Hari 6, Rafi) selesai.
6. **Payment Midtrans (Rian, Hari 8)** membutuhkan **tabel & endpoint `orders` dari Rafi** sudah ada (Hari 6) — bisa disiapkan UI-nya lebih awal, tapi baru bisa full-test setelah backend order siap.
7. **Hari 9 = QA bersama, seluruh tim.** Tidak ada pembagian kerja terpisah — testing end-to-end, seed data, deploy final, siapkan demo.

**Ringkasan siapa menunggu siapa:**
- Rian & Alvin **menunggu Rafi** di Hari 1 (setup) — sekali saja, di awal.
- Rian **menunggu Rafi** untuk smart routing API (Hari 4–5) sebelum bisa finalisasi halaman rekomendasi.
- Alvin **menunggu Rafi** untuk order lifecycle backend (Hari 6) sebelum integrasi WA order notification.
- Selain titik-titik di atas, **Rian dan Alvin bekerja independen satu sama lain** — tidak saling bergantung karena beda role (konsumen vs peternak) yang secara UI terpisah.

---

## SPRINT HARI 1 (21 Juli) — Fondasi

### 🧩 Rafi — Setup Repo & Supabase Project *(BLOCKING, kerjakan duluan sendirian)*

**Tidak bergantung siapa pun. Wajib selesai dulu sebelum Rian/Alvin mulai.**

**AI Agent Prompt:**
```
Saya sedang membangun platform bernama adatelur.com menggunakan Next.js 14 (App Router),
TypeScript, Tailwind CSS, dan Supabase. Tolong bantu saya:

1. Inisialisasi project Next.js 14 baru dengan App Router, TypeScript, Tailwind CSS,
   dan struktur folder sesuai rekomendasi berikut (saya lampirkan tech_stack.md,
   bagian "Struktur Folder (Rekomendasi)" — ikuti struktur itu persis).
2. Setup koneksi ke Supabase (client-side dan server-side client terpisah,
   pakai @supabase/ssr untuk Next.js App Router).
3. Buat file .env.example dengan seluruh environment variable yang akan dibutuhkan
   project ini ke depannya (Supabase URL/key, Fonnte token, Midtrans server/client key,
   VAPID keys untuk push notification) — walau belum diisi value asli, siapkan strukturnya.
4. Setup ESLint + Prettier dengan konfigurasi standar Next.js + TypeScript strict mode.
5. Buat README.md singkat berisi cara clone, install, dan run project ini untuk 2 anggota
   tim saya yang lain.

[TAG FILE: tech_stack.md]

Tolong jelaskan juga command Supabase CLI apa yang perlu saya jalankan untuk
menghubungkan project lokal saya ke Supabase project yang sudah saya buat di dashboard.
```

**Deliverable:** Repo GitHub aktif, project Next.js jalan lokal, Supabase project terhubung, `.env.example` siap, README untuk onboarding tim.

---

### 🧩 Rafi (lanjutan, Hari 1 sore) — Jalankan Seluruh Migration Database

**Bergantung pada task sebelumnya (setup Supabase) selesai. Bisa dikerjakan sendiri, tidak menunggu Rian/Alvin.**

**AI Agent Prompt:**
```
Saya sudah punya Supabase project yang terhubung ke Next.js project saya.
Saya lampirkan schema_database.md yang berisi seluruh definisi tabel yang saya butuhkan
untuk platform adatelur.com.

Tolong bantu saya:
1. Konversi seluruh definisi SQL di schema_database.md menjadi file-file migration
   Supabase yang terstruktur rapi (satu file migration per kelompok tabel terkait,
   urutkan berdasarkan dependency foreign key supaya tidak error saat dijalankan).
2. Sertakan seluruh RLS policy yang disebutkan di bagian "Row Level Security (RLS)"
   pada dokumen tersebut.
3. Buat VIEW public_listings persis seperti didefinisikan di dokumen (bagian §19) —
   ini krusial, jangan sampai terlewat, karena ini yang menjamin data stok peternak
   tidak bocor ke API publik.
4. Setelah migration jadi, buatkan juga 1 file seed.sql berisi data dummy:
   3 profiles konsumen, 5 profiles peternak (dengan peternak_details lengkap dan sudah
   berstatus verification_status='approved'), 5 listings dengan harga dan lokasi
   (lat/long) yang tersebar di area Bandung, Sumedang, dan Cimahi (Jawa Barat) supaya
   nanti smart routing bisa didemokan dengan hasil yang masuk akal secara jarak.

[TAG FILE: schema_database.md]
```

**Deliverable:** Seluruh tabel & VIEW berhasil dibuat di Supabase, RLS aktif, seed data dummy siap dipakai.

---

### 🧩 Rian — Setup Design System Base & Scaffold Konsumen

**Bergantung: menunggu Rafi menyelesaikan setup repo (poin 1 di atas). Setelah repo tersedia, Rian bisa langsung mulai — tidak perlu menunggu migration DB selesai (bisa pakai mock data dulu).**

**AI Agent Prompt:**
```
Saya sedang membangun frontend platform adatelur.com dengan Next.js 14 App Router
dan Tailwind CSS. Saya lampirkan design_system.md yang berisi seluruh spesifikasi
warna, tipografi, spacing, dan komponen yang WAJIB diikuti — termasuk larangan keras:
TIDAK ADA box-shadow di komponen apa pun, TIDAK ADA gradient warna, dan TIDAK ADA
warna ungu dalam bentuk apa pun.

Tolong bantu saya:
1. Setup Tailwind config sesuai bagian "Contoh Implementasi Tailwind Config" di
   design_system.md — termasuk seluruh color token, font family Plus Jakarta Sans
   (via next/font/google), dan border-radius scale.
2. Buat base UI components di folder components/ui/ berikut, sesuai spesifikasi
   di design_system.md bagian "Komponen Inti":
   - Button.tsx (variant: primary, secondary/outline, success)
   - Card.tsx
   - Badge.tsx (untuk status: Tersedia, Menunggu, Diterima, Ditolak, Selesai)
   - Input.tsx
   - ScoreCard.tsx (komponen khusus untuk menampilkan card peternak dengan score,
     sesuai contoh ASCII layout di bagian §4.5 design_system.md)
3. Pastikan tidak ada satupun class shadow-* Tailwind default yang terpakai di
   komponen-komponen ini, dan tidak ada bg-gradient-*.
4. Buat 1 halaman /dev/style-guide yang menampilkan seluruh komponen ini dalam
   satu tempat untuk keperluan QA visual nanti.

[TAG FILE: design_system.md]
```

**Deliverable:** Base component library siap dipakai, halaman style guide internal untuk QA visual.

**Catatan:** Task ini **tidak bergantung pada Alvin**, keduanya bisa jalan bersamaan.

---

### 🧩 Alvin — Setup PWA Config & Skeleton Auth

**Bergantung: sama seperti Rian, menunggu setup repo dari Rafi selesai. Setelah itu independen dari Rian.**

**AI Agent Prompt:**
```
Saya sedang membangun platform adatelur.com sebagai PWA (Progressive Web App) dengan
Next.js 14, yang harus bisa dipasang ke home screen HP baik untuk role konsumen
maupun peternak. Saya lampirkan prd.md (bagian 5.1 tentang PWA install prompt) dan
tech_stack.md (bagian 3.6 tentang PWA).

Tolong bantu saya:
1. Setup manifest.json sesuai spesifikasi di tech_stack.md — nama app "adatelur.com",
   theme_color #FFDC36, background_color #FFFFFF, display: standalone. Buatkan juga
   instruksi ukuran icon yang saya perlu siapkan (192px dan 512px).
2. Setup service worker menggunakan next-pwa (atau jelaskan alternatif manual jika
   next-pwa punya limitasi dengan App Router versi terbaru).
3. Implementasikan custom install prompt: tangkap event beforeinstallprompt, simpan
   di state, lalu tampilkan tombol custom "Pasang ke Layar Utama" (BUKAN native
   browser prompt) yang saat diklik memicu prompt() dari event yang tersimpan.
4. Buat skeleton halaman auth: /login dan /register dengan pilihan role
   (Konsumen / Peternak) — cukup UI kosong dulu (belum terhubung Supabase Auth,
   itu tugas hari berikutnya), fokus di struktur routing dan layout dasar saja.

[TAG FILE: prd.md, tech_stack.md]
```

**Deliverable:** PWA installable (bisa dites di Chrome DevTools > Application > Manifest), custom install prompt jalan, skeleton halaman auth.

**Catatan:** Task ini **tidak bergantung pada Rian**, keduanya bisa jalan bersamaan.

---

## SPRINT HARI 2–3 (22–23 Juli) — Auth & Registrasi

### 🧩 Rafi — API Routes: Auth Helper & RLS Testing

**Bergantung: migration DB dari Hari 1 sudah selesai (task sendiri). Tidak bergantung Rian/Alvin.**

**AI Agent Prompt:**
```
Lanjutan project adatelur.com. Database sudah punya seluruh tabel dari schema_database.md,
termasuk RLS policy. Sekarang saya butuh backend helper untuk auth & memastikan RLS
bekerja benar.

Tolong bantu saya:
1. Buat Supabase server client helper (lib/supabase/server.ts) dan client-side
   helper (lib/supabase/client.ts) menggunakan @supabase/ssr, lengkap dengan cookie
   handling untuk Next.js App Router.
2. Buat API route POST /api/auth/complete-profile — dipanggil setelah user berhasil
   login via Google OAuth atau signup manual, untuk membuat row baru di tabel profiles
   dengan role yang dipilih user (consumer/peternak), full_name, dan phone_number.
3. Tuliskan skrip test manual (bisa berupa curl command atau Postman collection)
   untuk memverifikasi RLS bekerja benar: pastikan user A tidak bisa membaca
   peternak_details milik user B, dan konsumen tidak bisa membaca stock_rak asli
   dari tabel listings (harus lewat VIEW public_listings).

[TAG FILE: schema_database.md]
```

**Deliverable:** Auth helper siap, endpoint complete-profile jalan, RLS terverifikasi aman.

---

### 🧩 Rian — Registrasi & Login Konsumen

**Bergantung: skeleton auth dari Alvin (Hari 1) dan auth helper dari Rafi (task di atas). Bisa mulai UI-nya duluan dengan mock, sambungkan ke Supabase begitu Rafi selesai.**

**AI Agent Prompt:**
```
Lanjutan project adatelur.com sisi konsumen. Saya lampirkan prd.md bagian 5.1
(Registrasi & Onboarding Konsumen).

Tolong bantu saya implementasikan:
1. Halaman /register untuk role konsumen dengan 2 opsi:
   - Login via Google OAuth (Supabase Auth signInWithOAuth)
   - Form manual: email, password, nama lengkap, nomor telepon
2. Setelah berhasil daftar/login pertama kali, panggil endpoint
   /api/auth/complete-profile (sudah dibuat Rafi) dengan role='consumer'.
3. Setelah profil lengkap, tampilkan halaman onboarding singkat dengan SATU tombol
   highlighted "Pasang ke Layar Utama" (pakai custom install prompt yang sudah
   dibuat Alvin di Hari 1) — pastikan jelas ini opsional, ada juga tombol "Lewati".
4. Gunakan base UI components dari components/ui/ (Button, Input, Card) yang sudah
   dibuat sebelumnya — JANGAN membuat styling baru dari nol, ikuti design_system.md.

[TAG FILE: prd.md, design_system.md]
```

**Deliverable:** Konsumen bisa daftar/login, profil tersimpan, prompt install PWA muncul.

---

### 🧩 Alvin — Registrasi Peternak 3-Tahap

**Bergantung: skeleton auth (task sendiri Hari 1) dan auth helper Rafi. Ini task paling kompleks di sprint ini — mulai lebih awal jika memungkinkan.**

**AI Agent Prompt:**
```
Lanjutan project adatelur.com sisi peternak. Saya lampirkan prd.md bagian 6.1–6.4
(Registrasi Peternak Tahap 1–3) dan schema_database.md bagian 4–5 (tabel
peternak_details dan peternak_verification_photos).

Tolong bantu saya implementasikan alur registrasi peternak 3 tahap sebagai
multi-step form (gunakan state management sederhana, misal useState dengan step
counter, TIDAK PERLU library form wizard eksternal yang berat):

TAHAP 1 — Data Dasar:
Form: nama pemilik, nomor HP, tanggal lahir, alamat peternak (dengan input
koordinat lat/long — untuk MVP, pakai HTML5 Geolocation API "Gunakan Lokasi Saya
Saat Ini" karena peternak kemungkinan mengisi form ini sambil berada di lokasi
kandangnya).

TAHAP 2 — Data Operasional:
Tampilkan 2 pilihan besar di awal tahap ini: "Video Call dengan CS" atau
"Isi Form Sendiri". Untuk "Video Call CS", cukup tampilkan tombol yang membuka
link WhatsApp langsung ke nomor CS (wa.me link) — TIDAK PERLU membangun sistem
video call custom. Untuk "Isi Form Sendiri", buat form dengan field: jumlah ayam,
produksi telur per hari, jumlah telur rusak per hari, jumlah telur bersih per
hari, jenis pakan, kebersihan kandang (deskripsi singkat), kepemilikan kendaraan
(toggle Ya/Tidak + jika Ya: jenis kendaraan), lama pengalaman beternak (tahun).

TAHAP 3 — Verifikasi Foto:
4 slot upload foto wajib: kandang luar, kandang dalam, ayam, telur. WAJIB
menggunakan kamera langsung (getUserMedia / react-webcam), BUKAN upload dari
galeri — sesuai ketentuan PRD bahwa dokumentasi harus diambil real-time dari
dalam platform.

Setelah submit Tahap 3, tampilkan halaman konfirmasi: "Proses verifikasi berjalan
maksimal 2x24 jam kerja, hasil akan dikirim lewat WhatsApp ke nomor yang
didaftarkan."

Gunakan base UI components dari components/ui/ (Button, Input, Card) — ikuti
design_system.md untuk seluruh styling.

[TAG FILE: prd.md, schema_database.md, design_system.md]
```

**Deliverable:** Alur registrasi peternak 3 tahap lengkap, foto tersimpan ke Supabase Storage, data tersimpan ke tabel `peternak_details` & `peternak_verification_photos` dengan `verification_status='pending'`.

---

## SPRINT HARI 4–5 (24–25 Juli) — Core Marketplace

### 🧩 Rafi — Smart Routing Algorithm & Listing API *(BLOCKING untuk Rian)*

**Bergantung pada seed data (Hari 1) & schema sudah lengkap. Ini task paling krusial — Rian menunggu ini untuk finalisasi halaman rekomendasi.**

**AI Agent Prompt:**
```
Lanjutan project adatelur.com. Saya lampirkan prd.md bagian 5.3 (Logika
Rekomendasi Peternak / Smart Routing) dan tech_stack.md bagian 3.4 (formula
Haversine untuk ongkir).

Tolong bantu saya buat endpoint POST /api/orders/recommend dengan spesifikasi:

INPUT: { rak_quantity: number, fulfillment_method: 'pickup' | 'delivery',
         consumer_lat?: number, consumer_lng?: number }

LOGIKA:
1. Query dari VIEW public_listings (BUKAN tabel listings langsung) — ambil semua
   listing dengan is_available = true.
2. Jika fulfillment_method === 'pickup': urutkan hasil HANYA berdasarkan
   price_per_rak ascending (tidak ada komponen ongkir).
3. Jika fulfillment_method === 'delivery': untuk setiap listing, hitung jarak
   pakai fungsi haversineDistance() (implementasikan persis seperti contoh kode
   di tech_stack.md bagian 3.4) antara koordinat peternak dan consumer_lat/lng,
   lalu hitung ongkir = calculateOngkir(distance). Hitung total_cost =
   (price_per_rak * rak_quantity) + ongkir. Urutkan ASCENDING berdasarkan
   total_cost.
4. Return array hasil, masing-masing berisi: listing_id, peternak_id,
   peternak_name, avatar_url, price_per_rak, distance_km (jika delivery),
   ongkir_amount, total_cost, final_score (dari tabel peternak_scores).
   PENTING: JANGAN pernah include field stock_rak di response ini.

Juga buatkan endpoint GET /api/peternak/[id] untuk halaman detail peternak,
yang mengembalikan profil lengkap + delivery_slots yang is_active=true dan
slot_date >= hari ini.

[TAG FILE: prd.md, tech_stack.md, schema_database.md]
```

**Deliverable:** Endpoint smart routing berjalan benar, teruji dengan seed data (hasil urutan masuk akal secara jarak & harga), endpoint detail peternak siap.

---

### 🧩 Rian — Halaman Home (Form Order) & Hasil Rekomendasi

**Bergantung: bisa mulai UI dengan mock data lebih dulu, WAJIB sambungkan ke API asli begitu Rafi selesai (paralel task di atas).**

**AI Agent Prompt:**
```
Lanjutan project adatelur.com sisi konsumen. Saya lampirkan prd.md bagian 5.2–5.5
(Halaman Utama, Logika Rekomendasi, Ongkir, Halaman Detail Peternak).

Tolong bantu saya implementasikan:
1. Halaman Home (/) dengan form order paling menonjol di layar: input jumlah rak
   (angka, minimal 1, dengan validasi jelas jika diisi 0 atau kosong), dan pilihan
   metode: "Ambil Sendiri" atau "Diantar (Delivery)". Jika pilih Delivery, minta
   izin lokasi (Geolocation API) untuk dapat consumer_lat/lng.
2. Setelah submit form, panggil POST /api/orders/recommend (gunakan TanStack Query
   useMutation), tampilkan hasil sebagai list ScoreCard component (sudah dibuat
   Hari 1) — untuk masing-masing card, tampilkan breakdown harga per rak dan
   estimasi ongkir SECARA TRANSPARAN meski urutan rekomendasi berdasarkan total
   cost gabungan (sesuai catatan PRD bahwa konsumen tetap boleh lihat breakdown).
3. Halaman detail peternak (/peternak/[id]) yang menampilkan hasil dari
   GET /api/peternak/[id]: foto profil, score, harga, daftar delivery_slots yang
   bisa dipilih (radio button/select), tombol "Pesan".
4. Sementara backend Rafi belum selesai, gunakan mock data dengan struktur
   response yang SAMA PERSIS seperti didefinisikan di prompt Rafi, supaya nanti
   tinggal switch dari mock ke API asli tanpa ubah struktur komponen.

[TAG FILE: prd.md, design_system.md]
```

**Deliverable:** Halaman Home & detail peternak lengkap, terhubung ke API smart routing asli.

---

### 🧩 Alvin — Manajemen Listing & Verifikasi Backend Flow (Sisi Peternak)

**Tidak bergantung pada task Rafi/Rian hari ini — independen, hanya perlu tabel `listings` & `delivery_slots` sudah ada (sudah dari Hari 1).**

**AI Agent Prompt:**
```
Lanjutan project adatelur.com sisi peternak. Saya lampirkan prd.md bagian 6.6
(Manajemen Listing) dan schema_database.md bagian 7 & 9 (tabel listings dan
delivery_slots).

Tolong bantu saya implementasikan:
1. Halaman dashboard peternak (/dashboard) — HANYA bisa diakses jika
   peternak_details.verification_status === 'approved' (redirect ke halaman
   "menunggu verifikasi" jika masih pending/in_review, atau halaman penolakan
   jika rejected).
2. Form posting listing harian: input harga per rak, toggle status
   is_listing_active (aktif/nonaktif jualan hari ini), dan input stock_rak
   (field ini PRIVATE, hanya terlihat di sisi peternak sendiri, TIDAK PERNAH
   di-expose ke API publik — pastikan endpoint yang dipakai halaman ini
   query LANGSUNG ke tabel listings, bukan VIEW public_listings, karena
   peternak berhak lihat stok miliknya sendiri).
3. Manajemen delivery_slots: peternak bisa menambah slot waktu (tanggal + jam
   mulai + jam selesai), mengaktifkan/menonaktifkan slot tertentu.
4. Buat API routes pendukung: POST /api/listings (create/update listing harian),
   POST /api/delivery-slots (create slot baru), PATCH /api/delivery-slots/[id]
   (toggle aktif/nonaktif).

[TAG FILE: prd.md, schema_database.md, design_system.md]
```

**Deliverable:** Peternak bisa posting listing harian & atur slot waktu, dashboard terkunci sampai verifikasi approved.

---

## SPRINT HARI 6 (26 Juli) — Order Lifecycle

### 🧩 Rafi — Backend Order Lifecycle & Cron Job Expiry *(BLOCKING untuk Alvin & sebagian Rian)*

**Bergantung pada smart routing (Hari 4–5) selesai. Task ini blocking untuk integrasi WhatsApp Alvin di Hari 7.**

**AI Agent Prompt:**
```
Lanjutan project adatelur.com. Saya lampirkan prd.md bagian 5.6 (Proses Order &
Approval Window) dan schema_database.md bagian 11–12 (tabel orders dan
order_status_history).

Tolong bantu saya implementasikan:
1. POST /api/orders — membuat order baru dengan status 'waiting', snapshot
   price_per_rak dan hitung subtotal/ongkir/total_amount, set
   response_deadline = created_at + interval 5 menit. Insert juga row pertama
   ke order_status_history dengan status 'waiting'.
2. POST /api/orders/[id]/respond — dipanggil saat peternak accept/reject
   (nanti dipakai juga oleh webhook WhatsApp Alvin di Hari 7). Body:
   { action: 'accept' | 'reject' }. Validasi: HANYA bisa direspon jika status
   masih 'waiting' DAN now() < response_deadline (jika sudah lewat deadline,
   tolak dengan error jelas "order sudah expired"). Update order_status jadi
   'accepted' atau 'rejected', catat responded_at, insert ke
   order_status_history.
3. Cron job (Vercel Cron, jalan tiap 30 detik–1 menit — sesuaikan minimum
   interval yang didukung Vercel Cron, jika tidak bisa sekecil itu gunakan
   Supabase Edge Function + pg_cron sebagai alternatif) yang:
   a. Query orders WHERE order_status='waiting' AND response_deadline < now()
      → update jadi 'expired', insert ke order_status_history.
   b. Query orders WHERE order_status='waiting' AND push_notif_sent_at IS NULL
      AND now() - created_at > interval '3 minutes' → tandai perlu kirim push
      notification (untuk sekarang cukup update kolom push_notif_sent_at, nanti
      logic pengiriman aktual push notification akan disambungkan terpisah).
4. GET /api/orders/[id] — untuk halaman tracking konsumen, return order lengkap
   dengan order_status_history (array step-by-step).

[TAG FILE: prd.md, schema_database.md]
```

**Deliverable:** Order lifecycle backend lengkap (create, accept/reject, auto-expire), cron job jalan terjadwal, endpoint tracking siap.

---

### 🧩 Rian — Halaman Checkout & Tracking Order (UI)

**Bergantung pada endpoint order dari Rafi (task di atas, hari yang sama) — kerjakan UI checkout duluan dengan mock, sambungkan begitu Rafi selesai.**

**AI Agent Prompt:**
```
Lanjutan project adatelur.com sisi konsumen. Saya lampirkan prd.md bagian 5.6
(Proses Order & Approval Window).

Tolong bantu saya implementasikan:
1. Alur checkout dari halaman detail peternak: setelah pilih slot waktu dan
   tekan "Pesan", tampilkan ringkasan order (breakdown harga, ongkir, total)
   sebelum konfirmasi final — panggil POST /api/orders.
2. Halaman /orders/[id] untuk tracking: tampilkan status order secara visual
   sebagai step-by-step (gunakan komponen stepper sederhana: Menunggu →
   Diterima → Sedang Diantar/Siap Diambil → Selesai — atau tampilkan status
   Ditolak/Kadaluarsa dengan Badge merah jika terjadi).
3. Implementasikan polling atau Supabase Realtime subscription pada halaman
   ini supaya status berubah otomatis tanpa perlu refresh manual saat peternak
   accept/reject dari sisi mereka.
4. Jika status berubah jadi 'rejected' atau 'expired', tampilkan pesan jelas
   dan tombol "Lihat Rekomendasi Lain" yang mengarahkan kembali ke hasil
   smart routing sebelumnya (skip input form dari awal — gunakan data yang
   sudah ada di state/query cache).

[TAG FILE: prd.md, design_system.md]
```

**Deliverable:** Checkout flow lengkap, halaman tracking real-time, auto re-route saat order gagal.

---

### 🧩 Alvin — UI Order Masuk (Sisi Peternak, Web Fallback)

**Tidak bergantung pada Rafi/Rian hari ini secara langsung untuk UI-nya, tapi endpoint accept/reject dari Rafi (task di atas) dibutuhkan untuk fungsional penuh. Siapkan UI duluan.**

**AI Agent Prompt:**
```
Lanjutan project adatelur.com sisi peternak. Saya lampirkan prd.md bagian 5.6
dan 6.5 (Order masuk & interaksi WhatsApp-first), dan schema_database.md
bagian 11.

Tolong bantu saya implementasikan halaman /dashboard/orders sebagai FALLBACK
web (mengingat interaksi utama peternak nantinya lewat WhatsApp, tapi kita
tetap butuh versi web untuk demo & sebagai cadangan):
1. List order masuk dengan status 'waiting', tampilkan sisa waktu countdown
   dari response_deadline (real-time countdown timer di UI, highlight warna
   merah/urgent jika sisa < 1 menit).
2. Tombol Terima (Success Button) dan Tolak (Secondary Button) yang memanggil
   POST /api/orders/[id]/respond (endpoint dari Rafi).
3. List riwayat order (status accepted/rejected/expired/completed) di bawahnya
   untuk referensi.
4. Gunakan Supabase Realtime subscription supaya order baru yang masuk
   langsung muncul di list tanpa refresh manual.

[TAG FILE: prd.md, schema_database.md, design_system.md]
```

**Deliverable:** Dashboard order peternak fungsional sebagai fallback web, countdown timer akurat.

---

## SPRINT HARI 7 (27 Juli) — Integrasi Eksternal

### 🧩 Alvin — Integrasi WhatsApp (Fonnte) *(kerjakan setelah order lifecycle Rafi Hari 6 beres)*

**Bergantung: endpoint order dari Rafi (Hari 6) harus sudah selesai & stabil.**

**AI Agent Prompt:**
```
Lanjutan project adatelur.com. Saya lampirkan prd.md bagian 6.5 (interaksi
WhatsApp-first peternak) dan tech_stack.md bagian 3.3 (integrasi Fonnte).

Tolong bantu saya implementasikan:
1. Setup koneksi ke Fonnte API — buatkan wrapper function lib/fonnte/send.ts
   untuk mengirim pesan WhatsApp (terima parameter: nomor tujuan, isi pesan,
   opsional quick-reply buttons).
2. Trigger pengiriman notifikasi order baru ke peternak: saat POST /api/orders
   (dari Rafi) berhasil membuat order baru, kirim pesan WhatsApp ke peternak
   berisi detail order (nama konsumen, jumlah rak, lokasi, metode pengambilan,
   slot waktu) dengan format quick-reply "Terima" / "Tolak".
3. Buat webhook handler POST /api/whatsapp/webhook untuk menerima balasan dari
   Fonnte ketika peternak menekan Terima/Tolak (atau membalas teks 'terima'/
   'tolak' sebagai fallback jika platform tidak mendukung native quick-reply
   button) — dari sini panggil endpoint POST /api/orders/[id]/respond yang
   sudah dibuat Rafi.
4. Implementasikan trigger notifikasi hasil verifikasi peternak (approved/
   rejected) via WhatsApp — dipanggil dari sisi admin/CS ketika status
   peternak_details.verification_status berubah.
5. Catat setiap notifikasi terkirim ke tabel notifications_log
   (channel='whatsapp').

[TAG FILE: prd.md, tech_stack.md, schema_database.md]
```

**Deliverable:** Notifikasi order baru terkirim otomatis ke WhatsApp peternak, webhook balasan berfungsi, notifikasi hasil verifikasi jalan.

---

### 🧩 Rian — Integrasi Payment (Midtrans Snap)

**Bergantung pada tabel/endpoint orders dari Rafi (Hari 6) sudah ada — bisa mulai duluan dengan sandbox test.**

**AI Agent Prompt:**
```
Lanjutan project adatelur.com sisi konsumen. Saya lampirkan prd.md bagian 5.6
(pembayaran digital wajib, tidak ada COD) dan tech_stack.md bagian 3.5
(Midtrans Snap Sandbox).

Tolong bantu saya implementasikan:
1. Setup Midtrans Snap di halaman checkout: setelah order berhasil dibuat
   (status 'waiting'), panggil endpoint backend untuk generate Snap token,
   lalu tampilkan Snap popup untuk pembayaran (mode SANDBOX, gunakan test
   credentials).
2. Buat API route POST /api/payment/create-transaction yang generate Snap
   token berdasarkan order_id, amount dari total_amount order tersebut.
3. Buat webhook handler POST /api/payment/webhook untuk menerima notifikasi
   status pembayaran dari Midtrans, update kolom payment_status dan
   payment_reference di tabel orders.
4. Pastikan alur: order TIDAK dianggap valid/dikirim ke peternak sebelum
   payment_status = 'paid' — sesuaikan urutan create order vs pembayaran
   supaya konsisten dengan flow di prd.md (bayar dulu baru status order jadi
   'waiting' menunggu approval peternak).

[TAG FILE: prd.md, tech_stack.md]
```

**Deliverable:** Pembayaran sandbox berfungsi end-to-end, status pembayaran tersinkron ke database.

---

### 🧩 Rafi — Endpoint Scoring & Recalculation Logic

**Tidak bergantung pada Rian/Alvin hari ini — independen, kerjakan paralel.**

**AI Agent Prompt:**
```
Lanjutan project adatelur.com. Saya lampirkan prd.md bagian 7 (Sistem Scoring
Peternak) dan schema_database.md bagian 15 (tabel peternak_scores, termasuk
catatan formula normalisasi di bawah definisi tabel tersebut).

Tolong bantu saya implementasikan:
1. Function lib/scoring.ts yang menghitung final_score sesuai formula:
   - transaction_score: skala absolut dengan cap Rp 5.000.000 omzet kumulatif
     = 100 poin, linear di bawahnya.
   - delivery_score: langsung dari delivery_accuracy_pct (hanya dihitung dari
     order dengan fulfillment_method='delivery' yang delivery_proof-nya
     is_within_slot=true dibagi total order delivery yang completed).
   - rating_score: (average_rating / 5) * 100.
   - final_score = (transaction_score * 0.5) + (delivery_score * 0.3) +
     (rating_score * 0.2).
   - Jika final_score < 30, set is_suspended = true dan suspension_reason.
2. API route POST /api/peternak/[id]/recalculate-score yang menjalankan
   ulang perhitungan ini berdasarkan data terbaru dari orders, ratings, dan
   delivery_proof, lalu upsert ke tabel peternak_scores.
3. Trigger pemanggilan endpoint ini otomatis setiap kali: order berubah jadi
   'completed', rating baru dibuat, atau delivery_proof baru diunggah.
4. Pastikan VIEW public_listings (yang sudah dibuat Hari 1) benar-benar
   menyembunyikan peternak dengan is_suspended=true dari hasil pencarian
   konsumen — verifikasi ulang query VIEW-nya jika perlu.

[TAG FILE: prd.md, schema_database.md]
```

**Deliverable:** Scoring otomatis terhitung ulang setiap ada transaksi/rating baru, peternak dengan score rendah otomatis tersembunyi dari pencarian.

---

## SPRINT HARI 8 (28 Juli) — Polish & Bukti Kirim

### 🧩 Alvin — Kamera In-App untuk Bukti Pengiriman

**Bisa dikerjakan independen (reuse komponen kamera yang sudah dibuat untuk verifikasi peternak di Hari 2–3).**

**AI Agent Prompt:**
```
Lanjutan project adatelur.com. Saya lampirkan prd.md bagian 5.7 (Bukti
Pengiriman) dan schema_database.md bagian 13 (tabel delivery_proof).

Tolong bantu saya implementasikan:
1. Halaman/modal di dashboard peternak untuk order yang statusnya 'accepted'
   dan sudah waktunya dikirim/diambil: tombol "Ambil Foto Bukti Pengiriman"
   yang membuka kamera in-app (reuse komponen kamera dari fitur registrasi
   Hari 2–3, JANGAN buat ulang dari nol).
2. Setelah foto diambil, upload ke Supabase Storage bucket delivery-proofs,
   simpan record ke tabel delivery_proof dengan captured_at = waktu
   pengambilan foto.
3. Hitung otomatis is_within_slot: bandingkan captured_at dengan waktu mulai
   dan selesai dari delivery_slot yang terkait order tersebut, simpan hasil
   boolean-nya.
4. Setelah foto tersimpan, update order_status jadi 'completed' dan trigger
   panggilan ke /api/peternak/[id]/recalculate-score (endpoint dari Rafi
   Hari 7).

[TAG FILE: prd.md, schema_database.md]
```

**Deliverable:** Peternak bisa upload bukti kirim langsung dari kamera, status order otomatis selesai, scoring ter-update.

---

### 🧩 Rian — Rating & Savings Summary Sederhana

**Bergantung pada order status 'completed' bisa terjadi (dari task Alvin di atas) — bisa siapkan UI duluan dengan mock status.**

**AI Agent Prompt:**
```
Lanjutan project adatelur.com sisi konsumen. Saya lampirkan prd.md bagian 5.8
(Order Selesai & Rating) dan schema_database.md bagian 14 (tabel ratings).

Tolong bantu saya implementasikan:
1. Setelah order berstatus 'completed' (terlihat di halaman tracking
   /orders/[id]), tampilkan form rating: bintang 1–5 dan kolom review text
   opsional.
2. POST /api/orders/[id]/rating — simpan rating, trigger recalculate score
   peternak terkait (panggil endpoint dari Rafi).
3. Tampilkan riwayat rating yang pernah diberikan konsumen di halaman
   /orders (list semua order konsumen, dengan indikator sudah/belum dirating).

[TAG FILE: prd.md, schema_database.md, design_system.md]
```

**Deliverable:** Konsumen bisa memberi rating setelah order selesai, riwayat order lengkap.

---

### 🧩 Rafi — Push Notification (Trigger 3 Menit) & Finalisasi Cron

**Independen, lanjutan dari cron job Hari 6.**

**AI Agent Prompt:**
```
Lanjutan project adatelur.com. Saya lampirkan prd.md bagian 5.6 (push
notification trigger 3 menit dengan bunyi berulang) dan tech_stack.md
bagian 3.7 (Web Push API).

Tolong bantu saya implementasikan:
1. Generate VAPID key pair, simpan di environment variable.
2. Buat mekanisme peternak subscribe push notification: saat pertama kali
   masuk dashboard, minta permission notifikasi browser, simpan
   push_subscription (endpoint + keys) ke database (buatkan tabel baru
   push_subscriptions jika belum ada di schema_database.md, dengan kolom
   peternak_id, endpoint, p256dh_key, auth_key).
3. Lengkapi cron job dari Hari 6 (bagian yang menandai push_notif_sent_at):
   setelah ditandai, panggil library web-push untuk benar-benar mengirim
   push notification ke device peternak terkait, dengan payload pesan sesuai
   format PRD: "Pesanan atas nama [Nama Konsumen] telah menunggu."
4. Implementasikan service worker handler untuk menampilkan notifikasi
   dengan bunyi (gunakan Notification API dengan opsi silent: false, dan
   jika memungkinkan custom sound).
5. Catat pengiriman push notification ke tabel notifications_log
   (channel='push_pwa').

[TAG FILE: prd.md, tech_stack.md]

Catatan: jika Web Push terbukti tidak stabil di waktu tersisa, siapkan juga
fallback sederhana — pastikan WhatsApp (dari Alvin, Hari 7) tetap menjadi
kanal utama yang reliable, push notification ini adalah lapisan tambahan saja.
```

**Deliverable:** Push notification terkirim otomatis di menit ke-3 jika ada, dengan fallback WA tetap berfungsi independen.

---

## SPRINT HARI 9 (29 Juli) — QA & Deploy (SELURUH TIM BERSAMA)

**Tidak ada pembagian kerja terpisah hari ini — seluruh tim fokus bersama pada:**

### 🧩 Seluruh Tim — End-to-End Testing & Demo Prep

**AI Agent Prompt (jalankan bersama, screen-share, satu orang yang mengetik):**
```
Project adatelur.com sudah memiliki seluruh fitur inti: registrasi konsumen &
peternak, smart routing, order lifecycle dengan approval window 5 menit,
integrasi WhatsApp, payment, bukti pengiriman, rating, dan scoring. Saya
lampirkan prd.md sebagai acuan lengkap seluruh flow yang harus bekerja.

Tolong bantu saya:
1. Buat checklist end-to-end testing berdasarkan seluruh alur di prd.md,
   dari bagian 5 (sisi konsumen) dan bagian 6 (sisi peternak) — pastikan
   tidak ada langkah yang terlewat.
2. Bantu saya identifikasi edge case yang mungkin belum tertangani: apa yang
   terjadi jika peternak reject order, apakah re-routing ke alternatif
   berikutnya benar-benar terjadi otomatis di UI konsumen? Apa yang terjadi
   jika 2 konsumen order ke peternak yang sama dalam waktu berdekatan dan
   stok cuma cukup untuk 1?
3. Review environment variables di Vercel production — pastikan semua sudah
   diisi dengan value asli (bukan sandbox/test) kecuali Midtrans yang memang
   tetap sandbox untuk demo.
4. Bantu saya jalankan seed data final (dari seed.sql Hari 1, sesuaikan
   datanya supaya cerita demo lebih menarik — misal 1 peternak dengan score
   tinggi jadi "bintang" platform, 1 peternak dengan lokasi sangat dekat
   konsumen demo untuk menunjukkan smart routing bekerja jelas).
5. Deploy final ke Vercel production, jalankan smoke test di URL production
   (bukan cuma localhost).

[TAG FILE: prd.md, schema_database.md, tech_stack.md, design_system.md]
```

**Deliverable:** Platform live di production URL, seluruh flow inti teruji, seed data siap untuk demo ke juri.

---

## Ringkasan Visual Dependency (Gantt Sederhana)

```
Hari:        1    2    3    4    5    6    7    8    9
Rafi:      [Setup+DB][Auth ][Routing  ][Order+Cron][Scoring][Push  ][QA]
Rian:      [Design  ][Consumer Auth  ][Home/Rec ][Checkout][Payment][Rating][QA]
Alvin:     [PWA     ][Peternak Reg   ][Listing  ][OrderUI ][WA Fonnte][Camera][QA]

Blocking points:
  Hari 1 → semua nunggu Rafi (setup awal)
  Hari 4-5 → Rian nunggu Rafi (smart routing API)
  Hari 6 → Alvin nunggu Rafi (order lifecycle) sebelum WA integration Hari 7
  Hari 9 → semua kerja bareng
```

---

## Rekomendasi Tambahan

1. **Daily sync singkat tiap pagi (15 menit)** — bukan meeting panjang, cukup update: "kemarin selesai apa, hari ini kerjain apa, ada blocker apa." Dengan dependency chain seketat ini (terutama Hari 1, 4–5, 6), keterlambatan satu orang bisa mendomino ke yang lain.
2. **Rafi sebaiknya prioritaskan komunikasi status di titik-titik blocking** (akhir Hari 1, akhir Hari 5, akhir Hari 6) — beri sinyal jelas ke Rian/Alvin begitu endpoint terkait sudah siap dipakai, jangan biarkan mereka menebak-nebak.
3. Jika di tengah jalan ada fitur yang terlihat tidak akan selesai tepat waktu (skenario paling mungkin: push notification PWA, chat asisten AI, atau prediksi produksi harian), **rujuk ke `prd.md` bagian 10 (Di Luar Cakupan MVP) dan bagian 12 (Rekomendasi)** — fitur-fitur itu sudah ditandai sejak awal sebagai stretch goal yang boleh dikorbankan tanpa mengubah cerita inti produk ke juri.
4. Simpan **screenshot/recording tiap tahap penting** (registrasi peternak, order flow, smart routing) mulai dari Hari 5–6 — jangan menunggu Hari 9 untuk mulai menyiapkan bahan visual presentasi, supaya tidak terburu-buru di hari terakhir.

---

**Dokumen terkait:** `prd.md`, `schema_database.md`, `tech_stack.md`, `design_system.md`
