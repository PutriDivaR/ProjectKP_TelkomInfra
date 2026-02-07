const express = require("express");
const router = express.Router();
const db = require("../config/db");
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const csvParser = require('csv-parser');

// ensure upload folder exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

/**
 * LIST DAILY
 * sumber: master_wo
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 25;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    // Build WHERE clause for date filtering
    let whereClause = '1=1';
    let params = [];
    if (startDate && endDate) {
      endDate.setHours(23, 59, 59, 999);
      whereClause = 'DATE(created_at) >= ? AND DATE(created_at) <= ?';
      params = [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]];
    }

    // Get total count
    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM master_wo WHERE ${whereClause}`, params);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get paginated data
    const sql = `
      SELECT 
        wonum, nama, lat, lang, package_name, ticket_id,
        regional, sto, status_daily, status_akhir, odp_inputan, created_at, updated_at
      FROM master_wo
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(sql, [...params, limit, offset]);

    // Compute KPI counts based on status_daily from all data (not just current page)
    const countSql = `SELECT status_daily FROM master_wo WHERE ${whereClause}`;
    const [allRows] = await db.query(countSql, params);
    
    const get = v => (v||'').toString().toUpperCase();
    const counts = {
      workfail: allRows.filter(r => get(r.status_daily) === 'WORKFAIL').length,
      startwork: allRows.filter(r => get(r.status_daily) === 'STARTWORK').length,
      cancelwork: allRows.filter(r => get(r.status_daily) === 'CANCELWORK').length,
      complete: allRows.filter(r => ['COMPLETE', 'DONE'].includes(get(r.status_daily))).length
    };

    return res.render('dailyhouse', { 
      data: rows, 
      counts,
      pagination: { page, limit, total, totalPages },
      startDate: req.query.startDate || '',
      endDate: req.query.endDate || ''
    });
  } catch (err) {
    console.error('Daily list error', err);
    return res.status(500).send(err.message);
  }
});

/**
 * DETAIL DAILY
 */
router.get('/:wonum', async (req, res) => {
  try {
    const wonum = req.params.wonum;

    const woSql = 'SELECT * FROM master_wo WHERE wonum = ?';
    const logSql = `
      SELECT 
        activity, activity_teknisi, status_todolist,
        solusi_progress, updated_at
      FROM kendala_teknisi_sistem
      WHERE wonum = ?
      ORDER BY updated_at DESC
    `;

    const [woRows] = await db.query(woSql, [wonum]);
    if (!woRows || woRows.length === 0) return res.status(404).send('WO tidak ditemukan');

    const [logs] = await db.query(logSql, [wonum]);

    return res.render('detail', {
      data: woRows[0],
      logs
    });
  } catch (err) {
    console.error('Daily detail error', err);
    return res.status(500).send(err.message);
  }
});

/**
 * UPDATE DAILY (allowed fields: lat, lang, package_name, status, status_akhir, sto, odp_todolist)
 */
