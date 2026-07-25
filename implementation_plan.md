# Rombak Ulang Sistem Registrasi & OTP

Sistem registrasi bawaan Supabase (di mana `signUp` otomatis membuat _user_ di `auth.users` dan mengirimkan OTP internal) tidak cocok dengan kebutuhan kita karena:
1. Menghasilkan _user_ menggantung di `auth.users` jika mereka tidak menyelesaikan OTP, sehingga tidak sinkron dengan tabel `profiles`.
2. OTP internal Supabase tidak dapat dilihat atau dikelola di tabel kustom (disembunyikan di skema `auth`).

Oleh karena itu, kita akan merombak total dengan membuat **Sistem OTP Kustom**.

## User Review Required

> [!WARNING]  
> **Perubahan Skema Database:** Karena kita menggunakan mekanisme OTP kustom, Anda perlu menjalankan kode SQL berikut di SQL Editor Supabase Anda untuk membuat tabel OTP. Tidak ada akses RLS publik untuk tabel ini, semua dikelola aman dari _backend_ (API).

```sql
CREATE TABLE public.otps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  otp_code text NOT NULL,
  purpose text NOT NULL DEFAULT 'signup',
  expires_at timestamp with time zone NOT NULL,
  is_used boolean DEFAULT false,
  metadata jsonb, -- Untuk menyimpan data registrasi (password, nama, hp, role) sementara
  created_at timestamp with time zone DEFAULT now()
);

-- Amankan tabel ini agar hanya bisa diakses oleh backend (Service Role)
ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;
```

> [!IMPORTANT]  
> **Pengiriman Email:** Karena kita membuat OTP kustom, kita perlu mengirimkan email sendiri. Saya akan menyiapkan fungsi pengiriman email di _backend_. Namun, untuk sementara, jika SMTP/Resend belum Anda konfigurasi, Anda tetap bisa melihat kode OTP yang dihasilkan dengan membuka tabel `otps` di Supabase Dashboard untuk keperluan testing!

## Proposed Changes

### Komponen Backend (API)

#### [NEW] `/app/api/auth/send-otp/route.ts`
- Menerima data registrasi dari _form_ (email, password, nama, hp, dll).
- Mengecek apakah email sudah terdaftar di `profiles`.
- Membuat 6-digit angka acak.
- Menyimpannya ke tabel `otps` beserta data registrasi di kolom `metadata`.
- (Opsional) Mengirimkan email berisi OTP ke pendaftar.

#### [NEW] `/app/api/auth/verify-otp/route.ts`
- Menerima email dan kode OTP dari halaman verifikasi.
- Mengecek tabel `otps` apakah valid, cocok, dan belum kedaluwarsa.
- Jika valid:
  1. Update `is_used = true`.
  2. Gunakan `adminClient.auth.admin.createUser()` untuk membuat _user_ resmi di `auth.users` dengan status `email_confirm: true`.
  3. Masukkan data profil ke tabel `profiles` (dan `peternak_details` jika peternak).
  4. Mengembalikan status sukses ke klien.

#### [DELETE] `/app/api/auth/complete-profile/route.ts`
- API ini tidak lagi dibutuhkan karena proses pembuatan profil akan disatukan saat OTP berhasil diverifikasi (`verify-otp/route.ts`).

#### [DELETE] `/app/api/auth/complete-peternak/route.ts`
- API ini juga akan disatukan ke dalam alur verifikasi OTP baru.

### Komponen Frontend

#### [MODIFY] `app/(consumer)/register-consumer/page.tsx`
- Mengganti `supabase.auth.signUp()` dengan melakukan `fetch` ke `/api/auth/send-otp`.

#### [MODIFY] `app/(consumer)/register-consumer/verify/page.tsx`
- Mengganti `supabase.auth.verifyOtp()` dengan melakukan `fetch` ke `/api/auth/verify-otp`.
- Setelah sukses, klien melakukan _login_ manual (`signInWithPassword`) lalu diarahkan ke beranda.

#### [MODIFY] `app/(peternak)/register/page.tsx`
- Tahap 1 (Email & Password) akan melakukan `fetch` ke `/api/auth/send-otp`.
- Tahap 2 (Verifikasi) akan melakukan `fetch` ke `/api/auth/verify-otp`.
- Tahap selanjutnya (Detail Peternakan & Foto) akan langsung meng-update `peternak_details` (akan disesuaikan).

## Verification Plan

### Manual Verification
1. Jalankan registrasi konsumen.
2. Cek tabel `otps` di Supabase, pastikan kode OTP masuk.
3. Masukkan kode tersebut.
4. Cek tabel `auth.users` dan `profiles`, pastikan _user_ baru terbuat secara bersamaan dan sinkron.
5. Coba _login_ ulang menggunakan email dan password yang baru dibuat.
6. Pendaftaran Google (_OAuth_) tetap tidak terganggu.
