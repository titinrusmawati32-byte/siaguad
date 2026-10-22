# MVP Scope & Roadmap Pengerjaan

> Ikuti aturan di `CLAUDE.md` dan `SECURITY.md`. Kerjakan satu section per sesi secara terstruktur.

---

## Section 1: Inisialisasi Project & Database Schema
- [x] Buat file manifest `appsscript.json` (konfigurasi runtime V8, timezone Asia/Jakarta, web app permissions).
- [x] Buat file `Code.js` sebagai entry point (`doGet()`, template inclusion helper `include()`).
- [x] Buat fungsi inisialisasi sheet otomatis (`initDatabaseSchema()`):
  - [x] Sheet `_CONFIG` (Header & default data sekolah/guru/kurikulum).
  - [x] Sheet `_CLASSES` (Header & sampel rombel).
  - [x] Sheet `_STUDENTS` (Header & sampel siswa).
  - [x] Sheet `_SUBJECTS` (Header & mata pelajaran + bobot).
  - [x] Sheet `_JOURNALS` (Header jurnal agenda harian).
  - [x] Sheet `_ATTENDANCE` (Header presensi).
  - [x] Sheet `_ASSESSMENTS` (Header nilai formatif & sumatif).
  - [x] Sheet `_BEHAVIOR` (Header catatan sikap siswa).
  - [x] Sheet `_DOCUMENTS` (Header arsip perangkat ajar).

---

## Section 2: Layout Utama & UI Shell (Frontend)
- [x] Buat file `views/Index.html` (Kerangka SPA responsif dengan sidebar navigasi & header profil).
- [x] Buat file `views/Styles.html` (Integrasi Tailwind CSS CDN & konfigurasi palet warna teal/slate sesuai `STYLEGUIDE.md`).
- [x] Buat file `views/Scripts.html` (Client runtime, routing antar menu, Promise wrapper untuk `google.script.run`, modal handler, dan sistem notifikasi toast).
- [x] Buat file `views/Dashboard.html` (KPI Cards: Total Siswa, Kelas Diampu, Jurnal Bulan Ini, Kehadiran Rata-rata, Quick Shortcuts).

---

## Section 3: Data Master & Pengaturan (Config & Master Service)
- [x] Buat file `ConfigService.js` (Get & Save konfigurasi guru, sekolah, kurikulum aktif).
- [x] Buat file `MasterService.js` (CRUD Kelas, Siswa, dan Mata Pelajaran).
- [x] Buat file `views/Master.html` (Tampilan tab manajemen Kelas, daftar Siswa dengan fitur tambah/edit/hapus dan import nama siswa, serta tab Mata Pelajaran).

---

## Section 4: Jurnal Mengajar & Agenda Harian (Journal Service)
- [x] Buat file `JournalService.js` (Fungsi simpan agenda mengajar, get history per kelas/rentang tanggal, edit/hapus jurnal).
- [x] Buat file `views/Journal.html`:
  - [x] Form input agenda (Pilih Kelas, Mapel, Tanggal, Jam Ke, Materi/Capaian Pembelajaran, Uraian Kegiatan, Refleksi).
  - [x] Tabel riwayat mengajar dengan filter kelas dan pencarian kata kunci.

---

## Section 5: Presensi & Absensi Siswa (Attendance Service)
- [x] Buat file `AttendanceService.js` (Batch save presensi siswa per tanggal & sesi, hitung rekapitulasi persentase kehadiran).
- [x] Buat file `views/Attendance.html`:
  - [x] Selector Kelas, Tanggal, dan Pertemuan.
  - [x] Tabel daftar siswa dengan radio button status cepat: `Hadir (H)`, `Sakit (S)`, `Izin (I)`, `Alpa (A)`.
  - [x] Tombol pintar **"Hadir Semua (1-Klik)"** untuk efisiensi waktu guru.
  - [x] Ringkasan statistik kehadiran sesi (Berapa Hadir, Sakit, Izin, Alpa).

---

## Section 6: Penilaian, Bobot, & Leger Nilai (Assessment Service)
- [x] Buat file `AssessmentService.js`:
  - [x] Simpan dan update nilai per tugas / asesmen formatif / sumatif.
  - [x] Perhitungan Nilai Akhir (NA) dinamis berdasarkan bobot kurikulum aktif.
  - [x] Fungsi generate matriks Leger Nilai kelas.
- [x] Buat file `views/Assessment.html`:
  - [x] Tab Input Nilai Harian / Asesmen per Lingkup Materi.
  - [x] Tab Leger Nilai Terpadu (Menampilkan rekap nilai seluruh siswa dalam satu kelas lengkap dengan rata-rata dan status tuntas).

---

## Section 7: Bank Perangkat Ajar & Arsip Digital (Document Service)
- [x] Buat file `DocumentService.js` (Koneksi ke folder Google Drive, buat subfolder otomatis, simpan link/metadata berkas Modul Ajar, RPP, Silabus, ATP).
- [x] Buat file `views/Documents.html`:
  - [x] Repositori kartu berkas ajar terorganisir per kategori.
  - [x] Form upload / tambah tautan dokumen Google Docs / PDF.

---

## Section 8: Catatan Sikap & Karakter Siswa (Behavior Service)
- [x] Buat file `BehaviorService.js` (CRUD catatan anekdot perilaku, filter per siswa/kelas).
- [x] Buat file `views/Behavior.html`:
  - [x] Form pencatatan insiden (Pilih Siswa, Tanggal, Dimensi Profil Pelajar Pancasila / Kategori K13, Catatan Kejadian, Tindak Lanjut).
  - [x] Linimasa (*timeline*) riwayat perkembangan karakter siswa.