router.post('/update/:wonum', async (req, res) => {
  try {
    const wonum = req.params.wonum;
    const { lat, lang, package_name, status, status_akhir, sto, odp_todolist, solusi_progress } = req.body;

    // Validate sto if provided
    let stoVal = sto || null;
    if (stoVal) {
      const [stoCheck] = await db.query('SELECT sto FROM wilayah_ridar WHERE sto = ?', [stoVal]);
      if (!stoCheck || stoCheck.length === 0) {
        console.debug(`Validation: sto ${stoVal} not found, setting to NULL`);
        stoVal = null;
      }
    }

    const updateWO = `
      UPDATE master_wo 
      SET lat=?, lang=?, package_name=?, status_daily=?, status_akhir=?, sto=?, odp_todolist=?, updated_at=NOW()
      WHERE wonum=?
    `;

    const insertLog = `
      INSERT INTO kendala_teknisi_sistem
      (wonum, activity, activity_teknisi, status_todolist, solusi_progress, created_at, updated_at)
      VALUES (?, 'Daily Housekeeping', 'Update Daily', ?, ?, NOW(), NOW())
    `;

    await db.query(updateWO, [lat, lang, package_name, status, status_akhir, stoVal, odp_todolist, wonum]);
    try { await db.query(insertLog, [wonum, status_akhir || status, solusi_progress]); } catch (e) { console.warn('log insert failed:', e.message); }

    return res.json({ success: true });
  } catch (err) {
    console.error('Daily update error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Provide distinct status choices (from status_daily)
router.get('/api/status', async (req, res) => {
  try {
    const defaults = ['WORKFAIL','CANCELWORK','COMPLETE','STARTWORK'];
    return res.json({ success: true, data: defaults });
  } catch (err) {
    console.error('status api error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Provide distinct status_akhir choices
router.get('/api/status-akhir', async (req, res) => {
  try {
    // Large list of predefined status_akhir values
    const defaults = [
      'BENJAR ODC | DONE LANJUT PT2',
      'BENJAR ODC | PENGAJUAN BOQ',
      'BENJAR ODC | PROGRES QE',
      'BENJAR ODP | DONE',
      'BENJAR ODP | DONE DAN PS',
      'BENJAR ODP | OGP',
      'BUTUH BENJAR ODC',
      'BUTUH BENJAR ODC | DONE',
      'BUTUH BENJAR ODC | DONE DAN PS',
      'BUTUH GANTI PS 1:4 KE PS 1:8 - OGP',
      'BUTUH GANTI PS 1:4 KE PS 1:8 - PS',
      'BUTUH GANTI PS 1:4 KE PS 1:8 | DONE',
      'BUTUH GANTI PS 1:4 KE PS 1:8 | OGP',
      'BUTUH GANTI PS 1:4 KE PS 1:8 | PS',
      'BUTUH GANTI PS 1:8 | DONE',
      'BUTUH GANTI PS 1:8 | DONE PASANG DAN PS',
      'BUTUH GANTI PS 1:8 | OGP',
      'BUTUH TANAM TIANG',
      'CALL PROSES VISIT',
      'CANCEL | BEDA SEGMENT',
      'CANCEL | BIAYA KEMAHALAN',
      'CANCEL | CHANGE DATEK',
      'CANCEL | CHANGE PAKET',
      'CANCEL | CLEANSING',
      'CANCEL | CP RNA > 2 HARI',
      'CANCEL | DOUBLE INPUT',
      'CANCEL | FU REVOKE',
      'CANCEL | GAGAL CHANGE DATEK',
      'CANCEL | GANTI NAMA',
      'CANCEL | GANTI PAKET',
      'CANCEL | INPUT ULANG',
      'CANCEL | KENDALA IZIN',
      'CANCEL | LAYANAN TIDAK SESUAI',
      'CANCEL | OVER BOUNDERY/SALAH TAGGING',
      'CANCEL | PELANGGAN BATAL LAYANAN',
      'CANCEL | PELANGGAN RAGU',
      'CANCEL | PENDING BULAN DEPAN',
      'CANCEL | PENDING PELANGGAN > 2 HARI',
      'CANCEL | PENDING TANPA ESTIMASI',
      'CANCEL | SUDAH ADA INDIHOME',
      'CANCEL | SUDAH PAKAI PROVIDER LAIN',
      'CANCEL | TIDAK MERASA MEMOHON',
      'CEK ALPRO',
      'CHANGE DATEK',
      'CHANGE SEGMENT',
      'COMPLETED',
      'CP RNA / CP SALAH',
      'DC EXISTING',
      'DISTRIBUSI RETI | DONE LANJUT PT2',
      'DISTRIBUSI RETI | OGP',
      'DISTRIBUSI TIDAK TEMBUS | DONE LANJUT PT2',
      'DISTRIBUSI TIDAK TEMBUS | OGP QE DISTRIBUSI',
      'EXPAND ODP | DONE',
      'EXPAND ODP | OGP',
      'EXPAND ODP | REDAMAN DIATAS 16.00',
      'FEEDER RETI | DONE LANJUT PT2',
      'FEEDER RETI | DONE UKUR',
      'FEEDER RETI | OGP ANALISA',
      'FEEDER RETI | OGP UKUR',
      'FEEDER RETI | PENGAJUAN QE',
      'FEEDER TIDAK TEMBUS | DONE LANJUT PT2',
      'FEEDER TIDAK TEMBUS | DONE UKUR',
      'FEEDER TIDAK TEMBUS | OGP ANALISA',
      'FEEDER TIDAK TEMBUS | OGP UKUR',
      'FEEDER TIDAK TEMBUS | PENGAJUAN QE',
      'FEEDER TIDAK TEMBUS | PROGRES QE',
      'FO ACT',
      'FO UIM',
      'IZIN DEVELOPER / SATPAM KOMPLEK',
      'KENDALA CUACA',
      'KENDALA IKG/IKR',
      'KENDALA INPUTAN',
      'KENDALA IZIN | DONE',
      'KENDALA IZIN | DONE DAN PS',
      'KENDALA MATERIAL',
      'KENDALA NTE',
      'KENDALA PELANGGAN',
      'KENDALA PELANGGAN | PENDING PELANGGAN',
      'KENDALA PELANGGAN | PENDING PELANGGAN SUDAH HR',
      'KENDALA PELANGGAN | PENDING PELANGGAN TIDAK ADA ESTIMASI',
      'KENDALA SISTEM | PONR - COMPLETED',
      'KENDALA SPBT',
      'LOKASI HUJAN',
      'NTE HABIS',
      'ODP BELUM GOLIVE',
      'ODP BELUM GOLIVE KONTRUKSI',
      'ODP LOS GARANSI KONTRUKSI',
      'ODP LOS GARANSI KONTRUKSI | DONE',
      'ODP LOS GARANSI KONTRUKSI | DONE DAN PS',
      'ODP LOS GARANSI KONTRUKSI | DONE PERBAIKI PELANGGAN BATAL',
      'ODP LOSS | BUTUH NORMALISASI BRANCHING',
      'ODP LOSS | DISTRIBUSI OK',
      'ODP LOSS | DISTRIBUSI OK DAN PS',
      'ODP LOSS | DISTRIBUSI RETI',
      'ODP LOSS | DISTRIBUSI TIDAK TEMBUS',
      'ODP LOSS | DONE',
      'ODP LOSS | DONE DAN PS',
      'ODP LOSS | DONE PERBAIKI PELANGGAN BATAL',
      'ODP LOSS | FEEDER OK',
      'ODP LOSS | FEEDER OK DAN PS',
      'ODP LOSS | FEEDER RETI',
      'ODP LOSS | FEEDER TIDAK TEMBUS',
      'ODP LOSS | NORMALISASI BRANCHING | DONE',
      'ODP LOSS | OGP',
      'ODP RETI',
      'ODP RETI | BUTUH NORMALISASI BRANCHING',
      'ODP RETI | DISTRIBUSI OK',
      'ODP RETI | DISTRIBUSI OK DAN PS',
      'ODP RETI | DISTRIBUSI RETI',
      'ODP RETI | DISTRIBUSI RETI MENUNGGU APPROVAL GANTI KU',
      'ODP RETI | DISTRIBUSI TIDAK TEMBUS',
      'ODP RETI | DONE',
      'ODP RETI | DONE DAN PS',
      'ODP RETI | DONE PERBAIKI PELANGGAN BATAL',
      'ODP RETI | FEEDER OK',
      'ODP RETI | FEEDER OK DAN PS',
      'ODP RETI | FEEDER RETI',
      'ODP RETI | NORMALISASI BRANCHING | DONE',
      'ODP RETI | OGP',
      'ODP RETI GARANSI KONTRUKSI',
      'ODP RETI GARANSI KONTRUKSI | DONE',
      'ODP RETI GARANSI KONTRUKSI | DONE DAN PS',
      'ODP RETI GARANSI KONTRUKSI | DONE PERBAIKI PELANGGAN BATAL',
      'ODP RETI/LOSS',
      'ODP RUSAK | DONE BENJAR',
      'ODP RUSAK | DONE BENJAR DAN PS',
      'ODP RUSAK | DONE BENJAR PELANGGAN CANCEL',
      'ODP RUSAK | ODP BERANTAKAN',
      'ODP RUSAK | ODP KOSONG',
      'ODP RUSAK | ODP TIDAK ADA TUTUP',
      'ODP TIDAK ADA SPLITER 1:8',
      'ODP-BANDWITDH RADIO',
      'ON PROGRESS',
      'OVER BOUNDARY',
      'PASSIVE SPLITTER 1:8 RUSAK',
      'PENDING | CP RNA < 2 HARI',
      'PENDING | CP RNA > 2 HARI',
      'PENDING | DC EXISTING BUTUH KONFIRMASI',
      'PENDING | HR OKE | PENDING PELANGGAN',
      'PENDING | INDIKASI RESELLER',
      'PENDING | KENDALA CUACA HUJAN',
      'PENDING | PENDING PELANGGAN < 2 HARI',
      'PENDING | PENDING PELANGGAN > 2 HARI',
      'PENDING TEKNISI',
      'PI - ALPRO READY',
      'PI - ANTRIAN TEKNISI',
      'PI - BELUM DI PROGRESS',
      'PI - PENJADWALAN (MAX 2 HARI)',
      'PI - TARIK DC',
      'PONR',
      'PRA - MENUNGGU PENJADWALAN MANJA H+',
      'PRE-REGISTERED',
      'PROSES CREATE MYI',
      'PROSES VALDAT ODP FULL',
      'PROVISION ISSUED',
      'PT 2 | KENDALA ODP FULL ( NOK EXPAND)',
      'PT 2 | KENDALA ODP FULL ( OK EXPAND)',
      'PT 2 | TERCOVER KU < 250 M',
      'PT 3 | CROSSING JALAN',
      'PT 3 | JARAK JAUH (Lebih 350 M)',
      'PT 3 | TARIKAN KU DAN DC 250 - 350 M',
      'PT 4 | CROSSING JALAN',
      'PT 4 | TIDAK ADA ALPRO (Lebih 2KM)',
      'PT1 | ONU FULL',
      'PT2 + TIANG  FEEDER FULL',
      'PT2 + TIANG  FEEDER TIDAK TEMBUS',
      'PT2 + TIANG | > 4 BATANG',
      'PT2 + TIANG | CANCEL PELANGGAN',
      'PT2 + TIANG | CORE READY | OGP INSTAL ODP',
      'PT2 + TIANG | DEKAT 3 PHASE',
      'PT2 + TIANG | DISTRIBUSI FULL',
      'PT2 + TIANG | DISTRIBUSI RETI',
      'PT2 + TIANG | DISTRIBUSI TIDAK TEMBUS',
      'PT2 + TIANG | DONE TANAM',
      'PT2 + TIANG | DONE TANAM DAN PS',
      'PT2 + TIANG | FEEDER RETI',
      'PT2 + TIANG | IZIN OK',
      'PT2 + TIANG | MENUNGGU APPROVAL ANGGARAN BS',
      'PT2 + TIANG | MENUNGGU GOLIVE',
      'PT2 + TIANG | OGP PENGURUSAN IZIN',
      'PT2 + TIANG | PENGAJUAN GOLIVE',
      'PT2 + TIANG | SUDAH GOLIVE',
      'PT2 + TIANG | SUDAH GOLIVE DAN PS',
      'PT2 + TIANG | SURVEY CORE',
      'PT2 + TIANG | TIDAK ADA SPACE TANAM',
      'PT2 + TIANG | TIDAK DAPAT IZIN TANAM',
      'PT2 | CANCEL PELANGGAN',
      'PT2 | COMCASE ODC',
      'PT2 | COMCASE ODC - DONE',
      'PT2 | COMCASE ODC - DONE PELANGGAN BATAL',
      'PT2 | COMCASE ODC - OGP',
      'PT2 | CORE READY - OGP INSTAL ODP',
      'PT2 | DISTRIBUSI FULL',
      'PT2 | DISTRIBUSI OK',
      'PT2 | DISTRIBUSI RETI',
      'PT2 | DISTRIBUSI TIDAK TEMBUS',
      'PT2 | FEEDER & DIST RUSAK',
      'PT2 | FEEDER OK',
      'PT2 | FEEDER RETI',
      'PT2 | FEEDER TIDAK TEMBUS',
      'PT2 | MENUNGGU APPROVAL ANGGARAN BS',
      'PT2 | MENUNGGU GOLIVE',
      'PT2 | NORMALISASI BRANCING - DONE',
      'PT2 | NORMALISASI BRANCING - DONE PS',
      'PT2 | NORMALISASI BRANCING - OGP',
      'PT2 | ODC 48',
      'PT2 | PENGAJUAN GOLIVE',
      'PT2 | PORT MODUL HABIS',
      'PT2 | SUDAH GOLIVE',
      'PT2 | SUDAH GOLIVE DAN PS',
      'PT2 | SUDAH GOLIVE PELANGGAN BATAL',
      'PT2 | SURVEY CORE',
      'PT2 | WAITING QE FEEDER',
      'PT2 | WAITING QE/CO FEEDER',
      'PT2 | WAITING RESILENSI FEEDER',
      'PT3 | CROSSING JALAN BESAR',
      'PT3 | DISTRIBUSI FULL',
      'PT3 | JARAK JAUH > DARI 350M',
      'PT3 | ODP BELUM GOLIVE KONTRUKSI',
      'PT3 | SUDAH GOLIVE',
      'PT3 | SUDAH GOLIVE DAN PS',
      'PT3 | SUDAH GOLIVE PELANGGAN CANCEL',
      'PT3 | TARIKAN DARI KU DAN DC 250 - 350 M',
      'PT3/PT4 | OGP KONSTRUKSI',
      'PT4 | FEEDER FULL',
      'PT4 | TIDAK ADA ALPRO',
      'REBOUNDARY ODP',
      'SEND SURVEY',
      'SISA WO READY BELUM PROGRES',
      'SOLUSI ALTERNATIF PT1 | DONE GANTI PASSIVE SPLITTER 1:8',
      'SOLUSI ALTERNATIF PT1 | DONE JALUR ALTERNATIF',
      'SOLUSI ALTERNATIF PT1 | DONE PORT CABUTAN',
      'SOLUSI ALTERNATIF PT1 | DONE PS GANTI PASSIVE SPLITTER 1:8',
      'SOLUSI ALTERNATIF PT1 | DONE PS JALUR ALTERNATIF',
      'SOLUSI ALTERNATIF PT1 | DONE PS PORT CABUTAN',
      'SOLUSI ALTERNATIF PT1 | DONE PS SURAT PERNYATAAN TIANG',
      'SOLUSI ALTERNATIF PT1 | DONE SURAT PERNYATAAN TIANG',
      'SOLUSI ALTERNATIF PT1 | OGP',
      'SPBT | CANCEL PELANGGAN',
      'SPBT | DONE',
      'SPBT | DONE DAN PS',
      'SPBT | HOLD ANGGARAN',
      'SPBT | KENDALA PELANGGAN',
      'SPBT | MENUNGGU GANTI PAKET',
      'SPBT | OGP INSTALASI',
      'SPBT | OGP SURVEY',
      'SPBT | TIDAK DAPAT IZIN',
      'TARIK DC',
      'TIANG | > 4 BATANG',
      'TIANG | BUTUH TAMBAH TIANG (MAX 4B)',
      'TIANG | CANCEL PELANGGAN',
      'TIANG | DEKAT 3 PHASE',
      'TIANG | DONE TANAM',
      'TIANG | DONE TANAM DAN PS',
      'TIANG | DONE TANAM PELANGGAN BATAL',
      'TIANG | IZIN OK',
      'TIANG | OGP PENGURUSAN IZIN',
      'TIANG | TIDAK ADA SPACE TANAM',
      'TIANG | TIDAK DAPAT IZIN TANAM',
      'WAPPR',
      'WO OGP SURVEY',
      'WO SORE',
      'BENJAR ODP',
      'PT 2 | KENDALA ODP FULL',
      'CANCEL | SUDAH ADA SC BGES'
    ];
    return res.json({ success: true, data: defaults });
  } catch (err) {
    console.error('status_akhir api error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * UPLOAD PREVIEW - Read CSV headers and return them for column mapping
 * POST /daily/upload-preview
 * Accepts: multipart/form-data with 'file' field
 * Returns: { success: true, columns: ['wonum', 'nama', ...], preview: [...rows] }
 */
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

/**
 * UPLOAD CSV with column mapping
 * POST /daily/upload
 * Body: multipart with 'file' and 'mapping' fields
 * mapping = JSON string like { "wonum": "WO_ID", "lat": "Latitude", "lang": "Longitude", ... }
 */
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

    // Parse mapping from request body
    const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : {};
    const importedCount = { success: 0, failed: 0 };

    for (const row of results) {
      try {
        // Map CSV columns to our fields using provided mapping
        const wonum = (row[mapping.wonum || 'wonum'] || '').toString().trim();
        if (!wonum) {
          importedCount.failed++;
          console.debug('Row skipped: no wonum');
          continue;
        }

        const nama = row[mapping.nama || 'nama'] || '';
        const ticket_id = row[mapping.ticket_id || 'ticket_id'] || '';
        let sto = row[mapping.sto || 'sto'] || '';
        const regional = row[mapping.regional || 'regional'] || '';
        const lat = row[mapping.lat || 'lat'] || '';
        const lang = row[mapping.lang || 'lang'] || '';
        const package_name = row[mapping.package_name || 'package_name'] || '';
        const status = row[mapping.status || 'status'] || 'STARTWORK';
        const status_akhir = row[mapping.status_akhir || 'status_akhir'] || '';
        const odp_inputan = row[mapping.odp_inputan || 'odp_inputan'] || '';
        const odp_todolist = row[mapping.odp_todolist || 'odp_todolist'] || '';

        // Validate sto if provided
        if (sto) {
          const [stoCheck] = await db.query('SELECT sto FROM wilayah_ridar WHERE sto = ?', [sto]);
          if (!stoCheck || stoCheck.length === 0) {
            console.debug(`Row validation: sto ${sto} not found, setting to NULL`);
            sto = null;
          }
        }

        // Check if wonum already exists
        const [check] = await db.query('SELECT wonum FROM master_wo WHERE wonum = ?', [wonum]);
        if (check && check.length > 0) {
          // Update existing row
          const [updateRes] = await db.query(
            'UPDATE master_wo SET nama=?, ticket_id=?, sto=?, regional=?, lat=?, lang=?, package_name=?, status_daily=?, status_akhir=?, odp_inputan=?, odp_todolist=?, updated_at=NOW() WHERE wonum=?',
            [nama, ticket_id, sto, regional, lat, lang, package_name, status, status_akhir, odp_inputan, odp_todolist, wonum]
          );
          if (updateRes && updateRes.affectedRows > 0) {
            importedCount.success++;
            try {
              await db.query(
                'INSERT INTO kendala_teknisi_sistem (wonum, activity, activity_teknisi, status_todolist, solusi_progress, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
                [wonum, 'Upload CSV', 'Update', status_akhir || 'UPDATED', '']
              );
            } catch (e) {
              console.warn('Log insert failed:', e.message);
            }
          } else {
            importedCount.failed++;
            console.debug(`Row failed: update returned no affected rows for wonum ${wonum}`);
          }
          continue;
        }

        // Insert new row
        const [insertRes] = await db.query(
          'INSERT INTO master_wo (wonum, nama, ticket_id, sto, regional, lat, lang, package_name, status_daily, status_akhir, odp_inputan, odp_todolist, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [wonum, nama, ticket_id, sto, regional, lat, lang, package_name, status, status_akhir, odp_inputan, odp_todolist]
        );

        if (insertRes && insertRes.affectedRows > 0) {
          importedCount.success++;
          try {
            await db.query(
              'INSERT INTO kendala_teknisi_sistem (wonum, activity, activity_teknisi, status_todolist, solusi_progress, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
              [wonum, 'Upload CSV', 'Import', status_akhir || 'STARTWORK', '']
            );
          } catch (e) {
            console.warn('Log insert failed:', e.message);
          }
        } else {
          importedCount.failed++;
          console.debug(`Row failed: insert returned no affected rows for wonum ${wonum}`);
        }
      } catch (rowErr) {
        console.warn('Row import failed:', rowErr.message);
        importedCount.failed++;
      }
    }

    return res.json({ 
      success: true, 
      message: `Imported ${importedCount.success} rows, ${importedCount.failed} failed`,
      ...importedCount
    });
  } catch (err) {
    console.error('Upload error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Export CSV
router.get('/export', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT wonum, nama, sto, status_akhir, lat, lang, package_name, created_at, updated_at FROM master_wo ORDER BY created_at DESC');
    const headers = ['wonum','nama','sto','status_akhir','lat','lang','package_name','created_at','updated_at'];
    const csvLines = [headers.join(',')];
    for (const r of rows) {
      const line = headers.map(h => '"' + ((r[h] !== null && r[h] !== undefined) ? String(r[h]).replace(/"/g,'""') : '') + '"').join(',');
      csvLines.push(line);
    }
    const csvData = csvLines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ridar_export.csv"');
    res.send(csvData);
  } catch (err) {
    console.error('Export error', err);
    return res.status(500).send(err.message);
  }
});

// Accept JSON rows for import (used by client-side Excel parsing)
router.post('/upload-json', async (req, res) => {
  try {
    const rows = req.body.rows || [];
    const mapping = req.body.mapping || {};
    if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ success: false, message: 'No rows provided' });

    const importedCount = { success: 0, failed: 0 };

    for (const row of rows) {
      try {
        const wonum = (row[mapping.wonum || 'wonum'] || '').toString().trim();
        if (!wonum) { importedCount.failed++; console.debug('Row skipped: no wonum'); continue; }

        const nama = row[mapping.nama || 'nama'] || '';
        const ticket_id = row[mapping.ticket_id || 'ticket_id'] || '';
        let sto = row[mapping.sto || 'sto'] || '';
        const regional = row[mapping.regional || 'regional'] || '';
        const lat = row[mapping.lat || 'lat'] || '';
        const lang = row[mapping.lang || 'lang'] || '';
        const package_name = row[mapping.package_name || 'package_name'] || '';
        const status = row[mapping.status || 'status'] || 'STARTWORK';
        const status_akhir = row[mapping.status_akhir || 'status_akhir'] || '';
        const odp_inputan = row[mapping.odp_inputan || 'odp_inputan'] || '';
        const odp_todolist = row[mapping.odp_todolist || 'odp_todolist'] || '';

        // Validate sto if provided
        if (sto) {
          const [stoCheck] = await db.query('SELECT sto FROM wilayah_ridar WHERE sto = ?', [sto]);
          if (!stoCheck || stoCheck.length === 0) {
            console.debug(`Row validation: sto ${sto} not found, setting to NULL`);
            sto = null;
          }
        }

        const [check] = await db.query('SELECT wonum FROM master_wo WHERE wonum = ?', [wonum]);
        if (check && check.length > 0) {
          // Update existing row
          const [updateRes] = await db.query(
            'UPDATE master_wo SET nama=?, ticket_id=?, sto=?, regional=?, lat=?, lang=?, package_name=?, status_daily=?, status_akhir=?, odp_inputan=?, odp_todolist=?, updated_at=NOW() WHERE wonum=?',
            [nama, ticket_id, sto, regional, lat, lang, package_name, status, status_akhir, odp_inputan, odp_todolist, wonum]
          );
          if (updateRes && updateRes.affectedRows > 0) {
            importedCount.success++;
            try {
              await db.query(
                'INSERT INTO kendala_teknisi_sistem (wonum, activity, activity_teknisi, status_todolist, solusi_progress, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
                [wonum, 'Upload Excel', 'Update', status_akhir || 'UPDATED', '']
              );
            } catch (e) { console.warn('Log insert failed:', e.message); }
          } else {
            importedCount.failed++; console.debug(`Row failed: update no affected rows for ${wonum}`);
          }
          continue;
        }

        const [insertRes] = await db.query(
          'INSERT INTO master_wo (wonum, nama, ticket_id, sto, regional, lat, lang, package_name, status_daily, status_akhir, odp_inputan, odp_todolist, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [wonum, nama, ticket_id, sto, regional, lat, lang, package_name, status, status_akhir, odp_inputan, odp_todolist]
        );

        if (insertRes && insertRes.affectedRows > 0) {
          importedCount.success++;
          try {
            await db.query(
              'INSERT INTO kendala_teknisi_sistem (wonum, activity, activity_teknisi, status_todolist, solusi_progress, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
              [wonum, 'Upload Excel', 'Import', status_akhir || 'STARTWORK', '']
            );
          } catch (e) { console.warn('Log insert failed:', e.message); }
        } else {
          importedCount.failed++; console.debug(`Row failed: insert no affected rows for ${wonum}`);
        }
      } catch (e) {
        console.warn('Row import failed:', e.message);
        importedCount.failed++;
      }
    }

    return res.json({ success: true, message: `Imported ${importedCount.success} rows, ${importedCount.failed} failed`, ...importedCount });
  } catch (err) {
    console.error('Upload JSON error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
