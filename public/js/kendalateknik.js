/* ===================================================
   KENDALA TEKNIK - NAMESPACED JAVASCRIPT
   Fix: editData membaca dari DOM (tidak perlu GET by ID)
   =================================================== */

let editingId = null;

// Cache data yang sudah di-load dari server
let cachedData = [];

document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM Loaded - Kendala Teknik (Master Activity)');
  loadDataFromDatabase();
});

function loadDataFromDatabase() {
  console.log('Loading data from database...');

  fetch('/api/kendala-teknik')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(result => {
      console.log('✅ Data received:', result);
      if (result.success) {
        cachedData = result.data || [];
        displayData(cachedData);
      } else {
        showError('Gagal memuat data: ' + (result.message || 'Unknown error'));
      }
    })
    .catch(error => {
      console.error('❌ Error loading data:', error);
      showError('Terjadi kesalahan saat memuat data: ' + error.message);
    });
}

function displayData(data) {
  const tableBody = document.getElementById('dataTable');

  if (!tableBody) {
    console.error('❌ Table body element not found!');
    return;
  }

  if (!data || data.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="loading-cell">
          Tidak ada data tersedia.<br>
          <small>Klik tombol "Tambah Kendala Teknik" untuk menambah data baru.</small>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = '';

  data.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td style="text-align:left; font-weight:500;">${escapeHtml(item.activity_name || '-')}</td>
      <td>${statusBadge(item.status_default)}</td>
      <td>${escapeHtml(item.progress_default || '-')}</td>
      <td style="text-align:left;">${escapeHtml(item.solusi_default || '-')}</td>
      <td>
        <div class="action-icons">
          <button class="action-btn" onclick="editData(${item.id})" title="Edit">✏️</button>
          <button class="action-btn" onclick="deleteData(${item.id})" title="Hapus">🗑️</button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });

  console.log('✅ Table rendered with', data.length, 'rows');
}

function statusBadge(status) {
  const statusUpper = (status || '').toUpperCase();
  const classMap = {
    'COMPLETED':    'status-completed',
    'OGP':          'status-ogp',
    'OPEN':         'status-open',
    'PINDAH LOKER': 'status-pindah'
  };
  const cls = classMap[statusUpper] || 'status-default';
  return `<span class="status-badge ${cls}">${escapeHtml(status || '-')}</span>`;
}

