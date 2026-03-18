console.log('Kendala Pelanggan JS loaded');

// Remove saved parameter from URL and auto-hide success alert
document.addEventListener('DOMContentLoaded', function () {
  // Remove ?saved=1 from URL
  if (window.history && window.history.replaceState) {
    var currentUrl = window.location.href;
    if (currentUrl.includes('?saved=')) {
      var newUrl = currentUrl.replace(/[?&]saved=1/, '');
      window.history.replaceState({}, document.title, newUrl);
    }
  }

  // Auto-hide success alert after 3 seconds with animation
  var successAlert = document.getElementById('successAlert');
  if (successAlert) {
    setTimeout(function () {
      successAlert.classList.add('hide-alert');
      setTimeout(function () {
        successAlert.style.display = 'none';
      }, 300); // Wait for animation to complete
    }, 3000); // Show for 3 seconds
  }
});

// Modal/detail and delete handlers
document.addEventListener('DOMContentLoaded', function () {
  var modal = document.getElementById('kendalaDetailModal');
  var modalClose = document.getElementById('modalClose');
  var mdCloseBtn = document.getElementById('md-close-btn');

  function showModal() {
    if (modal) modal.classList.add('is-open');
    document.body.classList.add('modal-open');
  }
  function hideModal() {
    if (modal) modal.classList.remove('is-open');
    document.body.classList.remove('modal-open');
  }

  if (modalClose) modalClose.addEventListener('click', hideModal);
  if (mdCloseBtn) mdCloseBtn.addEventListener('click', hideModal);

  // attach detail handlers
  document.querySelectorAll('.btn-detail').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tr = this.closest('tr');
      if (!tr) return;
      var id = tr.dataset.id;
      var mdWonum = document.getElementById('md-wonum');
      var mdTicket = document.getElementById('md-ticket');
      var mdStatus = document.getElementById('md-status');
      var mdSto = document.getElementById('md-sto');
      var mdTtd = document.getElementById('md-ttd');
      var mdTtic = document.getElementById('md-ttic');
      var mdKeterangan = document.getElementById('md-keterangan');
      var mdInputDate = document.getElementById('md-input-date');
      var mdLastUpdated = document.getElementById('md-last-updated');
      var mdNama = document.getElementById('md-nama');
      var editLink = document.getElementById('md-edit-link');

      if (mdWonum) mdWonum.textContent = tr.dataset.wonum || '-';
      if (mdTicket) mdTicket.textContent = tr.dataset.ticket_id || '-';
      if (mdStatus) mdStatus.textContent = tr.dataset.status_hi || '-';
      if (mdSto) mdSto.textContent = tr.dataset.sto || '-';
      if (mdTtd) mdTtd.textContent = tr.dataset.ttd_kb || '-';
      if (mdTtic) mdTtic.textContent = tr.dataset.ttic || '-';
      if (mdKeterangan) mdKeterangan.textContent = tr.dataset.keterangan || '-';
      if (mdInputDate) mdInputDate.textContent = tr.dataset.input_date_display || '-';
      if (mdLastUpdated) mdLastUpdated.textContent = tr.dataset.last_updated_display || '-';
      if (mdNama) mdNama.textContent = tr.dataset.nama_teknis || '-';
      if (editLink) editLink.href = '/kendala/edit/' + id;
      showModal();
    });
  });

  // attach delete handlers
  document.querySelectorAll('.btn-delete').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tr = this.closest('tr');
      if (!tr) return;
      var id = tr.dataset.id;
      if (!confirm('Hapus data kendala ini? Tindakan ini tidak dapat dibatalkan.')) return;
      fetch('/kendala/delete/' + id, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
        .then(function (res) { return res.json(); })
        .then(function (json) {
          if (json && json.ok) {
            tr.parentNode.removeChild(tr);
          } else {
            alert('Gagal menghapus data: ' + (json && json.error ? json.error : 'unknown'));
          }
        }).catch(function (err) {
          console.error('Delete error', err);
          alert('Terjadi kesalahan saat menghapus.');
        });
    });
  });

  // close modal on ESC
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideModal(); });
});

// Set max date to today for tanggal_input field
var tanggalInput = document.getElementById('tanggal_input');
if (tanggalInput) {
  var today = new Date();
  var year = today.getFullYear();
  var month = String(today.getMonth() + 1).padStart(2, '0');
  var day = String(today.getDate()).padStart(2, '0');
  var maxDate = year + '-' + month + '-' + day;
  tanggalInput.setAttribute('max', maxDate);
}

