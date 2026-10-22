/**
 * SiAGU — AssessmentService.js
 * Manajemen Penilaian, Bobot Asesmen, dan Leger Nilai Otomatis
 */

/**
 * Mengambil seluruh data penilaian untuk kelas dan mapel tertentu
 */
function getAssessments(classId, subjectId) {
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_ASSESSMENTS');
    if (!sheet || sheet.getLastRow() <= 1) return successResponse([]);

    const data = sheet.getDataRange().getValues();
    const assessments = [];

    for (let i = 1; i < data.length; i++) {
      const rowClassId = data[i][1];
      const rowSubjectId = data[i][2];

      if (rowClassId === classId && (!subjectId || rowSubjectId === subjectId)) {
        let dateVal = data[i][6];
        if (dateVal instanceof Date) {
          dateVal = Utilities.formatDate(dateVal, 'Asia/Jakarta', 'yyyy-MM-dd');
        }

        assessments.push({
          assessmentId: data[i][0],
          classId: rowClassId,
          subjectId: rowSubjectId,
          studentId: data[i][3],
          type: data[i][4],
          score: Number(data[i][5]) || 0,
          date: dateVal,
          notes: data[i][7] || ''
        });
      }
    }

    return successResponse(assessments);
  } catch (err) {
    return errorResponse('Gagal mengambil data penilaian: ' + err.message);
  }
}

/**
 * Menyimpan nilai satu kolom asesmen secara massal (Batch Write)
 * @param {Array} scores - Array of { studentId, score, notes }
 */
function saveAssessmentBatch(classId, subjectId, type, scores) {
  const lock = LockService.getScriptLock();
  lock.tryLock(25000);

  try {
    const ss = getDatabaseSpreadsheet();
    let sheet = ss.getSheetByName('_ASSESSMENTS');
    if (!sheet) {
      initDatabaseSchema();
      sheet = ss.getSheetByName('_ASSESSMENTS');
    }

    const data = sheet.getDataRange().getValues();
    const rowsToKeep = [];
    const todayStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');

    // Filter keluar data lama dengan kombinasi classId, subjectId, type yang sama
    if (data.length > 1) {
      for (let i = 1; i < data.length; i++) {
        const rowClassId = data[i][1];
        const rowSubjectId = data[i][2];
        const rowType = data[i][4];

        if (!(rowClassId === classId && rowSubjectId === subjectId && rowType === type)) {
          rowsToKeep.push(data[i]);
        }
      }
    }

    // Siapkan baris nilai baru
    const newRows = scores.map(s => [
      'ASM-' + Utilities.getUuid().substring(0, 8).toUpperCase(),
      sanitizeForSheet(classId),
      sanitizeForSheet(subjectId),
      sanitizeForSheet(s.studentId),
      sanitizeForSheet(type),
      Math.min(100, Math.max(0, Number(s.score) || 0)),
      todayStr,
      sanitizeForSheet(s.notes || '')
    ]);

    // Bersihkan dan tulis kembali
    if (sheet.getLastRow() > 1) {
      sheet.deleteRows(2, sheet.getLastRow() - 1);
    }

    const allRows = rowsToKeep.concat(newRows);
    if (allRows.length > 0) {
      sheet.getRange(2, 1, allRows.length, 8).setValues(allRows);
    }

    return successResponse({ totalSaved: newRows.length }, `Nilai ${type} berhasil disimpan`);
  } catch (err) {
    return errorResponse('Gagal menyimpan nilai batch: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menghasilkan Data Matriks Leger Nilai Terpadu
 * Menghitung Rata Formatif, Rata Sumatif, Nilai Akhir (NA), Predikat, dan Deskripsi
 */
function getLegerData(classId, subjectId) {
  try {
    const ss = getDatabaseSpreadsheet();
    
    // 1. Ambil daftar siswa kelas
    const studentRes = getStudents(classId);
    const students = studentRes.data || [];

    // 2. Ambil bobot mapel
    let weightFormative = 40;
    let weightSummative = 60;
    const sbjSheet = ss.getSheetByName('_SUBJECTS');
    if (sbjSheet && sbjSheet.getLastRow() > 1) {
      const sbjData = sbjSheet.getDataRange().getValues();
      for (let i = 1; i < sbjData.length; i++) {
        if (sbjData[i][0] === subjectId) {
          weightFormative = Number(sbjData[i][3]) || 40;
          weightSummative = Number(sbjData[i][4]) || 60;
          break;
        }
      }
    }

    // 3. Ambil seluruh record nilai
    const asmRes = getAssessments(classId, subjectId);
    const rawAssessments = asmRes.data || [];

    // Kelompokkan per siswa
    const studentScoreMap = {};
    students.forEach(s => {
      studentScoreMap[s.studentId] = {
        formatif: [],
        sumatif: [],
        scoresByType: {}
      };
    });

    rawAssessments.forEach(a => {
      if (studentScoreMap[a.studentId]) {
        studentScoreMap[a.studentId].scoresByType[a.type] = a.score;
        if (a.type.toLowerCase().startsWith('formatif')) {
          studentScoreMap[a.studentId].formatif.push(a.score);
        } else {
          studentScoreMap[a.studentId].sumatif.push(a.score);
        }
      }
    });

    // 4. Kalkulasi Nilai Akhir & Deskripsi Kompetensi
    const legerRows = students.map(s => {
      const record = studentScoreMap[s.studentId] || { formatif: [], sumatif: [], scoresByType: {} };
      
      const avgForm = record.formatif.length > 0 
        ? Math.round(record.formatif.reduce((a, b) => a + b, 0) / record.formatif.length) 
        : 0;

      const avgSum = record.sumatif.length > 0
        ? Math.round(record.sumatif.reduce((a, b) => a + b, 0) / record.sumatif.length)
        : 0;

      // Hitung Nilai Akhir (NA)
      let finalScore = 0;
      if (avgForm > 0 || avgSum > 0) {
        finalScore = Math.round((avgForm * (weightFormative / 100)) + (avgSum * (weightSummative / 100)));
      }

      // Tentukan Predikat
      let predikat = 'D';
      let deskripsi = 'Perlu pendampingan lebih lanjut dalam memahami materi pembelajaran.';

      if (finalScore >= 90) {
        predikat = 'A';
        deskripsi = 'Menunjukkan penguasaan materi yang sangat istimewa dan mampu bernalar kritis secara mandiri.';
      } else if (finalScore >= 80) {
        predikat = 'B';
        deskripsi = 'Menunjukkan penguasaan kompetensi materi dengan baik dan aktif berkolaborasi.';
      } else if (finalScore >= 70) {
        predikat = 'C';
        deskripsi = 'Cukup menguasai kompetensi dasar materi dan mampu menyelesaikan tugas terstruktur.';
      }

      return {
        studentId: s.studentId,
        nis: s.nis,
        studentName: s.studentName,
        scores: record.scoresByType,
        avgFormative: avgForm,
        avgSummative: avgSum,
        finalScore: finalScore,
        predikat: predikat,
        deskripsi: deskripsi
      };
    });

    return successResponse({
      classId,
      subjectId,
      weightFormative,
      weightSummative,
      rows: legerRows
    });
  } catch (err) {
    return errorResponse('Gagal menghasilkan leger nilai: ' + err.message);
  }
}
