# Tech Stack

## Gambaran Umum
Aplikasi dibangun sepenuhnya di atas infrastruktur **Google Workspace / Google Cloud Platform** menggunakan **Google Apps Script (GAS)**, **Google Sheets**, dan **Google Drive**. Solusi ini 100% *serverless*, bebas biaya hosting bulanan, aman, dan mudah di-backup secara otomatis oleh ekosistem Google.

---

## 1. Backend & Serverless Runtime
- **Runtime**: Google Apps Script (GAS) dengan **V8 Engine** modern (ES6+ support: async/await, arrow functions, destructuring, modules).
- **Communication Bridge**: `google.script.run` yang dibungkus dalam Promise wrapper modern (`runServerAsync(functionName, ...args)`).
- **Core Google Services**:
  - `SpreadsheetApp`: Manipulasi data, batch reads/writes via 2D Arrays (`getValues()` / `setValues()`), cache memory.
  - `DriveApp`: Pengelolaan folder arsip, upload berkas Modul Ajar/RPP, pembuatan link share aman.
  - `Session` & `User`: Otentikasi otomatis melalui akun Google login (`Session.getActiveUser().getEmail()`).
  - `Utilities`: Pembuatan PDF blob, base64 encoding/decoding, format tanggal dan penomoran dokumen.

---

## 2. Database & Data Storage
- **Database Engine**: **Google Spreadsheet** (Multi-sheet Relational-like Schema).
- **Struktur Sheet (Tables)**:
  1. `_CONFIG`: Metadata guru, sekolah, NPSN, semester, tahun ajaran aktif, dan pengaturan kurikulum.
  2. `_CLASSES`: ID Kelas, Nama Kelas, Tingkat, Jurusan/Fase, Tahun Ajaran.
  3. `_STUDENTS`: ID Siswa, NIS, NISN, Nama Lengkap, Jenis Kelamin, ID Kelas.
  4. `_SUBJECTS`: ID Mapel, Nama Mapel, Tingkat Kelas, Bobot Penilaian (Formatif %, Sumatif %).
  5. `_JOURNALS`: ID Jurnal, Tanggal, JamKe, ID Kelas, ID Mapel, Materi/CP/TP, Uraian Kegiatan, Refleksi, Status.
  6. `_ATTENDANCE`: ID Presensi, Tanggal, ID Kelas, ID Mapel/Sesi, ID Siswa, Status (`H`/`S`/`I`/`A`), Catatan.
  7. `_ASSESSMENTS`: ID Nilai, ID Kelas, ID Mapel, ID Siswa, Tipe (`Formatif_1`, `Sumatif_1`, `STS`, `SAS`), Skor/Nilai, Tanggal.
  8. `_BEHAVIOR`: ID Catatan, Tanggal, ID Siswa, Dimensi/Kategori, Deskripsi Kejadian, Tindak Lanjut.
  9. `_DOCUMENTS`: ID Dokumen, Nama Dokumen, Kategori (`Modul Ajar`, `RPP`, `ATP`, `Silabus`), FileUrl, FileId, UploadDate.

---

## 3. Frontend & UI
- **Penyaji Antarmuka**: Google Apps Script `HtmlService` (mode `HtmlService.XFrameOptionsMode.ALLOWALL` atau default sandbox).
- **Styling**: **Tailwind CSS** (via CDN versi modern) untuk utilitas kelas yang responsif, cepat, dan konsisten.
- **Iconography**: **Lucide Icons** (modern, ringan, dan tajam).
- **Client Logic**: Vanilla JavaScript (ES6+) / Alpine.js (reaktif, tanpa node build step yang rumit, mudah diintegrasikan ke HTMLService).
- **Komponen UI**:
  - Modal dialog interaktif (Form input guru).
  - Toast notification (Pemberitahuan sukses/gagal operasi).
  - Skeleton loading / Spinner saat memanggil `google.script.run`.
  - Responsive tables dengan pagination, search bar, dan sorting.

---

