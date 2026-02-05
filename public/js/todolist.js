/* ===================================================
   KENDALA TEKNIK - CLIENT JAVASCRIPT (WITH CHECKBOX SELECT)
   - Import Excel berdasarkan NAMA HEADER (bukan posisi kolom)
   - Fitur checkbox select untuk delete multiple data
   - Delete selected & delete all functionality
   =================================================== */

// ──────────────────────────────────────
// CACHE: master tables & selection state
// ──────────────────────────────────────
let masterActivities = [];
let masterSTO        = [];
let allData          = [];
let currentEditId    = null;
let selectedIds      = new Set(); // Track selected checkboxes

// ──────────────────────────────────────
// INIT
// ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {
  console.log('DOM Ready – Kendala Teknik with Checkbox Select');
  await loadMasterTables();
  await loadTableData();
});

// ──────────────────────────────────────
// 1. LOAD MASTER TABLES
// ──────────────────────────────────────
async function loadMasterTables() {
  try {
    const resAct = await fetch('/api/master-activity');
    const dataAct = await resAct.json();
    if (dataAct.success) masterActivities = dataAct.data;

    const resSto = await fetch('/api/wilayah-ridar');
    const dataSto = await resSto.json();
    if (dataSto.success) masterSTO = dataSto.data;

    console.log('✅ Master loaded – Activities:', masterActivities.length, '| STO:', masterSTO.length);
  } catch (err) {
    console.error('❌ Gagal load master tables:', err);
  }
}

// ──────────────────────────────────────
// 2. LOAD MAIN TABLE DATA
// ──────────────────────────────────────
async function loadTableData() {
  try {
    const res  = await fetch('/api/todolist');
    const json = await res.json();
    if (json.success) {
      allData = json.data;
      renderTable(allData);
      updateSummaryCards(allData);
    } else {
      showError('Gagal memuat data: ' + (json.message || ''));
    }
  } catch (err) {
    console.error('❌ Error load data:', err);
    showError('Terjadi kesalahan saat memuat data: ' + err.message);
  }
}

