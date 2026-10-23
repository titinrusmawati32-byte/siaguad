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
  // 1. Dukungan API via GET / JSONP (jika dipanggil dari Frontend GitHub / Eksternal)
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
    return handleApiRequest(e.parameter.action, args, e.parameter.callback);
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
 * Router Terpusat untuk memanggil fungsi Service di Google Apps Script (Mendukung JSON & JSONP)
 */
function handleApiRequest(action, args = [], callback = null) {
  try {
    if (!action) {
      return renderResponse({
        success: false,
        error: 'Parameter "action" wajib disertakan.'
      }, callback);
    }

    // Cari fungsi yang cocok di scope global GAS
    const fn = globalThis[action];
    if (typeof fn !== 'function') {
      return renderResponse({
        success: false,
        error: `Fungsi API "${action}" tidak ditemukan di server Google Apps Script.`
      }, callback);
    }

    // Eksekusi fungsi dan ambil hasilnya
    const result = fn.apply(null, args);
    return renderResponse(result !== undefined ? result : { success: true }, callback);

  } catch (err) {
    return renderResponse({
      success: false,
      error: err.message,
      stack: err.stack
    }, callback);
  }
}

function renderResponse(dataObj, callback) {
  const jsonStr = JSON.stringify(dataObj);
  if (callback) {
    return ContentService.createTextOutput(`${callback}(${jsonStr})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(jsonStr)
    .setMimeType(ContentService.MimeType.JSON);
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
          ['SCHOOL_NAME', 'SD NEGERI SUMBEREJO 04', 'Nama Satuan Pendidikan'],
          ['SCHOOL_NPSN', '20518385', 'Nomor Pokok Sekolah Nasional'],
          ['TEACHER_NAME', 'Siti Rahayu, S.Pd.', 'Nama Lengkap Guru Pengampu'],
          ['TEACHER_NIP', '19870815 201101 2 009', 'NIP / NUPTK Guru'],
          ['HEADMASTER_NAME', 'Supriyadi, S.Pd., M.Pd.', 'Nama Kepala Sekolah'],
          ['HEADMASTER_NIP', '19720412 199803 1 005', 'NIP Kepala Sekolah'],
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
          ['CLS-1A', 'Kelas 1-A', '1', 'Fase A', '2026/2027'],
          ['CLS-1B', 'Kelas 1-B', '1', 'Fase A', '2026/2027'],
          ['CLS-2A', 'Kelas 2-A', '2', 'Fase A', '2026/2027'],
          ['CLS-2B', 'Kelas 2-B', '2', 'Fase A', '2026/2027'],
          ['CLS-3A', 'Kelas 3-A', '3', 'Fase B', '2026/2027'],
          ['CLS-3B', 'Kelas 3-B', '3', 'Fase B', '2026/2027'],
          ['CLS-4A', 'Kelas 4-A', '4', 'Fase B', '2026/2027'],
          ['CLS-4B', 'Kelas 4-B', '4', 'Fase B', '2026/2027'],
          ['CLS-5A', 'Kelas 5-A', '5', 'Fase C', '2026/2027'],
          ['CLS-5B', 'Kelas 5-B', '5', 'Fase C', '2026/2027'],
          ['CLS-6A', 'Kelas 6-A', '6', 'Fase C', '2026/2027'],
          ['CLS-6B', 'Kelas 6-B', '6', 'Fase C', '2026/2027']
        ]
      },
      {
        name: '_STUDENTS',
        headers: ['student_id', 'nis', 'nisn', 'student_name', 'gender', 'class_id', 'parent_phone'],
        initialData: [
          ['STD-001', '0081234561', '0081234561', 'Achmad Maulana', 'L', 'CLS-4A', '081234567801'],
          ['STD-002', '0081234562', '0081234562', 'Annisa Putri Rahayu', 'P', 'CLS-4A', '081234567802'],
          ['STD-003', '0081234563', '0081234563', 'Bagas Pratama', 'L', 'CLS-4A', '081234567803'],
          ['STD-004', '0081234564', '0081234564', 'Citra Dewi Lestari', 'P', 'CLS-4A', '081234567804'],
          ['STD-005', '0081234565', '0081234565', 'Dimas Satria Nugraha', 'L', 'CLS-4A', '081234567805'],
          ['STD-006', '0081234566', '0081234566', 'Farah Nabilah', 'P', 'CLS-1A', '081234567806'],
          ['STD-007', '0081234567', '0081234567', 'Gilang Ramadhan', 'L', 'CLS-1A', '081234567807']
        ]
      },
      {
        name: '_SUBJECTS',
        headers: ['subject_id', 'subject_name', 'grade_level', 'weight_formative', 'weight_summative'],
        initialData: [
          ['SBJ-BINDO-SD', 'Bahasa Indonesia', '1, 2, 3, 4, 5, 6', 40, 60],
          ['SBJ-MTK-SD', 'Matematika', '1, 2, 3, 4, 5, 6', 40, 60],
          ['SBJ-IPAS-SD', 'IPAS (Ilmu Pengetahuan Alam & Sosial)', '3, 4, 5, 6', 40, 60],
          ['SBJ-PKN-SD', 'Pendidikan Pancasila', '1, 2, 3, 4, 5, 6', 40, 60],
          ['SBJ-PABP-SD', 'Pendidikan Agama Islam & Budi Pekerti', '1, 2, 3, 4, 5, 6', 40, 60],
          ['SBJ-PJOK-SD', 'Pendidikan Jasmani, Olahraga, & Kesehatan', '1, 2, 3, 4, 5, 6', 40, 60],
          ['SBJ-SENI-SD', 'Seni Rupa & Prakarya', '1, 2, 3, 4, 5, 6', 40, 60],
          ['SBJ-BING-SD', 'Bahasa Inggris', '1, 2, 3, 4, 5, 6', 40, 60],
          ['SBJ-MULOK-SD', 'Bahasa Jawa (Muatan Lokal)', '1, 2, 3, 4, 5, 6', 40, 60]
        ]
      },
      {
        name: '_JOURNALS',
        headers: ['journal_id', 'date', 'time_slot', 'class_id', 'subject_id', 'topic_cp_tp', 'activities', 'reflection', 'status'],
        initialData: [
          [
            'JRN-20261020-001',
            '2026-10-20',
            'Jam 1-3 (07.00 - 08.45)',
            'CLS-4A',
            'SBJ-IPAS-SD',
            'TP 4.1: Mengidentifikasi bagian tubuh tumbuhan (akar, batang, daun, bunga) dan fungsinya bagi kehidupan.',
            'Observasi tanaman di lingkungan sekolah, eksplorasi bagian akar dan daun, serta diskusi kelompok membuat diagram fungsi tumbuhan.',
            'Siswa sangat aktif melakukan pengamatan langsung pada tumbuhan di taman sekolah. Seluruh kelompok mampu membedakan jenis akar tunggang dan serabut.',
            'Terlaksana'
          ]
        ]
      },
      {
        name: '_ATTENDANCE',
        headers: ['attendance_id', 'date', 'class_id', 'subject_id', 'student_id', 'status', 'notes'],
        initialData: [
          ['ATT-20261020-001', '2026-10-20', 'CLS-4A', 'SBJ-IPAS-SD', 'STD-001', 'H', 'Tepat waktu'],
          ['ATT-20261020-002', '2026-10-20', 'CLS-4A', 'SBJ-IPAS-SD', 'STD-002', 'H', 'Tepat waktu'],
          ['ATT-20261020-003', '2026-10-20', 'CLS-4A', 'SBJ-IPAS-SD', 'STD-003', 'S', 'Surat dokter terlampir'],
          ['ATT-20261020-004', '2026-10-20', 'CLS-4A', 'SBJ-IPAS-SD', 'STD-004', 'H', 'Tepat waktu'],
          ['ATT-20261020-005', '2026-10-20', 'CLS-4A', 'SBJ-IPAS-SD', 'STD-005', 'I', 'Izin urusan keluarga']
        ]
      },
      {
        name: '_ASSESSMENTS',
        headers: ['assessment_id', 'class_id', 'subject_id', 'student_id', 'type', 'score', 'date', 'notes'],
        initialData: [
          ['ASM-001', 'CLS-4A', 'SBJ-IPAS-SD', 'STD-001', 'Formatif_1', 88, '2026-10-15', 'Tugas Diagram Bagian Tumbuhan'],
          ['ASM-002', 'CLS-4A', 'SBJ-IPAS-SD', 'STD-002', 'Formatif_1', 92, '2026-10-15', 'Tugas Diagram Bagian Tumbuhan'],
          ['ASM-003', 'CLS-4A', 'SBJ-IPAS-SD', 'STD-003', 'Formatif_1', 75, '2026-10-15', 'Tugas Diagram Bagian Tumbuhan'],
          ['ASM-004', 'CLS-4A', 'SBJ-IPAS-SD', 'STD-004', 'Formatif_1', 95, '2026-10-15', 'Tugas Diagram Bagian Tumbuhan'],
          ['ASM-005', 'CLS-4A', 'SBJ-IPAS-SD', 'STD-005', 'Formatif_1', 80, '2026-10-15', 'Tugas Diagram Bagian Tumbuhan']
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
            'CLS-4A',
            'Gotong Royong',
            'Membantu merapikan alat dan daun spesimen pengamatan bersama kelompok.',
            'Diberikan apresiasi di depan kelas sebagai teladan pembiasaan Profil Pelajar Pancasila.'
          ]
        ]
      },
      {
        name: '_DOCUMENTS',
        headers: ['doc_id', 'title', 'category', 'grade_level', 'file_url', 'file_id', 'upload_date'],
        initialData: [
          [
            'DOC-001',
            'Modul Ajar IPAS Kelas 4 - Tumbuhan Sumber Kehidupan di Bumi',
            'Modul Ajar',
            '4',
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
          ['TCH-001', '19870815 201101 2 009', 'Siti Rahayu, S.Pd.', 'siti.rahayu@guru.sd.belajar.id', 'Guru Kelas 4-A', '081234567890', 'Aktif', 'guru_siti', 'guru123', 'guru'],
          ['TCH-002', '19890321 201402 1 003', 'Ahmad Fauzi, S.Pd.', 'ahmad.fauzi@guru.sd.belajar.id', 'Guru Kelas 1-A', '081234567891', 'Aktif', 'guru_ahmad', 'guru123', 'guru'],
          ['TCH-003', '19910510 201903 1 004', 'Bambang Irawan, S.Pd.', 'bambang.irawan@guru.sd.belajar.id', 'Guru Kelas 2-A', '081234567892', 'Aktif', 'guru_bambang', 'guru123', 'guru'],
          ['TCH-004', '19930405 202012 2 008', 'Nurul Annisa, S.Pd.', 'nurul.annisa@guru.sd.belajar.id', 'Guru Kelas 3-A', '081234567893', 'Aktif', 'guru_nurul', 'guru123', 'guru'],
          ['TCH-005', '19850612 201001 2 015', 'Dewi Sartika, S.Pd.', 'dewi.sartika@guru.sd.belajar.id', 'Guru Kelas 5-A', '081234567894', 'Aktif', 'guru_dewi', 'guru123', 'guru'],
          ['TCH-006', '19820405 200801 2 011', 'Tri Wahyuni, S.Pd.', 'tri.wahyuni@guru.sd.belajar.id', 'Guru Kelas 6-A', '081234567895', 'Aktif', 'guru_tri', 'guru123', 'guru']
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
            'Perangkat ajar sangat lengkap sesuai Kurikulum Merdeka SD. Jurnal terisi teratur.',
            'Disetujui'
          ]
        ]
      },
      {
        name: '_USERS',
        headers: ['user_id', 'username', 'password', 'full_name', 'nip', 'role', 'subject_name', 'email', 'status', 'created_at'],
        initialData: [
          ['USR-000', 'admin', 'kepsek123', 'Supriyadi, S.Pd., M.Pd.', '19720412 199803 1 005', 'kepsek', 'Kepala Sekolah', 'kepsek@sdnsumberejo04.sch.id', 'Aktif', '2026-10-22'],
          ['USR-001', 'guru_siti', 'guru123', 'Siti Rahayu, S.Pd.', '19870815 201101 2 009', 'guru', 'Guru Kelas 4-A', 'siti.rahayu@guru.sd.belajar.id', 'Aktif', '2026-10-22'],
          ['USR-002', 'guru_ahmad', 'guru123', 'Ahmad Fauzi, S.Pd.', '19890321 201402 1 003', 'guru', 'Guru Kelas 1-A', 'ahmad.fauzi@guru.sd.belajar.id', 'Aktif', '2026-10-22'],
          ['USR-003', 'guru_bambang', 'guru123', 'Bambang Irawan, S.Pd.', '19910510 201903 1 004', 'guru', 'Guru Kelas 2-A', 'bambang.irawan@guru.sd.belajar.id', 'Aktif', '2026-10-22'],
          ['USR-004', 'guru_nurul', 'guru123', 'Nurul Annisa, S.Pd.', '19930405 202012 2 008', 'guru', 'Guru Kelas 3-A', 'nurul.annisa@guru.sd.belajar.id', 'Aktif', '2026-10-22'],
          ['USR-005', 'guru_dewi', 'guru123', 'Dewi Sartika, S.Pd.', '19850612 201001 2 015', 'guru', 'Guru Kelas 5-A', 'dewi.sartika@guru.sd.belajar.id', 'Aktif', '2026-10-22'],
          ['USR-006', 'guru_tri', 'guru123', 'Tri Wahyuni, S.Pd.', '19820405 200801 2 011', 'guru', 'Guru Kelas 6-A', 'tri.wahyuni@guru.sd.belajar.id', 'Aktif', '2026-10-22']
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

/**
 * Reset & Inisialisasi Ulang Spreadsheet ke Format SD NEGERI SUMBEREJO 04
 * Jalankan fungsi ini sekali dari editor Google Apps Script jika spreadsheet Anda masih berisi data lama SMA
 */
function resetDatabaseToSD() {
  const ss = getDatabaseSpreadsheet();
  const sheetsToReset = ['_CONFIG', '_CLASSES', '_STUDENTS', '_SUBJECTS', '_JOURNALS', '_ATTENDANCE', '_ASSESSMENTS', '_BEHAVIOR', '_DOCUMENTS', '_TEACHERS', '_SUPERVISION', '_USERS'];
  sheetsToReset.forEach(name => {
    const s = ss.getSheetByName(name);
    if (s && ss.getSheets().length > 1) {
      try { ss.deleteSheet(s); } catch (e) {}
    }
  });
  return initDatabaseSchema();
}
