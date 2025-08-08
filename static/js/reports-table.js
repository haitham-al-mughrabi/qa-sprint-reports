// static/js/reports-table.js
// Reports Table and Search Functions

// --- Enhanced Reports Table Functions with Filtering ---

// Debounced search to reduce API calls
let searchTimeout;

function debounceSearch(func, delay) {
    return function (...args) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => func.apply(this, args), delay);
    };
}

const debouncedSearchReports = debounceSearch(searchReports, 300);

async function searchReports() {
    const searchTerm = document.getElementById('searchInput')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const reportTypeFilter = document.getElementById('reportTypeFilter')?.value || '';
    const sortBy = document.getElementById('sortBy')?.value || 'reportDate';
    const sortOrder = document.getElementById('sortOrder')?.value || 'desc';

    console.log('Searching reports with filters:', {
        searchTerm,
        statusFilter,
        reportTypeFilter,
        sortBy,
        sortOrder
    });

    try {
        // Build query parameters
        const params = new URLSearchParams({
            page: (window.currentPage || 1).toString(),
            limit: (window.reportsPerPage || 10).toString(),
            sortBy: sortBy,
            sortOrder: sortOrder
        });

        if (searchTerm) params.append('search', searchTerm);
        if (statusFilter) params.append('status', statusFilter);
        if (reportTypeFilter) params.append('reportType', reportTypeFilter);

        const response = await fetch(`${window.API_URL || '/api/reports'}?${params}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Search results:', data);

        // Update the reports cache and display
        window.allReportsCache = data;
        displayReports(data);
        updatePagination(data);

    } catch (error) {
        console.error('Error searching reports:', error);
        if (typeof showToast === 'function') {
            showToast('Error searching reports: ' + error.message, 'error');
        }
    }
}

function displayReports(data) {
    const tbody = document.getElementById('reportsTableBody');
    if (!tbody) {
        console.error('Reports table body not found');
        return;
    }

    const reports = data.reports || data || [];

    if (reports.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <div class="empty-state">
                        <i class="fas fa-search fa-3x text-muted mb-3"></i>
                        <h5>No reports found</h5>
                        <p class="text-muted">Try adjusting your search criteria or create a new report.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = reports.map(report => {
        const statusClass = getStatusClass(report.status);
        const reportTypeClass = getReportTypeClass(report.reportType);
        
        return `
            <tr>
                <td>
                    <div class="report-info">
                        <strong>${report.portfolioName || 'N/A'}</strong>
                        <small class="text-muted d-block">${report.projectName || 'N/A'}</small>
                    </div>
                </td>
                <td>
                    <span class="badge badge-${reportTypeClass}">
                        ${getReportTypeText(report.reportType)}
                    </span>
                </td>
                <td>${formatDate(report.reportDate)}</td>
                <td>
                    <span class="badge badge-${statusClass}">
                        ${getStatusText(report.status)}
                    </span>
                </td>
                <td>
                    <div class="metrics-summary">
                        ${report.reportType === 'sprint' || report.reportType === 'manual' ? `
                            <small>Stories: ${report.userStoriesMetric || 0}</small><br>
                            <small>Tests: ${report.testCasesMetric || 0}</small>
                        ` : ''}
                        ${report.reportType === 'automation' ? `
                            <small>Tests: ${report.automationTotalTestCases || 0}</small><br>
                            <small>Pass Rate: ${calculatePassRate(report.automationPassedTestCases, report.automationTotalTestCases)}%</small>
                        ` : ''}
                        ${report.reportType === 'performance' ? `
                            <small>Scenarios: ${report.performanceScenarios?.length || 0}</small><br>
                            <small>Requests: ${report.httpRequestsOverview?.length || 0}</small>
                        ` : ''}
                    </div>
                </td>
                <td>${report.createdBy || 'Unknown'}</td>
                <td>${formatDate(report.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="viewReport(${report.id})" title="View Report">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="editReport(${report.id})" title="Edit Report">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-success" onclick="exportReportAsPdf(${report.id})" title="Export PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                        <button class="btn btn-sm btn-info" onclick="exportReportAsExcel(${report.id})" title="Export Excel">
                            <i class="fas fa-file-excel"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="confirmDeleteReport(${report.id})" title="Delete Report">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updatePagination(data) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    const totalPages = data.totalPages || Math.ceil((data.total || 0) / (window.reportsPerPage || 10));
    const currentPage = data.page || window.currentPage || 1;

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Previous button
    if (currentPage > 1) {
        paginationHTML += `
            <button class="btn btn-sm btn-outline-primary" onclick="changePage(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i> Previous
            </button>
        `;
    }

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        paginationHTML += `<button class="btn btn-sm btn-outline-primary" onclick="changePage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPage ? 'btn-primary' : 'btn-outline-primary';
        paginationHTML += `
            <button class="btn btn-sm ${isActive}" onclick="changePage(${i})">${i}</button>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="btn btn-sm btn-outline-primary" onclick="changePage(${totalPages})">${totalPages}</button>`;
    }

    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `
            <button class="btn btn-sm btn-outline-primary" onclick="changePage(${currentPage + 1})">
                Next <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }

    pagination.innerHTML = paginationHTML;
}

async function changePage(page) {
    window.currentPage = page;
    await searchReports();
}

function getReportTypeClass(reportType) {
    const map = {
        'sprint': 'primary',
        'manual': 'secondary',
        'automation': 'warning',
        'performance': 'info'
    };
    return map[reportType] || 'secondary';
}

function getReportTypeText(reportType) {
    const map = {
        'sprint': 'Sprint',
        'manual': 'Manual',
        'automation': 'Automation',
        'performance': 'Performance'
    };
    return map[reportType] || 'Unknown';
}

function calculatePassRate(passed, total) {
    if (!total || total === 0) return 0;
    return Math.round((passed / total) * 100);
}

// Clear all filters
function clearFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const reportTypeFilter = document.getElementById('reportTypeFilter');
    const sortBy = document.getElementById('sortBy');
    const sortOrder = document.getElementById('sortOrder');

    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    if (reportTypeFilter) reportTypeFilter.value = '';
    if (sortBy) sortBy.value = 'reportDate';
    if (sortOrder) sortOrder.value = 'desc';

    // Reset to first page
    window.currentPage = 1;

    // Trigger search with cleared filters
    searchReports();
}

// Export functions
async function exportAllReports() {
    try {
        if (typeof showToast === 'function') {
            showToast('Preparing export...', 'info', 2000);
        }

        const response = await fetch('/api/reports/export/all', {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        });

        if (!response.ok) {
            throw new Error(`Export failed: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QA_Reports_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        if (typeof showToast === 'function') {
            showToast('Reports exported successfully!', 'success');
        }
    } catch (error) {
        console.error('Export error:', error);
        if (typeof showToast === 'function') {
            showToast('Export failed: ' + error.message, 'error');
        }
    }
}

// Make functions globally accessible
window.searchReports = searchReports;
window.debouncedSearchReports = debouncedSearchReports;
window.displayReports = displayReports;
window.updatePagination = updatePagination;
window.changePage = changePage;
window.getReportTypeClass = getReportTypeClass;
window.getReportTypeText = getReportTypeText;
window.calculatePassRate = calculatePassRate;
window.clearFilters = clearFilters;
window.exportAllReports = exportAllReports;