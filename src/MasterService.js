/**
 * SiAGU — MasterService.js
 * Manajemen Data Rombel (Kelas), Siswa, dan Mata Pelajaran
 */

// ==========================================
// KELAS & ROMBEL
// ==========================================

function getClasses() {
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_CLASSES');
    if (!sheet || sheet.getLastRow() <= 1) return successResponse([]);

    const data = sheet.getDataRange().getValues();
    const classes = [];
    for (let i = 1; i < data.length; i++) {
      classes.push({
        classId: data[i][0],
        className: data[i][1],
        gradeLevel: data[i][2],
        majorPhase: data[i][3],
        academicYear: data[i][4]
      });
    }
    return successResponse(classes);
  } catch (err) {
    return errorResponse('Gagal mengambil data kelas: ' + err.message);
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

    for (let i = 1; i < data.length; i++) {
      const studentClassId = data[i][5];
      if (!classId || studentClassId === classId) {
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
    students.sort((a, b) => a.studentName.localeCompare(b.studentName));

    return successResponse(students);
  } catch (err) {
    return errorResponse('Gagal mengambil data siswa: ' + err.message);
  }
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
 */
function saveBatchStudents(classId, studentList) {
  const lock = LockService.getScriptLock();
  lock.tryLock(25000);
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_STUDENTS');
    if (!sheet) throw new Error('Sheet _STUDENTS tidak ditemukan.');

    const rowsToInsert = [];
    studentList.forEach((item, idx) => {
      let name = '';
      let nisn = '';
      let gender = 'L';

      if (typeof item === 'object' && item !== null) {
        name = String(item.studentName || item.name || item.nama || item['Nama Lengkap'] || item['Nama Siswa'] || '').trim();
        nisn = String(item.nisn || item.nis || item.NISN || item['NISN'] || '').trim();
        gender = String(item.gender || item.jenisKelamin || item['Jenis Kelamin'] || 'L').toUpperCase().startsWith('P') ? 'P' : 'L';
      } else if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed) {
          const parts = trimmed.split(/[\t,;]/);
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

      if (name) {
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

    if (rowsToInsert.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsToInsert.length, 7).setValues(rowsToInsert);
    }

    return successResponse({ totalAdded: rowsToInsert.length }, `${rowsToInsert.length} data siswa berhasil diimpor`);
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
