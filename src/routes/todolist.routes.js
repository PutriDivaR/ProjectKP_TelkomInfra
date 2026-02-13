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
// GET ALL TODOLIST
// ============================================================
router.get('/api/todolist', async (req, res) => {
  try {
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
      LEFT JOIN wilayah_ridar wr   ON kt.sto = wr.sto
      LEFT JOIN master_wo mw       ON kt.wonum = mw.wonum
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

// ============================================================
// ⚠️ DELETE ROUTES HARUS DI ATAS :id ROUTE
// ============================================================

// DELETE ALL
router.delete('/api/todolist/delete-all', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM kendala_teknisi_sistem');
    res.json({ success: true, message: `Semua data berhasil dihapus (${result.affectedRows} baris)`, deletedCount: result.affectedRows });
  } catch (err) {
    console.error('❌ todolist DELETE ALL:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus semua data', error: err.message });
  }
});

// DELETE SELECTED
router.post('/api/todolist/delete-selected', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0)
    return res.status(400).json({ success: false, message: 'Tidak ada data yang dipilih' });

  try {
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await db.query(`DELETE FROM kendala_teknisi_sistem WHERE id IN (${placeholders})`, ids);
    res.json({ success: true, message: `${result.affectedRows} data berhasil dihapus`, deletedCount: result.affectedRows });
  } catch (err) {
    console.error('❌ todolist DELETE SELECTED:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus data', error: err.message });
  }
});

// POST IMPORT (✅ DIPERBAIKI - error handling yang lebih baik)
router.post('/api/todolist/import', async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0)
    return res.status(400).json({ success: false, message: 'Tidak ada data untuk diimport' });

  const validRows = rows.filter(r => r.wonum || r.activity_teknisi);
  if (validRows.length === 0)
    return res.status(400).json({ success: false, message: 'Semua baris kosong' });

  const startTime = Date.now();
  let connection;
  try {
    connection = await db.getConnection();
    await connection.query('SET SESSION wait_timeout = 300');
    await connection.query('SET SESSION interactive_timeout = 300');
    await connection.beginTransaction();

    const wonumList    = validRows.map(r => r.wonum).filter(w => w != null && w !== '').map(w => String(w).trim());
    const uniqueWonums = [...new Set(wonumList)];
    let existingWonums = new Set();
    let wonumOdpMap    = new Map();

    if (uniqueWonums.length > 0) {
      const BATCH = 1000;
      for (let i = 0; i < uniqueWonums.length; i += BATCH) {
        const batch = uniqueWonums.slice(i, i + BATCH);
        const ph = batch.map(() => '?').join(',');
        const [ex] = await connection.query(`SELECT wonum, odp_inputan FROM master_wo WHERE wonum IN (${ph})`, batch);
        ex.forEach(r => { existingWonums.add(r.wonum); wonumOdpMap.set(r.wonum, r.odp_inputan); });
      }
    }

    let existingKendalaWonums = new Map();
    if (uniqueWonums.length > 0) {
      const BATCH = 1000;
      for (let i = 0; i < uniqueWonums.length; i += BATCH) {
        const batch = uniqueWonums.slice(i, i + BATCH);
        const ph = batch.map(() => '?').join(',');
        const [ex] = await connection.query(`SELECT id, wonum FROM kendala_teknisi_sistem WHERE wonum IN (${ph})`, batch);
        ex.forEach(r => existingKendalaWonums.set(r.wonum, r.id));
      }
    }

    const toInsertMW = [], toUpdateMW = [];
    validRows.forEach(row => {
      const wonum = row.wonum != null ? String(row.wonum).trim() : '';
      const odp   = row.odp_inputan != null ? String(row.odp_inputan).trim() : '';
      if (!wonum) return;
      if (!existingWonums.has(wonum)) toInsertMW.push([wonum, odp]);
      else if (odp && wonumOdpMap.get(wonum) !== odp) toUpdateMW.push([odp, wonum]);
    });

    if (toInsertMW.length > 0) {
      const BATCH = 500;
      for (let i = 0; i < toInsertMW.length; i += BATCH) {
        const batch = toInsertMW.slice(i, i + BATCH);
        await connection.query('INSERT IGNORE INTO master_wo (wonum, odp_inputan, created_at, updated_at) VALUES ?', [batch.map(([w,o]) => [w,o,new Date(),new Date()])]);
      }
    }

    if (toUpdateMW.length > 0) {
      for (const [odp, wonum] of toUpdateMW)
        await connection.query('UPDATE master_wo SET odp_inputan = ?, updated_at = NOW() WHERE wonum = ?', [odp, wonum]);
    }

    const rowsToInsert = [], rowsToUpdate = [];
    validRows.forEach(row => {
      const wonum = row.wonum != null ? String(row.wonum).trim() : '';
      if (!wonum) return;
      const obj = {
        wonum,
        activity_teknisi: row.activity_teknisi != null ? String(row.activity_teknisi).trim() : '',
        month_date:       row.month_date != null ? String(row.month_date).trim() : '',
        sto:              row.sto != null ? String(row.sto).trim() : ''
      };
      if (existingKendalaWonums.has(wonum)) rowsToUpdate.push({ ...obj, id: existingKendalaWonums.get(wonum) });
      else rowsToInsert.push(obj);
    });

    let insertedCount = 0, updatedCount = 0;
    const KBATCH = 500;
    if (rowsToInsert.length > 0) {
      for (let i = 0; i < rowsToInsert.length; i += KBATCH) {
        const batch = rowsToInsert.slice(i, i + KBATCH);
        await connection.query('INSERT INTO kendala_teknisi_sistem (wonum, activity_teknisi, month_date, sto, created_at, updated_at) VALUES ?',
          [batch.map(r => [r.wonum, r.activity_teknisi, r.month_date, r.sto, new Date(), new Date()])]);
        insertedCount += batch.length;
      }
    }
    if (rowsToUpdate.length > 0) {
      for (let i = 0; i < rowsToUpdate.length; i += 100) {
        for (const row of rowsToUpdate.slice(i, i + 100))
          await connection.query('UPDATE kendala_teknisi_sistem SET activity_teknisi=?, month_date=?, sto=?, updated_at=NOW() WHERE id=?',
            [row.activity_teknisi, row.month_date, row.sto, row.id]);
        updatedCount += Math.min(100, rowsToUpdate.length - i);
      }
    }

    await connection.commit();
    const duration = Date.now() - startTime;
    res.json({ success: true, message: `Import berhasil dalam ${(duration/1000).toFixed(2)}s`, count: validRows.length, inserted: insertedCount, updated: updatedCount, duration: `${(duration/1000).toFixed(2)}s` });

  } catch (err) {
    console.error('❌ Import error:', err);
    // ✅ DIPERBAIKI: Pengecekan connection sebelum rollback
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('❌ Rollback error:', rollbackErr);
      }
    }
    res.status(500).json({ success: false, message: 'Gagal import: ' + err.message, error: err.message });
  } finally {
    // ✅ DIPERBAIKI: Pengecekan connection sebelum release
    if (connection) {
      try {
        connection.release();
      } catch (releaseErr) {
        console.error('❌ Release error:', releaseErr);
      }
    }
  }
});

