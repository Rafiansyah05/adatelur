# Panduan & Aturan Struktur Folder Monorepo (Next.js)

Dokumen ini adalah panduan wajib bagi seluruh _Developer_ maupun _AI Agent_ yang bekerja di dalam proyek **adatelur.com**. Proyek ini menggunakan konsep **"Monorepo Berbasis Route Groups"** pada Next.js (App Router), di mana aplikasi Konsumen dan aplikasi Peternak berada di dalam satu _codebase_ namun terisolasi satu sama lain secara visual dan tata letak (_layout_).

Jika ada penambahan fitur baru, Anda **WAJIB** membaca dan mengikuti panduan struktur ini agar tidak merusak tata letak atau menyebabkan konflik _routing_.

---

## 1. Konsep Monorepo: Route Groups `(nama-group)`

Next.js App Router menggunakan folder ber-tanda kurung kurawal, contohnya `(consumer)` dan `(peternak)`. 
- Folder dengan tanda kurung ini **TIDAK AKAN MUNCUL** pada struktur URL.
- Fungsinya hanya untuk **membungkus halaman dengan `layout.tsx` tertentu**.
- Contoh: `app/(peternak)/dashboard/page.tsx` akan diakses pada URL `localhost:3000/dashboard`, bukan `/peternak/dashboard`.

Oleh karena itu, **Anda DILARANG KERAS membuat dua rute dengan *path* (nama folder) yang sama di dalam dua *Route Group* yang berbeda.** (Misal: `(consumer)/register` dan `(peternak)/register`). Ini akan menyebabkan *Route Conflict Error*.

---

## 2. Struktur Direktori Utama

Berikut adalah hirarki pasti dari tempat Anda harus meletakkan kode:

```text
adatelur.com/
├── app/
│   ├── (consumer)/                   # -> ROUTE GROUP: Aplikasi Sisi Konsumen
│   │   ├── layout.tsx                # Layout Konsumen (Sidebar/Bottom Nav Konsumen)
│   │   ├── page.tsx                  # URL: / (Halaman Beranda Konsumen)
│   │   ├── register-consumer/        # URL: /register-consumer (Form Registrasi Konsumen)
│   │   ├── orders/                   # URL: /orders/* (Pelacakan pesanan)
│   │   └── peternak/[id]/            # URL: /peternak/[id] (Halaman profil/katalog peternak)
│   │
│   ├── (peternak)/                   # -> ROUTE GROUP: Aplikasi Sisi Peternak
│   │   ├── layout.tsx                # Layout Peternak (Sidebar/Bottom Nav Peternak)
│   │   ├── dashboard/                # URL: /dashboard (Manajemen harga, stok, & pesanan)
│   │   └── register/                 # URL: /register (Form Registrasi 3 Tahap Peternak)
│   │
│   ├── api/                          # -> BACKEND: Endpoint API (Next.js Route Handlers)
│   │   ├── auth/                     # Endpoint webhook & login handler
│   │   ├── cron/                     # Scheduler otomatis (update score, expired orders)
│   │   ├── orders/                   # Endpoint pemesanan (termasuk smart routing)
│   │   └── peternak/                 # Endpoint data peternak & delivery slot
│   │
│   ├── login/                        # URL: /login (Halaman Login Terpusat)
│   │   └── page.tsx                  # Tidak memiliki sidebar (Global Layout)
│   │
│   ├── layout.tsx                    # -> ROOT LAYOUT (PWA Provider, Meta Tags, Font)
│   └── globals.css                   # Tailwind Entrypoint
│
├── components/                       # -> REUSABLE COMPONENTS
│   ├── layout/                       # Komponen untuk struktur web (DesktopSidebar, MobileBottomNav, RoleLayoutWrapper)
│   ├── ui/                           # UI Library (Button, Card, Input) -> Wajib patuh Flat Design!
│   └── dashboard/                    # Komponen spesifik untuk manajemen peternak
│
├── lib/                              # -> UTILITAS & INTEGRASI PIHAK KETIGA
│   ├── supabase/                     # Client Supabase (browser & server-side)
│   ├── db.ts                         # Konfigurasi / Utils database 
│   └── utils.ts                      # Fungsi helper umum (mis. format harga)
│
└── document penting/                 # Kumpulan instruksi, PRD, aturan koding & database (HANYA BACA)
```

---

## 3. Aturan Main Penambahan Fitur (Rule of Thumb)

### A. Di Mana Saya Harus Membuat Halaman Baru?
Sebelum membuat halaman baru (`page.tsx`), tanyakan pada diri sendiri: **Siapa yang akan mengakses halaman ini?**
- Jika hanya **Konsumen**: Letakkan di dalam folder `app/(consumer)/nama-halaman`.
- Jika hanya **Peternak**: Letakkan di dalam folder `app/(peternak)/nama-halaman`.
- Jika halaman ini bersifat **Publik / Netral (tanpa navigasi khusus)** seperti halaman Login, Kebijakan Privasi, Lupa Password: Letakkan langsung di dalam folder `app/nama-halaman` (tanpa _route group_).

### B. Bagaimana Jika Saya Tidak Ingin Ada Sidebar di Halaman Tertentu (Misal: Registrasi)?
Jangan memindahkan _folder_ keluar dari _Route Group_-nya! Kami sudah menyiapkan mekanisme pintar bernama `RoleLayoutWrapper` di dalam masing-masing `layout.tsx`.
- Jika Anda menambahkan halaman baru yang *tidak butuh sidebar*, Anda hanya perlu menambahkan *path URL* tersebut ke dalam kondisi pengecekan `isAuthPage` di dalam `components/layout/RoleLayoutWrapper.tsx`.
- Halaman tersebut akan secara otomatis kehilangan *Sidebar* namun tetap berada secara rapi di dalam *Route Group* arsitektur.

### C. Di Mana Saya Harus Meletakkan Komponen?
- **Komponen Kecil / Tombol / Input**: Masukkan ke `components/ui/`. Ingat, tidak boleh ada shadow atau gradien (`Aturan_penulisan_code.md`).
- **Komponen Besar / Fungsional**: Masukkan ke _folder_ sesuai fiturnya, contoh: `components/orders/`, `components/dashboard/`.
- **DILARANG** menaruh komponen langsung di dalam folder `app/`. Folder `app/` hanya khusus untuk `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, dan `error.tsx`.

### D. Mengakses Database
- Selalu gunakan `createClient()` dari `@/lib/supabase/client` jika dipanggil dari _Client Component_ (`use client`).
- Gunakan `createClient()` dari `@/lib/supabase/server` jika dipanggil dari _Server Component_ atau API Route.
- Karena sistem memakai *Row Level Security (RLS)*, manipulasi tabel dari komponen sisi klien sangat bergantung pada sesi login user saat ini.

---
Dengan mengikuti arsitektur ini, monorepo kita akan selalu terorganisasi, menghindari *Route Conflict*, dan 100% responsif terhadap tampilan _Desktop_ dan _Mobile_ (PWA) tanpa usaha berlebih!