// ──────────────────────────────────────
// 3. RENDER TABLE (WITH CHECKBOX)
// ──────────────────────────────────────
function renderTable(data) {
  const tbody = document.getElementById('dataTable');
  if (!tbody) return;

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="10" class="loading-cell">
        Tidak ada data. Silakan import file Excel atau tambah data secara manual.
      </td></tr>`;
    // Reset selection
    selectedIds.clear();
    updateDeleteButton();
    const selectAll = document.getElementById('selectAll');
    if (selectAll) selectAll.checked = false;
    return;
  }

  tbody.innerHTML = '';
  data.forEach((row, i) => {
    const tr = document.createElement('tr');
    const isChecked = selectedIds.has(row.id) ? 'checked' : '';
    tr.innerHTML = `
      <td class="col-checkbox">
        <input type="checkbox" class="row-checkbox" data-id="${row.id}" 
               onchange="toggleRowCheckbox(this)" ${isChecked}>
      </td>
      <td>${i + 1}</td>
      <td>${esc(row.wonum)}</td>
      <td>${esc(row.odp_inputan)}</td>
      <td>${esc(row.activity_teknisi)}</td>
      <td class="td-activity">${esc(row.activity)}</td>
      <td>${esc(row.sto_inputan)}</td>
      <td>${esc(row.update_status_deen)}</td>
      <td>${statusBadge(row.status_todolist)}</td>
      <td><button class="btn-detail" onclick="openDetail(${row.id})">Detail</button></td>
    `;
    tbody.appendChild(tr);
  });

  // Update delete button & select all checkbox state
  updateDeleteButton();
  updateSelectAllCheckbox();
}

// ──────────────────────────────────────
// 4. CHECKBOX SELECTION FUNCTIONS
// ──────────────────────────────────────

// Toggle select all checkbox
function toggleSelectAll(checkbox) {
  const checkboxes = document.querySelectorAll('.row-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = checkbox.checked;
    const id = parseInt(cb.dataset.id);
    if (checkbox.checked) {
      selectedIds.add(id);
    } else {
      selectedIds.delete(id);
    }
  });
  updateDeleteButton();
}

// Toggle individual checkbox
function toggleRowCheckbox(checkbox) {
  const id = parseInt(checkbox.dataset.id);
  if (checkbox.checked) {
    selectedIds.add(id);
  } else {
    selectedIds.delete(id);
  }
  
  updateSelectAllCheckbox();
  updateDeleteButton();
}

// Update select all checkbox state
function updateSelectAllCheckbox() {
  const selectAll = document.getElementById('selectAll');
  if (!selectAll) return;
  
  const allCheckboxes = document.querySelectorAll('.row-checkbox');
  const checkedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
  
  if (allCheckboxes.length === 0) {
    selectAll.checked = false;
    selectAll.indeterminate = false;
  } else if (checkedCheckboxes.length === 0) {
    selectAll.checked = false;
    selectAll.indeterminate = false;
  } else if (checkedCheckboxes.length === allCheckboxes.length) {
    selectAll.checked = true;
    selectAll.indeterminate = false;
  } else {
    selectAll.checked = false;
    selectAll.indeterminate = true;
  }
}

// Update delete button state
function updateDeleteButton() {
  const btnDeleteSelected = document.getElementById('btnDeleteSelected');
  if (btnDeleteSelected) {
    btnDeleteSelected.disabled = selectedIds.size === 0;
    if (selectedIds.size > 0) {
      btnDeleteSelected.textContent = `🗑️ Hapus Terpilih (${selectedIds.size})`;
    } else {
      btnDeleteSelected.textContent = '🗑️ Hapus Terpilih';
    }
  }
}

// ──────────────────────────────────────
// 5. DELETE FUNCTIONS
// ──────────────────────────────────────

// Delete selected rows
async function deleteSelected() {
  if (selectedIds.size === 0) {
    alert('Tidak ada data yang dipilih');
    return;
  }

  const confirmed = confirm(
    `⚠️ PERINGATAN!\n\n` +
    `Apakah Anda yakin ingin menghapus ${selectedIds.size} data terpilih?\n` +
    `Tindakan ini tidak dapat dibatalkan!`
  );
  
  if (!confirmed) return;

  try {
    const res = await fetch('/api/todolist/delete-selected', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selectedIds) })
    });
    
    const json = await res.json();
    
    if (json.success) {
      alert(`✅ Berhasil menghapus ${json.deletedCount} data`);
      selectedIds.clear();
      const selectAll = document.getElementById('selectAll');
      if (selectAll) selectAll.checked = false;
      await loadTableData();
    } else {
      alert('❌ Gagal menghapus data: ' + (json.message || 'Unknown error'));
    }
  } catch (err) {
    console.error('❌ Error deleting selected:', err);
    alert('Kesalahan saat menghapus data: ' + err.message);
  }
}

// Delete all rows
// Delete all rows
async function deleteAll() {
  console.log('🔍 deleteAll() called');
  
  const confirmed = confirm(
    '⚠️ PERINGATAN BESAR!\n\n' +
    'Apakah Anda yakin ingin menghapus SEMUA data?\n' +
    'Tindakan ini tidak dapat dibatalkan!'
  );
  
  if (!confirmed) {
    console.log('❌ User cancelled first confirmation');
    return;
  }

  // Double confirmation
  const doubleConfirm = confirm(
    '⚠️ KONFIRMASI TERAKHIR\n\n' +
    'Apakah Anda BENAR-BENAR yakin ingin menghapus SEMUA data?\n' +
    'Ketik OK di browser jika Anda yakin.'
  );
  
  if (!doubleConfirm) {
    console.log('❌ User cancelled second confirmation');
    return;
  }

  console.log('📤 Sending DELETE request to /api/todolist/delete-all');

  try {
    const res = await fetch('/api/todolist/delete-all', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('📥 Response status:', res.status);
    
    const json = await res.json();
    console.log('📥 Response data:', json);
    
    if (json.success) {
      alert(`✅ Berhasil menghapus semua data (${json.deletedCount} baris)`);
      selectedIds.clear();
      const selectAll = document.getElementById('selectAll');
      if (selectAll) selectAll.checked = false;
      await loadTableData();
    } else {
      alert('❌ Gagal menghapus data: ' + (json.message || 'Unknown error'));
      console.error('Delete failed:', json);
    }
  } catch (err) {
    console.error('❌ Error deleting all:', err);
    alert('Kesalahan saat menghapus data: ' + err.message);
  }
}

// ──────────────────────────────────────
// 6. STATUS BADGE HELPER
// ──────────────────────────────────────
function statusBadge(status) {
  const classMap = {
    'COMPLETED':    'status-completed',
    'OGP':          'status-ogp',
    'OPEN':         'status-open',
    'PINDAH LOKER': 'status-pindah'
  };
  const cls = classMap[status] || 'status-default';
  return `<span class="status-badge ${cls}">${esc(status || '-')}</span>`;
}

// ──────────────────────────────────────
// 7. UPDATE SUMMARY CARDS
// ──────────────────────────────────────
function updateSummaryCards(data) {
  let done = 0, ogp = 0, pindah = 0, closed = 0;
  (data || []).forEach(r => {
    const s = (r.status_todolist || '').toUpperCase();
    if (s === 'COMPLETED') done++;
    else if (s === 'OGP')  ogp++;
    else if (s === 'PINDAH LOKER') pindah++;
    else if (s === 'OPEN') closed++;
  });
  setVal('countDone',   done);
  setVal('countOGP',    ogp);
  setVal('countPindah', pindah);
  setVal('countClosed', closed);
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ──────────────────────────────────────
// 8. FILTER BY STATUS
// ──────────────────────────────────────
// ──────────────────────────────────────
// 8. FILTER BY STATUS (UPDATED)
// ──────────────────────────────────────
function applyFilter() {
  const status = document.getElementById('filterStatus').value;
  const searchTerm = document.getElementById('searchWonum').value.trim().toLowerCase();
  
  let filtered = allData;
  
  // Apply status filter
  if (status) {
    filtered = filtered.filter(r => 
      (r.status_todolist || '').toUpperCase() === status
    );
  }
  
  // Apply search filter
  if (searchTerm) {
    filtered = filtered.filter(r => {
      const wonum = (r.wonum || '').toLowerCase();
      return wonum.includes(searchTerm);
    });
  }
  
  renderTable(filtered);
}

// ──────────────────────────────────────
// 9. OPEN DETAIL MODAL
// ──────────────────────────────────────
function openDetail(id) {
  const row = allData.find(r => r.id === id);
  if (!row) { alert('Data tidak ditemukan'); return; }

  currentEditId = id;

  // Populate read-only fields
  setInput('editId',           row.id);
  setInput('wonum',            row.wonum);
  setInput('odpInputan',       row.odp_inputan);
  setInput('activityTeknisi',  row.activity_teknisi);
  setInput('stoInput',         row.sto_inputan);
  setInput('uicField',         row.uic);
  setInput('picField',         row.pic);
  setInput('leaderField',      row.leader);
  setInput('updateStatusDeen', row.update_status_deen);
  setInput('targetField',      row.target);
  setInput('statusField',      row.status_todolist);
  setInput('progressField',    row.progress);
  setInput('solusiProgress',   row.solusi_progress);
  setInput('monthDate',        row.month_date);
  setInput('scOrder',          row.sc_order);

  // Populate dropdowns
  populateActivityDropdown(row.activity_id);
  populateStoDropdown(row.sto);

  // Show modal
  document.getElementById('modalOverlay').classList.add('active');
}

// ──────────────────────────────────────
// 10. POPULATE ACTIVITY DROPDOWN
// ──────────────────────────────────────
function populateActivityDropdown(selectedId) {
  const sel = document.getElementById('activitySelect');
  sel.innerHTML = '<option value="">-- Pilih Activity --</option>';
  masterActivities.forEach(act => {
    const chosen = (act.id == selectedId) ? 'selected' : '';
    sel.innerHTML += `<option value="${act.id}" ${chosen}>${esc(act.activity_name)}</option>`;
  });
}

// ──────────────────────────────────────
// 11. POPULATE STO DROPDOWN
// ──────────────────────────────────────
function populateStoDropdown(selectedSto) {
  const sel = document.getElementById('stoSelect');
  sel.innerHTML = '<option value="">-- Pilih STO --</option>';
  masterSTO.forEach(s => {
    const chosen = (s.sto == selectedSto) ? 'selected' : '';
    sel.innerHTML += `<option value="${esc(s.sto)}" ${chosen}>${esc(s.sto)}</option>`;
  });
}

// ──────────────────────────────────────
// 12. ACTIVITY CHANGE → AUTO-FILL
// ──────────────────────────────────────
function onActivityChange() {
  const actId = document.getElementById('activitySelect').value;
  const act   = masterActivities.find(a => a.id == actId);

  if (act) {
    setInput('statusField',    act.status_default   || '');
    setInput('progressField',  act.progress_default || '');
    setInput('solusiProgress', act.solusi_default   || '');
  } else {
    setInput('statusField',    '');
    setInput('progressField',  '');
    setInput('solusiProgress', '');
  }
}

// ──────────────────────────────────────
// 13. STO CHANGE → AUTO-FILL
// ──────────────────────────────────────
function onStoChange() {
  const stoVal = document.getElementById('stoSelect').value;
  const sto    = masterSTO.find(s => s.sto === stoVal);

  if (sto) {
    setInput('uicField',    sto.uic    || '');
    setInput('picField',    sto.pic    || '');
    setInput('leaderField', sto.leader || '');
  } else {
    setInput('uicField',    '');
    setInput('picField',    '');
    setInput('leaderField', '');
  }
}

// ──────────────────────────────────────
// 14. SAVE DETAIL
// ──────────────────────────────────────
async function saveDetail() {
  const id = document.getElementById('editId').value;
  if (!id) return;

  const activityId = document.getElementById('activitySelect').value;
  const stoVal     = document.getElementById('stoSelect').value;

  if (!activityId) { alert('Activity wajib dipilih!'); return; }
  if (!stoVal)     { alert('STO wajib dipilih!');      return; }

  const payload = {
    activity_id:         activityId,
    sto:                 stoVal,
    uic:                 getVal('uicField'),
    pic:                 getVal('picField'),
    leader:              getVal('leaderField'),
    status_todolist:     getVal('statusField'),
    solusi_progress:     getVal('solusiProgress')
  };

  try {
    const res = await fetch(`/api/todolist/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    const json = await res.json();

    if (json.success) {
      alert('Data berhasil disimpan!');
      closeModal();
      await loadTableData();
    } else {
      alert(json.message || 'Gagal menyimpan');
    }
  } catch (err) {
    alert('Kesalahan saat menyimpan: ' + err.message);
  }
}

