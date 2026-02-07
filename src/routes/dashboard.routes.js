const express = require('express');
const router = express.Router();
const path = require('path');
const db = require(path.resolve(__dirname, '../config/db'));

// Dashboard Route
router.get('/', async (req, res) => {
  try {
    // use pooled db from config
    
    // 1. KPI METRICS - Total WO
    const [totalWO] = await db.query('SELECT COUNT(*) as total FROM master_wo');
    
    // 2. Status Daily Distribution
    const [statusDaily] = await db.query(`
      SELECT status_daily, COUNT(*) as count 
      FROM master_wo 
      WHERE status_daily IS NOT NULL
      GROUP BY status_daily
    `);
    
    // 3. Status Todolist Distribution (from kendala_teknisi_sistem)
    const [statusTodolist] = await db.query(`
      SELECT status_todolist, COUNT(*) as count 
      FROM kendala_teknisi_sistem 
      WHERE status_todolist IS NOT NULL
      GROUP BY status_todolist
    `);
    
    // 4. Status HI Distribution (from kendala_pelanggan)
    const [statusHI] = await db.query(`
      SELECT status_hi, COUNT(*) as count 
      FROM kendala_pelanggan 
      WHERE status_hi IS NOT NULL
      GROUP BY status_hi
    `);
    
    // 5. Top STO by WO Count
    const [topSTO] = await db.query(`
      SELECT sto, COUNT(*) as total 
      FROM master_wo 
      WHERE sto IS NOT NULL
      GROUP BY sto 
      ORDER BY total DESC 
      LIMIT 10
    `);
    
    // 6. Daily WO Trend (last 30 days)
    const [dailyTrend] = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM master_wo 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at) 
      ORDER BY date ASC
    `);
    
    // 7. Activity Teknisi Distribution
    const [activityTech] = await db.query(`
      SELECT activity_teknisi, COUNT(*) as count 
      FROM kendala_teknisi_sistem 
      WHERE activity_teknisi IS NOT NULL
      GROUP BY activity_teknisi 
      ORDER BY count DESC
      LIMIT 10
    `);
    
    // 8. Workfall Table - Status Daily per STO
    const [workfallData] = await db.query(`
      SELECT 
        sto,
        SUM(CASE WHEN status_daily = 'Startwork' THEN 1 ELSE 0 END) as startwork,
        SUM(CASE WHEN status_daily = 'Complete' THEN 1 ELSE 0 END) as complete,
        SUM(CASE WHEN status_daily = 'Workfail' THEN 1 ELSE 0 END) as workfail,
        COUNT(*) as total
      FROM master_wo
      WHERE sto IS NOT NULL
      GROUP BY sto
      ORDER BY total DESC
    `);
    
  // 9. Recent WO Activities (ALL, ordered by latest)
  const [recentWO] = await db.query(`
      SELECT 
        mw.wonum,
        mw.nama,
        mw.sto,
        mw.status_daily,
        mw.odp_todolist,
        mw.created_at
      FROM master_wo mw
      ORDER BY mw.created_at DESC
    `);
    
    // 10. Package Distribution
    const [packageDist] = await db.query(`
      SELECT package_name, COUNT(*) as count 
      FROM master_wo 
      WHERE package_name IS NOT NULL
      GROUP BY package_name
      ORDER BY count DESC
    `);
    
    // 11. Regional Performance
    const [regionalPerf] = await db.query(`
      SELECT 
        regional,
        COUNT(*) as total,
        SUM(CASE WHEN status_daily = 'Complete' THEN 1 ELSE 0 END) as completed,
        ROUND(SUM(CASE WHEN status_daily = 'Complete' THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) as completion_rate
      FROM master_wo
      WHERE regional IS NOT NULL
      GROUP BY regional
      ORDER BY total DESC
    `);
    
  // 12. STO with Wilayah Info (ALL)
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
      GROUP BY wr.sto, wr.uic, wr.pic, wr.leader
      ORDER BY total_wo DESC
    `);
    
    // 13. TTIC Distribution (kendala_pelanggan)
    const [tticDist] = await db.query(`
      SELECT ttic, COUNT(*) as count 
      FROM kendala_pelanggan 
      WHERE ttic IS NOT NULL
      GROUP BY ttic
      ORDER BY count DESC
    `);
    
    // 14. Segment Distribution
    const [segmentDist] = await db.query(`
      SELECT segment_alpro, COUNT(*) as count 
      FROM kendala_teknisi_sistem 
      WHERE segment_alpro IS NOT NULL
      GROUP BY segment_alpro
      ORDER BY count DESC
    `);

    // Render dashboard
    res.render('dashboard', {
      totalWO: totalWO[0].total,
      statusDaily,
      statusTodolist,
      statusHI,
      topSTO,
      dailyTrend,
      activityTech,
      workfallData,
      recentWO,
      packageDist,
      regionalPerf,
      stoInfo,
      tticDist,
      segmentDist
    });
    
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).send('Error loading dashboard: ' + error.message);
  }
});

// API Endpoint for AJAX refresh
router.get('/api/refresh', async (req, res) => {
  try {
    // use pooled db from config
    
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

module.exports = router;