const express = require('express');
const router = express.Router();
const db = require('../config/db');

const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');



// Daftar STO (kata pertama tiap baris) untuk dropdown & validasi
const STO_LIST = [
  'PBB', 'BKR', 'MIS', 'PKR', 'PWG', 'RBI', 'SOK', 'AMK', 'BLS', 'KLE', 'PMB', 'PNP', 'RGT', 'TAK', 'TBH',
  'BAG', 'BAS', 'DUM', 'SLJ', 'BKN', 'PPN', 'SAK', 'SEA', 'UBT', 'SGP', 'ARK', 'BGU', 'DRI', 'PJD', 'KDS', 'SYO',
  'PBB TIMUR', 'PBB BARAT'
];

// ============================
// FORMAT TTD KB
// ============================
// Format: convert input to "X Hari" format
// Accepted: "5", "5 hari", "5 Hari"
// Returns null if invalid
const formatTtdKb = (input) => {
  if (!input) return null;
  
  const trimmed = String(input).trim();
  if (!trimmed) return null;
  
  // Match: angka (1-5 digit) optional whitespace optional "hari" (case-insensitive)
  const match = trimmed.match(/^(\d+)\s*(hari)?$/i);
  if (!match) {
    return null; // Invalid format
  }
  
  const days = match[1];
  return `${days} Hari`;
};

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const isValidDate = (value) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const buildInputDateTime = (row) => {
  const hasTanggalInput = isValidDate(row && row.tanggal_input);
  const hasCreatedAt = isValidDate(row && row.created_at);

  if (hasTanggalInput && hasCreatedAt) {
    const tanggalInput = new Date(row.tanggal_input);
    const createdAt = new Date(row.created_at);
    return new Date(
      tanggalInput.getFullYear(),
      tanggalInput.getMonth(),
      tanggalInput.getDate(),
      createdAt.getHours(),
      createdAt.getMinutes(),
      createdAt.getSeconds(),
      createdAt.getMilliseconds()
    );
  }

  if (hasCreatedAt) return new Date(row.created_at);
  if (hasTanggalInput) return new Date(row.tanggal_input);
  return null;
};

const buildLastUpdatedDateTime = (row) => {
  const hasUpdatedAt = isValidDate(row && row.updated_at);
  const hasCreatedAt = isValidDate(row && row.created_at);

  if (!hasUpdatedAt) return null;
  if (!hasCreatedAt) return new Date(row.updated_at);

  const updatedAt = new Date(row.updated_at);
  const createdAt = new Date(row.created_at);
  if (updatedAt.getTime() <= createdAt.getTime() + 1000) return null;

  return updatedAt;
};

const applyFilters = (rows, filters) => {
  const qLower = (filters.q || '').toLowerCase();
  const status = filters.status || '';
  const sto = filters.sto || '';
  const ttic = filters.ttic || '';
  const dateFilter = normalizeDate(filters.date);

  return rows.filter((row) => {
    if (qLower) {
      const wonum = (row.wonum || '').toLowerCase();
      const ticket = (row.ticket_id || '').toLowerCase();
      if (!wonum.includes(qLower) && !ticket.includes(qLower)) return false;
    }

    if (status && status !== 'ALL' && (row.status_hi || '') !== status) return false;
    if (sto && (row.sto || '') !== sto) return false;
    if (ttic && (row.ttic || '') !== ttic) return false;

    if (dateFilter) {
      const rowDate = normalizeDate(row.tanggal_input || row.created_at);
      if (!rowDate) return false;
      if (rowDate.getTime() !== dateFilter.getTime()) return false;
    }

    return true;
  });
};

const buildQueryString = (filters) => {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.status) params.set('status', filters.status);
  if (filters.sto) params.set('sto', filters.sto);
  if (filters.ttic) params.set('ttic', filters.ttic);
  if (filters.date) params.set('date', filters.date);
  if (filters.perPage) params.set('per_page', String(filters.perPage));
  return params.toString();
};

