# SiAGU — Sistem Informasi Administrasi Guru Terpadu
### Arsitektur: Frontend di GitHub Pages + Database di Google Apps Script (Spreadsheet)

Repositori ini menggabungkan:
1. **Frontend**: Berjalan di **GitHub Pages** (HTML, Tailwind CSS, Lucide Icons, JsBarcode, Html5Qrcode). Bebas batasan iframe dan perizinan kamera berfungsi 100% mulus.
2. **Backend & Database**: Berjalan di **Google Apps Script & Google Sheets**. Mengelola database pengguna, guru, presensi, jurnal, nilai, dan dokumen via REST API JSON.

---

## 🚀 Panduan Setup & Deploy

### Langkah 1: Siapkan Backend di Google Apps Script
1. Buka proyek Google Apps Script Anda (`script.google.com`).
2. Pastikan file `Code.js` sudah diperbarui dengan kode terbaru yang memiliki fungsi `doPost` dan `doGet`.
3. Klik tombol **Deploy (Terapkan)** di pojok kanan atas $\rightarrow$ pilih **New deployment (Penerapan baru)**.
4. Pilih tipe: **Web app**.
5. Isi konfigurasi:
   - **Description**: `SiAGU API v1`
   - **Execute as (Jalankan sebagai)**: `Me (Email Anda)`
   - **Who has access (Siapa yang memiliki akses)**: `Anyone (Siapa saja)`
6. Klik **Deploy** dan salin **Web App URL** yang dihasilkan:
   *(Format: `https://script.google.com/macros/s/AKfycb.../exec`)*

---

### Langkah 2: Buat File `index.html` untuk GitHub Pages
Buka terminal di folder ini, lalu jalankan:
```bash
node build.js
```
Perintah ini akan otomatis menggabungkan seluruh komponen di `src/views/*.html` menjadi satu file `index.html` mandiri yang siap di-hosting ke GitHub Pages.

---

### Langkah 3: Unggah ke GitHub
Jalankan perintah Git berikut di terminal:
```bash
git init
git add .
git commit -m "Deploy SiAGU Frontend ke GitHub Pages"
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/siagu-app.git
git push -u origin main
```

---

### Langkah 4: Aktifkan GitHub Pages (1-Klik)
1. Buka repositori Anda di GitHub: `https://github.com/USERNAME_ANDA/siagu-app`.
2. Klik tab **Settings** di bilah atas.
3. Di bilah samping kiri, klik menu **Pages**.
4. Di bagian **Build and deployment** $\rightarrow$ **Branch**:
   - Pilih: `main`
   - Folder: `/ (root)`
   - Klik **Save**.
5. Tunggu sekitar 1 menit. Website Anda sudah aktif dan live di alamat:
   👉 **`https://USERNAME_ANDA.github.io/siagu-app`**

---

### Langkah 5: Hubungkan Frontend ke Database
1. Buka link GitHub Pages Anda di browser.
2. Saat pertama kali dibuka, sistem akan menampilkan jendela input:
   > *Silakan tempelkan Web App URL Google Apps Script Anda...*
3. Tempelkan URL Web App GAS yang Anda dapatkan di **Langkah 1**.
4. Selesai! Aplikasi Anda kini langsung terhubung ke database Google Sheets dengan kamera presensi yang berfungsi 100% tanpa kendala perizinan.
