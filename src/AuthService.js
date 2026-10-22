/**
 * SiAGU — AuthService.js
 * Modul Otentikasi, Manajemen Database Pengguna (_USERS), dan Kelola Akun Guru
 */

/**
 * Memastikan tabel database _USERS selalu ada dan siap digunakan
 * Otomatis membuat tabel dan akun default jika belum tersedia di Google Sheets
 */
function ensureUsersSheet() {
  const ss = getDatabaseSpreadsheet();
  let sheet = ss.getSheetByName('_USERS');

  const headers = ['user_id', 'username', 'password', 'full_name', 'nip', 'role', 'subject_name', 'email', 'status', 'created_at'];
  const defaultAccounts = [
    ['USR-000', 'admin', 'kepsek123', 'Dr. Hj. Siti Rahma, M.M.', '19760315 200212 2 003', 'kepsek', 'Kepala Sekolah', 'kepsek@sma1.sch.id', 'Aktif', '2026-10-22'],
    ['USR-001', 'guru_budi', 'guru123', 'Budi Santoso, S.Pd., M.Pd.', '19850512 201001 1 008', 'guru', 'Biologi', 'budi.santoso@guru.sma.belajar.id', 'Aktif', '2026-10-22'],
    ['USR-002', 'guru_dewi', 'guru123', 'Dewi Sartika, S.Pd.', '19880920 201402 2 004', 'guru', 'Matematika', 'dewi.sartika@guru.sma.belajar.id', 'Aktif', '2026-10-22'],
    ['USR-003', 'guru_rizky', 'guru123', 'Rizky Pratama, M.Kom.', '19920110 201903 1 007', 'guru', 'Informatika', 'rizky.pratama@guru.sma.belajar.id', 'Aktif', '2026-10-22'],
    ['USR-004', 'guru_nurul', 'guru123', 'Nurul Hidayah, S.Pd.', '19820405 200801 2 011', 'guru', 'Bahasa Indonesia', 'nurul.hidayah@guru.sma.belajar.id', 'Aktif', '2026-10-22']
  ];

  if (!sheet) {
    sheet = ss.insertSheet('_USERS');
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format Header Teal #0F766E
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#0F766E');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);

    sheet.getRange(2, 1, defaultAccounts.length, headers.length).setValues(defaultAccounts);

    for (let c = 1; c <= headers.length; c++) sheet.autoResizeColumn(c);
  } else if (sheet.getLastRow() <= 1) {
    // Jika sheet sudah ada tetapi datanya kosong, isi akun default
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(2, 1, defaultAccounts.length, headers.length).setValues(defaultAccounts);
  }

  return sheet;
}

/**
 * Verifikasi login pengguna langsung ke tabel _USERS
 * @param {string} username - Username / NIP / Email
 * @param {string} password - Password akun
 */
function loginUser(username, password) {
  try {
    if (!username || !password) {
      return errorResponse('Username dan password wajib diisi.');
    }

    const cleanUser = String(username).trim();
    const cleanPass = String(password).trim();
    const cleanUserNoSpace = cleanUser.replace(/\s+/g, '');

    // Pastikan sheet _USERS selalu tersedia
    const sheet = ensureUsersSheet();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const uId = data[i][0];
      const uUsername = String(data[i][1] || '').trim();
      const uPassword = String(data[i][2] || '').trim();
      const uFullName = data[i][3];
      const uNip = String(data[i][4] || '').trim().replace(/\s+/g, '');
      const uRole = String(data[i][5] || 'guru').toLowerCase();
      const uSubject = data[i][6] || '-';
      const uEmail = String(data[i][7] || '').trim();
      const uStatus = data[i][8] || 'Aktif';

      // Cek apakah username, NIP, atau Email cocok
      const userMatches = (
        cleanUser.toLowerCase() === uUsername.toLowerCase() ||
        cleanUserNoSpace === uNip ||
        cleanUser.toLowerCase() === uEmail.toLowerCase()
      );

      if (userMatches) {
        if (uStatus !== 'Aktif') {
          return errorResponse('Akun ini berstatus non-aktif. Silakan hubungi Kepala Sekolah.');
        }

        if (cleanPass === uPassword) {
          const isKepsek = (uRole === 'kepsek' || uRole === 'admin' || cleanUser.toLowerCase() === 'admin');
          return successResponse({
            user: {
              id: uId,
              name: uFullName,
              nip: data[i][4],
              role: isKepsek ? 'headmaster' : 'guru',
              username: uUsername,
              subject: uSubject,
              email: uEmail,
              title: isKepsek ? 'Kepala Satuan Pendidikan' : `Guru Pengampu ${uSubject}`,
              status: uStatus
            },
            token: 'TOKEN-' + uRole.toUpperCase() + '-' + Utilities.getUuid()
          }, 'Login berhasil. Selamat datang!');
        } else {
          return errorResponse('Password yang Anda masukkan salah. Silakan coba lagi.');
        }
      }
    }

    return errorResponse(`Akun "${cleanUser}" tidak ditemukan di database pengguna (_USERS).`);
  } catch (err) {
    return errorResponse('Gagal melakukan otentikasi login: ' + err.message);
  }
}

