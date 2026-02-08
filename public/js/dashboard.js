// Dashboard JavaScript - Modern Charts & Interactions
document.addEventListener('DOMContentLoaded', function() {
  
  // Initialize all charts
  initStatusDailyChart();
  initStatusTodolistChart();
  initStatusHIChart();
  initTopSTOChart();
  initDailyTrendChart();
  initActivityTechChart();
  initPackageChart();
  initSegmentChart();
  // Apply progress widths from data attributes
  initProgressFillWidths();
  
  // Refresh button
  const btnRefresh = document.getElementById('btnRefresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', refreshDashboard);
  }
  
  // Table pagination
  initTablePagination();
  
  // Table horizontal scroll buttons
  initTableScrollButtons();
});
// Helper: aggregate top N items, rest as 'Lainnya'
function aggregateTopN(data, labelKey, countKey, topN = 10, othersLabel = 'Lainnya') {
  const items = Array.isArray(data) ? data.slice() : [];
  items.sort((a, b) => Number(b[countKey] || 0) - Number(a[countKey] || 0));
  const top = items.slice(0, topN);
  const others = items.slice(topN);
  const othersTotal = others.reduce((sum, it) => sum + Number(it[countKey] || 0), 0);
  if (othersTotal > 0) {
    top.push({ [labelKey]: othersLabel, [countKey]: othersTotal });
  }
  return top;
}

// Chart Color Palettes
const colorPalette = {
  primary: ['#dc2626', '#ef4444', '#f87171', '#fca5a5'],
  success: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
  warning: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'],
  info: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
  purple: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'],
  gradient: [
    '#dc2626', '#ef4444', '#f59e0b', '#fbbf24',
    '#10b981', '#34d399', '#3b82f6', '#60a5fa',
    '#8b5cf6', '#a78bfa'
  ]
};

// 1. Status Daily Pie Chart
function initStatusDailyChart() {
  const ctx = document.getElementById('chartStatusDaily');
  if (!ctx) return;
  
  const raw = JSON.parse(ctx.dataset.values || '[]');
  const statusDaily = aggregateTopN(raw, 'status_daily', 'count', 10, 'Lainnya');
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: statusDaily.map(s => s.status_daily || 'N/A'),
      datasets: [{
        data: statusDaily.map(s => s.count),
        backgroundColor: colorPalette.gradient,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: { size: 12, weight: '600' }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// 2. Status Todolist Bar Chart
function initStatusTodolistChart() {
  const ctx = document.getElementById('chartStatusTodolist');
  if (!ctx) return;
  
  const data = JSON.parse(ctx.dataset.values || '[]');
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.status_todolist || 'N/A'),
      datasets: [{
        label: 'Jumlah',
        data: data.map(d => d.count),
        backgroundColor: colorPalette.info[0] + '80',
        borderColor: colorPalette.info[0],
        borderWidth: 2,
        borderRadius: 6,
        barThickness: 22
      }]
    },
    options: {
      indexAxis: 'y', // pakai model horizontal agar label tidak miring
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          padding: 12,
          titleFont: { size: 13, weight: '600' },
          bodyFont: { size: 12 }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { font: { size: 11 } },
          grid: { color: '#e2e8f0' }
        },
        y: {
          ticks: { font: { size: 11, weight: '600' } },
          grid: { display: false }
        }
      }
    }
  });
}

// 3. Status HI Chart
function initStatusHIChart() {
  const ctx = document.getElementById('chartStatusHI');
  if (!ctx) return;
  
  const data = JSON.parse(ctx.dataset.values || '[]');
  
  new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: data.map(d => d.status_hi || 'N/A'),
      datasets: [{
        data: data.map(d => d.count),
        backgroundColor: colorPalette.gradient.map(c => c + '80'),
        borderColor: colorPalette.gradient,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 12,
            font: { size: 11, weight: '600' }
          }
        }
      },
      scales: {
        r: {
          ticks: { display: false },
          grid: { color: '#e2e8f0' }
        }
      }
    }
  });
}

