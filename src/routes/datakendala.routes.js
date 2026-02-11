// Helper: konversi serial Excel ke yyyy-mm-dd
function excelSerialToDate(serial) {
  if (!serial || isNaN(serial)) return serial;
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  if (date_info.getFullYear() < 1970) return serial;
  return date_info.toISOString().slice(0, 10);
}
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const csvParser = require('csv-parser');

const STO_LIST = [
  'PBB', 'BKR', 'MIS', 'PKR', 'PWG', 'RBI', 'SOK', 'AMK', 'BLS', 'KLE', 'PMB', 'PNP', 'RGT', 'TAK', 'TBH',
  'BAG', 'BAS', 'DUM', 'SLJ', 'BKN', 'PPN', 'SAK', 'SEA', 'UBT', 'SGP', 'ARK', 'BGU', 'DRI', 'PJD', 'KDS', 'SYO',
  'PBB TIMUR', 'PBB BARAT'
];

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

// Helper: ambil bulan saja dari tgl_manja (bisa format tanggal penuh)
function parseBulanFromTglManja(val) {
  if (val == null || val === '') return null;
  const s = String(val).trim();
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return months[d.getMonth()] + ' ' + d.getFullYear();
}

// ========== PAGE: Data Kendala (Kendala Teknik & Kendala Sistem) ==========
router.get('/', async (req, res) => {
  try {
    const activeTab = req.query.tab || 'teknik';
    const limit = Math.min(parseInt(req.query.limit) || 25, 100);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const q = (req.query.q || '').trim().replace(/%/g, '\\%').replace(/_/g, '\\_');
    const searchWonum = q ? `%${q}%` : null;

    let dataTeknik = [];
    let dataSistem = [];
    let total = 0;
    let totalPages = 0;


    // Query utama langsung ke master_wo (seperti daily)
    const whereClause = searchWonum ? 'WHERE wonum LIKE ?' : '';
    const params = searchWonum ? [searchWonum] : [];
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM master_wo ${whereClause}`,
      params
    );
    total = countResult[0].total;
    totalPages = Math.ceil(total / limit) || 1;

    [dataTeknik] = await db.query(`
      SELECT 
        wonum,
        sto,
        ticket_id,
        bulan,
        created_at,
        tgl_manja,
        status_daily as status_kpro,
        kendala as errorcode,
        kategori,
        catatan_teknisi,
        status_akhir
      FROM master_wo
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);
    dataSistem = dataTeknik;

    res.render('datakendala', {
      title: 'Data Kendala - Import File',
      brandText: 'Data Kendala',
      brandIcon: 'fa-file-excel',
      dataTeknik: dataTeknik || [],
      dataSistem: dataSistem || [],
      activeTab,
      pagination: { page, limit, total, totalPages },
      q: req.query.q || '',
      limit
    });
  } catch (err) {
    console.error('Data Kendala page error:', err.message);
    res.render('datakendala', {
      title: 'Data Kendala - Import File',
      brandText: 'Data Kendala',
      brandIcon: 'fa-file-excel',
      dataTeknik: [],
      dataSistem: [],
      activeTab: req.query.tab || 'teknik',
      pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
      q: '',
      limit: 25
    });
  }
});

