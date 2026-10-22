/**
 * SiAGU — AttendanceService.js
 * Manajemen Presensi Siswa & Rekap Kehadiran Otomatis
 */

/**
 * Mengambil data presensi untuk sesi pertemuan tertentu
 */
function getAttendanceSession(classId, date, subjectId) {
  try {
    const ss = getDatabaseSpreadsheet();
    
    // 1. Ambil seluruh siswa aktif di kelas tersebut
    const studentRes = getStudents(classId);
    const students = studentRes.data || [];

    // 2. Cek apakah sudah ada catatan presensi di tanggal & mapel tersebut
    const sheet = ss.getSheetByName('_ATTENDANCE');
    const existingMap = {};

    if (sheet && sheet.getLastRow() > 1) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        let rowDate = data[i][1];
        if (rowDate instanceof Date) {
          rowDate = Utilities.formatDate(rowDate, 'Asia/Jakarta', 'yyyy-MM-dd');
        }

        const rowClassId = data[i][2];
        const rowSubjectId = data[i][3];
        const rowStudentId = data[i][4];

        if (rowDate === date && rowClassId === classId && (!subjectId || rowSubjectId === subjectId)) {
          existingMap[rowStudentId] = {
            attendanceId: data[i][0],
            status: data[i][5] || 'H',
            notes: data[i][6] || ''
          };
        }
      }
    }

    // Gabungkan siswa dengan status presensi
    const sessionList = students.map(s => {
      const existing = existingMap[s.studentId];
      return {
        studentId: s.studentId,
        nis: s.nis,
        studentName: s.studentName,
        gender: s.gender,
        classId: s.classId,
        status: existing ? existing.status : 'H', // Default Hadir
        notes: existing ? existing.notes : ''
      };
    });

    return successResponse({
      classId,
      date,
      subjectId,
      isRecorded: Object.keys(existingMap).length > 0,
      students: sessionList
    });
  } catch (err) {
    return errorResponse('Gagal memuat sesi presensi: ' + err.message);
  }
}

/**
 * Menyimpan seluruh baris presensi satu kelas sekaligus (Batch Write)
 * @param {Array} records - Array of { studentId, status, notes }
 */
function saveAttendanceBatch(classId, date, subjectId, records) {
  const lock = LockService.getScriptLock();
  lock.tryLock(25000);

  try {
    const ss = getDatabaseSpreadsheet();
    let sheet = ss.getSheetByName('_ATTENDANCE');
    if (!sheet) {
      initDatabaseSchema();
      sheet = ss.getSheetByName('_ATTENDANCE');
    }

    const data = sheet.getDataRange().getValues();
    const rowsToKeep = [];

    // Filter keluar data lama pada tanggal, kelas, dan mapel yang sama
    // (Simulasi idempotent upsert untuk 1 sesi pertemuan)
    if (data.length > 1) {
      for (let i = 1; i < data.length; i++) {
        let rowDate = data[i][1];
        if (rowDate instanceof Date) {
          rowDate = Utilities.formatDate(rowDate, 'Asia/Jakarta', 'yyyy-MM-dd');
        }
        const rowClassId = data[i][2];
        const rowSubjectId = data[i][3];

        if (!(rowDate === date && rowClassId === classId && rowSubjectId === subjectId)) {
          rowsToKeep.push(data[i]);
        }
      }
    }

    // Siapkan baris baru dari records yang dikirim
    const newRows = records.map(r => [
      'ATT-' + Utilities.getUuid().substring(0, 8).toUpperCase(),
      sanitizeForSheet(date),
      sanitizeForSheet(classId),
      sanitizeForSheet(subjectId || 'DEFAULT'),
      sanitizeForSheet(r.studentId),
      sanitizeForSheet(r.status || 'H'),
      sanitizeForSheet(r.notes || '')
    ]);

    // Hapus isi sheet lama kecuali header
    if (sheet.getLastRow() > 1) {
      sheet.deleteRows(2, sheet.getLastRow() - 1);
    }

    // Gabungkan kembali data lama yang dipertahankan + baris sesi baru
    const allRows = rowsToKeep.concat(newRows);
    if (allRows.length > 0) {
      sheet.getRange(2, 1, allRows.length, 7).setValues(allRows);
    }

    return successResponse({ totalSaved: newRows.length }, 'Presensi kelas berhasil disimpan');
  } catch (err) {
    return errorResponse('Gagal menyimpan presensi batch: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Rekapitulasi Kehadiran Siswa per Kelas
 */
function getAttendanceSummary(classId) {
  try {
    const ss = getDatabaseSpreadsheet();
    const studentRes = getStudents(classId);
    const students = studentRes.data || [];

    const sheet = ss.getSheetByName('_ATTENDANCE');
    if (!sheet || sheet.getLastRow() <= 1) {
      const emptySummary = students.map(s => ({
        studentId: s.studentId,
        nis: s.nis,
        studentName: s.studentName,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpa: 0,
        totalPertemuan: 0,
        persentase: 100
      }));
      return successResponse(emptySummary);
    }

    const data = sheet.getDataRange().getValues();
    const statsMap = {};
    students.forEach(s => {
      statsMap[s.studentId] = { hadir: 0, sakit: 0, izin: 0, alpa: 0, total: 0 };
    });

    for (let i = 1; i < data.length; i++) {
      const rowClassId = data[i][2];
      const studentId = data[i][4];
      const status = data[i][5];

      if (rowClassId === classId && statsMap[studentId]) {
        statsMap[studentId].total++;
        if (status === 'H') statsMap[studentId].hadir++;
        else if (status === 'S') statsMap[studentId].sakit++;
        else if (status === 'I') statsMap[studentId].izin++;
        else if (status === 'A') statsMap[studentId].alpa++;
      }
    }

    const summary = students.map(s => {
      const st = statsMap[s.studentId] || { hadir: 0, sakit: 0, izin: 0, alpa: 0, total: 0 };
      const pct = st.total > 0 ? Math.round((st.hadir / st.total) * 100) : 100;
      return {
        studentId: s.studentId,
        nis: s.nis,
        studentName: s.studentName,
        hadir: st.hadir,
        sakit: st.sakit,
        izin: st.izin,
        alpa: st.alpa,
        totalPertemuan: st.total,
        persentase: pct
      };
    });

    return successResponse(summary);
  } catch (err) {
    return errorResponse('Gagal mengambil rekap presensi: ' + err.message);
  }
}
