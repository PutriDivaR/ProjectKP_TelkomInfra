// Dashboard JavaScript - Modern Charts & Interactions with Filters & Export
document.addEventListener('DOMContentLoaded', function() {
  
  // Initialize all charts
  initStatusDailyChart();
  initStatusTodolistChart();
  initStatusHIChart();
  initTopSTOChart();
  initDailyTrendChart();
  initCompletionTrendChart();
  initActivityTechChart();
  initPackageChart();
  // initSegmentChart(); // removed
  initTTDChart();
  
  // Apply progress widths from data attributes
  initProgressFillWidths();
  
  // Refresh button
  const btnRefresh = document.getElementById('btnRefresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', refreshDashboard);
  }
  
  // Filter form handling
  const filterForm = document.getElementById('filterForm');
  if (filterForm) {
    filterForm.addEventListener('submit', handleFilterSubmit);
  }

  // Clear filters button
  const btnClearFilters = document.getElementById('btnClearFilters');
  if (btnClearFilters) {
    btnClearFilters.addEventListener('click', clearFilters);
  }

  // Export buttons
  const btnExportPDF = document.getElementById('btnExportPDF');
  if (btnExportPDF) {
    btnExportPDF.addEventListener('click', exportToPDF);
  }

  const btnExportExcel = document.getElementById('btnExportExcel');
  if (btnExportExcel) {
    btnExportExcel.addEventListener('click', exportToExcel);
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
      indexAxis: 'y',
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

// 6. NEW - Completion Rate Trend Chart
function initCompletionTrendChart() {
  const ctx = document.getElementById('chartCompletionTrend');
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
        label: 'Completion Rate (%)',
        data: data.map(d => d.rate),
        borderColor: colorPalette.success[0],
        backgroundColor: colorPalette.success[0] + '20',
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
          displayColors: false,
          callbacks: {
            label: function(context) {
              return `Completion: ${context.parsed.y}%`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { 
            font: { size: 11 },
            callback: function(value) {
              return value + '%';
            }
          },
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

// 7. Activity Tech Chart
function initActivityTechChart() {
  const ctx = document.getElementById('chartActivityTech');
  if (!ctx) return;
  
  const data = JSON.parse(ctx.dataset.values || '[]');
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.activity_teknisi || 'N/A'),
      datasets: [{
        label: 'Jumlah',
        data: data.map(d => d.count),
        backgroundColor: colorPalette.purple[0],
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
          ticks: { font: { size: 10, weight: '600' } },
          grid: { display: false }
        }
      }
    }
  });
}

// 8. Package Distribution Chart
function initPackageChart() {
  const ctx = document.getElementById('chartPackage');
  if (!ctx) return;
  
  const raw = JSON.parse(ctx.dataset.values || '[]');
  const data = aggregateTopN(raw, 'package_name', 'count', 10, 'Lainnya');
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.package_name),
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

// Segment chart removed

// 10. NEW - TTD KB Distribution Chart
function initTTDChart() {
  const ctx = document.getElementById('chartTTD');
  if (!ctx) return;
  
  const data = JSON.parse(ctx.dataset.values || '[]');
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.ttd_kb || 'N/A'),
      datasets: [{
        label: 'Jumlah',
        data: data.map(d => d.count),
        backgroundColor: colorPalette.warning[0] + '80',
        borderColor: colorPalette.warning[0],
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
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
        y: {
          beginAtZero: true,
          ticks: { font: { size: 11 } },
          grid: { color: '#e2e8f0' }
        },
        x: {
          ticks: { 
            font: { size: 10, weight: '600' },
            maxRotation: 45,
            minRotation: 45
          },
          grid: { display: false }
        }
      }
    }
  });
}

// Filter Form Handler
function handleFilterSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const params = new URLSearchParams();

  for (const [key, value] of formData.entries()) {
    if (value) {
      params.append(key, value);
    }
  }

  window.location.href = '/dashboard?' + params.toString();
}

// Clear Filters
function clearFilters() {
  window.location.href = '/dashboard';
}

