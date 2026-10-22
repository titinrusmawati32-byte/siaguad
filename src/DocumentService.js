/**
 * SiAGU — DocumentService.js
 * Manajemen Bank Perangkat Ajar & Arsip Digital Google Drive
 * Khusus Akun Admin / Kepala Sekolah untuk Upload & Kelola
 */

/**
 * Mengambil daftar dokumen ajar dari sheet _DOCUMENTS
 */
function getDocuments(filterCategory = null) {
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_DOCUMENTS');
    if (!sheet || sheet.getLastRow() <= 1) return successResponse([]);

    const data = sheet.getDataRange().getValues();
    const docs = [];

    for (let i = 1; i < data.length; i++) {
      const category = data[i][2];
      if (!filterCategory || category === filterCategory) {
        let uploadDate = data[i][6];
        if (uploadDate instanceof Date) {
          uploadDate = Utilities.formatDate(uploadDate, 'Asia/Jakarta', 'yyyy-MM-dd');
        }

        docs.push({
          docId: data[i][0],
          title: data[i][1],
          category: category,
          gradeLevel: data[i][3],
          fileUrl: data[i][4] || '#',
          fileId: data[i][5] || '',
          uploadDate: uploadDate
        });
      }
    }

    docs.reverse();
    return successResponse(docs);
  } catch (err) {
    return errorResponse('Gagal mengambil arsip dokumen: ' + err.message);
  }
}

/**
 * Menyimpan metadata dokumen (tautan atau berkas)
 * Hanya boleh dieksekusi oleh akun Admin / Kepala Sekolah
 */
function saveDocument(doc, userRole = null) {
  if (userRole === 'guru') {
    return errorResponse('Akses ditolak: Guru hanya memiliki hak akses melihat/mengunduh dokumen.');
  }

  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_DOCUMENTS');
    if (!sheet) throw new Error('Sheet _DOCUMENTS tidak ditemukan.');

    const docId = doc.docId || 'DOC-' + Utilities.getUuid().substring(0, 8).toUpperCase();
    const todayStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');

    const rowData = [
      sanitizeForSheet(docId),
      sanitizeForSheet(doc.title),
      sanitizeForSheet(doc.category || 'Modul Ajar'),
      sanitizeForSheet(doc.gradeLevel || '10'),
      sanitizeForSheet(doc.fileUrl || ''),
      sanitizeForSheet(doc.fileId || ''),
      todayStr
    ];

    const data = sheet.getDataRange().getValues();
    let updated = false;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === docId) {
        sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
        updated = true;
        break;
      }
    }

    if (!updated) {
      sheet.appendRow(rowData);
    }

    return successResponse({ docId }, 'Dokumen perangkat ajar berhasil disimpan');
  } catch (err) {
    return errorResponse('Gagal menyimpan dokumen: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Upload berkas langsung ke Google Drive guru & catat ke sheet _DOCUMENTS
 * Hanya boleh dieksekusi oleh akun Admin / Kepala Sekolah
 */
function uploadFileToDrive(fileBase64, fileName, mimeType, category, gradeLevel, userRole = null) {
  if (userRole === 'guru') {
    return errorResponse('Akses ditolak: Hanya akun Admin yang dapat mengunggah berkas.');
  }

  const lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    // 1. Cari atau buat folder "SiAGU_Arsip_Guru" di Google Drive
    const folderName = 'SiAGU_Arsip_Guru';
    let folder;
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
      folder.setDescription('Folder penyimpanan otomatis berkas perangkat ajar SiAGU');
    }

    // 2. Decode file base64 dan simpan ke folder
    const dataPart = fileBase64.indexOf(',') > -1 ? fileBase64.split(',')[1] : fileBase64;
    const decodedBytes = Utilities.base64Decode(dataPart);
    const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
    const file = folder.createFile(blob);

    // Atur akses agar pemilik link dapat melihat berkas
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileUrl = file.getUrl();
    const fileId = file.getId();

    // 3. Simpan ke database sheet _DOCUMENTS
    const docData = {
      title: fileName.replace(/\.[^/.]+$/, ''), // Hilangkan ekstensi
      category: category || 'Modul Ajar',
      gradeLevel: gradeLevel || '10',
      fileUrl: fileUrl,
      fileId: fileId
    };

    return saveDocument(docData);
  } catch (err) {
    return errorResponse('Gagal mengupload berkas ke Google Drive: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menghapus arsip dokumen
 * Hanya boleh dieksekusi oleh akun Admin / Kepala Sekolah
 */
function deleteDocument(docId, userRole = null) {
  if (userRole === 'guru') {
    return errorResponse('Akses ditolak: Guru tidak diizinkan menghapus dokumen arsip sekolah.');
  }

  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName('_DOCUMENTS');
    if (!sheet) throw new Error('Sheet _DOCUMENTS tidak ditemukan.');

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === docId) {
        // Hapus file dari Drive jika ada fileId
        const fileId = data[i][5];
        if (fileId) {
          try {
            DriveApp.getFileById(fileId).setTrashed(true);
          } catch (e) {
            console.warn('Gagal menghapus file dari Drive:', e);
          }
        }
        sheet.deleteRow(i + 1);
        return successResponse(null, 'Dokumen berhasil dihapus');
      }
    }
    return errorResponse('Dokumen tidak ditemukan');
  } catch (err) {
    return errorResponse('Gagal menghapus dokumen: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}