// ──────────────────────────────────────
// 15. CLOSE MODAL
// ──────────────────────────────────────
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  currentEditId = null;
}

function closeModalOnOverlay(e) {
  if (e.target === e.currentTarget) closeModal();
}

// ──────────────────────────────────────
// 16. EXCEL IMPORT - HEADER-BASED
// ──────────────────────────────────────
function triggerUpload() {
  document.getElementById('excelFileInput').click();
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Check SheetJS library
  if (typeof XLSX === 'undefined') {
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
      console.log('✅ SheetJS library loaded');
    } catch (err) {
      console.error('❌ Failed to load SheetJS:', err);
      alert('Gagal memuat library Excel. Silakan refresh halaman dan coba lagi.');
      event.target.value = '';
      return;
    }
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook    = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName   = workbook.SheetNames[0];
    const sheet       = workbook.Sheets[sheetName];
    
    // Read as JSON with headers
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    console.log('📊 Excel data (first row):', jsonData[0]);
    console.log('📊 Total rows:', jsonData.length);

    if (jsonData.length === 0) {
      alert('File kosong atau tidak ada data.');
      event.target.value = '';
      return;
    }

    // Map based on header names
    const payload = jsonData.map(row => {
      // Normalize header names
      const normalizedRow = {};
      Object.keys(row).forEach(key => {
        const normalizedKey = key.trim().toUpperCase().replace(/\s+/g, ' ');
        normalizedRow[normalizedKey] = row[key];
      });

      // Extract data
      const wonum = normalizedRow['WO / SC ID'] 
                 || normalizedRow['WONUM']
                 || normalizedRow['WO']
                 || normalizedRow['SC ID']
                 || '';

      const odp_inputan = normalizedRow['ODP INPUTAN']
                       || normalizedRow['ODP']
                       || '';

      const activity_teknisi = normalizedRow['KENDALA PT 1']
                            || normalizedRow['KENDALA PT1']
                            || normalizedRow['KENDALA']
                            || '';

      const month_date = normalizedRow['BULAN']
                      || normalizedRow['TANGGAL']
                      || normalizedRow['MONTH DATE']
                      || '';

      const sto_inputan = normalizedRow['STO INPUT']
                       || normalizedRow['STOINPUT']
                       || normalizedRow['STO_INPUT']
                       || normalizedRow['STO']
                       || normalizedRow['STO INPUTAN']
                       || normalizedRow['STOINPUTAN']
                       || '';

      return {
        wonum,
        odp_inputan,
        activity_teknisi,
        month_date,
        sto_inputan
      };
    }).filter(r => r.wonum || r.activity_teknisi);

    if (payload.length === 0) {
      alert('Tidak ada data valid di file. Pastikan header kolom sesuai:\n• WO / SC ID\n• ODP INPUTAN\n• KENDALA PT 1\n• BULAN\n• STO INPUT');
      event.target.value = '';
      return;
    }

    console.log('📤 Sending import data:', payload.length, 'rows');

    // Send to backend
    const res = await fetch('/api/todolist/import', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rows: payload })
    });
    const json = await res.json();

    if (json.success) {
      alert(`✅ Import berhasil!\n\n` +
            `• ${json.count || payload.length} baris ditambahkan\n` +
            `• ${json.insertedToMasterWo || 0} wonum baru di master_wo\n` +
            `• ${json.updatedMasterWo || 0} wonum di-update\n` +
            `• Durasi: ${json.duration || 'N/A'}`);
      await loadTableData();
    } else {
      alert('❌ Import gagal: ' + (json.message || 'Unknown error'));
    }
  } catch (err) {
    console.error('❌ Error during import:', err);
    alert('Kesalahan saat import: ' + err.message);
  }

  event.target.value = '';
}