function escapeHtml(text) {
  if (text == null) return '-';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function openModal() {
  const modalOverlay = document.querySelector('.kendalateknik-modal-overlay');
  const modalTitle   = document.getElementById('modalTitle');
  const saveBtn      = document.getElementById('saveBtn');
  const form         = document.getElementById('activityForm');

  if (!modalOverlay || !modalTitle || !saveBtn || !form) {
    console.error('❌ Modal elements not found!');
    return;
  }

  form.reset();
  document.getElementById('activityId').value = '';
  editingId = null;

  modalTitle.textContent = 'Tambah Kendala Teknik';
  saveBtn.textContent    = 'Simpan';
  saveBtn.disabled       = false;

  modalOverlay.classList.add('active');

  setTimeout(() => {
    document.getElementById('activityName').focus();
  }, 100);
}

function closeModal() {
  const modalOverlay = document.querySelector('.kendalateknik-modal-overlay');
  const form         = document.getElementById('activityForm');

  if (modalOverlay) modalOverlay.classList.remove('active');
  if (form)         form.reset();

  editingId = null;
}

function closeModalOnOverlay(event) {
  if (event.target === event.currentTarget) {
    closeModal();
  }
}

function saveData() {
  const activityName    = document.getElementById('activityName').value.trim();
  const statusDefault   = document.getElementById('statusDefault').value.trim();
  const progressDefault = document.getElementById('progressDefault').value.trim();
  const solusiDefault   = document.getElementById('solusiDefault').value.trim();

  if (!activityName) {
    alert('Activity Name wajib diisi!');
    document.getElementById('activityName').focus();
    return;
  }
  if (!statusDefault) {
    alert('Status wajib dipilih!');
    document.getElementById('statusDefault').focus();
    return;
  }
  if (!progressDefault) {
    alert('Progress wajib diisi!');
    document.getElementById('progressDefault').focus();
    return;
  }
  if (!solusiDefault) {
    alert('Solusi/Progress wajib diisi!');
    document.getElementById('solusiDefault').focus();
    return;
  }

  const progress = parseFloat(progressDefault);
  if (isNaN(progress) || progress < 0 || progress > 1) {
    alert('Progress harus berupa angka antara 0 dan 1!');
    document.getElementById('progressDefault').focus();
    return;
  }

  const data = {
    activity_name:    activityName,
    status_default:   statusDefault,
    progress_default: progress,
    solusi_default:   solusiDefault
  };

  const url    = editingId ? `/api/kendala-teknik/${editingId}` : '/api/kendala-teknik';
  const method = editingId ? 'PUT' : 'POST';

  console.log('💾 Saving data:', { url, method, data });

  const saveBtn  = document.getElementById('saveBtn');
  const origText = saveBtn.textContent;
  saveBtn.disabled    = true;
  saveBtn.textContent = 'Menyimpan...';

  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(result => {
      console.log('✅ Save result:', result);

      if (result.success) {
        alert(result.message || 'Data berhasil disimpan!');
        closeModal();
        loadDataFromDatabase();
      } else {
        alert(result.message || 'Gagal menyimpan data');
        saveBtn.disabled    = false;
        saveBtn.textContent = origText;
      }
    })
    .catch(error => {
      console.error('❌ Error saving data:', error);
      alert('Terjadi kesalahan saat menyimpan data: ' + error.message);
      saveBtn.disabled    = false;
      saveBtn.textContent = origText;
    });
}

// ✅ FIX UTAMA: Ambil data dari cachedData (tidak perlu request GET by ID)
// Ini menghilangkan error 404 karena endpoint GET /api/kendala-teknik/:id mungkin tidak ada
function editData(id) {
  console.log('✏️ Editing data with ID:', id);

  // Cari data di cache yang sudah di-load sebelumnya
  const item = cachedData.find(d => d.id == id);

  if (item) {
    // Data ditemukan di cache, langsung buka modal
    populateEditModal(item);
    return;
  }

  // Fallback: jika tidak ada di cache, coba fetch ulang semua data dulu
  console.warn('⚠️ Data tidak ada di cache, mencoba reload...');
  fetch('/api/kendala-teknik')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(result => {
      if (result.success && result.data) {
        cachedData = result.data;
        const found = cachedData.find(d => d.id == id);
        if (found) {
          populateEditModal(found);
        } else {
          alert('Data tidak ditemukan (ID: ' + id + ')');
        }
      } else {
        alert('Gagal memuat data untuk edit');
      }
    })
    .catch(error => {
      console.error('❌ Error loading edit data:', error);
      alert('Terjadi kesalahan saat memuat data: ' + error.message);
    });
}

// Helper: isi form modal dengan data yang akan di-edit
function populateEditModal(d) {
  document.getElementById('activityId').value      = d.id;
  document.getElementById('activityName').value    = d.activity_name   || '';
  document.getElementById('statusDefault').value   = d.status_default  || '';
  document.getElementById('progressDefault').value = d.progress_default || '';
  document.getElementById('solusiDefault').value   = d.solusi_default  || '';

  document.getElementById('modalTitle').textContent = 'Edit Kendala Teknik';
  document.getElementById('saveBtn').textContent    = 'Update';
  document.getElementById('saveBtn').disabled       = false;

  document.querySelector('.kendalateknik-modal-overlay').classList.add('active');

  editingId = d.id;

  setTimeout(() => {
    document.getElementById('activityName').focus();
  }, 100);

  console.log('✅ Modal populated for edit, ID:', d.id);
}

function deleteData(id) {
  if (!confirm(`Apakah Anda yakin ingin menghapus data ini?\n\nData yang dihapus tidak dapat dikembalikan.`)) {
    return;
  }

  console.log('🗑️ Deleting data with ID:', id);

  fetch(`/api/kendala-teknik/${id}`, { method: 'DELETE' })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(result => {
      console.log('✅ Delete result:', result);

      if (result.success) {
        alert(result.message || 'Data berhasil dihapus!');
        loadDataFromDatabase();
      } else {
        alert(result.message || 'Gagal menghapus data');
      }
    })
    .catch(error => {
      console.error('❌ Error deleting data:', error);
      alert('Terjadi kesalahan saat menghapus data: ' + error.message);
    });
}

function showError(message) {
  const tableBody = document.getElementById('dataTable');

  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="loading-cell" style="color:#e53935;">
          ⚠️ ${escapeHtml(message)}
          <br><br>
          <small style="color:#666;">Pastikan server backend sudah berjalan dan database sudah terkoneksi dengan benar.</small>
        </td>
      </tr>
    `;
  }

  console.error('❌ Error:', message);
}

document.addEventListener('keydown', function (e) {
  const modalOverlay = document.querySelector('.kendalateknik-modal-overlay');
  const isModalOpen  = modalOverlay && modalOverlay.classList.contains('active');

  if (e.key === 'Escape' && isModalOpen) {
    closeModal();
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 's' && isModalOpen) {
    e.preventDefault();
    saveData();
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !isModalOpen) {
    e.preventDefault();
    openModal();
  }
});