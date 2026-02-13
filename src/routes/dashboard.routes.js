const express = require('express');
const router = express.Router();
const path = require('path');
const db = require(path.resolve(__dirname, '../config/db'));

// Dashboard Route with Filters
router.get('/', async (req, res) => {
  try {
    // Get filter parameters
    const {
      sto_filter,
      regional_filter,
      status_filter,
      date_from,
      date_to,
      search
    } = req.query;

    // Build WHERE clause dynamically
    let whereConditions = [];
    let queryParams = [];

    if (sto_filter) {
      whereConditions.push('mw.sto = ?');
      queryParams.push(sto_filter);
    }

    if (regional_filter) {
      whereConditions.push('mw.regional = ?');
      queryParams.push(regional_filter);
    }

    if (status_filter) {
      whereConditions.push('mw.status_daily = ?');
      queryParams.push(status_filter);
    }

    if (date_from) {
      whereConditions.push('DATE(mw.created_at) >= ?');
      queryParams.push(date_from);
    }

    if (date_to) {
      whereConditions.push('DATE(mw.created_at) <= ?');
      queryParams.push(date_to);
    }

    if (search) {
      whereConditions.push('(mw.wonum LIKE ? OR mw.nama LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // 1. KPI METRICS - Total WO (with filters)
    const [totalWO] = await db.query(
      `SELECT COUNT(*) as total FROM master_wo mw ${whereClause}`,
      queryParams
    );

    // 2. Status Daily Distribution (with filters)
    const [statusDaily] = await db.query(`
      SELECT status_daily, COUNT(*) as count 
      FROM master_wo mw
      ${whereClause}
      ${whereConditions.length > 0 ? 'AND' : 'WHERE'} status_daily IS NOT NULL
      GROUP BY status_daily
    `, queryParams);

    // 3. Status Todolist Distribution (prefer real counts via kt joined to mw with filters; fallback to master_status when empty)
    let [statusTodolist] = await db.query(`
      SELECT kt.status_todolist, COUNT(*) AS count
      FROM kendala_teknisi_sistem kt
      JOIN master_wo mw ON mw.wonum = kt.wonum
      ${whereClause}
      ${whereConditions.length > 0 ? 'AND' : 'WHERE'} kt.status_todolist IS NOT NULL
      GROUP BY kt.status_todolist
      ORDER BY count DESC
    `, queryParams);
    if (!statusTodolist || statusTodolist.length === 0) {
      const [fallbackStatus] = await db.query(`
        SELECT ms.status_code AS status_todolist,
               COALESCE(kt.count, 0) AS count
        FROM master_status ms
        LEFT JOIN (
          SELECT status_todolist, COUNT(*) AS count
          FROM kendala_teknisi_sistem
          WHERE status_todolist IS NOT NULL
          GROUP BY status_todolist
        ) kt ON kt.status_todolist = ms.status_code
        ORDER BY count DESC
      `);
      statusTodolist = fallbackStatus;
    }

    // 4. Status HI Distribution
    const [statusHI] = await db.query(`
      SELECT status_hi, COUNT(*) as count 
      FROM kendala_pelanggan 
      WHERE status_hi IS NOT NULL
      GROUP BY status_hi
    `);

    // 5. Top STO by WO Count (with filters)
    const [topSTO] = await db.query(`
      SELECT sto, COUNT(*) as total 
      FROM master_wo mw
      ${whereClause}
      ${whereConditions.length > 0 ? 'AND' : 'WHERE'} sto IS NOT NULL
      GROUP BY sto 
      ORDER BY total DESC 
      LIMIT 10
    `, queryParams);

    // 6. Daily WO Trend (last 30 days) - with filters
    const [dailyTrend] = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM master_wo mw
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
      GROUP BY DATE(created_at) 
      ORDER BY date ASC
    `, queryParams);

    // 7. Completion Rate Trend (NEW - 30 days)
    const [completionTrend] = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status_daily = 'Complete' THEN 1 ELSE 0 END) as completed,
        ROUND(SUM(CASE WHEN status_daily = 'Complete' THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) as rate
      FROM master_wo mw
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, queryParams);

    // 8. Activity Teknisi Distribution (prefer real counts via kt joined to mw with filters; fallback to master_activity names when empty)
    let [activityTech] = await db.query(`
      SELECT kt.activity_teknisi, COUNT(*) AS count
      FROM kendala_teknisi_sistem kt
      JOIN master_wo mw ON mw.wonum = kt.wonum
      ${whereClause}
      ${whereConditions.length > 0 ? 'AND' : 'WHERE'} kt.activity_teknisi IS NOT NULL AND TRIM(kt.activity_teknisi) <> ''
      GROUP BY kt.activity_teknisi
      ORDER BY count DESC
      LIMIT 10
    `, queryParams);
    if (!activityTech || activityTech.length === 0) {
      const [fallbackActivity] = await db.query(`
        SELECT COALESCE(kt.activity_teknisi, ma.activity_name) AS activity_teknisi,
               COALESCE(kt.count, 0) AS count
        FROM master_activity ma
        LEFT JOIN (
          SELECT activity_teknisi, COUNT(*) AS count
          FROM kendala_teknisi_sistem
          WHERE activity_teknisi IS NOT NULL AND TRIM(activity_teknisi) <> ''
          GROUP BY activity_teknisi
        ) kt ON kt.activity_teknisi = ma.activity_name
        ORDER BY count DESC
        LIMIT 10
      `);
      activityTech = fallbackActivity;
    }

    // 9. Workfall Table - Status Daily per STO (with filters)
    const [workfallData] = await db.query(`
      SELECT 
        sto,
        SUM(CASE WHEN status_daily = 'Startwork' THEN 1 ELSE 0 END) as startwork,
        SUM(CASE WHEN status_daily = 'Complete' THEN 1 ELSE 0 END) as complete,
        SUM(CASE WHEN status_daily = 'Workfail' THEN 1 ELSE 0 END) as workfail,
        COUNT(*) as total
      FROM master_wo mw
      ${whereClause}
      ${whereConditions.length > 0 ? 'AND' : 'WHERE'} sto IS NOT NULL
      GROUP BY sto
      ORDER BY total DESC
    `, queryParams);

    // 10. Recent WO Activities (with filters and search)
    const [recentWO] = await db.query(`
      SELECT 
        mw.wonum,
        mw.nama,
        mw.sto,
        mw.status_daily,
        mw.odp_todolist,
        mw.created_at
      FROM master_wo mw
      ${whereClause}
      ORDER BY mw.created_at DESC
      LIMIT 500
    `, queryParams);

    // 11. Package Distribution
    const [packageDist] = await db.query(`
      SELECT package_name, COUNT(*) as count 
      FROM master_wo mw
      ${whereClause}
      ${whereConditions.length > 0 ? 'AND' : 'WHERE'} package_name IS NOT NULL
      GROUP BY package_name
      ORDER BY count DESC
    `, queryParams);

    // 12. Regional Performance
    const [regionalPerf] = await db.query(`
      SELECT 
        regional,
        COUNT(*) as total,
        SUM(CASE WHEN status_daily = 'Complete' THEN 1 ELSE 0 END) as completed,
        ROUND(SUM(CASE WHEN status_daily = 'Complete' THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) as completion_rate
      FROM master_wo mw
      ${whereClause}
      ${whereConditions.length > 0 ? 'AND' : 'WHERE'} regional IS NOT NULL
      GROUP BY regional
      ORDER BY total DESC
    `, queryParams);

    // 13. STO with Wilayah Info
    const [stoInfo] = await db.query(`
      SELECT 
        wr.sto,
        wr.uic,
        wr.pic,
        wr.leader,
        COUNT(mw.wonum) as total_wo,
        SUM(CASE WHEN mw.status_daily = 'Complete' THEN 1 ELSE 0 END) as completed_wo
      FROM wilayah_ridar wr
      LEFT JOIN master_wo mw ON wr.sto = mw.sto
      ${whereConditions.length > 0 ? 'WHERE ' + whereConditions.map(c => c.replace('mw.', 'mw.')).join(' AND ') : ''}
      GROUP BY wr.sto, wr.uic, wr.pic, wr.leader
      ORDER BY total_wo DESC
    `, whereConditions.length > 0 ? queryParams : []);

    // 14. TTIC Distribution
    const [tticDist] = await db.query(`
      SELECT ttic, COUNT(*) as count 
      FROM kendala_pelanggan 
      WHERE ttic IS NOT NULL
      GROUP BY ttic
      ORDER BY count DESC
    `);

    // 15. Segment Distribution
    const [segmentDist] = await db.query(`
      SELECT segment_alpro, COUNT(*) as count 
      FROM kendala_teknisi_sistem 
      WHERE segment_alpro IS NOT NULL
      GROUP BY segment_alpro
      ORDER BY count DESC
    `);

    // 16. TTD KB Distribution (NEW - Trouble Ticket Duration)
    const [ttdDistribution] = await db.query(`
      SELECT ttd_kb, COUNT(*) as count 
      FROM kendala_pelanggan 
      WHERE ttd_kb IS NOT NULL
      GROUP BY ttd_kb
      ORDER BY 
        CASE 
          WHEN ttd_kb LIKE '%hari' THEN CAST(SUBSTRING_INDEX(ttd_kb, ' ', 1) AS UNSIGNED)
          ELSE 999
        END ASC
    `);

    // Get distinct values for filters
    const [stoList] = await db.query('SELECT DISTINCT sto FROM master_wo WHERE sto IS NOT NULL ORDER BY sto');
    const [regionalList] = await db.query('SELECT DISTINCT regional FROM master_wo WHERE regional IS NOT NULL ORDER BY regional');
    const [statusList] = await db.query('SELECT DISTINCT status_daily FROM master_wo WHERE status_daily IS NOT NULL ORDER BY status_daily');

    // Render dashboard
    res.render('dashboard', {
      totalWO: totalWO[0].total,
      statusDaily,
      statusTodolist,
      statusHI,
      topSTO,
      dailyTrend,
      completionTrend,
      activityTech,
      workfallData,
      recentWO,
      packageDist,
      regionalPerf,
      stoInfo,
      tticDist,
      segmentDist,
      ttdDistribution,
      // Filter options
      stoList,
      regionalList,
      statusList,
      // Current filter values
      filters: {
        sto_filter: sto_filter || '',
        regional_filter: regional_filter || '',
        status_filter: status_filter || '',
        date_from: date_from || '',
        date_to: date_to || '',
        search: search || ''
      }
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).send('Error loading dashboard: ' + error.message);
  }
});

// API Endpoint for AJAX refresh
router.get('/api/refresh', async (req, res) => {
  try {
    const [totalWO] = await db.query('SELECT COUNT(*) as total FROM master_wo');
    const [statusDaily] = await db.query(`
      SELECT status_daily, COUNT(*) as count 
      FROM master_wo 
      WHERE status_daily IS NOT NULL
      GROUP BY status_daily
    `);

    res.json({
      success: true,
      totalWO: totalWO[0].total,
      statusDaily
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Export to Excel endpoint
router.get('/export/excel', async (req, res) => {
  try {
    const {
      sto_filter,
      regional_filter,
      status_filter,
      date_from,
      date_to,
      search
    } = req.query;

    let whereConditions = [];
    let queryParams = [];

    if (sto_filter) {
      whereConditions.push('mw.sto = ?');
      queryParams.push(sto_filter);
    }
    if (regional_filter) {
      whereConditions.push('mw.regional = ?');
      queryParams.push(regional_filter);
    }
    if (status_filter) {
      whereConditions.push('mw.status_daily = ?');
      queryParams.push(status_filter);
    }
    if (date_from) {
      whereConditions.push('DATE(mw.created_at) >= ?');
      queryParams.push(date_from);
    }
    if (date_to) {
      whereConditions.push('DATE(mw.created_at) <= ?');
      queryParams.push(date_to);
    }
    if (search) {
      whereConditions.push('(mw.wonum LIKE ? OR mw.nama LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Query data lengkap untuk Excel
    const [woData] = await db.query(`
      SELECT 
        mw.wonum,
        mw.nama,
        mw.sto,
        mw.regional,
        mw.status_daily,
        mw.package_name,
        mw.odp_todolist,
        mw.created_at,
        kp.status_hi,
        kp.ttic,
        kp.ttd_kb,
        kts.status_todolist,
        kts.activity_teknisi,
        kts.segment_alpro
      FROM master_wo mw
      LEFT JOIN kendala_pelanggan kp ON mw.wonum = kp.wonum
      LEFT JOIN kendala_teknisi_sistem kts ON mw.wonum = kts.wonum
      ${whereClause}
      ORDER BY mw.created_at DESC
    `, queryParams);

    res.json({
      success: true,
      data: woData
    });

  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;