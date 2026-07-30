# PRD — adatelur

**Product Requirements Document**
Versi: 1.0 | Tanggal: 21 Juli 2026 | Status: MVP Build (Kompetisi VeternityBeraksi 2026)
Tim: Rafi, Rian, Alvin

---

## 1. Ringkasan Eksekutif

**adatelur** adalah platform web (PWA — Progressive Web App) yang menghubungkan **peternak ayam petelur** langsung ke **konsumen** (rumah tangga & UMKM), memotong seluruh rantai perantara (tengkulak, distributor, warung besar). Platform hanya punya **2 role**: Peternak dan Konsumen — tidak ada admin marketplace yang mengatur harga, tidak ada gudang, tidak ada stok terpusat.

Karena telur cepat rusak dan pasokan dari 1 peternak terbatas, sistem menekankan **kecepatan keputusan** (window 5 menit untuk peternak approve/reject order) dan **efisiensi rute** (rekomendasi bukan berdasar harga termurah semata, tapi **total biaya optimal** = harga rak + ongkir).

Referensi data pendukung (gap harga, populasi ayam, demand Jawa Barat) ada di dokumen riset terpisah (`Bank Data & Latar Belakang Masalah` dan `Proposal Telur Desa`) — PRD ini fokus murni pada spesifikasi produk & build.

---

## 2. Masalah yang Diselesaikan

1. **Gap harga peternak vs konsumen** (~30–60% markup akibat tengkulak, distributor, retail berlapis).
2. **Asimetri informasi** — peternak tidak tahu harga pasar real-time, terpaksa terima harga dari tengkulak.
3. **Tidak ada kepastian pembeli** — peternak tidak tahu siapa yang butuh telur hari ini.
4. **Konsumen tidak tahu asal-usul telur** — tidak ada standar kualitas atau transparansi.

adatelur menjawab ini dengan marketplace langsung + smart routing + verifikasi kualitas di awal (bukan post-hoc lab test, tapi verifikasi visual saat onboarding + reputasi berjalan).

---

## 3. Tujuan Produk (Goals)

| Goal | Success Metric (untuk demo/kompetisi) |
|---|---|
| Konsumen bisa order telur dengan 1 form sederhana | Order flow selesai < 90 detik (dari input rak sampai bayar) |
| Peternak bisa terima order tanpa perlu buka dashboard rumit | Notifikasi & approve/reject 100% bisa dilakukan lewat WhatsApp |
| Sistem merekomendasikan opsi paling efisien, bukan termurah semata | Algoritma total cost (harga rak + ongkir) berjalan dan terbukti benar saat demo |
| Peternak lama respon tidak mengunci slot selamanya | Auto-hangus order setelah 5 menit tanpa respon, sistem re-route ke peternak lain |
| Reputasi peternak transparan & multi-dimensi | Score 1–100 tampil di setiap listing, dihitung dari 3 parameter berbobot |

---

## 4. Role & Definisi Pengguna

### 4.1 Konsumen
Siapa saja — ibu rumah tangga, pemilik warung/UMKM kuliner, individu. Tidak ada verifikasi khusus untuk role ini, cukup daftar akun (Google/Gmail OAuth atau manual: email, password, nama lengkap, no. telepon).

### 4.2 Peternak
Pemilik usaha ternak ayam petelur skala kecil-menengah. **Wajib melalui proses verifikasi** (form terstruktur ATAU video call dengan CS) sebelum bisa berjualan. Interaksi harian mayoritas dilakukan lewat **WhatsApp**, bukan buka website — karena target pengguna kemungkinan kurang familiar dengan dashboard web.

> Tidak ada role "Admin Marketplace" untuk approve/reject listing satu-satu — proses kelayakan terjadi sekali di awal (saat onboarding). Setelah lolos verifikasi, peternak bebas posting & berjualan; kontrol kualitas selanjutnya berjalan lewat sistem **scoring & suspensi otomatis**.

