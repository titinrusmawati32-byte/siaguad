# Security & Quota Rules (Google Apps Script)

## Prinsip Keamanan Utama
Aplikasi ini berjalan di ekosistem **Google Cloud / Google Workspace**. Keamanan bertumpu pada kontrol akses Google Account, integritas hak akses Google Spreadsheet, dan pencegahan eksploitasi pada `HtmlService` Google Apps Script.

---

## 1. Akses Spreadsheet & Database
- **DILARANG KERAS** membagikan Google Spreadsheet dengan izin `"Siapa saja yang memiliki link dapat mengedit"` (*Anyone with the link can edit*).
- Izin Google Spreadsheet hanya diberikan secara privat kepada akun Google pemilik aplikasi / admin sekolah.
- Web App GAS dijalankan dengan mode **"Execute as: Me"** (atau domain terbatas), sehingga siswa/pihak luar tidak memiliki akses langsung ke baris dan rumus database spreadsheet.
- Sheet tab sistem (`_CONFIG`, `_CLASSES`, `_STUDENTS`, dll) dilindungi dengan *Protect Sheet* jika diperlukan agar struktur kolom tidak rusak jika spreadsheet dibuka manual.

---

## 2. Autentikasi & Otorisasi Pengguna
- Identifikasi pengguna dilakukan melalui `Session.getActiveUser().getEmail()`.
- Di fungsi server (`Code.js`), verifikasi apakah email pengguna terdaftar di sheet `_CONFIG` atau berdomain sekolah resmi sebelum mengeksekusi operasi simpan/ubah data.
- Jika pengguna yang mengakses tidak memiliki izin, server mengembalikan status `{ success: false, error: "Akses ditolak: Akun Google Anda belum terdaftar sebagai guru aktif." }`.

---

## 3. Sanitasi Input & Pencegahan XSS
- **Output Encoding**: Data dari Google Sheets yang dirender ke dalam antarmuka HTML wajib di-escape untuk mencegah *Cross-Site Scripting (XSS)*. Gunakan `HtmlService.createHtmlOutput()` yang aman dan hindari injeksi `innerHTML` langsung dari input pengguna yang belum disanitasi.
- **Validasi Data di Sisi Server**:
  - Validasi bahwa nilai angka berada di rentang 0-100.
  - Validasi format tanggal (YYYY-MM-DD).
  - Validasi status presensi hanya berupa karakter valid (`H`, `S`, `I`, `A`).
  - Cegah *Formula Injection* di Google Sheets (input teks yang diawali karakter `=`, `+`, `-`, `@` harus di-prepend dengan tanda petik tunggal `'` agar tidak dieksekusi sebagai formula spreadsheet jahat).

---

## 4. Google Apps Script Quotas & Performance Limits
Google Apps Script memiliki kuota eksekusi bawaan yang harus dipatuhi:
- **Batas Waktu Eksekusi**: Maksimal **6 menit** per satu kali pemanggilan fungsi.
  - Solusi: Semua query data dan penulisan baris wajib menggunakan teknik **Batch Array** (`getValues()` dan `setValues()`), dilarang memanggil `getRange().setValue()` di dalam perulangan loop.
- **Batas Ukuran Upload File (DriveApp)**:
  - Maksimal ukuran blob file via `google.script.run` adalah 50MB (disarankan dibatasi maksimal 10MB per berkas modul ajar/RPP).
- **Concurrent Executions**:
  - Gunakan `LockService.getScriptLock()` untuk operasi tulis massal (seperti rekap nilai satu angkatan) guna mencegah *race condition* saat dua guru menyimpan data bersamaan.

---

## 5. Privacy & Data Protection (Perlindungan Data Siswa)
- Data pribadi siswa (NISN, nomor kontak orang tua, catatan perilaku/sikap) bersifat rahasia dan hanya boleh diakses oleh guru yang bersangkutan dan wali kelas.
- Dilarang mengekspos ID folder Google Drive sensitif di kode JavaScript frontend client-side.
- Simpan ID Google Drive induk di sheet `_CONFIG` di sisi server.

---

## 6. Pre-Deploy Checklist
- [ ] Sheet database privat (tidak berstatus public share).
- [ ] Validasi formula injection aktif untuk setiap teks yang disimpan ke sheet.
- [ ] Batch read/write digunakan di seluruh fungsi `*Service.js`.
- [ ] Tidak ada token atau credential rahasia di dalam script (menggunakan native Google Authorization).
- [ ] Script lock (`LockService`) dipasang pada penyimpanan nilai dan absensi massal.
- [ ] Uji coba akses dari mode incognito/browser berbeda untuk memastikan otorisasi berjalan.
