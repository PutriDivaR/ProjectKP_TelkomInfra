const express = require('express');
const router  = express.Router();
const path    = require('path');
const db      = require(path.resolve(__dirname, '../config/db'));

// ============================================================
// PAGE ROUTE
// ============================================================
router.get('/todolist', (req, res) => {
  res.render('todolist', {
    title:     'TODO LIST TIP TA RIDAR',
    adminName: 'Admin User'
  });
});

// ============================================================
// MASTER TABLES
// ============================================================
router.get('/api/master-activity', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, activity_name, status_default, progress_default, solusi_default
      FROM master_activity
      ORDER BY id ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('❌ master-activity:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil master activity', error: err.message });
  }
});

router.get('/api/wilayah-ridar', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT sto, uic, pic, leader
      FROM wilayah_ridar
      ORDER BY sto ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('❌ wilayah-ridar:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data STO', error: err.message });
  }
});

// ============================================================
// TODOLIST ROUTES
// ============================================================

// GET all todolist
router.get('/api/todolist', async (req, res) => {
  try {
    console.log('🔍 Fetching todolist data...');
    const [rows] = await db.query(`
      SELECT
        kt.*,
        ma.activity_name AS activity,
        mw.odp_inputan,
        wr.uic,
        wr.pic,
        wr.leader
      FROM kendala_teknisi_sistem kt
      LEFT JOIN master_activity ma ON kt.activity_id = ma.id
      LEFT JOIN wilayah_ridar wr ON kt.sto = wr.sto
      LEFT JOIN master_wo mw ON kt.wonum = mw.wonum
      WHERE kt.wonum IS NOT NULL AND kt.wonum != ''
      ORDER BY kt.id DESC
    `);

    const mapped = rows.map(r => {
      const deen = (r.activity_teknisi && String(r.activity_teknisi).trim())
        || (r.update_status_deen && String(r.update_status_deen).trim())
        || '';
      return Object.assign({}, r, { update_status_deen: deen });
    });

    res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('❌ todolist GET ERROR:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data', error: err.message });
  }
});

// ⚠️ CRITICAL: DELETE ROUTES HARUS DI ATAS :id ROUTE

// DELETE ALL - Hapus semua data
router.delete('/api/todolist/delete-all', async (req, res) => {
  try {
    console.log('🗑️ DELETE ALL request received');
    const [result] = await db.query('DELETE FROM kendala_teknisi_sistem');
    
    console.log(`✅ Deleted ALL data - ${result.affectedRows} rows`);
    res.json({ 
      success: true, 
      message: `Semua data berhasil dihapus (${result.affectedRows} baris)`,
      deletedCount: result.affectedRows
    });
  } catch (err) {
    console.error('❌ todolist DELETE ALL:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal menghapus semua data', 
      error: err.message 
    });
  }
});

// DELETE SELECTED - Hapus data terpilih
router.post('/api/todolist/delete-selected', async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0)
    return res.status(400).json({ success: false, message: 'Tidak ada data yang dipilih' });

  try {
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await db.query(
      `DELETE FROM kendala_teknisi_sistem WHERE id IN (${placeholders})`,
      ids
    );

    console.log(`✅ Deleted ${result.affectedRows} selected items`);
    res.json({ 
      success: true, 
      message: `${result.affectedRows} data berhasil dihapus`,
      deletedCount: result.affectedRows
    });
  } catch (err) {
    console.error('❌ todolist DELETE SELECTED:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus data', error: err.message });
  }
});

