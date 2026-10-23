/**
 * SiAGU — MasterService.js
 * Manajemen Data Rombel (Kelas), Siswa, dan Mata Pelajaran
 */

// ==========================================
// KELAS & ROMBEL (SD NEGERI SUMBEREJO 04)
// ==========================================

function getClasses() {
  try {
    const ss = getDatabaseSpreadsheet();
    let sheet = ss.getSheetByName('_CLASSES');
    if (!sheet || sheet.getLastRow() <= 1) {
      initDatabaseSchema();
      sheet = ss.getSheetByName('_CLASSES');
    }

    const classes = [];
    if (sheet && sheet.getLastRow() > 1) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (!data[i][0] && !data[i][1]) continue;
        classes.push({
          classId: String(data[i][0]).trim(),
          className: String(data[i][1]).trim(),
          gradeLevel: String(data[i][2]).trim(),
          majorPhase: String(data[i][3]).trim(),
          academicYear: String(data[i][4] || '2026/2027').trim()
        });
      }
    }

    // Default rombel SD jika sheet masih kosong
    if (classes.length === 0) {
      const defaultClasses = [
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
      ];
      if (sheet) {
        sheet.getRange(2, 1, defaultClasses.length, 5).setValues(defaultClasses);
      }
      defaultClasses.forEach(c => {
        classes.push({
          classId: c[0],
          className: c[1],
          gradeLevel: c[2],
          majorPhase: c[3],
          academicYear: c[4]
        });
      });
    }

    return successResponse(classes);
  } catch (err) {
    return errorResponse('Gagal mengambil data kelas: ' + err.message);
  }
}

// ==========================================
// KONFIGURASI PROFIL SEKOLAH & KURIKULUM
// ==========================================

function getConfig() {
  try {
    const ss = getDatabaseSpreadsheet();
    let sheet = ss.getSheetByName('_CONFIG');
    if (!sheet || sheet.getLastRow() <= 1) {
      initDatabaseSchema();
      sheet = ss.getSheetByName('_CONFIG');
    }
    const config = {};
    if (sheet && sheet.getLastRow() > 1) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0]) {
          config[String(data[i][0]).trim()] = String(data[i][1] !== undefined ? data[i][1] : '').trim();
        }
      }
    }
    return successResponse(config);
  } catch (err) {
    return errorResponse('Gagal mengambil konfigurasi: ' + err.message);
  }
}

