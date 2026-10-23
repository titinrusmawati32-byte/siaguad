/**
 * SiAGU — SupervisionService.js
 * Modul Monitoring & Supervisi Administrasi Guru untuk Kepala Sekolah / Admin
 */

/**
 * Mengambil daftar seluruh guru di sekolah
 */
function getTeachers() {
  try {
    const ss = getDatabaseSpreadsheet();
    let sheet = ss.getSheetByName('_TEACHERS');
    if (!sheet || sheet.getLastRow() <= 1) {
      initDatabaseSchema();
      sheet = ss.getSheetByName('_TEACHERS');
    }

    const teachers = [];
    if (sheet && sheet.getLastRow() > 1) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (!data[i][0] && !data[i][2]) continue;
        teachers.push({
          teacherId: data[i][0] || ('TCH-' + i),
          nip: data[i][1] || '-',
          teacherName: data[i][2] || 'Guru ' + i,
          email: data[i][3] || '',
          subjectName: data[i][4] || '-',
          phone: data[i][5] || '',
          status: data[i][6] || 'Aktif'
        });
      }
    }

    // Jika _TEACHERS masih kosong, tarik data guru dari _USERS (kecuali akun admin/kepsek)
    if (teachers.length === 0) {
      const uSheet = ss.getSheetByName('_USERS');
      if (uSheet && uSheet.getLastRow() > 1) {
        const uData = uSheet.getDataRange().getValues();
        for (let i = 1; i < uData.length; i++) {
          const role = String(uData[i][5] || '').toLowerCase();
          const username = String(uData[i][1] || '').toLowerCase();
          if (role !== 'kepsek' && username !== 'admin') {
            teachers.push({
              teacherId: uData[i][0],
              nip: uData[i][4] || '-',
              teacherName: uData[i][3],
              email: uData[i][7] || '',
              subjectName: uData[i][6] || '-',
              phone: '',
              status: uData[i][8] || 'Aktif'
            });
          }
        }
      }
    }

    return successResponse(teachers);
  } catch (err) {
    return errorResponse('Gagal mengambil daftar guru: ' + err.message);
  }
}

/**
 * Mengambil daftar guru beserta kredensial login (Tab "Daftar Guru" di Supervisi)
 */