// 4. Top STO Chart
function initTopSTOChart() {
  const ctx = document.getElementById('chartTopSTO');
  if (!ctx) return;
  
  const data = JSON.parse(ctx.dataset.values || '[]');
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.sto),
      datasets: [{
        label: 'Total WO',
        data: data.map(d => d.total),
        backgroundColor: colorPalette.info[1],
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          padding: 12
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { font: { size: 11 } },
          grid: { color: '#e2e8f0' }
        },
        y: {
          ticks: { font: { size: 11, weight: '600' } },
          grid: { display: false }
        }
      }
    }
  });
}

// 5. Daily Trend Chart
function initDailyTrendChart() {
  const ctx = document.getElementById('chartDailyTrend');
  if (!ctx) return;
  
  const data = JSON.parse(ctx.dataset.values || '[]');
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
      }),
      datasets: [{
        label: 'WO per Hari',
        data: data.map(d => d.count),
        borderColor: colorPalette.primary[0],
        backgroundColor: colorPalette.primary[0] + '20',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#ffffff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          padding: 12,
          displayColors: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { font: { size: 11 } },
          grid: { color: '#e2e8f0' }
        },
        x: {
          ticks: { 
            font: { size: 10 },
            maxRotation: 45,
            minRotation: 45
          },
          grid: { display: false }
        }
      }
    }
  });
}

// 6. Activity Teknisi Chart
function initActivityTechChart() {
  const ctx = document.getElementById('chartActivityTech');
  if (!ctx) return;
  
  const raw = JSON.parse(ctx.dataset.values || '[]');
  const data = aggregateTopN(raw, 'activity_teknisi', 'count', 10, 'Lainnya');
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.activity_teknisi),
      datasets: [{
        data: data.map(d => d.count),
        backgroundColor: colorPalette.gradient,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 10,
            font: { size: 10, weight: '600' },
            boxWidth: 12
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.parsed} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// 7. Package Distribution Chart
function initPackageChart() {
  const ctx = document.getElementById('chartPackage');
  if (!ctx) return;
  
  const raw = JSON.parse(ctx.dataset.values || '[]');
  const data = aggregateTopN(raw, 'package_name', 'count', 10, 'Lainnya');
  
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: data.map(d => d.package_name),
      datasets: [{
        data: data.map(d => d.count),
        backgroundColor: [
          colorPalette.success[0],
          colorPalette.info[0],
          colorPalette.warning[0],
          colorPalette.purple[0]
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 12,
            font: { size: 11, weight: '600' }
          }
        }
      }
    }
  });
}

// 8. Regional Performance Chart
function initRegionalChart() {
  const ctx = document.getElementById('chartRegional');
  if (!ctx) return;
  
  const data = JSON.parse(ctx.dataset.values || '[]');
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.regional),
      datasets: [
        {
          label: 'Total WO',
          data: data.map(d => d.total),
          backgroundColor: colorPalette.info[0] + '80',
          borderColor: colorPalette.info[0],
          borderWidth: 2,
          borderRadius: 6
        },
        {
          label: 'Completed',
          data: data.map(d => d.completed),
          backgroundColor: colorPalette.success[0] + '80',
          borderColor: colorPalette.success[0],
          borderWidth: 2,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            padding: 15,
            font: { size: 12, weight: '600' }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { font: { size: 11 } },
          grid: { color: '#e2e8f0' }
        },
        x: {
          ticks: { font: { size: 11, weight: '600' } },
          grid: { display: false }
        }
      }
    }
  });
}

// 9. TTIC Distribution Chart
function initTTICChart() {
  const ctx = document.getElementById('chartTTIC');
  if (!ctx) return;
  
  const data = JSON.parse(ctx.dataset.values || '[]');
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.ttic),
      datasets: [{
        label: 'Jumlah',
        data: data.map(d => d.count),
        backgroundColor: colorPalette.warning[0],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { font: { size: 11 } },
          grid: { color: '#e2e8f0' }
        },
        x: {
          ticks: { font: { size: 11, weight: '600' } },
          grid: { display: false }
        }
      }
    }
  });
}

// 10. Segment Distribution Chart
function initSegmentChart() {
  const ctx = document.getElementById('chartSegment');
  if (!ctx) return;
  
  const raw = JSON.parse(ctx.dataset.values || '[]');
  const data = aggregateTopN(raw, 'segment_alpro', 'count', 10, 'Lainnya');
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.segment_alpro),
      datasets: [{
        data: data.map(d => d.count),
        backgroundColor: colorPalette.gradient,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 12,
            font: { size: 11, weight: '600' }
          }
        }
      }
    }
  });
}

