/**
 * SiAGU — BehaviorService.js
 * Manajemen Catatan Sikap, Insiden Perilaku, dan Dimensi Profil Pelajar Pancasila (P3)
 */

function getBehaviorNotes(classId = null, studentId = null) {
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_BEHAVIOR');
    if (!sheet || sheet.getLastRow() <= 1) return successResponse([]);

    const data = sheet.getDataRange().getValues();
    const notes = [];

    // Map siswa untuk nama
    const studentRes = getStudents(classId);
    const studentMap = {};
    (studentRes.data || []).forEach(s => studentMap[s.studentId] = s.studentName);

    for (let i = 1; i < data.length; i++) {
      const rowClassId = data[i][3];
      const rowStudentId = data[i][2];

      if ((!classId || rowClassId === classId) && (!studentId || rowStudentId === studentId)) {
        let dateVal = data[i][1];
        if (dateVal instanceof Date) {
          dateVal = Utilities.formatDate(dateVal, 'Asia/Jakarta', 'yyyy-MM-dd');
        }

        notes.push({
          behaviorId: data[i][0],
          date: dateVal,
          studentId: rowStudentId,
          studentName: studentMap[rowStudentId] || rowStudentId,
          classId: rowClassId,
          dimension: data[i][4],
          description: data[i][5],
          followUp: data[i][6] || ''
        });
      }
    }

    notes.reverse();
    return successResponse(notes);
  } catch (err) {
    return errorResponse('Gagal mengambil catatan sikap: ' + err.message);
  }
}

function saveBehaviorNote(note) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_BEHAVIOR');
    if (!sheet) throw new Error('Sheet _BEHAVIOR tidak ditemukan.');

    const behaviorId = note.behaviorId || 'BHV-' + Utilities.getUuid().substring(0, 8).toUpperCase();
    const rowData = [
      sanitizeForSheet(behaviorId),
      sanitizeForSheet(note.date),
      sanitizeForSheet(note.studentId),
      sanitizeForSheet(note.classId),
      sanitizeForSheet(note.dimension || 'Gotong Royong'),
      sanitizeForSheet(note.description),
      sanitizeForSheet(note.followUp || '')
    ];

    const data = sheet.getDataRange().getValues();
    let updated = false;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === behaviorId) {
        sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
        updated = true;
        break;
      }
    }

    if (!updated) {
      sheet.appendRow(rowData);
    }

    return successResponse({ behaviorId }, 'Catatan sikap berhasil dicatat');
  } catch (err) {
    return errorResponse('Gagal menyimpan catatan sikap: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

function deleteBehaviorNote(behaviorId) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_BEHAVIOR');
    if (!sheet) throw new Error('Sheet _BEHAVIOR tidak ditemukan.');

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === behaviorId) {
        sheet.deleteRow(i + 1);
        return successResponse(null, 'Catatan sikap berhasil dihapus');
      }
    }
    return errorResponse('Catatan tidak ditemukan');
  } catch (err) {
    return errorResponse('Gagal menghapus catatan sikap: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}
