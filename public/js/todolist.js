/* ===================================================
   TODOLIST - NAMESPACED JAVASCRIPT
   Fix:
   1. Progress ditampilkan sebagai persen (0.7 → 70%)
   2. Target selalu 100%
   3. Progress field terbaca dengan benar
   4. ✅ ODP Inputan bisa diedit dan disimpan
   =================================================== */

// ──────────────────────────────────────
// CACHE
// ──────────────────────────────────────
let masterActivities = [];
let masterSTO        = [];
let allData          = [];
let filteredData     = [];
let currentEditId    = null;
let selectedIds      = new Set();

// Pagination state
let currentPage  = 1;
let rowsPerPage  = 100;
let totalPages   = 1;

// ──────────────────────────────────────
// INIT
// ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {
  console.log('DOM Ready – Todolist Page');
  await loadMasterTables();
  await loadTableData();
});

// ──────────────────────────────────────
// LOAD MASTER TABLES
// ──────────────────────────────────────
async function loadMasterTables() {
  try {
    const resAct = await fetch('/api/master-activity');
    if (!resAct.ok) {
      console.warn('⚠️ Master Activity endpoint not available:', resAct.status);
      masterActivities = [];
    } else {
      const dataAct = await resAct.json();
      if (dataAct.success) masterActivities = dataAct.data;
    }

    const resSto = await fetch('/api/wilayah-ridar');
    if (!resSto.ok) {
      console.warn('⚠️ Wilayah Ridar endpoint not available:', resSto.status);
      masterSTO = [];
    } else {
      const dataSto = await resSto.json();
      if (dataSto.success) masterSTO = dataSto.data;
    }

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
    const res = await fetch('/api/todolist');

    if (!res.ok) {
      if (res.status === 404) {
        showError('❌ API Endpoint tidak ditemukan!\n\nEndpoint: GET /api/todolist');
      } else {
        showError(`❌ HTTP Error ${res.status}: ${res.statusText}`);
      }
      return;
    }

    const json = await res.json();

    if (json.success) {
      allData      = json.data;
      filteredData = json.data;
      currentPage  = 1;
      renderTable(filteredData);
      updateSummaryCards(allData);
    } else {
      showError('Gagal memuat data: ' + (json.message || ''));
    }
  } catch (err) {
    console.error('❌ Error load data:', err);
    showError(`⚠️ Tidak dapat terhubung ke server!\n\nError: ${err.message}`);
  }
}

// ──────────────────────────────────────
// RENDER TABLE
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

  totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex   = Math.min(startIndex + rowsPerPage, data.length);
  const pageData   = data.slice(startIndex, endIndex);

  tbody.innerHTML = '';
  pageData.forEach((row, i) => {
    const tr        = document.createElement('tr');
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
      <td>
        <button class="btn-icon-detail" onclick="openDetail(${row.id})" title="Lihat Detail">
          <i class="fa-solid fa-eye"></i>
        </button>
      </td>
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
  document.querySelectorAll('.row-checkbox').forEach(cb => {
    cb.checked = checkbox.checked;
    const id   = parseInt(cb.dataset.id);
    if (checkbox.checked) selectedIds.add(id);
    else selectedIds.delete(id);
  });
  updateDeleteButton();
}

function toggleRowCheckbox(checkbox) {
  const id = parseInt(checkbox.dataset.id);
  if (checkbox.checked) selectedIds.add(id);
  else selectedIds.delete(id);
  updateSelectAllCheckbox();
  updateDeleteButton();
}

function updateSelectAllCheckbox() {
  const selectAll      = document.getElementById('selectAll');
  if (!selectAll) return;
  const all     = document.querySelectorAll('.row-checkbox');
  const checked = document.querySelectorAll('.row-checkbox:checked');
  if (all.length === 0) {
    selectAll.checked = false; selectAll.indeterminate = false;
  } else if (checked.length === 0) {
    selectAll.checked = false; selectAll.indeterminate = false;
  } else if (checked.length === all.length) {
    selectAll.checked = true;  selectAll.indeterminate = false;
  } else {
    selectAll.checked = false; selectAll.indeterminate = true;
  }
}

function updateDeleteButton() {
  const btn = document.getElementById('btnDeleteSelected');
  if (!btn) return;
  btn.disabled = selectedIds.size === 0;
  btn.textContent = selectedIds.size > 0
    ? `🗑️ Hapus Terpilih (${selectedIds.size})`
    : '🗑️ Hapus Terpilih';
}

// ──────────────────────────────────────
// DELETE FUNCTIONS
// ──────────────────────────────────────
async function deleteSelected() {
  if (selectedIds.size === 0) { alert('Tidak ada data yang dipilih'); return; }
  if (!confirm(`⚠️ Hapus ${selectedIds.size} data terpilih? Tidak dapat dibatalkan!`)) return;

  try {
    const res  = await fetch('/api/todolist/delete-selected', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ids: Array.from(selectedIds) })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success) {
      alert(`✅ Berhasil menghapus ${json.deletedCount} data`);
      selectedIds.clear();
      const sa = document.getElementById('selectAll');
      if (sa) sa.checked = false;
      await loadTableData();
    } else {
      alert('❌ Gagal: ' + (json.message || ''));
    }
  } catch (err) {
    alert(`❌ Kesalahan: ${err.message}`);
  }
}

