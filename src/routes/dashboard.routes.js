const express = require('express');
const router = express.Router();
const db = require('../config/db');

// WEB VIEWS
router.get('/', (req, res) => {
  return res.redirect('/dashboard');
});

router.get('/dashboard', (req, res) => {
  res.render('dashboard', {
    title: 'Dashboard Monitoring Kendala',
    adminName: 'Admin User'
  });
});

// ============ DASHBOARD SUMMARY ============
router.get('/api/dashboard/summary', async (req, res) => {
  try {
    // Total WO
    const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM master_wo');
    
    // On Progress
    const [[{ on_progress }]] = await db.query(`
      SELECT COUNT(*) AS on_progress 
      FROM master_wo 
      WHERE status_daily = 'ON_PROGRESS'
    `);
    
    // Complete
    const [[{ complete }]] = await db.query(`
      SELECT COUNT(*) AS complete 
      FROM master_wo 
      WHERE status_daily = 'COMPLETE'
    `);
    
    // Open
    const [[{ open }]] = await db.query(`
      SELECT COUNT(*) AS open 
      FROM master_wo 
      WHERE status_daily = 'OPEN'
    `);
    
    // Avg Completion Time (in hours) - Calculate from created_at to updated_at
    const [[avgResult]] = await db.query(`
      SELECT 
        AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_hours
      FROM master_wo 
      WHERE status_daily = 'COMPLETE' 
        AND updated_at IS NOT NULL 
        AND created_at IS NOT NULL
    `);
    
    const avgHours = avgResult.avg_hours || 0;
    let avgTimeStr = '-';
    if (avgHours > 0) {
      if (avgHours < 24) {
        avgTimeStr = avgHours.toFixed(1) + 'h';
      } else {
        const days = Math.floor(avgHours / 24);
        const hours = (avgHours % 24).toFixed(0);
        avgTimeStr = `${days}d ${hours}h`;
      }
    }

    return res.json({
      success: true,
      data: {
        totalWO: Number(total) || 0,
        onProgress: Number(on_progress) || 0,
        complete: Number(complete) || 0,
        open: Number(open) || 0,
        avgTime: avgTimeStr,
        completionRate: total > 0 ? ((complete / total) * 100).toFixed(1) : 0
      }
    });
  } catch (err) {
    console.error('API /summary error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============ WORK ORDERS ============
router.get('/api/dashboard/work-orders', async (req, res) => {
  try {
    const { regional = '', sto = '', status = '', startDate = '', endDate = '' } = req.query;
    const where = [];
    const params = [];

    if (regional) { where.push('regional = ?'); params.push(regional); }
    if (sto) { where.push('sto = ?'); params.push(sto); }
    if (status) { where.push('status_daily = ?'); params.push(status); }
    if (startDate) { where.push('DATE(created_at) >= ?'); params.push(startDate); }
    if (endDate) { where.push('DATE(created_at) <= ?'); params.push(endDate); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `
      SELECT mw.*
      FROM master_wo mw
      ${whereSql}
      ORDER BY mw.created_at DESC
      LIMIT 500
    `;

    try {
      const [rows] = await db.query(sql, params);
      return res.json({ success: true, data: rows });
    } catch (err) {
      // If master_wo lacks optional columns, provide an actionable message
      if (err && err.code === 'ER_BAD_FIELD_ERROR') {
        const m = (err.message || '').match(/Unknown column '(.*?)'/);
        const missing = m ? [m[1]] : [];
        const suggestion = missing.length ? `ALTER TABLE master_wo ADD COLUMN ${missing.map(c=>`${c} VARCHAR(255)`).join(', ')};` : undefined;
        return res.status(500).json({ success: false, message: 'Query gagal — kolom DB tidak ditemukan', missingColumns: missing, suggestion, error: err.message });
      }
      throw err;
    }
  } catch (err) {
    console.error('API /work-orders error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============ KENDALA TEKNISI ============
router.get('/api/dashboard/kendala-teknisi', async (req, res) => {
  try {
    const sql = `
      SELECT k.*, a.activity_name 
      FROM kendala_teknisi_sistem k 
      LEFT JOIN master_activity a ON k.activity_id = a.id 
      ORDER BY k.created_at DESC 
      LIMIT 200
    `;
    const [rows] = await db.query(sql);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('API /kendala-teknisi error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============ KENDALA PELANGGAN ============
router.get('/api/dashboard/kendala-pelanggan', async (req, res) => {
  try {
    const sql = `
      SELECT kp.*, mw.nama as customer_name, mw.regional
      FROM kendala_pelanggan kp
      LEFT JOIN master_wo mw ON kp.wonum = mw.wonum
      ORDER BY kp.created_at DESC
      LIMIT 200
    `;
    const [rows] = await db.query(sql);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('API /kendala-pelanggan error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============ WILAYAH ============
router.get('/api/dashboard/wilayah', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM wilayah_ridar');
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('API /wilayah error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============ WORK FULL PROCESS (Regional Summary Table) ============
router.get('/api/dashboard/work-full-process', async (req, res) => {
  try {
    // Get all data grouped by regional
    const sql = `
      SELECT 
        COALESCE(mw.regional, 'UNKNOWN') as regional,
        
        -- Kendala Pelanggan
        (SELECT COUNT(*) FROM kendala_pelanggan kp 
         LEFT JOIN master_wo mw2 ON kp.wonum = mw2.wonum 
         WHERE COALESCE(mw2.regional, 'UNKNOWN') = COALESCE(mw.regional, 'UNKNOWN')) as kdl_plg,
        
        -- Kendala Teknisi
        (SELECT COUNT(*) FROM kendala_teknisi_sistem kt 
         LEFT JOIN master_wo mw3 ON kt.wonum = mw3.wonum 
         WHERE COALESCE(mw3.regional, 'UNKNOWN') = COALESCE(mw.regional, 'UNKNOWN')) as kdl_tek,
        
        -- Kendala Sistem (for now, 0 or can be calculated differently)
        0 as kdl_sys,
        
        -- Status counts
        SUM(CASE WHEN mw.status_daily = 'COMPLETE' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN mw.status_daily = 'ON_PROGRESS' THEN 1 ELSE 0 END) as continue_count,
        SUM(CASE WHEN mw.status_daily = 'CANCEL' THEN 1 ELSE 0 END) as cancel,
        SUM(CASE WHEN mw.status_daily = 'COMPLETE' THEN 1 ELSE 0 END) as complete,
        COUNT(*) as total
        
      FROM master_wo mw
      GROUP BY mw.regional
      ORDER BY mw.regional
    `;
    
    const [rows] = await db.query(sql);
    
    // Calculate NASIONAL total
    const nasional = {
      regional: 'NASIONAL',
      kdl_plg: rows.reduce((sum, r) => sum + r.kdl_plg, 0),
      kdl_tek: rows.reduce((sum, r) => sum + r.kdl_tek, 0),
      kdl_sys: 0,
      pending: rows.reduce((sum, r) => sum + r.pending, 0),
      continue_count: rows.reduce((sum, r) => sum + r.continue_count, 0),
      cancel: rows.reduce((sum, r) => sum + r.cancel, 0),
      complete: rows.reduce((sum, r) => sum + r.complete, 0),
      total: rows.reduce((sum, r) => sum + r.total, 0)
    };
    
    return res.json({ 
      success: true, 
      data: {
        regional: rows,
        nasional: nasional
      }
    });
  } catch (err) {
    console.error('API /work-full-process error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============ REGIONAL SUMMARY (For KPI Cards) ============
router.get('/api/dashboard/regional-summary', async (req, res) => {
  try {
    const sql = `
      SELECT 
        COALESCE(regional, 'UNKNOWN') as regional,
        COUNT(*) as total,
        SUM(CASE WHEN status_daily = 'COMPLETE' THEN 1 ELSE 0 END) as complete,
        SUM(CASE WHEN status_daily = 'ON_PROGRESS' THEN 1 ELSE 0 END) as on_progress,
        SUM(CASE WHEN status_daily = 'OPEN' THEN 1 ELSE 0 END) as open
      FROM master_wo
      GROUP BY regional
    `;
    
    const [rows] = await db.query(sql);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('API /regional-summary error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============ CHARTS ============

// Status Distribution
router.get('/api/dashboard/charts/status-distribution', async (req, res) => {
  try {
    const sql = `
      SELECT COALESCE(status_daily,'UNKNOWN') AS status, COUNT(*) AS count 
      FROM master_wo 
      GROUP BY status_daily
    `;
    const [rows] = await db.query(sql);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('API /charts/status-distribution error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// STO Distribution
router.get('/api/dashboard/charts/sto-distribution', async (req, res) => {
  try {
    const sql = `
      SELECT sto,
        SUM(status_daily = 'COMPLETE') AS complete,
        SUM(status_daily = 'ON_PROGRESS') AS on_progress,
        SUM(status_daily = 'OPEN') AS open
      FROM master_wo 
      GROUP BY sto
    `;
    const [rows] = await db.query(sql);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('API /charts/sto-distribution error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// WO Trend (Last 30 Days) 
router.get('/api/dashboard/charts/wo-trend', async (req, res) => {
  try {
    const sql = `
      SELECT 
        DATE(created_at) AS date,
        COUNT(*) AS count
      FROM master_wo
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    const [rows] = await db.query(sql);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('API /charts/wo-trend error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Package Distribution
router.get('/api/dashboard/charts/package-distribution', async (req, res) => {
  try {
    const sql = `
      SELECT 
        COALESCE(package_name, 'Unknown') AS package_name,
        COUNT(*) AS count
      FROM master_wo
      GROUP BY package_name
      ORDER BY count DESC
    `;
    const [rows] = await db.query(sql);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('API /charts/package-distribution error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Activity Progress
router.get('/api/dashboard/charts/activity-progress', async (req, res) => {
  try {
    const sql = `
      SELECT 
        COALESCE(k.activity, a.activity_name, 'Unknown') AS activity, 
        COUNT(*) AS count 
      FROM kendala_teknisi_sistem k 
      LEFT JOIN master_activity a ON k.activity_id = a.id 
      GROUP BY activity
      ORDER BY count DESC
    `;
    const [rows] = await db.query(sql);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('API /charts/activity-progress error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;