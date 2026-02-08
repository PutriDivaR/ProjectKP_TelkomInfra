/* ===================================================
   KENDALA TEKNIK - CLIENT JAVASCRIPT (IMPROVED)
   Fixed: Label "DONE" → "COMPLETE"
   =================================================== */

// ──────────────────────────────────────
// CACHE: master tables & selection state
// ──────────────────────────────────────
let masterActivities = [];
let masterSTO        = [];
let allData          = [];
let filteredData     = [];
let currentEditId    = null;
let selectedIds      = new Set();

// Pagination state
let currentPage      = 1;
let rowsPerPage      = 100;
let totalPages       = 1;

// ──────────────────────────────────────
// INIT
// ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {
  console.log('DOM Ready – Kendala Teknik');
  await loadMasterTables();
  await loadTableData();
});

// ──────────────────────────────────────
// LOAD MASTER TABLES
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
// LOAD MAIN TABLE DATA
// ──────────────────────────────────────
async function loadTableData() {
  try {
    const res  = await fetch('/api/todolist');
    const json = await res.json();
    if (json.success) {
      allData = json.data;
      filteredData = json.data;
      currentPage = 1;
      renderTable(filteredData);
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
// RENDER TABLE WITH PAGINATION
// ──────────────────────────────────────
function renderTable(data) {
  const tbody = document.getElementById('dataTable');
  if (!tbody) return;

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="8" class="loading-cell">
        Tidak ada data. Silakan import file Excel atau tambah data secara manual.
      </td></tr>`;
    selectedIds.clear();
    updateDeleteButton();
    updatePagination(0);
    const selectAll = document.getElementById('selectAll');
    if (selectAll) selectAll.checked = false;
    return;
  }

  // Calculate pagination
  totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, data.length);
  const pageData = data.slice(startIndex, endIndex);

  tbody.innerHTML = '';
  pageData.forEach((row, i) => {
    const tr = document.createElement('tr');
    const isChecked = selectedIds.has(row.id) ? 'checked' : '';
    const globalIndex = startIndex + i + 1;
    
    tr.innerHTML = `
      <td class="col-select">
        <input type="checkbox" class="row-checkbox" data-id="${row.id}" 
               onchange="toggleRowCheckbox(this)" ${isChecked}>
      </td>
      <td>${globalIndex}</td>
      <td>${esc(row.wonum)}</td>
      <td>${esc(row.odp_inputan)}</td>
      <td class="td-activity">${esc(row.activity)}</td>
      <td>${esc(row.update_status_deen)}</td>
      <td>${statusBadge(row.status_todolist)}</td>
      <td><button class="btn-detail" onclick="openDetail(${row.id})">DETAIL</button></td>
    `;
    tbody.appendChild(tr);
  });

  updateDeleteButton();
  updateSelectAllCheckbox();
  updatePagination(data.length);
}

// ──────────────────────────────────────
// CHECKBOX FUNCTIONS
// ──────────────────────────────────────
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
// DELETE FUNCTIONS
// ──────────────────────────────────────
async function deleteSelected() {
  if (selectedIds.size === 0) {
    alert('Tidak ada data yang dipilih');
    return;
  }

  const confirmed = confirm(
    `⚠️ PERINGATAN!\n\nApakah Anda yakin ingin menghapus ${selectedIds.size} data terpilih?\nTindakan ini tidak dapat dibatalkan!`
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

async function deleteAll() {
  const confirmed = confirm(
    '⚠️ PERINGATAN BESAR!\n\nApakah Anda yakin ingin menghapus SEMUA data?\nTindakan ini tidak dapat dibatalkan!'
  );
  
  if (!confirmed) return;

  const doubleConfirm = confirm(
    '⚠️ KONFIRMASI TERAKHIR\n\nApakah Anda BENAR-BENAR yakin ingin menghapus SEMUA data?'
  );
  
  if (!doubleConfirm) return;

  try {
    const res = await fetch('/api/todolist/delete-all', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const json = await res.json();
    
    if (json.success) {
      alert(`✅ Berhasil menghapus semua data (${json.deletedCount} baris)`);
      selectedIds.clear();
      const selectAll = document.getElementById('selectAll');
      if (selectAll) selectAll.checked = false;
      await loadTableData();
    } else {
      alert('❌ Gagal menghapus data: ' + (json.message || 'Unknown error'));
    }
  } catch (err) {
    console.error('❌ Error deleting all:', err);
    alert('Kesalahan saat menghapus data: ' + err.message);
  }
}

// ──────────────────────────────────────
// STATUS BADGE
// ──────────────────────────────────────
function statusBadge(status) {
  const statusUpper = (status || '').toUpperCase();
  const classMap = {
    'COMPLETE':     'status-completed',
    'COMPLETED':    'status-completed',
    'OGP':          'status-ogp',
    'OPEN':         'status-open',
    'PINDAH LOKER': 'status-pindah'
  };
  const cls = classMap[statusUpper] || 'status-default';
  return `<span class="status-badge ${cls}">${esc(status || '-')}</span>`;
}

// ──────────────────────────────────────
// UPDATE SUMMARY CARDS
// ✅ CHANGED: countDone → countComplete
// ──────────────────────────────────────
function updateSummaryCards(data) {
  let completed = 0, ogp = 0, pindahLoker = 0, open = 0;
  (data || []).forEach(r => {
    const s = (r.status_todolist || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'COMPLETE') completed++;
    else if (s === 'OGP')  ogp++;
    else if (s === 'PINDAH LOKER') pindahLoker++;
    else if (s === 'OPEN') open++;
  });
  setVal('countComplete', completed);  // ✅ CHANGED: was countDone
  setVal('countOGP',      ogp);
  setVal('countPindah',   pindahLoker);
  setVal('countClosed',   open);
}

// ──────────────────────────────────────
// FILTER & SEARCH
// ──────────────────────────────────────
function applyFilter() {
  const status = document.getElementById('filterStatus').value;
  const searchTerm = document.getElementById('searchWonum').value.trim().toLowerCase();
  
  let filtered = allData;
  
  if (status) {
    filtered = filtered.filter(r => 
      (r.status_todolist || '').toUpperCase() === status
    );
  }
  
  if (searchTerm) {
    filtered = filtered.filter(r => {
      const wonum = (r.wonum || '').toLowerCase();
      return wonum.includes(searchTerm);
    });
  }
  
  filteredData = filtered;
  currentPage = 1;
  renderTable(filtered);
}

function handleSearch() {
  const searchTerm = document.getElementById('searchWonum').value.trim().toLowerCase();
  const btnClear = document.getElementById('btnClearSearch');
  
  btnClear.style.display = searchTerm ? 'block' : 'none';
  
  const filterStatus = document.getElementById('filterStatus').value;
  
  let filtered = allData;
  
  if (filterStatus) {
    filtered = filtered.filter(r => 
      (r.status_todolist || '').toUpperCase() === filterStatus
    );
  }
  
  if (searchTerm) {
    filtered = filtered.filter(r => {
      const wonum = (r.wonum || '').toLowerCase();
      return wonum.includes(searchTerm);
    });
  }
  
  filteredData = filtered;
  currentPage = 1;
  renderTable(filtered);
}

function clearSearch() {
  document.getElementById('searchWonum').value = '';
  document.getElementById('btnClearSearch').style.display = 'none';
  applyFilter();
}

// ──────────────────────────────────────
// PAGINATION FUNCTIONS
// ──────────────────────────────────────
function updatePagination(totalRows) {
  const paginationContainer = document.getElementById('paginationContainer');
  if (!paginationContainer) return;

  if (totalRows === 0) {
    paginationContainer.innerHTML = '';
    return;
  }

  totalPages = Math.ceil(totalRows / rowsPerPage);
  
  const startRow = (currentPage - 1) * rowsPerPage + 1;
  const endRow = Math.min(currentPage * rowsPerPage, totalRows);
  
  let html = '<div class="pagination">';
  
  // Info text
  html += `<div class="pagination-info">Halaman ${currentPage} dari ${totalPages} (Total: ${totalRows} data)</div>`;
  
  html += '<div class="pagination-buttons">';
  
  // First page button
  html += `<button class="pagination-btn" onclick="goToPage(1)" ${currentPage === 1 ? 'disabled' : ''}>
    « Awal
  </button>`;
  
  // Previous button
  html += `<button class="pagination-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
    ‹ Sebelumnya
  </button>`;
  
  // Page numbers
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const activeClass = i === currentPage ? 'active' : '';
    html += `<button class="pagination-btn page-number ${activeClass}" onclick="goToPage(${i})">${i}</button>`;
  }
  
  // Next button
  html += `<button class="pagination-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
    Selanjutnya ›
  </button>`;
  
  // Last page button
  html += `<button class="pagination-btn" onclick="goToPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
    Akhir »
  </button>`;
  
  html += '</div>';
  
  // Rows per page selector
  html += `<div class="pagination-rows">
    <label>Tampilkan:</label>
    <select onchange="changeRowsPerPage(this.value)" class="rows-per-page-select">
      <option value="50" ${rowsPerPage === 50 ? 'selected' : ''}>50</option>
      <option value="100" ${rowsPerPage === 100 ? 'selected' : ''}>100</option>
      <option value="200" ${rowsPerPage === 200 ? 'selected' : ''}>200</option>
      <option value="500" ${rowsPerPage === 500 ? 'selected' : ''}>500</option>
    </select>
  </div>`;
  
  html += '</div>';
  
  paginationContainer.innerHTML = html;
}

function goToPage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderTable(filteredData);
  
  // Scroll to top of table
  const tableCard = document.querySelector('.card');
  if (tableCard) {
    tableCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function changeRowsPerPage(newRowsPerPage) {
  rowsPerPage = parseInt(newRowsPerPage);
  currentPage = 1;
  renderTable(filteredData);
}

// ──────────────────────────────────────
// MODAL FUNCTIONS
// ──────────────────────────────────────
function openDetail(id) {
  const row = allData.find(r => r.id === id);
  if (!row) { alert('Data tidak ditemukan'); return; }

  currentEditId = id;

  setInput('editId',           row.id);
  setInput('wonum',            row.wonum);
  setInput('odpInputan',       row.odp_inputan);
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

  populateActivityDropdown(row.activity_id);
  populateStoDropdown(row.sto);

  document.getElementById('modalOverlay').classList.add('active');
}

function populateActivityDropdown(selectedId) {
  const sel = document.getElementById('activitySelect');
  sel.innerHTML = '<option value="">-- Pilih Activity --</option>';
  masterActivities.forEach(act => {
    const chosen = (act.id == selectedId) ? 'selected' : '';
    sel.innerHTML += `<option value="${act.id}" ${chosen}>${esc(act.activity_name)}</option>`;
  });
}

function populateStoDropdown(selectedSto) {
  const sel = document.getElementById('stoSelect');
  sel.innerHTML = '<option value="">-- Pilih STO --</option>';
  masterSTO.forEach(s => {
    const chosen = (s.sto == selectedSto) ? 'selected' : '';
    sel.innerHTML += `<option value="${esc(s.sto)}" ${chosen}>${esc(s.sto)}</option>`;
  });
}

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

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  currentEditId = null;
}

function closeModalOnOverlay(e) {
  if (e.target === e.currentTarget) closeModal();
}

// ──────────────────────────────────────
// LOADING OVERLAY
// ──────────────────────────────────────
function showLoading(text = 'Memproses data...', subtext = 'Mohon tunggu, jangan tutup halaman') {
  const overlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  const loadingSubtext = document.getElementById('loadingSubtext');
  const loadingProgress = document.getElementById('loadingProgress');
  
  if (loadingText) loadingText.textContent = text;
  if (loadingSubtext) loadingSubtext.textContent = subtext;
  if (loadingProgress) loadingProgress.textContent = '';
  
  if (overlay) overlay.classList.add('active');
}

function updateLoadingProgress(progress) {
  const loadingProgress = document.getElementById('loadingProgress');
  if (loadingProgress) loadingProgress.textContent = progress;
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.remove('active');
}

// ──────────────────────────────────────
// EXCEL IMPORT/EXPORT
// ──────────────────────────────────────
function triggerUpload() {
  document.getElementById('excelFileInput').click();
}

// Convert Excel serial date to month name
function convertExcelDateToMonth(value) {
  if (!value) return '';
  
  if (typeof value === 'string') {
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                        'july', 'august', 'september', 'october', 'november', 'december'];
    const lowerValue = value.toLowerCase().trim();
    
    if (monthNames.some(m => lowerValue.includes(m))) {
      return value;
    }
  }
  
  if (typeof value === 'number') {
    try {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + value * 86400000);
      
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
      
      return monthNames[date.getMonth()];
    } catch (err) {
      console.warn('⚠️ Failed to convert Excel date:', value, err);
      return String(value);
    }
  }
  
  return String(value);
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (typeof XLSX === 'undefined') {
    try {
      showLoading('Memuat library Excel...', 'Mohon tunggu sebentar');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
      hideLoading();
    } catch (err) {
      hideLoading();
      alert('Gagal memuat library Excel. Silakan refresh halaman dan coba lagi.');
      event.target.value = '';
      return;
    }
  }

  try {
    showLoading('Membaca file Excel...', 'Sedang memproses file');
    
    const arrayBuffer = await file.arrayBuffer();
    const workbook    = XLSX.read(arrayBuffer, { type: 'array', cellDates: false });
    const sheetName   = workbook.SheetNames[0];
    const sheet       = workbook.Sheets[sheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: true });

    if (jsonData.length === 0) {
      hideLoading();
      alert('File kosong atau tidak ada data.');
      event.target.value = '';
      return;
    }

    updateLoadingProgress(`Memproses ${jsonData.length} baris...`);

    const payload = jsonData.map(row => {
      const normalizedRow = {};
      Object.keys(row).forEach(key => {
        const normalizedKey = key.trim().toUpperCase().replace(/\s+/g, ' ');
        normalizedRow[normalizedKey] = row[key];
      });

      if (jsonData.indexOf(row) < 3) {
        console.log(`\n📋 Row ${jsonData.indexOf(row) + 1} - Available headers:`, Object.keys(normalizedRow));
        console.log('   Raw row data:', row);
      }

      const bulanRaw = normalizedRow['BULAN'] || normalizedRow['MONTH'] || '';
      const bulanConverted = convertExcelDateToMonth(bulanRaw);

      const activityTeknisi = 
        normalizedRow['KATEGORI SOLUSI'] ||
        normalizedRow['KENDALA PT 1'] || 
        normalizedRow['KENDALA PT1'] ||
        normalizedRow['KENDALA'] || 
        '';

      if (jsonData.indexOf(row) < 3) {
        console.log('   🔍 KATEGORI SOLUSI value:', normalizedRow['KATEGORI SOLUSI']);
        console.log('   🔍 Final activity_teknisi:', activityTeknisi);
        console.log('   📅 BULAN:', bulanRaw, '→', bulanConverted);
      }

      const result = {
        wonum: normalizedRow['WO / SC ID'] || normalizedRow['WONUM'] || normalizedRow['WO'] || normalizedRow['WO / SC'] || '',
        odp_inputan: normalizedRow['ODP INPUTAN'] || normalizedRow['ODP'] || '',
        activity_teknisi: activityTeknisi,
        month_date: bulanConverted,
        sto: normalizedRow['STO'] || ''
      };

      if (jsonData.indexOf(row) < 3) {
        console.log('   ✅ Final payload:', result);
        console.log('---');
      }

      return result;
    }).filter(r => r.wonum || r.activity_teknisi);

    if (payload.length === 0) {
      hideLoading();
      alert('Tidak ada data valid di file.');
      event.target.value = '';
      return;
    }

    console.log('\n📤 Sample payload being sent to backend (first 3):');
    console.log(payload.slice(0, 3));

    updateLoadingProgress(`Mengirim ${payload.length} baris ke server...`);

    const res = await fetch('/api/todolist/import', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rows: payload })
    });
    const json = await res.json();

    hideLoading();

    if (json.success) {
      alert(`✅ Import berhasil!\n\n• ${json.count} baris ditambahkan\n• Durasi: ${json.duration}`);
      await loadTableData();
    } else {
      alert('❌ Import gagal: ' + (json.message || 'Unknown error'));
    }
  } catch (err) {
    hideLoading();
    alert('Kesalahan saat import: ' + err.message);
  }

  event.target.value = '';
}

async function exportExcel() {
  if (typeof XLSX === 'undefined') {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
  }

  const headers = [
    'No', 'WO / SC ID', 'ODP Inputan', 'Activity',
    'Update Status', 'Status', 'Bulan'
  ];

  const rows = allData.map((r, i) => [
    i + 1, r.wonum, r.odp_inputan, r.activity,
    r.update_status_deen, r.status_todolist, r.month_date
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

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function showError(msg) {
  const tbody = document.getElementById('dataTable');
  if (tbody) {
    tbody.innerHTML = `
      <tr><td colspan="8" class="loading-cell" style="color:#e53935;">
        ⚠️ ${esc(msg)}
      </td></tr>`;
  }
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url;
    s.onload = () => resolve();
    s.onerror = (err) => reject(new Error(`Failed to load script: ${url}`));
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