async function deleteAll() {
  if (!confirm('⚠️ Hapus SEMUA data? Tidak dapat dibatalkan!')) return;
  if (!confirm('⚠️ KONFIRMASI TERAKHIR – Hapus semua data?')) return;

  try {
    const res  = await fetch('/api/todolist/delete-all', { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success) {
      alert(`✅ Berhasil menghapus semua data (${json.deletedCount} baris)`);
      selectedIds.clear();
      await loadTableData();
    } else {
      alert('❌ Gagal: ' + (json.message || ''));
    }
  } catch (err) {
    alert(`❌ Kesalahan: ${err.message}`);
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
// ✅ FIX: FORMAT PROGRESS → PERSEN
// 0.7 → "70%", 1 → "100%", null/'' → "-"
// ──────────────────────────────────────
function formatProgress(val) {
  if (val === null || val === undefined || val === '') return '-';
  const num = parseFloat(val);
  if (isNaN(num)) return '-';
  return Math.round(num * 100) + '%';
}

// ──────────────────────────────────────
// SUMMARY CARDS
// ──────────────────────────────────────
function updateSummaryCards(data) {
  let completed = 0, ogp = 0, pindahLoker = 0, open = 0;
  (data || []).forEach(r => {
    const s = (r.status_todolist || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'COMPLETE') completed++;
    else if (s === 'OGP') ogp++;
    else if (s === 'PINDAH LOKER') pindahLoker++;
    else if (s === 'OPEN') open++;
  });
  setVal('countComplete', completed);
  setVal('countOGP',      ogp);
  setVal('countPindah',   pindahLoker);
  setVal('countClosed',   open);
}

// ──────────────────────────────────────
// FILTER & SEARCH
// ──────────────────────────────────────
function applyFilter() {
  const status     = document.getElementById('filterStatus').value;
  const searchTerm = document.getElementById('searchWonum').value.trim().toLowerCase();
  let filtered     = allData;

  if (status) {
    filtered = filtered.filter(r => (r.status_todolist || '').toUpperCase() === status);
  }
  if (searchTerm) {
    filtered = filtered.filter(r => (r.wonum || '').toLowerCase().includes(searchTerm));
  }

  filteredData = filtered;
  currentPage  = 1;
  renderTable(filtered);
}

function handleSearch() {
  const val = document.getElementById('searchWonum').value.trim();
  document.getElementById('btnClearSearch').style.display = val ? 'block' : 'none';
  applyFilter();
}

function clearSearch() {
  document.getElementById('searchWonum').value = '';
  document.getElementById('btnClearSearch').style.display = 'none';
  applyFilter();
}

// ──────────────────────────────────────
// PAGINATION
// ──────────────────────────────────────
function updatePagination(totalRows) {
  const container = document.getElementById('paginationContainer');
  if (!container) return;
  if (totalRows === 0) { container.innerHTML = ''; return; }

  totalPages = Math.ceil(totalRows / rowsPerPage);
  let html = '<div class="pagination">';
  html += `<div class="pagination-info">Halaman ${currentPage} dari ${totalPages} (Total: ${totalRows} data)</div>`;
  html += '<div class="pagination-buttons">';
  html += `<button class="pagination-btn" onclick="goToPage(1)" ${currentPage===1?'disabled':''}>« Awal</button>`;
  html += `<button class="pagination-btn" onclick="goToPage(${currentPage-1})" ${currentPage===1?'disabled':''}>‹ Sebelumnya</button>`;

  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage   = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) startPage = Math.max(1, endPage - maxButtons + 1);

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="pagination-btn page-number ${i===currentPage?'active':''}" onclick="goToPage(${i})">${i}</button>`;
  }

  html += `<button class="pagination-btn" onclick="goToPage(${currentPage+1})" ${currentPage===totalPages?'disabled':''}>Selanjutnya ›</button>`;
  html += `<button class="pagination-btn" onclick="goToPage(${totalPages})" ${currentPage===totalPages?'disabled':''}>Akhir »</button>`;
  html += '</div>';
  html += `<div class="pagination-rows">
    <label>Tampilkan:</label>
    <select onchange="changeRowsPerPage(this.value)" class="rows-per-page-select">
      <option value="50"  ${rowsPerPage===50 ?'selected':''}>50</option>
      <option value="100" ${rowsPerPage===100?'selected':''}>100</option>
      <option value="200" ${rowsPerPage===200?'selected':''}>200</option>
      <option value="500" ${rowsPerPage===500?'selected':''}>500</option>
    </select>
  </div></div>`;
  container.innerHTML = html;
}

function goToPage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderTable(filteredData);
  const card = document.querySelector('.card');
  if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function changeRowsPerPage(val) {
  rowsPerPage = parseInt(val);
  currentPage = 1;
  renderTable(filteredData);
}

// ──────────────────────────────────────
// ✅ FIX UTAMA: OPEN DETAIL
// - Progress tampil sebagai persen
// - Target selalu 100%
// ──────────────────────────────────────
async function openDetail(id) {
  console.log('🔍 Opening detail for ID:', id);

  try {
    const res = await fetch(`/api/todolist/${id}`);

    if (!res.ok) {
      if (res.status === 404) {
        alert(`❌ API Endpoint tidak ditemukan!\nEndpoint: GET /api/todolist/${id}`);
      } else {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return;
    }

    const result = await res.json();
    if (!result.success || !result.data) {
      alert('❌ Data tidak ditemukan');
      return;
    }

    const row = result.data;
    currentEditId = id;

    // Field biasa
    setInput('editId',           row.id);
    setInput('wonum',            row.wonum);
    setInput('odpInputan',       row.odp_inputan);
    setInput('uicField',         row.uic);
    setInput('picField',         row.pic);
    setInput('leaderField',      row.leader);
    setInput('updateStatusDeen', row.update_status_deen);
    setInput('statusField',      row.status_todolist);
    setInput('solusiProgress',   row.solusi_progress);
    setInput('monthDate',        row.month_date);
    setInput('scOrder',          row.sc_order);

    // ✅ FIX: Simpan raw progress (desimal) di hidden field, tampilkan sebagai persen
    const rawProgress = (row.progress != null && row.progress !== '') ? row.progress : '';
    setInput('progressRaw',   rawProgress);
    setInput('progressField', formatProgress(rawProgress));

    // ✅ FIX 2: Target selalu 100%
    setInput('targetField', '100%');

    populateActivityDropdown(row.activity_id);
    populateStoDropdown(row.sto);

    document.querySelector('.todolist-modal-overlay').classList.add('active');

  } catch (err) {
    console.error('❌ Error opening detail:', err);
    alert(`❌ Terjadi kesalahan:\n\n${err.message}`);
  }
}

// ──────────────────────────────────────
// DROPDOWN HELPERS
// ──────────────────────────────────────
function populateActivityDropdown(selectedId) {
  const sel = document.getElementById('activitySelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Pilih Activity --</option>';
  if (masterActivities.length === 0) {
    sel.innerHTML += '<option value="" disabled>⚠️ Data master activity kosong</option>';
    return;
  }
  masterActivities.forEach(act => {
    sel.innerHTML += `<option value="${act.id}" ${act.id==selectedId?'selected':''}>${esc(act.activity_name)}</option>`;
  });
}

function populateStoDropdown(selectedSto) {
  const sel = document.getElementById('stoSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Pilih STO --</option>';
  if (masterSTO.length === 0) {
    sel.innerHTML += '<option value="" disabled>⚠️ Data master STO kosong</option>';
    return;
  }
  masterSTO.forEach(s => {
    sel.innerHTML += `<option value="${esc(s.sto)}" ${s.sto==selectedSto?'selected':''}>${esc(s.sto)}</option>`;
  });
}

// ──────────────────────────────────────
// ✅ FIX 3: onActivityChange — progress juga diformat persen
// ──────────────────────────────────────
function onActivityChange() {
  const actId = document.getElementById('activitySelect').value;
  const act   = masterActivities.find(a => a.id == actId);

  if (act) {
    setInput('statusField',    act.status_default   || '');
    setInput('solusiProgress', act.solusi_default   || '');
    // Simpan raw value untuk dikirim ke backend, tampilkan sebagai persen
    const rawProg = (act.progress_default != null) ? act.progress_default : '';
    setInput('progressRaw',   rawProg);
    setInput('progressField', formatProgress(rawProg));
  } else {
    setInput('statusField',    '');
    setInput('progressField',  '');
    setInput('progressRaw',    '');
    setInput('solusiProgress', '');
  }
  // Target tetap 100% apapun yang dipilih
  setInput('targetField', '100%');
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

// ──────────────────────────────────────
// ✅ SAVE DETAIL - TAMBAH ODP INPUTAN
// ──────────────────────────────────────
async function saveDetail() {
  const id = document.getElementById('editId').value;
  if (!id) return;

  const activityId = document.getElementById('activitySelect').value;
  const stoVal     = document.getElementById('stoSelect').value;
  const odpInputan = getVal('odpInputan').trim(); // ✅ Ambil nilai ODP Inputan

  if (!activityId) { alert('Activity wajib dipilih!'); return; }
  if (!stoVal)     { alert('STO wajib dipilih!');      return; }

  // Ambil raw progress (desimal) dari hidden field
  const rawProgressVal = getVal('progressRaw');
  const progressToSave = rawProgressVal !== '' ? parseFloat(rawProgressVal) : null;

  const payload = {
    activity_id:     activityId,
    sto:             stoVal,
    status_todolist: getVal('statusField'),
    solusi_progress: getVal('solusiProgress'),
    progress:        progressToSave,
    odp_inputan:     odpInputan  // ✅ Kirim ODP Inputan ke backend
  };

  try {
    const res  = await fetch(`/api/todolist/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success) {
      alert('✅ Data berhasil disimpan!');
      closeModal();
      await loadTableData();
    } else {
      alert('❌ ' + (json.message || 'Gagal menyimpan'));
    }
  } catch (err) {
    console.error('❌ Error saving:', err);
    alert(`❌ Kesalahan: ${err.message}`);
  }
}

