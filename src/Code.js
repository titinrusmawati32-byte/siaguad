/**
 * SiAGU — Sistem Informasi Administrasi Guru Terpadu
 * Entry Point & Core Router Google Apps Script
 */

/**
 * Handle HTTP GET Request:
 * 1. Jika membawa parameter ?action=... maka bertindak sebagai REST API (JSON)
 * 2. Jika diakses biasa di browser, menyajikan Web App UI
 */
function doGet(e) {
  // 1. Dukungan API via GET (jika dipanggil dari Frontend GitHub / Eksternal)
  if (e && e.parameter && e.parameter.action) {
    let args = [];
    if (e.parameter.args) {
      try {
        args = JSON.parse(e.parameter.args);
        if (!Array.isArray(args)) args = [args];
      } catch (err) {
        args = [e.parameter.args];
      }
    }
    return handleApiRequest(e.parameter.action, args);
  }

  // 2. Render Antarmuka Web App bawaan GAS
  try {
    const template = HtmlService.createTemplateFromFile('views/Index');
    return template
      .evaluate()
      .setTitle('SiAGU — Sistem Administrasi Guru Terpadu')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    try {
      const templateFallback = HtmlService.createTemplateFromFile('Index');
      return templateFallback
        .evaluate()
        .setTitle('SiAGU — Sistem Administrasi Guru Terpadu')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } catch (fallbackErr) {
      return HtmlService.createHtmlOutput(
        `<div style="font-family:sans-serif;padding:24px;color:#be123c;">
          <h3>Gagal Memuat Antarmuka SiAGU</h3>
          <p>Detail Error: ${err.message}</p>
        </div>`
      );
    }
  }
}

/**
 * Handle HTTP POST Request (REST API Endpoint untuk Frontend di GitHub Pages)
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;
    const args = Array.isArray(payload.args) ? payload.args : (payload.data !== undefined ? [payload.data] : []);

    return handleApiRequest(action, args);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Kesalahan parsing POST: ' + err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Router Terpusat untuk memanggil fungsi Service di Google Apps Script
 */