// ============ EXPORT TO PDF - PROFESSIONAL VERSION ============
async function exportToPDF() {
  const btn = document.getElementById('btnExportPDF');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="loading-spinner"></span> Generating PDF...';
  btn.disabled = true;

  try {
    // Import jsPDF and html2canvas
    const { jsPDF } = window.jspdf;
    
    // Create new PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Get current date
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const timeStr = now.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // ============ PAGE 1: COVER & KPI ============
    
    // Header/Cover
    pdf.setFillColor(220, 38, 38);
    pdf.rect(0, 0, pageWidth, 50, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'bold');
    pdf.text('LAPORAN DASHBOARD RIDAR', pageWidth / 2, 20, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.text('Real-time Work Order Monitoring & Analytics', pageWidth / 2, 30, { align: 'center' });
    pdf.text(`Tanggal Laporan: ${dateStr} | ${timeStr}`, pageWidth / 2, 40, { align: 'center' });

    yPosition = 60;

    // Get active filters
    const urlParams = new URLSearchParams(window.location.search);
    const hasFilters = urlParams.toString().length > 0;
    
    if (hasFilters) {
      pdf.setFillColor(254, 243, 199);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 15, 'F');
      
      pdf.setTextColor(146, 64, 14);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text('Filter Aktif:', margin + 5, yPosition + 6);
      
      pdf.setFont(undefined, 'normal');
      let filterText = [];
      if (urlParams.get('search')) filterText.push(`Search: ${urlParams.get('search')}`);
      if (urlParams.get('sto_filter')) filterText.push(`STO: ${urlParams.get('sto_filter')}`);
      if (urlParams.get('regional_filter')) filterText.push(`Regional: ${urlParams.get('regional_filter')}`);
      if (urlParams.get('status_filter')) filterText.push(`Status: ${urlParams.get('status_filter')}`);
      if (urlParams.get('date_from')) filterText.push(`Dari: ${urlParams.get('date_from')}`);
      if (urlParams.get('date_to')) filterText.push(`Sampai: ${urlParams.get('date_to')}`);
      
      pdf.text(filterText.join(' | '), margin + 5, yPosition + 11);
      yPosition += 20;
    }

    // KPI Cards
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('KEY PERFORMANCE INDICATORS', margin, yPosition);
    yPosition += 10;

    // Get KPI values from page
    const kpiCards = document.querySelectorAll('.kpi-card');
    const kpiData = [];
    kpiCards.forEach(card => {
      const label = card.querySelector('.kpi-label')?.textContent.trim();
      const value = card.querySelector('.kpi-value')?.textContent.trim();
      const subtitle = card.querySelector('.kpi-subtitle')?.textContent.trim();
      if (label && value) {
        kpiData.push({ label, value, subtitle });
      }
    });

    // Draw KPI boxes
    const kpiBoxWidth = (pageWidth - 2 * margin - 10) / 3;
    const kpiBoxHeight = 25;
    
    for (let i = 0; i < kpiData.length; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = margin + col * (kpiBoxWidth + 5);
      const y = yPosition + row * (kpiBoxHeight + 5);

      // Box background
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(x, y, kpiBoxWidth, kpiBoxHeight, 2, 2, 'FD');

      // Label
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(100, 116, 139);
      pdf.text(kpiData[i].label.toUpperCase(), x + 5, y + 6);

      // Value
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(30, 41, 59);
      pdf.text(kpiData[i].value, x + 5, y + 15);

      // Subtitle
      pdf.setFontSize(7);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(148, 163, 184);
      pdf.text(kpiData[i].subtitle, x + 5, y + 21);
    }

    yPosition += Math.ceil(kpiData.length / 3) * (kpiBoxHeight + 5) + 15;

    // ============ WORKFALL TABLE ============
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('WORK STATUS DISTRIBUTION BY STO', margin, yPosition);
    yPosition += 8;

    // Get workfall data from table
    const workfallTable = document.querySelector('.table-work-full');
    if (workfallTable) {
      const headers = ['STO', 'Startwork', 'Complete', 'Workfail', 'Total', 'Completion %'];
      const rows = [];
      
      const tbody = workfallTable.querySelector('tbody');
      const trs = tbody.querySelectorAll('tr');
      
      trs.forEach((tr, idx) => {
        if (idx < trs.length - 1) { // Skip total row for now
          const tds = tr.querySelectorAll('td');
          if (tds.length >= 5) {
            const completionText = tds[5].querySelector('.progress-text')?.textContent.trim() || '0%';
            rows.push([
              tds[0].textContent.trim(),
              tds[1].textContent.trim(),
              tds[2].textContent.trim(),
              tds[3].textContent.trim(),
              tds[4].textContent.trim(),
              completionText
            ]);
          }
        }
      });

      // Draw full table (auto-paginates across pages)
      pdf.autoTable({
        startY: yPosition,
        head: [headers],
        body: rows,
        theme: 'grid',
        headStyles: {
          fillColor: [220, 38, 38],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { left: margin, right: margin },
        showHead: 'everyPage'
      });

      // Add total row on last page
      const lastTr = trs[trs.length - 1];
      const lastTds = lastTr.querySelectorAll('td');
      if (lastTds.length >= 5) {
        const totalRow = [[
          lastTds[0].textContent.trim(),
          lastTds[1].textContent.trim(),
          lastTds[2].textContent.trim(),
          lastTds[3].textContent.trim(),
          lastTds[4].textContent.trim(),
          lastTds[5].textContent.trim()
        ]];

        pdf.autoTable({
          startY: pdf.lastAutoTable.finalY + 5,
          body: totalRow,
          theme: 'grid',
          bodyStyles: {
            fillColor: [254, 243, 199],
            textColor: [146, 64, 14],
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: 3
          },
          margin: { left: margin, right: margin }
        });

        // After finishing all table content, add charts on a new page
        pdf.addPage();
        yPosition = margin;

        // Charts Page Header
        pdf.setFillColor(220, 38, 38);
        pdf.rect(0, 0, pageWidth, 15, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('VISUALISASI DATA & ANALISIS', pageWidth / 2, 10, { align: 'center' });

        yPosition = 25;

        // Capture charts as images (placed after tables)
        const charts = [
          { id: 'chartStatusDaily', title: 'Status Daily Distribution' },
          { id: 'chartTopSTO', title: 'Top 10 STO by WO Count' },
          { id: 'chartDailyTrend', title: 'WO Trend (30 Days)' },
          { id: 'chartCompletionTrend', title: 'Completion Rate Trend' }
        ];

        for (let i = 0; i < charts.length; i++) {
          const canvas = document.getElementById(charts[i].id);
          if (canvas) {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = (pageWidth - 2 * margin - 10) / 2;
            const imgHeight = 60;

            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = margin + col * (imgWidth + 10);
            const y = yPosition + row * (imgHeight + 15);

            // Title
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(9);
            pdf.setFont(undefined, 'bold');
            pdf.text(charts[i].title, x, y - 2);

            // Chart image
            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
          }
        }
      }
    }

    // Footer on all pages
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.setFont(undefined, 'normal');
      pdf.text(
        `Halaman ${i} dari ${pageCount} | Generated on ${dateStr} at ${timeStr}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    const filename = `RIDAR_Dashboard_${now.toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);

    showToast('Laporan PDF berhasil di-generate!', 'success');

  } catch (error) {
    console.error('PDF Export Error:', error);
    showToast('Error generating PDF: ' + error.message, 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// ============ EXPORT TO EXCEL - PROFESSIONAL VERSION ============
async function exportToExcel() {
  const btn = document.getElementById('btnExportExcel');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="loading-spinner"></span> Generating Excel...';
  btn.disabled = true;

  try {
    // Get current filter parameters
    const urlParams = new URLSearchParams(window.location.search);
    const response = await fetch('/dashboard/export/excel?' + urlParams.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Export failed');
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // ============ SHEET 1: SUMMARY (KPI & WORKFALL) ============
    const summaryData = [];
    
    // Header
    summaryData.push(['LAPORAN DASHBOARD RIDAR']);
    summaryData.push(['Real-time Work Order Monitoring & Analytics']);
    summaryData.push([`Tanggal Laporan: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`]);
    summaryData.push([]);

    // Active filters
    if (urlParams.toString().length > 0) {
      summaryData.push(['FILTER AKTIF:']);
      if (urlParams.get('search')) summaryData.push(['Search', urlParams.get('search')]);
      if (urlParams.get('sto_filter')) summaryData.push(['STO', urlParams.get('sto_filter')]);
      if (urlParams.get('regional_filter')) summaryData.push(['Regional', urlParams.get('regional_filter')]);
      if (urlParams.get('status_filter')) summaryData.push(['Status', urlParams.get('status_filter')]);
      if (urlParams.get('date_from')) summaryData.push(['Dari Tanggal', urlParams.get('date_from')]);
      if (urlParams.get('date_to')) summaryData.push(['Sampai Tanggal', urlParams.get('date_to')]);
      summaryData.push([]);
    }

    // KPI
    summaryData.push(['KEY PERFORMANCE INDICATORS']);
    const kpiCards = document.querySelectorAll('.kpi-card');
    kpiCards.forEach(card => {
      const label = card.querySelector('.kpi-label')?.textContent.trim();
      const value = card.querySelector('.kpi-value')?.textContent.trim();
      if (label && value) {
        summaryData.push([label, value]);
      }
    });
    summaryData.push([]);

    // Workfall Table
    summaryData.push(['WORK STATUS DISTRIBUTION BY STO']);
    summaryData.push(['STO', 'Startwork', 'Complete', 'Workfail', 'Total', 'Completion %']);
    
    const workfallTable = document.querySelector('.table-work-full tbody');
    if (workfallTable) {
      workfallTable.querySelectorAll('tr').forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length >= 5) {
          const completionText = tds[5].querySelector('.progress-text')?.textContent.trim() || tds[5].textContent.trim();
          summaryData.push([
            tds[0].textContent.trim(),
            tds[1].textContent.trim(),
            tds[2].textContent.trim(),
            tds[3].textContent.trim(),
            tds[4].textContent.trim(),
            completionText
          ]);
        }
      });
    }

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

    // Style summary sheet
    wsSummary['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // ============ SHEET 2: DETAILED DATA ============
    const data = result.data;
    
    const detailedData = data.map(row => ({
      'WO Number': row.wonum,
      'Nama Pelanggan': row.nama,
      'STO': row.sto,
      'Regional': row.regional,
      'Status Daily': row.status_daily,
      'Package': row.package_name,
      'ODP Todolist': row.odp_todolist,
      'Created At': row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : '',
      'Status HI': row.status_hi,
      'TTIC': row.ttic,
      'TTD KB': row.ttd_kb,
      'Status Todolist': row.status_todolist,
      'Activity Teknisi': row.activity_teknisi,
      'Segment': row.segment_alpro
    }));

    const wsDetailed = XLSX.utils.json_to_sheet(detailedData);

    // Auto-size columns for detailed sheet
    const detailedCols = [
      { wch: 15 },  // WO Number
      { wch: 25 },  // Nama
      { wch: 10 },  // STO
      { wch: 15 },  // Regional
      { wch: 15 },  // Status Daily
      { wch: 15 },  // Package
      { wch: 20 },  // ODP
      { wch: 20 },  // Created
      { wch: 12 },  // Status HI
      { wch: 12 },  // TTIC
      { wch: 12 },  // TTD KB
      { wch: 15 },  // Status Todolist
      { wch: 25 },  // Activity
      { wch: 15 }   // Segment
    ];
    wsDetailed['!cols'] = detailedCols;

    XLSX.utils.book_append_sheet(wb, wsDetailed, 'Detailed Data');

    // Generate filename
    const filename = `RIDAR_Data_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Write and download
    XLSX.writeFile(wb, filename);
    
    showToast('Data berhasil di-export ke Excel!', 'success');

  } catch (error) {
    console.error('Excel Export Error:', error);
    showToast('Error export Excel: ' + error.message, 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
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
    const container = table.closest('.table-container');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const searchInput = container.querySelector('.table-search');
    const perPageSelect = container.querySelector('.table-perpage');
    let perPage = parseInt(table.dataset.perpage || (perPageSelect?.value || 10));
    let currentPage = 1;
    let filteredRows = rows.slice();

    let totalPages = Math.max(1, Math.ceil(filteredRows.length / perPage));

    // Create pagination controls
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
    container.appendChild(pager);

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
      rows.forEach(row => { row.style.display = 'none'; });
      filteredRows.forEach((row, i) => {
        if (i >= start && i < end) row.style.display = '';
      });
      btnPrev.disabled = currentPage === 1;
      btnNext.disabled = currentPage === totalPages;
      renderNumbers();
    }

    function recalcPages() {
      totalPages = Math.max(1, Math.ceil(filteredRows.length / perPage));
    }

    // Hook up search
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        filteredRows = rows.filter(r => r.innerText.toLowerCase().includes(q));
        recalcPages();
        showPage(1);
      });
    }

    // Hook up per-page selector
    if (perPageSelect) {
      perPageSelect.addEventListener('change', () => {
        perPage = parseInt(perPageSelect.value) || 10;
        recalcPages();
        showPage(1);
      });
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

// Apply widths to progress bars
function initProgressFillWidths() {
  const fills = document.querySelectorAll('.progress-fill[data-width]');
  fills.forEach(el => {
    const val = parseFloat(el.getAttribute('data-width'));
    if (!isNaN(val)) {
      const pct = Math.max(0, Math.min(100, val));
      el.style.width = pct + '%';
    }
  });
}