# Skills Registry

## Cara Kerja
Dokumen ini mencatat paket instruksi dan kapabilitas yang digunakan AI saat mengembangkan aplikasi **SiAGU (Sistem Administrasi Guru Terpadu)** berbasis Google Apps Script.

---

## Skill Aktif di Project Ini

| Skill | Dipakai saat | Jangan dipakai saat |
|---|---|---|
| `gas-backend` | Menulis/mengubah fungsi server Google Apps Script (`Code.js`, `*Service.js`), optimasi SpreadsheetApp, batch processing, dan locking | Mengubah styling UI HTML/CSS |
| `educational-ui` | Merancang dan memodifikasi template antarmuka guru (`views/*.html`), form input, modal, toast, dan komponen responsif Tailwind | Menulis logika query database sheet |
| `data-schema` | Merancang struktur tabel sheet, formula internal, validasi kolom, dan inisialisasi sheet | Menulis logika frontend JavaScript |
| `report-exporter` | Membangun layout cetak A4 supervisi (`@media print`), format lembar penilaian, dan ekspor PDF/Excel | Pengerjaan CRUD data harian biasa |
| `security-audit` | Menginspeksi celah formula injection, otorisasi akun pengguna, dan batas kuota eksekusi Google Apps Script | Saat pengerjaan mockup awal |

---

## Aturan Pakai
1. **Prioritas Dokumen**: Skill tidak boleh melanggar batasan `SECURITY.md`, `PRD.md`, `TECHSTACK.md`, dan `STYLEGUIDE.md`.
2. **Batch Processing Mandat**: Saat menulis kode dengan skill `gas-backend`, selalu gunakan pembacaan dan penulisan array 2D secara serentak (`getValues()` / `setValues()`). Dilarang memanggil operasi I/O sel tunggal dalam loop.
3. **Design Token Mandat**: Saat menulis kode dengan skill `educational-ui`, selalu rujuk palet warna Teal & Slate di `STYLEGUIDE.md`. Hindari penggunaan warna acak yang tidak konsisten.
4. **Pencegahan Error**: Setiap fungsi server harus membungkus logic dengan `try-catch` dan mengembalikan objek terstruktur `{ success: boolean, data?: any, error?: string }`.
