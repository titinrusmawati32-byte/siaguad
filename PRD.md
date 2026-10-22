# Product Requirements Document (PRD)

## Product Name
**SiAGU (Sistem Informasi Administrasi Guru Terpadu)** - Web App Berbasis Google Apps Script (GAS) & Google Sheets.

## Product Goal
Menyediakan solusi otomasi administrasi pengajaran terpadu bagi guru (TK, SD, SMP, SMA/SMK) yang berjalan 100% di atas Google Workspace (Google Sheets, Google Drive, & Google Docs) via Google Apps Script (GAS) Web App secara gratis, tanpa biaya hosting/server, fleksibel untuk Kurikulum Merdeka maupun Kurikulum 2013 (K13), serta memudahkan pengarsipan dan supervisi kepala sekolah/pengawas.

## Target Users
1. **Guru Mata Pelajaran & Guru Kelas**: Mencatat jurnal mengajar, presensi siswa harian/per pertemuan, menginput nilai formatif/sumatif, menyusun leger, dan mengelola bank modul ajar.
2. **Wali Kelas**: Memantau rekap absensi keseluruhan kelas, mengontrol leger nilai gabungan, dan melihat catatan perkembangan sikap/karakter siswa.
3. **Kepala Sekolah & Pengawas**: Memeriksa keterlaksanaan pembelajaran dan mengunduh laporan supervisi administratif siap cetak (PDF/Excel).

## Problem Statement
- Administrasi guru di Indonesia sangat menyita waktu karena format administrasi terpisah-pisah (buku agenda fisik, sheet nilai terpisah, presensi manual).
- Banyak platform LMS/SaaS berbayar mahal atau membutuhkan server database mandiri yang membebani sekolah.
- Perbedaan implementasi kurikulum (K13 vs Kurikulum Merdeka) sering membuat format penilaian di aplikasi lain terlalu kaku.
- Kebutuhan mendesak akan satu portal web terpadu yang ringan di HP maupun laptop, gratis, dan otomatis menghasilkan rekap laporan standar dinas pendidikan (PDF/Excel).

## Core Features (MVP Scope)

### 1. Data Master & Konfigurasi Fleksibel
- [ ] Profil Guru & Sekolah (Nama Sekolah, NPSN, Nama Guru, NIP, Tahun Ajaran, Semester Aktif, Nama Kepala Sekolah & NIP).
- [ ] Data Kelas & Rombel (Daftar Kelas, Tingkat, Jurusan/Fase).
- [ ] Data Siswa per Kelas (NIS, NISN, Nama Lengkap, Jenis Kelamin, No. WhatsApp Ortu/Wali jika ada).
- [ ] Data Mata Pelajaran & Bobot Nilai (Mode Kurikulum Merdeka: Formatif/Sumatif/STS/SAS atau Mode K13: PH/PTS/PAS/Keterampilan).

### 2. Jurnal Mengajar & Agenda Harian
- [ ] Form entri agenda harian (Tanggal, Pertemuan Ke-, Kelas, Mapel, Jam Pelajaran).
- [ ] Kolom Capaian Pembelajaran (CP) / Tujuan Pembelajaran (TP) / Kompetensi Dasar (KD).
- [ ] Ringkasan Kegiatan Pembelajaran & Metode Ajar.
- [ ] Refleksi Pembelajaran, Hambatan, & Tindak Lanjut.
- [ ] Riwayat Jurnal dengan filter kelas dan rentang tanggal.

### 3. Presensi & Absensi Siswa
- [ ] Input presensi per sesi pertemuan / harian (Hadir, Sakit, Izin, Alpa/Tanpa Keterangan).
- [ ] Tombol pintas: *Default All Hadir* (1 klik semua siswa hadir, guru tinggal menandai yang tidak hadir).
- [ ] Rekapitulasi otomatis: Akumulasi H, S, I, A serta persentase kehadiran per siswa dan per kelas.

