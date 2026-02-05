const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/check-status', async (req, res) => {
  const keyword = req.body && req.body.keyword ? String(req.body.keyword).trim() : '';

  if (!keyword) {
    return res.json({ success: false, message: 'Nomor tiket / WO tidak boleh kosong' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT wonum, status_daily, sto, package_name, updated_at
       FROM master_wo
       WHERE wonum = ? OR ticket_id = ?
       LIMIT 1`,
      [keyword, keyword]
    );

    if (!rows || rows.length === 0) {
      return res.json({ success: false, message: 'Data tidak ditemukan' });
    }

    const row = rows[0];

    // simpan data log bot
    await db.execute(
      `INSERT INTO bot_logs (input_type, input_value, result_status, created_at)
       VALUES (?, ?, ?, NOW())`,
      ['keyword', keyword, row.status_daily]
    );

    return res.json({
      success: true,
      data: {
        wonum: row.wonum,
        status: row.status_daily,
        sto: row.sto,
        package: row.package_name,
        updated_at: row.updated_at
      }
    });

  } catch (err) {
    console.error('Error in /api/bot/check-status:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
