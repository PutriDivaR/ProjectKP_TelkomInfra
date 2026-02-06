// RIDAR Dashboard - Professional Edition
let charts = {};
let tableData = {
  workOrders: [],
  kendala: [],
  wilayah: []
};
let currentPage = 1;
const rowsPerPage = 10;

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 RIDAR Dashboard Initialized');
  
  initializeDashboard();
  setupEventListeners();
  loadAllData();
});

// ============ INITIALIZATION ============
function initializeDashboard() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  const endInput = document.getElementById('filterEndDate');
  const startInput = document.getElementById('filterStartDate');
  
  if (endInput) endInput.valueAsDate = today;
  if (startInput) startInput.valueAsDate = thirtyDaysAgo;
}

// ============ EVENT LISTENERS ============
function setupEventListeners() {
  // Refresh
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadAllData();
      showToast('Data refreshed successfully', 'success');
    });
  }

  // Filters
  const applyBtn = document.getElementById('applyFilter');
  if (applyBtn) applyBtn.addEventListener('click', applyFilters);

  const resetBtn = document.getElementById('resetFilter');
  if (resetBtn) resetBtn.addEventListener('click', resetFilters);

  // Export
  const exportBtn = document.getElementById('exportExcel');
  if (exportBtn) exportBtn.addEventListener('click', exportToExcel);

  // Table scroll
  const tablePrev = document.getElementById('tablePrev');
  const tableNext = document.getElementById('tableNext');
  if (tablePrev) tablePrev.addEventListener('click', () => scrollTable(-1));
  if (tableNext) tableNext.addEventListener('click', () => scrollTable(1));

  // Pagination
  const pagePrev = document.getElementById('pagePrev');
  const pageNext = document.getElementById('pageNext');
  if (pagePrev) pagePrev.addEventListener('click', () => changePage(-1));
  if (pageNext) pageNext.addEventListener('click', () => changePage(1));
}

// ============ DATA LOADING ============
async function loadAllData() {
  try {
    showLoading(true);
    
    await Promise.all([
      loadSummaryData(),
      loadRegionalSummary(),
      loadWorkFullProcess(),
      loadWorkOrders(),
      loadKendalaTeknisi(),
      loadKendalaPelanggan(),
      loadWilayahData(),
      loadCharts(),
      populateFilterOptions()
    ]);
    
    showLoading(false);
  } catch (error) {
    console.error('❌ Error loading data:', error);
    showToast('Failed to load data: ' + error.message, 'error');
    showLoading(false);
  }
}

// ============ SUMMARY DATA ============
async function loadSummaryData() {
  try {
    const response = await fetch('/api/dashboard/summary');
    const result = await response.json();
    
    if (!result.success) throw new Error(result.message);
    
    const data = result.data;
    
    updateElement('totalWO', data.totalWO);
    updateElement('onProgressWO', data.onProgress);
    updateElement('completeWO', data.complete);
    updateElement('openWO', data.open);
    updateElement('completionRate', data.completionRate + '%');
    updateElement('avgTime', data.avgTime);
    
    console.log('✅ Summary loaded');
  } catch (error) {
    console.error('Error loading summary:', error);
  }
}

// ============ REGIONAL SUMMARY ============
async function loadRegionalSummary() {
  try {
    const response = await fetch('/api/dashboard/regional-summary');
    const result = await response.json();
    
    if (!result.success) throw new Error(result.message);
    
    const data = result.data;
    
    // Render regional cards dengan layout compact
    const container = document.getElementById('regionalSummary');
    if (!container) return;
    
    container.innerHTML = data.map(stats => {
      const completionRate = stats.total > 0 ? ((stats.complete / stats.total) * 100).toFixed(0) : 0;
      const cardClass = completionRate >= 75 ? 'success' : completionRate >= 50 ? 'warning' : 'danger';
      
      return `
        <div class="kpi-card ${cardClass}">
          <div class="kpi-label">${stats.regional}</div>
          <div class="kpi-value">${stats.total}</div>
          <div class="kpi-subtitle" style="font-size:11px;line-height:1.4;">
            ✅ ${stats.complete} | ⏳ ${stats.on_progress} | 📋 ${stats.open}
          </div>
          <div class="kpi-trend ${completionRate >= 75 ? 'trend-up' : 'trend-down'}">
            ${completionRate}% Complete
          </div>
        </div>
      `;
    }).join('');
    
    console.log('✅ Regional summary loaded');
  } catch (error) {
    console.error('Error loading regional summary:', error);
  }
}

