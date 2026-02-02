const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/check-status', async (req, res) => {
  const keyword = String(req.body.keyword || '').trim();
  const sessionId = req.body.sessionId || 'anonymous';

  if (!keyword) {
    return res.json({
      success: false,
      message: 'Input tidak boleh kosong'
    });
  }

  if (keyword.startsWith('/')) {
    return handleCommand(keyword, sessionId, res);
  }

  try {
    // Cek di master_wo
    const [rows] = await db.execute(
      `SELECT wonum, status_daily, sto, package_name, updated_at, nama, regional, ticket_id, odp_inputan
       FROM master_wo
       WHERE wonum = ? OR ticket_id = ?
       LIMIT 1`,
      [keyword, keyword]
    );

    if (!rows.length) {
      await insertLog(
        sessionId,
        'keyword',
        keyword,
        'NOT_FOUND',
        'Data tidak ditemukan',
        null
      );

      return res.json({
        success: false,
        message: `❌ <b>Data tidak ditemukan</b><br><br>WO/Ticket <code>${keyword}</code> tidak ada dalam sistem.<br><br>💡 <b>Tips:</b> Periksa kembali nomor WO atau Ticket ID Anda.`,
        quickReplies: [
          { label: '📝 Riwayat Saya', value: '/history' },
          { label: '📊 Dashboard', value: '/dashboard' },
          { label: '❓ Bantuan', value: '/help' }
        ]
      });
    }

    const row = rows[0];

    // Cek detail kendala pelanggan jika ada
    const [kendalaRows] = await db.execute(
      `SELECT status_hi, ttic, keterangan, nama_teknis, tanggal_input
       FROM kendala_pelanggan
       WHERE wonum = ?
       LIMIT 1`,
      [row.wonum]
    );

    // Cek detail teknisi sistem jika ada
    const [teknisiRows] = await db.execute(
      `SELECT activity, activity_teknisi, status_todolist, segment_alpro, solusi_progress, unit_inisiator
       FROM kendala_teknisi_sistem
       WHERE wonum = ?
       LIMIT 1`,
      [row.wonum]
    );

    await insertLog(
      sessionId,
      'keyword',
      keyword,
      row.status_daily,
      'Status tiket ditemukan',
      null
    );

    const statusEmoji = getStatusEmoji(row.status_daily);
    const statusClass = getStatusClass(row.status_daily);
    
    let detailMessage = `
<b>📄 Detail Tiket</b><br>
<br>
<div style="background:#fff3f3;padding:12px;border-radius:8px;margin:8px 0;border-left:4px solid #e53935;">
  <b>WO:</b> <code>${row.wonum}</code><br>
  <b>Ticket ID:</b> <code>${row.ticket_id}</code><br>
  <b>Status:</b> <span class="status-badge ${statusClass}">${statusEmoji} ${row.status_daily}</span>
</div>
<br>
<b>👤 Pelanggan</b><br>
• Nama: ${row.nama || '-'}<br>
• Paket: ${row.package_name}<br>
• ODP: ${row.odp_inputan || '-'}<br>
<br>
<b>📍 Lokasi</b><br>
• STO: ${row.sto}<br>
• Regional: ${row.regional || '-'}`;

    // Tambahkan info kendala pelanggan jika ada
    if (kendalaRows.length > 0) {
      const k = kendalaRows[0];
      detailMessage += `<br>
<br>
<b>⚠️ Kendala Pelanggan</b><br>
• Status HI: ${k.status_hi || '-'}<br>
• TTIC: ${k.ttic || '-'}<br>
• Teknisi: ${k.nama_teknis || '-'}<br>
• Keterangan: ${k.keterangan || '-'}<br>
• Tanggal Input: ${formatDate(k.tanggal_input)}`;
    }

    // Tambahkan info teknisi sistem jika ada
    if (teknisiRows.length > 0) {
      const t = teknisiRows[0];
      detailMessage += `<br>
<br>
<b>🔧 Kendala Teknisi</b><br>
• Unit: ${t.unit_inisiator || '-'}<br>
• Activity: ${t.activity || '-'}<br>
• Segment: ${t.segment_alpro || '-'}<br>
• Status Todolist: ${t.status_todolist || '-'}<br>
• Solusi: ${t.solusi_progress || '-'}`;
    }

    detailMessage += `<br>
<br>
<b>🕐 Update Terakhir</b><br>
${formatDateTime(row.updated_at)}`;

    return res.json({
      success: true,
      message: detailMessage,
      quickReplies: [
        { label: '🔍 Cari Lagi', value: '/search' },
        { label: '📊 Dashboard', value: '/dashboard' }
      ]
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});


router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const [rows] = await db.execute(
      `SELECT input_value, result_status, response_message, created_at, input_type
       FROM bot_logs
       WHERE session_id = ?
       ORDER BY created_at ASC
       LIMIT 50`,
      [sessionId]
    );

    res.json({
      success: true,
      history: rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching history' });
  }
});


