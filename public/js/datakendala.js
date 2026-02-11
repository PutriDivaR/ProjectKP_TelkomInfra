document.addEventListener('DOMContentLoaded', () => {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const tableTeknikBody = document.getElementById('tableTeknikBody');
  const tableSistemBody = document.getElementById('tableSistemBody');
  const searchTeknik = document.getElementById('searchTeknik');
  const searchSistem = document.getElementById('searchSistem');
  const btnClearTeknik = document.getElementById('btnClearTeknik');
  const btnClearSistem = document.getElementById('btnClearSistem');
  const btnUploadTeknik = document.getElementById('btnUploadTeknik');
  const btnUploadSistem = document.getElementById('btnUploadSistem');
  const uploadFileTeknik = document.getElementById('uploadFileTeknik');
  const uploadFileSistem = document.getElementById('uploadFileSistem');
  const btnExportTeknik = document.getElementById('btnExportTeknik');
  const btnExportSistem = document.getElementById('btnExportSistem');

  function showToast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // ----- Tabs - dengan update URL -----
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById('tab-' + tab);
      if (panel) panel.classList.add('active');
      // Update URL tanpa reload
      const url = new URL(window.location);
      url.searchParams.set('tab', tab);
      window.history.pushState({}, '', url);
    });
  });

  // Set tab aktif dari URL parameter saat load
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get('tab');
  if (tabFromUrl === 'sistem' || tabFromUrl === 'teknik') {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));
    const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabFromUrl}"]`);
    const targetPanel = document.getElementById('tab-' + tabFromUrl);
    if (targetBtn) targetBtn.classList.add('active');
    if (targetPanel) targetPanel.classList.add('active');
  }

  // ----- Search: server-side via form GET -----
  const formSearchTeknik = document.getElementById('formSearchTeknik');
  const formSearchSistem = document.getElementById('formSearchSistem');
  if (formSearchTeknik) {
    formSearchTeknik.addEventListener('submit', () => {
      const lim = document.getElementById('limitSelectTeknik');
      const hid = formSearchTeknik.querySelector('input[name="limit"]');
      if (lim && hid) hid.value = lim.value;
    });
  }
  if (formSearchSistem) {
    formSearchSistem.addEventListener('submit', () => {
      const lim = document.getElementById('limitSelectSistem');
      const hid = formSearchSistem.querySelector('input[name="limit"]');
      if (lim && hid) hid.value = lim.value;
    });
  }
  if (btnClearTeknik && searchTeknik) {
    btnClearTeknik.addEventListener('click', () => {
      searchTeknik.value = '';
      if (formSearchTeknik) {
        const hid = formSearchTeknik.querySelector('input[name="limit"]');
        if (hid) hid.value = document.getElementById('limitSelectTeknik')?.value || 25;
        formSearchTeknik.submit();
      }
    });
  }
  if (btnClearSistem && searchSistem) {
    btnClearSistem.addEventListener('click', () => {
      searchSistem.value = '';
      if (formSearchSistem) {
        const hid = formSearchSistem.querySelector('input[name="limit"]');
        if (hid) hid.value = document.getElementById('limitSelectSistem')?.value || 25;
        formSearchSistem.submit();
      }
    });
  }

  // ----- Limit change: redirect dengan limit & page=1 -----
  const limitSelectTeknik = document.getElementById('limitSelectTeknik');
  const limitSelectSistem = document.getElementById('limitSelectSistem');
  if (limitSelectTeknik) {
    limitSelectTeknik.addEventListener('change', () => {
      const url = new URL(window.location);
      url.searchParams.set('limit', limitSelectTeknik.value);
      url.searchParams.set('page', '1');
      url.searchParams.set('tab', 'teknik');
      window.location.search = url.searchParams.toString();
    });
  }
  if (limitSelectSistem) {
    limitSelectSistem.addEventListener('change', () => {
      const url = new URL(window.location);
      url.searchParams.set('limit', limitSelectSistem.value);
      url.searchParams.set('page', '1');
      url.searchParams.set('tab', 'sistem');
      window.location.search = url.searchParams.toString();
    });
  }

  // ----- Kategori select: update via API (cancel / unsc) -----
  document.querySelectorAll('.kategori-select').forEach(sel => {
    // Set default value ke 'cancel' jika kosong
    if (!sel.value) sel.value = 'cancel';
    sel.addEventListener('change', function() {
      const wonum = this.dataset.wonum;
      const val = this.value;
      if (!wonum || !val) return;
      const selectEl = this;
      fetch('/datakendala/api/kategori/' + wonum, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kategori: val })
      })
        .then(r => r.json())
        .then(j => {
            if (j.success) {
              showToast('Kategori tersimpan', 'success');
              selectEl.value = val;
            } else {
              showToast(j.message || 'Gagal menyimpan kategori', 'error');
            }
        })
        .catch(() => showToast('Gagal menyimpan kategori', 'error'));
    });
  });

  // ----- Column mapping modal (shared) -----
  function showMappingModal(title, csvColumns, previewRows, totalRows, webFields, onConfirm) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';
    const mapping = {};
    const content = document.createElement('div');
    content.style.cssText = 'background: white; border-radius: 8px; padding: 20px; max-width: 700px; max-height: 80vh; overflow-y: auto; box-shadow: 0 2px 10px rgba(0,0,0,0.2);';
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.cssText = 'margin-top: 0; color: #dc2626;';
    content.appendChild(titleEl);
    const info = document.createElement('p');
    info.style.fontSize = '12px'; info.style.color = '#666';
    info.textContent = `File: ${totalRows} rows | Kolom CSV: ${csvColumns.join(', ')}`;
    content.appendChild(info);
    const mapContainer = document.createElement('div');
    mapContainer.style.cssText = 'margin: 15px 0;';
    webFields.forEach(field => {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 10px;';
      const label = document.createElement('label');
      label.textContent = field.label + ':';
      label.style.cssText = 'width: 150px; font-weight: bold; font-size: 13px;';
      row.appendChild(label);
      const select = document.createElement('select');
      select.style.cssText = 'flex: 1; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px;';
      const emptyOpt = document.createElement('option');
      emptyOpt.value = ''; emptyOpt.textContent = '(skip)';
      select.appendChild(emptyOpt);
      csvColumns.forEach(col => {
        const opt = document.createElement('option');
        opt.value = col; opt.textContent = col;
        // Auto-match berdasarkan nama field atau label
        const fieldLower = field.field.toLowerCase();
        const labelLower = field.label.toLowerCase();
        const colLower = col.toLowerCase();
        if (colLower.includes(fieldLower) || fieldLower.includes(colLower) || 
            colLower.includes(labelLower) || labelLower.includes(colLower)) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
      select.addEventListener('change', (e) => {
        if (e.target.value) mapping[field.field] = e.target.value;
        else delete mapping[field.field];
      });
      row.appendChild(select);
      mapContainer.appendChild(row);
      select.dispatchEvent(new Event('change'));
    });
    content.appendChild(mapContainer);
    if (previewRows.length > 0) {
      const previewLabel = document.createElement('p');
      previewLabel.style.cssText = 'font-weight: bold; margin-top: 15px; margin-bottom: 5px;';
      previewLabel.textContent = 'Preview (5 baris pertama):';
      content.appendChild(previewLabel);
      const preview = document.createElement('table');
      preview.style.cssText = 'width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 15px;';
      const thead = document.createElement('thead');
      thead.style.background = '#fff5f5';
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
    buttonRow.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';
    const btnCancel = document.createElement('button');
    btnCancel.textContent = 'Batal';
    btnCancel.style.cssText = 'padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;';
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

  // Mapping fields (kategori tidak di-mapping, dipilih di web: cancel/unsc)
  const webFieldsKendala = [
    { field: 'wonum', label: 'Wonum' },
    { field: 'sto', label: 'Sto' },
    { field: 'ticket_id', label: 'Track id' },
    { field: 'created_at', label: 'date created' },
    { field: 'tgl_manja', label: 'Tgl manja' },
    { field: 'status_kpro', label: 'Status kpro' },
    { field: 'kendala', label: 'Errorcode' },
    { field: 'catatan_teknisi', label: 'Catatan teknisi' },
    { field: 'status_akhir', label: 'Progress akhir' }
  ];

  // ----- Upload handler (shared untuk Teknik & Sistem) -----
  function setupUpload(btnUpload, uploadFile, tabType) {
    if (!btnUpload || !uploadFile) return;
    btnUpload.addEventListener('click', () => uploadFile.click());
    uploadFile.addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      e.target.value = '';
      const name = (f.name || '').toLowerCase();
      const isExcel = name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.xlsm');
      
      if (isExcel) {
        showToast('Parsing Excel...', 'info');
        try {
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
          const json = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
          const columns = json && json.length ? Object.keys(json[0]) : [];
          showMappingModal('Map Kolom - ' + (tabType === 'teknik' ? 'Kendala Teknik' : 'Kendala Sistem'), 
            columns, json.slice(0, 5), json.length, webFieldsKendala, (mapping) => {
            if (!mapping.wonum) { showToast('Kolom Wonum harus di-map', 'error'); return; }
            showToast('Importing...', 'info');
            fetch('/datakendala/upload-json', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ rows: json, mapping })
            })
              .then(r => r.json())
              .then(j => {
                if (!j.success) throw new Error(j.message || 'Import gagal');
                showToast(j.message || 'Import selesai', 'success');
                setTimeout(() => location.reload(), 1000);
              })
              .catch(err => { showToast('Import gagal: ' + (err.message || '').slice(0, 200), 'error'); });
          });
        } catch (err) {
          showToast('Gagal baca Excel: ' + (err.message || ''), 'error');
        }
        return;
      }
      
      // CSV
      const form = new FormData();
      form.append('file', f);
      showToast('Membaca file...', 'info');
      try {
        const res = await fetch('/datakendala/upload-preview', { method: 'POST', body: form });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Gagal baca file');
        showMappingModal('Map Kolom - ' + (tabType === 'teknik' ? 'Kendala Teknik' : 'Kendala Sistem'), 
          json.columns || [], json.preview || [], json.totalRows || 0, webFieldsKendala, (mapping) => {
          if (!mapping.wonum) { showToast('Kolom Wonum harus di-map', 'error'); return; }
          const form2 = new FormData();
          form2.append('file', f);
          form2.append('mapping', JSON.stringify(mapping));
          showToast('Importing...', 'info');
          fetch('/datakendala/upload', { method: 'POST', body: form2 })
            .then(r => r.json())
            .then(j => {
              if (!j.success) throw new Error(j.message || 'Import gagal');
              showToast(j.message || 'Import selesai', 'success');
              setTimeout(() => location.reload(), 1000);
            })
            .catch(err => { showToast('Import gagal: ' + (err.message || '').slice(0, 200), 'error'); });
        });
      } catch (err) {
        showToast('Gagal baca file: ' + (err.message || ''), 'error');
      }
    });
  }

  setupUpload(btnUploadTeknik, uploadFileTeknik, 'teknik');
  setupUpload(btnUploadSistem, uploadFileSistem, 'sistem');

  // ----- Export -----
  if (btnExportTeknik) btnExportTeknik.addEventListener('click', () => { window.location.href = '/datakendala/export'; });
  if (btnExportSistem) btnExportSistem.addEventListener('click', () => { window.location.href = '/datakendala/export'; });
});