// ============================================================
// ✅ GET BY ID — SATU-SATUNYA, dengan progress_default AS progress
// ============================================================
router.get('/api/todolist/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT
        kt.*,
        ma.activity_name    AS activity,
        ma.progress_default AS progress,
        mw.odp_inputan,
        wr.uic,
        wr.pic,
        wr.leader
      FROM kendala_teknisi_sistem kt
      LEFT JOIN master_activity ma ON kt.activity_id = ma.id
      LEFT JOIN wilayah_ridar wr   ON kt.sto = wr.sto
      LEFT JOIN master_wo mw       ON kt.wonum = mw.wonum
      WHERE kt.id = ?
    `, [id]);

    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    const row = rows[0];
    row.update_status_deen =
      (row.activity_teknisi && String(row.activity_teknisi).trim()) ||
      (row.update_status_deen && String(row.update_status_deen).trim()) ||
      '';

    res.json({ success: true, data: row });
  } catch (err) {
    console.error('❌ todolist GET by ID:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data', error: err.message });
  }
});

// ============================================================
// ✅ PUT BY ID — dengan update odp_inputan
// ============================================================
router.put('/api/todolist/:id', async (req, res) => {
  const { id } = req.params;
  const { activity_id, sto, status_todolist, solusi_progress, odp_inputan } = req.body;

  if (!activity_id) return res.status(400).json({ success: false, message: 'Activity wajib dipilih' });
  if (!sto)         return res.status(400).json({ success: false, message: 'STO wajib dipilih' });

  try {
    // Get wonum dari kendala_teknisi_sistem
    const [ktRows] = await db.query('SELECT wonum FROM kendala_teknisi_sistem WHERE id = ?', [id]);
    if (ktRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    const wonum = ktRows[0].wonum;

    // Get default values dari master_activity
    const [actRows] = await db.query(
      'SELECT status_default, solusi_default FROM master_activity WHERE id = ?', [activity_id]
    );
    const actMaster = actRows[0] || {};

    const finalStatus = status_todolist || actMaster.status_default || '';
    const finalSolusi = solusi_progress || actMaster.solusi_default || '';

    // ✅ Update kendala_teknisi_sistem
    const [result] = await db.query(`
      UPDATE kendala_teknisi_sistem
      SET activity_id     = ?,
          sto             = ?,
          status_todolist = ?,
          solusi_progress = ?,
          updated_at      = NOW()
      WHERE id = ?
    `, [activity_id, sto, finalStatus, finalSolusi, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    // ✅ Update odp_inputan di master_wo jika ada perubahan
    if (odp_inputan !== undefined && odp_inputan !== null && wonum) {
      await db.query(`
        UPDATE master_wo 
        SET odp_inputan = ?, 
            updated_at = NOW() 
        WHERE wonum = ?
      `, [odp_inputan.trim(), wonum]);
    }

    res.json({ success: true, message: 'Data berhasil diupdate' });
  } catch (err) {
    console.error('❌ todolist PUT:', err);
    res.status(500).json({ success: false, message: 'Gagal mengupdate data', error: err.message });
  }
});

// ============================================================
// DELETE BY ID
// ============================================================
router.delete('/api/todolist/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM kendala_teknisi_sistem WHERE id = ?', [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (err) {
    console.error('❌ todolist DELETE:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus data', error: err.message });
  }
});

module.exports = router;