## 4. Ekspor & Laporan
- **Export PDF**:
  - Menggunakan native Google Spreadsheet PDF Export URL parameter (`/export?exportFormat=pdf&format=pdf&size=A4&portrait=true&fitw=true`) untuk cetak instan berkualitas tinggi.
  - Native browser `window.print()` dengan styling `@media print` rapi untuk lembar supervisi mandiri.
- **Export Excel / CSV**:
  - Menggunakan native Spreadsheet Export URL (`/export?format=xlsx` atau `/export?format=csv`).
  - Sheet to JSON converter untuk backup data lokal.

---

## 5. Struktur Folder Proyek
```
PROJECT PESANAN/
├── CLAUDE.md              # Aturan kerja utama AI
├── PRD.md                 # Product Requirements Document
├── TECHSTACK.md           # Dokumen teknologi ini
├── STYLEGUIDE.md          # Design system & palet warna
├── TASK.md                # Daftar pengerjaan MVP
├── SECURITY.md            # Aturan keamanan & kuota GAS
├── SKILLS.md              # Kemampuan khusus AI
├── appsscript.json        # Manifest konfigurasi Google Apps Script
├── src/
│   ├── Code.js            # Entry point GAS (doGet, include, router)
│   ├── ConfigService.js   # Operasi sheet _CONFIG
│   ├── MasterService.js   # Operasi Kelas, Siswa, Mapel
│   ├── JournalService.js  # Operasi Jurnal Mengajar
│   ├── AttendanceService.js # Operasi Presensi Siswa
│   ├── AssessmentService.js # Operasi Nilai & Leger
│   ├── BehaviorService.js # Operasi Catatan Sikap
│   ├── DocumentService.js # Operasi Arsip & Google Drive
│   ├── ExportService.js   # Generator Laporan & PDF
│   └── views/
│       ├── Index.html     # Layout utama Web App
│       ├── Styles.html    # Tailwind CSS & custom styling
│       ├── Scripts.html   # Client-side state & server runner
│       ├── Dashboard.html # Tampilan Dashboard Ringkasan
│       ├── Master.html    # Tampilan Manajemen Data Master
│       ├── Journal.html   # Tampilan Jurnal Mengajar
│       ├── Attendance.html# Tampilan Presensi Siswa
│       ├── Assessment.html# Tampilan Nilai & Leger
│       ├── Behavior.html  # Tampilan Catatan Sikap
│       ├── Documents.html # Tampilan Bank Perangkat Ajar
│       └── Reports.html   # Tampilan Pusat Cetak & Laporan
└── README.md              # Panduan setup & deployment
```

---

## 6. Konvensi Kode
- Penulisan fungsi server GAS: `camelCase` (contoh: `getJournalList()`, `saveAttendanceBatch()`).
- Penulisan nama variabel: Bahasa Inggris atau terminologi standar pendidikan Indonesia (`classId`, `studentList`, `academicYear`).
- Batch Operations Wajib: Dilarang memanggil `sheet.getRange()` di dalam looping. Selalu gunakan `getValues()` dan `setValues()` secara sekaligus untuk menghindari *timeout* eksekusi.
- Respon Server Terstandarisasi:
  ```json
  {
    "success": true,
    "data": [...],
    "message": "Data berhasil disimpan"
  }
  ```
  atau
  ```json
  {
    "success": false,
    "error": "Pesan kesalahan detail"
  }
  ```

---

## 7. Yang Dilarang (Constraints)
- Jangan gunakan library Node.js yang membutuhkan dependensi npm runtime di sisi server GAS (GAS adalah serverless V8 tanpa file system lokal Node).
- Jangan memanggil operasi I/O Google Sheets per baris dalam loop (akan terkena batas 6 menit eksekusi GAS). Gunakan batch processing.
- Jangan hardcode ID Spreadsheet di dalam file frontend HTML. ID spreadsheet harus dikelola di sisi server script atau dibaca otomatis dari active spreadsheet container (`SpreadsheetApp.getActiveSpreadsheet()`).
