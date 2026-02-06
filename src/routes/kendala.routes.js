const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Daftar STO (kata pertama tiap baris) untuk dropdown & validasi
const STO_LIST = [
  'PBB', 'BKR', 'MIS', 'PKR', 'PWG', 'RBI', 'SOK', 'AMK', 'BLS', 'KLE', 'PMB', 'PNP', 'RGT', 'TAK', 'TBH',
  'BAG', 'BAS', 'DUM', 'SLJ', 'BKN', 'PPN', 'SAK', 'SEA', 'UBT', 'SGP', 'ARK', 'BGU', 'DRI', 'PJD', 'KDS', 'SYO',
  'PBB TIMUR', 'PBB BARAT'
];

// ============================
// REKAP DATA
// ============================
router.get('/', async (req, res) => {
  const q = (req.query.q || '').trim();

  const [data] = await db.query(`
    SELECT kp.*, mw.ticket_id
    FROM kendala_pelanggan kp
    LEFT JOIN master_wo mw ON kp.wonum = mw.wonum
    ORDER BY kp.created_at DESC
  `);

  const countProgress = data.filter(d => d.status_hi === 'PROGRESS').length;
  const countReject = data.filter(d => d.status_hi === 'REJECT').length;
  const countClosed = data.filter(d => d.status_hi === 'CLOSED').length;

  let filteredData = data;
  if (q) {
    const lower = q.toLowerCase();
    filteredData = data.filter(d => (d.wonum || '').toLowerCase().includes(lower));
  }

  res.render('kendala', {
    title: 'Rekap Kendala Pelanggan',
    mode: 'rekap',
    data,
    filteredData,
    countProgress,
    countReject,
    countClosed,
    q: req.query.q || '',
    saved: req.query.saved === '1',
    warningWonum: req.query.warning === 'wonum'
  });
});

// ============================
// FORM INPUT
// ============================
router.get('/input', async (req, res) => {
  const err = req.query.error;
  let listSto = [];
  try {
    const [rows] = await db.query('SELECT sto FROM wilayah_ridar ORDER BY sto');
    listSto = (rows || []).map(r => r.sto).filter(Boolean);
  } catch (e) {
    console.error('Load wilayah_ridar STO:', e.message);
  }
  if (listSto.length === 0) {
    listSto = STO_LIST;
  }
  res.render('kendala', {
    title: 'Input Kendala Pelanggan',
    mode: 'input',
    listSto,
    errorWonum: err === 'wonum_not_found',
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
    const { wonum, ticket_id, sto, tanggal_input, ttd_kb, status_hi, ttic, keterangan, nama_teknis } = req.body;
    const wonumTrim = (wonum && String(wonum).trim()) || '';
    if (!wonumTrim) {
      return res.redirect('/kendala/input?error=wonum_kosong');
    }

    const ticketIdVal = (ticket_id && String(ticket_id).trim()) ? String(ticket_id).trim() : null;
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
    }

    const stoValue = stoVal || (wo && wo.sto) || null;

    await db.query(
      `INSERT INTO kendala_pelanggan
       (wonum, tanggal_input, sto, ttd_kb, status_hi, ttic, keterangan, nama_teknis, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [wonumTrim, tanggal_input || null, stoValue, ttd_kb || null, status_hi || 'PROGRESS', ttic || null, keterangan || null, nama_teknis || null]
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

  res.render('kendala', {
    title: 'Detail Data Kendala',
    mode: 'edit',
    kendala: rows[0]
  });
});

// ============================
// UPDATE DATA
// ============================
router.post('/edit/:id', async (req, res) => {
  const { status_hi, ttic, keterangan, nama_teknis } = req.body;

  await db.query(`
    UPDATE kendala_pelanggan
    SET status_hi = ?, ttic = ?, keterangan = ?, nama_teknis = ?, updated_at = NOW()
    WHERE id = ?
  `, [status_hi, ttic, keterangan, nama_teknis, req.params.id]);

  res.redirect('/kendala');
});

module.exports = router;