// ============ WORK ORDERS ============
async function loadWorkOrders() {
  try {
    const filters = getCurrentFilters();
    const queryString = new URLSearchParams(filters).toString();
    
    const response = await fetch(`/api/dashboard/work-orders?${queryString}`);
    const result = await response.json();
    
    if (!result.success) throw new Error(result.message);
    
    tableData.workOrders = result.data;
    currentPage = 1;
    renderWorkOrdersTable();
    
    console.log('✅ Work orders loaded:', result.data.length);
  } catch (error) {
    console.error('Error loading work orders:', error);
    const tbody = document.getElementById('workOrdersBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="10" class="empty-state">Error: ${error.message}</td></tr>`;
  }
}

function renderWorkOrdersTable() {
  const tbody = document.getElementById('workOrdersBody');
  if (!tbody) return;
  
  const data = tableData.workOrders;
  
  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text">No work orders found</div>
        </td>
      </tr>
    `;
    updatePagination(0);
    return;
  }
  
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = data.slice(start, end);
  
  tbody.innerHTML = pageData.map(wo => `
    <tr>
      <td><strong>${escapeHtml(wo.wonum)}</strong></td>
      <td>${escapeHtml(wo.nama)}</td>
      <td>${escapeHtml(wo.ticket_id)}</td>
      <td>${escapeHtml(wo.package_name)}</td>
      <td>${escapeHtml(wo.regional)}</td>
      <td>${escapeHtml(wo.sto)}</td>
      <td><span class="status-link" style="cursor:pointer" onclick="openDaily('${wo.wonum}')">${getStatusBadge(wo.status_daily)}</span></td> 
      <td>${escapeHtml(wo.odp_inputan || '-')}</td>
      <td>${formatDate(wo.created_at)}</td>
      <td>
        <button class="btn-action" onclick="viewDetail('${wo.wonum}')">
          View
        </button>
      </td>
    </tr>
  `).join('');
  
  updatePagination(totalPages);
}

// ============ WORK FULL PROCESS ============
async function loadWorkFullProcess() {
  try {
    const response = await fetch('/api/dashboard/work-full-process');
    const result = await response.json();
    
    if (!result.success) throw new Error(result.message);
    
    const tbody = document.getElementById('workFullProcessBody');
    if (!tbody) return;
    
    const { regional, nasional } = result.data;
    
    if (!regional || regional.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No data available</td></tr>';
      return;
    }
    
    // Render regional rows
    const regionalRows = regional.map(r => `
      <tr>
        <td><strong>${escapeHtml(r.regional)}</strong></td>
        <td>${r.kdl_plg.toLocaleString()}</td>
        <td>${r.kdl_tek.toLocaleString()}</td>
        <td>${r.kdl_sys}</td>
        <td>${r.pending.toLocaleString()}</td>
        <td>${r.continue_count.toLocaleString()}</td>
        <td>${r.cancel.toLocaleString()}</td>
        <td>${r.complete.toLocaleString()}</td>
        <td><strong>${r.total.toLocaleString()}</strong></td>
      </tr>
    `).join('');
    
    // Render nasional row
    const nasionalRow = `
      <tr style="background:#f1f5f9;font-weight:700">
        <td><strong>NASIONAL</strong></td>
        <td>${nasional.kdl_plg.toLocaleString()}</td>
        <td>${nasional.kdl_tek.toLocaleString()}</td>
        <td>${nasional.kdl_sys}</td>
        <td>${nasional.pending.toLocaleString()}</td>
        <td>${nasional.continue_count.toLocaleString()}</td>
        <td>${nasional.cancel.toLocaleString()}</td>
        <td>${nasional.complete.toLocaleString()}</td>
        <td><strong>${nasional.total.toLocaleString()}</strong></td>
      </tr>
    `;
    
    tbody.innerHTML = regionalRows + nasionalRow;
    
    console.log('✅ Work Full Process loaded');
  } catch (error) {
    console.error('Error loading work full process:', error);
    const tbody = document.getElementById('workFullProcessBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="empty-state">Error loading data</td></tr>';
  }
}

// ============ KENDALA TEKNISI ============
async function loadKendalaTeknisi() {
  try {
    const response = await fetch('/api/dashboard/kendala-teknisi');
    const result = await response.json();
    
    if (!result.success) throw new Error(result.message);
    
    tableData.kendala = result.data;
    renderKendalaTeknisiTable();
    
    console.log('✅ Kendala Teknisi loaded:', result.data.length);
  } catch (error) {
    console.error('Error loading kendala teknisi:', error);
    const tbody = document.getElementById('kendalaTeknisiBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="9" class="empty-state">Error: ${error.message}</td></tr>`;
  }
}