// ──────────────────────────────────────
// MODAL HELPERS
// ──────────────────────────────────────
function closeModal() {
  document.querySelector('.todolist-modal-overlay').classList.remove('active');
  currentEditId = null;
}

function closeModalOnOverlay(e) {
  if (e.target === e.currentTarget) closeModal();
}

// ──────────────────────────────────────
// LOADING OVERLAY
// ──────────────────────────────────────
function showLoading(text = 'Memproses data...', subtext = 'Mohon tunggu') {
  const overlay = document.querySelector('.todolist-loading-overlay');
  const lt      = document.getElementById('loadingText');
  const lst     = document.getElementById('loadingSubtext');
  const lp      = document.getElementById('loadingProgress');
  if (lt)  lt.textContent  = text;
  if (lst) lst.textContent = subtext;
  if (lp)  lp.textContent  = '';
  if (overlay) overlay.classList.add('active');
}

function updateLoadingProgress(progress) {
  const lp = document.getElementById('loadingProgress');
  if (lp) lp.textContent = progress;
}

function hideLoading() {
  const overlay = document.querySelector('.todolist-loading-overlay');
  if (overlay) overlay.classList.remove('active');
}

// ──────────────────────────────────────
// EXCEL IMPORT / EXPORT
// ──────────────────────────────────────
function triggerUpload() {
  document.getElementById('excelFileInput').click();
}

