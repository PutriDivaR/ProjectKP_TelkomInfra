// Global variable
let editingId = null;

// Load data saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Loaded - Kendala Teknik');
  loadDataFromDatabase();
});

// Fungsi untuk load data dari API
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
      console.log('Data received:', result);
      if (result.success) {
        displayData(result.data);
      } else {
        showError('Gagal memuat data: ' + (result.message || 'Unknown error'));
      }
    })
    .catch(error => {
      console.error('Error loading data:', error);
      showError('Terjadi kesalahan saat memuat data: ' + error.message);
    });
}

// Fungsi untuk menampilkan data ke tabel
function displayData(data) {
  const tableBody = document.getElementById('dataTable');
  
  if (!tableBody) {
    console.error('Table body element not found!');
    return;
  }
  
  if (!data || data.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="loading-cell">
          Tidak ada data tersedia. Klik tombol "+ Tambah Kendala Teknik" untuk menambah data.
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
      <td>${escapeHtml(item.activity_name || '-')}</td>
      <td><span class="status-badge status-${getStatusClass(item.status_default)}">${escapeHtml(item.status_default || '-')}</span></td>
      <td>${escapeHtml(item.progress_default || '-')}</td>
      <td title="${escapeHtml(item.solusi_default || '-')}">${escapeHtml(item.solusi_default || '-')}</td>
      <td>
        <div class="action-icons">
          <button class="action-btn" onclick="editData(${item.id})" title="Edit">✏️</button>
          <button class="action-btn" onclick="deleteData(${item.id})" title="Hapus">🗑️</button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Fungsi untuk get status class (untuk badge color)
function getStatusClass(status) {
  const statusMap = {
    'COMPLETED': 'completed',
    'OGP': 'ogp',
    'OPEN': 'open',
    'PINDAH LOKER': 'pindah'
  };
  return statusMap[status] || 'default';
}

// Fungsi untuk escape HTML (prevent XSS)
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Modal Functions
function openModal() {
  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const saveBtn = document.getElementById('saveBtn');
  const form = document.getElementById('activityForm');
  
  if (!modalOverlay || !modalTitle || !form) {
    console.error('Modal elements not found!');
    return;
  }
  
  modalOverlay.classList.add('active');
  modalTitle.textContent = 'Tambah Kendala Teknik';
  if (saveBtn) {
    saveBtn.textContent = 'Simpan';
    saveBtn.disabled = false;
  }
  form.reset();
  document.getElementById('activityId').value = '';
  editingId = null;
}

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

// Fungsi untuk menyimpan data
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
  
  console.log('Saving data:', { url, method, data });
  
  // Disable button to prevent double submission
  const saveBtn = document.getElementById('saveBtn');
  const originalText = saveBtn ? saveBtn.textContent : null;
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Menyimpan...';
  }
  
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
    console.log('Save result:', result);
    
    if (result.success) {
      alert(result.message || 'Data berhasil disimpan!');
      closeModal();
      loadDataFromDatabase();
    } else {
      alert(result.message || 'Gagal menyimpan data');
    }
  })
  .catch(error => {
    console.error('Error saving data:', error);
    alert('Terjadi kesalahan saat menyimpan data: ' + error.message);
  })
  .finally(() => {
    // Re-enable button
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
    }
  });
}

// Fungsi untuk edit data
function editData(id) {
  console.log('Editing data with ID:', id);
  
  fetch(`/api/kendala-teknik/${id}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(result => {
      console.log('Edit data received:', result);
      
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
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) saveBtn.textContent = 'Update';
        document.getElementById('modalOverlay').classList.add('active');
        
        editingId = id;
      } else {
        alert('Data tidak ditemukan');
      }
    })
    .catch(error => {
      console.error('Error loading edit data:', error);
      alert('Terjadi kesalahan saat memuat data: ' + error.message);
    });
}

// Fungsi untuk hapus data
function deleteData(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) {
    return;
  }
  
  console.log('Deleting data with ID:', id);
  
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
    console.log('Delete result:', result);
    
    if (result.success) {
      alert(result.message || 'Data berhasil dihapus!');
      loadDataFromDatabase();
    } else {
      alert(result.message || 'Gagal menghapus data');
    }
  })
  .catch(error => {
    console.error('Error deleting data:', error);
    alert('Terjadi kesalahan saat menghapus data: ' + error.message);
  });
}

// Fungsi untuk menampilkan error
function showError(message) {
  const tableBody = document.getElementById('dataTable');
  
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="loading-cell" style="color: #e53935;">
          ⚠️ ${escapeHtml(message)}
          <br><br>
          <small style="color: #666;">Pastikan server backend sudah running dan database sudah terkoneksi</small>
        </td>
      </tr>
    `;
  }
  
  console.error('Error:', message);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  // ESC to close modal
  if (e.key === 'Escape') {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  }
  
  // Ctrl+S or Cmd+S to save (when modal is open)
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay && modalOverlay.classList.contains('active')) {
      e.preventDefault();
      saveData();
    }
  }
});