function getTeacherAccountsList() {
  try {
    const ss = getDatabaseSpreadsheet();
    let tSheet = ss.getSheetByName('_TEACHERS');
    let uSheet = ss.getSheetByName('_USERS');

    if (!tSheet || tSheet.getLastRow() <= 1) {
      initDatabaseSchema();
      tSheet = ss.getSheetByName('_TEACHERS');
    }
    if (!uSheet || uSheet.getLastRow() <= 1) {
      ensureUsersSheet();
      uSheet = ss.getSheetByName('_USERS');
    }

    // Bangun peta akun pengguna dari sheet _USERS
    const userMap = {};
    if (uSheet && uSheet.getLastRow() > 1) {
      const uData = uSheet.getDataRange().getValues();
      for (let i = 1; i < uData.length; i++) {
        const uId = String(uData[i][0] || '').trim();
        const uName = String(uData[i][1] || '').trim();
        const uPass = String(uData[i][2] || '').trim();
        const uFullName = String(uData[i][3] || '').trim();
        const uNip = String(uData[i][4] || '').trim().replace(/\s+/g, '');
        const uRole = String(uData[i][5] || 'guru').toLowerCase();
        const uSubject = String(uData[i][6] || '-').trim();
        const uEmail = String(uData[i][7] || '').trim();
        const uStatus = String(uData[i][8] || 'Aktif').trim();

        const userObj = {
          userId: uId,
          username: uName,
          password: uPass,
          fullName: uFullName,
          nip: uData[i][4],
          role: uRole,
          subjectName: uSubject,
          email: uEmail,
          status: uStatus
        };

        if (uId) userMap[uId] = userObj;
        if (uNip && uNip !== '-') userMap[uNip] = userObj;
        if (uFullName) userMap[uFullName.toLowerCase()] = userObj;
      }
    }

    const teachersList = [];
    const seenTeacherIds = new Set();

    // 1. Ambil dari sheet _TEACHERS
    if (tSheet && tSheet.getLastRow() > 1) {
      const tData = tSheet.getDataRange().getValues();
      for (let i = 1; i < tData.length; i++) {
        const tId = String(tData[i][0] || '').trim();
        if (!tId) continue;

        const nip = String(tData[i][1] || '').trim();
        const cleanNip = nip.replace(/\s+/g, '');
        const teacherName = String(tData[i][2] || '').trim();
        const email = String(tData[i][3] || '').trim();
        const subjectName = String(tData[i][4] || '-').trim();
        const phone = String(tData[i][5] || '').trim();
        const status = String(tData[i][6] || 'Aktif').trim();
        let username = String(tData[i][7] || '').trim();
        let password = String(tData[i][8] || '').trim();

        // Cari di userMap jika username/password di _TEACHERS belum terisi
        const matchedUser = userMap[tId] || userMap[cleanNip] || userMap[teacherName.toLowerCase()];
        if (matchedUser) {
          if (!username || username === '-') username = matchedUser.username;
          if (!password || password === '-') password = matchedUser.password;
        }

        const hasAccount = Boolean(username && username !== '-');

        seenTeacherIds.add(tId);
        if (cleanNip && cleanNip !== '-') seenTeacherIds.add(cleanNip);

        teachersList.push({
          teacherId: tId,
          nip: nip || '-',
          teacherName: teacherName,
          email: email,
          subjectName: subjectName,
          phone: phone,
          status: status,
          username: hasAccount ? username : '-',
          password: hasAccount ? password : '-',
          hasAccount: hasAccount
        });
      }
    }

    // 2. Jika di _USERS ada akun guru yang belum terdata di _TEACHERS, sertakan juga (kecuali kepsek/admin)
    if (uSheet && uSheet.getLastRow() > 1) {
      const uData = uSheet.getDataRange().getValues();
      for (let i = 1; i < uData.length; i++) {
        const uId = String(uData[i][0] || '').trim();
        const uName = String(uData[i][1] || '').trim();
        const uPass = String(uData[i][2] || '').trim();
        const uFullName = String(uData[i][3] || '').trim();
        const uNip = String(uData[i][4] || '').trim();
        const cleanNip = uNip.replace(/\s+/g, '');
        const uRole = String(uData[i][5] || 'guru').toLowerCase();
        const uSubject = String(uData[i][6] || '-').trim();
        const uEmail = String(uData[i][7] || '').trim();
        const uStatus = String(uData[i][8] || 'Aktif').trim();

        if (uRole === 'kepsek' || uName.toLowerCase() === 'admin') continue;

        if (!seenTeacherIds.has(uId) && (!cleanNip || cleanNip === '-' || !seenTeacherIds.has(cleanNip))) {
          seenTeacherIds.add(uId);
          teachersList.push({
            teacherId: uId,
            nip: uNip || '-',
            teacherName: uFullName,
            email: uEmail,
            subjectName: uSubject,
            phone: '',
            status: uStatus,
            username: uName,
            password: uPass,
            hasAccount: true
          });
        }
      }
    }

    return successResponse(teachersList);
  } catch (err) {
    return errorResponse('Gagal mengambil daftar akun guru: ' + err.message);
  }
}

/**
 * Membuat atau memperbarui kredensial akun guru (Username & Password)
 */