function convertExcelDateToMonth(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    const months = ['january','february','march','april','may','june',
                    'july','august','september','october','november','december'];
    if (months.some(m => value.toLowerCase().includes(m))) return value;
  }
  if (typeof value === 'number') {
    try {
      const date = new Date(new Date(1899,11,30).getTime() + value * 86400000);
      return ['January','February','March','April','May','June',
              'July','August','September','October','November','December'][date.getMonth()];
    } catch { return String(value); }
  }
  return String(value);
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (typeof XLSX === 'undefined') {
    try {
      showLoading('Memuat library Excel...', 'Mohon tunggu');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
      hideLoading();
    } catch {
      hideLoading();
      alert('Gagal memuat library Excel. Refresh dan coba lagi.');
      event.target.value = ''; return;
    }
  }

  try {
    showLoading('Membaca file Excel...', 'Sedang memproses');
    const ab       = await file.arrayBuffer();
    const wb       = XLSX.read(ab, { type: 'array', cellDates: false });
    const sheet    = wb.Sheets[wb.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: true });

    if (jsonData.length === 0) {
      hideLoading(); alert('File kosong.'); event.target.value = ''; return;
    }
    updateLoadingProgress(`Memproses ${jsonData.length} baris...`);

    const payload = jsonData.map(row => {
      const n = {};
      Object.keys(row).forEach(k => { n[k.trim().toUpperCase().replace(/\s+/g,' ')] = row[k]; });
      return {
        wonum:            n['WO / SC ID'] || n['WONUM'] || n['WO'] || n['WO / SC'] || '',
        odp_inputan:      n['ODP INPUTAN'] || n['ODP'] || '',
        activity_teknisi: n['KATEGORI SOLUSI'] || n['KENDALA PT 1'] || n['KENDALA PT1'] || n['KENDALA'] || '',
        month_date:       convertExcelDateToMonth(n['BULAN'] || n['MONTH'] || ''),
        sto:              n['STO'] || ''
      };
    }).filter(r => r.wonum || r.activity_teknisi);

    if (payload.length === 0) {
      hideLoading(); alert('Tidak ada data valid.'); event.target.value = ''; return;
    }
    updateLoadingProgress(`Mengirim ${payload.length} baris ke server...`);

    const res  = await fetch('/api/todolist/import', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rows: payload })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    hideLoading();

    if (json.success) {
      alert(`✅ Import berhasil!\n• ${json.count} baris\n• Durasi: ${json.duration}`);
      await loadTableData();
    } else {
      alert('❌ Import gagal: ' + (json.message || ''));
    }
  } catch (err) {
    hideLoading();
    alert(`❌ Kesalahan: ${err.message}`);
  }
  event.target.value = '';
}

async function exportExcel() {
  if (typeof XLSX === 'undefined') {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
  }
  const headers = ['No','WO / SC ID','ODP Inputan','Activity','Update Status','Status','Bulan'];
  const rows    = allData.map((r, i) => [
    i+1, r.wonum, r.odp_inputan, r.activity,
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
        ${esc(msg)}
      </td></tr>`;
  }
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src     = url;
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load: ${url}`));
    document.head.appendChild(s);
  });
}

// ESC → tutup modal
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    const overlay = document.querySelector('.todolist-modal-overlay');
    if (overlay && overlay.classList.contains('active')) closeModal();
  }
});