// POST import
router.post('/api/todolist/import', async (req, res) => {
  const { rows } = req.body;

  if (!Array.isArray(rows) || rows.length === 0)
    return res.status(400).json({ success: false, message: 'Tidak ada data untuk diimport' });

  const validRows = rows.filter(r => r.wonum || r.activity_teknisi);
  if (validRows.length === 0)
    return res.status(400).json({ success: false, message: 'Semua baris kosong' });

  const startTime = Date.now();
  console.log(`⚡ Starting import for ${validRows.length} rows...`);

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const wonumList = validRows
      .map(r => r.wonum)
      .filter(w => w && w.trim())
      .map(w => w.trim());

    const uniqueWonums = [...new Set(wonumList)];
    
    let existingWonums = new Set();
    let wonumOdpMap = new Map();

    if (uniqueWonums.length > 0) {
      const placeholders = uniqueWonums.map(() => '?').join(',');
      const [existing] = await connection.query(
        `SELECT wonum, odp_inputan FROM master_wo WHERE wonum IN (${placeholders})`,
        uniqueWonums
      );

      existing.forEach(row => {
        existingWonums.add(row.wonum);
        wonumOdpMap.set(row.wonum, row.odp_inputan);
      });
    }

    const toInsertMasterWo = [];
    const toUpdateMasterWo = [];

    validRows.forEach(row => {
      const wonum = (row.wonum || '').trim();
      const odpInputan = (row.odp_inputan || '').trim();

      if (!wonum) return;

      if (!existingWonums.has(wonum)) {
        toInsertMasterWo.push([wonum, odpInputan]);
      } else {
        const currentOdp = wonumOdpMap.get(wonum);
        if (odpInputan && currentOdp !== odpInputan) {
          toUpdateMasterWo.push([odpInputan, wonum]);
        }
      }
    });

    if (toInsertMasterWo.length > 0) {
      const insertQuery = `INSERT INTO master_wo (wonum, odp_inputan, created_at, updated_at) VALUES ?`;
      const insertValues = toInsertMasterWo.map(([wonum, odp]) => [wonum, odp, new Date(), new Date()]);
      await connection.query(insertQuery, [insertValues]);
    }

    if (toUpdateMasterWo.length > 0) {
      const wonumList = toUpdateMasterWo.map(([_, wonum]) => `'${wonum}'`).join(',');
      const caseStatements = toUpdateMasterWo.map(([odp, wonum]) => `WHEN '${wonum}' THEN '${odp}'`).join(' ');
      const updateQuery = `UPDATE master_wo SET odp_inputan = CASE wonum ${caseStatements} END, updated_at = NOW() WHERE wonum IN (${wonumList})`;
      await connection.query(updateQuery);
    }

    const insertKendalaQuery = `INSERT INTO kendala_teknisi_sistem (wonum, activity_teknisi, month_date, sto_inputan, created_at, updated_at) VALUES ?`;
    const kendalaValues = validRows.map(row => [
      (row.wonum || '').trim(),
      (row.activity_teknisi || '').trim(),
      (row.month_date || '').trim(),
      (row.sto_inputan || '').trim(),
      new Date(),
      new Date()
    ]);

    await connection.query(insertKendalaQuery, [kendalaValues]);
    await connection.commit();

    const duration = Date.now() - startTime;

    res.json({ 
      success: true, 
      message: `Import berhasil: ${validRows.length} baris dalam ${(duration/1000).toFixed(2)} detik`, 
      count: validRows.length,
      insertedToMasterWo: toInsertMasterWo.length,
      updatedMasterWo: toUpdateMasterWo.length,
      duration: `${(duration/1000).toFixed(2)}s`
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('❌ todolist import ERROR:', err);
    res.status(500).json({ success: false, message: 'Gagal import data', error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// GET by ID - HARUS DI BAWAH delete-all dan delete-selected
router.get('/api/todolist/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT kt.*, ma.activity_name AS activity, mw.odp_inputan, wr.uic, wr.pic, wr.leader
      FROM kendala_teknisi_sistem kt
      LEFT JOIN master_activity ma ON kt.activity_id = ma.id
      LEFT JOIN wilayah_ridar wr ON kt.sto = wr.sto
      LEFT JOIN master_wo mw ON kt.wonum = mw.wonum
      WHERE kt.id = ?
    `, [id]);

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    const row = rows[0];
    row.update_status_deen = (row.activity_teknisi && String(row.activity_teknisi).trim())
      || (row.update_status_deen && String(row.update_status_deen).trim())
      || '';

    res.json({ success: true, data: row });
  } catch (err) {
    console.error('❌ todolist GET by ID:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data', error: err.message });
  }
});

// PUT update by ID
router.put('/api/todolist/:id', async (req, res) => {
  const { id } = req.params;
  const { activity_id, sto, status_todolist, solusi_progress } = req.body;

  if (!activity_id) return res.status(400).json({ success: false, message: 'Activity wajib dipilih' });
  if (!sto) return res.status(400).json({ success: false, message: 'STO wajib dipilih' });

  try {
    const [actRows] = await db.query('SELECT status_default, solusi_default FROM master_activity WHERE id = ?', [activity_id]);
    const actMaster = actRows[0] || {};

    const finalStatus = status_todolist || actMaster.status_default || '';
    const finalSolusi = solusi_progress || actMaster.solusi_default || '';

    const [result] = await db.query(`
      UPDATE kendala_teknisi_sistem
      SET activity_id = ?, sto = ?, status_todolist = ?, solusi_progress = ?, updated_at = NOW()
      WHERE id = ?
    `, [activity_id, sto, finalStatus, finalSolusi, id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    res.json({ success: true, message: 'Data berhasil diupdate' });
  } catch (err) {
    console.error('❌ todolist PUT:', err);
    res.status(500).json({ success: false, message: 'Gagal mengupdate data', error: err.message });
  }
});

// DELETE by ID - HARUS PALING BAWAH
router.delete('/api/todolist/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM kendala_teknisi_sistem WHERE id = ?', [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    console.log('✅ todolist deleted, ID:', id);
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (err) {
    console.error('❌ todolist DELETE:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus data', error: err.message });
  }
});

module.exports = router;