---

## Section 9: Pusat Laporan, Ekspor PDF & Cetak (Export Service)
- [x] Buat file `ExportService.js`:
  - [x] Generator format cetak HTML siap print A4.
  - [x] Generator URL export Spreadsheet (Excel & PDF langsung dari Google Sheets).
- [x] Buat file `views/Reports.html`:
  - [x] Menu cetak: Lembar Supervisi Jurnal Mengajar.
  - [x] Menu cetak: Rekap Presensi Siswa Bulanan / Semester.
  - [x] Menu cetak: Leger Nilai Lengkap dengan tanda tangan Kepala Sekolah & Guru.
  - [x] Dukungan `@media print` rapi dengan Kop Sekolah dan titi mangsa.

---

## Section 10: Pengujian, Keamanan, & Deployment Guide
- [x] Audit seluruh fungsi terhadap checklist di `SECURITY.md` (formula injection, sanitasi, batch writes).
- [x] Uji responsivitas di resolusi mobile (Android/iOS) dan desktop browser.
- [x] Susun panduan deployment lengkap di `README.md` (cara pasang script ke Google Spreadsheet, Deploy as Web App, izin akses, dan URL hasil rilis).

---

## Section 11: Portal Monitoring & Supervisi Kepala Sekolah (Admin)
- [x] Tambahkan tabel `_TEACHERS` dan `_SUPERVISION` pada skema database di `Code.js`.
- [x] Buat backend service `SupervisionService.js` (Monitoring progres guru, CRUD guru, telaah supervisi Kepala Sekolah, dan rekap dinas).
- [x] Buat view `views/Supervision.html` (KPI monitoring sekolah, tabel progres administrasi guru, modal telaah skor & pembinaan, master guru, dan format cetak rekapitulasi dinas).
- [x] Pasang Role Switcher di header `Index.html` (Beralih cepat antara Mode Guru dan Mode Kepala Sekolah).
- [x] Integrasikan state switching dan handler di `Scripts.html`.

---

## Section 12: Sistem Otentikasi, Login Page Multi-Role, & Generator Akun Guru
- [x] Tambahkan kolom `username`, `password`, dan `role` di sheet `_TEACHERS` dan `_CONFIG`.
- [x] Buat backend service `AuthService.js` (Otentikasi login Kepala Sekolah & Guru, verifikasi password, generate kredensial akun guru).
- [x] Buat halaman login modern `views/Login.html` (Toggle tab Portal Guru vs Kepala Sekolah, show/hide password, session checkbox, dan quick demo pills).
- [x] Tambahkan fitur generator akun login guru di `views/Supervision.html` (Generate PIN acak, modal kartu slip akun login siap kirim ke WhatsApp / cetak).
- [x] Integrasikan proteksi sesi `localStorage` dan tombol Logout resmi di `Index.html` & `Scripts.html`.

---

## Section 13: Database `_USERS` & Menu Khusus Admin "Kelola Guru & Akun"
- [x] Tambahkan skema tabel database `_USERS` dengan auto-create otomatis di `AuthService.js` & `Code.js`.
- [x] Buat modul terpisah `views/ManageUsers.html` (Menu Kelola Guru & Akun untuk Kepala Sekolah/Admin).
- [x] Sediakan fitur Tambah Akun Guru Baru dengan username custom/saran otomatis dan tombol acak PIN 6 karakter.
- [x] Sediakan fitur Edit, Hapus, dan Cetak Slip Akun Guru siap kirim ke WhatsApp.
- [x] Pasang menu "Kelola Guru & Akun" di sidebar admin dengan proteksi hak akses khusus Kepala Sekolah.

---

## Section 14: Luxury Dark Glassmorphism UI Redesign (Sesuai Referensi Gambar)
- [x] Perbarui `STYLEGUIDE.md` dengan sistem desain luxury dark glassmorphism (Obsidian background `#0D0C10`, warm ambient sunset peach glow, 4 gradient KPI cards, dan vibrant sky blue navigation pill `#7CC4FA`).
- [x] Restyle `views/Styles.html` dengan konfigurasi Tailwind Dark Mode, body ambient radial glow, custom sleek dark scrollbar, dan utility `.glass-card` & `.nav-active`.
- [x] Restyle `views/Index.html` (Sidebar, Topbar, Mobile Header, Avatar gradients, dan Global Loading Overlay).
- [x] Restyle `views/Dashboard.html` (Welcome banner amber, 4 kartu KPI bergradien Bronze, Soft Cobalt, Berry Magenta, dan Sunset Terracotta, serta tabel agenda mengajar gelap).
- [x] Restyle `views/Login.html` (Luxury dark glass card, glowing accent bar, active role pills, dan dark input fields).
- [x] Restyle Menu Admin: `views/Supervision.html` & `views/ManageUsers.html` (Monitoring sekolah, kartu statistik, tabel gelap, dan modal telaah/kredensial).
- [x] Restyle Menu Guru: `views/Journal.html`, `views/Attendance.html`, `views/Assessment.html`, `views/Master.html`, `views/Documents.html`, `views/Behavior.html`, & `views/Reports.html`.
- [x] Pertahankan 100% fungsionalitas, ID elemen, formula perhitungan, dan format cetak resmi A4 hitam-putih untuk pelaporan dinas.