### 4. Rekap Penilaian & Leger Nilai
- [ ] Input nilai Asesmen Formatif (Tugas, Kuis, LKPD) & Asesmen Sumatif (Lingkup Materi, STS/PTS, SAS/PAS).
- [ ] Perhitungan otomatis Nilai Akhir (NA) berdasarkan bobot persentase yang dapat disesuaikan.
- [ ] Tampilan Leger Nilai Kelas lengkap dengan rata-rata kelas, nilai tertinggi, dan nilai terendah.
- [ ] Deskripsi capaian kompetensi otomatis (generator narasi capaian tertinggi & terendah).

### 5. Bank Perangkat Ajar & Arsip Digital
- [ ] Direktori penyimpanan tautan/dokumen Google Drive untuk Modul Ajar, RPP, Alur Tujuan Pembelajaran (ATP), Silabus, Prota/Promes, dan Jadwal Mengajar.
- [ ] Integrasi upload berkas langsung ke folder Google Drive guru melalui antarmuka web app.

### 6. Catatan Sikap & Karakter Siswa
- [ ] Jurnal catatan insiden perilaku positif & pembinaan siswa (Anekdot).
- [ ] Dimensi Profil Pelajar Pancasila (Beriman, Mandiri, Gotong Royong, Berkebinekaan Global, Bernalar Kritis, Kreatif) atau Sikap Spiritual & Sosial K13.
- [ ] Tindak lanjut dan pemantauan perkembangan pembiasaan karakter.

### 7. Export Laporan & Dokumen Supervisi
- [ ] Ekspor Jurnal Mengajar ke format PDF (standar lembar supervisi) dan spreadsheet Excel.
- [ ] Ekspor Rekap Kehadiran Siswa bulanan/semester (PDF & Excel).
- [ ] Ekspor Leger Nilai siap cetak untuk arsip guru/wali kelas (PDF & Excel).

### 8. Portal Monitoring & Supervisi Kepala Sekolah / Admin
- [ ] Dashboard eksekutif pemantauan progres administrasi seluruh tenaga pendidik (Modul Ajar, Jurnal, Presensi, Penilaian).
- [ ] Progress bar kepatuhan administrasi per guru (0 - 100%).
- [ ] Lembar telaah & evaluasi berkas guru oleh Kepala Sekolah (skoring 4 aspek, predikat, & catatan pembinaan).
- [ ] Manajemen data master guru sekolah (NIP, nama, mapel, email, status).
- [ ] Cetak dokumen rekapitulasi hasil supervisi akademik sekolah untuk Pengawas Pembina Dinas Pendidikan.

## Out of Scope
- Ujian Online Interaktif (CBT) berbasis timer/kunci jawaban (fokus aplikasi adalah sistem administrasi guru).
- Portal login khusus siswa/orang tua siswa (fase 1 difokuskan untuk guru & admin).
- Gateway SMS/WhatsApp berbayar (pengiriman notifikasi WhatsApp otomatis di luar scope MVP).

## Success Metrics
- Guru dapat menyelesaikan pengisian presensi dan jurnal mengajar dalam waktu < 3 menit per kelas.
- Rekap absensi dan perhitungan nilai akhir terisi secara instan tanpa perlu menyusun rumus spreadsheet manual.
- Pembuatan dokumen cetak supervisi (PDF/Excel) selesai dalam < 10 detik.
- Aplikasi berjalan lancar di browser laptop dan smartphone tanpa melampaui kuota eksekusi Google Apps Script (kuota 6 menit per run).

## Security & Privacy Requirements
- Akses dibatasi pada akun Google terdaftar / domain Google Workspace sekolah.
- Database Google Sheets dilindungi dan diakses secara terenkripsi via API server Google (`Code.gs`).
- Validasi data input di server untuk menjaga integritas baris dan kolom Google Sheets.
- Aturan keamanan mendalam diatur di `SECURITY.md`.