var searchInput = document.getElementById('searchWonum');
if (searchInput) {
  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.closest('form').submit();
    }
  });
}

// ============================
// TTD KB FORMAT VALIDATION
// ============================
// Format function: convert input to "X Hari" format
function formatTtdKbValue(input) {
  if (!input) return null;
  
  var trimmed = String(input).trim();
  if (!trimmed) return null;
  
  // Match: angka (1-5 digit) optional whitespace optional "hari" (case-insensitive)
  var match = trimmed.match(/^(\d+)\s*(hari)?$/i);
  if (!match) {
    return null; // Invalid format
  }
  
  var days = match[1];
  return days + ' Hari';
}

// Attach validators and auto-format to TTD KB inputs
document.addEventListener('DOMContentLoaded', function () {
  var ttdKbInputs = document.querySelectorAll('input[name="ttd_kb"]');
  
  ttdKbInputs.forEach(function (input) {
    // Create error message element if not exists
    var errorMsg = input.nextElementSibling;
    if (!errorMsg || !errorMsg.classList.contains('ttd-kb-error')) {
      errorMsg = document.createElement('small');
      errorMsg.className = 'ttd-kb-error';
      errorMsg.style.color = '#e74c3c';
      errorMsg.style.marginTop = '4px';
      errorMsg.style.display = 'none';
      input.parentNode.appendChild(errorMsg);
    }
    
    // Validate and format on blur
    input.addEventListener('blur', function () {
      if (!this.value.trim()) {
        errorMsg.style.display = 'none';
        return;
      }
      
      var formatted = formatTtdKbValue(this.value);
      if (formatted) {
        this.value = formatted;
        errorMsg.style.display = 'none';
      } else {
        errorMsg.textContent = 'Format tidak valid. Gunakan angka atau \"angka hari\" (contoh: 90 atau 90 hari)';
        errorMsg.style.display = 'block';
      }
    });
    
    // Real-time preview on input
    input.addEventListener('input', function () {
      if (!this.value.trim()) {
        errorMsg.style.display = 'none';
        return;
      }
      
      var formatted = formatTtdKbValue(this.value);
      if (formatted) {
        errorMsg.style.display = 'none';
      } else {
        errorMsg.textContent = 'Format tidak valid. Gunakan angka atau \"angka hari\" (contoh: 90 atau 90 hari)';
        errorMsg.style.display = 'block';
      }
    });
  });
});

/* tambahan */

// ============================
// IMPORT/UPLOAD HANDLER - KENDALA
// ============================

