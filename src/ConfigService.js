/**
 * SiAGU — ConfigService.js
 * Manajemen Konfigurasi Sekolah, Profil Guru, dan Dashboard KPI
 */

/**
 * Mendapatkan seluruh konfigurasi dari sheet _CONFIG sebagai Key-Value Object
 */
function getConfig() {
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_CONFIG');
    if (!sheet) {
      initDatabaseSchema();
      return getConfig();
    }

    const data = sheet.getDataRange().getValues();
    const config = {};

    // Mulai dari baris ke-2 (lewati header)
    for (let i = 1; i < data.length; i++) {
      const key = data[i][0];
      const val = data[i][1];
      if (key) {
        config[key] = val;
      }
    }

    return successResponse(config);
  } catch (err) {
    return errorResponse('Gagal membaca konfigurasi: ' + err.message);
  }
}

/**
 * Menyimpan konfigurasi ke sheet _CONFIG
 * @param {Object} configMap - Pasangan { KEY: value }
 */
function saveConfig(configMap) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_CONFIG');
    if (!sheet) throw new Error('Sheet _CONFIG tidak ditemukan.');

    const data = sheet.getDataRange().getValues();
    const keysFound = {};

    // Update baris yang sudah ada
    for (let i = 1; i < data.length; i++) {
      const key = data[i][0];
      if (configMap.hasOwnProperty(key)) {
        sheet.getRange(i + 1, 2).setValue(sanitizeForSheet(configMap[key]));
        keysFound[key] = true;
      }
    }

    // Tambah key baru jika belum ada di sheet
    const newRows = [];
    for (const key in configMap) {
      if (!keysFound[key]) {
        newRows.push([key, sanitizeForSheet(configMap[key]), 'Custom Config']);
      }
    }

    if (newRows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, 3).setValues(newRows);
    }

    return successResponse(configMap, 'Konfigurasi profil berhasil diperbarui');
  } catch (err) {
    return errorResponse('Gagal menyimpan konfigurasi: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Payload Inisialisasi Awal untuk meminimalkan roundtrip network
 * Mengembalikan Config, Classes, dan Subjects sekaligus
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
    return errorResponse('Gagal memuat payload awal: ' + err.message);
  }
}

/**
 * Mendapatkan statistik ringkasan untuk Dashboard Guru
 */
function getDashboardStats() {
  try {
    const ss = getDatabaseSpreadsheet();
    
    // 1. Total Siswa
    const studentSheet = ss.getSheetByName('_STUDENTS');
    const totalStudents = studentSheet ? Math.max(0, studentSheet.getLastRow() - 1) : 0;

    // 2. Total Kelas
    const classSheet = ss.getSheetByName('_CLASSES');
    const totalClasses = classSheet ? Math.max(0, classSheet.getLastRow() - 1) : 0;

    // 3. Total Jurnal Mengajar
    const journalSheet = ss.getSheetByName('_JOURNALS');
    const totalJournals = journalSheet ? Math.max(0, journalSheet.getLastRow() - 1) : 0;

    // 4. Hitung Persentase Kehadiran Rata-rata
    const attSheet = ss.getSheetByName('_ATTENDANCE');
    let attendanceRate = 100;
    if (attSheet && attSheet.getLastRow() > 1) {
      const attData = attSheet.getRange(2, 6, attSheet.getLastRow() - 1, 1).getValues();
      let totalRecords = attData.length;
      let presentCount = 0;
      attData.forEach(row => {
        if (row[0] === 'H') presentCount++;
      });
      if (totalRecords > 0) {
        attendanceRate = Math.round((presentCount / totalRecords) * 100);
      }
    }

    // 5. Ambil 5 Jurnal Mengajar Terkini
    let recentJournals = [];
    if (journalSheet && journalSheet.getLastRow() > 1) {
      const classMap = {};
      if (classSheet && classSheet.getLastRow() > 1) {
        const clsData = classSheet.getDataRange().getValues();
        for (let i = 1; i < clsData.length; i++) {
          classMap[clsData[i][0]] = clsData[i][1];
        }
      }

      const jData = journalSheet.getDataRange().getValues();
      const lastEntries = jData.slice(1).slice(-5).reverse();

      recentJournals = lastEntries.map(row => {
        let dateStr = row[1];
        if (dateStr instanceof Date) {
          dateStr = Utilities.formatDate(dateStr, 'Asia/Jakarta', 'yyyy-MM-dd');
        }
        return {
          id: row[0],
          date: dateStr,
          className: classMap[row[3]] || row[3],
          topic: row[5],
          status: row[8]
        };
      });
    }

    return successResponse({
      totalStudents,
      totalClasses,
      totalJournals,
      attendanceRate,
      recentJournals
    });
  } catch (err) {
    return errorResponse('Gagal mengambil statistik dashboard: ' + err.message);
  }
}
