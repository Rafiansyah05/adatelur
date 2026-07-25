# Design System — adatelur.com

**Versi:** 2.1 | **Tanggal:** 23 Juli 2026 | **Sprint:** MVP 9-hari  
**Rujukan:** `prd.md`, `tech_stack.md`, `schema_database.md`

---

## 📋 Daftar Isi
1. [Prinsip Desain Inti](#prinsip-desain-inti)
2. [Warna (Color Tokens)](#warna-color-tokens)
3. [Tipografi](#tipografi)
4. [Spacing, Radius & Shadow](#spacing-radius--shadow)
5. [Komponen UI Inti](#komponen-ui-inti)
6. [Layout Mobile & Desktop](#layout-mobile--desktop)
7. [Aksesibilitas](#aksesibilitas)
8. [Tailwind Config](#tailwind-config)
9. [Implementasi & QA](#implementasi--qa)

---

## Prinsip Desain Inti

**Adatelur adalah platform premium untuk keputusan penting konsumen & petani.**

Desain harus mencerminkan:
- ✅ **Modern & Elegan** — Inspirasi dari Gojek, Tokopedia, Bukalapak (UI/UX kelas atas)
- ✅ **Clean & Minimal** — Tidak ada dekorasi berlebih; setiap elemen punya tujuan
- ✅ **Lembut & Accessible** — Shadow halus, radius membulat, warna soft, whitespace seimbang
- ✅ **Responsif Native-like** — Di mobile terasa seperti app native; di desktop rapi & terpadu
- ✅ **Aksesibel untuk Semua** — Touch target besar (44×44px min), kontras tinggi, font minimal 14px, feedback instan

---

## Warna (Color Tokens)

### 1.1 Primary — Soft Yellow (#FFDE6B)

Kuning yang lembut, premium, mudah dikenali sebagai brand identity adatelur.

```css
--color-50:  #FFFDF5;
--color-100: #FFF9E1;
--color-200: #FFF2C2;
--color-300: #FFEA9D;
--color-400: #FFDE6B;  /* PRIMARY — Brand identity, CTA utama, highlight */
--color-500: #FACC15;  /* Hover/Active state (lebih gelap) */
--color-600: #CA8A04;
--color-700: #A16207;
--color-800: #854D0E;
--color-900: #713F12;
--color-950: #422006;
```

**Panduan Penggunaan:**
- `--color-400` (#FFDE6B) → CTA utama (tombol "Pesan", "Terima Pesanan"), badge "Tersedia", highlight section
- `--color-500` (#FACC15) → State hover/active tombol
- `--color-100` → Background soft badge atau section highlight
- `--color-600`–`700` → Teks kontras tinggi di atas background kuning

### 1.2 Success — Hijau Tokopedia (#00AA5B)

Warna yang familiar untuk pengguna Indonesia (khas Tokopedia/Gojek). Dipakai untuk status positif.

```css
--color-success: #00AA5B;
--color-success-bg: #E6F6ED;     /* Background badge hijau */
--color-success-text: #007A33;   /* Teks dalam badge hijau */
```

**Panduan Penggunaan:**
- Status "Terverifikasi", "Diterima", "Pembayaran Berhasil"
- Checkmark & indikator positif

### 1.3 Danger — Merah Soft (untuk status negatif)

```css
--color-danger: #E23D28;
--color-danger-bg: #FBE9E7;
--color-danger-text: #C1440D;
```

**Panduan Penggunaan:**
- Status "Ditolak", "Kadaluarsa", "Error"

### 1.4 Neutral & Background

```css
--color-white:       #FFFFFF;      /* Card, form, component bg */
--color-background:  #F7F9FA;      /* Halaman background utama (abu-abu sangat muda) */
--color-surface:     #FAFBFC;      /* Alternatif background section */
--color-border:      #E4E7EB;      /* Semua border (halus, minimal) */
--color-border-dark: #D9DFE5;      /* Border yg butuh lebih kontras */
--color-text-main:   #212121;      /* Teks utama (heading, body) */
--color-text-desc:   #6C727C;      /* Teks sekunder (label, caption) */
--color-text-muted:  #9DA3AF;      /* Teks paling subtle (disabled, placeholder) */
```

**Panduan Penggunaan:**
- Halaman default background: `--color-background` (#F7F9FA) → Card putih akan menonjol
- Semua teks utama: `--color-text-main` (#212121) → kontras AAA terhadap putih
- Border konsisten: `--color-border` (#E4E7EB) → halus tapi terlihat jelas
- Jangan gunakan `--color-text-muted` untuk informasi penting

### 1.5 Larangan Eksplisit

- ❌ **TIDAK ada ungu/purple** (same as v1.0)
- ❌ **TIDAK ada gradient background** pada elemen apa pun
- ✅ **SHADOW DIPERBOLEHKAN** (soft shadows untuk kedalaman, berbeda dari v1.0)
- ✅ **BORDER RADIUS lembut** — membulat elegan seperti aplikasi modern

---

## Tipografi

**Font tunggal: `Plus Jakarta Sans`** — modern, clean, cocok untuk UI premium.

Import dari Google Fonts (via `next/font/google`):
```javascript
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
});
```

### Skala Tipografi

| Token | Size | Weight | Line-height | Pemakaian |
|---|---|---|---|---|
| `text-display` | 28px | 800 | 1.2 | Hero section, banner besar |
| `text-h1` | 22px | 700 | 1.3 | Judul halaman utama |
| `text-h2` | 18px | 700 | 1.3 | Judul section/card besar |
| `text-h3` | 14px | 600 | 1.4 | Nama peternak, judul produk |
| `text-body` | 14px | 400 | 1.5 | Body text, paragraf umum |
| `text-body-medium` | 14px | 500 | 1.5 | Label form penting, caption bold |
| `text-caption` | 12px | 500 | 1.4 | Timestamp, helper text, hint |
| `text-button` | 14px | 600 | 1 | Teks di dalam tombol |

**Prinsip:**
- Minimal font-size di body text: **14px** (tidak boleh lebih kecil)
- Line-height minimal: **1.4** untuk readability (terutama penting untuk user lansia)
- Weight: hanya gunakan 400, 500, 600, 700, 800 (tidak ada di antara)

---

## Spacing, Radius & Shadow

### Spacing Scale (4px Base)

```css
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
```

**Aturan:** Konsisten pakai skala ini — tidak ada spacing random (e.g., 13px, 18px, 22px).

### Border Radius (Sudut Lembut & Elegan)

```css
--radius-sm:   8px;   /* Badge kecil, tag, input form */
--radius-md:   12px;  /* Tombol, card sedang */
--radius-lg:   16px;  /* Card utama, modal */
--radius-xl:   24px;  /* Modal besar, bottom sheet */
--radius-full: 999px; /* Pill badge, avatar circle */
```

### Soft Shadows (Kedalaman Elegan)

Shadows sekarang **diizinkan** untuk menciptakan kedalaman & hierarki visual yang lebih baik (seperti Gojek/Tokopedia).

```css
/* Subtle shadow — untuk hover/interactive elements kecil */
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.03);

/* Small shadow — untuk header sticky, tombol statik */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Medium shadow — UNTUK CARD UTAMA (paling sering dipakai) */
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 4px rgba(0, 0, 0, 0.03);

/* Large shadow — untuk modal, dropdown, bottom sheet */
--shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.08);

/* Extra large — jarang dipakai, untuk overlay/fokus visual tinggi */
--shadow-xl: 0 20px 40px rgba(0, 0, 0, 0.12);
```

**Panduan Penggunaan:**
- Semua card di halaman: `--shadow-md`
- Header sticky saat di-scroll: `--shadow-sm`
- Tombol saat dihover/ditekan: beri feedback visual (ubah warna, tidak perlu shadow ekstra)
- Modal/overlay: `--shadow-lg`
- **JANGAN** overdo shadow — maksimal 1-2 elemen shadow per halaman

---

## Komponen UI Inti

### Button (Tombol)

#### Primary Button

```css
background: var(--color-400);           /* #FFDE6B */
color: var(--color-950);                /* #422006 — kontras tinggi */
border: none;
border-radius: var(--radius-lg);        /* 16px — membulat elegan */
padding: 14px 24px;                     /* Minimal 48px height di mobile */
min-height: 48px;
font-weight: 700;
font-size: 14px;
line-height: 1;
box-shadow: var(--shadow-sm);           /* Subtle shadow */
cursor: pointer;
transition: all 0.2s ease-in-out;

&:hover {
  background: var(--color-500);         /* #FACC15 — lebih gelap */
  transform: translateY(-2px);          /* Lift effect */
  box-shadow: var(--shadow-md);         /* Shadow lebih kuat saat hover */
}

&:active {
  transform: scale(0.98);               /* Tekan-tekan feedback */
  box-shadow: var(--shadow-sm);
}

&:disabled {
  background: var(--color-100);
  color: var(--color-text-muted);
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}
```

#### Secondary Button (Outline)

```css
background: var(--color-white);
color: var(--color-text-main);
border: 1px solid var(--color-border);
border-radius: var(--radius-lg);
padding: 14px 24px;
min-height: 48px;
font-weight: 600;
font-size: 14px;
transition: all 0.2s ease-in-out;

&:hover {
  border-color: var(--color-400);
  background: var(--color-100);
  box-shadow: var(--shadow-sm);
}

&:active {
  transform: scale(0.98);
}
```

#### Success Button (Khusus Konfirmasi Positif)

```css
background: var(--color-success);
color: var(--color-white);              /* Teks putih untuk kontras lebih baik */
border: none;
border-radius: var(--radius-lg);
padding: 14px 24px;
min-height: 48px;
font-weight: 700;
font-size: 14px;
box-shadow: var(--shadow-sm);

&:hover {
  background: #008A47;                  /* Shade lebih gelap dari hijau */
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

---

### Card

Card adalah container utama untuk konten. Harus terasa elegan tapi functional.

```css
background: var(--color-white);
border: 1px solid var(--color-border); /* #E4E7EB — border halus minimal */
border-radius: var(--radius-lg);       /* 16px */
box-shadow: var(--shadow-md);          /* Kedalaman konsisten */
padding: 20px;
overflow: hidden;
transition: all 0.2s ease-in-out;

/* Jika card interactive (bisa diklik) */
&:hover {
  border-color: var(--color-border-dark);
  box-shadow: var(--shadow-lg);        /* Shadow lebih besar saat hover */
  transform: translateY(-4px);         /* Lift effect subtle */
}

/* Jika card ada state aktif/selected */
&.active {
  border-color: var(--color-400);
  box-shadow: 0 0 0 4px var(--color-100), var(--shadow-md);
}
```

---

### Badge Status

Format pill (`border-radius: --radius-full`), dengan background color & text color yang sesuai status.

| Status | Background | Text Color |
|---|---|---|
| **Tersedia** | `--color-success-bg` | `--color-success-text` |
| **Menunggu** | `--color-100` | `--color-700` |
| **Diterima** | `--color-success-bg` | `--color-success-text` |
| **Ditolak / Kadaluarsa** | `--color-danger-bg` | `--color-danger-text` |
| **Selesai** | `--color-surface` | `--color-text-main` |
| **Pending Verifikasi** | `var(--color-white)` border `var(--color-border)` | `--color-text-main` |

```css
display: inline-flex;
align-items: center;
gap: 6px;
padding: 6px 12px;
border-radius: var(--radius-full);
font-size: 12px;
font-weight: 500;
line-height: 1.4;
white-space: nowrap;
```

---

### Input Form (Gojek-style)

Input harus besar (min 48px), nyaman ditekan di mobile, dengan feedback visual jelas.

```css
/* Default state */
min-height: 48px;
background: #F4F6F8;                    /* Soft gray background seperti Gojek */
border: 1px solid transparent;
border-radius: var(--radius-md);        /* 12px */
padding: 0 16px;
font-size: 14px;
font-weight: 400;
color: var(--color-text-main);
transition: all 0.2s ease-in-out;

/* Placeholder */
&::placeholder {
  color: var(--color-text-muted);
}

/* Focus state */
&:focus {
  outline: none;
  background: var(--color-white);
  border: 2px solid var(--color-400);  /* Highlight dengan warna primary */
  box-shadow: 0 0 0 4px var(--color-100);
}

/* Error state */
&[aria-invalid="true"],
&.error {
  border-color: var(--color-danger);
  background: #FBE9E7;
}

/* Disabled state */
&:disabled {
  background: var(--color-background);
  border-color: var(--color-border);
  color: var(--color-text-muted);
  cursor: not-allowed;
}
```

---

### Score Card Peternak (Komponen Khusus)

Display skor 1–100 dalam card yang menonjol tapi tetap clean.

```
┌────────────────────────────────────────┐
│ [Avatar] Nama Peternak      ⭐ 4.8     │
│          Score: 87          [Tersedia] │
│                                        │
│ Rp 35.000/rak                          │
│ Estimasi ongkir: Rp 12.000             │
│ ─────────────────────────────────────  │
│ Total: Rp 47.000      [Pesan →]        │
└────────────────────────────────────────┘
```

**Styling:**
- Border `2px solid var(--color-400)` jika ini adalah **rekomendasi top pick** dari smart routing (highlight elegan, bukan shadow)
- Border normal `1px solid var(--color-border)` untuk kartu lainnya
- Box-shadow: `--shadow-md` untuk semua score card

---

## Layout Mobile & Desktop

### 5.1 Mobile Layout (Prioritas Utama — App-like Experience)

**Viewport:** 360px – 767px (kebanyakan pengguna peternak pakai smartphone)

**Structure:**
```
┌──────────────────────────────┐
│  ← Pilih Peternak (Header)   │  ← Sticky, background white, shadow-sm saat scroll
├──────────────────────────────┤
│                              │
│   [Score Card]               │
│   [Score Card]               │  ← Scrollable content, bg --color-background
│   [Score Card]               │
│                              │
├──────────────────────────────┤
│  🏠      📦      👤          │  ← Bottom nav, fixed, 64px height, background white
│ Beranda Pesanan  Akun       │
└──────────────────────────────┘
```

**Bottom Navigation Bar (Fixed):**
- **Tinggi:** 64px (termasuk safe area iOS)
- **Background:** `var(--color-white)`
- **Border:** `1px solid var(--color-border)` di atas (bukan shadow)
- **Items:** 3 item utama
  - Konsumen: `Beranda (🏠)` — `Pesanan Saya (📦)` — `Akun (👤)`
  - Peternak: `Dashboard (📊)` — `Pesanan Masuk (📬)` — `Akun (👤)`
- **Icon aktif:** Fill dengan `var(--color-400)`, label text 10px weight 600
- **Icon tidak aktif:** `var(--color-text-muted)`
- **Padding konten:** Tambahkan `padding-bottom: 80px` di halaman utama agar konten tidak tertutup bottom nav

**Header Sticky:**
- **Tinggi:** 56px
- **Background:** `var(--color-white)`
- **Border:** `1px solid var(--color-border)` (shadow-sm muncul saat scroll)
- **Padding:** `--space-4` horizontal, centered vertically
- **Title:** `text-h2` weight 700
- **Back button:** Icon 24px, button transparent, minimal padding 8px

### 5.2 Desktop Layout (768px+)

Desktop **TIDAK menggunakan bottom navigation.** Gunakan **Sidebar kiri fixed** atau **Top navbar** tergantung desain final.

**Option A: Sidebar Left (Recommended untuk admin-like interface)**
```
┌──────────┬────────────────────────────────────────┐
│  LOGO    │ Pilih Peternak                         │
│ (80px)   │                                        │
│          │ [Score Card]  [Score Card]             │
│ 🏠 Beranda │ [Score Card]  [Score Card]             │
│ 📦 Pesanan │                                        │
│ 👤 Akun    │                                        │
│          │                                        │
│          │                                        │
└──────────┴────────────────────────────────────────┘
```

**Option B: Top Navbar (Recommended untuk consumer-facing)**
```
┌────────────────────────────────────────────────────┐
│ LOGO   Pilih Peternak              🏠 📦 👤 ⋯     │
└────────────────────────────────────────────────────┘
│                                                    │
│  [Score Card]  [Score Card]                       │
│  [Score Card]  [Score Card]                       │
│                                                    │
```

**Container Max-width:** `1200px` centered, tidak full-width

**Sidebar Styling (jika pakai Option A):**
- Width: `240px` fixed
- Background: `var(--color-white)`
- Border-right: `1px solid var(--color-border)`
- Menu item aktif: background `var(--color-100)`, text `var(--color-700)`
- Padding item: `--space-3` vertical, `--space-4` horizontal

---

## Aksesibilitas

Sebagian pengguna peternak kemungkinan **lansia & kurang familiar aplikasi digital** (disebutkan di PRD). Design harus accessible & nyaman.

1. **Touch Target:** Minimum **44×44px** untuk semua interaktif elemen (tombol, link, card yang clickable)
   - Tombol: min-height 48px, padding 14px 24px
   - Bottom nav item: 64px height, icon + label centered

2. **Kontras Teks (WCAG AAA):**
   - `--color-text-main` (#212121) di atas putih: ✅ **16.5:1 ratio** (AAA)
   - `--color-text-desc` (#6C727C) di atas putih: ✅ **8:1 ratio** (AA)
   - `--color-950` (#422006) di atas `--color-400`: ✅ tinggi
   - Hanya gunakan `--color-text-muted` untuk teks non-essential (placeholder, disabled)

3. **Font Size:**
   - Body text: minimum **14px** di seluruh UI
   - Caption: 12px maksimal, hanya untuk metadata/timestamp
   - Heading: 18px ke atas untuk jelas terlihat

4. **Icon + Label:**
   - **SELALU** sertai ikon dengan teks label (terutama di bottom nav, tombol aksi penting)
   - Jangan andalkan ikon saja — pengguna lansia kemungkinan kurang familiar dengan ikon universal

5. **Feedback Instan:**
   - Setiap aksi (tap tombol, input field) harus ada visual feedback langsung
   - Color change, shadow change, atau subtle animation (tidak lebih dari 200ms)
   - Penting untuk flow approval 1–5 menit yang butuh kepastian aksi tercatat

6. **Whitespace & Readability:**
   - Line-height minimal 1.4 untuk semua teks
   - Padding/margin konsisten dari spacing scale
   - Hindari text berdempet — gunakan whitespace untuk "respiro" visual

---

## Tailwind Config

```javascript
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#FFFDF5",
          100: "#FFF9E1",
          200: "#FFF2C2",
          300: "#FFEA9D",
          400: "#FFDE6B",  // PRIMARY
          500: "#FACC15",  // HOVER
          600: "#CA8A04",
          700: "#A16207",
          800: "#854D0E",
          900: "#713F12",
          950: "#422006",
        },
        success: {
          DEFAULT: "#00AA5B",
          light: "#E6F6ED",
          text: "#007A33",
        },
        danger: {
          DEFAULT: "#E23D28",
          light: "#FBE9E7",
          text: "#C1440D",
        },
        bg: {
          base: "#F7F9FA",      // Page background
          surface: "#FAFBFC",
          card: "#FFFFFF",
        },
        border: {
          light: "#E4E7EB",
          DEFAULT: "#E4E7EB",
          dark: "#D9DFE5",
        },
        text: {
          main: "#212121",
          desc: "#6C727C",
          muted: "#9DA3AF",
        },
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta-sans)", "sans-serif"],
      },
      fontSize: {
        display: ["28px", { lineHeight: "1.2", fontWeight: "800" }],
        h1: ["22px", { lineHeight: "1.3", fontWeight: "700" }],
        h2: ["18px", { lineHeight: "1.3", fontWeight: "700" }],
        h3: ["14px", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "1.4", fontWeight: "500" }],
        button: ["14px", { lineHeight: "1", fontWeight: "600" }],
      },
      spacing: {
        "space-1": "4px",
        "space-2": "8px",
        "space-3": "12px",
        "space-4": "16px",
        "space-5": "20px",
        "space-6": "24px",
        "space-8": "32px",
        "space-10": "40px",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        full: "999px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        md: "0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 4px rgba(0, 0, 0, 0.03)",
        lg: "0 10px 25px rgba(0, 0, 0, 0.08)",
        xl: "0 20px 40px rgba(0, 0, 0, 0.12)",
        none: "none",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

**Catatan Build:**
- Install: `npm install -D tailwindcss postcss autoprefixer`
- Setup `tailwind.config.ts` & `postcss.config.js` di root project
- **QA Check sebelum merge:** Tidak boleh ada custom box-shadow di luar token yang terdaftar, semua spacing harus dari skala 4px

---

## Implementasi & QA

### Phase 1: Base Components (Hari 1–2)

**Buat folder `src/components/ui/` dengan base components:**
- `Button.tsx` (Primary, Secondary, Success variants)
- `Card.tsx`
- `Badge.tsx`
- `Input.tsx`
- `Label.tsx`
- `Avatar.tsx`
- `ScoreCard.tsx` (komponen khusus peternak)

**File `src/styles/tokens.css` (global CSS variables):**
```css
:root {
  /* Colors */
  --color-primary-400: #FFDE6B;
  --color-primary-500: #FACC15;
  /* ... semua token di atas ... */
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 4px rgba(0, 0, 0, 0.03);
  /* ... */
}
```

### Phase 2: Design System Page (Hari 2–3)

**Buat internal page `/dev/style-guide` (jangan deploy ke production akhir):**
- Menampilkan semua warna, token, komponen
- Color swatches interaktif
- Typography scale
- Button variants
- Card samples
- Badge status
- Input states

Gunakan untuk QA visual cepat & referensi team — tidak perlu buka banyak file.

### Phase 3: Page Development (Hari 3–9)

**Konsumen (Rian) & Peternak (Alvin):**
- Import base components dari `src/components/ui/`
- Gunakan class Tailwind dari extended config
- **QA Checklist per halaman:**
  - ✅ Warna hanya dari token (tidak hardcode #hex)
  - ✅ Spacing dari `--space-*` atau Tailwind scale
  - ✅ Box-shadow hanya dari token (`shadow-sm`, `shadow-md`, dll)
  - ✅ Font-size dari scale (`text-body`, `text-h2`, dll)
  - ✅ Touch target min 44×44px
  - ✅ Bottom nav (mobile) atau sidebar (desktop) konsisten
  - ✅ Tidak ada warna ungu di mana pun
  - ✅ Tidak ada gradient background

### Phase 4: Final QA & Polish (Hari 8–9)

**Cross-device testing:**
- Mobile: 375px, 390px, 430px (iPhone 12–15, Android common)
- Tablet: 768px (iPad)
- Desktop: 1024px, 1440px

**Aksesibilitas:**
- Lighthouse Accessibility score ≥90
- Color contrast pakai WebAIM contrast checker
- Keyboard navigation (Tab key, Enter key)
- Screen reader test (NVDA/JAWS untuk Windows, VoiceOver untuk Mac)

**Performance:**
- Lighthouse Performance ≥85
- Font loading optimal (Plus Jakarta Sans hanya load weights 400, 500, 600, 700, 800)
- Image optimization (avatar, product photo)

---

## Kesimpulan

Desain system ini menggabungkan **elegantsi modern** (Gojek/Tokopedia style) dengan **aksesibilitas tinggi** untuk pengguna Indonesia yang beragam. Setiap token, komponen, dan guideline dirancang untuk membuat adatelur.com terasa **premium, professional, dan mudah digunakan**.

**Konsistensi adalah kunci.** Dengan base components yang solid & design token yang ketat, hasil akhir akan terasa terpadu profesional — jauh dari kesan "generic AI slop". 🎯

---

**Dokumen Terkait:**
- `prd.md` — Visi produk & user flows
- `tech_stack.md` — Tech stack (Next.js 14, Tailwind, Supabase)
- `schema_database.md` — Database schema
- `task_division.md` — Pembagian tugas team
- `coding_guidelines.md` — Convention & best practices