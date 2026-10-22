/**
 * SiAGU — ExportService.js
 * Generator Lembar Supervisi, Format Cetak A4, dan Ekspor Spreadsheet PDF/Excel
 */

/**
 * Mengambil metadata lengkap untuk lembar cetak supervisi
 */
function getPrintHeaderInfo() {
  const configRes = getConfig();
  const cfg = configRes.data || {};
  const todayStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'd MMMM yyyy');

  return {
    schoolName: cfg.SCHOOL_NAME || 'SMA NEGERI 1 INDONESIA',
    schoolNpsn: cfg.SCHOOL_NPSN || '-',
    teacherName: cfg.TEACHER_NAME || 'Guru Pengampu',
    teacherNip: cfg.TEACHER_NIP || '-',
    headmasterName: cfg.HEADMASTER_NAME || 'Kepala Sekolah',
    headmasterNip: cfg.HEADMASTER_NIP || '-',
    academicYear: cfg.ACADEMIC_YEAR || '2026/2027',
    semester: cfg.SEMESTER || 'Ganjil',
    curriculum: cfg.CURRICULUM_MODE || 'Kurikulum Merdeka',
    printDate: todayStr
  };
}

/**
 * Menyiapkan payload cetak Jurnal Mengajar
 */
function getJournalPrintData(classId) {
  try {
    const headerInfo = getPrintHeaderInfo();
    const journalRes = getJournals(classId);
    
    let className = 'Semua Kelas';
    if (classId) {
      const clsRes = getClasses();
      const targetCls = (clsRes.data || []).find(c => c.classId === classId);
      if (targetCls) className = targetCls.className;
    }

    return successResponse({
      header: headerInfo,
      className: className,
      journals: (journalRes.data || []).reverse() // Urut kronologis
    });
  } catch (err) {
    return errorResponse('Gagal menyiapkan data cetak jurnal: ' + err.message);
  }
}

/**
 * Menyiapkan payload cetak Rekap Presensi
 */
function getAttendancePrintData(classId) {
  try {
    const headerInfo = getPrintHeaderInfo();
    const attRes = getAttendanceSummary(classId);

    let className = 'Kelas';
    if (classId) {
      const clsRes = getClasses();
      const targetCls = (clsRes.data || []).find(c => c.classId === classId);
      if (targetCls) className = targetCls.className;
    }

    return successResponse({
      header: headerInfo,
      className: className,
      attendance: attRes.data || []
    });
  } catch (err) {
    return errorResponse('Gagal menyiapkan data cetak presensi: ' + err.message);
  }
}

/**
 * Menyiapkan payload cetak Leger Nilai
 */
function getLegerPrintData(classId, subjectId) {
  try {
    const headerInfo = getPrintHeaderInfo();
    const legerRes = getLegerData(classId, subjectId);
    const legerData = legerRes.data || {};

    let className = 'Kelas';
    const clsRes = getClasses();
    const targetCls = (clsRes.data || []).find(c => c.classId === classId);
    if (targetCls) className = targetCls.className;

    let subjectName = 'Mata Pelajaran';
    const sbjRes = getSubjects();
    const targetSbj = (sbjRes.data || []).find(s => s.subjectId === subjectId);
    if (targetSbj) subjectName = targetSbj.subjectName;

    return successResponse({
      header: headerInfo,
      className: className,
      subjectName: subjectName,
      weightFormative: legerData.weightFormative || 40,
      weightSummative: legerData.weightSummative || 60,
      rows: legerData.rows || []
    });
  } catch (err) {
    return errorResponse('Gagal menyiapkan data cetak leger: ' + err.message);
  }
}

/**
 * Menghasilkan link unduh langsung file spreadsheet ke format Excel (.xlsx) dan PDF
 */
function getSpreadsheetExportUrls() {
  try {
    const ss = getDatabaseSpreadsheet();
    const ssId = ss.getId();

    const excelUrl = `https://docs.google.com/spreadsheets/d/${ssId}/export?format=xlsx`;
    const pdfUrl = `https://docs.google.com/spreadsheets/d/${ssId}/export?format=pdf&size=A4&portrait=true&fitw=true`;

    return successResponse({
      spreadsheetId: ssId,
      excelUrl: excelUrl,
      pdfUrl: pdfUrl
    });
  } catch (err) {
    return errorResponse('Gagal membuat tautan ekspor spreadsheet: ' + err.message);
  }
}