// ──────────────────────────────────────
// 17. EXPORT EXCEL
// ──────────────────────────────────────
async function exportExcel() {
  if (typeof XLSX === 'undefined') {
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
      console.log('✅ SheetJS library loaded for export');
    } catch (err) {
      console.error('❌ Failed to load SheetJS:', err);
      alert('Gagal memuat library Excel. Silakan refresh halaman dan coba lagi.');
      return;
    }
  }

  const headers = [
    'No', 'WO / SC ID', 'ODP Inputan', 'Kendala PT 1', 'Activity',
    'STO Input', 'Update Status Deen', 'Status', 'Progress', 'Solusi Progress',
    'STO', 'UIC', 'PIC', 'Leader', 'Bulan', 'SC Order'
  ];

  const rows = allData.map((r, i) => [
    i + 1,
    r.wonum, r.odp_inputan, r.activity_teknisi, r.activity,
    r.sto_inputan, r.update_status_deen, r.status_todolist, r.progress, r.solusi_progress,
    r.sto, r.uic, r.pic, r.leader, r.month_date, r.sc_order
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Kendala Teknik');
  XLSX.writeFile(wb, 'Kendala_Teknik_Export.xlsx');
}

// ──────────────────────────────────────
// UTILS
// ──────────────────────────────────────
function esc(txt) {
  if (txt == null) return '-';
  const d = document.createElement('div');
  d.textContent = String(txt);
  return d.innerHTML;
}

function setInput(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = (val != null) ? val : '';
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function showError(msg) {
  const tbody = document.getElementById('dataTable');
  if (tbody) {
    tbody.innerHTML = `
      <tr><td colspan="10" class="loading-cell" style="color:#e53935;">
        ⚠️ ${esc(msg)}<br><br>
        <small style="color:#999;">Pastikan server backend dan database sudah berjalan.</small>
      </td></tr>`;
  }
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url;
    s.onload = () => {
      console.log('✅ Script loaded:', url);
      resolve();
    };
    s.onerror = (err) => {
      console.error('❌ Script failed to load:', url, err);
      reject(new Error(`Failed to load script: ${url}`));
    };
    document.head.appendChild(s);
  });
}