router.post('/clear-history', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    await db.execute(
      `DELETE FROM bot_logs WHERE session_id = ?`,
      [sessionId]
    );

    res.json({
      success: true,
      message: '✅ Riwayat chat berhasil dihapus'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error clearing history' });
  }
});

// COMMAND HANDLER
async function handleCommand(cmd, sessionId, res) {
  const cmdLower = cmd.toLowerCase();

  switch (cmdLower) {

    case '/help':
      await insertLog(sessionId, 'command', cmd, 'OK', 'Help', cmd);
      return res.json({
        success: true,
        message: `
<b>🤖 Bot Status RIDAR - Panduan</b><br>
<br>
<b>📋 Perintah Tersedia:</b><br>
• <b>/help</b> - Panduan ini<br>
• <b>/cek</b> - Cara cek status tiket<br>
• <b>/last</b> - Pencarian terakhir saya<br>
• <b>/history</b> - Riwayat pencarian saya<br>
• <b>/dashboard</b> - Statistik keseluruhan<br>
• <b>/stats</b> - Statistik hari ini<br>
• <b>/sto</b> - Info wilayah STO<br>
• <b>/clear</b> - Hapus riwayat chat<br>
• <b>/about</b> - Tentang bot<br>
<br>
<b>💡 Cara Menggunakan:</b><br>
Ketik nomor WO atau Ticket ID langsung untuk cek status.<br>
<br>
<b>Contoh:</b> <code>WO-001</code> atau <code>TCK-002</code>
        `,
        quickReplies: [
          { label: '📝 Cara Cek', value: '/cek' },
          { label: '📊 Dashboard', value: '/dashboard' }
        ]
      });

    case '/cek':
    case '/status':
      await insertLog(sessionId, 'command', cmd, 'OK', 'Status help', cmd);
      return res.json({
        success: true,
        message: `
<b>📌 Cara Cek Status Tiket</b><br>
<br>
<b>Langkah-langkah:</b><br>
<br>
1️⃣ Ketik nomor WO<br>
   Contoh: <code>WO-001</code><br>
<br>
2️⃣ Atau ketik Ticket ID<br>
   Contoh: <code>TCK-001</code><br>
<br>
3️⃣ Tekan Enter atau klik Kirim<br>
<br>
<b>ℹ️ Informasi yang ditampilkan:</b><br>
• Status tiket (COMPLETE, ON_PROGRESS, dll)<br>
• Data pelanggan<br>
• Lokasi STO & Regional<br>
• Kendala pelanggan (jika ada)<br>
• Kendala teknisi (jika ada)<br>
• Update terakhir
        `,
        quickReplies: [
          { label: '🔍 Coba Cek', value: '/search' }
        ]
      });

    case '/search':
      return res.json({
        success: true,
        message: '🔍 Silakan ketik nomor WO atau Ticket ID untuk mencari'
      });

    case '/last': {
      const [rows] = await db.execute(
        `SELECT input_value, result_status, created_at
         FROM bot_logs
         WHERE session_id = ? AND input_type = 'keyword'
         ORDER BY created_at DESC
         LIMIT 1`,
        [sessionId]
      );

      if (!rows.length) {
        return res.json({
          success: true,
          message: `
<b>📭 Belum ada riwayat pencarian</b><br>
<br>
Anda belum pernah melakukan pencarian tiket.
          `,
          quickReplies: [
            { label: '📝 Cara Cek', value: '/cek' },
            { label: '❓ Bantuan', value: '/help' }
          ]
        });
      }

      const r = rows[0];
      const statusEmoji = getStatusEmoji(r.result_status);
      const statusClass = getStatusClass(r.result_status);
      
      return res.json({
        success: true,
        message: `
<b>📌 Pencarian Terakhir</b><br>
<br>
<b>WO/Ticket:</b> <code>${r.input_value}</code><br>
<b>Status:</b> <span class="status-badge ${statusClass}">${statusEmoji} ${r.result_status}</span><br>
<b>Waktu:</b> ${formatDateTime(r.created_at)}
        `,
        quickReplies: [
          { label: '🔍 Cek Lagi: ' + r.input_value, value: r.input_value },
          { label: '📝 History', value: '/history' }
        ]
      });
    }

    case '/history': {
      const [rows] = await db.execute(
        `SELECT input_value, result_status, created_at
         FROM bot_logs
         WHERE session_id = ? AND input_type = 'keyword'
         ORDER BY created_at DESC
         LIMIT 10`,
        [sessionId]
      );

      if (!rows.length) {
        return res.json({
          success: true,
          message: `
<b>📭 Belum ada riwayat</b><br>
<br>
Anda belum pernah melakukan pencarian.
          `
        });
      }

      let msg = '<b>📝 Riwayat Pencarian Anda (10 Terakhir)</b><br><br>';
      rows.forEach((r, idx) => {
        const statusEmoji = getStatusEmoji(r.result_status);
        const time = formatDateTime(r.created_at);
        msg += `<b>${idx + 1}.</b> <code>${r.input_value}</code> - ${statusEmoji} ${r.result_status}<br>`;
        msg += `   <small style="color:#999;">${time}</small><br><br>`;
      });

      return res.json({
        success: true,
        message: msg,
        quickReplies: [
          { label: '🗑️ Hapus Riwayat', value: '/clear' }
        ]
      });
    }

    case '/dashboard': {
      const [rows] = await db.execute(`
        SELECT result_status, COUNT(*) total
        FROM bot_logs
        WHERE input_type = 'keyword'
        GROUP BY result_status
      `);

      const [totalRows] = await db.execute(`
        SELECT COUNT(*) as total FROM bot_logs WHERE input_type = 'keyword'
      `);

      const [todayRows] = await db.execute(`
        SELECT COUNT(*) as total FROM bot_logs 
        WHERE input_type = 'keyword' AND DATE(created_at) = CURDATE()
      `);

      let msg = '<b>📊 Dashboard Bot RIDAR</b><br><br>';
      msg += `<div style="background:#fff3f3;padding:10px;border-radius:6px;margin:8px 0;">`;
      msg += `📈 <b>Total Pencarian:</b> ${totalRows[0].total}<br>`;
      msg += `📅 <b>Hari Ini:</b> ${todayRows[0].total}`;
      msg += `</div><br>`;
      
      msg += '<b>Status Breakdown:</b><br>';
      rows.forEach(r => {
        const emoji = getStatusEmoji(r.result_status);
        const percentage = ((r.total / totalRows[0].total) * 100).toFixed(1);
        msg += `${emoji} <b>${r.result_status}:</b> ${r.total} (${percentage}%)<br>`;
      });

      return res.json({
        success: true,
        message: msg,
        quickReplies: [
          { label: '📈 Stats Hari Ini', value: '/stats' },
          { label: '📍 Info STO', value: '/sto' }
        ]
      });
    }

    case '/stats': {
      const [rows] = await db.execute(`
        SELECT result_status, COUNT(*) total
        FROM bot_logs
        WHERE DATE(created_at) = CURDATE() AND input_type = 'keyword'
        GROUP BY result_status
      `);

      if (!rows.length) {
        return res.json({
          success: true,
          message: '<b>📭 Belum ada pencarian hari ini</b>'
        });
      }

      let msg = '<b>📈 Statistik Hari Ini</b><br><br>';
      let total = 0;
      rows.forEach(r => total += r.total);
      
      msg += `<b>Total Pencarian:</b> ${total}<br><br>`;
      
      rows.forEach(r => {
        const emoji = getStatusEmoji(r.result_status);
        const percentage = ((r.total / total) * 100).toFixed(1);
        msg += `${emoji} <b>${r.result_status}:</b> ${r.total} (${percentage}%)<br>`;
      });

      return res.json({
        success: true,
        message: msg
      });
    }

    case '/sto': {
      const [rows] = await db.execute(`
        SELECT sto, uic, pic, leader
        FROM wilayah_ridar
        ORDER BY sto
      `);

      if (!rows.length) {
        return res.json({
          success: true,
          message: '📭 Data wilayah STO tidak tersedia'
        });
      }

      let msg = '<b>📍 Informasi Wilayah STO</b><br><br>';
      rows.forEach(r => {
        msg += `<b>STO ${r.sto}</b><br>`;
        msg += `• UIC: ${r.uic}<br>`;
        msg += `• PIC: ${r.pic}<br>`;
        msg += `• Leader: ${r.leader}<br><br>`;
      });

      return res.json({
        success: true,
        message: msg
      });
    }

    case '/clear':
      await insertLog(sessionId, 'command', cmd, 'OK', 'Clear chat', cmd);
      return res.json({
        success: true,
        command: 'clear',
        message: '✅ Riwayat chat akan dihapus'
      });

    case '/about':
      return res.json({
        success: true,
        message: `
<b>ℹ️ Tentang Bot RIDAR</b><br>
<br>
<b>Bot Status RIDAR</b> adalah asisten virtual untuk membantu Anda mengecek status tiket WO secara realtime.<br>
<br>
<b>🎯 Fitur:</b><br>
• Cek status tiket WO<br>
• Detail pelanggan & teknisi<br>
• Tracking kendala<br>
• Statistik & dashboard<br>
• Info wilayah STO<br>
<br>
<b>📌 Versi:</b> 1.0.0 <br>
<b>🗄️ Database:</b> MySQL<br>
<b>📅 Updated:</b> February 2026<br>
<br>
<div style="margin-top:10px;padding:8px;background:#fff3f3;border-radius:6px;">
💡 <b>Tips:</b> Ketik <code>/help</code> untuk melihat semua perintah yang tersedia.
</div>
        `
      });

    default:
      return res.json({
        success: false,
        message: `
<b>❌ Command tidak dikenali</b><br>
<br>
Command <code>${cmd}</code> tidak tersedia.<br>
<br>
Ketik <b>/help</b> untuk melihat daftar command.
        `,
        quickReplies: [
          { label: '❓ Help', value: '/help' },
          { label: '📊 Dashboard', value: '/dashboard' }
        ]
      });
  }
}

