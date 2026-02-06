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

// Helper: build WHERE clause untuk master_wo dari filter umum
function buildWoWhere(filters) {
  const where = [];
  const params = [];
  if (filters.sto) { where.push('mw.sto = ?'); params.push(filters.sto); }
  if (filters.regional) { where.push('mw.regional = ?'); params.push(filters.regional); }
  if (filters.statusDaily) { where.push('mw.status_daily = ?'); params.push(filters.statusDaily); }
  if (filters.package) { where.push('mw.package_name = ?'); params.push(filters.package); }
  if (filters.startDate) { where.push('DATE(mw.created_at) >= ?'); params.push(filters.startDate); }
  if (filters.endDate) { where.push('DATE(mw.created_at) <= ?'); params.push(filters.endDate); }
  return { whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

// ============ WORK ORDERS ============
router.get('/api/dashboard/work-orders', async (req, res) => {
  try {
    const filters = {
      regional: req.query.regional || '',
      sto: req.query.sto || '',
      status: req.query.status || '',
      package: req.query.package || '',
      startDate: req.query.startDate || '',
      endDate: req.query.endDate || ''
    };
    const { whereSql, params } = buildWoWhere(filters);
    const sql = `
      SELECT mw.*
      FROM master_wo mw
      ${whereSql}
      ORDER BY mw.created_at DESC
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
    const where = [];
    const params = [];
    const { status = '', sto = '', startDate = '', endDate = '' } = req.query;
    if (status) { where.push('k.status_todolist = ?'); params.push(status); }
    if (sto) { where.push('k.sto = ?'); params.push(sto); }
    if (startDate) { where.push('DATE(k.created_at) >= ?'); params.push(startDate); }
    if (endDate) { where.push('DATE(k.created_at) <= ?'); params.push(endDate); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `
      SELECT k.*, a.activity_name 
      FROM kendala_teknisi_sistem k 
      LEFT JOIN master_activity a ON k.activity_id = a.id 
      ${whereSql}
      ORDER BY k.created_at DESC 
      LIMIT 200
    `;
    const [rows] = await db.query(sql, params);
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

// ============ WORK FULL PROCESS (STO Summary Table) ============
router.get('/api/dashboard/work-full-process', async (req, res) => {
  try {
    // Group by STO dengan dukungan filter umum
    const filters = {
      regional: req.query.regional || '',
      sto: req.query.sto || '',
      status: req.query.status || '',
      package: req.query.package || '',
      startDate: req.query.startDate || '',
      endDate: req.query.endDate || ''
    };
    const { whereSql, params } = buildWoWhere(filters);
    const sql = `
      SELECT 
        COALESCE(mw.sto, 'UNKNOWN') as sto,
        
        -- Kendala Pelanggan (berdasarkan STO)
        (SELECT COUNT(*) FROM kendala_pelanggan kp 
         LEFT JOIN master_wo mw2 ON kp.wonum = mw2.wonum 
         WHERE COALESCE(mw2.sto, 'UNKNOWN') = COALESCE(mw.sto, 'UNKNOWN')) as kdl_plg,
        
        -- Kendala Teknisi (berdasarkan STO)
        (SELECT COUNT(*) FROM kendala_teknisi_sistem kt 
         LEFT JOIN master_wo mw3 ON kt.wonum = mw3.wonum 
         WHERE COALESCE(mw3.sto, 'UNKNOWN') = COALESCE(mw.sto, 'UNKNOWN')) as kdl_tek,
        
        0 as kdl_sys,
        
        -- Status counts
        SUM(CASE WHEN mw.status_daily = 'OPEN' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN mw.status_daily = 'ON_PROGRESS' THEN 1 ELSE 0 END) as continue_count,
        SUM(CASE WHEN mw.status_daily = 'CANCEL' THEN 1 ELSE 0 END) as cancel,
        SUM(CASE WHEN mw.status_daily = 'COMPLETE' THEN 1 ELSE 0 END) as complete,
        COUNT(*) as total
        
      FROM master_wo mw
      ${whereSql}
      GROUP BY mw.sto
      ORDER BY mw.sto
    `;
    
    const [rows] = await db.query(sql, params);
    
    // Calculate NASIONAL total
    const nasional = {
      sto: 'NASIONAL',
      kdl_plg: rows.reduce((sum, r) => sum + Number(r.kdl_plg || 0), 0),
      kdl_tek: rows.reduce((sum, r) => sum + Number(r.kdl_tek || 0), 0),
      kdl_sys: 0,
      pending: rows.reduce((sum, r) => sum + Number(r.pending || 0), 0),
      continue_count: rows.reduce((sum, r) => sum + Number(r.continue_count || 0), 0),
      cancel: rows.reduce((sum, r) => sum + Number(r.cancel || 0), 0),
      complete: rows.reduce((sum, r) => sum + Number(r.complete || 0), 0),
      total: rows.reduce((sum, r) => sum + Number(r.total || 0), 0)
    };
    
    return res.json({ 
      success: true, 
      data: { sto: rows, nasional }
    });
  } catch (err) {
    console.error('API /work-full-process error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============ REGIONAL SUMMARY (For KPI Cards) ============
router.get('/api/dashboard/sto-summary', async (req, res) => {
  try {
    const filters = {
      regional: req.query.regional || '',
      status: req.query.status || '',
      sto: req.query.sto || '',
      package: req.query.package || '',
      startDate: req.query.startDate || '',
      endDate: req.query.endDate || ''
    };
    const { whereSql, params } = buildWoWhere(filters);
    const sql = `
      SELECT 
        COALESCE(mw.sto, 'UNKNOWN') as sto,
        COUNT(*) as total,
        SUM(CASE WHEN mw.status_daily = 'COMPLETE' THEN 1 ELSE 0 END) as complete,
        SUM(CASE WHEN mw.status_daily = 'ON_PROGRESS' THEN 1 ELSE 0 END) as on_progress,
        SUM(CASE WHEN mw.status_daily = 'OPEN' THEN 1 ELSE 0 END) as open
      FROM master_wo mw
      ${whereSql}
      GROUP BY mw.sto
      ORDER BY mw.sto
    `;
    
    const [rows] = await db.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('API /sto-summary error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============ CHARTS ============

// Status Distribution
router.get('/api/dashboard/charts/status-distribution', async (req, res) => {
  try {
    const { whereSql, params } = buildWoWhere({
      regional: req.query.regional || '',
      sto: req.query.sto || '',
      status: req.query.status || '',
      package: req.query.package || '',
      startDate: req.query.startDate || '',
      endDate: req.query.endDate || ''
    });
    const sql = `
      SELECT COALESCE(mw.status_daily,'UNKNOWN') AS status, COUNT(*) AS count 
      FROM master_wo mw
      ${whereSql}
      GROUP BY mw.status_daily
    `;
    const [rows] = await db.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('API /charts/status-distribution error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// STO Distribution
router.get('/api/dashboard/charts/sto-distribution', async (req, res) => {
  try {
    const { whereSql, params } = buildWoWhere({
      regional: req.query.regional || '',
      sto: req.query.sto || '',
      status: req.query.status || '',
      package: req.query.package || '',
      startDate: req.query.startDate || '',
      endDate: req.query.endDate || ''
    });
    const sql = `
      SELECT mw.sto,
        SUM(mw.status_daily = 'COMPLETE') AS complete,
        SUM(mw.status_daily = 'ON_PROGRESS') AS on_progress,
        SUM(mw.status_daily = 'OPEN') AS open
      FROM master_wo mw
      ${whereSql}
      GROUP BY mw.sto
      ORDER BY mw.sto
    `;
    const [rows] = await db.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('API /charts/sto-distribution error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// WO Trend (Last 30 Days) 
router.get('/api/dashboard/charts/wo-trend', async (req, res) => {
  try {
    const { whereSql, params } = buildWoWhere({
      regional: req.query.regional || '',
      sto: req.query.sto || '',
      package: req.query.package || ''
    });
    const sql = `
      SELECT 
        DATE(mw.created_at) AS date,
        COUNT(*) AS count
      FROM master_wo mw
      ${whereSql ? whereSql + ' AND ' : 'WHERE '} mw.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(mw.created_at)
      ORDER BY date ASC
    `;
    const [rows] = await db.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('API /charts/wo-trend error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Package Distribution
router.get('/api/dashboard/charts/package-distribution', async (req, res) => {
  try {
    const { whereSql, params } = buildWoWhere({
      regional: req.query.regional || '',
      sto: req.query.sto || '',
      status: req.query.status || '',
      startDate: req.query.startDate || '',
      endDate: req.query.endDate || ''
    });
    const sql = `
      SELECT 
        COALESCE(mw.package_name, 'Unknown') AS package_name,
        COUNT(*) AS count
      FROM master_wo mw
      ${whereSql}
      GROUP BY mw.package_name
      ORDER BY count DESC
    `;
    const [rows] = await db.query(sql, params);
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
 
// ============ FILTER OPTIONS (Distinct values) ============
router.get('/api/dashboard/filter-options', async (req, res) => {
  try {
    const [[minDate]] = await db.query(`SELECT MIN(DATE(created_at)) AS min_date FROM master_wo`);
    const [[maxDate]] = await db.query(`SELECT MAX(DATE(created_at)) AS max_date FROM master_wo`);

    const [regionals] = await db.query(`
      SELECT DISTINCT COALESCE(regional, 'UNKNOWN') AS regional
      FROM master_wo
      ORDER BY regional
    `);
    const [stos] = await db.query(`
      SELECT DISTINCT COALESCE(sto, 'UNKNOWN') AS sto
      FROM master_wo
      ORDER BY sto
    `);
    const [todolistStatuses] = await db.query(`
      SELECT DISTINCT COALESCE(status_todolist, 'UNKNOWN') AS status
      FROM kendala_teknisi_sistem
      ORDER BY status
    `);
    const [woStatuses] = await db.query(`
      SELECT DISTINCT COALESCE(status_daily, 'UNKNOWN') AS status
      FROM master_wo
      ORDER BY status
    `);
    const [packages] = await db.query(`
      SELECT DISTINCT COALESCE(package_name, 'Unknown') AS package_name
      FROM master_wo
      ORDER BY package_name
    `);

    return res.json({
      success: true,
      data: {
        dateRange: { min: minDate?.min_date || null, max: maxDate?.max_date || null },
        regional: regionals.map(r => r.regional),
        sto: stos.map(s => s.sto),
        statusTodolist: todolistStatuses.map(s => s.status),
        statusDaily: woStatuses.map(s => s.status),
        package: packages.map(p => p.package_name)
      }
    });
  } catch (err) {
    console.error('API /filter-options error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});