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
      WHERE kt.wonum IS NOT NULL 
        AND kt.wonum != ''
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

// POST import - BATCH PROCESSING VERSION
// POST import - BATCH PROCESSING WITH DUPLICATE PREVENTION
router.post('/api/todolist/import', async (req, res) => {
  const { rows } = req.body;

  if (!Array.isArray(rows) || rows.length === 0)
    return res.status(400).json({ success: false, message: 'Tidak ada data untuk diimport' });

  const validRows = rows.filter(r => r.wonum || r.activity_teknisi);
  if (validRows.length === 0)
    return res.status(400).json({ success: false, message: 'Semua baris kosong' });

  const startTime = Date.now();
  console.log(`⚡ Starting BATCH import for ${validRows.length} rows...`);

  let connection;
  try {
    connection = await db.getConnection();
    
    await connection.query('SET SESSION wait_timeout = 300');
    await connection.query('SET SESSION interactive_timeout = 300');
    
    await connection.beginTransaction();

    // ============================================================
    // STEP 1: BULK FETCH existing wonum from master_wo
    // ============================================================
    const wonumList = validRows
      .map(r => r.wonum)
      .filter(w => w != null && w !== '')
      .map(w => String(w).trim());

    const uniqueWonums = [...new Set(wonumList)];
    
    let existingWonums = new Set();
    let wonumOdpMap = new Map();

    if (uniqueWonums.length > 0) {
      console.log(`🔍 Checking ${uniqueWonums.length} unique wonum in master_wo...`);
      
      const FETCH_BATCH_SIZE = 1000;
      for (let i = 0; i < uniqueWonums.length; i += FETCH_BATCH_SIZE) {
        const batch = uniqueWonums.slice(i, i + FETCH_BATCH_SIZE);
        const placeholders = batch.map(() => '?').join(',');
        const [existing] = await connection.query(
          `SELECT wonum, odp_inputan FROM master_wo WHERE wonum IN (${placeholders})`,
          batch
        );

        existing.forEach(row => {
          existingWonums.add(row.wonum);
          wonumOdpMap.set(row.wonum, row.odp_inputan);
        });
      }

      console.log(`✅ Found ${existingWonums.size} existing wonum in master_wo`);
    }

    // ============================================================
    // STEP 1.5: CHECK existing wonum in kendala_teknisi_sistem
    // ============================================================
    let existingKendalaWonums = new Map(); // wonum -> id mapping

    if (uniqueWonums.length > 0) {
      console.log(`🔍 Checking existing wonum in kendala_teknisi_sistem...`);
      
      const FETCH_BATCH_SIZE = 1000;
      for (let i = 0; i < uniqueWonums.length; i += FETCH_BATCH_SIZE) {
        const batch = uniqueWonums.slice(i, i + FETCH_BATCH_SIZE);
        const placeholders = batch.map(() => '?').join(',');
        const [existing] = await connection.query(
          `SELECT id, wonum FROM kendala_teknisi_sistem WHERE wonum IN (${placeholders})`,
          batch
        );

        existing.forEach(row => {
          existingKendalaWonums.set(row.wonum, row.id);
        });
      }

      console.log(`✅ Found ${existingKendalaWonums.size} existing wonum in kendala_teknisi_sistem`);
    }

    // ============================================================
    // STEP 2: PREPARE BULK INSERT/UPDATE for master_wo
    // ============================================================
    const toInsertMasterWo = [];
    const toUpdateMasterWo = [];

    validRows.forEach(row => {
      const wonum = row.wonum != null ? String(row.wonum).trim() : '';
      const odpInputan = row.odp_inputan != null ? String(row.odp_inputan).trim() : '';

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

    // ============================================================
    // STEP 3: BATCH INSERT to master_wo
    // ============================================================
    if (toInsertMasterWo.length > 0) {
      console.log(`📥 Inserting ${toInsertMasterWo.length} new wonum to master_wo...`);
      
      const INSERT_BATCH_SIZE = 500;
      for (let i = 0; i < toInsertMasterWo.length; i += INSERT_BATCH_SIZE) {
        const batch = toInsertMasterWo.slice(i, i + INSERT_BATCH_SIZE);
        
        const insertQuery = `
          INSERT IGNORE INTO master_wo 
            (wonum, odp_inputan, created_at, updated_at) 
          VALUES ?
        `;
        
        const insertValues = batch.map(([wonum, odp]) => [
          wonum, 
          odp, 
          new Date(), 
          new Date()
        ]);
        
        await connection.query(insertQuery, [insertValues]);
        
        const progress = Math.min(i + INSERT_BATCH_SIZE, toInsertMasterWo.length);
        console.log(`  ✓ Progress: ${progress}/${toInsertMasterWo.length} wonum inserted`);
      }
      
      console.log(`✅ Bulk inserted ${toInsertMasterWo.length} new wonum to master_wo`);
    }

    // ============================================================
    // STEP 4: BATCH UPDATE to master_wo
    // ============================================================
    if (toUpdateMasterWo.length > 0) {
      console.log(`🔄 Updating ${toUpdateMasterWo.length} wonum in master_wo...`);
      
      const UPDATE_BATCH_SIZE = 100;
      for (let i = 0; i < toUpdateMasterWo.length; i += UPDATE_BATCH_SIZE) {
        const batch = toUpdateMasterWo.slice(i, i + UPDATE_BATCH_SIZE);
        
        for (const [odp, wonum] of batch) {
          await connection.query(
            'UPDATE master_wo SET odp_inputan = ?, updated_at = NOW() WHERE wonum = ?',
            [odp, wonum]
          );
        }
        
        const progress = Math.min(i + UPDATE_BATCH_SIZE, toUpdateMasterWo.length);
        console.log(`  ✓ Progress: ${progress}/${toUpdateMasterWo.length} wonum updated`);
      }
      
      console.log(`✅ Bulk updated ${toUpdateMasterWo.length} wonum in master_wo`);
    }

    // ============================================================
    // STEP 5: BATCH INSERT/UPDATE to kendala_teknisi_sistem
    // ============================================================
    console.log(`📥 Processing ${validRows.length} rows to kendala_teknisi_sistem...`);

    const KENDALA_BATCH_SIZE = 500;
    let insertedCount = 0;
    let updatedCount = 0;

    // Separate rows into INSERT and UPDATE
    const rowsToInsert = [];
    const rowsToUpdate = [];

    validRows.forEach(row => {
      const wonum = row.wonum != null ? String(row.wonum).trim() : '';
      
      if (!wonum) return;

      if (existingKendalaWonums.has(wonum)) {
        // UPDATE existing record
        rowsToUpdate.push({
          id: existingKendalaWonums.get(wonum),
          wonum,
          activity_teknisi: row.activity_teknisi != null ? String(row.activity_teknisi).trim() : '',
          month_date: row.month_date != null ? String(row.month_date).trim() : '',
          sto: row.sto != null ? String(row.sto).trim() : ''
        });
      } else {
        // INSERT new record
        rowsToInsert.push({
          wonum,
          activity_teknisi: row.activity_teknisi != null ? String(row.activity_teknisi).trim() : '',
          month_date: row.month_date != null ? String(row.month_date).trim() : '',
          sto: row.sto != null ? String(row.sto).trim() : ''
        });
      }
    });

    // BATCH INSERT
    if (rowsToInsert.length > 0) {
      console.log(`📥 Inserting ${rowsToInsert.length} NEW rows...`);
      
      for (let i = 0; i < rowsToInsert.length; i += KENDALA_BATCH_SIZE) {
        const batch = rowsToInsert.slice(i, i + KENDALA_BATCH_SIZE);
        
        const insertKendalaQuery = `
          INSERT INTO kendala_teknisi_sistem 
            (wonum, activity_teknisi, month_date, sto, created_at, updated_at) 
          VALUES ?
        `;

        const kendalaValues = batch.map(row => [
          row.wonum,
          row.activity_teknisi,
          row.month_date,
          row.sto,
          new Date(),
          new Date()
        ]);

        await connection.query(insertKendalaQuery, [kendalaValues]);
        
        insertedCount += batch.length;
        console.log(`  ✓ Progress: ${insertedCount}/${rowsToInsert.length} rows inserted`);
      }
    }

    // BATCH UPDATE
    if (rowsToUpdate.length > 0) {
      console.log(`🔄 Updating ${rowsToUpdate.length} EXISTING rows...`);
      
      const UPDATE_BATCH_SIZE = 100;
      for (let i = 0; i < rowsToUpdate.length; i += UPDATE_BATCH_SIZE) {
        const batch = rowsToUpdate.slice(i, i + UPDATE_BATCH_SIZE);
        
        for (const row of batch) {
          await connection.query(`
            UPDATE kendala_teknisi_sistem 
            SET activity_teknisi = ?, month_date = ?, sto = ?, updated_at = NOW()
            WHERE id = ?
          `, [row.activity_teknisi, row.month_date, row.sto, row.id]);
        }
        
        updatedCount += batch.length;
        console.log(`  ✓ Progress: ${updatedCount}/${rowsToUpdate.length} rows updated`);
      }
    }

    console.log(`✅ Total: ${insertedCount} inserted, ${updatedCount} updated`);

    await connection.commit();

    const duration = Date.now() - startTime;
    console.log(`⚡ BATCH import completed in ${duration}ms (${(duration/1000).toFixed(2)}s)`);

    res.json({ 
      success: true, 
      message: `Import berhasil: ${insertedCount} baris baru, ${updatedCount} baris di-update dalam ${(duration/1000).toFixed(2)} detik`, 
      count: validRows.length,
      inserted: insertedCount,
      updated: updatedCount,
      insertedToMasterWo: toInsertMasterWo.length,
      updatedMasterWo: toUpdateMasterWo.length,
      duration: `${(duration/1000).toFixed(2)}s`
    });

  } catch (err) {
    console.error('❌ todolist import ERROR:', err);
    
    if (connection) {
      try {
        await connection.rollback();
        console.log('🔄 Transaction rolled back');
      } catch (rollbackErr) {
        console.error('❌ Rollback error:', rollbackErr.message);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Gagal import data: ' + err.message, 
      error: err.message 
    });
  } finally {
    if (connection) {
      try {
        connection.release();
        console.log('✅ Connection released');
      } catch (releaseErr) {
        console.error('❌ Release error:', releaseErr.message);
      }
    }
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