router.get('/commands', (req, res) => {
  res.json({
    success: true,
    commands: [
      { cmd: '/help', desc: 'Panduan lengkap bot', emoji: '❓' },
      { cmd: '/cek', desc: 'Cara cek status tiket', emoji: '📌' },
      { cmd: '/last', desc: 'Pencarian terakhir saya', emoji: '🔙' },
      { cmd: '/history', desc: 'Riwayat pencarian saya', emoji: '📝' },
      { cmd: '/dashboard', desc: 'Statistik keseluruhan', emoji: '📊' },
      { cmd: '/stats', desc: 'Statistik hari ini', emoji: '📈' },
      { cmd: '/sto', desc: 'Informasi wilayah STO', emoji: '📍' },
      { cmd: '/clear', desc: 'Hapus riwayat chat', emoji: '🗑️' },
      { cmd: '/about', desc: 'Tentang bot ini', emoji: 'ℹ️' }
    ]
  });
});


function getStatusEmoji(status) {
  const emojiMap = {
    'COMPLETE': '✅',
    'ON_PROGRESS': '🔄',
    'OGP': '🔄',
    'OPEN': '📂',
    'PINDAH LOKER': '📦',
    'NOT_FOUND': '❌'
  };
  return emojiMap[status] || '📋';
}

function getStatusClass(status) {
  const classMap = {
    'COMPLETE': 'status-complete',
    'ON_PROGRESS': 'status-progress',
    'OGP': 'status-progress',
    'OPEN': 'status-open',
    'PINDAH LOKER': 'status-loker',
    'NOT_FOUND': 'status-notfound'
  };
  return classMap[status] || 'status-default';
}

function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

async function insertLog(
  sessionId,
  inputType,
  inputValue,
  resultStatus,
  responseMessage,
  commandUsed
) {
  await db.execute(
    `INSERT INTO bot_logs
    (session_id, input_type, input_value, result_status, response_message, command_used, created_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [sessionId, inputType, inputValue, resultStatus, responseMessage, commandUsed]
  );
}

module.exports = router;