// ============================
// REKAP DATA
// ============================
router.get('/', async (req, res) => {
  const q = (req.query.q || '').trim();
  const status = (req.query.status || '').trim();
  const sto = (req.query.sto || '').trim();
  const ttic = (req.query.ttic || '').trim();
  const date = (req.query.date || '').trim();
  const perPage = parseInt(req.query.per_page, 10) || 50;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = perPage;
  const offset = (page - 1) * limit;

  const [allData] = await db.query(`
    SELECT kp.*, mw.ticket_id
    FROM kendala_pelanggan kp
    LEFT JOIN master_wo mw ON kp.wonum = mw.wonum
    ORDER BY kp.created_at DESC
  `);

  const data = allData.map((row) => {
    const inputDateTime = buildInputDateTime(row);
    const lastUpdatedDateTime = buildLastUpdatedDateTime(row);

    return {
      ...row,
      input_datetime: inputDateTime,
      last_updated_at: lastUpdatedDateTime
    };
  });

  const countProgress = data.filter(d => d.status_hi === 'PROGRESS').length;
  const countReject = data.filter(d => d.status_hi === 'REJECT').length;
  const countClosed = data.filter(d => d.status_hi === 'CLOSED').length;

  const filters = {
    q,
    status,
    sto,
    ttic,
    date,
    perPage
  };

  let filteredData = applyFilters(data, filters);

  const totalRows = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / limit));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const safeOffset = (currentPage - 1) * limit;

  const paginatedData = filteredData.slice(safeOffset, safeOffset + limit);

  const listSto = STO_LIST;
  const listTtic = Array.from(new Set(data.map(d => d.ttic).filter(Boolean)));
  const queryString = buildQueryString(filters);

  res.render('kendala', {
    title: 'Rekap Kendala Pelanggan',
    mode: 'rekap',
    data: paginatedData,
    filteredData: paginatedData,
    countProgress,
    countReject,
    countClosed,
    currentPage,
    totalPages,
    q: req.query.q || '',
    status,
    sto,
    ttic,
    date,
    perPage,
    listSto,
    listTtic,
    queryString,
    saved: req.query.saved === '1',
    warningWonum: req.query.warning === 'wonum'
  });
});

// ============================
// FORM INPUT
// ============================
router.get('/input', async (req, res) => {
  const err = req.query.error;
  // Gunakan STO_LIST yang lengkap (tidak query dari database yang mungkin tidak lengkap)
  const listSto = STO_LIST;
  res.render('kendala', {
    title: 'Input Kendala Pelanggan',
    mode: 'input',
    listSto,
    errorWonum: err === 'wonum_not_found',
    errorWonumInvalid: err === 'wonum_invalid',
    errorWonumDuplicate: err === 'wonum_duplicate',
    errorSaveFailed: err === 'save_failed',
    errorWonumKosong: err === 'wonum_kosong',
    errorMsg: req.query.msg ? decodeURIComponent(req.query.msg) : ''
  });
});

