# Design System — adatelur.com

Versi: 1.0 | Tanggal: 21 Juli 2026
Rujukan: `prd.md`, `tech_stack.md`

**Prinsip inti:** Flat, jelas, tidak terlihat generic/"AI slop". **Tidak ada shadow. Tidak ada gradasi warna. Tidak ada ungu di mana pun.** Semua kontras dibangun dari warna solid, border, dan whitespace — bukan efek visual dekoratif.

---

## 1. Warna (Color Tokens)

### 1.1 Primary — Kuning (`#FFDC36`)

```css
--color-50:  #FFFBE6;
--color-100: #FFF3B8;
--color-200: #FFEB8A;
--color-300: #FFE45C;
--color-400: #FFDC36;  /* PRIMARY — dipakai untuk CTA utama, highlight, brand elements */
--color-500: #FFD500;
--color-600: #D1AE00;
--color-700: #A38800;
--color-800: #756200;
--color-900: #473C00;
--color-950: #1A1500;
```

**Aturan pakai:**
- `--color-400` (#FFDC36) = warna brand utama. Dipakai di logo, tombol CTA primer, elemen yang butuh perhatian tinggi (badge "Tersedia", tombol "Pesan").
- `--color-500` = state hover/active dari tombol primer (lebih gelap sedikit, bukan gradasi — solid swap warna).
- `--color-600`–`700` = teks di atas background kuning terang (kontras cukup untuk aksesibilitas), atau border aktif.
- `--color-50`–`100` = background section, badge subtle, hover state ringan pada card.
- `--color-800`–`950` = **dipakai sangat terbatas**, hanya untuk teks kecil di atas background kuning terang jika butuh kontras ekstra tinggi. **Jangan** dipakai sebagai warna dominan (akan terasa gelap & bukan tone brand).

### 1.2 Success (`#00FF6A`)

```css
--color-success: #00FF6A;
--color-success-bg: #E6FFF0;   /* turunan tint ringan untuk background badge, dihitung manual dari base */
--color-success-text: #007A33; /* turunan shade gelap untuk teks di atas background terang, dihitung manual */
```

Dipakai untuk: status `Diterima`, `Terverifikasi`, `Pembayaran Berhasil`, checkmark konfirmasi. **Jangan** dipakai sebagai warna dekoratif umum — khusus untuk makna "berhasil/positif".

### 1.3 Netral & Background

```css
--color-white:       #FFFFFF;  /* background utama card, form, halaman */
--color-cream:       #FAF6F0;  /* background alternatif (section pembeda, mis. page background di belakang card putih) */
--color-border:      #EBEBEB;  /* seluruh border: card, input, divider */
--color-text-main:   #001224;  /* warna teks utama (heading, body) — bukan hitam pekat #000 */
--color-text-desc:   #CFCFCF; /* teks deskriptif/secondary/placeholder */
--color-text-black:  #000000; /* dipakai sangat spesifik, mis. teks di atas background kuning terang jika #001224 kurang kontras */
```

**Aturan pakai:**
- Background halaman default: `#FFFFFF`. Gunakan `#FAF6F0` untuk membedakan section tanpa perlu border/shadow (mis. background di belakang bottom nav, atau section highlight pada landing page).
- `#001224` adalah warna teks utama di **hampir seluruh UI** (bukan hitam murni — ini keputusan desain sengaja supaya tidak terasa terlalu keras/kontras generic).
- `#CFCFCF` untuk teks sekunder: caption, timestamp, placeholder input, label kecil di bawah heading.
- `#EBEBEB` untuk **semua border** — card border, input border, divider antar section. Konsisten di seluruh sistem, jangan improvisasi warna border lain.

### 1.4 Larangan Eksplisit

- ❌ **Tidak ada `box-shadow`** di komponen apa pun (card, button, modal, dropdown). Pemisahan visual antar elemen dilakukan lewat **border `1px solid var(--color-border)`** dan **whitespace**, bukan shadow.
- ❌ **Tidak ada `linear-gradient` / `radial-gradient`** pada background, tombol, atau elemen apa pun.
- ❌ **Tidak ada warna ungu** (`purple`, `violet`, `indigo`) dalam bentuk apa pun — termasuk sebagai warna aksen sekunder atau warna error/danger. Jika butuh warna "danger/error" tambahan (untuk kasus seperti "Ditolak"/"Kadaluarsa"), gunakan warna merah solid netral (contoh: `#E23D28`) — bukan bagian dari token resmi di atas, tapi diizinkan sebagai exception khusus status negatif karena tidak ada token merah yang didefinisikan user.

---

## 2. Tipografi

**Font tunggal untuk seluruh sistem: `Plus Jakarta Sans`.** Tidak ada font kedua (termasuk untuk heading vs body) — variasi hierarki dicapai lewat `font-weight` dan `font-size`, bukan ganti typeface.

```css
/* next/font/google */
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
});
```

```css
--font-family-base: 'Plus Jakarta Sans', sans-serif;
```

### 2.1 Skala Tipografi

| Token | Size | Weight | Line-height | Pemakaian |
|---|---|---|---|---|
| `text-display` | 32px | 800 | 1.2 | Hero landing page |
| `text-h1` | 24px | 700 | 1.3 | Judul halaman (mis. "Pilih Peternak") |
| `text-h2` | 20px | 700 | 1.3 | Judul section/card besar |
| `text-h3` | 16px | 600 | 1.4 | Sub-judul, nama peternak di card |
| `text-body` | 14px | 400 | 1.5 | Teks paragraf umum |
| `text-body-medium` | 14px | 500 | 1.5 | Label form, teks penting dalam body |
| `text-caption` | 12px | 400 | 1.4 | Timestamp, keterangan kecil, helper text |
| `text-button` | 14px | 600 | 1 | Teks di dalam tombol |

---

## 3. Spacing & Radius

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;

--radius-sm: 8px;    /* input, badge kecil */
--radius-md: 12px;   /* card, tombol */
--radius-lg: 16px;   /* modal, bottom sheet */
--radius-full: 999px; /* pill/badge status, avatar */
```

Konsisten pakai skala 4px/8px increments — tidak ada nilai spacing acak di luar daftar ini.

---

## 4. Komponen Inti

### 4.1 Tombol (Button)

**Primary Button**
```css
background: var(--color-400);      /* #FFDC36 */
color: var(--color-950);            /* #1A1500 — kontras tinggi di atas kuning */
border: none;
border-radius: var(--radius-md);
padding: 12px 20px;
font: var(--text-button);
/* NO shadow, NO gradient */

&:hover { background: var(--color-500); }  /* solid swap, bukan gradasi/opacity trick */
&:active { background: var(--color-600); }
&:disabled { background: var(--color-100); color: var(--color-text-desc); }
```

**Secondary Button (Outline)**
```css
background: var(--color-white);
color: var(--color-text-main);       /* #001224 */
border: 1px solid var(--color-border); /* #EBEBEB */
border-radius: var(--radius-md);
padding: 12px 20px;

&:hover { border-color: var(--color-400); }
```

**Success Button** (khusus konfirmasi, mis. "Terima Pesanan")
```css
background: var(--color-success);    /* #00FF6A */
color: var(--color-950);
```

### 4.2 Card (Listing Peternak, Order Card, dll)

```css
background: var(--color-white);
border: 1px solid var(--color-border);  /* #EBEBEB — satu-satunya pemisah visual, TANPA shadow */
border-radius: var(--radius-md);
padding: var(--space-4);
```

Card **tidak boleh** menambahkan `box-shadow` sama sekali, termasuk pada state hover. Untuk indikasi interaktif (card bisa diklik), gunakan **perubahan border-color** ke `--color-400` saat hover, bukan elevation/shadow.

### 4.3 Badge Status

Format pill (`border-radius: var(--radius-full)`), background solid tint, teks solid shade — tanpa gradasi.

| Status | Background | Teks |
|---|---|---|
| `Tersedia` | `--color-success-bg` | `--color-success-text` |
| `Menunggu` | `--color-100` | `--color-700` |
| `Diterima` | `--color-success-bg` | `--color-success-text` |
| `Ditolak / Kadaluarsa` | `#FBE9E7` (tint merah, exception) | `#E23D28` |
| `Selesai` | `--color-cream` | `--color-text-main` |

### 4.4 Input Form

```css
background: var(--color-white);
border: 1px solid var(--color-border);
border-radius: var(--radius-sm);
padding: 10px 14px;
color: var(--color-text-main);
font: var(--text-body);

&::placeholder { color: var(--color-text-desc); }
&:focus { border-color: var(--color-400); outline: none; }
```

### 4.5 Score Card Peternak (Komponen Khusus)

Menampilkan skor 1–100 (PRD §7). Karena ini elemen penting untuk keputusan konsumen, harus menonjol tapi tetap flat:

```
┌─────────────────────────────┐
│  [Avatar]  Nama Peternak     │
│            ⭐ 4.8  |  Score 87│  ← Score dalam badge kuning solid (--color-400 bg, --color-950 text)
│                               │
│  Rp 35.000/rak                │
│  Estimasi ongkir: Rp 12.000   │
│  ─────────────────────────    │
│  Total: Rp 47.000  [Pesan →] │
└─────────────────────────────┘
```

Border `1px solid var(--color-border)`, tanpa shadow. Jika ini adalah rekomendasi #1 (top pick dari smart routing), tambahkan **border kuning** (`--color-400`, 2px) sebagai satu-satunya bentuk "highlight" — bukan shadow atau glow.

---

## 5. Layouting — Mobile vs Desktop

### 5.1 Mobile (Prioritas Utama — layout ala aplikasi native)

- **Bottom Navigation Bar** tetap (fixed), tinggi 64px, background `--color-white`, border-top `1px solid var(--color-border)` (bukan shadow untuk memisahkan dari konten).
- Struktur bottom nav:
  - **Konsumen:** Beranda (form order) — Pesanan Saya — Akun
  - **Peternak:** Beranda (listing/dashboard) — Pesanan Masuk — Akun
- Icon aktif menggunakan warna `--color-400` (fill) dengan label teks di bawahnya (`text-caption`, weight 600). Icon tidak aktif: `--color-text-desc`.
- Header halaman (top bar) minimal, sticky, hanya berisi judul halaman + tombol back jika perlu — hindari elemen dekoratif berlebih.
- Konten utama scroll di antara header & bottom nav, dengan `padding-bottom` cukup supaya tidak tertutup bottom nav.

```
┌─────────────────────────┐
│  ← Pilih Peternak        │  ← header sticky
├─────────────────────────┤
│                          │
│   [Score Card]           │
│   [Score Card]           │  ← scrollable content
│   [Score Card]           │
│                          │
├─────────────────────────┤
│  🏠      📦      👤      │  ← bottom nav, fixed
│ Beranda Pesanan  Akun   │
└─────────────────────────┘
```

### 5.2 Desktop

Bottom nav **tidak dipakai di desktop** — digantikan **sidebar kiri fixed** (lebar ~240px) dengan menu yang sama (Beranda, Pesanan, Akun), logo di atas sidebar. Konten utama memakai **max-width container** (misal 1040px, centered) supaya tidak melebar penuh di layar besar — form order & card listing ditampilkan dalam grid 2–3 kolom (bukan 1 kolom penuh seperti mobile).

```
┌────────┬──────────────────────────────────┐
│  LOGO  │   Pilih Peternak                  │
│        │                                    │
│ 🏠 Beranda │  [Score Card] [Score Card]     │
│ 📦 Pesanan │  [Score Card] [Score Card]     │
│ 👤 Akun    │                                │
│        │                                    │
└────────┴──────────────────────────────────┘
```

- Sidebar background: `--color-white`, border-right `1px solid var(--color-border)`.
- Item menu aktif: background `--color-50` (tint kuning sangat terang), teks & icon `--color-700`.

### 5.3 Breakpoint

```css
--breakpoint-mobile: 0–767px   (bottom nav)
--breakpoint-desktop: 768px+   (sidebar)
```

---

## 6. Prinsip Aksesibilitas & Kenyamanan Pengguna

Mengingat sebagian pengguna peternak kemungkinan **lansia dan/atau kurang familiar dengan aplikasi digital** (disebutkan eksplisit di PRD — alasan kenapa ada opsi video call CS):

1. **Touch target minimum 44×44px** untuk semua tombol/elemen interaktif — jangan buat tombol kecil demi estetika.
2. **Kontras teks wajib tinggi**: `--color-text-main` (#001224) di atas putih sudah AAA-compliant. Hindari memakai `--color-text-desc` (#CFCFCF) untuk teks yang butuh dibaca jelas (informasi penting) — khusus untuk teks sekunder yang memang boleh kurang menonjol.
3. **Ukuran font dasar minimal 14px** di seluruh body text — jangan turunkan ke 12px kecuali untuk caption/metadata yang memang bukan informasi utama.
4. **Ikon selalu disertai label teks** (terutama di bottom nav & tombol aksi penting seperti Terima/Tolak pesanan) — jangan mengandalkan ikon saja tanpa penjelasan teks, karena target pengguna peternak.
5. **Feedback visual instan** untuk setiap aksi (tap tombol → langsung ada perubahan warna/state), penting khusus untuk flow approval 1–5 menit yang butuh kepastian aksi berhasil tercatat.

---

## 7. Contoh Implementasi Tailwind Config

```js
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFFBE6',
          100: '#FFF3B8',
          200: '#FFEB8A',
          300: '#FFE45C',
          400: '#FFDC36',
          500: '#FFD500',
          600: '#D1AE00',
          700: '#A38800',
          800: '#756200',
          900: '#473C00',
          950: '#1A1500',
        },
        success: {
          DEFAULT: '#00FF6A',
          bg: '#E6FFF0',
          text: '#007A33',
        },
        cream: '#FAF6F0',
        border: '#EBEBEB',
        text: {
          main: '#001224',
          desc: '#CFCFCF',
        },
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta-sans)', 'sans-serif'],
      },
      boxShadow: {
        none: 'none', // eksplisit override — pastikan tidak ada default shadow Tailwind yang lolos
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
      },
    },
  },
};
```

> **Catatan build:** Tambahkan aturan lint/review manual sebelum merge PR: **cek tidak ada class `shadow-*` Tailwind default yang terpakai**, dan **tidak ada `bg-gradient-*`** di seluruh komponen. Ini kecil tapi penting untuk konsistensi keseluruhan "flat design" yang jadi identitas visual adatelur.com.

---

## 8. Rekomendasi Tambahan

1. **Buat 1 file `components/ui/` berisi base component** (Button, Card, Badge, Input) di **Hari 1** sebelum siapa pun mulai membangun halaman — supaya seluruh tim (Rian & Alvin, yang masing-masing pegang sisi konsumen & peternak) pakai komponen yang sama persis, bukan reinvent styling masing-masing.
2. **Buat 1 halaman "Style Guide" internal** (`/dev/style-guide`, tidak perlu di-deploy ke production akhir) yang menampilkan seluruh token warna, tipografi, dan komponen dalam satu tempat — mempercepat QA visual di Hari 9 tanpa harus cek satu-satu ke tiap halaman.
3. Karena warna primer (#FFDC36) sangat terang, **selalu uji kontras teks di atasnya** — gunakan `--color-950` atau `--color-900` untuk teks di atas background kuning, jangan pernah teks putih di atas kuning (kontras akan gagal).
4. Untuk ikon, gunakan **satu library ikon konsisten** (rekomendasi: `lucide-react`, ringan & sudah lazim dipakai bareng Next.js + Tailwind) — hindari mix beberapa icon set berbeda gaya yang akan terlihat tidak seragam.

---

**Dokumen terkait:** `prd.md`, `tech_stack.md`, `schema_database.md`, `task_division.md`
