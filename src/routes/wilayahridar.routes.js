const express = require('express');
const router  = express.Router();
const path    = require('path');
const db      = require(path.resolve(__dirname, '../config/db'));

// ============================================================
// PAGE ROUTE → Render wilayahridar.ejs
// ============================================================
router.get('/wilayah-ridar', (req, res) => {
  res.render('wilayahridar', {
    title:     'Wilayah Ridar - Sumber Data',
    adminName: 'Admin User'
  });
});

// ============================================================
// API ROUTES - Wilayah Ridar (CRUD)
// Primary key = sto (varchar, unik) — tidak ada kolom id
// ============================================================

// GET - Ambil semua data wilayah_ridar
router.get('/api/wilayah-ridar', async (req, res) => {
  const query = `
    SELECT 
      sto,
      uic,
      pic,
      leader,
      created_at,
      updated_at
    FROM wilayah_ridar
    ORDER BY sto ASC
  `;

  try {
    const [results] = await db.query(query);
    console.log('✅ Wilayah data fetched:', results.length, 'rows');
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('❌ Error fetching wilayah data:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data',
      error:   error.message
    });
  }
});

// GET - Ambil data wilayah_ridar berdasarkan STO
router.get('/api/wilayah-ridar/:sto', async (req, res) => {
  const sto = decodeURIComponent(req.params.sto).toUpperCase().trim();
  const query = `
    SELECT 
      sto,
      uic,
      pic,
      leader,
      created_at,
      updated_at
    FROM wilayah_ridar
    WHERE UPPER(sto) = ?
  `;

  try {
    const [results] = await db.query(query, [sto]);
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    res.json({ success: true, data: results[0] });
  } catch (error) {
    console.error('❌ Error fetching wilayah by STO:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data',
      error:   error.message
    });
  }
});

// POST - Tambah data wilayah_ridar (STO harus unik)
router.post('/api/wilayah-ridar', async (req, res) => {
  const { sto, uic, pic, leader } = req.body;

  // Validasi input
  if (!sto) {
    return res.status(400).json({ success: false, message: 'STO wajib diisi' });
  }
  if (!uic) {
    return res.status(400).json({ success: false, message: 'UIC wajib diisi' });
  }
  if (!pic) {
    return res.status(400).json({ success: false, message: 'PIC wajib diisi' });
  }
  if (!leader) {
    return res.status(400).json({ success: false, message: 'Leader wajib diisi' });
  }

  const stoUpper = sto.toUpperCase().trim();

  try {
    // Cek duplikat STO
    const [existing] = await db.query(
      'SELECT sto FROM wilayah_ridar WHERE UPPER(sto) = ?',
      [stoUpper]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `STO "${stoUpper}" sudah terdaftar. STO tidak boleh duplikat.`
      });
    }

    // Insert
    await db.query(
      `INSERT INTO wilayah_ridar (sto, uic, pic, leader) VALUES (?, ?, ?, ?)`,
      [stoUpper, uic.trim(), pic.trim(), leader.trim()]
    );

    console.log('✅ Wilayah inserted, STO:', stoUpper);
    res.json({
      success: true,
      message: 'Data berhasil ditambahkan',
      data: {
        sto:    stoUpper,
        uic:    uic.trim(),
        pic:    pic.trim(),
        leader: leader.trim()
      }
    });
  } catch (error) {
    console.error('❌ Error inserting wilayah:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data',
      error:   error.message
    });
  }
});

// PUT - Update data wilayah_ridar berdasarkan STO (hanya UIC/PIC/Leader)
router.put('/api/wilayah-ridar/:sto', async (req, res) => {
  const sto = decodeURIComponent(req.params.sto).toUpperCase().trim();
  const { uic, pic, leader } = req.body;

  if (!uic)    return res.status(400).json({ success: false, message: 'UIC wajib diisi' });
  if (!pic)    return res.status(400).json({ success: false, message: 'PIC wajib diisi' });
  if (!leader) return res.status(400).json({ success: false, message: 'Leader wajib diisi' });

  const query = `
    UPDATE wilayah_ridar
    SET uic    = ?,
        pic    = ?,
        leader = ?
    WHERE UPPER(sto) = ?
  `;

  try {
    const [results] = await db.query(query, [uic.trim(), pic.trim(), leader.trim(), sto]);

    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    console.log('✅ Wilayah updated, STO:', sto);
    res.json({ success: true, message: 'Data berhasil diupdate' });
  } catch (error) {
    console.error('❌ Error updating wilayah:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate data',
      error:   error.message
    });
  }
});

// DELETE - Hapus data wilayah_ridar berdasarkan STO
router.delete('/api/wilayah-ridar/:sto', async (req, res) => {
  const sto = decodeURIComponent(req.params.sto).toUpperCase().trim();

  try {
    const [results] = await db.query(
      'DELETE FROM wilayah_ridar WHERE UPPER(sto) = ?',
      [sto]
    );

    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    console.log('✅ Wilayah deleted, STO:', sto);
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('❌ Error deleting wilayah:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data',
      error:   error.message
    });
  }
});

module.exports = router;