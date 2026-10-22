/**
 * SiAGU — JournalService.js
 * Manajemen Jurnal Mengajar & Agenda Harian Guru
 */

function getJournals(filterClassId = null) {
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_JOURNALS');
    if (!sheet || sheet.getLastRow() <= 1) return successResponse([]);

    const data = sheet.getDataRange().getValues();
    const journals = [];

    // Map kelas & mapel
    const classMap = {};
    const clsSheet = ss.getSheetByName('_CLASSES');
    if (clsSheet && clsSheet.getLastRow() > 1) {
      const clsData = clsSheet.getDataRange().getValues();
      for (let i = 1; i < clsData.length; i++) classMap[clsData[i][0]] = clsData[i][1];
    }

    const sbjMap = {};
    const sbjSheet = ss.getSheetByName('_SUBJECTS');
    if (sbjSheet && sbjSheet.getLastRow() > 1) {
      const sbjData = sbjSheet.getDataRange().getValues();
      for (let i = 1; i < sbjData.length; i++) sbjMap[sbjData[i][0]] = sbjData[i][1];
    }

    for (let i = 1; i < data.length; i++) {
      const rowClassId = data[i][3];
      if (!filterClassId || rowClassId === filterClassId) {
        let dateVal = data[i][1];
        if (dateVal instanceof Date) {
          dateVal = Utilities.formatDate(dateVal, 'Asia/Jakarta', 'yyyy-MM-dd');
        }

        journals.push({
          journalId: data[i][0],
          date: dateVal,
          timeSlot: data[i][2],
          classId: rowClassId,
          className: classMap[rowClassId] || rowClassId,
          subjectId: data[i][4],
          subjectName: sbjMap[data[i][4]] || data[i][4],
          topic: data[i][5],
          activities: data[i][6],
          reflection: data[i][7],
          status: data[i][8] || 'Terlaksana'
        });
      }
    }

    // Urutkan dari tanggal terbaru
    journals.reverse();

    return successResponse(journals);
  } catch (err) {
    return errorResponse('Gagal mengambil data jurnal: ' + err.message);
  }
}

function saveJournal(journal) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_JOURNALS');
    if (!sheet) throw new Error('Sheet _JOURNALS tidak ditemukan.');

    const journalId = journal.journalId || 'JRN-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-') + Utilities.getUuid().substring(0, 4).toUpperCase();
    const rowData = [
      sanitizeForSheet(journalId),
      sanitizeForSheet(journal.date),
      sanitizeForSheet(journal.timeSlot),
      sanitizeForSheet(journal.classId),
      sanitizeForSheet(journal.subjectId),
      sanitizeForSheet(journal.topic),
      sanitizeForSheet(journal.activities),
      sanitizeForSheet(journal.reflection || ''),
      sanitizeForSheet(journal.status || 'Terlaksana')
    ];

    const data = sheet.getDataRange().getValues();
    let updated = false;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === journalId) {
        sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
        updated = true;
        break;
      }
    }

    if (!updated) {
      sheet.appendRow(rowData);
    }

    return successResponse({ journalId }, 'Jurnal mengajar berhasil disimpan');
  } catch (err) {
    return errorResponse('Gagal menyimpan jurnal: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

function deleteJournal(journalId) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_JOURNALS');
    if (!sheet) throw new Error('Sheet _JOURNALS tidak ditemukan.');

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === journalId) {
        sheet.deleteRow(i + 1);
        return successResponse(null, 'Jurnal mengajar berhasil dihapus');
      }
    }
    return errorResponse('Jurnal tidak ditemukan');
  } catch (err) {
    return errorResponse('Gagal menghapus jurnal: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}