function handleApiRequest(action, args = []) {
  try {
    if (!action) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Parameter "action" wajib disertakan.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Cari fungsi yang cocok di scope global GAS
    const fn = globalThis[action];
    if (typeof fn !== 'function') {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: `Fungsi API "${action}" tidak ditemukan di server Google Apps Script.`
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Eksekusi fungsi dan ambil hasilnya
    const result = fn.apply(null, args);

    return ContentService.createTextOutput(JSON.stringify(result !== undefined ? result : { success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.message,
      stack: err.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper untuk menyisipkan file HTML parsial (komponen, style, script)
 * Mendukung path 'views/FileName' maupun 'FileName'
 */
function include(filename) {
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch (err) {
    try {
      const cleanName = filename.replace(/^views\//, '');
      return HtmlService.createHtmlOutputFromFile(cleanName).getContent();
    } catch (fallbackErr) {
      console.warn(`File ${filename} tidak ditemukan di Google Apps Script: ${fallbackErr.message}`);
      return `<!-- File ${filename} belum disalin ke Google Apps Script -->`;
    }
  }
}

/**
 * Helper standar respon sukses server
 */
function successResponse(data, message = 'Operasi berhasil') {
  return {
    success: true,
    data: data,
    message: message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Helper standar respon error server
 */
function errorResponse(message = 'Terjadi kesalahan sistem', details = null) {
  return {
    success: false,
    error: message,
    details: details ? details.toString() : null,
    timestamp: new Date().toISOString()
  };
}

/**
 * Sanitasi string sebelum disimpan ke Google Sheets untuk mencegah Formula Injection
 */
function sanitizeForSheet(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  const str = String(value).trim();
  if (/^[=+\-@]/.test(str)) {
    return "'" + str;
  }
  return str;
}

/**
 * Helper mendapatkan active spreadsheet atau membuka berdasarkan ID
 */
function getDatabaseSpreadsheet() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  
  // Jika script berjalan standalone, baca dari Script Properties
  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty('SPREADSHEET_ID');
  if (sheetId) {
    return SpreadsheetApp.openById(sheetId);
  }
  throw new Error('Spreadsheet belum terhubung. Pastikan script ini dibuat dari menu Ekstensi > Apps Script di dalam Google Sheets.');
}

/**
 * Inisialisasi Skema Database & Tabel Google Sheets Otomatis
 * Menyiapkan sheet, header bergaya, dan data awal sampel guru
 */
function initDatabaseSchema() {
  const ss = getDatabaseSpreadsheet();
  const lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    const schemas = [
      {
        name: '_CONFIG',
        headers: ['Key', 'Value', 'Description'],
        initialData: [
          ['SCHOOL_NAME', 'SMA Negeri 1 Nusantara', 'Nama Satuan Pendidikan'],
          ['SCHOOL_NPSN', '20104050', 'Nomor Pokok Sekolah Nasional'],
          ['TEACHER_NAME', 'Budi Santoso, S.Pd., M.Pd.', 'Nama Lengkap Guru Pengampu'],
          ['TEACHER_NIP', '19850512 201001 1 008', 'NIP / NUPTK Guru'],
          ['HEADMASTER_NAME', 'Dr. Hj. Siti Rahma, M.M.', 'Nama Kepala Sekolah'],
          ['HEADMASTER_NIP', '19760315 200212 2 003', 'NIP Kepala Sekolah'],
          ['ACADEMIC_YEAR', '2026/2027', 'Tahun Ajaran Aktif'],
          ['SEMESTER', 'Ganjil', 'Semester Aktif (Ganjil / Genap)'],
          ['CURRICULUM_MODE', 'Kurikulum Merdeka', 'Opsi: Kurikulum Merdeka / Kurikulum 2013 (K13)'],
          ['DEFAULT_WEIGHT_FORMATIVE', '40', 'Bobot Asesmen Formatif / Tugas (%)'],
          ['DEFAULT_WEIGHT_SUMMATIVE', '60', 'Bobot Asesmen Sumatif / STS & SAS (%)'],
          ['DRIVE_FOLDER_ID', '', 'ID Folder Google Drive untuk Arsip Modul Ajar'],
          ['ADMIN_USERNAME', 'admin', 'Username Login Kepala Sekolah / Admin'],
          ['ADMIN_PASSWORD', 'kepsek123', 'Password Login Kepala Sekolah / Admin']
        ]
      },
      {
        name: '_CLASSES',
        headers: ['class_id', 'class_name', 'grade_level', 'major_phase', 'academic_year'],
        initialData: [
          ['CLS-X1', 'X-A', '10', 'Fase E (Umum)', '2026/2027'],
          ['CLS-X2', 'X-B', '10', 'Fase E (Umum)', '2026/2027'],
          ['CLS-XI-IPA1', 'XI MIPA 1', '11', 'Fase F (MIPA)', '2026/2027'],
          ['CLS-XII-IPA1', 'XII MIPA 1', '12', 'Fase F (MIPA)', '2026/2027']
        ]
      },
      {
        name: '_STUDENTS',
        headers: ['student_id', 'nis', 'nisn', 'student_name', 'gender', 'class_id', 'parent_phone'],
        initialData: [
          ['STD-001', '26001', '0081234561', 'Achmad Maulana', 'L', 'CLS-X1', '081234567801'],
          ['STD-002', '26002', '0081234562', 'Annisa Putri Rahayu', 'P', 'CLS-X1', '081234567802'],
          ['STD-003', '26003', '0081234563', 'Bagas Pratama', 'L', 'CLS-X1', '081234567803'],
          ['STD-004', '26004', '0081234564', 'Citra Dewi Lestari', 'P', 'CLS-X1', '081234567804'],
          ['STD-005', '26005', '0081234565', 'Dimas Satria Nugraha', 'L', 'CLS-X1', '081234567805'],
          ['STD-006', '26006', '0081234566', 'Farah Nabilah', 'P', 'CLS-X2', '081234567806'],
          ['STD-007', '26007', '0081234567', 'Gilang Ramadhan', 'L', 'CLS-X2', '081234567807']
        ]
      },
      {
        name: '_SUBJECTS',
        headers: ['subject_id', 'subject_name', 'grade_level', 'weight_formative', 'weight_summative'],
        initialData: [
          ['SBJ-BIO-10', 'Biologi', '10', 40, 60],
          ['SBJ-BIO-11', 'Biologi Peminatan', '11', 40, 60],
          ['SBJ-BIO-12', 'Biologi Lanjutan', '12', 40, 60],
          ['SBJ-IPA-TERPADU', 'Projek IPAS', '10', 50, 50]
        ]
      },
      {
        name: '_JOURNALS',
        headers: ['journal_id', 'date', 'time_slot', 'class_id', 'subject_id', 'topic_cp_tp', 'activities', 'reflection', 'status'],
        initialData: [
          [
            'JRN-20261020-001',
            '2026-10-20',
            'Jam 1-3 (07.00 - 09.15)',
            'CLS-X1',
            'SBJ-BIO-10',
            'TP 10.3: Menganalisis Keanekaragaman Hayati Indonesia & Ancaman Kepunahannya',
            'Diskusi kelompok telaah studi kasus ekosistem hutan hujan tropis dan penyusunan peta konsep.',
            'Mayoritas siswa aktif berdiskusi. 2 siswa perlu pendampingan membaca grafik ekosistem.',
            'Terlaksana'
          ]
        ]
      },
      {
        name: '_ATTENDANCE',
        headers: ['attendance_id', 'date', 'class_id', 'subject_id', 'student_id', 'status', 'notes'],
        initialData: [
          ['ATT-20261020-001', '2026-10-20', 'CLS-X1', 'SBJ-BIO-10', 'STD-001', 'H', 'Tepat waktu'],
          ['ATT-20261020-002', '2026-10-20', 'CLS-X1', 'SBJ-BIO-10', 'STD-002', 'H', 'Tepat waktu'],
          ['ATT-20261020-003', '2026-10-20', 'CLS-X1', 'SBJ-BIO-10', 'STD-003', 'S', 'Surat dokter terlampir'],
          ['ATT-20261020-004', '2026-10-20', 'CLS-X1', 'SBJ-BIO-10', 'STD-004', 'H', 'Tepat waktu'],
          ['ATT-20261020-005', '2026-10-20', 'CLS-X1', 'SBJ-BIO-10', 'STD-005', 'I', 'Izin urusan keluarga']
        ]
      },
      {
        name: '_ASSESSMENTS',
        headers: ['assessment_id', 'class_id', 'subject_id', 'student_id', 'type', 'score', 'date', 'notes'],
        initialData: [
          ['ASM-001', 'CLS-X1', 'SBJ-BIO-10', 'STD-001', 'Formatif_1', 88, '2026-10-15', 'Tugas Peta Konsep'],
          ['ASM-002', 'CLS-X1', 'SBJ-BIO-10', 'STD-002', 'Formatif_1', 92, '2026-10-15', 'Tugas Peta Konsep'],
          ['ASM-003', 'CLS-X1', 'SBJ-BIO-10', 'STD-003', 'Formatif_1', 75, '2026-10-15', 'Tugas Peta Konsep'],
          ['ASM-004', 'CLS-X1', 'SBJ-BIO-10', 'STD-004', 'Formatif_1', 95, '2026-10-15', 'Tugas Peta Konsep'],
          ['ASM-005', 'CLS-X1', 'SBJ-BIO-10', 'STD-005', 'Formatif_1', 80, '2026-10-15', 'Tugas Peta Konsep']
        ]
      },
      {
        name: '_BEHAVIOR',
        headers: ['behavior_id', 'date', 'student_id', 'class_id', 'dimension_category', 'description', 'follow_up'],
        initialData: [
          [
            'BHV-001',
            '2026-10-20',
            'STD-001',
            'CLS-X1',
            'Gotong Royong',
            'Membantu temannya yang kesulitan dalam menyiapkan preparat mikroskop.',
            'Diberikan apresiasi di depan kelas sebagai contoh pembiasaan positif.'
          ]
        ]
      },
      {
        name: '_DOCUMENTS',
        headers: ['doc_id', 'title', 'category', 'grade_level', 'file_url', 'file_id', 'upload_date'],
        initialData: [
          [
            'DOC-001',
            'Modul Ajar Bab 1 - Keanekaragaman Hayati',
            'Modul Ajar',
            '10',
            'https://drive.google.com',
            '',
            '2026-10-01'
          ]
        ]
      },
      {
        name: '_TEACHERS',
        headers: ['teacher_id', 'nip', 'teacher_name', 'email', 'subject_name', 'phone', 'status', 'username', 'password', 'role'],
        initialData: [
          ['TCH-001', '19850512 201001 1 008', 'Budi Santoso, S.Pd., M.Pd.', 'budi.santoso@guru.sma.belajar.id', 'Biologi', '081234567890', 'Aktif', 'guru_budi', 'guru123', 'guru'],
          ['TCH-002', '19880920 201402 2 004', 'Dewi Sartika, S.Pd.', 'dewi.sartika@guru.sma.belajar.id', 'Matematika', '081234567891', 'Aktif', 'guru_dewi', 'guru123', 'guru'],
          ['TCH-003', '19920110 201903 1 007', 'Rizky Pratama, M.Kom.', 'rizky.pratama@guru.sma.belajar.id', 'Informatika', '081234567892', 'Aktif', 'guru_rizky', 'guru123', 'guru'],
          ['TCH-004', '19820405 200801 2 011', 'Nurul Hidayah, S.Pd.', 'nurul.hidayah@guru.sma.belajar.id', 'Bahasa Indonesia', '081234567893', 'Aktif', 'guru_nurul', 'guru123', 'guru']
        ]
      },
      {
        name: '_SUPERVISION',
        headers: ['supervision_id', 'date', 'teacher_id', 'semester', 'score_device', 'score_journal', 'score_attendance', 'score_assessment', 'final_score', 'predicate', 'feedback_headmaster', 'status_approval'],
        initialData: [
          [
            'SPV-202610-001',
            '2026-10-22',
            'TCH-001',
            'Ganjil',
            95,
            90,
            92,
            88,
            91,
            'Amat Baik',
            'Perangkat ajar sangat lengkap sesuai Kurikulum Merdeka. Jurnal terisi teratur.',
            'Disetujui'
          ]
        ]
      },
      {
        name: '_USERS',
        headers: ['user_id', 'username', 'password', 'full_name', 'nip', 'role', 'subject_name', 'email', 'status', 'created_at'],
        initialData: [
          ['USR-000', 'admin', 'kepsek123', 'Dr. Hj. Siti Rahma, M.M.', '19760315 200212 2 003', 'kepsek', 'Kepala Sekolah', 'kepsek@sma1.sch.id', 'Aktif', '2026-10-22'],
          ['USR-001', 'guru_budi', 'guru123', 'Budi Santoso, S.Pd., M.Pd.', '19850512 201001 1 008', 'guru', 'Biologi', 'budi.santoso@guru.sma.belajar.id', 'Aktif', '2026-10-22'],
          ['USR-002', 'guru_dewi', 'guru123', 'Dewi Sartika, S.Pd.', '19880920 201402 2 004', 'guru', 'Matematika', 'dewi.sartika@guru.sma.belajar.id', 'Aktif', '2026-10-22'],
          ['USR-003', 'guru_rizky', 'guru123', 'Rizky Pratama, M.Kom.', '19920110 201903 1 007', 'guru', 'Informatika', 'rizky.pratama@guru.sma.belajar.id', 'Aktif', '2026-10-22'],
          ['USR-004', 'guru_nurul', 'guru123', 'Nurul Hidayah, S.Pd.', '19820405 200801 2 011', 'guru', 'Bahasa Indonesia', 'nurul.hidayah@guru.sma.belajar.id', 'Aktif', '2026-10-22']
        ]
      }
    ];

    schemas.forEach(schema => {
      let sheet = ss.getSheetByName(schema.name);
      if (!sheet) {
        sheet = ss.insertSheet(schema.name);
      }

      // Cek apakah header sudah ada
      if (sheet.getLastRow() === 0) {
        // Tulis header
        sheet.getRange(1, 1, 1, schema.headers.length).setValues([schema.headers]);
        
        // Format baris header (Warna Teal #0F766E dengan teks putih bold)
        const headerRange = sheet.getRange(1, 1, 1, schema.headers.length);
        headerRange.setBackground('#0F766E');
        headerRange.setFontColor('#FFFFFF');
        headerRange.setFontWeight('bold');
        sheet.setFrozenRows(1);

        // Masukkan data awal jika ada
        if (schema.initialData && schema.initialData.length > 0) {
          sheet.getRange(2, 1, schema.initialData.length, schema.headers.length).setValues(schema.initialData);
        }

        // Auto-fit kolom
        for (let col = 1; col <= schema.headers.length; col++) {
          sheet.autoResizeColumn(col);
        }
      }
    });

    // Rapikan sheet bawaan "Sheet1" jika kosong
    const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
    if (defaultSheet && defaultSheet.getLastRow() === 0 && ss.getSheets().length > 1) {
      ss.deleteSheet(defaultSheet);
    }

    return successResponse({ tablesCreated: schemas.map(s => s.name) }, 'Inisialisasi database SiAGU berhasil');
  } catch (err) {
    return errorResponse('Gagal menginisialisasi database: ' + err.message, err.stack);
  } finally {
    lock.releaseLock();
  }
}