/**
 * Mengambil seluruh daftar akun guru dari sheet _USERS (Khusus Admin / Kepala Sekolah)
 */
function getUsersList() {
  try {
    const sheet = ensureUsersSheet();
    if (!sheet || sheet.getLastRow() <= 1) return successResponse([]);

    const data = sheet.getDataRange().getValues();
    const users = [];

    for (let i = 1; i < data.length; i++) {
      users.push({
        userId: data[i][0],
        username: data[i][1],
        password: data[i][2],
        fullName: data[i][3],
        nip: data[i][4],
        role: data[i][5],
        subjectName: data[i][6],
        email: data[i][7],
        status: data[i][8] || 'Aktif',
        createdAt: data[i][9]
      });
    }

    return successResponse(users);
  } catch (err) {
    return errorResponse('Gagal mengambil daftar pengguna: ' + err.message);
  }
}

/**
 * Menambahkan atau memperbarui akun guru di sheet _USERS
 */
function saveUserAccount(user) {
  const lock = LockService.getScriptLock();
  lock.tryLock(20000);

  try {
    const sheet = ensureUsersSheet();
    const todayStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
    const userId = user.userId || 'USR-' + Utilities.getUuid().substring(0, 6).toUpperCase();

    // Generate username default jika kosong: "guru_" + nama depan
    let finalUsername = user.username;
    if (!finalUsername) {
      finalUsername = 'guru_' + (user.fullName || 'user').replace(/[^a-zA-Z]/g, '').toLowerCase().substring(0, 8);
    }

    // Generate password default jika kosong: 6 karakter acak
    let finalPassword = user.password;
    if (!finalPassword) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let pin = '';
      for (let k = 0; k < 6; k++) pin += chars.charAt(Math.floor(Math.random() * chars.length));
      finalPassword = pin;
    }

    const rowData = [
      sanitizeForSheet(userId),
      sanitizeForSheet(finalUsername.trim()),
      sanitizeForSheet(finalPassword.trim()),
      sanitizeForSheet(user.fullName),
      sanitizeForSheet(user.nip || '-'),
      sanitizeForSheet(user.role || 'guru'),
      sanitizeForSheet(user.subjectName || '-'),
      sanitizeForSheet(user.email || ''),
      sanitizeForSheet(user.status || 'Aktif'),
      todayStr
    ];

    const data = sheet.getDataRange().getValues();
    let updated = false;

    // Cek username bentrok pada akun lain
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] !== userId && String(data[i][1]).toLowerCase() === finalUsername.toLowerCase()) {
        return errorResponse(`Username "${finalUsername}" sudah digunakan oleh guru lain.`);
      }
    }

    // Update jika userId sudah ada
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
        updated = true;
        break;
      }
    }

    if (!updated) {
      sheet.appendRow(rowData);
    }

    // Sinkronkan juga ke sheet _TEACHERS agar terdata di supervisi
    syncUserToTeachersSheet(userId, user.fullName, user.nip, user.subjectName, user.email, finalUsername, finalPassword, user.status);

    return successResponse({
      userId: userId,
      username: finalUsername,
      password: finalPassword,
      fullName: user.fullName
    }, `Akun login untuk "${user.fullName}" berhasil disimpan.`);
  } catch (err) {
    return errorResponse('Gagal menyimpan akun guru: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Helper sinkronisasi akun pengguna ke sheet _TEACHERS
 */
function syncUserToTeachersSheet(userId, name, nip, subject, email, username, password, status) {
  try {
    const ss = getDatabaseSpreadsheet();
    let tSheet = ss.getSheetByName('_TEACHERS');
    if (!tSheet) return;

    const data = tSheet.getDataRange().getValues();
    const row = [
      userId,
      nip || '-',
      name,
      email || '',
      subject || '-',
      '',
      status || 'Aktif',
      username,
      password,
      'guru'
    ];

    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId || (nip && nip !== '-' && String(data[i][1]).replace(/\s+/g, '') === String(nip).replace(/\s+/g, ''))) {
        tSheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
        found = true;
        break;
      }
    }

    if (!found) {
      tSheet.appendRow(row);
    }
  } catch (e) {
    console.warn('Gagal sinkronisasi ke _TEACHERS:', e.message);
  }
}

/**
 * Menghapus akun guru dari sheet _USERS
 */
function deleteUserAccount(userId) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    const sheet = ensureUsersSheet();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        if (data[i][1] === 'admin') {
          return errorResponse('Akun admin utama tidak boleh dihapus.');
        }
        sheet.deleteRow(i + 1);
        return successResponse(null, 'Akun pengguna berhasil dihapus.');
      }
    }

    return errorResponse('Akun pengguna tidak ditemukan.');
  } catch (err) {
    return errorResponse('Gagal menghapus akun: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}
