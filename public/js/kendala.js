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
      var mdCreated = document.getElementById('md-created');
      var mdNama = document.getElementById('md-nama');
      var editLink = document.getElementById('md-edit-link');

      if (mdWonum) mdWonum.textContent = tr.dataset.wonum || '-';
      if (mdTicket) mdTicket.textContent = tr.dataset.ticket_id || '-';
      if (mdStatus) mdStatus.textContent = tr.dataset.status_hi || '-';
      if (mdSto) mdSto.textContent = tr.dataset.sto || '-';
      if (mdTtd) mdTtd.textContent = tr.dataset.ttd_kb || '-';
      if (mdTtic) mdTtic.textContent = tr.dataset.ttic || '-';
      if (mdKeterangan) mdKeterangan.textContent = tr.dataset.keterangan || '-';
      var dateToShow = tr.dataset.updated_at || tr.dataset.created_at;
      var created = dateToShow ? new Date(dateToShow) : null;
      if (mdCreated) mdCreated.textContent = created ? created.toLocaleString('id-ID') : '-';
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
// EXPORT HANDLER
// ============================

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
        window.location.href = '/kendala/export/pdf?' + params.toString();
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