// Refresh Dashboard
async function refreshDashboard() {
  const btn = document.getElementById('btnRefresh');
  const icon = btn.querySelector('.icon');
  
  icon.classList.add('loading-spinner');
  btn.disabled = true;
  
  try {
    const response = await fetch('/dashboard/api/refresh');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Response bukan JSON (mungkin halaman HTML).');
    }
    const data = await response.json();
    
    if (data.success) {
      showToast('Dashboard berhasil diperbarui!', 'success');
      setTimeout(() => location.reload(), 1000);
    } else {
      showToast('Gagal memperbarui dashboard', 'error');
    }
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  } finally {
    icon.classList.remove('loading-spinner');
    btn.disabled = false;
  }
}

// Toast Notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Table Pagination
function initTablePagination() {
  const tables = document.querySelectorAll('[data-paginate]');
  
  tables.forEach(table => {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const perPage = parseInt(table.dataset.perpage || 10);
    let currentPage = 1;
    
    let totalPages = Math.ceil(rows.length / perPage);
    
    // Create pagination controls (numbered pages with ellipsis)
    const pager = document.createElement('div');
    pager.className = 'table-pager';
    const btnPrev = document.createElement('button');
    btnPrev.className = 'btn-prev';
    btnPrev.textContent = '‹';
    const numbers = document.createElement('div');
    numbers.className = 'page-numbers';
    const btnNext = document.createElement('button');
    btnNext.className = 'btn-next';
    btnNext.textContent = '›';
    pager.appendChild(btnPrev);
    pager.appendChild(numbers);
    pager.appendChild(btnNext);
    table.closest('.table-container').appendChild(pager);

    function renderNumbers() {
      numbers.innerHTML = '';
      const addBtn = (n, active = false) => {
        const b = document.createElement('button');
        b.className = 'page-btn';
        if (active) b.classList.add('active');
        b.textContent = String(n);
        b.addEventListener('click', () => showPage(n));
        numbers.appendChild(b);
      };
      const addEllipsis = () => {
        const e = document.createElement('span');
        e.className = 'ellipsis';
        e.textContent = '…';
        numbers.appendChild(e);
      };

      if (totalPages <= 6) {
        for (let i = 1; i <= totalPages; i++) addBtn(i, i === currentPage);
        return;
      }

      addBtn(1, currentPage === 1);
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      if (start > 2) addEllipsis();
      for (let i = start; i <= end; i++) addBtn(i, i === currentPage);
      if (end < totalPages - 1) addEllipsis();
      addBtn(totalPages, currentPage === totalPages);
    }

    function showPage(page) {
      currentPage = Math.max(1, Math.min(totalPages, page));
      const start = (currentPage - 1) * perPage;
      const end = start + perPage;
      rows.forEach((row, i) => {
        row.style.display = (i >= start && i < end) ? '' : 'none';
      });
      btnPrev.disabled = currentPage === 1;
      btnNext.disabled = currentPage === totalPages;
      renderNumbers();
    }

    btnPrev.addEventListener('click', () => showPage(currentPage - 1));
    btnNext.addEventListener('click', () => showPage(currentPage + 1));
    showPage(1);
  });
}

// Table Horizontal Scroll Buttons
function initTableScrollButtons() {
  const containers = document.querySelectorAll('.table-scroll');
  
  containers.forEach(container => {
    const scrollBtns = container.previousElementSibling?.querySelector('.table-scroll-btn');
    if (!scrollBtns) return;
    
    scrollBtns.querySelector('.btn-scroll-left')?.addEventListener('click', () => {
      container.scrollBy({ left: -300, behavior: 'smooth' });
    });
    
    scrollBtns.querySelector('.btn-scroll-right')?.addEventListener('click', () => {
      container.scrollBy({ left: 300, behavior: 'smooth' });
    });
  });
}

// Apply widths to progress bars from data-width attribute to avoid inline EJS CSS issues
function initProgressFillWidths() {
  const fills = document.querySelectorAll('.progress-fill[data-width]');
  fills.forEach(el => {
    const val = parseFloat(el.getAttribute('data-width'));
    if (!isNaN(val)) {
      // Clamp between 0 and 100
      const pct = Math.max(0, Math.min(100, val));
      el.style.width = pct + '%';
    }
  });
}