function saveConfig(configMap) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const ss = getDatabaseSpreadsheet();
    let sheet = ss.getSheetByName('_CONFIG');
    if (!sheet) {
      initDatabaseSchema();
      sheet = ss.getSheetByName('_CONFIG');
    }
    const data = sheet.getDataRange().getValues();
    const existingKeys = {};
    for (let i = 1; i < data.length; i++) {
      existingKeys[data[i][0]] = i + 1;
    }
    for (const key in configMap) {
      const val = configMap[key];
      if (existingKeys[key]) {
        sheet.getRange(existingKeys[key], 2).setValue(sanitizeForSheet(val));
      } else {
        sheet.appendRow([sanitizeForSheet(key), sanitizeForSheet(val), '']);
      }
    }
    return successResponse(configMap, 'Konfigurasi berhasil disimpan');
  } catch (err) {
    return errorResponse('Gagal menyimpan konfigurasi: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Payload Inisialisasi Aplikasi Terpadu (Single Request)
 * Mengembalikan Config, Rombel Kelas SD, dan Daftar Mapel sekaligus
 */
function getInitialAppPayload() {
  try {
    const configRes = getConfig();
    const classesRes = getClasses();
    const subjectsRes = getSubjects();
    return successResponse({
      config: configRes.data || {},
      classes: classesRes.data || [],
      subjects: subjectsRes.data || []
    });
  } catch (err) {
    return errorResponse('Gagal memuat konfigurasi awal: ' + err.message);
  }
}

function saveClass(cls) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_CLASSES');
    if (!sheet) throw new Error('Sheet _CLASSES tidak ditemukan.');

    const classId = cls.classId || 'CLS-' + Utilities.getUuid().substring(0, 8).toUpperCase();
    const rowData = [
      sanitizeForSheet(classId),
      sanitizeForSheet(cls.className),
      sanitizeForSheet(cls.gradeLevel),
      sanitizeForSheet(cls.majorPhase || 'Fase A/B/C'),
      sanitizeForSheet(cls.academicYear || '2026/2027')
    ];

    const data = sheet.getDataRange().getValues();
    let updated = false;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === classId) {
        sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
        updated = true;
        break;
      }
    }

    if (!updated) {
      sheet.appendRow(rowData);
    }

    return successResponse({ classId }, 'Data kelas berhasil disimpan');
  } catch (err) {
    return errorResponse('Gagal menyimpan kelas: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

function deleteClass(classId) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_CLASSES');
    if (!sheet) throw new Error('Sheet _CLASSES tidak ditemukan.');

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === classId) {
        sheet.deleteRow(i + 1);
        return successResponse(null, 'Kelas berhasil dihapus');
      }
    }
    return errorResponse('Kelas tidak ditemukan');
  } catch (err) {
    return errorResponse('Gagal menghapus kelas: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

// ==========================================
// DATA SISWA
// ==========================================

function getStudents(classId = null) {
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_STUDENTS');
    if (!sheet || sheet.getLastRow() <= 1) return successResponse([]);

    const data = sheet.getDataRange().getValues();
    const students = [];
    const target = classId ? String(classId).trim().toLowerCase() : null;

    for (let i = 1; i < data.length; i++) {
      const studentClassId = String(data[i][5] || '').trim();
      if (!target || 
          studentClassId.toLowerCase() === target || 
          studentClassId.toLowerCase().replace(/[\s\-_]/g, '') === target.replace(/[\s\-_]/g, '')) {
        students.push({
          studentId: data[i][0],
          nis: data[i][1],
          nisn: data[i][2],
          studentName: data[i][3],
          gender: data[i][4],
          classId: studentClassId,
          parentPhone: data[i][6]
        });
      }
    }

    // Urutkan alfabetis nama siswa
    students.sort((a, b) => String(a.studentName || '').localeCompare(String(b.studentName || '')));

    return successResponse(students);
  } catch (err) {
    return errorResponse('Gagal mengambil data siswa: ' + err.message);
  }
}

/**
 * Alias getStudentsByClass untuk kompatibilitas cetak barcode presensi
 */
function getStudentsByClass(classId) {
  return getStudents(classId);
}

function saveStudent(student) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_STUDENTS');
    if (!sheet) throw new Error('Sheet _STUDENTS tidak ditemukan.');

    const studentId = student.studentId || 'STD-' + Utilities.getUuid().substring(0, 8).toUpperCase();
    const rowData = [
      sanitizeForSheet(studentId),
      sanitizeForSheet(student.nis || ''),
      sanitizeForSheet(student.nisn || ''),
      sanitizeForSheet(student.studentName),
      sanitizeForSheet(student.gender || 'L'),
      sanitizeForSheet(student.classId),
      sanitizeForSheet(student.parentPhone || '')
    ];

    const data = sheet.getDataRange().getValues();
    let updated = false;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === studentId) {
        sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
        updated = true;
        break;
      }
    }

    if (!updated) {
      sheet.appendRow(rowData);
    }

    return successResponse({ studentId }, 'Data siswa berhasil disimpan');
  } catch (err) {
    return errorResponse('Gagal menyimpan siswa: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Import Massal Siswa dari File Excel atau Teks
 * Menerima array of objects [{ studentName, nisn, gender }] maupun array of string baris teks
 */
function saveBatchStudents(classId, studentList) {
  const lock = LockService.getScriptLock();
  lock.tryLock(25000);
  try {
    const ss = getDatabaseSpreadsheet();
    let sheet = ss.getSheetByName('_STUDENTS');
    if (!sheet) {
      initDatabaseSchema();
      sheet = ss.getSheetByName('_STUDENTS');
    }

    if (!classId) {
      return errorResponse('Pilih rombel / kelas tujuan terlebih dahulu.');
    }

    // Normalisasi input jika terkirim dalam format string JSON
    if (typeof studentList === 'string') {
      try {
        studentList = JSON.parse(studentList);
      } catch (e) {
        studentList = studentList.split(/\r?\n/);
      }
    }

    if (!Array.isArray(studentList)) {
      studentList = [studentList];
    }

    const rowsToInsert = [];
    studentList.forEach((item) => {
      if (!item) return;

      let name = '';
      let nisn = '';
      let gender = 'L';

      // 1. Format Object dari File Excel (SheetJS)
      if (typeof item === 'object') {
        name = String(
          item.studentName || 
          item.name || 
          item.nama || 
          item['Nama Lengkap'] || 
          item['Nama Siswa'] || 
          item['Nama'] || 
          item['nama_siswa'] || 
          ''
        ).trim();

        nisn = String(
          item.nisn || 
          item.nis || 
          item.NISN || 
          item['NISN'] || 
          item['NIS'] || 
          item['nisn_siswa'] || 
          ''
        ).trim();

        const rawGender = String(item.gender || item.jenisKelamin || item['Jenis Kelamin'] || item['L/P'] || 'L').toUpperCase().trim();
        gender = rawGender.startsWith('P') ? 'P' : 'L';
      } 
      // 2. Format String (Paste langsung / Baris Teks CSV)
      else {
        const lineStr = String(item).trim();
        if (lineStr) {
          const parts = lineStr.split(/[\t,;]/);
          name = parts[0].trim();
          if (parts.length === 2) {
            if (/^[0-9]+$/.test(parts[1].trim())) {
              nisn = parts[1].trim();
            } else {
              gender = parts[1].trim().toUpperCase() === 'P' ? 'P' : 'L';
            }
          } else if (parts.length >= 3) {
            nisn = parts[0].trim();
            name = parts[1].trim();
            gender = parts[2].trim().toUpperCase() === 'P' ? 'P' : 'L';
          }
        }
      }

      // Validasi: Jangan masukkan jika nama kosong atau baris header template
      if (name && !name.toLowerCase().includes('contoh') && !name.toLowerCase().includes('nama siswa')) {
        const studentId = 'STD-' + Utilities.getUuid().substring(0, 8).toUpperCase();
        rowsToInsert.push([
          sanitizeForSheet(studentId),
          sanitizeForSheet(nisn),
          sanitizeForSheet(nisn),
          sanitizeForSheet(name),
          gender,
          sanitizeForSheet(classId),
          ''
        ]);
      }
    });

    if (rowsToInsert.length === 0) {
      return errorResponse('Tidak ada data siswa yang valid untuk disimpan.');
    }

    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToInsert.length, 7).setValues(rowsToInsert);

    return successResponse({ totalAdded: rowsToInsert.length }, `${rowsToInsert.length} data siswa berhasil diimpor ke kelas.`);
  } catch (err) {
    return errorResponse('Gagal impor siswa massal: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

function deleteStudent(studentId) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_STUDENTS');
    if (!sheet) throw new Error('Sheet _STUDENTS tidak ditemukan.');

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === studentId) {
        sheet.deleteRow(i + 1);
        return successResponse(null, 'Data siswa berhasil dihapus');
      }
    }
    return errorResponse('Siswa tidak ditemukan');
  } catch (err) {
    return errorResponse('Gagal menghapus siswa: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

// ==========================================
// MATA PELAJARAN
// ==========================================

function getSubjects() {
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_SUBJECTS');
    if (!sheet || sheet.getLastRow() <= 1) return successResponse([]);

    const data = sheet.getDataRange().getValues();
    const subjects = [];
    for (let i = 1; i < data.length; i++) {
      subjects.push({
        subjectId: data[i][0],
        subjectName: data[i][1],
        gradeLevel: data[i][2],
        weightFormative: Number(data[i][3]) || 40,
        weightSummative: Number(data[i][4]) || 60
      });
    }
    return successResponse(subjects);
  } catch (err) {
    return errorResponse('Gagal mengambil data mapel: ' + err.message);
  }
}

function saveSubject(subject) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_SUBJECTS');
    if (!sheet) throw new Error('Sheet _SUBJECTS tidak ditemukan.');

    const subjectId = subject.subjectId || 'SBJ-' + Utilities.getUuid().substring(0, 8).toUpperCase();
    const rowData = [
      sanitizeForSheet(subjectId),
      sanitizeForSheet(subject.subjectName),
      sanitizeForSheet(subject.gradeLevel || '1'),
      Number(subject.weightFormative) || 40,
      Number(subject.weightSummative) || 60
    ];

    const data = sheet.getDataRange().getValues();
    let updated = false;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === subjectId) {
        sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
        updated = true;
        break;
      }
    }

    if (!updated) {
      sheet.appendRow(rowData);
    }

    return successResponse({ subjectId }, 'Mata pelajaran berhasil disimpan');
  } catch (err) {
    return errorResponse('Gagal menyimpan mata pelajaran: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

function deleteSubject(subjectId) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_SUBJECTS');
    if (!sheet) throw new Error('Sheet _SUBJECTS tidak ditemukan.');

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === subjectId) {
        sheet.deleteRow(i + 1);
        return successResponse(null, 'Mata pelajaran berhasil dihapus');
      }
    }
    return errorResponse('Mata pelajaran tidak ditemukan');
  } catch (err) {
    return errorResponse('Gagal menghapus mata pelajaran: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}
