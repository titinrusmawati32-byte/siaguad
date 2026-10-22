# CLAUDE.md

> File ini adalah aturan main permanen untuk project **SiAGU (Sistem Informasi Administrasi Guru Terpadu)**. Dibaca secara otomatis di awal sesi. Jaga agar tetap padat, terstruktur, dan tidak melanggar hierarki dokumen.

---

## 1. Project Overview
**SiAGU** adalah aplikasi administrasi guru terpadu (Jurnal Mengajar, Presensi, Penilaian & Leger, Perangkat Ajar, Catatan Sikap, dan Laporan Supervisi) berbasis **Google Apps Script (GAS) Web App**, **Google Sheets**, dan **Google Drive**. Berjalan tanpa biaya hosting/server, fleksibel untuk Kurikulum Merdeka maupun K13, serta siap cetak/ekspor ke PDF & Excel.

---

## 2. Source of Truth
Selalu ikuti urutan hierarki prioritas dokumen berikut:
1. `SECURITY.md` (Keamanan & Kuota Google Apps Script - prioritas tertinggi, mutlak)
2. `PRD.md` (Spesifikasi produk & batasan fitur)
3. `TECHSTACK.md` (Arsitektur GAS, Google Sheets schema, & HTMLService)
4. `STYLEGUIDE.md` (Design system: Teal/Slate, tipografi, komponen UI)
5. `TASK.md` (Urutan pengerjaan task per section)
6. `SKILLS.md` (Paket skill dan panduan teknis)

---

## 3. Tech Stack Ringkas
- **Backend / Engine**: Google Apps Script (GAS) V8 Runtime.
- **Database**: Google Sheets (Multi-sheet relational-like).
- **Storage & Ekspor**: Google Drive & PDF Blob.
- **Frontend**: Google Apps Script `HtmlService` + Tailwind CSS CDN + Lucide Icons + Vanilla JS / Alpine.js.

---

## 4. Workflow Rules
- Kerjakan satu section dari `TASK.md` per sesi. Jangan melompat ke section lain sebelum section aktif tuntas.
- Selalu gunakan format respon standar pada fungsi server GAS:
  `{ success: true, data: ... }` atau `{ success: false, error: ... }`.
- Setelah menyelesaikan suatu task, centang `[x]` pada `TASK.md`.
- Jika ada persyaratan fitur yang ambigu, tanyakan kepada pengguna sebelum berasumsi.

---

## 5. Code Rules
- **Wajib Batch Operations**: Selalu baca dan tulis data Google Sheets menggunakan array 2D (`getValues()` / `setValues()`). Dilarang keras melakukan I/O baris/sel di dalam perulangan loop.
- **Formula Injection Guard**: Seluruh input teks yang disimpan ke sheet harus disanitasi dari karakter awalan formula (`=`, `+`, `-`, `@`).
- **Gaya Komponen UI**: Terapkan palet warna Teal & Slate, border rounded-xl, dan layout responsif sesuai `STYLEGUIDE.md`.
- **Nama Fungsi & Variabel**: Gunakan `camelCase` dalam bahasa Inggris atau istilah resmi pendidikan Indonesia yang jelas.
- **Error Handling**: Semua fungsi server wajib dibungkus blok `try-catch` yang informatif.

---

## 6. Do Not (Larangan Mutlak)
- Dilarang membuat konfigurasi Google Sheets dengan status *publicly editable*.
- Dilarang hardcode ID spreadsheet atau URL kredensial rahasia di dalam file tampilan `views/*.html`.
- Dilarang menambahkan dependensi framework Node.js berat yang tidak kompatibel dengan runtime V8 Google Apps Script.
- Dilarang mengubah skema sheet yang sudah berjalan tanpa migrasi data yang aman.

---

## 7. Definition of Done
Sebuah task dianggap selesai jika:
- [ ] Berfungsi sesuai acceptance criteria di `TASK.md`.
- [ ] Tampilan antarmuka sesuai standar `STYLEGUIDE.md` (rapi di desktop dan mobile).
- [ ] Memenuhi seluruh checklist kepatuhan di `SECURITY.md`.
- [ ] Tidak menyebabkan *timeout* eksekusi (efisien dalam pemanggilan kuota GAS).
- [ ] Berhasil diverifikasi dan siap digunakan.
