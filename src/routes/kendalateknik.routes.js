const express = require('express');
const router = express.Router();
const path = require('path');
const db = require(path.resolve(__dirname, '../config/db'));

// GET - Tampilkan halaman kendala teknik (Master Activity)
router.get('/kendala-teknik', (req, res) => {
  res.render('kendalateknik', {
    title: 'Kendala Teknik - Master Activity',
    adminName: 'Admin User'
  });
});

// GET - Ambil semua data master activity (API)
router.get('/api/kendala-teknik', (req, res) => {
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
  
  db.query(query, (error, results) => {
    if (error) {
      console.error('❌ Error fetching data:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data',
        error: error.message
      });
    }
    
    console.log('✅ Data fetched:', results.length, 'rows');
    res.json({
      success: true,
      data: results
    });
  });
});

// GET - Ambil data master activity berdasarkan ID (API)
router.get('/api/kendala-teknik/:id', (req, res) => {
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
  
  db.query(query, [id], (error, results) => {
    if (error) {
      console.error('❌ Error fetching data by ID:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data',
        error: error.message
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      data: results[0]
    });
  });
});

// POST - Tambah data master activity (API)
router.post('/api/kendala-teknik', (req, res) => {
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
  
  // Validasi progress (maksimal 1.00)
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
  
  db.query(query, [
    activity_name,
    status_default,
    progress,
    solusi_default
  ], (error, results) => {
    if (error) {
      console.error('❌ Error inserting data:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal menambahkan data',
        error: error.message
      });
    }
    
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
  });
});

// PUT - Update data master activity (API)
router.put('/api/kendala-teknik/:id', (req, res) => {
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
  
  // Validasi progress (maksimal 1.00)
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
  
  db.query(query, [
    activity_name,
    status_default,
    progress,
    solusi_default,
    id
  ], (error, results) => {
    if (error) {
      console.error('❌ Error updating data:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengupdate data',
        error: error.message
      });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan'
      });
    }
    
    console.log('✅ Data updated, ID:', id);
    res.json({
      success: true,
      message: 'Data berhasil diupdate'
    });
  });
});

// DELETE - Hapus data master activity (API)
router.delete('/api/kendala-teknik/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM master_activity WHERE id = ?';
  
  db.query(query, [id], (error, results) => {
    if (error) {
      console.error('❌ Error deleting data:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus data',
        error: error.message
      });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan'
      });
    }
    
    console.log('✅ Data deleted, ID:', id);
    res.json({
      success: true,
      message: 'Data berhasil dihapus'
    });
  });
});

// GET - Search data master activity (API)
router.get('/api/kendala-teknik/search/:keyword', (req, res) => {
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
  
  db.query(query, [searchTerm, searchTerm, searchTerm], (error, results) => {
    if (error) {
      console.error('❌ Error searching data:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mencari data',
        error: error.message
      });
    }
    
    res.json({
      success: true,
      data: results
    });
  });
});

module.exports = router;