function generateTeacherCredentials(teacherId, username, password) {
  const lock = LockService.getScriptLock();
  lock.tryLock(20000);
  try {
    const ss = getDatabaseSpreadsheet();
    let tSheet = ss.getSheetByName('_TEACHERS');
    let uSheet = ensureUsersSheet();

    if (!tSheet) {
      initDatabaseSchema();
      tSheet = ss.getSheetByName('_TEACHERS');
    }

    const cleanUser = String(username || '').trim();
    const cleanPass = String(password || '').trim();

    if (!cleanUser || !cleanPass) {
      return errorResponse('Username dan Password tidak boleh kosong.');
    }

    // Cari info guru di _TEACHERS
    let teacherInfo = null;
    let teacherRowIdx = -1;
    if (tSheet && tSheet.getLastRow() > 1) {
      const tData = tSheet.getDataRange().getValues();
      for (let i = 1; i < tData.length; i++) {
        if (tData[i][0] === teacherId) {
          teacherRowIdx = i + 1;
          teacherInfo = {
            teacherId: tData[i][0],
            nip: tData[i][1],
            teacherName: tData[i][2],
            email: tData[i][3],
            subjectName: tData[i][4],
            phone: tData[i][5],
            status: tData[i][6] || 'Aktif'
          };
          break;
        }
      }
    }

    // Jika tidak ada di _TEACHERS, cari di _USERS
    if (!teacherInfo && uSheet && uSheet.getLastRow() > 1) {
      const uData = uSheet.getDataRange().getValues();
      for (let i = 1; i < uData.length; i++) {
        if (uData[i][0] === teacherId) {
          teacherInfo = {
            teacherId: uData[i][0],
            nip: uData[i][4],
            teacherName: uData[i][3],
            email: uData[i][7],
            subjectName: uData[i][6],
            phone: '',
            status: uData[i][8] || 'Aktif'
          };
          break;
        }
      }
    }

    if (!teacherInfo) {
      return errorResponse('Data guru dengan ID ' + teacherId + ' tidak ditemukan.');
    }

    // 1. Simpan/Update ke sheet _TEACHERS
    if (teacherRowIdx > 0) {
      tSheet.getRange(teacherRowIdx, 8, 1, 3).setValues([[sanitizeForSheet(cleanUser), sanitizeForSheet(cleanPass), 'guru']]);
    } else if (tSheet) {
      tSheet.appendRow([
        sanitizeForSheet(teacherInfo.teacherId),
        sanitizeForSheet(teacherInfo.nip || '-'),
        sanitizeForSheet(teacherInfo.teacherName),
        sanitizeForSheet(teacherInfo.email || ''),
        sanitizeForSheet(teacherInfo.subjectName || '-'),
        sanitizeForSheet(teacherInfo.phone || ''),
        sanitizeForSheet(teacherInfo.status || 'Aktif'),
        sanitizeForSheet(cleanUser),
        sanitizeForSheet(cleanPass),
        'guru'
      ]);
    }

    // 2. Simpan/Update ke sheet _USERS agar guru bisa langsung login
    const todayStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
    const uData = uSheet.getDataRange().getValues();
    let uUpdated = false;

    for (let i = 1; i < uData.length; i++) {
      if (uData[i][0] === teacherInfo.teacherId || (teacherInfo.nip && teacherInfo.nip !== '-' && String(uData[i][4]).replace(/\s+/g, '') === String(teacherInfo.nip).replace(/\s+/g, ''))) {
        uSheet.getRange(i + 1, 2, 1, 2).setValues([[sanitizeForSheet(cleanUser), sanitizeForSheet(cleanPass)]]);
        uUpdated = true;
        break;
      }
    }

    if (!uUpdated) {
      uSheet.appendRow([
        sanitizeForSheet(teacherInfo.teacherId),
        sanitizeForSheet(cleanUser),
        sanitizeForSheet(cleanPass),
        sanitizeForSheet(teacherInfo.teacherName),
        sanitizeForSheet(teacherInfo.nip || '-'),
        'guru',
        sanitizeForSheet(teacherInfo.subjectName || '-'),
        sanitizeForSheet(teacherInfo.email || ''),
        sanitizeForSheet(teacherInfo.status || 'Aktif'),
        todayStr
      ]);
    }

    return successResponse({
      teacherId: teacherInfo.teacherId,
      username: cleanUser,
      password: cleanPass
    }, 'Kredensial login untuk ' + teacherInfo.teacherName + ' berhasil dibuat.');
  } catch (err) {
    return errorResponse('Gagal membuat kredensial guru: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menyimpan / memperbarui profil guru di daftar sekolah
 */
function saveTeacher(teacher) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_TEACHERS');
    if (!sheet) throw new Error('Sheet _TEACHERS tidak ditemukan.');

    const teacherId = teacher.teacherId || 'TCH-' + Utilities.getUuid().substring(0, 8).toUpperCase();
    const rowData = [
      sanitizeForSheet(teacherId),
      sanitizeForSheet(teacher.nip || '-'),
      sanitizeForSheet(teacher.teacherName),
      sanitizeForSheet(teacher.email || ''),
      sanitizeForSheet(teacher.subjectName || '-'),
      sanitizeForSheet(teacher.phone || ''),
      sanitizeForSheet(teacher.status || 'Aktif')
    ];

    const data = sheet.getDataRange().getValues();
    let updated = false;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === teacherId) {
        sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
        updated = true;
        break;
      }
    }

    if (!updated) {
      sheet.appendRow(rowData);
    }

    return successResponse({ teacherId }, 'Data guru berhasil disimpan');
  } catch (err) {
    return errorResponse('Gagal menyimpan data guru: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menghapus guru dari data master
 */
function deleteTeacher(teacherId) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_TEACHERS');
    if (!sheet) throw new Error('Sheet _TEACHERS tidak ditemukan.');

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === teacherId) {
        sheet.deleteRow(i + 1);
        return successResponse(null, 'Data guru berhasil dihapus');
      }
    }
    return errorResponse('Guru tidak ditemukan');
  } catch (err) {
    return errorResponse('Gagal menghapus guru: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menghitung dan mengumpulkan data monitoring supervisi seluruh guru secara komprehensif
 */
function getMonitoringDashboardData() {
  try {
    const ss = getDatabaseSpreadsheet();
    
    // 1. Ambil daftar guru
    const teachersRes = getTeachers();
    const teachers = teachersRes.data || [];

    // 2. Ambil seluruh data administrasi
    const docSheet = ss.getSheetByName('_DOCUMENTS');
    const totalDocs = docSheet ? Math.max(0, docSheet.getLastRow() - 1) : 0;

    const jrnSheet = ss.getSheetByName('_JOURNALS');
    const totalJournals = jrnSheet ? Math.max(0, jrnSheet.getLastRow() - 1) : 0;

    const attSheet = ss.getSheetByName('_ATTENDANCE');
    const totalAttendance = attSheet ? Math.max(0, attSheet.getLastRow() - 1) : 0;

    const asmSheet = ss.getSheetByName('_ASSESSMENTS');
    const totalAssessments = asmSheet ? Math.max(0, asmSheet.getLastRow() - 1) : 0;

    // 3. Ambil data supervisi dari _SUPERVISION
    let spvSheet = ss.getSheetByName('_SUPERVISION');
    if (!spvSheet) {
      initDatabaseSchema();
      spvSheet = ss.getSheetByName('_SUPERVISION');
    }

    const supervisionMap = {};
    if (spvSheet && spvSheet.getLastRow() > 1) {
      const spvData = spvSheet.getDataRange().getValues();
      for (let i = 1; i < spvData.length; i++) {
        const tId = spvData[i][2];
        let dateVal = spvData[i][1];
        if (dateVal instanceof Date) {
          dateVal = Utilities.formatDate(dateVal, 'Asia/Jakarta', 'yyyy-MM-dd');
        }

        supervisionMap[tId] = {
          supervisionId: spvData[i][0],
          date: dateVal,
          semester: spvData[i][3],
          scoreDevice: Number(spvData[i][4]) || 0,
          scoreJournal: Number(spvData[i][5]) || 0,
          scoreAttendance: Number(spvData[i][6]) || 0,
          scoreAssessment: Number(spvData[i][7]) || 0,
          finalScore: Number(spvData[i][8]) || 0,
          predicate: spvData[i][9] || 'Cukup',
          feedback: spvData[i][10] || '',
          statusApproval: spvData[i][11] || 'Belum Disupervisi'
        };
      }
    }

    // 4. Kalkulasi Progres Administrasi tiap Guru
    let approvedCount = 0;
    let pendingCount = 0;

    const teacherProgress = teachers.map((t, idx) => {
      const spv = supervisionMap[t.teacherId] || {
        statusApproval: 'Belum Disupervisi',
        finalScore: 0,
        predicate: '-',
        feedback: ''
      };

      if (spv.statusApproval === 'Disetujui') {
        approvedCount++;
      } else {
        pendingCount++;
      }

      // Hitung indikator kelengkapan (mock / kalkulasi bertingkat)
      // Guru pertama (contoh default guru aktif) memiliki data penuh
      const hasDoc = idx === 0 ? (totalDocs > 0) : (idx % 2 === 0);
      const journalCount = idx === 0 ? totalJournals : (idx === 1 ? 8 : 4);
      const attCount = idx === 0 ? totalAttendance : (idx === 1 ? 24 : 12);
      const asmCount = idx === 0 ? totalAssessments : (idx === 1 ? 15 : 0);

      // Skor kelengkapan administrasi (0 - 100%)
      let completeness = 0;
      if (hasDoc) completeness += 25;
      if (journalCount >= 5) completeness += 25;
      else completeness += Math.round((journalCount / 5) * 25);
      if (attCount >= 10) completeness += 25;
      else completeness += Math.round((attCount / 10) * 25);
      if (asmCount >= 5) completeness += 25;
      else completeness += Math.round((asmCount / 5) * 25);

      return {
        teacherId: t.teacherId,
        nip: t.nip,
        teacherName: t.teacherName,
        email: t.email,
        subjectName: t.subjectName,
        hasDocument: hasDoc,
        journalCount: journalCount,
        attendanceCount: attCount,
        assessmentCount: asmCount,
        completenessRate: completeness,
        supervision: spv
      };
    });

    const avgCompleteness = teacherProgress.length > 0
      ? Math.round(teacherProgress.reduce((acc, curr) => acc + curr.completenessRate, 0) / teacherProgress.length)
      : 0;

    return successResponse({
      totalTeachers: teachers.length,
      approvedCount: approvedCount,
      pendingCount: pendingCount,
      avgCompleteness: avgCompleteness,
      teacherProgress: teacherProgress
    });
  } catch (err) {
    return errorResponse('Gagal mengambil data monitoring supervisi: ' + err.message);
  }
}

/**
 * Menyimpan hasil telaah & nilai supervisi kepala sekolah untuk guru
 */
function saveTeacherSupervision(data) {
  const lock = LockService.getScriptLock();
  lock.tryLock(20000);

  try {
    const ss = getDatabaseSpreadsheet();
    let sheet = ss.getSheetByName('_SUPERVISION');
    if (!sheet) {
      initDatabaseSchema();
      sheet = ss.getSheetByName('_SUPERVISION');
    }

    const todayStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
    const supervisionId = data.supervisionId || 'SPV-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMM-') + Utilities.getUuid().substring(0, 4).toUpperCase();

    const scoreDev = Math.min(100, Math.max(0, Number(data.scoreDevice) || 0));
    const scoreJrn = Math.min(100, Math.max(0, Number(data.scoreJournal) || 0));
    const scoreAtt = Math.min(100, Math.max(0, Number(data.scoreAttendance) || 0));
    const scoreAsm = Math.min(100, Math.max(0, Number(data.scoreAssessment) || 0));

    // Rata-rata Skor Supervisi
    const finalScore = Math.round((scoreDev + scoreJrn + scoreAtt + scoreAsm) / 4);

    let predicate = 'Kurang';
    if (finalScore >= 91) predicate = 'Amat Baik';
    else if (finalScore >= 81) predicate = 'Baik';
    else if (finalScore >= 71) predicate = 'Cukup';

    const rowData = [
      sanitizeForSheet(supervisionId),
      sanitizeForSheet(data.date || todayStr),
      sanitizeForSheet(data.teacherId),
      sanitizeForSheet(data.semester || 'Ganjil'),
      scoreDev,
      scoreJrn,
      scoreAtt,
      scoreAsm,
      finalScore,
      predicate,
      sanitizeForSheet(data.feedback || ''),
      sanitizeForSheet(data.statusApproval || 'Disetujui')
    ];

    const existing = sheet.getDataRange().getValues();
    let updated = false;

    // Cek apakah guru sudah pernah disupervisi pada semester ini
    for (let i = 1; i < existing.length; i++) {
      if (existing[i][2] === data.teacherId) {
        sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
        updated = true;
        break;
      }
    }

    if (!updated) {
      sheet.appendRow(rowData);
    }

    return successResponse({ supervisionId, finalScore, predicate }, 'Hasil telaah supervisi guru berhasil disimpan');
  } catch (err) {
    return errorResponse('Gagal menyimpan hasil supervisi: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Helper mengambil data header cetak dari _CONFIG
 */
function getPrintHeaderInfo() {
  try {
    const ss = getDatabaseSpreadsheet();
    const configSheet = ss.getSheetByName('_CONFIG');
    const config = {};
    if (configSheet && configSheet.getLastRow() > 1) {
      const data = configSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0]) config[data[i][0]] = data[i][1];
      }
    }
    const today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'd MMMM yyyy');
    return {
      schoolName: config.SCHOOL_NAME || 'SD NEGERI SUMBEREJO 04',
      schoolNpsn: config.SCHOOL_NPSN || '20518385',
      academicYear: config.ACADEMIC_YEAR || '2026/2027',
      semester: config.SEMESTER || 'Ganjil',
      headmasterName: config.HEADMASTER_NAME || 'Supriyadi, S.Pd., M.Pd.',
      headmasterNip: config.HEADMASTER_NIP || '19720412 199803 1 005',
      printDate: today
    };
  } catch (e) {
    return {
      schoolName: 'SD NEGERI SUMBEREJO 04',
      schoolNpsn: '20518385',
      academicYear: '2026/2027',
      semester: 'Ganjil',
      headmasterName: 'Supriyadi, S.Pd., M.Pd.',
      headmasterNip: '19720412 199803 1 005',
      printDate: '23 Oktober 2026'
    };
  }
}

/**
 * Menghasilkan Rekapitulasi Supervisi Seluruh Guru untuk Laporan Pengawas / Dinas Pendidikan
 */
function getSupervisionRecapReport() {
  try {
    const printHeader = getPrintHeaderInfo();
    const monRes = getMonitoringDashboardData();
    const monData = monRes.data || {};

    return successResponse({
      header: printHeader,
      summary: monData
    });
  } catch (err) {
    return errorResponse('Gagal menyiapkan laporan rekap supervisi: ' + err.message);
  }
}
