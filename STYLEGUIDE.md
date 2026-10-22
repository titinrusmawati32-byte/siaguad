# Design System & Style Guide (Luxury Dark Glassmorphism)

> Referensi Desain: Visual luxury dark glassmorphism modern dengan ambient sunset glow, gradient KPI cards, dan vibrant active pill buttons sesuai preferensi pengguna.

---

## Design Personality
- **Modern Luxury & High-End Dashboard**: Tampilan gelap (*Obsidian Dark*) dengan pencahayaan ambient hangat (*Sunset Peach / Amber Glow*).
- **Glassmorphism & Depth**: Permukaan kartu semi-transparan dengan border lembut (*ultra-thin border* `border-white/10`) dan efek *backdrop-blur*.
- **Vibrant Accent Controls**: Tombol navigasi aktif dengan pill biru cerah (*Cyan/Sky Blue* `#7CC4FA`), tombol aksi emas/amber, dan kontras visual yang tajam.
- **Ultra-Readable Typography**: Teks kontras tajam (putih murni dan slate terang) pada latar belakang gelap, nyaman untuk membaca data nilai dan absensi.

---

## Palet Warna (Color Palette)

### 1. Canvas & Backgrounds
- **Deep Obsidian (Body Canvas)**: `#0D0C10`
- **Surface Dark (Card Glass)**: `#17161D` / `rgba(23, 22, 29, 0.85)`
- **Sidebar Surface**: `#121117`
- **Inner Inputs / Containers**: `#1E1D25`
- **Ambient Sunset Radial Glow**: `radial-gradient(ellipse 80% 60% at 85% -10%, rgba(245, 158, 66, 0.22), transparent 70%)`

### 2. Gradient Accent KPI Cards (Sesuai Referensi Gambar)
- **Card 1 (Golden Olive / Bronze)**: `from-[#3D3728] via-[#2C271C] to-[#1C1912]` (Border: `#F59E0B/25`, Text: `#FDE68A`)
- **Card 2 (Royal Indigo / Soft Cobalt)**: `from-[#2D3960] via-[#1E2745] to-[#141A30]` (Border: `#60A5FA/25`, Text: `#BFDBFE`)
- **Card 3 (Deep Rose / Berry Magenta)**: `from-[#53243B] via-[#3B1728] to-[#250D19]` (Border: `#F472B6/25`, Text: `#FBCFE8`)
- **Card 4 (Warm Sunset Amber / Terracotta)**: `from-[#8C3E1F] via-[#632912] to-[#3D1607]` (Border: `#FB923C/25`, Text: `#FED7AA`)

### 3. Active Nav & Brand Accent
- **Active Navigation Pill**: `#7CC4FA` (Sky Blue cerah) dengan teks `#0B1320` (Dark Navy Bold) dan bayangan `shadow-lg shadow-sky-500/20`.
- **Primary CTA Buttons**: Gradien Amber-Sunset `from-amber-500 to-orange-500` dengan teks gelap `#0F0E12` font-bold.
- **Secondary Buttons**: `bg-white/10 hover:bg-white/15 text-white border border-white/15`.

### 4. Semantic Status Colors (Glowing Dark Badges)
- **Hadir / Disetujui / Tuntas**: `bg-emerald-500/15 text-emerald-300 border border-emerald-500/30`
- **Sakit / Warning / Perlu Perbaikan**: `bg-amber-500/15 text-amber-300 border border-amber-500/30`
- **Izin / Info / Peninjauan**: `bg-sky-500/15 text-sky-300 border border-sky-500/30`
- **Alpa / Belum Tuntas / Danger**: `bg-rose-500/15 text-rose-300 border border-rose-500/30`

---

## Print Styles (`@media print`)
- **PENTING**: Saat mencetak dokumen laporan supervisi atau leger nilai ke printer/kertas A4, gaya gelap otomatis dinonaktifkan (`@media print` memaksakan warna latar putih bersih `#FFFFFF` dan teks hitam pekat `#000000` dengan border garis tegas agar tinta printer hemat dan standar kedinasan terpenuhi).