---

## 5. Alur & Fitur — SISI KONSUMEN

### 5.1 Registrasi & Onboarding

1. Konsumen mengakses `adatelur` → landing page standar (hero, penjelasan value proposition, tombol **Daftar**).
2. Daftar via:
   - Google OAuth (Supabase Auth), atau
   - Manual: email, password, nama lengkap, nomor telepon.
3. Setelah login pertama kali, sistem menampilkan **1 tombol highlighted**: *"Pasang ke Layar Utama"* (prompt PWA `beforeinstallprompt`). Bersifat **opsional**, bukan wajib — tujuannya agar akses berikutnya tidak perlu buka browser & ketik domain lagi.

### 5.2 Halaman Utama (Home)

Menampilkan:
- **Form order** (elemen paling ditonjolkan di layar) — hanya 2 input inti:
  1. Jumlah rak yang ingin dibeli (angka, minimal **1 rak** — sistem **tidak melayani pembelian per butir**)
  2. Metode pengambilan: **Ambil Sendiri** atau **Diantar (Delivery)**
- List singkat peternak dengan track record bagus (social proof, ditampilkan di bawah form)

### 5.3 Logika Rekomendasi Peternak (Smart Routing)

Setelah konsumen submit form:

```
IF metode == "Ambil Sendiri":
    Tampilkan peternak yang stock-available, urutkan hanya berdasarkan HARGA PER RAK
    (tidak ada komponen ongkir)

IF metode == "Delivery":
    Untuk setiap peternak yang stock-available:
        total_biaya = (harga_per_rak × jumlah_rak) + ongkir(jarak_peternak_ke_konsumen)
    Urutkan ASCENDING berdasarkan total_biaya
    Tampilkan sebagai rekomendasi utama peternak dengan total_biaya terendah
    (BUKAN yang harga rak termurah, BUKAN yang ongkir termurah — melainkan kombinasi paling efisien)
```

**Ketentuan penting:**
- Peternak yang berstatus **tidak tersedia** (stok habis / sedang nonaktif) tidak muncul sama sekali di list.
- Konsumen **tetap bisa melihat breakdown**: harga per rak & estimasi ongkir masing-masing peternak — transparansi tetap dijaga, hanya urutan rekomendasi yang dioptimalkan sistem.
- **Stok exact TIDAK ditampilkan ke konsumen.** Yang tampil hanya status biner: `✓ Tersedia` / `Tidak Tersedia`. Ini melindungi peternak dari kompetitor yang bisa membaca tren stok mereka (lihat detail rasional di §9).

### 5.4 Ongkos Kirim (Ongkir)

- Dihitung **per kilometer**, jarak dari lokasi peternak ke lokasi/alamat konsumen.
- Formula MVP: **Haversine distance** (jarak garis lurus dari koordinat lat/long) × tarif per km yang ditentukan sistem (bukan oleh peternak individu, supaya adil & konsisten lintas peternak). *(Lihat `tech_stack.md` untuk alasan pemilihan Haversine dibanding Distance Matrix API.)*
- Jika metode = Ambil Sendiri → ongkir = Rp 0, harga final = harga rak saja.

### 5.5 Halaman Detail Peternak

Saat konsumen klik salah satu rekomendasi, sistem membuka halaman detail:
- Foto & profil peternak (foto kandang/ayam dari proses verifikasi)
- Score reputasi (1–100) + breakdown rating
- Harga per rak, estimasi ongkir (jika delivery)
- **Slot waktu pengiriman/pengambilan** — daftar jam yang **ditentukan oleh peternak sendiri** (bukan custom oleh konsumen). Slot otomatis hilang dari pilihan jika peternak sedang nonaktif atau slot tersebut sudah tidak bisa diakomodasi.
- Tombol **Pesan**

### 5.6 Proses Order & Approval Window

