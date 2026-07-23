# Design System — adatelur.com

Versi: 2.0 | Tanggal: 23 Juli 2026
Rujukan: `prd.md`, `tech_stack.md`

**Prinsip inti:** Modern, Elegan, Clean, dan Lembut. Mengambil inspirasi dari UI/UX aplikasi kelas atas seperti **Gojek** dan **Tokopedia**. Menggunakan *soft shadow*, sudut melengkung yang mulus (*rounded*), dan warna-warna pastel/soft yang memanjakan mata. Antarmuka harus terasa lapang dengan *whitespace* yang seimbang, dan 100% responsif (terasa seperti aplikasi *native* di *mobile*).

---

## 1. Warna (Color Tokens)

Kami beralih ke palet yang lebih lembut dan modern. Kuning primer sekarang lebih ramah, dan warna netral difokuskan pada abu-abu yang bersih.

### 1.1 Primary — Soft Yellow

```css
--color-50:  #FFFDF5;
--color-100: #FFF9E1;
--color-200: #FFF2C2;
--color-300: #FFEA9D;
--color-400: #FFDE6B; /* PRIMARY — Kuning cerah yang lembut, mirip aksen premium */
--color-500: #FACC15; /* HOVER STATE */
--color-600: #CA8A04;
--color-700: #A16207;
--color-800: #854D0E;
--color-900: #713F12;
--color-950: #422006;
```

### 1.2 Success — Gojek Green / Tokopedia Green

```css
--color-success: #00AA5B;       /* Hijau Tokopedia/Gojek yang khas */
--color-success-bg: #E6F6ED;    /* Background badge hijau sukses */
--color-success-text: #007A33;  /* Teks di dalam badge hijau */
```

### 1.3 Netral & Background

```css
--color-white:       #FFFFFF;  /* Card, form, bottom nav */
--color-background:  #F7F9FA;  /* Background utama halaman (Abu-abu sangat muda/soft) */
--color-border:      #E4E7EB;  /* Border yang sangat halus */
--color-text-main:   #212121;  /* Teks utama (Abu-abu kehitaman, lebih soft dari hitam murni) */
--color-text-desc:   #6C727C;  /* Teks sekunder (Label form, teks kecil) */
```

---

## 2. Tipografi

**Font tunggal: `Plus Jakarta Sans`.** Sangat cocok untuk UI modern yang bersih.

### Skala Tipografi
| Token | Size | Weight | Line-height | Pemakaian |
|---|---|---|---|---|
| `text-display` | 28px | 800 | 1.2 | Hero / Banner |
| `text-h1` | 22px | 700 | 1.3 | Judul halaman besar |
| `text-h2` | 18px | 700 | 1.3 | Judul section/card |
| `text-h3` | 14px | 600 | 1.4 | Judul produk/peternak |
| `text-body` | 14px | 400 | 1.5 | Teks paragraf umum |
| `text-caption` | 12px | 500 | 1.4 | Label status, hint text |

---

## 3. Spacing, Radius, & Shadow (PENTING!)

**Shadows (Efek Kedalaman):**
Untuk mencapai tampilan seperti Gojek/Tokopedia, kita SEKARANG menggunakan **Soft Shadows** untuk memisahkan card dari background halaman.

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* Header, tombol statis */
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 4px rgba(0, 0, 0, 0.03); /* Card utama */
--shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.08); /* Modal, Dropdown, Bottom Sheet */
```

**Border Radius (Sudut Lembut):**
Aplikasi modern memiliki radius yang cukup membulat.
```css
--radius-sm: 8px;    /* Badge, tag */
--radius-md: 12px;   /* Input form, tombol kecil */
--radius-lg: 16px;   /* Card, Button besar */
--radius-xl: 24px;   /* Modal, Bottom Sheet (sudut atas) */
--radius-full: 999px;
```

---

## 4. Komponen Inti (UI Modern)

### 4.1 Tombol (Button)
Tombol harus berukuran proporsional (min height 48px untuk mobile) dan membulat elegan.
```css
/* Primary Button */
background: var(--color-400);
color: var(--color-950);
border-radius: var(--radius-lg);
padding: 14px 24px;
font-weight: 700;
box-shadow: var(--shadow-sm);
transition: all 0.2s ease-in-out;

/* Hover/Active */
transform: scale(0.98);
```

### 4.2 Card (Modern Layout)
Card diletakkan di atas background abu-abu (`--color-background`). Card harus putih solid tanpa border tebal, cukup gunakan `shadow-md`.
```css
background: var(--color-white);
border-radius: var(--radius-lg);
box-shadow: var(--shadow-md);
border: 1px solid rgba(0,0,0,0.03); /* Border super tipis nyaris tak terlihat */
padding: 20px;
```

### 4.3 Input Form (Gojek Style)
Field input tidak boleh terlalu kurus. Harus *chunky* dan nyaman ditekan di HP.
```css
min-height: 48px;
background: #F4F6F8; /* Sedikit abu-abu seperti Gojek */
border: 1px solid transparent; /* Hanya muncul border saat focus */
border-radius: var(--radius-md);
padding: 0 16px;
color: var(--color-text-main);

/* Saat focus */
background: var(--color-white);
border-color: var(--color-success); /* Aksen hijau sukses/kuning saat aktif */
```

---

## 5. Layout Mobile & Desktop

### 5.1 Mobile (App-like Experience)
- **Background Utama:** Gunakan `--color-background` agar Card putih lebih *pop* (timbul).
- **Header:** Sticky top, putih bersih, ada `shadow-sm` tipis saat di-scroll.
- **Bottom Navigation:** Ketinggian 64px, putih solid, box-shadow atas tipis (`0 -2px 10px rgba(0,0,0,0.05)`). Ikon aktif diberi indikator titik atau fill warna hijau/kuning primer.

### 5.2 Desktop (Lebar Maksimal Terkontrol)
- Jangan merentangkan desain ke seluruh layar (Full-width). Gunakan container `max-w-[1200px]`.
- Susun item di dalam **Grid CSS**.
- Terapkan Sidebar kiri atau Top Navbar yang solid layaknya Tokopedia.

---

Dengan *Design System* ini, AI Agent dan Developer akan memproduksi antarmuka yang setara dengan startup teknologi terkemuka, menjauhkan kesan "Website kaku buatan AI" menjadi "Aplikasi Premium Profesional".
