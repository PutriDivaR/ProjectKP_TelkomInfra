/* ===================================================
   WILAYAH RIDAR - NAMESPACED JAVASCRIPT
   Updated selectors untuk namespaced CSS
   =================================================== */

let editingId = null;

document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM Loaded - Wilayah Ridar');
  loadDataFromDatabase();
});

function loadDataFromDatabase() {
  console.log('Loading data from database...');

  fetch('/api/wilayah-ridar')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(result => {
      console.log('✅ Data received:', result);
      if (result.success) {
        displayData(result.data);
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
          <small>Klik tombol "Tambah Wilayah Ridar" untuk menambah data baru.</small>
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
      <td style="font-weight:700;text-align:left">${escapeHtml(item.sto || '-')}</td>
      <td style="text-align:left">${escapeHtml(item.uic || '-')}</td>
      <td style="text-align:left">${escapeHtml(item.pic || '-')}</td>
      <td style="text-align:left">${escapeHtml(item.leader || '-')}</td>
      <td>
        <div class="action-icons">
          <button class="action-btn" onclick="editData('${escapeHtml(item.sto)}')" title="Edit">✏️</button>
          <button class="action-btn" onclick="deleteData('${escapeHtml(item.sto)}')" title="Hapus">🗑️</button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });

  console.log('✅ Table rendered with', data.length, 'rows');
}

function escapeHtml(text) {
  if (text == null) return '-';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// ✅ UPDATED: Use namespaced selector
function openModal() {
  const modalOverlay = document.querySelector('.wilayahridar-modal-overlay');
  const modalTitle   = document.getElementById('modalTitle');
  const saveBtn      = document.getElementById('saveBtn');
  const form         = document.getElementById('wilayahForm');

  if (!modalOverlay || !modalTitle || !saveBtn || !form) {
    console.error('❌ Modal elements not found!');
    return;
  }

  form.reset();
  document.getElementById('wilayahId').value = '';
  editingId = null;

  modalTitle.textContent = 'Tambah Wilayah Ridar';
  saveBtn.textContent    = 'Simpan';
  saveBtn.disabled       = false;

  document.getElementById('stoInput').removeAttribute('readonly');

  modalOverlay.classList.add('active');

  setTimeout(() => {
    document.getElementById('stoInput').focus();
  }, 100);
}

// ✅ UPDATED: Use namespaced selector
function closeModal() {
  const modalOverlay = document.querySelector('.wilayahridar-modal-overlay');
  const form         = document.getElementById('wilayahForm');

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
  const sto    = document.getElementById('stoInput').value.trim().toUpperCase();
  const uic    = document.getElementById('uicInput').value.trim();
  const pic    = document.getElementById('picInput').value.trim();
  const leader = document.getElementById('leaderInput').value.trim();

  if (!sto) {
    alert('STO wajib diisi!');
    document.getElementById('stoInput').focus();
    return;
  }
  if (!uic) {
    alert('UIC wajib diisi!');
    document.getElementById('uicInput').focus();
    return;
  }
  if (!pic) {
    alert('PIC wajib diisi!');
    document.getElementById('picInput').focus();
    return;
  }
  if (!leader) {
    alert('Leader wajib diisi!');
    document.getElementById('leaderInput').focus();
    return;
  }

  const data = { sto, uic, pic, leader };

  const url    = editingId ? `/api/wilayah-ridar/${encodeURIComponent(editingId)}` : '/api/wilayah-ridar';
  const method = editingId ? 'PUT' : 'POST';

  console.log('💾 Saving data:', { url, method, data });

  const saveBtn    = document.getElementById('saveBtn');
  const origText   = saveBtn.textContent;
  saveBtn.disabled = true;
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

function editData(sto) {
  console.log('✏️ Editing data with STO:', sto);

  fetch(`/api/wilayah-ridar/${encodeURIComponent(sto)}`)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(result => {
      console.log('✅ Edit data received:', result);

      if (result.success && result.data) {
        const d = result.data;

        document.getElementById('wilayahId').value   = d.sto;
        document.getElementById('stoInput').value    = d.sto    || '';
        document.getElementById('uicInput').value    = d.uic    || '';
        document.getElementById('picInput').value    = d.pic    || '';
        document.getElementById('leaderInput').value = d.leader || '';

        document.getElementById('stoInput').setAttribute('readonly', true);

        document.getElementById('modalTitle').textContent = 'Edit Wilayah Ridar';
        document.getElementById('saveBtn').textContent    = 'Update';
        document.getElementById('saveBtn').disabled       = false;
        
        // ✅ UPDATED: Use namespaced selector
        document.querySelector('.wilayahridar-modal-overlay').classList.add('active');

        editingId = d.sto;

        setTimeout(() => {
          document.getElementById('uicInput').focus();
        }, 100);
      } else {
        alert('Data tidak ditemukan');
      }
    })
    .catch(error => {
      console.error('❌ Error loading edit data:', error);
      alert('Terjadi kesalahan saat memuat data: ' + error.message);
    });
}

function deleteData(sto) {
  if (!confirm(`Apakah Anda yakin ingin menghapus STO "${sto}"?\n\nData yang dihapus tidak dapat dikembalikan.`)) {
    return;
  }

  console.log('🗑️ Deleting data with STO:', sto);

  fetch(`/api/wilayah-ridar/${encodeURIComponent(sto)}`, { method: 'DELETE' })
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

// ✅ UPDATED: Use namespaced selector
document.addEventListener('keydown', function (e) {
  const modalOverlay = document.querySelector('.wilayahridar-modal-overlay');
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