// ESC key → close modal
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    const m1 = document.getElementById('modalOverlay');
    if (m1 && m1.classList.contains('active')) { closeModal(); }
  }
});


// ──────────────────────────────────────
// SEARCH FUNCTIONALITY
// ──────────────────────────────────────
function handleSearch() {
  const searchTerm = document.getElementById('searchWonum').value.trim().toLowerCase();
  const btnClear = document.getElementById('btnClearSearch');
  
  // Show/hide clear button
  btnClear.style.display = searchTerm ? 'block' : 'none';
  
  // Get current filter
  const filterStatus = document.getElementById('filterStatus').value;
  
  // Apply both search and filter
  let filtered = allData;
  
  // Apply status filter first
  if (filterStatus) {
    filtered = filtered.filter(r => 
      (r.status_todolist || '').toUpperCase() === filterStatus
    );
  }
  
  // Apply search filter
  if (searchTerm) {
    filtered = filtered.filter(r => {
      const wonum = (r.wonum || '').toLowerCase();
      return wonum.includes(searchTerm);
    });
  }
  
  renderTable(filtered);
}

function clearSearch() {
  document.getElementById('searchWonum').value = '';
  document.getElementById('btnClearSearch').style.display = 'none';
  applyFilter(); // Re-apply only status filter
}

