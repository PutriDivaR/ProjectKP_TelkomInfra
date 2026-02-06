document.addEventListener('DOMContentLoaded', () => {
  // Set active menu item for Daily Housekeeping
  const sidebarLinks = document.querySelectorAll('.sidebar .menu a');
  sidebarLinks.forEach(link => {
    if (link.getAttribute('href') === '/daily') {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  const tableBody = document.getElementById('dailyTableBody');
  const searchInput = document.getElementById('searchInput');
  const btnUpload = document.getElementById('btnUpload');
  const btnExport = document.getElementById('btnExport');
  const uploadFile = document.getElementById('uploadFile');
  const limitSelect = document.getElementById('limitSelect');
  const btnApplyDate = document.getElementById('btnApplyDate');
  const btnResetDate = document.getElementById('btnResetDate');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');

  function showToast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // Limit change
  if (limitSelect) {
    limitSelect.addEventListener('change', (e) => {
      const params = new URLSearchParams(window.location.search);
      params.set('limit', e.target.value);
      params.set('page', '1');
      window.location.search = params.toString();
    });
  }

  // Date filter
  if (btnApplyDate) {
    btnApplyDate.addEventListener('click', () => {
      const start = startDateInput.value;
      const end = endDateInput.value;
      if (!start || !end) {
        showToast('Pilih tanggal mulai dan akhir', 'error');
        return;
      }
      if (new Date(start) > new Date(end)) {
        showToast('Tanggal mulai harus sebelum tanggal akhir', 'error');
        return;
      }
      const params = new URLSearchParams();
      params.set('startDate', start);
      params.set('endDate', end);
      params.set('page', '1');
      window.location.search = params.toString();
    });
  }

  if (btnResetDate) {
    btnResetDate.addEventListener('click', () => {
      const params = new URLSearchParams(window.location.search);
      params.delete('startDate');
      params.delete('endDate');
      params.set('page', '1');
      window.location.search = params.toString();
    });
  }

  if (tableBody) {
    tableBody.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-view');
      if (btn) {
        const wonum = btn.dataset.wonum;
        window.location.href = `/daily/${wonum}`;
      }
    });
  }

  // KPI click filter
  const kpiCards = document.querySelectorAll('.kpi-card[data-values]');
  let activeKpi = null;
  kpiCards.forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const values = (card.dataset.values||'').split(',').map(s => s.trim().toUpperCase());
      // toggle
      if (activeKpi === card) {
        activeKpi.classList.remove('active');
        activeKpi = null;
        // reset
        Array.from(tableBody.querySelectorAll('tr')).forEach(r => r.style.display = '');
        return;
      }
      if (activeKpi) activeKpi.classList.remove('active');
      card.classList.add('active');
      activeKpi = card;

      Array.from(tableBody.querySelectorAll('tr')).forEach(r => {
        const statusDaily = (r.dataset.statusDaily || '').toUpperCase();
        if (!statusDaily) { r.style.display = 'none'; return; }
        // match if statusDaily equals any of values
        if (values.includes(statusDaily)) r.style.display = '';
        else r.style.display = 'none';
      });
    });
  });

  if (searchInput && tableBody) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      const rows = tableBody.querySelectorAll('tr');
      rows.forEach(r => {
        const wonum = (r.children[1] && r.children[1].textContent || '').toLowerCase();
        if (!q || wonum.includes(q)) r.style.display = '';
        else r.style.display = 'none';
      });
    });
  }

  if (btnUpload && uploadFile) {
    btnUpload.addEventListener('click', () => uploadFile.click());

    uploadFile.addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (!f) return;

      const name = (f.name || '').toLowerCase();
      const isExcel = name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.xlsm');

      if (isExcel) {
        showToast('Parsing Excel file...', 'info');
        try {
          // load SheetJS if not present
          if (typeof window.XLSX === 'undefined') {
            await new Promise((resolve, reject) => {
              const s = document.createElement('script');
              s.src = 'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js';
              s.onload = resolve; s.onerror = reject;
              document.head.appendChild(s);
            });
          }

          const arrayBuffer = await f.arrayBuffer();
          const wb = window.XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
          const first = wb.SheetNames[0];
          const ws = wb.Sheets[first];
          const json = window.XLSX.utils.sheet_to_json(ws, { defval: '' });

          const columns = json && json.length ? Object.keys(json[0]) : [];
          const previewRows = json.slice(0, 5);
          const totalRows = json.length;

          // Show mapping modal and on confirm send JSON rows to server
          showMappingModal(columns, previewRows, totalRows, () => {
            performJsonUpload(json);
          });
        } catch (err) {
          console.error(err);
          showToast('Gagal membaca Excel: ' + (err.message || 'Unknown'), 'error');
        }

        return;
      }

      // Fallback: treat as CSV using existing preview endpoint
      const form = new FormData();
      form.append('file', f);
      showToast('Reading file...', 'info');
      try {
        const res = await fetch('/daily/upload-preview', { method: 'POST', body: form });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Failed to read file');

        const csvColumns = json.columns || [];
        const previewRows = json.preview || [];
        const totalRows = json.totalRows || 0;

        showMappingModal(csvColumns, previewRows, totalRows, () => {
          performMappedUpload(f, csvColumns);
        });
      } catch (err) {
        console.error(err);
        showToast('Gagal membaca file: ' + (err.message || 'Unknown'), 'error');
      }
    });
  }

  // Show column mapping dialog
  function showMappingModal(csvColumns, previewRows, totalRows, onConfirm) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';
    
    const webFields = ['wonum', 'nama', 'ticket_id', 'sto', 'regional', 'lat', 'lang', 'package_name', 'status', 'odp_inputan', 'odp_todolist', 'status_akhir'];
    let mapping = {};

    const content = document.createElement('div');
    content.style.cssText = 'background: white; border-radius: 8px; padding: 20px; max-width: 600px; max-height: 80vh; overflow-y: auto; box-shadow: 0 2px 10px rgba(0,0,0,0.2);';
    
    const title = document.createElement('h3');
    title.textContent = 'Map CSV Columns to Web Fields';
    content.appendChild(title);

    const info = document.createElement('p');
    info.style.fontSize = '12px';
    info.style.color = '#666';
    info.textContent = `File: ${totalRows} rows | CSV Columns: ${csvColumns.join(', ')}`;
    content.appendChild(info);

    const mapContainer = document.createElement('div');
    mapContainer.style.cssText = 'margin: 15px 0;';

    webFields.forEach(field => {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 10px;';

      const label = document.createElement('label');
      label.textContent = field + ':';
      label.style.cssText = 'width: 100px; font-weight: bold;';
      row.appendChild(label);

      const select = document.createElement('select');
      select.style.cssText = 'flex: 1; padding: 5px; border: 1px solid #ccc; border-radius: 4px;';
      
      const emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = '(skip)';
      select.appendChild(emptyOpt);

      csvColumns.forEach(col => {
        const opt = document.createElement('option');
        opt.value = col;
        opt.textContent = col;
        // Auto-match if column name matches or contains the field name
        if (col.toLowerCase().includes(field.toLowerCase()) || field.toLowerCase().includes(col.toLowerCase())) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });

      select.addEventListener('change', (e) => {
        if (e.target.value) mapping[field] = e.target.value;
        else delete mapping[field];
      });

      row.appendChild(select);
      mapContainer.appendChild(row);

      // Trigger change to populate initial mapping
      select.dispatchEvent(new Event('change'));
    });

    content.appendChild(mapContainer);

    // Preview table
    if (previewRows.length > 0) {
      const previewLabel = document.createElement('p');
      previewLabel.style.cssText = 'font-weight: bold; margin-top: 15px; margin-bottom: 5px;';
      previewLabel.textContent = 'Preview (first 5 rows):';
      content.appendChild(previewLabel);

      const preview = document.createElement('table');
      preview.style.cssText = 'width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 15px;';
      
      const thead = document.createElement('thead');
      thead.style.cssText = 'background: #f5f5f5;';
      const headerRow = document.createElement('tr');
      csvColumns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        th.style.cssText = 'border: 1px solid #ddd; padding: 5px; text-align: left;';
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      preview.appendChild(thead);

      const tbody = document.createElement('tbody');
      previewRows.forEach(row => {
        const tr = document.createElement('tr');
        csvColumns.forEach(col => {
          const td = document.createElement('td');
          td.textContent = row[col] || '';
          td.style.cssText = 'border: 1px solid #ddd; padding: 5px;';
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      preview.appendChild(tbody);
      content.appendChild(preview);
    }

    // Buttons
    const buttonRow = document.createElement('div');
    buttonRow.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';

    const btnCancel = document.createElement('button');
    btnCancel.textContent = 'Cancel';
    btnCancel.style.cssText = 'padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;';
    btnCancel.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    buttonRow.appendChild(btnCancel);

    const btnConfirm = document.createElement('button');
    btnConfirm.textContent = 'Import';
    btnConfirm.style.cssText = 'padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;';
    btnConfirm.addEventListener('click', () => {
      document.body.removeChild(modal);
      onConfirm();
    });
    buttonRow.appendChild(btnConfirm);

    content.appendChild(buttonRow);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Return mapping object getter
    window._csvMapping = () => mapping;
  }

  function performMappedUpload(file, csvColumns) {
    const mapping = window._csvMapping();
    
    // Validate that at least wonum is mapped
    if (!mapping.wonum) {
      showToast('Wonum field harus di-map', 'error');
      return;
    }

    const form = new FormData();
    form.append('file', file);
    form.append('mapping', JSON.stringify(mapping));

    showToast('Importing data...', 'info');
    fetch('/daily/upload', { method: 'POST', body: form })
      .then(async res => {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) return res.json();
        const text = await res.text();
        throw new Error(text || 'Non-JSON response from server');
      })
      .then(json => {
        if (!json.success) throw new Error(json.message || 'Import failed');
        showToast(`Import sukses: ${json.success} row berhasil, ${json.failed} gagal`, 'success');
        setTimeout(() => location.reload(), 1000);
      })
      .catch(err => {
        console.error(err);
        const msg = (err.message || '').slice(0, 400);
        showToast('Import gagal: ' + msg, 'error');
      });
  }

  // Upload parsed JSON rows (Excel) with mapping
  function performJsonUpload(rows) {
    const mapping = window._csvMapping();
    if (!mapping.wonum) {
      showToast('Wonum field harus di-map', 'error');
      return;
    }

    showToast('Importing data...', 'info');
    fetch('/daily/upload-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, mapping })
    })
      .then(async res => {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) return res.json();
        const text = await res.text();
        throw new Error(text || 'Non-JSON response from server');
      })
      .then(json => {
        if (!json.success) throw new Error(json.message || 'Import failed');
        showToast(`Import selesai: ${json.success ? json.message : ''}`, 'success');
        setTimeout(() => location.reload(), 1000);
      })
      .catch(err => {
        console.error(err);
        const msg = (err.message || '').slice(0, 800);
        showToast('Import gagal: ' + msg, 'error');
      });
  }

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      // trigger download
      window.location.href = '/daily/export';
    });
  }
});