function renderKendalaTeknisiTable() {
  const tbody = document.getElementById('kendalaTeknisiBody');
  if (!tbody) return;
  
  const data = tableData.kendala;
  
  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <div class="empty-state-text">No kendala teknisi found</div>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = data.map(k => `
    <tr>
      <td><strong>${escapeHtml(k.wonum)}</strong></td>
      <td>${escapeHtml(k.unit_inisiator)}</td>
      <td>${escapeHtml(k.activity || k.activity_name)}</td>
      <td>${getStatusBadge(k.status_todolist)}</td>
      <td>${escapeHtml(k.sto)}</td>
      <td>${escapeHtml(k.segment_alpro || '-')}</td>
      <td>${escapeHtml(k.proses || '-')}</td>
      <td>${escapeHtml(k.solusi_progress || '-')}</td>
      <td>${formatDate(k.created_at)}</td>
    </tr>
  `).join('');
}

// ============ KENDALA PELANGGAN ============
async function loadKendalaPelanggan() {
  try {
    const response = await fetch('/api/dashboard/kendala-pelanggan');
    const result = await response.json();
    
    if (!result.success) throw new Error(result.message);
    
    renderKendalaPelangganTable(result.data);
    
    console.log('✅ Kendala Pelanggan loaded:', result.data.length);
  } catch (error) {
    console.error('Error loading kendala pelanggan:', error);
    const tbody = document.getElementById('kendalaPelangganBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="10" class="empty-state">Error: ${error.message}</td></tr>`;
  }
}

function renderKendalaPelangganTable(data) {
  const tbody = document.getElementById('kendalaPelangganBody');
  if (!tbody) return;
  
  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">
          <div class="empty-state-icon">👥</div>
          <div class="empty-state-text">No kendala pelanggan found</div>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = data.map(kp => `
    <tr>
      <td><strong>${escapeHtml(kp.wonum)}</strong></td>
      <td>${escapeHtml(kp.customer_name || '-')}</td>
      <td>${escapeHtml(kp.regional || '-')}</td>
      <td>${escapeHtml(kp.sto)}</td>
      <td>${formatDate(kp.tanggal_input)}</td>
      <td>${escapeHtml(kp.ttd_kb || '-')}</td>
      <td><span class="status-badge status-${kp.status_hi ? kp.status_hi.toLowerCase() : 'open'}">${escapeHtml(kp.status_hi || '-')}</span></td>
      <td>${escapeHtml(kp.ttic || '-')}</td>
      <td>${escapeHtml(kp.keterangan || '-')}</td>
      <td>${escapeHtml(kp.nama_teknis || '-')}</td>
    </tr>
  `).join('');
}

// ============ WILAYAH DATA ============
async function loadWilayahData() {
  try {
    const [wilayahRes, woRes] = await Promise.all([
      fetch('/api/dashboard/wilayah'),
      fetch('/api/dashboard/work-orders')
    ]);
    
    const wilayahResult = await wilayahRes.json();
    const woResult = await woRes.json();
    
    if (!wilayahResult.success || !woResult.success) throw new Error('Failed to load data');
    
    const wilayahData = wilayahResult.data;
    const workOrders = woResult.data;
    
    // Calculate stats per STO
    const stoStats = {};
    workOrders.forEach(wo => {
      const sto = wo.sto;
      if (!stoStats[sto]) {
        stoStats[sto] = { total: 0, complete: 0, onProgress: 0 };
      }
      stoStats[sto].total++;
      if (wo.status_daily === 'COMPLETE') stoStats[sto].complete++;
      if (wo.status_daily === 'ON_PROGRESS') stoStats[sto].onProgress++;
    });
    
    const tbody = document.getElementById('wilayahBody');
    if (!tbody) return;
    
    tbody.innerHTML = wilayahData.map(w => {
      const stats = stoStats[w.sto] || { total: 0, complete: 0, onProgress: 0 };
      const rate = stats.total > 0 ? ((stats.complete / stats.total) * 100).toFixed(1) : 0;
      
      return `
        <tr>
          <td><strong>${escapeHtml(w.sto)}</strong></td>
          <td>${escapeHtml(w.uic)}</td>
          <td>${escapeHtml(w.pic)}</td>
          <td>${escapeHtml(w.leader)}</td>
          <td>${stats.total}</td>
          <td>${stats.complete}</td>
          <td>${stats.onProgress}</td>
          <td>
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill ${getProgressClass(rate)}" style="width: ${rate}%"></div>
              </div>
              <span class="progress-text">${rate}%</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    console.log('✅ Wilayah loaded');
  } catch (error) {
    console.error('Error loading wilayah:', error);
  }
}

// ============ CHARTS ============
async function loadCharts() {
  try {
    await Promise.all([
      createStatusChart(),
      createSTOChart(),
      createTrendChart(),
      createPackageChart(),
      createCompletionChart()
    ]);
    console.log('✅ All charts loaded');
  } catch (error) {
    console.error('Error loading charts:', error);
  }
}

async function createStatusChart() {
  const response = await fetch('/api/dashboard/charts/status-distribution');
  const result = await response.json();
  if (!result.success) return;
  
  const ctx = document.getElementById('statusChart');
  if (!ctx) return;
  
  if (charts.status) charts.status.destroy();
  
  const colors = {
    'OPEN': '#3b82f6',
    'ON_PROGRESS': '#f59e0b',
    'COMPLETE': '#10b981',
    'CANCEL': '#ef4444'
  };
  
  charts.status = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: result.data.map(d => d.status),
      datasets: [{
        data: result.data.map(d => d.count),
        backgroundColor: result.data.map(d => colors[d.status] || '#94a3b8'),
        borderWidth: 3,
        borderColor: '#fff'
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

async function createSTOChart() {
  const response = await fetch('/api/dashboard/charts/sto-distribution');
  const result = await response.json();
  if (!result.success) return;
  
  const ctx = document.getElementById('stoChart');
  if (!ctx) return;
  
  if (charts.sto) charts.sto.destroy();
  
  charts.sto = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: result.data.map(d => d.sto),
      datasets: [
        {
          label: 'Complete',
          data: result.data.map(d => d.complete),
          backgroundColor: '#10b981',
          borderRadius: 6
        },
        {
          label: 'On Progress',
          data: result.data.map(d => d.on_progress),
          backgroundColor: '#f59e0b',
          borderRadius: 6
        },
        {
          label: 'Open',
          data: result.data.map(d => d.open),
          backgroundColor: '#3b82f6',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, beginAtZero: true }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 10, font: { size: 11, weight: '600' } }
        }
      }
    }
  });
}

async function createTrendChart() {
  const response = await fetch('/api/dashboard/charts/wo-trend');
  const result = await response.json();
  if (!result.success) return;
  
  const ctx = document.getElementById('trendChart');
  if (!ctx) return;
  
  if (charts.trend) charts.trend.destroy();
  
  // Fill in missing dates for last 30 days with REAL data
  const labels = [];
  const data = [];
  const today = new Date();
  const dataMap = {};
  
  // Map existing data
  result.data.forEach(item => {
    dataMap[item.date] = item.count;
  });
  
  // Fill all 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    labels.push(date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));
    data.push(dataMap[dateStr] || 0);
  }
  
  charts.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'New Work Orders',
        data: data,
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#dc2626',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              return 'Work Orders: ' + context.parsed.y;
            }
          }
        }
      }
    }
  });
}

async function createPackageChart() {
  const response = await fetch('/api/dashboard/charts/package-distribution');
  const result = await response.json();
  if (!result.success) return;
  
  const ctx = document.getElementById('packageChart');
  if (!ctx) return;
  
  if (charts.package) charts.package.destroy();
  
  charts.package = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: result.data.map(d => d.package_name),
      datasets: [{
        data: result.data.map(d => d.count),
        backgroundColor: [
          '#dc2626',
          '#f59e0b',
          '#10b981',
          '#3b82f6',
          '#8b5cf6',
          '#ec4899'
        ],
        borderWidth: 3,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 10, font: { size: 11, weight: '600' } }
        }
      }
    }
  });
}

async function createCompletionChart() {
  const response = await fetch('/api/dashboard/charts/sto-distribution');
  const result = await response.json();
  if (!result.success) return;
  
  const ctx = document.getElementById('completionChart');
  if (!ctx) return;
  
  if (charts.completion) charts.completion.destroy();
  
  const completionRates = result.data.map(d => {
    const total = parseInt(d.complete) + parseInt(d.on_progress) + parseInt(d.open);
    return total > 0 ? ((d.complete / total) * 100).toFixed(1) : 0;
  });
  
  charts.completion = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: result.data.map(d => d.sto),
      datasets: [{
        label: 'Completion Rate (%)',
        data: completionRates,
        backgroundColor: completionRates.map(rate => 
          rate >= 75 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444'
        ),
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { beginAtZero: true, max: 100 }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// ============ FILTER FUNCTIONS ============
async function populateFilterOptions() {
  try {
    const [woRes, wilayahRes] = await Promise.all([
      fetch('/api/dashboard/work-orders'),
      fetch('/api/dashboard/wilayah')
    ]);
    
    const woResult = await woRes.json();
    const wilayahResult = await wilayahRes.json();
    
    if (woResult.success && wilayahResult.success) {
      // Populate Regional
      const regionals = [...new Set(woResult.data.map(wo => wo.regional))];
      const regionalSelect = document.getElementById('filterRegional');
      if (regionalSelect) {
        regionals.forEach(r => {
          const option = document.createElement('option');
          option.value = r;
          option.textContent = r;
          regionalSelect.appendChild(option);
        });
      }
      
      // Populate STO
      const stoSelect = document.getElementById('filterSTO');
      if (stoSelect) {
        wilayahResult.data.forEach(w => {
          const option = document.createElement('option');
          option.value = w.sto;
          option.textContent = w.sto;
          stoSelect.appendChild(option);
        });
      }
      
      // Populate Package
      const packages = [...new Set(woResult.data.map(wo => wo.package_name))];
      const packageSelect = document.getElementById('filterPackage');
      if (packageSelect) {
        packages.forEach(p => {
          const option = document.createElement('option');
          option.value = p;
          option.textContent = p;
          packageSelect.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('Error populating filters:', error);
  }
}

function getCurrentFilters() {
  return {
    regional: document.getElementById('filterRegional')?.value || '',
    sto: document.getElementById('filterSTO')?.value || '',
    status: document.getElementById('filterStatus')?.value || '',
    startDate: document.getElementById('filterStartDate')?.value || '',
    endDate: document.getElementById('filterEndDate')?.value || ''
  };
}

function applyFilters() {
  loadWorkOrders();
  showToast('Filters applied', 'success');
}

function resetFilters() {
  document.getElementById('filterRegional').value = '';
  document.getElementById('filterSTO').value = '';
  document.getElementById('filterStatus').value = '';
  document.getElementById('filterPackage').value = '';
  
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
  document.getElementById('filterEndDate').valueAsDate = today;
  document.getElementById('filterStartDate').valueAsDate = thirtyDaysAgo;
  
  loadWorkOrders();
  showToast('Filters reset', 'info');
}

// ============ TABLE FUNCTIONS ============
function scrollTable(direction) {
  const scroll = document.querySelector('.table-scroll');
  if (!scroll) return;
  const step = scroll.clientWidth - 100;
  scroll.scrollBy({ left: direction * step, behavior: 'smooth' });
}

function changePage(direction) {
  const totalPages = Math.ceil(tableData.workOrders.length / rowsPerPage);
  const newPage = currentPage + direction;
  
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    renderWorkOrdersTable();
  }
}

function updatePagination(totalPages) {
  const pageInfo = document.getElementById('pageInfo');
  const prevBtn = document.getElementById('pagePrev');
  const nextBtn = document.getElementById('pageNext');
  
  if (pageInfo) pageInfo.textContent = `Page ${currentPage} / ${Math.max(1, totalPages)}`;
  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}

// ============ UTILITY FUNCTIONS ============
function updateElement(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getStatusBadge(status) {
  const statusMap = {
    'OPEN': 'status-open',
    'ON_PROGRESS': 'status-on_progress',
    'OGP': 'status-ogp',
    'COMPLETE': 'status-complete',
    'CANCEL': 'status-cancel'
  };
  const className = statusMap[status] || 'status-open';
  return `<span class="status-badge ${className}">${status}</span>`;
}

function getProgressClass(rate) {
  if (rate >= 75) return 'complete';
  if (rate >= 50) return 'high';
  if (rate >= 25) return 'medium';
  return 'low';
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function showLoading(show) {
  document.body.style.cursor = show ? 'wait' : 'default';
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 3000);
}

function viewDetail(wonum) {
  showToast(`Viewing details for ${wonum}`, 'info');
  // TODO: Implement detail modal
}

function openDaily(wonum) {
  // Jika WONUM diberikan, buka detail daily untuk WO tersebut. Jika tidak, buka halaman Daily utama.
  if (wonum) {
    window.location.href = `/daily/${wonum}`;
  } else {
    window.location.href = '/daily';
  }
}

function exportToExcel() {
  showToast('Export feature coming soon', 'info');
  // TODO: Implement Excel export
}