// ============================
// SIMPAN DATA
// ============================
router.post('/input', async (req, res) => {
  try {
    const { wonum, sto, tanggal_input, ttd_kb, status_hi, ttic, keterangan, nama_teknis } = req.body;
    const wonumTrim = (wonum && String(wonum).trim()) || '';
    
    // Validasi WONUM tidak kosong
    if (!wonumTrim) {
      return res.redirect('/kendala/input?error=wonum_kosong');
    }

    // Validasi format WONUM harus WOXXXXXXXXX (WO + 10 digit)
    const wonumRegex = /^WO\d{10}$/;
    if (!wonumRegex.test(wonumTrim)) {
      return res.redirect('/kendala/input?error=wonum_invalid&msg=' + encodeURIComponent('Format WONUM harus WO diikuti 10 digit angka (contoh: WO0334000001)'));
    }

    // Cek duplikat WONUM di kendala_pelanggan
    const [existingWonum] = await db.query(
      'SELECT wonum FROM kendala_pelanggan WHERE wonum = ?',
      [wonumTrim]
    );
    if (existingWonum && existingWonum.length > 0) {
      return res.redirect('/kendala/input?error=wonum_duplicate&msg=' + encodeURIComponent('WONUM sudah terdaftar. Gunakan WONUM yang berbeda.'));
    }

    // Generate Ticket ID otomatis dengan format IDXXXXXXXXX
    const generateTicketId = () => {
      const randomNum = Math.floor(100000000 + Math.random() * 900000000);
      return `ID${randomNum}`;
    };
    const ticketIdVal = generateTicketId();
    let stoVal = (sto && String(sto).trim()) ? String(sto).trim() : null;

    const [validStoRows] = await db.query('SELECT sto FROM wilayah_ridar');
    let validStoSet = new Set((validStoRows || []).map(r => r.sto).filter(Boolean));
    if (stoVal && !validStoSet.has(stoVal) && STO_LIST.includes(stoVal)) {
      try {
        await db.query('INSERT INTO wilayah_ridar (sto, uic, pic, leader) VALUES (?, NULL, NULL, NULL)', [stoVal]);
        validStoSet.add(stoVal);
      } catch (e) {
        if (e.code === 'ER_BAD_FIELD_ERROR' || (e.message && e.message.includes('Unknown column'))) {
          try {
            await db.query('INSERT INTO wilayah_ridar (sto) VALUES (?)', [stoVal]);
            validStoSet.add(stoVal);
          } catch (e2) {
            if (e2.code !== 'ER_DUP_ENTRY') console.error('Insert wilayah_ridar STO:', e2.message);
          }
        } else if (e.code !== 'ER_DUP_ENTRY') {
          console.error('Insert wilayah_ridar STO:', e.message);
        }
      }
    }
    if (stoVal && !validStoSet.has(stoVal)) {
      stoVal = null;
    }

    const [rows] = await db.query(
      'SELECT sto, ticket_id FROM master_wo WHERE wonum = ?',
      [wonumTrim]
    );
    let wo = rows && rows[0];

    if (!wo) {
      const insertWithTicketId = () => db.query(
        `INSERT INTO master_wo (wonum, ticket_id, sto, status_daily, created_at, updated_at) VALUES (?, ?, ?, 'OPEN', NOW(), NOW())`,
        [wonumTrim, ticketIdVal, stoVal]
      );
      const insertWithoutTicketId = () => db.query(
        `INSERT INTO master_wo (wonum, sto, status_daily, created_at, updated_at) VALUES (?, ?, 'OPEN', NOW(), NOW())`,
        [wonumTrim, stoVal]
      );
      try {
        await insertWithTicketId();
        wo = { sto: stoVal, ticket_id: ticketIdVal };
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          wo = { sto: stoVal, ticket_id: ticketIdVal };
        } else if (err.code === 'ER_BAD_FIELD_ERROR' || (err.message && err.message.includes('Unknown column'))) {
          try {
            await insertWithoutTicketId();
            wo = { sto: stoVal };
          } catch (err2) {
            if (err2.code === 'ER_BAD_FIELD_ERROR' || (err2.message && err2.message.includes('Unknown column'))) {
              await db.query(
                `INSERT INTO master_wo (wonum, sto, status_daily, created_at) VALUES (?, ?, 'OPEN', NOW())`,
                [wonumTrim, stoVal]
              );
              wo = { sto: stoVal };
            } else {
              console.error('Insert master_wo error:', err2.message);
              return res.redirect('/kendala/input?error=save_failed&msg=' + encodeURIComponent(err2.message));
            }
          }
        } else {
          console.error('Insert master_wo error:', err.message);
          return res.redirect('/kendala/input?error=save_failed&msg=' + encodeURIComponent(err.message));
        }
      }
    } else {
      // Jika wo sudah ada tapi tidak punya ticket_id, update dengan ticket_id baru
      if (!wo.ticket_id && ticketIdVal) {
        try {
          await db.query(
            'UPDATE master_wo SET ticket_id = ? WHERE wonum = ?',
            [ticketIdVal, wonumTrim]
          );
        } catch (err) {
          console.error('Update master_wo ticket_id error:', err.message);
        }
      }
    }

    const stoValue = stoVal || (wo && wo.sto) || null;

    // Format TTD KB
    const ttdKbFormatted = ttd_kb ? formatTtdKb(ttd_kb) : null;
    if (ttd_kb && !ttdKbFormatted) {
      return res.redirect('/kendala/input?error=save_failed&msg=' + encodeURIComponent('Format TTD KB tidak valid. Gunakan angka atau "angka hari" (contoh: 90 atau 90 hari)'));
    }

    // Generate ID unik untuk kendala_pelanggan
    const uniqueId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 10000);

    await db.query(
      `INSERT INTO kendala_pelanggan
       (id, wonum, tanggal_input, sto, ttd_kb, status_hi, ttic, keterangan, nama_teknis, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [uniqueId, wonumTrim, tanggal_input || null, stoValue, ttdKbFormatted || null, status_hi || 'PROGRESS', ttic || null, keterangan || null, nama_teknis || null]
    );

    return res.redirect('/kendala?saved=1');
  } catch (err) {
    const isFk = err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW' || (err.message && err.message.includes('foreign key'));
    if (isFk) {
      return res.redirect('/kendala/input?error=wonum_not_found&msg=' + encodeURIComponent(err.message));
    }
    console.error('Input kendala error:', err);
    return res.redirect('/kendala/input?error=save_failed&msg=' + encodeURIComponent(err.message));
  }
});

// ============================
// FORM EDIT (Detail Data Kendala)
// ============================
router.get('/edit/:id', async (req, res) => {
  const [rows] = await db.query(`
    SELECT kp.*, mw.ticket_id
    FROM kendala_pelanggan kp
    LEFT JOIN master_wo mw ON kp.wonum = mw.wonum
    WHERE kp.id = ?
  `, [req.params.id]);

  const rawKendala = rows && rows[0] ? rows[0] : null;
  const kendala = rawKendala ? {
    ...rawKendala,
    input_datetime: buildInputDateTime(rawKendala),
    last_updated_at: buildLastUpdatedDateTime(rawKendala)
  } : null;

  let listSto = STO_LIST;
  // Daftar STO sudah lengkap di hardcoded STO_LIST

  res.render('kendala', {
    title: 'Detail Data Kendala',
    mode: 'edit',
    kendala,
    listSto,
    errorMsg: req.query.msg ? decodeURIComponent(req.query.msg) : ''
  });
});

// ============================
// UPDATE DATA
// ============================
router.post('/edit/:id', async (req, res) => {
  const { status_hi, ttic, keterangan, nama_teknis, ttd_kb, sto } = req.body;

  // Format TTD KB
  const ttdKbFormatted = ttd_kb ? formatTtdKb(ttd_kb) : null;
  if (ttd_kb && !ttdKbFormatted) {
    return res.redirect('/kendala/edit/' + req.params.id + '?error=ttd_invalid&msg=' + encodeURIComponent('Format TTD KB tidak valid. Gunakan angka atau "angka hari" (contoh: 90 atau 90 hari)'));
  }

  // fetch current row to determine if anything changed
  const [rows] = await db.query('SELECT status_hi, ttic, keterangan, nama_teknis, ttd_kb, sto FROM kendala_pelanggan WHERE id = ?', [req.params.id]);
  const current = rows && rows[0];
  if (!current) {
    return res.redirect('/kendala');
  }

  const changed = (
    (String(current.status_hi || '') !== String(status_hi || '')) ||
    (String(current.ttic || '') !== String(ttic || '')) ||
    (String(current.keterangan || '') !== String(keterangan || '')) ||
    (String(current.nama_teknis || '') !== String(nama_teknis || '')) ||
    (String(current.ttd_kb || '') !== String(ttdKbFormatted || '')) ||
    (String(current.sto || '') !== String(sto || ''))
  );

  if (!changed) {
    // nothing changed — no notification
    return res.redirect('/kendala');
  }

  await db.query(`
    UPDATE kendala_pelanggan
    SET status_hi = ?, ttic = ?, keterangan = ?, nama_teknis = ?, ttd_kb = ?, sto = ?, updated_at = NOW()
    WHERE id = ?
  `, [status_hi, ttic, keterangan, nama_teknis, ttdKbFormatted || null, sto || null, req.params.id]);

  // redirect with saved flag so UI can show update notification
  res.redirect('/kendala?saved=1');
});

// ============================
// EXPORT DATA
// ============================
router.get('/export/excel', async (req, res) => {
  try {
    const filters = {
      q: (req.query.q || '').trim(),
      status: (req.query.status || '').trim(),
      sto: (req.query.sto || '').trim(),
      ttic: (req.query.ttic || '').trim(),
      date: (req.query.date || '').trim(),
      perPage: null
    };

    const [allData] = await db.query(`
      SELECT kp.*, mw.ticket_id
      FROM kendala_pelanggan kp
      LEFT JOIN master_wo mw ON kp.wonum = mw.wonum
      ORDER BY kp.created_at DESC
    `);

    const rows = applyFilters(allData, filters);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Kendala Pelanggan');

    // Set column widths
    worksheet.columns = [
      { width: 16 },
      { width: 16 },
      { width: 12 },
      { width: 10 },
      { width: 10 },
      { width: 12 },
      { width: 30 },
      { width: 18 },
      { width: 16 }
    ];

    // Border style
    const borderStyle = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };

    // Row 1: Title
    const titleRow = worksheet.addRow(['LAPORAN KENDALA PELANGGAN']);
    worksheet.mergeCells('A1:I1');
    titleRow.font = {
      bold: true,
      size: 14,
      color: { argb: 'FF0066CC' }
    };
    titleRow.alignment = {
      horizontal: 'center',
      vertical: 'center',
      wrapText: true
    };
    titleRow.height = 28;

    // Row 2: Empty
    worksheet.addRow([]);

    // Row 3: Header
    const headerRow = worksheet.addRow(['WONUM', 'TICKET ID', 'STATUS HI', 'STO', 'TTD KB', 'TTIC', 'KETERANGAN', 'INPUT DATE', 'NAMA TEKNISI']);
    headerRow.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 11
    };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' }
    };
    headerRow.eachCell((cell) => {
      cell.alignment = {
        horizontal: 'center',
        vertical: 'center',
        wrapText: true
      };
      cell.border = borderStyle;
    });
    headerRow.height = 25;

    // Data rows
    rows.forEach((row) => {
      const rawDate = row.updated_at || row.created_at || row.tanggal_input || null;
      const dateStr = rawDate ? new Date(rawDate).toLocaleString('id-ID') : '-';
      
      const dataRow = worksheet.addRow([
        row.wonum || '-',
        row.ticket_id || '-',
        row.status_hi || '-',
        row.sto || '-',
        row.ttd_kb || '-',
        row.ttic || '-',
        row.keterangan || '-',
        dateStr,
        row.nama_teknis || '-'
      ]);

      dataRow.eachCell((cell, colNumber) => {
        cell.border = borderStyle;
        cell.alignment = {
          horizontal: 'left',
          vertical: 'center',
          wrapText: true
        };

        // Center alignment for specific columns
        if ([1, 3, 4, 5, 6].includes(colNumber)) {
          cell.alignment = {
            horizontal: 'center',
            vertical: 'center',
            wrapText: true
          };
        }
      });

      dataRow.height = 20;
    });

    // Freeze header row
    worksheet.views = [
      { state: 'frozen', ySplit: 3 }
    ];

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="kendala_pelanggan.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export excel error:', err);
    res.status(500).send('Export excel failed');
  }
});

router.get('/export/pdf', async (req, res) => {
  try {
    const filters = {
      q: (req.query.q || '').trim(),
      status: (req.query.status || '').trim(),
      sto: (req.query.sto || '').trim(),
      ttic: (req.query.ttic || '').trim(),
      date: (req.query.date || '').trim(),
      perPage: null
    };

    const [allData] = await db.query(`
      SELECT kp.*, mw.ticket_id
      FROM kendala_pelanggan kp
      LEFT JOIN master_wo mw ON kp.wonum = mw.wonum
      ORDER BY kp.created_at DESC
    `);

    const rows = applyFilters(allData, filters);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="kendala_pelanggan.pdf"');

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 24 });
    doc.pipe(res);

    doc.fontSize(14).text('Kendala Pelanggan', { align: 'center' });
    doc.moveDown(0.5);

    const columns = [
      { header: 'WONUM', width: 90 },
      { header: 'TICKET ID', width: 90 },
      { header: 'STATUS', width: 70 },
      { header: 'STO', width: 50 },
      { header: 'TTD', width: 50 },
      { header: 'TTIC', width: 70 },
      { header: 'KETERANGAN', width: 170 },
      { header: 'INPUT DATE', width: 90 },
      { header: 'TEKNISI', width: 90 }
    ];

    const startX = doc.page.margins.left;
    let y = doc.y + 6;

    const drawHeader = () => {
      let x = startX;
      doc.fontSize(9).font('Helvetica-Bold');
      columns.forEach((col) => {
        doc.text(col.header, x, y, { width: col.width, ellipsis: true });
        x += col.width;
      });
      doc.moveTo(startX, y + 12).lineTo(startX + columns.reduce((a, c) => a + c.width, 0), y + 12).stroke('#cccccc');
      y += 18;
      doc.font('Helvetica');
    };

    drawHeader();

    rows.forEach((row) => {
      let x = startX;
      const rawDate = row.updated_at || row.created_at || row.tanggal_input || null;
      const dateStr = rawDate ? new Date(rawDate).toLocaleDateString('id-ID') : '-';
      const values = [
        row.wonum || '-',
        row.ticket_id || '-',
        row.status_hi || '-',
        row.sto || '-',
        row.ttd_kb || '-',
        row.ttic || '-',
        row.keterangan || '-',
        dateStr,
        row.nama_teknis || '-'
      ];

      if (y > doc.page.height - 40) {
        doc.addPage();
        y = doc.page.margins.top;
        drawHeader();
      }

      doc.fontSize(8);
      values.forEach((val, idx) => {
        doc.text(String(val), x, y, { width: columns[idx].width, ellipsis: true });
        x += columns[idx].width;
      });
      y += 14;
    });

    doc.end();
  } catch (err) {
    console.error('Export pdf error:', err);
    res.status(500).send('Export pdf failed');
  }
});

// ============================
// DELETE DATA (via POST)
// ============================
router.post('/delete/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM kendala_pelanggan WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete kendala error:', err.message || err);
    res.status(500).json({ ok: false, error: err.message || 'delete_failed' });
  }
});


// ============================
// EXPORT EXCEL
// ============================
router.get('/export/excel', async (req, res) => {
  const [data] = await db.query(`
    SELECT kp.*, mw.ticket_id
    FROM kendala_pelanggan kp
    LEFT JOIN master_wo mw ON kp.wonum = mw.wonum
    ORDER BY kp.created_at DESC
  `);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Kendala');

  worksheet.columns = [
    { header: 'WONUM', key: 'wonum', width: 20 },
    { header: 'TICKET ID', key: 'ticket_id', width: 20 },
    { header: 'STATUS HI', key: 'status_hi', width: 15 },
    { header: 'STO', key: 'sto', width: 15 },
    { header: 'TTD KB', key: 'ttd_kb', width: 15 },
    { header: 'TTIC', key: 'ttic', width: 15 },
    { header: 'KETERANGAN', key: 'keterangan', width: 30 },
    { header: 'NAMA TEKNISI', key: 'nama_teknis', width: 20 }
  ];

  data.forEach(row => worksheet.addRow(row));

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=kendala.xlsx'
  );

  await workbook.xlsx.write(res);
  res.end();
});

// ============================
// UPLOAD JSON (Excel/CSV Import)
// ============================
router.post('/upload-json', async (req, res) => {
  try {
    const rows = req.body.rows || [];
    const mapping = req.body.mapping || {};
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No rows provided' });
    }

    const importedCount = { success: 0, failed: 0, skipped: 0 };
    const [validStoRows] = await db.query('SELECT sto FROM wilayah_ridar');
    const validStoSet = new Set((validStoRows || []).map(r => r.sto).filter(Boolean));

    const normalizeKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const fieldAliases = {
      wonum: ['wonum', 'wonumber', 'wono', 'workordernumber', 'nomororder', 'noorder', 'nomorwo', 'wo'],
      sto: ['sto', 'witel', 'site', 'lokasi', 'wilayah'],
      tanggal_input: ['tanggalinput', 'inputdate', 'tglinput', 'tanggal', 'date', 'createdate'],
      ttd_kb: ['ttdkb', 'ttd', 'ttdkbhari', 'durasi', 'hari'],
      status_hi: ['statushi', 'status', 'statuskendala', 'hi'],
      ttic: ['ttic', 'sla', 'durasittic'],
      keterangan: ['keterangan', 'kendala', 'deskripsi', 'problem', 'catatan'],
      nama_teknis: ['namateknis', 'namateknisi', 'teknisi', 'pic', 'petugas']
    };

    const csvColumns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const detectMappingFromColumns = () => {
      const guessed = {};
      Object.entries(fieldAliases).forEach(([field, aliases]) => {
        let selected = '';
        for (const col of csvColumns) {
          const nCol = normalizeKey(col);
          if (aliases.includes(nCol)) {
            selected = col;
            break;
          }
        }
        if (!selected) {
          for (const col of csvColumns) {
            const nCol = normalizeKey(col);
            if (aliases.some((a) => nCol.includes(a) || a.includes(nCol))) {
              selected = col;
              break;
            }
          }
        }
        if (selected) guessed[field] = selected;
      });
      return guessed;
    };

    const autoMapping = detectMappingFromColumns();
    const effectiveMapping = {
      ...autoMapping,
      ...Object.fromEntries(Object.entries(mapping || {}).filter(([, v]) => String(v || '').trim() !== ''))
    };

    const formatDateYMD = (dateObj) => {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const normalizeImportedDate = (value) => {
      if (value === null || value === undefined || String(value).trim() === '') return null;

      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return formatDateYMD(value);
      }

      if (typeof value === 'number' && Number.isFinite(value)) {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const converted = new Date(excelEpoch.getTime() + Math.round(value * 86400000));
        if (!Number.isNaN(converted.getTime())) return formatDateYMD(converted);
      }

      const raw = String(value).trim();
      const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
      if (dmy) {
        const day = Number(dmy[1]);
        const month = Number(dmy[2]);
        const year = Number(dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]);
        const converted = new Date(year, month - 1, day);
        if (!Number.isNaN(converted.getTime())) return formatDateYMD(converted);
      }

      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) return formatDateYMD(parsed);

      return null;
    };

    const normalizeStatusHi = (value) => {
      const normalized = String(value || '').trim().toUpperCase();
      if (!normalized) return 'PROGRESS';
      if (['PROGRESS', 'PROCESS', 'ON PROGRESS', 'ONPROGRESS'].includes(normalized)) return 'PROGRESS';
      if (['REJECT', 'REJECTED'].includes(normalized)) return 'REJECT';
      if (['CLOSED', 'CLOSE', 'DONE', 'SELESAI'].includes(normalized)) return 'CLOSED';
      return 'PROGRESS';
    };

    console.log('Excel upload - mapping manual:', mapping);
    console.log('Excel upload - mapping auto:', autoMapping);
    console.log('Excel upload - mapping final:', effectiveMapping);
    console.log('Excel upload - row count:', rows.length);
    if (rows.length > 0) console.log('Excel upload - first row:', rows[0]);

    // Helper: ambil value dari row berdasarkan mapping
    function getMappedValue(row, mapVal) {
      const rowKeys = Object.keys(row || {});

      if (typeof mapVal === 'number') {
        const colName = csvColumns[mapVal];
        return colName ? row[colName] : '';
      } else if (!isNaN(mapVal)) {
        const idx = Number(mapVal);
        const colName = csvColumns[idx];
        return colName ? row[colName] : '';
      } else {
        if (row[mapVal] !== undefined && row[mapVal] !== null) return row[mapVal];
        const wanted = normalizeKey(mapVal);
        for (const key of rowKeys) {
          if (normalizeKey(key) === wanted) return row[key];
        }
        return '';
      }
    }

    if (!effectiveMapping.wonum) {
      return res.status(400).json({
        success: false,
        message: 'Kolom WONUM tidak terdeteksi otomatis. Mohon pastikan ada kolom WONUM/WO/No Order.'
      });
    }

    for (const [i, row] of rows.entries()) {
      try {
        // Validasi WONUM
        const wonumRaw = (getMappedValue(row, effectiveMapping.wonum || 'wonum') || '').toString().trim();
        const wonum = wonumRaw.toUpperCase();
        if (!wonum) {
          importedCount.failed++;
          console.log(`Row ${i+1} WONUM kosong`);
          continue;
        }

        // Validasi format WONUM harus WO+10 digit
        const wonumRegex = /^WO\d{10}$/;
        if (!wonumRegex.test(wonum)) {
          importedCount.failed++;
          console.log(`Row ${i+1} WONUM format invalid: ${wonum}`);
          continue;
        }

        // Cek duplikat WONUM
        const [existingWonum] = await db.query(
          'SELECT wonum FROM kendala_pelanggan WHERE wonum = ?',
          [wonum]
        );
        if (existingWonum && existingWonum.length > 0) {
          importedCount.skipped++;
          console.log(`Row ${i+1} WONUM sudah ada: ${wonum}`);
          continue;
        }

        // Ambil data dari mapping
        let sto = (getMappedValue(row, effectiveMapping.sto || 'sto') || '').toString().trim().toUpperCase() || null;
        const tanggalInputRaw = getMappedValue(row, effectiveMapping.tanggal_input || 'tanggal_input');
        const tanggal_input = normalizeImportedDate(tanggalInputRaw);
        const ttd_kb_raw = getMappedValue(row, effectiveMapping.ttd_kb || 'ttd_kb') || null;
        const status_hi = normalizeStatusHi(getMappedValue(row, effectiveMapping.status_hi || 'status_hi'));
        const ttic = (getMappedValue(row, effectiveMapping.ttic || 'ttic') || '').toString().trim() || null;
        const keterangan = (getMappedValue(row, effectiveMapping.keterangan || 'keterangan') || '').toString().trim() || null;
        const nama_teknis = (getMappedValue(row, effectiveMapping.nama_teknis || 'nama_teknis') || '').toString().trim() || null;

        // Format TTD KB
        const ttdKbFormatted = ttd_kb_raw ? formatTtdKb(ttd_kb_raw) : null;
        if (ttd_kb_raw && !ttdKbFormatted) {
          importedCount.failed++;
          console.log(`Row ${i+1} TTD KB format invalid: ${ttd_kb_raw}`);
          continue;
        }

        // Insert STO jika belum ada
        if (sto && !validStoSet.has(sto) && STO_LIST.includes(sto)) {
          try {
            await db.query('INSERT INTO wilayah_ridar (sto) VALUES (?)', [sto]);
            validStoSet.add(sto);
          } catch (e) {
            if (e.code !== 'ER_DUP_ENTRY') {
              console.error(`Insert wilayah_ridar error:`, e.message);
            }
          }
        }
        if (sto && !validStoSet.has(sto)) {
          sto = null;
        }

        // Cek atau buat di master_wo
        const [existingMasterWo] = await db.query(
          'SELECT sto FROM master_wo WHERE wonum = ?',
          [wonum]
        );
        let woExists = existingMasterWo && existingMasterWo.length > 0;
        
        if (!woExists) {
          // Generate Ticket ID
          const generateTicketId = () => {
            const randomNum = Math.floor(100000000 + Math.random() * 900000000);
            return `ID${randomNum}`;
          };
          const ticketIdVal = generateTicketId();
          
          try {
            await db.query(
              `INSERT INTO master_wo (wonum, ticket_id, sto, status_daily, created_at, updated_at) VALUES (?, ?, ?, 'OPEN', NOW(), NOW())`,
              [wonum, ticketIdVal, sto]
            );
          } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR' || (err.message && err.message.includes('Unknown column'))) {
              try {
                await db.query(
                  `INSERT INTO master_wo (wonum, sto, status_daily, created_at, updated_at) VALUES (?, ?, 'OPEN', NOW(), NOW())`,
                  [wonum, sto]
                );
              } catch (err2) {
                console.error('Insert master_wo error:', err2.message);
                importedCount.failed++;
                continue;
              }
            } else if (err.code !== 'ER_DUP_ENTRY') {
              console.error('Insert master_wo error:', err.message);
              importedCount.failed++;
              continue;
            }
          }
        }

        // Insert ke kendala_pelanggan
        const uniqueId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 10000);
        
        try {
          await db.query(
            `INSERT INTO kendala_pelanggan
             (id, wonum, tanggal_input, sto, ttd_kb, status_hi, ttic, keterangan, nama_teknis, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [uniqueId, wonum, tanggal_input || null, sto, ttdKbFormatted || null, status_hi, ttic, keterangan, nama_teknis]
          );
          importedCount.success++;
        } catch (err) {
          console.error(`Insert kendala_pelanggan error (row ${i+1}):`, err.message);
          importedCount.failed++;
        }

      } catch (err) {
        console.error(`Row ${i+1} error:`, err.message);
        importedCount.failed++;
      }
    }

    const message = `Import selesai: ${importedCount.success} berhasil, ${importedCount.skipped} skip, ${importedCount.failed} gagal`;
    return res.json({ success: true, message, ...importedCount });
  } catch (err) {
    console.error('Upload JSON error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================
// EXPORT PDF
// ============================
router.get('/export/pdf', async (req, res) => {
  const [data] = await db.query(`
    SELECT kp.*, mw.ticket_id
    FROM kendala_pelanggan kp
    LEFT JOIN master_wo mw ON kp.wonum = mw.wonum
    ORDER BY kp.created_at DESC
  `);

  const doc = new PDFDocument({ margin: 30, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=kendala.pdf');

  doc.pipe(res);

  doc.fontSize(14).text('Laporan Kendala Pelanggan', { align: 'center' });
  doc.moveDown();

  data.forEach((d, i) => {
    doc.fontSize(8).text(
      `${i + 1}. ${d.wonum} | ${d.ticket_id || '-'} | ${d.status_hi} | ${d.sto || '-'}`
    );
  });

  doc.end();
});


module.exports = router;