document.addEventListener('DOMContentLoaded', function () {
  const btnUpload = document.getElementById('btnUploadKendala');
  const uploadFile = document.getElementById('uploadFileKendala');

  if (!btnUpload || !uploadFile) return;

  // Show file picker
  btnUpload.addEventListener('click', () => uploadFile.click());

  // Handle file selection
  uploadFile.addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    e.target.value = '';

    const name = (f.name || '').toLowerCase();
    const isExcel = name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.xlsm');

    try {
      if (!isExcel) {
        showToast('Format file harus Excel (.xlsx/.xls/.xlsm)', 'error');
        return;
      }

      showToast('Parsing Excel...', 'info');
      if (typeof window.XLSX === 'undefined') {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      const arrayBuffer = await f.arrayBuffer();
      const wb = window.XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const parsed = parseExcelRows(sheet);

      if (!parsed.rows.length) {
        showToast('File Excel tidak memiliki data yang bisa di-import', 'error');
        return;
      }

      const webFields = [
        { field: 'wonum', label: 'WONUM' },
        { field: 'sto', label: 'STO' },
        { field: 'tanggal_input', label: 'Tanggal Input' },
        { field: 'ttd_kb', label: 'TTD KB' },
        { field: 'status_hi', label: 'Status HI' },
        { field: 'ttic', label: 'TTIC' },
        { field: 'keterangan', label: 'Keterangan' },
        { field: 'nama_teknis', label: 'Nama Teknis' }
      ];

      const autoMapping = autoDetectMapping(parsed.columns, webFields);

      showMappingModal(
        'Map Kolom - Kendala Pelanggan',
        parsed.columns,
        parsed.rows.slice(0, 5),
        parsed.rows.length,
        webFields,
        autoMapping,
        (mapping) => {
          if (!mapping.wonum) {
            showToast('Kolom WONUM harus di-map', 'error');
            return;
          }

          showToast('Importing...', 'info');
          fetch('/kendala/upload-json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows: parsed.rows, mapping })
          })
            .then(r => r.json())
            .then(j => {
              if (!j.success) throw new Error(j.message || 'Import gagal');
              showToast(j.message || 'Import selesai', 'success');
              setTimeout(() => location.reload(), 1000);
            })
            .catch(err => {
              showToast('Import gagal: ' + (err.message || '').slice(0, 200), 'error');
            });
        }
      );
    } catch (err) {
      showToast('Gagal baca file: ' + (err.message || ''), 'error');
    }
  });

  function normalizeHeader(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  function parseExcelRows(sheet) {
    const matrix = window.XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
    if (!matrix.length) return { columns: [], rows: [] };

    const aliases = {
      wonum: ['wonum', 'wonumber', 'wonoum', 'order', 'nomororder', 'noorder', 'nomorwo', 'wo'],
      sto: ['sto', 'witel', 'site', 'lokasi', 'wilayah'],
      tanggal_input: ['tanggalinput', 'inputdate', 'tglinput', 'tanggal', 'date', 'createdate'],
      ttd_kb: ['ttdkb', 'ttd', 'ttl', 'umurkendala', 'durasi', 'hari'],
      status_hi: ['statushi', 'status', 'statuskendala', 'hi'],
      ttic: ['ttic', 'sla', 'durasittic'],
      keterangan: ['keterangan', 'kendala', 'deskripsi', 'problem', 'catatan'],
      nama_teknis: ['namateknis', 'namateknisi', 'teknisi', 'pic', 'petugas']
    };

    const flatAliases = Object.values(aliases).flat();

    function rowScore(row, nextRow) {
      const cells = (row || []).map((c) => String(c || '').trim());
      const nonEmptyIndexes = [];
      let aliasHit = 0;

      cells.forEach((cell, idx) => {
        const normalized = normalizeHeader(cell);
        if (!normalized) return;
        nonEmptyIndexes.push(idx);
        if (flatAliases.includes(normalized)) aliasHit += 1;
      });

      if (!nonEmptyIndexes.length) return -9999;

      let score = 0;
      score += aliasHit * 10;
      score += Math.min(nonEmptyIndexes.length, 12);

      if (nonEmptyIndexes.length === 1) score -= 8;

      // Penalize title-like row (single long text)
      const firstNonEmpty = cells[nonEmptyIndexes[0]] || '';
      if (nonEmptyIndexes.length <= 2 && firstNonEmpty.length > 20) {
        score -= 8;
      }

      // Bonus if next row looks like data under this candidate header
      if (nextRow && nextRow.length) {
        let dataLikeCount = 0;
        nonEmptyIndexes.forEach((idx) => {
          const val = String(nextRow[idx] || '').trim();
          if (val !== '') dataLikeCount += 1;
        });
        score += Math.min(dataLikeCount, 8) * 2;
      }

      return score;
    }

    let bestHeaderRowIndex = 0;
    let bestScore = -9999;

    for (let i = 0; i < Math.min(matrix.length, 40); i++) {
      const score = rowScore(matrix[i] || [], matrix[i + 1] || []);
      if (score > bestScore) {
        bestScore = score;
        bestHeaderRowIndex = i;
      }
    }

    const rawHeaders = matrix[bestHeaderRowIndex] || [];
    const columns = rawHeaders.map((h, idx) => {
      const val = String(h || '').trim();
      return val || `Column_${idx + 1}`;
    });

    const rows = [];
    for (let r = bestHeaderRowIndex + 1; r < matrix.length; r++) {
      const values = matrix[r] || [];
      const rowObj = {};
      let hasValue = false;

      columns.forEach((col, idx) => {
        const value = values[idx] != null ? values[idx] : '';
        rowObj[col] = value;
        if (String(value).trim() !== '') hasValue = true;
      });

      if (hasValue) rows.push(rowObj);
    }

    // Fallback: if picked title row by mistake, promote first data row as header
    const normalizedColumns = columns.map((c) => normalizeHeader(c));
    const likelyBadHeader = normalizedColumns.filter((c) => c && flatAliases.includes(c)).length <= 1;
    if (likelyBadHeader && rows.length > 1) {
      const firstDataRowValues = columns.map((col) => String(rows[0][col] || '').trim());
      const firstDataAliasHit = firstDataRowValues.filter((v) => flatAliases.includes(normalizeHeader(v))).length;

      if (firstDataAliasHit >= 2) {
        const promotedColumns = firstDataRowValues.map((v, idx) => v || `Column_${idx + 1}`);
        const promotedRows = [];

        for (let r = 1; r < rows.length; r++) {
          const current = rows[r];
          const rowObj = {};
          let hasValue = false;

          promotedColumns.forEach((newCol, idx) => {
            const oldCol = columns[idx];
            const value = current[oldCol] != null ? current[oldCol] : '';
            rowObj[newCol] = value;
            if (String(value).trim() !== '') hasValue = true;
          });

          if (hasValue) promotedRows.push(rowObj);
        }

        return { columns: promotedColumns, rows: promotedRows };
      }
    }

    return { columns, rows };
  }

  function autoDetectMapping(columns, webFields) {
    const aliasMap = {
      wonum: ['wonum', 'wonumber', 'wono', 'workordernumber', 'nomororder', 'noorder', 'nomorwo', 'wo'],
      sto: ['sto', 'witel', 'site', 'lokasi', 'wilayah'],
      tanggal_input: ['tanggalinput', 'inputdate', 'tglinput', 'tanggal', 'date', 'createdate'],
      ttd_kb: ['ttdkb', 'ttd', 'ttdkbhari', 'durasi', 'hari'],
      status_hi: ['statushi', 'status', 'statuskendala', 'hi'],
      ttic: ['ttic', 'sla', 'durasittic'],
      keterangan: ['keterangan', 'kendala', 'deskripsi', 'problem', 'catatan'],
      nama_teknis: ['namateknis', 'namateknisi', 'teknisi', 'pic', 'petugas']
    };

    const mapping = {};

    webFields.forEach((wf) => {
      const aliases = aliasMap[wf.field] || [wf.field];
      let selected = '';

      for (const col of columns) {
        const nCol = normalizeHeader(col);
        if (aliases.includes(nCol)) {
          selected = col;
          break;
        }
      }

      if (!selected) {
        for (const col of columns) {
          const nCol = normalizeHeader(col);
          if (aliases.some((a) => nCol.includes(a) || a.includes(nCol))) {
            selected = col;
            break;
          }
        }
      }

      if (selected) mapping[wf.field] = selected;
    });

    return mapping;
  }

  // Mapping modal
  function showMappingModal(title, csvColumns, previewRows, totalRows, webFields, initialMapping, onConfirm) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';

    const mapping = { ...(initialMapping || {}) };
    const content = document.createElement('div');
    content.style.cssText = 'background: white; border-radius: 8px; padding: 20px; max-width: 700px; max-height: 80vh; overflow-y: auto; box-shadow: 0 2px 10px rgba(0,0,0,0.2);';
    
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.cssText = 'margin-top: 0; color: #dc2626;';
    content.appendChild(titleEl);

    const mappingSection = document.createElement('div');
    mappingSection.style.cssText = 'margin-bottom: 20px;';
    const mappingTitle = document.createElement('h4');
    mappingTitle.textContent = 'Map Kolom File dengan Field Database';
    mappingTitle.style.cssText = 'margin: 10px 0; font-size: 14px; font-weight: 600;';
    mappingSection.appendChild(mappingTitle);

    const mappingHint = document.createElement('p');
    mappingHint.textContent = 'Sistem sudah melakukan mapping otomatis. Silakan cek dan koreksi jika perlu.';
    mappingHint.style.cssText = 'margin: 0 0 12px; font-size: 12px; color: #6b7280;';
    mappingSection.appendChild(mappingHint);

    webFields.forEach(wf => {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; align-items: center; margin-bottom: 10px; gap: 10px;';
      const label = document.createElement('label');
      label.textContent = wf.label + ':';
      label.style.cssText = 'min-width: 120px; font-weight: 500;';
      const select = document.createElement('select');
      select.style.cssText = 'flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;';
      select.appendChild(Object.assign(document.createElement('option'), { value: '', textContent: '-- Pilih Kolom --' }));
      csvColumns.forEach((col, idx) => {
        const opt = document.createElement('option');
        opt.value = col;
        opt.textContent = col;
        select.appendChild(opt);
      });
      if (mapping[wf.field]) {
        select.value = mapping[wf.field];
      }
      select.addEventListener('change', function() {
        mapping[wf.field] = this.value;
      });
      row.appendChild(label);
      row.appendChild(select);
      mappingSection.appendChild(row);
    });
    content.appendChild(mappingSection);

    // Preview
    if (previewRows && previewRows.length > 0) {
      const previewTitle = document.createElement('h4');
      previewTitle.textContent = `Preview (${totalRows} baris)`;
      previewTitle.style.cssText = 'margin: 15px 0 10px; font-size: 14px; font-weight: 600;';
      content.appendChild(previewTitle);
      const preview = document.createElement('table');
      preview.style.cssText = 'width: 100%; border-collapse: collapse; font-size: 12px;';
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      csvColumns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        th.style.cssText = 'border: 1px solid #ddd; padding: 5px; text-align: left; background: #f0f0f0;';
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      preview.appendChild(thead);
      const tbody = document.createElement('tbody');
      previewRows.forEach(row => {
        const tr = document.createElement('tr');
        csvColumns.forEach(col => {
          const td = document.createElement('td');
          td.textContent = row[col] != null ? row[col] : '';
          td.style.cssText = 'border: 1px solid #ddd; padding: 5px;';
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      preview.appendChild(tbody);
      content.appendChild(preview);
    }

    const buttonRow = document.createElement('div');
    buttonRow.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;';
    
    const btnCancel = document.createElement('button');
    btnCancel.textContent = 'Batal';
    btnCancel.style.cssText = 'padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; background: white;';
    btnCancel.addEventListener('click', () => document.body.removeChild(modal));
    buttonRow.appendChild(btnCancel);
    
    const btnConfirm = document.createElement('button');
    btnConfirm.textContent = 'Import';
    btnConfirm.style.cssText = 'padding: 8px 16px; background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;';
    btnConfirm.addEventListener('click', () => {
      document.body.removeChild(modal);
      onConfirm(mapping);
    });
    buttonRow.appendChild(btnConfirm);
    content.appendChild(buttonRow);
    modal.appendChild(content);
    document.body.appendChild(modal);
  }

  // Toast notification
  function showToast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    t.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      border-radius: 4px;
      z-index: 10000;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }
});

// ============================
// EXPORT HANDLER
// ============================

// ============================
// EXPORT TO PDF (CLIENT-SIDE - BEAUTIFUL FORMAT LIKE DASHBOARD)
// ============================

async function exportKendalaToPDF() {
  try {
    const btn = document.getElementById('btnExport');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="loading-spinner"></span> Generating PDF...';
    btn.disabled = true;

    // Ambil data dari tabel di halaman
    const tableData = [];
    const table = document.querySelector('.kendala-table.rekap-table');
    
    if (table) {
      const tbody = table.querySelector('tbody');
      const rows = tbody.querySelectorAll('tr');
      
      rows.forEach((tr) => {
        const firstTd = tr.querySelector('td');
        if (!firstTd) return;
        
        const emptyCheck = firstTd.textContent.trim();
        if (emptyCheck === 'Tidak ada data') return;
        
        tableData.push({
          wonum: tr.dataset.wonum || '-',
          ticket_id: tr.dataset.ticket_id || '-',
          status_hi: tr.dataset.status_hi || '-',
          sto: tr.dataset.sto || '-',
          ttd_kb: tr.dataset.ttd_kb || '-',
          ttic: tr.dataset.ttic || '-',
          keterangan: tr.dataset.keterangan || '-',
          nama_teknis: tr.dataset.nama_teknis || '-',
          updated_at: tr.dataset.updated_at || tr.dataset.created_at || '-'
        });
      });
    }

    if (!tableData || tableData.length === 0) {
      alert('Tidak ada data untuk di-export');
      btn.innerHTML = originalText;
      btn.disabled = false;
      return;
    }

    // Inisialisasi jsPDF
    const { jsPDF } = window.jspdf;
    
    // Buat dokumen PDF landscape
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    let yPosition = margin;

    // Tanggal laporan
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const timeStr = now.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Header - Merah seperti dashboard
    pdf.setFillColor(220, 38, 38);
    pdf.rect(0, 0, pageWidth, 38, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'bold');
    pdf.text('LAPORAN KENDALA PELANGGAN', pageWidth / 2, 13, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Tanggal Laporan: ${dateStr} | ${timeStr}`, pageWidth / 2, 25, { align: 'center' });

    yPosition = 42;

    // Filter info
    const urlParams = new URLSearchParams(window.location.search);
    const hasFilters = Array.from(urlParams.entries()).some(([key, val]) => 
      ['q', 'status', 'sto', 'ttic', 'date'].includes(key) && val
    );
    
    if (hasFilters) {
      pdf.setFillColor(254, 243, 199);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 11, 'F');
      
      pdf.setTextColor(146, 64, 14);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.text('Filter Aktif:', margin + 3, yPosition + 4);
      
      pdf.setFont(undefined, 'normal');
      let filterText = [];
      if (urlParams.get('q')) filterText.push(`Search: ${urlParams.get('q')}`);
      if (urlParams.get('status')) filterText.push(`Status: ${urlParams.get('status')}`);
      if (urlParams.get('sto')) filterText.push(`STO: ${urlParams.get('sto')}`);
      if (urlParams.get('ttic')) filterText.push(`TTIC: ${urlParams.get('ttic')}`);
      if (urlParams.get('date')) filterText.push(`Tanggal: ${urlParams.get('date')}`);
      
      pdf.text(filterText.join(' | '), margin + 3, yPosition + 8);
      yPosition += 14;
    }

    // Persiapkan data tabel
    const tableRows = tableData.map((item, idx) => [
      idx + 1,
      item.wonum,
      item.ticket_id,
      item.status_hi,
      item.sto,
      item.ttd_kb,
      item.ttic,
      item.keterangan,
      item.nama_teknis,
      item.updated_at && item.updated_at !== '-' 
        ? new Date(item.updated_at).toLocaleDateString('id-ID')
        : '-'
    ]);

    // Header tabel
    const headers = [
      'NO', 'WONUM', 'TICKET ID', 'STATUS HI', 'STO', 'TTD KB', 'TTIC', 'KETERANGAN', 'NAMA TEKNISI', 'UPDATED AT'
    ];

    // Tabel dengan autoTable
    const printableWidth = pageWidth - (2 * margin);
    pdf.autoTable({
      startY: yPosition,
      head: [headers],
      body: tableRows,
      theme: 'grid',
      tableWidth: printableWidth,
      headStyles: {
        fillColor: [220, 38, 38],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 4,
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
        valign: 'top',
        textColor: [40, 40, 40]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: printableWidth * 0.05, halign: 'center' },
        1: { cellWidth: printableWidth * 0.13 },
        2: { cellWidth: printableWidth * 0.11 },
        3: { cellWidth: printableWidth * 0.10 },
        4: { cellWidth: printableWidth * 0.07, halign: 'center' },
        5: { cellWidth: printableWidth * 0.08, halign: 'center' },
        6: { cellWidth: printableWidth * 0.08, halign: 'center' },
        7: { cellWidth: printableWidth * 0.17 },
        8: { cellWidth: printableWidth * 0.09 },
        9: { cellWidth: printableWidth * 0.12, halign: 'center' }
      },
      margin: { left: margin, right: margin },
      showHead: 'everyPage',
      didDrawPage: function(data) {
        const pageCount = pdf.internal.pages.length - 1;
        const pageSize = pdf.internal.pageSize;
        const pageHeight = pageSize.height;
        const pageWidth = pageSize.width;
        pdf.setFontSize(7);
        pdf.setTextColor(120, 120, 120);
        pdf.text(`Halaman ${data.pageNumber} dari ${pageCount}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      }
    });

    // Summary line
    yPosition = pdf.lastAutoTable.finalY + 6;
    pdf.setDrawColor(220, 38, 38);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(40, 40, 40);
    pdf.text(`Total Data: ${tableData.length} records`, margin, yPosition + 7);

    // Save PDF
    pdf.save(`kendala-pelanggan-${now.getTime()}.pdf`);

    btn.innerHTML = originalText;
    btn.disabled = false;
  } catch (err) {
    console.error('Export PDF error:', err);
    alert('Gagal membuat PDF: ' + (err.message || 'Unknown error'));
    const btn = document.getElementById('btnExport');
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-file-export"></i> Export';
      btn.disabled = false;
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  var exportSelect = document.getElementById('exportType');
  var exportBtn = document.getElementById('btnExport');

  if (exportBtn && exportSelect) {
    exportBtn.addEventListener('click', function () {
      var type = exportSelect.value;
      if (!type) {
        alert('Pilih format export terlebih dahulu.');
        return;
      }

      // Ambil parameter filter yang sedang aktif
      var params = new URLSearchParams(window.location.search);

      if (type === 'pdf') {
        exportKendalaToPDF();
      } else if (type === 'excel') {
        window.location.href = '/kendala/export/excel?' + params.toString();
      }
    });
  }
});


// ============================
// PAGINATION HELPER (Auto scroll top)
// ============================

document.addEventListener('DOMContentLoaded', function () {
  var pageLinks = document.querySelectorAll('.page-link');

  pageLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
});
