const express = require('express');
const router = express.Router();
const path = require('path');
const db = require(path.resolve(__dirname, '../config/db'));

// ============================================================
// PAGE ROUTE → Render kendalateknik.ejs
// ============================================================
router.get('/kendala-teknik', (req, res) => {
  res.render('kendalateknik', {
    title: 'Kendala Teknik - Master Activity',
    adminName: 'Admin User'
  });
});

// ============================================================
// API ROUTES - Master Activity (CRUD)
// ============================================================

// GET - Ambil semua data master activity
router.get('/api/kendala-teknik', async (req, res) => {
  const query = `
    SELECT 
      id,
      activity_name,
      status_default,
      progress_default,
      solusi_default
    FROM master_activity 
    ORDER BY id DESC
  `;

  try {
    const [results] = await db.query(query);
    console.log('✅ Data fetched:', results.length, 'rows');
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('❌ Error fetching data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal mengambil data', 
      error: error.message 
    });
  }
});

// GET - Ambil data master activity berdasarkan ID
router.get('/api/kendala-teknik/:id', async (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT 
      id,
      activity_name,
      status_default,
      progress_default,
      solusi_default
    FROM master_activity 
    WHERE id = ?
  `;

  try {
    const [results] = await db.query(query, [id]);
    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Data tidak ditemukan' 
      });
    }
    res.json({ success: true, data: results[0] });
  } catch (error) {
    console.error('❌ Error fetching data by ID:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal mengambil data', 
      error: error.message 
    });
  }
});

// POST - Tambah data master activity
router.post('/api/kendala-teknik', async (req, res) => {
  const {
    activity_name,
    status_default,
    progress_default,
    solusi_default
  } = req.body;

  // Validasi input
  if (!activity_name) {
    return res.status(400).json({ 
      success: false, 
      message: 'Activity name wajib diisi' 
    });
  }
  
  if (!status_default) {
    return res.status(400).json({ 
      success: false, 
      message: 'Status wajib dipilih' 
    });
  }
  
  if (!progress_default) {
    return res.status(400).json({ 
      success: false, 
      message: 'Progress wajib diisi' 
    });
  }

  // Validasi progress (maksimal 1)
  const progress = parseFloat(progress_default);
  if (progress > 1) {
    return res.status(400).json({ 
      success: false, 
      message: 'Progress maksimal adalah 1' 
    });
  }
  
  if (progress < 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Progress minimal adalah 0' 
    });
  }

  const query = `
    INSERT INTO master_activity 
    (activity_name, status_default, progress_default, solusi_default) 
    VALUES (?, ?, ?, ?)
  `;

  try {
    const [results] = await db.query(query, [
      activity_name, 
      status_default, 
      progress, 
      solusi_default
    ]);
    
    console.log('✅ Data inserted, ID:', results.insertId);
    
    res.json({
      success: true,
      message: 'Data berhasil ditambahkan',
      data: { 
        id: results.insertId, 
        activity_name, 
        status_default, 
        progress_default: progress, 
        solusi_default 
      }
    });
  } catch (error) {
    console.error('❌ Error inserting data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal menambahkan data', 
      error: error.message 
    });
  }
});

// PUT - Update data master activity
router.put('/api/kendala-teknik/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    activity_name, 
    status_default, 
    progress_default, 
    solusi_default 
  } = req.body;

  // Validasi input
  if (!activity_name) {
    return res.status(400).json({ 
      success: false, 
      message: 'Activity name wajib diisi' 
    });
  }
  
  if (!status_default) {
    return res.status(400).json({ 
      success: false, 
      message: 'Status wajib dipilih' 
    });
  }
  
  if (!progress_default) {
    return res.status(400).json({ 
      success: false, 
      message: 'Progress wajib diisi' 
    });
  }

  // Validasi progress (maksimal 1)
  const progress = parseFloat(progress_default);
  if (progress > 1) {
    return res.status(400).json({ 
      success: false, 
      message: 'Progress maksimal adalah 1' 
    });
  }
  
  if (progress < 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Progress minimal adalah 0' 
    });
  }

  const query = `
    UPDATE master_activity 
    SET activity_name = ?,
        status_default = ?,
        progress_default = ?,
        solusi_default = ?
    WHERE id = ?
  `;

  try {
    const [results] = await db.query(query, [
      activity_name, 
      status_default, 
      progress, 
      solusi_default, 
      id
    ]);
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Data tidak ditemukan' 
      });
    }
    
    console.log('✅ Data updated, ID:', id);
    res.json({ success: true, message: 'Data berhasil diupdate' });
  } catch (error) {
    console.error('❌ Error updating data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal mengupdate data', 
      error: error.message 
    });
  }
});

// DELETE - Hapus data master activity
router.delete('/api/kendala-teknik/:id', async (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM master_activity WHERE id = ?';

  try {
    const [results] = await db.query(query, [id]);
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Data tidak ditemukan' 
      });
    }
    
    console.log('✅ Data deleted, ID:', id);
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('❌ Error deleting data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal menghapus data', 
      error: error.message 
    });
  }
});

// GET - Search data master activity
router.get('/api/kendala-teknik/search/:keyword', async (req, res) => {
  const { keyword } = req.params;
  const query = `
    SELECT 
      id,
      activity_name,
      status_default,
      progress_default,
      solusi_default
    FROM master_activity
    WHERE activity_name LIKE ? 
       OR status_default LIKE ? 
       OR solusi_default LIKE ?
    ORDER BY id DESC
  `;
  const searchTerm = `%${keyword}%`;

  try {
    const [results] = await db.query(query, [searchTerm, searchTerm, searchTerm]);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('❌ Error searching data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal mencari data', 
      error: error.message 
    });
  }
});

module.exports = router;