// ========== API: Update Kategori (cancel / unsc) ==========
router.patch('/api/kategori/:wonum', async (req, res) => {
  try {
    const wonum = req.params.wonum;
    const { kategori } = req.body;
    if (!['cancel', 'unsc'].includes(String(kategori))) {
      return res.status(400).json({ success: false, message: 'Kategori harus cancel atau unsc' });
    }
    await db.query('UPDATE master_wo SET kategori = ?, updated_at = NOW() WHERE wonum = ?', [kategori, wonum]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Update kategori error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ========== KENDALA TEKNIK & SISTEM: Upload Preview (CSV) ==========
router.post('/upload-preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const filePath = req.file.path;
    const results = [];
    let columns = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => {
          results.push(data);
          if (columns.length === 0) columns = Object.keys(data);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    fs.unlink(filePath, () => {});
    return res.json({
      success: true,
      columns,
      preview: results.slice(0, 5),
      totalRows: results.length,
      fileName: req.file.originalname
    });
  } catch (err) {
    console.error('Upload preview error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Cek duplikat: sama wonum + tgl_manja (date) + status_akhir + errorcode -> skip di master_wo
async function isDuplicateKendala(wonum, tgl_manja, status_akhir, errorcode) {
  try {
    const tglNorm = tgl_manja ? new Date(tgl_manja).toISOString().split('T')[0] : null;
    const [rows] = await db.query(
      `SELECT 1 FROM master_wo WHERE wonum = ? AND (tgl_manja = ? OR (tgl_manja IS NULL AND ? IS NULL)) AND (status_akhir <=> ?) AND (kendala <=> ?) LIMIT 1`,
      [wonum, tglNorm, tglNorm, status_akhir || null, errorcode || null]
    );
    return rows && rows.length > 0;
  } catch (e) {
    return false;
  }
}

// ========== KENDALA TEKNIK & SISTEM: Upload CSV with mapping ==========
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const filePath = req.file.path;
    const results = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });
    fs.unlink(filePath, () => {});

    const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : {};
    const importedCount = { success: 0, failed: 0, skipped: 0 };
    const [validStoRows] = await db.query('SELECT sto FROM wilayah_ridar');
    const validStoSet = new Set((validStoRows || []).map(r => r.sto).filter(Boolean));

    // Ambil urutan kolom dari file CSV
    const csvColumns = results.length > 0 ? Object.keys(results[0]) : [];


    // Debug log mapping dan contoh row
    console.log('mapping:', mapping);
    console.log('csvColumns:', csvColumns);
    if (results.length > 0) console.log('first row:', results[0]);

    // Helper ambil value dari row, bisa by index (angka) atau nama (string)
    function getMappedValue(row, mapVal) {
      if (typeof mapVal === 'number') {
        // Ambil berdasarkan urutan kolom
        const colName = csvColumns[mapVal];
        return colName ? row[colName] : '';
      } else if (!isNaN(mapVal)) {
        // Jika string angka, konversi ke number
        const idx = Number(mapVal);
        const colName = csvColumns[idx];
        return colName ? row[colName] : '';
      } else {
        // Default: ambil berdasarkan nama
        return row[mapVal] || '';
      }
    }

    const errorDetails = [];
    for (const [i, row] of results.entries()) {
      try {
        const wonum = (getMappedValue(row, mapping.wonum || 'wonum') || '').toString().trim();
        if (!wonum) { importedCount.failed++; errorDetails.push({row: i+1, error: 'WONUM kosong'}); continue; }

        const ticket_id = (getMappedValue(row, mapping.ticket_id || 'track id') || '').toString().trim() || null;
        let sto = (getMappedValue(row, mapping.sto || 'sto') || '').toString().trim() || null;
        let bulan = getMappedValue(row, mapping.bulan || 'bulan') || null;
        let created_at = getMappedValue(row, mapping.created_at || 'date created') || null;
        let tgl_manja = getMappedValue(row, mapping.tgl_manja || 'tgl manja') || null;
        // Konversi serial Excel ke tanggal jika numeric
        if (created_at && !isNaN(created_at)) created_at = excelSerialToDate(Number(created_at));
        if (tgl_manja && !isNaN(tgl_manja)) tgl_manja = excelSerialToDate(Number(tgl_manja));
        if (created_at && /^\d{4}-\d{2}-\d{2}$/.test(created_at)) created_at = created_at + ' 00:00:00';
        const status_kpro = getMappedValue(row, mapping.status_kpro || 'status kpro') || null;
        const errorcode = getMappedValue(row, mapping.errorcode || 'errorcode') || getMappedValue(row, mapping.kendala || 'kendala') || null;
        const kategori = getMappedValue(row, mapping.kategori || 'kategori') || null;
        const catatan_teknisi = getMappedValue(row, mapping.catatan_teknisi || 'catatan teknisi') || null;
        const status_akhir = getMappedValue(row, mapping.status_akhir || 'progress akhir') || null;

        const isDup = await isDuplicateKendala(wonum, tgl_manja, status_akhir, errorcode);
        if (isDup) { importedCount.skipped++; continue; }

        if (sto && !validStoSet.has(sto) && STO_LIST.includes(sto)) {
          try {
            await db.query('INSERT INTO wilayah_ridar (sto) VALUES (?)', [sto]);
            validStoSet.add(sto);
          } catch (e) {
            if (e.code !== 'ER_DUP_ENTRY') errorDetails.push({row: i+1, error: e.message});
          }
        }
        if (sto && !validStoSet.has(sto)) sto = null;

        const [woRows] = await db.query('SELECT wonum FROM master_wo WHERE wonum = ?', [wonum]);
        if (!woRows || woRows.length === 0) {
          try {
            await db.query(
              'INSERT INTO master_wo (wonum, sto, ticket_id, bulan, created_at, tgl_manja, status_daily, kendala, kategori, catatan_teknisi, status_akhir, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
              [wonum, sto, ticket_id, bulan, created_at || null, tgl_manja || null, status_kpro, errorcode, kategori, catatan_teknisi, status_akhir]
            );
            importedCount.success++;
          } catch (e) {
            if (e.code !== 'ER_DUP_ENTRY') { importedCount.failed++; errorDetails.push({row: i+1, error: e.message}); continue; }
          }
        } else {
          try {
            await db.query(
              'UPDATE master_wo SET sto=COALESCE(?, sto), ticket_id=COALESCE(?, ticket_id), bulan=COALESCE(?, bulan), created_at=COALESCE(?, created_at), tgl_manja=COALESCE(?, tgl_manja), status_daily=COALESCE(?, status_daily), kendala=COALESCE(?, kendala), kategori=COALESCE(?, kategori), catatan_teknisi=COALESCE(?, catatan_teknisi), status_akhir=COALESCE(?, status_akhir), updated_at=NOW() WHERE wonum=?',
              [sto, ticket_id, bulan, created_at, tgl_manja, status_kpro, errorcode, kategori, catatan_teknisi, status_akhir, wonum]
            );
            importedCount.success++;
          } catch (e) {
            importedCount.failed++;
            errorDetails.push({row: i+1, error: 'Update master_wo failed: ' + e.message});
          }
        }
      } catch (rowErr) {
        importedCount.failed++;
        errorDetails.push({row: i+1, error: rowErr.message});
      }
    }
    return res.json({ success: true, message: `Imported ${importedCount.success} rows, ${importedCount.skipped} duplikat di-skip, ${importedCount.failed} gagal`, ...importedCount, errorDetails });
  } catch (err) {
    console.error('Upload error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ========== KENDALA TEKNIK & SISTEM: Upload JSON (Excel) ==========
router.post('/upload-json', async (req, res) => {
  try {
    const rows = req.body.rows || [];
    const mapping = req.body.mapping || {};
    if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ success: false, message: 'No rows provided' });
    const importedCount = { success: 0, failed: 0, skipped: 0 };
    const [validStoRows] = await db.query('SELECT sto FROM wilayah_ridar');
    const validStoSet = new Set((validStoRows || []).map(r => r.sto).filter(Boolean));


    for (const row of rows) {
      try {
        const wonum = (row[mapping.wonum || 'wonum'] || '').toString().trim();
        if (!wonum) { importedCount.failed++; continue; }

        const ticket_id = (row[mapping.ticket_id || 'track id'] || '').toString().trim() || null;
        let sto = (row[mapping.sto || 'sto'] || '').toString().trim() || null;
        let created_at = row[mapping.created_at || 'date created'] || null;
        let tgl_manja = row[mapping.tgl_manja || 'tgl manja'] || null;
        // Konversi serial Excel ke tanggal jika numeric
        if (created_at && !isNaN(created_at)) created_at = excelSerialToDate(Number(created_at));
        if (tgl_manja && !isNaN(tgl_manja)) tgl_manja = excelSerialToDate(Number(tgl_manja));
        const status_kpro = row[mapping.status_kpro || 'status kpro'] || null;
        const kendala = row[mapping.kendala || 'errorcode'] || null;
        const catatan_teknisi = row[mapping.catatan_teknisi || 'catatan teknisi'] || null;
        const status_akhir = row[mapping.status_akhir || 'progress akhir'] || null;
        const bulan = parseBulanFromTglManja(tgl_manja) || null;

        const isDup = await isDuplicateKendala(wonum, tgl_manja, status_akhir, kendala);
        if (isDup) { importedCount.skipped++; continue; }

        if (sto && !validStoSet.has(sto) && STO_LIST.includes(sto)) {
          try {
            await db.query('INSERT INTO wilayah_ridar (sto) VALUES (?)', [sto]);
            validStoSet.add(sto);
          } catch (e) {
            if (e.code !== 'ER_DUP_ENTRY') console.warn(e.message);
          }
        }
        if (sto && !validStoSet.has(sto)) sto = null;

        const [woRows] = await db.query('SELECT wonum FROM master_wo WHERE wonum = ?', [wonum]);
        if (!woRows || woRows.length === 0) {
          try {
            await db.query(
              'INSERT INTO master_wo (wonum, ticket_id, sto, status_daily, created_at, tgl_manja, bulan, kendala, kategori, catatan_teknisi, status_akhir, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, NOW())',
              [wonum, ticket_id, sto, 'OPEN', created_at || new Date(), tgl_manja || null, bulan, kendala, catatan_teknisi, status_akhir]
            );
            importedCount.success++;
          } catch (e) {
            if (e.code !== 'ER_DUP_ENTRY') { importedCount.failed++; continue; }
          }
        } else {
          if (ticket_id || sto || status_akhir || bulan || tgl_manja || kendala || catatan_teknisi) {
            try {
              await db.query(
                'UPDATE master_wo SET ticket_id=COALESCE(?, ticket_id), sto=COALESCE(?, sto), tgl_manja=COALESCE(?, tgl_manja), bulan=COALESCE(?, bulan), kendala=COALESCE(?, kendala), catatan_teknisi=COALESCE(?, catatan_teknisi), status_akhir=COALESCE(?, status_akhir), updated_at=NOW() WHERE wonum=?',
                [ticket_id, sto, tgl_manja, bulan, kendala, catatan_teknisi, status_akhir, wonum]
              );
              importedCount.success++;
            } catch (e) {
              console.warn('Update master_wo failed:', e.message);
              importedCount.failed++;
            }
          }
        }
      } catch (e) {
        console.warn('Row import failed:', e.message);
        importedCount.failed++;
      }
    }
    return res.json({ success: true, message: `Imported ${importedCount.success} rows, ${importedCount.skipped} duplikat di-skip, ${importedCount.failed} gagal`, ...importedCount });
  } catch (err) {
    console.error('Upload JSON error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ========== KENDALA TEKNIK & SISTEM: Export CSV ==========
router.get('/export', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        mw.wonum,
        mw.ticket_id as 'Track id',
        mw.sto as 'Sto',
        mw.bulan as 'Bulan',
        mw.created_at as 'date created',
        mw.tgl_manja as 'Tgl manja',
        mw.status_daily as 'Status kpro',
        mw.kendala as 'Errorcode',
        mw.kategori as 'Kategori',
        mw.catatan_teknisi as 'Catatan teknisi',
        mw.status_akhir as 'Progress akhir'
      FROM master_wo mw
      ORDER BY mw.created_at DESC
    `);
    const headers = ['wonum', 'Track id', 'Sto', 'Bulan', 'date created', 'Tgl manja', 'Status kpro', 'Errorcode', 'Kategori', 'Catatan teknisi', 'Progress akhir'];
    const csvLines = [headers.join(',')];
    for (const r of rows || []) {
      const line = headers.map(h => {
        const val = r[h] !== null && r[h] !== undefined ? String(r[h]) : '';
        return '"' + val.replace(/"/g, '""') + '"';
      }).join(',');
      csvLines.push(line);
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="kendala_teknik_sistem_export.csv"');
    res.send(csvLines.join('\n'));
  } catch (err) {
    console.error('Export error', err);
    res.status(500).send(err.message);
  }
});

module.exports = router;