1. Konsumen pilih slot waktu → tekan **Pesan** → pilih metode bayar (digital only: e-wallet, m-banking, QRIS — **tidak ada COD**) → bayar.
2. Order dibuat dengan status **`waiting`** (belum otomatis diproses).
3. Notifikasi order masuk ke peternak **lewat WhatsApp** (nama pemesan, jumlah rak, lokasi, metode pengambilan, slot waktu). Peternak balas **Terima** / **Tolak** langsung dari WhatsApp (button/quick reply).
4. **Window waktu: 5 menit total.**
   - Jika dalam **3 menit pertama** tidak ada respon → sistem memicu **push notification tahap 2** lewat PWA (bukan cuma WA): notifikasi dengan bunyi, muncul di device peternak, format singkat:
     > *"Pesanan atas nama [Nama Konsumen] telah menunggu."*
     Diulang sampai 3× dengan jeda singkat untuk menarik perhatian, tanpa mengganggu berlebihan.
   - Jika sampai **menit ke-5** tetap tidak ada respon → order otomatis **hangus (`expired`)**.
5. **Jika Diterima** → status berubah menjadi `accepted`/diproses, konsumen bisa melihat tracking step demi step di halaman order-nya.
6. **Jika Ditolak / Hangus** → konsumen langsung mendapat rekomendasi peternak alternatif berikutnya (auto re-route ke opsi #2 dari list rekomendasi awal), tanpa perlu mengulang input form dari nol.

### 5.7 Bukti Pengiriman (Delivery Proof)

- Saat tahap penerimaan barang, peternak **wajib mengambil foto langsung dari dalam platform** (bukan upload dari galeri) sebagai bukti pesanan berhasil dikirim/disiapkan tepat waktu.
- Foto ini tersimpan sebagai bagian dari riwayat order & dipakai sebagai salah satu input untuk **akurasi ketepatan pengiriman** di sistem scoring.

### 5.8 Order Selesai & Rating

- Setelah status `delivered`/`completed`, konsumen memberi **rating** ke peternak (komponen input untuk scoring — lihat §7).

### 5.9 Ringkasan Fitur Konsumen

| # | Fitur | Prioritas MVP |
|---|---|---|
| 1 | Registrasi (Google OAuth + manual) | Wajib |
| 2 | PWA install prompt | Wajib |
| 3 | Form order (jumlah rak + metode ambil) | Wajib |
| 4 | Smart routing rekomendasi (total cost) | Wajib |
| 5 | Halaman detail peternak + slot waktu | Wajib |
| 6 | Payment digital (Midtrans) | Wajib |
| 7 | Order status: waiting → accepted/rejected/expired | Wajib |
| 8 | Push notification 3-menit trigger | Wajib (nice-to-have jika waktu mepet → fallback: WA only) |
| 9 | Tracking step order | Wajib |
| 10 | Rating peternak | Wajib |
| 11 | Savings dashboard (opsional, dari riset sebelumnya) | Stretch goal (Phase 2, di luar 9 hari) |

---

## 6. Alur & Fitur — SISI PETERNAK

### 6.1 Registrasi Tahap 1 — Data Dasar

Form singkat (wajib diisi manual, semua orang lewat jalur ini):
- Nama pemilik peternak
- Nomor HP
- Tanggal lahir
- Alamat peternak (lokasi kandang — dipakai untuk perhitungan jarak/ongkir)

### 6.2 Registrasi Tahap 2 — Detail Operasional (2 Opsi)

Peternak memilih salah satu:

**Opsi A — Video Call dengan Customer Service (CS)**
CS membantu mengisi seluruh data melalui percakapan langsung (mengatasi kendala gaptek/form panjang). Semua pertanyaan sama seperti Opsi B, hanya cara input berbeda (CS yang mengetik di sistem, peternak tinggal jawab).

**Opsi B — Isi Form Sendiri**
Field yang harus diisi:
1. Jumlah ayam (ekor)
2. Produksi telur per hari (butir)
3. Jumlah telur rusak per hari & telur bersih per hari
4. Jenis pakan yang diberikan
5. Kebersihan kandang (deskripsi/skala — dikonfirmasi via foto di Tahap 3)
6. Kepemilikan kendaraan (Ya/Tidak) + jenis kendaraan (jika ada — relevan untuk opsi delivery)
7. Lama pengalaman beternak

### 6.3 Registrasi Tahap 3 — Verifikasi Kualitas (Foto)

Peternak wajib upload **4 foto**:
1. Tampak luar kandang
2. Tampak dalam kandang
3. Foto ayam
4. Foto telur

Foto-foto ini dikirim ke sistem sebagai bahan verifikasi kelayakan.

### 6.4 Proses Verifikasi & Keputusan

- Sistem menampilkan notifikasi: proses verifikasi berjalan **maksimal 2×24 jam kerja**.
- Hasil (diterima/ditolak) dikirim lewat **WhatsApp**.
- Jika **diterima** → peternak otomatis terdaftar & langsung bisa mulai transaksi jual-beli.
- *(Catatan proses eskalasi — lihat §9 untuk detail SLA follow-up jika tidak ada balasan dari peternak pasca-pengumuman, diadaptasi dari diskusi tim sebelumnya.)*

### 6.5 Interaksi Harian — WhatsApp-First

Mayoritas fitur peternak diakses lewat **WhatsApp** (bukan buka website), dengan format **menu pilihan/tombol (button-based)** — bukan mengetik bebas — supaya ramah untuk peternak dengan literasi digital rendah.

Fitur yang tersedia via WhatsApp:

| Fitur | Deskripsi |
|---|---|
| **Notifikasi order masuk** | Detail order + tombol Terima/Tolak |
| **Prediksi produksi harian** | Sistem menghitung estimasi jumlah telur & rak hari ini berdasarkan data registrasi awal (jumlah ayam × estimasi laying rate). Ditampilkan dengan tombol **Benar** (konfirmasi ke sistem) atau **Edit** (peternak input angka aktual, lalu update ke sistem) |
| **Notifikasi perubahan harga pasar** | Jika harga acuan nasional untuk telur berubah **≥10%** dari harga yang dipasang peternak (naik atau turun), sistem kirim notifikasi informasi harga terkini |
| **Chat asisten operasional** | Tautan di WA membuka PWA versi chat, khusus untuk peternak menanyakan hal seputar operasional ternak (bukan chat ke konsumen) |

> **Catatan cakupan:** Fitur "AI mencari berita/informasi harga nasional dari internet setiap hari" sempat didiskusikan tim sebagai fitur tambahan kecerdasan pasar. **Fitur ini ditandai sebagai Phase 2 / stretch goal** — dieksekusi hanya jika sisa waktu di hari-hari akhir sprint memungkinkan (lihat `task_division.md`). Prioritas 9 hari pertama adalah memastikan alur transaksi inti (order → approval → delivery → rating → scoring) berjalan sempurna.

### 6.6 Manajemen Listing (Posting Telur Harian)

- Peternak set **harga per rak** dan **status ketersediaan** (available/tidak) — bisa lewat WhatsApp (menu button) atau web.
- Slot waktu pengiriman/pengambilan diatur oleh peternak sendiri (bisa nonaktifkan jam tertentu).

### 6.7 Ringkasan Fitur Peternak

| # | Fitur | Prioritas MVP |
|---|---|---|
| 1 | Registrasi Tahap 1 (data dasar) | Wajib |
| 2 | Registrasi Tahap 2 (form / video call CS) | Wajib — video call bisa disederhanakan untuk demo (CS manual di WA call) jika waktu mepet |
| 3 | Registrasi Tahap 3 (upload 4 foto verifikasi) | Wajib |
| 4 | Notifikasi hasil verifikasi via WA | Wajib |
| 5 | Posting listing (harga, status, slot waktu) | Wajib |
| 6 | Notifikasi order via WA + approve/reject | Wajib |
| 7 | Push notification 3 menit (WA fallback ke PWA push) | Wajib |
| 8 | Bukti pengiriman (foto in-app) | Wajib |
| 9 | Prediksi produksi harian + edit | Nice-to-have (bisa versi sederhana: static formula, tanpa ML kompleks) |
| 10 | Notifikasi perubahan harga nasional ≥10% | Stretch goal |
| 11 | Chat asisten operasional (AI) | Stretch goal |
| 12 | AI web-scraping berita pasar harian | Phase 2 (di luar 9 hari, dicoret jika perlu) |

---

## 7. Sistem Scoring Peternak

Setiap peternak punya **score 1–100**, dihitung dari 3 parameter berbobot:

| Parameter | Bobot | Deskripsi |
|---|---|---|
| **Total nilai transaksi** | **50%** | Akumulasi nilai rupiah dari seluruh transaksi berhasil (bukan jumlah transaksi/rak, tapi total omzet — makin besar & konsisten jualan, makin tinggi kontribusi skor) |
| **Akurasi ketepatan pengiriman** | **30%** | Hanya dihitung untuk order dengan metode **Delivery**. Dibandingkan slot waktu yang dijanjikan (mis. 19:00–21:00) vs waktu aktual foto bukti pengiriman diambil. Order **Ambil Sendiri tidak dihitung** dalam parameter ini. |
| **Rating** | **20%** | Rata-rata rating dari konsumen (skala 1–5, dinormalisasi ke persentase) |

**Formula:**
```
score_final = (transaksi_ternormalisasi × 0.5) + (akurasi_pengiriman × 0.3) + (rating_ternormalisasi × 0.2)
→ Skala akhir: 1–100
```

Score ini **ditampilkan di setiap listing/card** yang dilihat konsumen sebagai salah satu acuan pemilihan peternak (bukan pengganti sistem rekomendasi total-cost, tapi info tambahan yang tampil bersamaan).

**Konsekuensi score rendah:** peternak dengan score terlalu rendah berisiko **disuspend** dari sistem (ambang batas & mekanisme detail bisa disepakati tim saat implementasi — direkomendasikan: score < 30 selama periode berjalan → warning; berkelanjutan → suspend sementara).

---

## 8. Notifikasi — Rangkuman Sistem

Prinsip: **apa yang masuk ke WhatsApp, tercermin juga di web (dan sebaliknya)** — dua kanal saling sinkron sebagai satu sumber kebenaran (single source of truth di database, dua channel delivery).

| Trigger | Kanal | Penerima |
|---|---|---|
| Order baru masuk | WhatsApp (utama) | Peternak |
| 3 menit tidak direspon | Push Notification PWA (dengan bunyi, repeat 3×) | Peternak |
| Order diterima/ditolak/hangus | Update real-time di halaman order | Konsumen |
| Hasil verifikasi peternak | WhatsApp | Peternak |
| Perubahan harga pasar ≥10% | WhatsApp | Peternak |
| Prediksi produksi harian | WhatsApp (button Benar/Edit) | Peternak |

---

## 9. Keputusan Desain Penting (Design Rationale)

1. **Minimal order 1 rak, bukan per butir** — menyederhanakan unit ekonomi, packing, dan logika inventory. Konsisten di seluruh sistem (harga, ongkir, listing).
2. **Stok tersembunyi (hanya status available/tidak)** — melindungi peternak dari kompetitor yang bisa membaca tren stok mereka & melakukan predatory pricing (competitive intelligence protection).
3. **Window 5 menit untuk approval** — telur adalah barang cepat rusak & permintaan bisa dialihkan ke peternak lain; urgensi menjaga reliabilitas platform.
4. **Rekomendasi berbasis total cost, bukan harga termurah** — peternak dengan harga sedikit lebih tinggi tapi lokasi lebih dekat (ongkir murah) tetap kompetitif; ini adil untuk peternak yang lokasinya strategis meski harga rak-nya tidak paling murah.
5. **Pembayaran wajib digital, tidak ada COD** — menyederhanakan alur (tidak perlu rekonsiliasi uang tunai di lapangan) dan memastikan kepastian pembayaran ke peternak.
6. **WhatsApp-first untuk peternak** — target pengguna (peternak rakyat, termasuk lansia) jauh lebih familiar WhatsApp dibanding membuka web dashboard.
7. **Verifikasi di awal (bukan quality control berkelanjutan oleh admin)** — sistem tidak scalable jika ada manusia yang cek tiap listing; kontrol kualitas berkelanjutan didelegasikan ke sistem scoring otomatis + rating komunitas.

---

## 10. Di Luar Cakupan MVP (Out of Scope)

- Pembayaran COD/tunai
- Pembelian per butir (hanya per rak)
- Fitur koperasi/multi-peternak dalam satu akun (sempat didiskusikan tim, diputuskan tidak untuk versi ini)
- AI web-scraping berita harga nasional otomatis (stretch/Phase 2)
- Marketplace B2B ke UMKM skala besar / distributor
- Aplikasi native (Android/iOS) — cukup PWA di kedua role
- Sistem refund otomatis kompleks (untuk MVP, penyelesaian dispute dilakukan manual dulu jika terjadi kasus saat demo)

---

## 11. Non-Functional Requirements

- **Mobile-first**: mayoritas trafik (baik konsumen maupun peternak) diasumsikan dari HP.
- **PWA installable** di kedua role (manifest.json, service worker, ikon, splash screen).
- **Realtime-capable**: perubahan status order harus reflect near-instant di UI konsumen (pakai Supabase Realtime subscriptions).
- **Resilient terhadap koneksi lambat**: mengingat lokasi peternak bisa di area dengan sinyal terbatas — WhatsApp sebagai kanal notifikasi utama justru lebih reliable dibanding push notification PWA murni.
- **Bahasa**: Bahasa Indonesia untuk seluruh antarmuka.

---

## 12. Rekomendasi & Catatan Tambahan

> Bagian ini berisi saran tambahan di luar apa yang eksplisit dibahas tim, untuk memperkuat proposal & kualitas build.

1. **Sederhanakan "video call CS" untuk demo kompetisi.** Video call real-time dengan CS 24/7 sulit di-build dalam 9 hari dan sulit didemokan live ke juri. Rekomendasi: untuk MVP, sediakan opsi video call tapi implementasikan sebagai **link WhatsApp Call/Video Call langsung ke nomor CS tim** (bukan sistem video call custom) — tetap capture value proposition-nya tanpa effort build infrastruktur WebRTC dari nol.
2. **Prediksi produksi harian versi MVP**: gunakan formula statis `jumlah_ayam × laying_rate_asumsi × (1 - persentase_rusak)` yang di-input peternak sendiri saat registrasi — bukan model ML kompleks. Cukup kredibel untuk demo, dan bisa diklaim sebagai "AI-assisted" karena tetap personalized per-peternak.
3. **Ambang batas suspend** perlu didefinisikan eksplisit di backend sebelum demo (contoh: score < 30 → suspend). Jangan biarkan ambigu sampai hari-H.
4. **Fallback notification**: jika Web Push API (PWA) terbukti sulit stabil dalam waktu terbatas, WhatsApp saja sudah cukup sebagai kanal utama untuk demo — push notification PWA bisa jadi "bonus polish" di hari-hari terakhir.
5. **Siapkan 2–3 akun dummy peternak dengan data realistis** (foto kandang asli/stok, histori transaksi, score bervariasi) sebelum hari presentasi — supaya smart routing & scoring terlihat "hidup", bukan data kosong.

---

**Dokumen terkait:** `schema_database.md`, `tech_stack.md`, `design_system.md`, `task_division.md`
