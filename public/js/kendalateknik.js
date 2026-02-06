/* ===================================================
   KENDALA TEKNIK - CLIENT JAVASCRIPT
   Master Activity Management
   =================================================== */

// Global variable
let editingId = null;

// ──────────────────────────────────────
// INIT - Load data saat halaman dimuat
// ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Loaded - Kendala Teknik');
  loadDataFromDatabase();
});

// ──────────────────────────────────────
// LOAD DATA FROM API
// ──────────────────────────────────────
function loadDataFromDatabase() {
  console.log('Loading data from database...');
  
  fetch('/api/kendala-teknik')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
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

// ──────────────────────────────────────
// DISPLAY DATA TO TABLE
// ──────────────────────────────────────
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
      <td style="text-align:left">${escapeHtml(item.activity_name || '-')}</td>
      <td><span class="status-badge status-${getStatusClass(item.status_default)}">${escapeHtml(item.status_default || '-')}</span></td>
      <td>${escapeHtml(item.progress_default || '-')}</td>
      <td style="text-align:left" title="${escapeHtml(item.solusi_default || '-')}">${truncateText(item.solusi_default, 60)}</td>
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

// ──────────────────────────────────────
// GET STATUS CLASS (for badge color)
// ──────────────────────────────────────
function getStatusClass(status) {
  const statusMap = {
    'COMPLETED': 'completed',
    'OGP': 'ogp',
    'OPEN': 'open',
    'PINDAH LOKER': 'pindah'
  };
  return statusMap[status] || 'default';
}

// ──────────────────────────────────────
// TRUNCATE TEXT
// ──────────────────────────────────────
function truncateText(text, maxLength) {
  if (!text) return '-';
  const escaped = escapeHtml(text);
  if (escaped.length <= maxLength) return escaped;
  return escaped.substring(0, maxLength) + '...';
}

// ──────────────────────────────────────
// ESCAPE HTML (prevent XSS)
// ──────────────────────────────────────
function escapeHtml(text) {
  if (text == null) return '-';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// ──────────────────────────────────────
// OPEN MODAL (for add new)
// ──────────────────────────────────────
function openModal() {
  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const saveBtn = document.getElementById('saveBtn');
  const form = document.getElementById('activityForm');
  
  if (!modalOverlay || !modalTitle || !saveBtn || !form) {
    console.error('❌ Modal elements not found!');
    return;
  }
  
  // Reset form
  form.reset();
  document.getElementById('activityId').value = '';
  editingId = null;
  
  // Update modal
  modalTitle.textContent = 'Tambah Kendala Teknik';
  saveBtn.textContent = 'Simpan';
  saveBtn.disabled = false;
  
  // Show modal
  modalOverlay.classList.add('active');
  
  // Focus first input
  setTimeout(() => {
    document.getElementById('activityName').focus();
  }, 100);
}

// ──────────────────────────────────────
// CLOSE MODAL
// ──────────────────────────────────────
function closeModal() {
  const modalOverlay = document.getElementById('modalOverlay');
  const form = document.getElementById('activityForm');
  
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
  }
  
  if (form) {
    form.reset();
  }
  
  editingId = null;
}

function closeModalOnOverlay(event) {
  if (event.target === event.currentTarget) {
    closeModal();
  }
}

// ──────────────────────────────────────
// SAVE DATA (add or update)
// ──────────────────────────────────────
function saveData() {
  const activityName = document.getElementById('activityName').value.trim();
  const statusDefault = document.getElementById('statusDefault').value.trim();
  const progressDefault = document.getElementById('progressDefault').value.trim();
  const solusiDefault = document.getElementById('solusiDefault').value.trim();
  
  // Validasi
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
  
  // Validasi progress maksimal 1
  const progress = parseFloat(progressDefault);
  if (isNaN(progress)) {
    alert('Progress harus berupa angka!');
    document.getElementById('progressDefault').focus();
    return;
  }
  
  if (progress > 1) {
    alert('Progress maksimal adalah 1!');
    document.getElementById('progressDefault').focus();
    return;
  }
  
  if (progress < 0) {
    alert('Progress minimal adalah 0!');
    document.getElementById('progressDefault').focus();
    return;
  }
  
  if (!solusiDefault) {
    alert('Solusi/Progress wajib diisi!');
    document.getElementById('solusiDefault').focus();
    return;
  }
  
  // Prepare data
  const data = {
    activity_name: activityName,
    status_default: statusDefault,
    progress_default: progress,
    solusi_default: solusiDefault
  };
  
  // Determine URL and method
  const url = editingId ? `/api/kendala-teknik/${editingId}` : '/api/kendala-teknik';
  const method = editingId ? 'PUT' : 'POST';
  
  console.log('💾 Saving data:', { url, method, data });
  
  // Disable button to prevent double submission
  const saveBtn = document.getElementById('saveBtn');
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = 'Menyimpan...';
  
  fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(result => {
    console.log('✅ Save result:', result);
    
    if (result.success) {
      alert(result.message || 'Data berhasil disimpan!');
      closeModal();
      loadDataFromDatabase(); // Reload table
    } else {
      alert(result.message || 'Gagal menyimpan data');
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
    }
  })
  .catch(error => {
    console.error('❌ Error saving data:', error);
    alert('Terjadi kesalahan saat menyimpan data: ' + error.message);
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  });
}

// ──────────────────────────────────────
// EDIT DATA
// ──────────────────────────────────────
function editData(id) {
  console.log('✏️ Editing data with ID:', id);
  
  fetch(`/api/kendala-teknik/${id}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(result => {
      console.log('✅ Edit data received:', result);
      
      if (result.success && result.data) {
        const data = result.data;
        
        // Fill form
        document.getElementById('activityId').value = data.id;
        document.getElementById('activityName').value = data.activity_name || '';
        document.getElementById('statusDefault').value = data.status_default || '';
        document.getElementById('progressDefault').value = data.progress_default || '';
        document.getElementById('solusiDefault').value = data.solusi_default || '';
        
        // Update modal
        document.getElementById('modalTitle').textContent = 'Edit Kendala Teknik';
        document.getElementById('saveBtn').textContent = 'Update';
        document.getElementById('modalOverlay').classList.add('active');
        
        editingId = id;
        
        // Focus first input
        setTimeout(() => {
          document.getElementById('activityName').focus();
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

// ──────────────────────────────────────
// DELETE DATA
// ──────────────────────────────────────
function deleteData(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus data ini?\n\nData yang dihapus tidak dapat dikembalikan.')) {
    return;
  }
  
  console.log('🗑️ Deleting data with ID:', id);
  
  fetch(`/api/kendala-teknik/${id}`, {
    method: 'DELETE'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(result => {
    console.log('✅ Delete result:', result);
    
    if (result.success) {
      alert(result.message || 'Data berhasil dihapus!');
      loadDataFromDatabase(); // Reload table
    } else {
      alert(result.message || 'Gagal menghapus data');
    }
  })
  .catch(error => {
    console.error('❌ Error deleting data:', error);
    alert('Terjadi kesalahan saat menghapus data: ' + error.message);
  });
}

// ──────────────────────────────────────
// SHOW ERROR
// ──────────────────────────────────────
function showError(message) {
  const tableBody = document.getElementById('dataTable');
  
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="loading-cell" style="color: #e53935;">
          ⚠️ ${escapeHtml(message)}
          <br><br>
          <small style="color: #666;">Pastikan server backend sudah berjalan dan database sudah terkoneksi dengan benar.</small>
        </td>
      </tr>
    `;
  }
  
  console.error('❌ Error:', message);
}

// ──────────────────────────────────────
// KEYBOARD SHORTCUTS
// ──────────────────────────────────────
document.addEventListener('keydown', function(e) {
  const modalOverlay = document.getElementById('modalOverlay');
  const isModalOpen = modalOverlay && modalOverlay.classList.contains('active');
  
  // ESC to close modal
  if (e.key === 'Escape' && isModalOpen) {
    closeModal();
  }
  
  // Ctrl+S or Cmd+S to save (when modal is open)
  if ((e.ctrlKey || e.metaKey) && e.key === 's' && isModalOpen) {
    e.preventDefault();
    saveData();
  }
  
  // Ctrl+N or Cmd+N to open add modal (when modal is closed)
  if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !isModalOpen) {
    e.preventDefault();
    openModal();
  }
});