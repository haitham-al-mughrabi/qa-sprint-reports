// static/enhanced_script.js

// --- Global variables ---
let currentSection = 0;
let editingReportId = null;
let currentPage = 1;
const reportsPerPage = 10;
let allReportsCache = []; // Cache for all reports to avoid re-fetching
let dashboardStatsCache = null; // Cache for dashboard statistics with structure: {data: object, cacheTime: number}
// Auto-save functionality
let autoSaveTimeout = null;

// Constants for localStorage keys
const FORM_DATA_KEY = 'qaReportFormData';
const FORM_ARRAYS_KEY = 'qaReportArrayData';
const CACHE_DURATION = 300000; // 5 minutes in milliseconds

// Form-specific variables
let requestData = [];
let buildData = [];
let testerData = [];
let qaNoteFieldsData = []; // New: for custom QA note fields
// let customFieldsData = []; // This will be used if custom fields are implemented - REMOVED
let userStoriesChart = null;
let testCasesChart = null;
let issuesPriorityChart = null;
let issuesStatusChart = null;
let enhancementsChart = null;
let scoreColumnCount = 0; // Not directly used in this version but kept for consistency
let weightReasonVisible = false; // Not directly used in this version but kept for consistency

// --- API Communication ---
const API_URL = '/api/reports';
const DASHBOARD_API_URL = '/api/dashboard/stats';



async function fetchReports() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch reports:", error);
        return []; // Return empty array on error
    }
}

async function fetchDashboardStats() {
    try {
        // Use existing cache if available and still valid
        if (dashboardStatsCache && dashboardStatsCache.cacheTime && 
            (Date.now() - dashboardStatsCache.cacheTime) < CACHE_DURATION) {
            return dashboardStatsCache.data;
        }

        const response = await fetch(DASHBOARD_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Cache the dashboard stats
        dashboardStatsCache = {
            data: data,
            cacheTime: Date.now()
        };
        
        return data;
    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        return null;
    }
}

async function fetchReport(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch report:", error);
        return null;
    }
}

async function saveReport(reportData) {
    const url = editingReportId ? `${API_URL}/${editingReportId}` : API_URL;
    const method = editingReportId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportData),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to save report:", error);
        return null;
    }
}

async function deleteReportDB(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to delete report:", error);
        return null;
    }
}

// --- Initialize App (for pages that need it) ---
// This block will now be called by specific page scripts if needed
// document.addEventListener('DOMContentLoaded', async () => {
//     // Initial data load
//     allReportsCache = await fetchReports();
//     dashboardStatsCache = await fetchDashboardStats();

//     updateDashboardStats(dashboardStatsCache);
//     searchReports();

//     document.getElementById('reportDate').value = getCurrentDate();
//     updateNavigationButtons();
//     initializeCharts();

//     // Load dropdown data for portfolios and projects
//     await loadFormDropdownData();
// });

// Toast notification system
function showToast(message, type = 'info', duration = 5000) {
    // Create toast container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"></div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="removeToast(this.parentElement)">×</button>
    `;

    container.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        removeToast(toast);
    }, duration);
}

function removeToast(toast) {
    if (toast && toast.parentElement) {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }
}


// --- Dashboard Functions ---
function updateDashboardStats(stats) {
    if (!stats) return;

    // Check if we are on the dashboard page by looking for a key element
    const totalReportsEl = document.getElementById('totalReports');
    if (!totalReportsEl) {
        return; // Exit if not on the dashboard page
    }

    // Update overall statistics
    const overall = stats.overall;
    totalReportsEl.textContent = overall.totalReports || 0;
    document.getElementById('completedReports').textContent = overall.completedReports || 0;
    document.getElementById('inProgressReports').textContent = overall.inProgressReports || 0;
    document.getElementById('pendingReports').textContent = overall.pendingReports || 0;

    // Update aggregate metrics
    document.getElementById('totalUserStories').textContent = overall.totalUserStories || 0;
    document.getElementById('totalTestCases').textContent = overall.totalTestCases || 0;
    document.getElementById('totalIssues').textContent = overall.totalIssues || 0;
    document.getElementById('totalEnhancements').textContent = overall.totalEnhancements || 0;
    // Update project-specific metrics
    renderProjectMetrics(stats.projects);
}

function renderProjectMetrics(projects) {
    const container = document.getElementById('projectMetrics');
    if (!projects || projects.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; color: #6c757d; padding: 40px 0;">
                <div style="font-size: 3em; margin-bottom: 20px;"><i class="fas fa-chart-bar"></i></div>
                <h3>No Projects Found</h3>
                <p>Create your first report to see project metrics here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = projects.map(project => `
        <div class="project-metric-card">
            <div class="project-header">
                <div class="project-title-section">
                    <div class="project-icon">
                        <i class="fas fa-rocket"></i>
                    </div>
                    <div class="project-info">
                        <h3>${project.projectName}</h3>
                        <p class="portfolio-name">${project.portfolioName}</p>
                    </div>
                </div>
                <span class="status-badge status-${getStatusClass(project.testingStatus)}">${getStatusText(project.testingStatus)}</span>
            </div>

            <div class="project-summary">
                <div class="summary-card">
                    <div class="summary-item">
                        <div class="summary-icon">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <div class="summary-content">
                            <span class="summary-value">${project.totalReports}</span>
                            <span class="summary-label">Reports</span>
                        </div>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-item">
                        <div class="summary-icon">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div class="summary-content">
                            <span class="summary-value">${formatDate(project.lastReportDate)}</span>
                            <span class="summary-label">Last Report</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="project-metrics">
                <div class="metrics-section">
                    <h4 class="metrics-title">
                        <i class="fas fa-chart-bar"></i> Testing Metrics
                    </h4>
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <div class="metric-icon">
                                <i class="fas fa-user-check"></i>
                            </div>
                            <div class="metric-content">
                                <span class="metric-value">${project.totalUserStories}</span>
                                <span class="metric-label">User Stories</span>
                            </div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-icon">
                                <i class="fas fa-flask"></i>
                            </div>
                            <div class="metric-content">
                                <span class="metric-value">${project.totalTestCases}</span>
                                <span class="metric-label">Test Cases</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="metrics-section">
                    <h4 class="metrics-title">
                        <i class="fas fa-bug"></i> Quality Metrics
                    </h4>
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <div class="metric-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="metric-content">
                                <span class="metric-value">${project.totalIssues}</span>
                                <span class="metric-label">Issues</span>
                            </div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-icon">
                                <i class="fas fa-magic"></i>
                            </div>
                            <div class="metric-content">
                                <span class="metric-value">${project.totalEnhancements}</span>
                                <span class="metric-label">Enhancements</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `).join('');
}

async function exportDashboardReport() {
    if (!dashboardStatsCache) {
        showToast('No dashboard data available to export', 'warning');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('QA Dashboard Report', 105, yPos, { align: 'center' });
    yPos += 20;

    // Overall Statistics
    doc.setFontSize(14);
    doc.text('Overall Statistics', 10, yPos);
    yPos += 10;

    const overall = dashboardStatsCache.overall;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Reports: ${overall.totalReports}`, 10, yPos);
    doc.text(`Completed: ${overall.completedReports}`, 60, yPos);
    doc.text(`In Progress: ${overall.inProgressReports}`, 110, yPos);
    doc.text(`Pending: ${overall.pendingReports}`, 160, yPos);
    yPos += 10;

    doc.text(`User Stories: ${overall.totalUserStories}`, 10, yPos);
    doc.text(`Test Cases: ${overall.totalTestCases}`, 60, yPos);
    doc.text(`Issues: ${overall.totalIssues}`, 110, yPos);
    doc.text(`Enhancements: ${overall.totalEnhancements}`, 160, yPos);
    yPos += 20;

    // Project Metrics Table
    if (dashboardStatsCache.projects && dashboardStatsCache.projects.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Project Metrics', 10, yPos);
        yPos += 10;

        const projectTableData = dashboardStatsCache.projects.map(project => [
            project.projectName,
            project.portfolioName,
            project.totalReports.toString(),
            project.totalUserStories.toString(),
            project.totalTestCases.toString(),
            project.totalIssues.toString(),
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Project', 'Portfolio', 'Reports', 'Stories', 'Cases', 'Issues', 'Score']],
            body: projectTableData,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [66, 133, 244], textColor: 255, fontStyle: 'bold' }
        });
    }

    doc.save('QA_Dashboard_Report.pdf');
}

// --- Chart initialization functions ---
function initializeCharts() {
    initializeUserStoriesChart();
    initializeTestCasesChart();
    initializeIssuesPriorityChart();
    initializeIssuesStatusChart();
    initializeEnhancementsChart();
}

function getChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { padding: 15, usePointStyle: true, font: { size: 11 } }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const value = context.parsed || 0;
                        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                        return `${context.label}: ${value} (${percentage}%)`;
                    }
                }
            }
        }
    };
}

function initializeDoughnutChart(canvasId, labels, backgroundColors) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return null;

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: new Array(labels.length).fill(0),
                backgroundColor: backgroundColors,
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: getChartOptions()
    });
}

function initializeUserStoriesChart() {
    const labels = ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'];
    const colors = ['#28a745', '#ffc107', '#dc3545', '#6c757d', '#fd7e14', '#6f42c1', '#20c997'];
    if(userStoriesChart) userStoriesChart.destroy();
    userStoriesChart = initializeDoughnutChart('userStoriesChart', labels, colors);
}

function initializeTestCasesChart() {
    const labels = ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'];
    const colors = ['#28a745', '#ffc107', '#dc3545', '#6c757d', '#fd7e14', '#6f42c1', '#20c997'];
    if(testCasesChart) testCasesChart.destroy();
    testCasesChart = initializeDoughnutChart('testCasesChart', labels, colors);
}

function initializeIssuesPriorityChart() {
    const labels = ['Critical', 'High', 'Medium', 'Low'];
    const colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745'];
    if(issuesPriorityChart) issuesPriorityChart.destroy();
    issuesPriorityChart = initializeDoughnutChart('issuesPriorityChart', labels, colors);
}

function initializeIssuesStatusChart() {
    const labels = ['New', 'Fixed', 'Not Fixed', 'Re-opened', 'Deferred'];
    const colors = ['#17a2b8', '#28a745', '#dc3545', '#fd7e14', '#6f42c1'];
    if(issuesStatusChart) issuesStatusChart.destroy();
    issuesStatusChart = initializeDoughnutChart('issuesStatusChart', labels, colors);
}

function initializeEnhancementsChart() {
    const labels = ['New', 'Implemented', 'Exists'];
    const colors = ['#17a2b8', '#28a745', '#6c757d'];
    if(enhancementsChart) enhancementsChart.destroy();
    enhancementsChart = initializeDoughnutChart('enhancementsChart', labels, colors);
}

// --- Calculation and Chart Update Functions ---
function updateChart(chart, data) {
    if (chart) {
        chart.data.datasets[0].data = data;
        chart.update();
    }
}

function calculatePercentages() {
    const total = calculateUserStoryTotal();
    const values = {
        passed: parseInt(document.getElementById('passedStories')?.value) || 0,
        passedWithIssues: parseInt(document.getElementById('passedWithIssuesStories')?.value) || 0,
        failed: parseInt(document.getElementById('failedStories')?.value) || 0,
        blocked: parseInt(document.getElementById('blockedStories')?.value) || 0,
        cancelled: parseInt(document.getElementById('cancelledStories')?.value) || 0,
        deferred: parseInt(document.getElementById('deferredStories')?.value) || 0,
        notTestable: parseInt(document.getElementById('notTestableStories')?.value) || 0,
    };

    // Update total field (readonly)
    document.getElementById('totalStories').value = total;
    document.getElementById('userStoriesMetric').value = total;

    // Update percentages
    Object.keys(values).forEach(key => {
        const percentageElement = document.getElementById(`${key}Percentage`);
        if (percentageElement) {
            percentageElement.textContent = total > 0 ? `${Math.round((values[key] / total) * 100)}%` : '0%';
        }
    });

    updateChart(userStoriesChart, Object.values(values));
}

function calculateUserStoryTotal() {
    const fields = ['passedStories', 'passedWithIssuesStories', 'failedStories', 'blockedStories', 'cancelledStories', 'deferredStories', 'notTestableStories'];
    return fields.reduce((sum, field) => sum + (parseInt(document.getElementById(field)?.value) || 0), 0);
}

function calculateTestCasesPercentages() {
    const total = calculateTestCasesTotal();

    // More aggressive update approach
    const totalField = document.getElementById('totalTestCases');
    if (totalField) {
        // Clear any existing placeholder
        totalField.removeAttribute('placeholder');

        // Set the value multiple ways
        totalField.value = total;
        totalField.setAttribute('value', total);
        totalField.defaultValue = total;

        // Force visual refresh
        totalField.style.display = 'none';
        totalField.offsetHeight; // Force reflow
        totalField.style.display = '';

        // Add a data attribute for debugging
        totalField.setAttribute('data-calculated-value', total);

        console.log('Total field updated:', totalField.value, 'Calculated:', total);
    }

    // Rest of the function...
    const values = {
        passed: parseInt(document.getElementById('passedTestCases')?.value) || 0,
        passedWithIssues: parseInt(document.getElementById('passedWithIssuesTestCases')?.value) || 0,
        failed: parseInt(document.getElementById('failedTestCases')?.value) || 0,
        blocked: parseInt(document.getElementById('blockedTestCases')?.value) || 0,
        cancelled: parseInt(document.getElementById('cancelledTestCases')?.value) || 0,
        deferred: parseInt(document.getElementById('deferredTestCases')?.value) || 0,
        notTestable: parseInt(document.getElementById('notTestableTestCases')?.value) || 0,
    };

    // Also update the metric field
    const metricField = document.getElementById('testCasesMetric');
    if (metricField) {
        metricField.value = total;
    }

    Object.keys(values).forEach(key => {
        const percentageElement = document.getElementById(`${key}TestCasesPercentage`);
        if (percentageElement) {
            percentageElement.textContent = total > 0 ? `${Math.round((values[key] / total) * 100)}%` : '0%';
        }
    });

    updateChart(testCasesChart, Object.values(values));
}

function calculateTestCasesTotal() {
    const fields = ['passedTestCases', 'passedWithIssuesTestCases', 'failedTestCases', 'blockedTestCases', 'cancelledTestCases', 'deferredTestCases', 'notTestableTestCases'];
    return fields.reduce((sum, field) => sum + (parseInt(document.getElementById(field)?.value) || 0), 0);
}

function calculateIssuesPercentages() {
    const total = calculateIssuesTotal();
    const priorityValues = {
        critical: parseInt(document.getElementById('criticalIssues')?.value) || 0,
        high: parseInt(document.getElementById('highIssues')?.value) || 0,
        medium: parseInt(document.getElementById('mediumIssues')?.value) || 0,
        low: parseInt(document.getElementById('lowIssues')?.value) || 0,
    };

    // Update total field (readonly) - THIS WAS MISSING
    document.getElementById('totalIssues').value = total;
    document.getElementById('issuesMetric').value = total;

    // Update percentages
    Object.keys(priorityValues).forEach(key => {
        const percentageElement = document.getElementById(`${key}IssuesPercentage`);
        if (percentageElement) {
            percentageElement.textContent = total > 0 ? `${Math.round((priorityValues[key] / total) * 100)}%` : '0%';
        }
    });

    updateChart(issuesPriorityChart, Object.values(priorityValues));
    calculateIssuesStatusPercentages();
}

function calculateIssuesTotal() {
    const fields = ['criticalIssues', 'highIssues', 'mediumIssues', 'lowIssues'];
    return fields.reduce((sum, field) => sum + (parseInt(document.getElementById(field)?.value) || 0), 0);
}

function calculateIssuesStatusPercentages() {
    const total = calculateIssuesTotal();
    const statusValues = {
        new: parseInt(document.getElementById('newIssues')?.value) || 0,
        fixed: parseInt(document.getElementById('fixedIssues')?.value) || 0,
        notFixed: parseInt(document.getElementById('notFixedIssues')?.value) || 0,
        reopened: parseInt(document.getElementById('reopenedIssues')?.value) || 0,
        deferred: parseInt(document.getElementById('deferredIssues')?.value) || 0,
    };

    // Update percentages
    Object.keys(statusValues).forEach(key => {
        const percentageElement = document.getElementById(`${key}IssuesPercentage`);
        if (percentageElement) {
            percentageElement.textContent = total > 0 ? `${Math.round((statusValues[key] / total) * 100)}%` : '0%';
        }
    });

    updateChart(issuesStatusChart, Object.values(statusValues));
}

function calculateEnhancementsPercentages() {
    const total = calculateEnhancementsTotal();
    const values = {
        new: parseInt(document.getElementById('newEnhancements')?.value) || 0,
        implemented: parseInt(document.getElementById('implementedEnhancements')?.value) || 0,
        exists: parseInt(document.getElementById('existsEnhancements')?.value) || 0,
    };

    // Update total field (readonly) - THIS WAS MISSING
    document.getElementById('totalEnhancements').value = total;
    document.getElementById('enhancementsMetric').value = total;

    // Update percentages
    Object.keys(values).forEach(key => {
        const percentageElement = document.getElementById(`${key}EnhancementsPercentage`);
        if (percentageElement) {
            percentageElement.textContent = total > 0 ? `${Math.round((values[key] / total) * 100)}%` : '0%';
        }
    });

    updateChart(enhancementsChart, Object.values(values));
}

function calculateEnhancementsTotal() {
    const fields = ['newEnhancements', 'implementedEnhancements', 'existsEnhancements'];
    return fields.reduce((sum, field) => sum + (parseInt(document.getElementById(field)?.value) || 0), 0);
}

// --- Dynamic Form Sections (Request, Build, Tester) ---
function showRequestModal() { showModal('requestModal'); }
function showBuildModal() { showModal('buildModal'); }
function showTesterModal() { 
    loadExistingTesters(); // Load testers when modal opens
    showModal('testerModal'); 
}

function addRequest() {
    const requestId = document.getElementById('requestId').value.trim();
    const requestUrl = document.getElementById('requestUrl').value.trim();
    if (requestId && requestUrl) {
        requestData.push({ id: requestId, url: requestUrl });
        renderRequestList();
        closeModal('requestModal');
        showToast('Request added successfully!', 'success');
    } else {
        showToast('Please enter both Request ID and URL.', 'warning');
    }
}

function addBuild() {
    const requestId = document.getElementById('buildRequestId').value.trim();
    const requestUrl = document.getElementById('buildRequestUrl').value.trim();
    const environment = document.getElementById('buildEnvironment').value.trim();
    const cycles = document.getElementById('buildCycles').value.trim();
    if (requestId && requestUrl && environment && cycles) {
        buildData.push({ requestId, requestUrl, environment, cycles });
        renderBuildList();
        closeModal('buildModal');
        showToast('Build added successfully!', 'success');
    } else {
        showToast('Please fill in all build information fields.', 'warning');
    }
}

// addTester function is replaced by addSelectedTester for consistency with team members
// function addTester() {
//     const testerName = document.getElementById('testerName').value.trim();
//     if (testerName) {
//         testerData.push({ name: testerName });
//         renderTesterList();
//         closeModal('testerModal');
//     }
// }

function renderDynamicList(containerId, data, renderItemFn, removeFn) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id '${containerId}' not found`);
        return;
    }
    
    
    if (data.length === 0) {
        // Check if the container is for team members, as it has a slightly different empty state message
        if (containerId === 'teamMemberList') {
            container.innerHTML = `<div class="empty-state" style="text-align: center; color: #6c757d; padding: 20px 0;">No team members added yet.</div>`;
        } else if (containerId === 'testerList') {
            container.innerHTML = `<div class="empty-state" style="text-align: center; color: #6c757d; padding: 20px 0;">No testers added yet. Click "Add/Select Tester" to get started.</div>`;
        } else {
            container.innerHTML = `<div class="empty-state" style="text-align: center; color: #6c757d; padding: 20px 0;">No items added yet. Click "Add Request" to get started.</div>`;
        }
    } else {
        container.innerHTML = data.map((item, index) => renderItemFn(item, index, removeFn)).join('');
    }
}

function renderRequestList() {
    renderDynamicList('requestList', requestData, (item, index) => `
        <div class="dynamic-item">
            <div><strong>ID:</strong> ${item.id}<br><strong>URL:</strong> ${item.url}</div>
            <button type="button" class="btn-sm btn-delete" onclick="removeRequest(${index})">Remove</button>
        </div>`, removeRequest);
}

function renderBuildList() {
    renderDynamicList('buildList', buildData, (item, index) => `
        <div class="dynamic-item">
            <div><strong>Req ID:</strong> ${item.requestId}<br><strong>URL:</strong> ${item.requestUrl}<br><strong>Env:</strong> ${item.environment}<br><strong>Cycles:</strong> ${item.cycles}</div>
            <button type="button" class="btn-sm btn-delete" onclick="removeBuild(${index})">Remove</button>
        </div>`, removeBuild);
}

function renderTesterList() {
    renderDynamicList('testerList', testerData, (item, index, removeFn) => {
        const roles = [];
        if (item.is_automation_engineer) roles.push('Automation Engineer');
        if (item.is_manual_engineer) roles.push('Manual Engineer');
        const roleText = roles.length > 0 ? `<br><strong>Roles:</strong> ${roles.join(', ')}` : '<br><em style="color: #6c757d;">No roles assigned</em>';
        
        return `
        <div class="dynamic-item">
            <div><strong>Name:</strong> ${item.name}<br><strong>Email:</strong> ${item.email}${roleText}</div>
            <button type="button" class="btn-sm btn-delete" onclick="removeTester(${index})">Remove</button>
        </div>`;
    }, removeTester);
}

function removeRequest(index) { requestData.splice(index, 1); renderRequestList(); showToast('Request removed', 'info'); }
function removeBuild(index) { buildData.splice(index, 1); renderBuildList(); showToast('Build removed', 'info'); }
function removeTester(index) { testerData.splice(index, 1); renderTesterList(); showToast('Tester removed', 'info'); }

function clearAllFields() {
    if (confirm('Are you sure you want to clear all fields in the form?')) {
        resetFormData();
        showToast('All fields have been cleared.', 'info');
    }
}

function clearCurrentSection() {
    if (confirm('Are you sure you want to clear all fields in the current section?')) {
        const section = document.getElementById(`section-${currentSection}`);
        if (section) {
            const inputs = section.querySelectorAll('input:not([readonly]), textarea, select');
            inputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });

            // After clearing, recalculate percentages for relevant sections
            if (section.id === 'section-3') {
                calculatePercentages();
            } else if (section.id === 'section-4') {
                calculateTestCasesPercentages();
            } else if (section.id === 'section-5') {
                calculateIssuesPercentages();
            } else if (section.id === 'section-6') {
                calculateEnhancementsPercentages();
            }

            showToast('Current section fields have been cleared.', 'info');
        }
    }
}

// --- Page Management & Navigation (Simplified for multi-page app) ---
// The showPage function is no longer needed for navigation between main pages.
// Browser handles page loads.
// function showPage(pageId) { ... }

function showSection(sectionIndex) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${sectionIndex}`)?.classList.add('active');

    document.querySelectorAll('#sidebar .nav-item').forEach((item, index) => {
        item.classList.toggle('active', index === sectionIndex);
    });

    currentSection = sectionIndex;
    updateNavigationButtons();
    window.scrollTo(0, 0);
}

function nextSection() {
    if (currentSection < 7) { // Max section index is 7 (QA Notes)
        showSection(currentSection + 1);
    }
}
function previousSection() {
    if (currentSection > 0) {
        showSection(currentSection - 1);
    }
}

function updateNavigationButtons() {
    document.getElementById('prevBtn').disabled = currentSection === 0;
    const isLastSection = currentSection === 7;
    document.getElementById('nextBtn').style.display = isLastSection ? 'none' : 'inline-block';
    document.getElementById('submitBtn').style.display = isLastSection ? 'inline-block' : 'none';
}

// backToDashboard now redirects to the dashboard page
function backToDashboard() { window.location.href = '/dashboard'; }
function toggleSidebar() { 
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
    sidebar.classList.toggle('show'); // Also toggle 'show' for compatibility
}

// --- Reports Table Functions ---
// Debounced search to reduce API calls
let searchTimeout;

async function searchReports() {
    const searchQuery = document.getElementById('searchInput')?.value || '';
    
    // Clear existing timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    searchTimeout = setTimeout(async () => {
        showReportsLoading();
        const result = await fetchReports(currentPage, searchQuery);
        hideReportsLoading();

        renderReportsTable(result.reports);
        renderPagination(result);
    }, 300); // 300ms delay
}

// Immediate search for pagination and buttons
async function searchReportsImmediate() {
    const searchQuery = document.getElementById('searchInput')?.value || '';
    showReportsLoading();
    const result = await fetchReports(currentPage, searchQuery);
    hideReportsLoading();

    renderReportsTable(result.reports);
    renderPagination(result);
}

function renderReportsTable(reports) {
    const tbody = document.getElementById('reportsTableBody');
    if (!tbody) return; // Ensure tbody exists

    if (reports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">📋</div><h3>No Reports Found</h3><p>Create a new report or adjust your search.</p></div></td></tr>`;
        return;
    }
    tbody.innerHTML = reports.map(report => `
        <tr>
            <td><strong>${report.portfolioName || 'N/A'} - Sprint ${report.sprintNumber || 'N/A'}</strong><br><small>v${report.reportVersion || '1.0'} | R${report.releaseNumber || 'N/A'}</small></td>
            <td>${report.projectName || 'N/A'}</td>
            <td>${report.portfolioName || 'N/A'}</td>
            <td>#${report.sprintNumber || 'N/A'}</td>
            <td>${formatDate(report.reportDate)}</td>
            <td><span class="status-badge status-${getStatusClass(report.testingStatus)}">${getStatusText(report.testingStatus)}</span></td>
            <td>
                <div class="action-buttons-cell">
                    <button class="btn-sm btn-view" onclick="viewReport(${report.id})" title="View Report"><i class="fas fa-eye"></i></button>
                    <button class="btn-sm btn-regenerate" onclick="regenerateReport(${report.id})" title="Edit Report"><i class="fas fa-edit"></i></button>
                    <button class="btn-sm btn-delete" onclick="deleteReport(${report.id})" title="Delete Report"><i class="fas fa-trash-alt"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderPagination(result) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return; // Ensure pagination element exists

    if (result.totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    let paginationHTML = `<button class="pagination-btn" onclick="goToPage(${result.page - 1})" ${!result.hasPrev ? 'disabled' : ''}>←</button>`;
    for (let i = 1; i <= result.totalPages; i++) {
        paginationHTML += `<button class="pagination-btn ${i === result.page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    paginationHTML += `<button class="pagination-btn" onclick="goToPage(${result.page + 1})" ${!result.hasNext ? 'disabled' : ''}>→</button>`;
    pagination.innerHTML = paginationHTML;
}

function goToPage(page) {
    currentPage = page;
    searchReportsImmediate();
}

// --- Report Actions (CRUD) ---
function createNewReport() {
    // Redirect to the create report page
    window.location.href = '/create-report';
}

async function regenerateReport(id) {
    // Redirect to the create report page with the report ID for editing
    window.location.href = `/create-report?id=${id}`;
}

async function deleteReport(id) {
    const confirmDelete = await new Promise(resolve => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';

        modal.innerHTML = `
            <div class="modal-content">
                <h3>Confirm Deletion</h3>
                <p>Are you sure you want to delete this report? This action cannot be undone.</p>
                <div class="modal-buttons">
                    <button type="button" class="btn btn-secondary" id="cancelDeleteBtn">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const cancelBtn = document.getElementById('cancelDeleteBtn');

        confirmBtn.onclick = () => {
            modal.remove();
            resolve(true);
        };

        cancelBtn.onclick = () => {
            modal.remove();
            resolve(false);
        };
    });

    if (confirmDelete) {
        const result = await deleteReportDB(id);
        if (result) {
            allReportsCache = allReportsCache.filter(r => r.id !== id);
            // Re-fetch dashboard stats if the function exists
            if (typeof fetchDashboardStats === 'function') {
                dashboardStatsCache = await fetchDashboardStats();
                updateDashboardStats(dashboardStatsCache);
            }
            searchReportsImmediate(); // Re-render the reports table
            showToast('Report deleted successfully', 'success');
        } else {
            showToast('Failed to delete report', 'error');
        }
    }
}

function viewReport(id) {
    window.location.href = `/report/${id}`;
}

// --- Form Handling ---
function resetFormData() {
    const form = document.getElementById('qaReportForm');
    if (form) {
        form.reset();
        document.getElementById('reportDate').value = getCurrentDate();
        requestData = [];
        buildData = [];
        testerData = [];
        teamMemberData = []; // Reset team member data
        qaNoteFieldsData = []; // Reset custom QA note fields
        qaNotesData = []; // Reset QA notes array data
        // customFieldsData = []; // Reset custom fields data - REMOVED

        renderRequestList();
        renderBuildList();
        renderTesterList();
        renderTeamMemberList();
        renderQANotesList();
        renderQANoteFieldsList();
        updateQANotesCount();

        resetAllCharts();
        currentSection = 0; // Reset to first section
        updateNavigationButtons();
    }
}

function resetAllCharts() {
    // Destroy existing charts to prevent memory leaks and then re-initialize them
    if (userStoriesChart) userStoriesChart.destroy();
    if (testCasesChart) testCasesChart.destroy();
    if (issuesPriorityChart) issuesPriorityChart.destroy();
    if (issuesStatusChart) issuesStatusChart.destroy();
    if (enhancementsChart) enhancementsChart.destroy();

    initializeCharts(); // Re-initialize all charts to their default empty state
}

function loadReportForEditing(report) {
    resetFormData(); // Reset first to clear any previous data

    // Basic fields
    const basicFields = ['portfolioName', 'projectName', 'sprintNumber', 'reportVersion', 'reportName', 'cycleNumber', 'reportDate', 'testSummary', 'testingStatus', 'qaNotesText', 'releaseNumber'];
    basicFields.forEach(field => {
        const element = document.getElementById(field);
        if (element && report[field] !== undefined) {
            element.value = report[field];
        }
    });

    // User Stories
    const userStoryFields = ['passedUserStories', 'passedWithIssuesUserStories', 'failedUserStories', 'blockedUserStories', 'cancelledUserStories', 'deferredUserStories', 'notTestableUserStories'];
    userStoryFields.forEach(field => {
        const element = document.getElementById(field.replace('UserStories', 'Stories')); // Adjust ID for HTML
        if (element && report[field] !== undefined) {
            element.value = report[field];
        }
    });

    // Test Cases
    const testCaseFields = ['passedTestCases', 'passedWithIssuesTestCases', 'failedTestCases', 'blockedTestCases', 'cancelledTestCases', 'deferredTestCases', 'notTestableTestCases'];
    testCaseFields.forEach(field => {
        const element = document.getElementById(field);
        if (element && report[field] !== undefined) {
            element.value = report[field];
        }
    });

    // Issues
    const issueFields = ['criticalIssues', 'highIssues', 'mediumIssues', 'lowIssues', 'newIssues', 'fixedIssues', 'notFixedIssues', 'reopenedIssues', 'deferredIssues'];
    issueFields.forEach(field => {
        const element = document.getElementById(field);
        if (element && report[field] !== undefined) {
            element.value = report[field];
        }
    });

    // Enhancements
    const enhancementFields = ['newEnhancements', 'implementedEnhancements', 'existsEnhancements'];
    enhancementFields.forEach(field => {
        const element = document.getElementById(field);
        if (element && report[field] !== undefined) {
            element.value = report[field];
        }
    });

    // Dynamic data
    requestData = report.requestData || [];
    buildData = report.buildData || [];
    testerData = report.testerData || [];
    // Assuming teamMemberData are part of the report object
    teamMemberData = report.teamMemberData || []; // Assuming this field exists in your report model
    qaNoteFieldsData = report.qaNoteFieldsData || []; // Load custom QA note fields
    qaNotesData = report.qaNotesData || []; // Load QA notes array data
    // customFieldsData = report.customFields || {}; // Assuming this is an object in your report model - REMOVED

    renderRequestList();
    renderBuildList();
    renderTesterList();
    renderTeamMemberList();
    renderQANotesList();
    renderQANoteFieldsList(); // Render custom QA note fields
    // renderCustomFields(); // If you have a render function for custom fields

    // Recalculate all totals and charts
    calculatePercentages();
    calculateTestCasesPercentages();
    calculateIssuesPercentages();
    calculateEnhancementsPercentages();
}

// Form submission handler
// This listener should only be active on the create_report.html page
document.addEventListener('DOMContentLoaded', () => {
    const qaReportForm = document.getElementById('qaReportForm');
    if (qaReportForm) {
        qaReportForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const reportData = {};

            // Collect form data
            for (let [key, value] of formData.entries()) {
                // Handle special cases for array inputs (e.g., checkboxes if any)
                if (key.endsWith('[]')) {
                    const arrayKey = key.slice(0, -2);
                    if (!reportData[arrayKey]) {
                        reportData[arrayKey] = [];
                    }
                    reportData[arrayKey].push(value);
                } else {
                    reportData[key] = value;
                }
            }

            // Add dynamic data (requestData, buildData, testerData, teamMemberData)
            reportData.requestData = requestData;
            reportData.buildData = buildData;
            reportData.testerData = testerData;
            reportData.teamMemberData = teamMemberData; // Add team member data
            reportData.qaNoteFieldsData = qaNoteFieldsData; // Add custom QA note fields
            reportData.qaNotesData = qaNotesData; // Add QA notes array data
            // reportData.customFields = customFieldsData; // Add custom fields data - REMOVED
            reportData.qaNotesText = document.getElementById('newQANoteText').value;

            const savedReport = await saveReport(reportData);
            if (savedReport) {
                showToast('Report saved successfully!', 'success');
                
                // Clear form data from localStorage and reset form
                clearFormDataOnSubmit();
                
                // Redirect to reports list after saving
                window.location.href = '/reports';
            } else {
                showToast('Failed to save report. Please try again.', 'error');
            }
        });
    }
});


// --- Enhanced Export Functions ---
async function exportReportAsPdf(id) {
    const report = allReportsCache.find(r => r.id === id);
    if (!report) {
        console.error("Report not found for PDF export:", id);
        showToast('Report not found for PDF export.', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let yPos = 20;

    // Helper functions
    const addTitle = (text, fontSize = 16) => {
        doc.setFontSize(fontSize);
        doc.setFont(undefined, 'bold');
        doc.text(text, 105, yPos, { align: 'center' });
        yPos += fontSize * 0.8;
    };

    const addSection = (title, fontSize = 14) => {
        yPos += 10;
        doc.setFontSize(fontSize);
        doc.setFont(undefined, 'bold');
        doc.text(title, 10, yPos);
        yPos += 10;
    };

    const addText = (text, x = 10) => {
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const splitText = doc.splitTextToSize(text, 190);
        doc.text(splitText, x, yPos);
        yPos += splitText.length * 6;
    };

    // Report Header
    addTitle("QA Testing Report", 18);
    addText(`Generated on: ${new Date().toLocaleDateString()}`, 150);

    // Cover Information
    addSection("Cover Information");
    addText(`Portfolio: ${report.portfolioName || 'N/A'}`);
    addText(`Project: ${report.projectName || 'N/A'}`);
    addText(`Sprint: ${report.sprintNumber || 'N/A'} | Version: ${report.reportVersion || 'N/A'} | Cycle: ${report.cycleNumber || 'N/A'}`);
    addText(`Report Date: ${formatDate(report.reportDate)} | Status: ${getStatusText(report.testingStatus)}`);
    if (report.reportName) {
        addText(`Report Name: ${report.reportName}`);
    }

    // Test Summary
    if (report.testSummary) {
        addSection("Test Summary");
        addText(report.testSummary);
    }

    // Metrics Summary
    addSection("Testing Metrics Summary");
    doc.autoTable({
        startY: yPos,
        head: [['Metric', 'Count']],
        body: [
            ['Total User Stories', report.totalUserStories || 0],
            ['Total Test Cases', report.totalTestCases || 0],
            ['Total Issues', report.totalIssues || 0],
            ['Total Enhancements', report.totalEnhancements || 0],
            ['QA Notes', report.qaNotesText ? 'Available' : 'N/A']
        ],
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [66, 133, 244], textColor: 255 }
    });
    yPos = doc.lastAutoTable.finalY + 15;

    // Check if we need a new page
    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }

    // Dynamic sections with tables
    const addDataTable = (title, data, headers) => {
        if (data && data.length > 0) {
            addSection(title);
            doc.autoTable({
                startY: yPos,
                head: [headers],
                body: data,
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [100, 180, 250], textColor: 255 }
            });
            yPos = doc.lastAutoTable.finalY + 10;
        }
    };

    // Requests
    if (report.requestData && report.requestData.length > 0) {
        const requestsData = report.requestData.map(req => [req.id, req.url]);
        addDataTable("Request Information", requestsData, ['Request ID', 'URL']);
    }

    // Builds
    if (report.buildData && report.buildData.length > 0) {
        const buildsData = report.buildData.map(build => [build.requestId, build.environment, build.cycles]);
        addDataTable("Build Information", buildsData, ['Request ID', 'Environment', 'Cycles']);
    }

    // Testers
    if (report.testerData && report.testerData.length > 0) {
        const testersData = report.testerData.map(tester => {
            const roles = [];
            if (tester.is_automation_engineer) roles.push('Automation Engineer');
            if (tester.is_manual_engineer) roles.push('Manual Engineer');
            const roleText = roles.length > 0 ? roles.join(', ') : 'No roles assigned';
            return [tester.name, tester.email, roleText];
        });
        addDataTable("Testers", testersData, ['Tester Name', 'Email', 'Roles']);
    }

    // Team Members
    if (report.teamMemberData && report.teamMemberData.length > 0) {
        const teamMembersData = report.teamMemberData.map(member => [
            member.name,
            member.role,
            member.email
        ]);
        addDataTable("Team Members", teamMembersData, ['Name', 'Role', 'Email']);
    }

    // User Stories Breakdown
    if (report.totalUserStories > 0) {
        addSection("User Stories Breakdown");
        doc.autoTable({
            startY: yPos,
            head: [['Status', 'Count', 'Percentage']],
            body: [
                ['Passed', report.passedUserStories || 0, `${Math.round(((report.passedUserStories || 0) / report.totalUserStories) * 100)}%`],
                ['Passed with Issues', report.passedWithIssuesUserStories || 0, `${Math.round(((report.passedWithIssuesUserStories || 0) / report.totalUserStories) * 100)}%`],
                ['Failed', report.failedUserStories || 0, `${Math.round(((report.failedUserStories || 0) / report.totalUserStories) * 100)}%`],
                ['Blocked', report.blockedUserStories || 0, `${Math.round(((report.blockedUserStories || 0) / report.totalUserStories) * 100)}%`],
                ['Cancelled', report.cancelledUserStories || 0, `${Math.round(((report.cancelledUserStories || 0) / report.totalUserStories) * 100)}%`],
                ['Deferred', report.deferredUserStories || 0, `${Math.round(((report.deferredUserStories || 0) / report.totalUserStories) * 100)}%`],
                ['Not Testable', report.notTestableUserStories || 0, `${Math.round(((report.notTestableUserStories || 0) / report.totalUserStories) * 100)}%`]
            ],
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [40, 167, 69], textColor: 255 }
        });
        yPos = doc.lastAutoTable.finalY + 10;
    }

    // QA Notes
    if (report.qaNotesText) {
        if (yPos > 200) {
            doc.addPage();
            yPos = 20;
        }
        addSection("QA Notes");
        addText(report.qaNotesText);
    }

    doc.save(`QA_Report_${report.portfolioName}_Sprint_${report.sprintNumber}.pdf`);
    showToast('PDF report exported successfully!', 'success');
}

async function exportReportAsExcel(id) {
    const report = allReportsCache.find(r => r.id === id);
    if (!report) {
        console.error("Report not found for Excel export:", id);
        showToast('Report not found for Excel export.', 'error');
        return;
    }

    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
        ["Field", "Value"],
        ["Portfolio Name", report.portfolioName || 'N/A'],
        ["Project Name", report.projectName || 'N/A'],
        ["Sprint Number", report.sprintNumber || 'N/A'],
        ["Report Version", report.reportVersion || 'N/A'],
        ["Report Name", report.reportName || 'N/A'],
        ["Cycle Number", report.cycleNumber || 'N/A'],
        ["Report Date", formatDate(report.reportDate)],
        ["Testing Status", getStatusText(report.testingStatus)],
        ["Test Summary", report.testSummary || 'N/A'],
        ["", ""],
        ["METRICS", ""],
        ["Total User Stories", report.totalUserStories || 0],
        ["Total Test Cases", report.totalTestCases || 0],
        ["Total Issues", report.totalIssues || 0],
        ["Total Enhancements", report.totalEnhancements || 0],
        ["QA Notes", report.qaNotesText || 'N/A']
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, wsSummary, "Summary");

    // User Stories Sheet
    const userStoriesData = [
        ["Status", "Count", "Percentage"],
        ["Passed", report.passedUserStories || 0, report.totalUserStories ? Math.round(((report.passedUserStories || 0) / report.totalUserStories) * 100) : 0],
        ["Passed with Issues", report.passedWithIssuesUserStories || 0, report.totalUserStories ? Math.round(((report.passedWithIssuesUserStories || 0) / report.totalUserStories) * 100) : 0],
        ["Failed", report.failedUserStories || 0, report.totalUserStories ? Math.round(((report.failedUserStories || 0) / report.totalUserStories) * 100) : 0],
        ["Blocked", report.blockedUserStories || 0, report.totalUserStories ? Math.round(((report.blockedUserStories || 0) / report.totalUserStories) * 100) : 0],
        ["Cancelled", report.cancelledUserStories || 0, report.totalUserStories ? Math.round(((report.cancelledUserStories || 0) / report.totalUserStories) * 100) : 0],
        ["Deferred", report.deferredUserStories || 0, report.totalUserStories ? Math.round(((report.deferredUserStories || 0) / report.totalUserStories) * 100) : 0],
        ["Not Testable", report.notTestableUserStories || 0, report.totalUserStories ? Math.round(((report.notTestableUserStories || 0) / report.totalUserStories) * 100) : 0]
    ];
    const wsUserStories = XLSX.utils.aoa_to_sheet(userStoriesData);
    XLSX.utils.book_append_sheet(workbook, wsUserStories, "User Stories");

    // Test Cases Sheet
    const testCasesData = [
        ["Status", "Count", "Percentage"],
        ["Passed", report.passedTestCases || 0, report.totalTestCases ? Math.round(((report.passedTestCases || 0) / report.totalTestCases) * 100) : 0],
        ["Passed with Issues", report.passedWithIssuesTestCases || 0, report.totalTestCases ? Math.round(((report.passedWithIssuesTestCases || 0) / report.totalTestCases) * 100) : 0],
        ["Failed", report.failedTestCases || 0, report.totalTestCases ? Math.round(((report.failedTestCases || 0) / report.totalTestCases) * 100) : 0],
        ["Blocked", report.blockedTestCases || 0, report.totalTestCases ? Math.round(((report.blockedTestCases || 0) / report.totalTestCases) * 100) : 0],
        ["Cancelled", report.cancelledTestCases || 0, report.totalTestCases ? Math.round(((report.cancelledTestCases || 0) / report.totalTestCases) * 100) : 0],
        ["Deferred", report.deferredTestCases || 0, report.totalTestCases ? Math.round(((report.deferredTestCases || 0) / report.totalTestCases) * 100) : 0],
        ["Not Testable", report.notTestableTestCases || 0, report.totalTestCases ? Math.round(((report.notTestableTestCases || 0) / report.totalTestCases) * 100) : 0]
    ];
    const wsTestCases = XLSX.utils.aoa_to_sheet(testCasesData);
    XLSX.utils.book_append_sheet(workbook, wsTestCases, "Test Cases");

    // Issues Sheet
    const issuesData = [
        ["Priority/Status", "Count", "Percentage"],
        ["", "", ""],
        ["PRIORITY BREAKDOWN", "", ""],
        ["Critical", report.criticalIssues || 0, report.totalIssues ? Math.round(((report.criticalIssues || 0) / report.totalIssues) * 100) : 0],
        ["High", report.highIssues || 0, report.totalIssues ? Math.round(((report.highIssues || 0) / report.totalIssues) * 100) : 0],
        ["Medium", report.mediumIssues || 0, report.totalIssues ? Math.round(((report.mediumIssues || 0) / report.totalIssues) * 100) : 0],
        ["Low", report.lowIssues || 0, report.totalIssues ? Math.round(((report.lowIssues || 0) / report.totalIssues) * 100) : 0],
        ["", "", ""],
        ["STATUS BREAKDOWN", "", ""],
        ["New", report.newIssues || 0, report.totalIssues ? Math.round(((report.newIssues || 0) / report.totalIssues) * 100) : 0],
        ["Fixed", report.fixedIssues || 0, report.totalIssues ? Math.round(((report.fixedIssues || 0) / report.totalIssues) * 100) : 0],
        ["Not Fixed", report.notFixedIssues || 0, report.totalIssues ? Math.round(((report.notFixedIssues || 0) / report.totalIssues) * 100) : 0],
        ["Re-opened", report.reopenedIssues || 0, report.totalIssues ? Math.round(((report.reopenedIssues || 0) / report.totalIssues) * 100) : 0],
        ["Deferred", report.deferredIssues || 0, report.totalIssues ? Math.round(((report.deferredIssues || 0) / report.totalIssues) * 100) : 0]
    ];
    const wsIssues = XLSX.utils.aoa_to_sheet(issuesData);
    XLSX.utils.book_append_sheet(workbook, wsIssues, "Issues");

    // Enhancements Sheet
    const enhancementsData = [
        ["Status", "Count", "Percentage"],
        ["New", report.newEnhancements || 0, report.totalEnhancements ? Math.round(((report.newEnhancements || 0) / report.totalEnhancements) * 100) : 0],
        ["Implemented", report.implementedEnhancements || 0, report.totalEnhancements ? Math.round(((report.implementedEnhancements || 0) / report.totalEnhancements) * 100) : 0],
        ["Exists", report.existsEnhancements || 0, report.totalEnhancements ? Math.round(((report.existsEnhancements || 0) / report.totalEnhancements) * 100) : 0]
    ];
    const wsEnhancements = XLSX.utils.aoa_to_sheet(enhancementsData);
    XLSX.utils.book_append_sheet(workbook, wsEnhancements, "Enhancements");

    // Detailed Metrics Sheet
    const detailedMetricsData = [
        ["Metric Category", "Metric", "Value"],
        ["", "", ""],
        ["USER STORIES METRICS", "", ""],
        ["Passed", "Count", report.passedUserStories || 0],
        ["Passed with Issues", "Count", report.passedWithIssuesUserStories || 0],
        ["Failed", "Count", report.failedUserStories || 0],
        ["Blocked", "Count", report.blockedUserStories || 0],
        ["Cancelled", "Count", report.cancelledUserStories || 0],
        ["Deferred", "Count", report.deferredUserStories || 0],
        ["Not Testable", "Count", report.notTestableUserStories || 0],
        ["Total", "Count", report.totalUserStories || 0],
        ["", "", ""],
        ["TEST CASES METRICS", "", ""],
        ["Passed", "Count", report.passedTestCases || 0],
        ["Passed with Issues", "Count", report.passedWithIssuesTestCases || 0],
        ["Failed", "Count", report.failedTestCases || 0],
        ["Blocked", "Count", report.blockedTestCases || 0],
        ["Cancelled", "Count", report.cancelledTestCases || 0],
        ["Deferred", "Count", report.deferredTestCases || 0],
        ["Not Testable", "Count", report.notTestableTestCases || 0],
        ["Total", "Count", report.totalTestCases || 0],
        ["", "", ""],
        ["ISSUES METRICS", "", ""],
        ["Critical Priority", "Count", report.criticalIssues || 0],
        ["High Priority", "Count", report.highIssues || 0],
        ["Medium Priority", "Count", report.mediumIssues || 0],
        ["Low Priority", "Count", report.lowIssues || 0],
        ["New Status", "Count", report.newIssues || 0],
        ["Fixed Status", "Count", report.fixedIssues || 0],
        ["Not Fixed Status", "Count", report.notFixedIssues || 0],
        ["Re-opened Status", "Count", report.reopenedIssues || 0],
        ["Deferred Status", "Count", report.deferredIssues || 0],
        ["Total", "Count", report.totalIssues || 0],
        ["", "", ""],
        ["ENHANCEMENTS METRICS", "", ""],
        ["New", "Count", report.newEnhancements || 0],
        ["Implemented", "Count", report.implementedEnhancements || 0],
        ["Exists", "Count", report.existsEnhancements || 0],
        ["Total", "Count", report.totalEnhancements || 0],
        ["", "", ""],
        ["CALCULATED METRICS", "", ""],
        ["User Stories Metric", "Auto-calculated", report.userStoriesMetric || 0],
        ["Test Cases Metric", "Auto-calculated", report.testCasesMetric || 0],
        ["Issues Metric", "Auto-calculated", report.issuesMetric || 0],
        ["Enhancements Metric", "Auto-calculated", report.enhancementsMetric || 0],
        ["QA Notes Metric", "Count", report.qaNotesMetric || 0],
        ["", "", ""],
        ["TIMESTAMPS", "", ""],
        ["Created At", "DateTime", report.createdAt || 'N/A'],
        ["Updated At", "DateTime", report.updatedAt || 'N/A']
    ];
    const wsDetailedMetrics = XLSX.utils.aoa_to_sheet(detailedMetricsData);
    XLSX.utils.book_append_sheet(workbook, wsDetailedMetrics, "Detailed Metrics");

    // Dynamic Data Sheets
    if (report.requestData && report.requestData.length > 0) {
        const requestHeaders = ["Request ID", "URL"];
        const requestsSheetData = report.requestData.map(req => [req.id, req.url]);
        const wsRequests = XLSX.utils.aoa_to_sheet([requestHeaders, ...requestsSheetData]);
        XLSX.utils.book_append_sheet(workbook, wsRequests, "Requests");
    }

    if (report.buildData && report.buildData.length > 0) {
        const buildHeaders = ["Request ID", "URL", "Environment", "Cycles"];
        const buildsSheetData = report.buildData.map(build => [build.requestId, build.requestUrl, build.environment, build.cycles]);
        const wsBuilds = XLSX.utils.aoa_to_sheet([buildHeaders, ...buildsSheetData]);
        XLSX.utils.book_append_sheet(workbook, wsBuilds, "Builds");
    }

    if (report.testerData && report.testerData.length > 0) {
        const testerHeaders = ["Tester Name", "Email", "Roles"];
        const testersSheetData = report.testerData.map(tester => {
            const roles = [];
            if (tester.is_automation_engineer) roles.push('Automation Engineer');
            if (tester.is_manual_engineer) roles.push('Manual Engineer');
            const roleText = roles.length > 0 ? roles.join(', ') : 'No roles assigned';
            return [tester.name, tester.email, roleText];
        });
        const wsTesters = XLSX.utils.aoa_to_sheet([testerHeaders, ...testersSheetData]);
        XLSX.utils.book_append_sheet(workbook, wsTesters, "Testers");
    }

    if (report.teamMemberData && report.teamMemberData.length > 0) {
        const teamMemberHeaders = ["Name", "Email", "Role"];
        const teamMembersSheetData = report.teamMemberData.map(member => [member.name, member.email, member.role]);
        const wsTeamMembers = XLSX.utils.aoa_to_sheet([teamMemberHeaders, ...teamMembersSheetData]);
        XLSX.utils.book_append_sheet(workbook, wsTeamMembers, "Team Members");
    }
    XLSX.writeFile(workbook, `QA_Report_${report.portfolioName}_Sprint_${report.sprintNumber}.xlsx`);
    showToast('Excel report exported successfully!', 'success');
}

// --- Modal & Utility Functions ---
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // Clear form inputs
    const modal = document.getElementById(modalId);
    if (modal) { // Check if modal exists before querying
        const inputs = modal.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
    }
}

function showAddPortfolioModal() {
    showModal('addPortfolioModal');
}

function showAddProjectModal() {
    showModal('addProjectModal');
}

async function addPortfolio() {
    const name = document.getElementById('newPortfolioName').value.trim();
    if (name) {
        try {
            const response = await fetch('/api/portfolios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name })
            });
            if (response.ok) {
                const newPortfolio = await response.json();
                showToast('Portfolio added successfully! Now please add a project to this portfolio.', 'success');
                invalidateAllCaches(); // Clear caches since data changed
                
                // Reload portfolios and select the new one
                await loadPortfoliosOnly();
                
                // Select the newly created portfolio
                const portfolioSelect = document.getElementById('portfolioName');
                if (portfolioSelect) {
                    // Find and select the new portfolio option
                    const portfolioValue = name.toLowerCase().replace(/\s+/g, '-');
                    portfolioSelect.value = portfolioValue;
                    
                    // Trigger the change event to load projects for this portfolio
                    const changeEvent = new Event('change', { bubbles: true });
                    portfolioSelect.dispatchEvent(changeEvent);
                }
                
                closeModal('addPortfolioModal');
                
                // Force user to add a project by showing the project modal
                setTimeout(() => {
                    showToast('Please add a project to the new portfolio before proceeding.', 'info');
                    showAddProjectModal();
                }, 500);
                
            } else {
                const error = await response.json();
                showToast('Error adding portfolio: ' + (error.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error adding portfolio:', error);
            showToast('Error adding portfolio', 'error');
        }
    } else {
        showToast('Please enter a portfolio name.', 'warning');
    }
}

async function addProject() {
    const name = document.getElementById('newProjectName').value.trim();
    const portfolioSelect = document.getElementById('portfolioName');
    
    if (!portfolioSelect.value) {
        showToast('Please select a portfolio first.', 'warning');
        return;
    }

    const selectedPortfolioOption = portfolioSelect.options[portfolioSelect.selectedIndex];
    const actualPortfolioId = selectedPortfolioOption ? selectedPortfolioOption.dataset.id : null;

    if (name && actualPortfolioId) {
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, portfolio_id: actualPortfolioId })
            });
            if (response.ok) {
                const newProject = await response.json();
                showToast('Project added successfully!', 'success');
                invalidateAllCaches(); // Clear caches since data changed
                
                // Reload projects for the current portfolio
                await loadProjectsForPortfolio(actualPortfolioId);
                
                // Select the newly created project
                const projectSelect = document.getElementById('projectName');
                if (projectSelect) {
                    const projectValue = name.toLowerCase().replace(/\s+/g, '-');
                    projectSelect.value = projectValue;
                    
                    // Trigger the change event to enable remaining fields
                    const changeEvent = new Event('change', { bubbles: true });
                    projectSelect.dispatchEvent(changeEvent);
                }
                
                closeModal('addProjectModal');
            } else {
                const error = await response.json();
                showToast('Error adding project: ' + (error.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error adding project:', error);
            showToast('Error adding project', 'error');
        }
    } else {
        showToast('Please enter a project name and ensure a portfolio is selected.', 'warning');
    }
}

function getCurrentDate() {
    const today = new Date();
    return `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    // Handles both 'dd-mm-yyyy' and ISO strings
    const date = new Date(dateString.includes('-') && dateString.length === 10 ?
        dateString.split('-').reverse().join('-') : dateString);
    return isNaN(date) ? 'Invalid Date' : date.toLocaleDateString('en-GB');
}

function getStatusClass(status) {
    const map = {
        'passed': 'completed',
        'passed-with-issues': 'in-progress',
        'failed': 'pending',
        'blocked': 'pending',
        'cancelled': 'pending',
        'deferred': 'pending',
        'not-testable': 'pending'
    };
    return map[status] || 'pending';
}

function getStatusText(status) {
    const map = {
        'passed': 'Passed',
        'passed-with-issues': 'Passed w/ Issues',
        'failed': 'Failed',
        'blocked': 'Blocked',
        'cancelled': 'Cancelled',
        'deferred': 'Deferred',
        'not-testable': 'Not Testable'
    };
    return map[status] || 'Pending';
}

// --- Event Listeners and Window Functions ---
// Close modal when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Expose functions to the global scope
window.showAddQANoteFieldModal = showAddQANoteFieldModal;
window.updateQAFieldOptions = updateQAFieldOptions;
window.addQANoteField = addQANoteField;

// Date format validation
document.addEventListener('DOMContentLoaded', function() {
    const reportDateField = document.getElementById('reportDate');
    if (reportDateField) {
        reportDateField.addEventListener('input', function(e) {
            const datePattern = /^\d{2}-\d{2}-\d{4}$/;
            if (this.value && !datePattern.test(this.value)) {
                this.setCustomValidity('Please enter date in dd-mm-yyyy format');
            } else {
                this.setCustomValidity('');
            }
        });
    }
});

function toggleWeightColumn() {
    const columns = document.querySelectorAll('.weight-column');
    const button = document.getElementById('toggleWeightBtn');

    if (!columns.length || !button) return;

    const isVisible = columns[0].style.display !== 'none';

    columns.forEach(col => {
        col.style.display = isVisible ? 'none' : 'table-cell';
    });

    button.textContent = isVisible ? 'Show Weight' : 'Hide Weight';
}

function toggleProjectReasonColumn() {
    const columns = document.querySelectorAll('.project-reason-column');
    const button = document.getElementById('toggleProjectReasonBtn');

    if (!columns.length || !button) return;

    const isVisible = columns[0].style.display !== 'none';

    columns.forEach(col => {
        col.style.display = isVisible ? 'none' : 'table-cell';
    });

    button.textContent = isVisible ? 'Show Reason' : 'Hide Reason';
}

let teamMemberData = [];

async function showTeamMemberModal() {
    await loadExistingTeamMembers();
    clearTeamMemberForm();
    showModal('teamMemberModal');
}

async function loadExistingTeamMembers() {
    try {
        const response = await fetch('/api/team-members');
        if (response.ok) {
            const teamMembers = await response.json();
            const select = document.getElementById('existingTeamMemberSelect');

            select.innerHTML = '<option value="">-- Select from existing team members --</option>';

            teamMembers.forEach(member => {
                const option = document.createElement('option');
                option.value = JSON.stringify(member); // Store full object for easy retrieval
                option.textContent = `${member.name} - ${member.role} (${member.email})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading team members:', error);
        showToast('Error loading team members', 'error');
    }
}

function handleTeamMemberSelection() {
    const select = document.getElementById('existingTeamMemberSelect');

    // Since we simplified the modal to select-only, we don't need to handle role field
    if (!select) {
        console.error('Team member select element not found');
        return;
    }
    
    // The function is called but doesn't need to do anything since we only have select functionality
}

function clearTeamMemberForm() {
    const existingSelect = document.getElementById('existingTeamMemberSelect');

    // Only clear the select dropdown since we simplified to select-only
    if (existingSelect) {
        existingSelect.value = '';
    }
}

async function addSelectedTeamMember() {
    const existingSelect = document.getElementById('existingTeamMemberSelect');

    if (!existingSelect) {
        console.error('Team member select element not found');
        return;
    }

    if (!existingSelect.value) {
        showToast('Please select a team member', 'warning');
        return;
    }

    let memberToAdd = null;

    try {
        memberToAdd = JSON.parse(existingSelect.value);
    } catch (error) {
        console.error('Error parsing team member data:', error);
        showToast('Error parsing team member data', 'error');
        return;
    }

    if (memberToAdd) {
        const alreadyAdded = teamMemberData.some(tm => tm.email === memberToAdd.email);
        if (alreadyAdded) {
            showToast('This team member is already added to the report', 'warning');
            return;
        }

        teamMemberData.push({
            id: memberToAdd.id,
            name: memberToAdd.name,
            email: memberToAdd.email,
            role: memberToAdd.role
        });

        renderTeamMemberList();
        closeModal('teamMemberModal');
        showToast('Team member added successfully!', 'success');
    }
}

function renderTeamMemberList() {
    const container = document.getElementById('teamMemberList');
    if (!container) return;

    if (teamMemberData.length === 0) {
        container.innerHTML = '<div class="empty-state" style="text-align: center; color: #6c757d; padding: 20px 0;">No team members added yet. Click "Add Team Member" to get started.</div>';
        return;
    }

    container.innerHTML = teamMemberData.map((member, index) => `
        <div class="dynamic-item">
            <div>
                <strong>Name:</strong> ${member.name}<br>
                <strong>Role:</strong> <span class="role-badge ${member.role.toLowerCase().replace(/\s+/g, '-')}">${member.role}</span><br>
                <strong>Email:</strong> ${member.email}
            </div>
            <button type="button" class="btn-sm btn-delete" onclick="removeTeamMember(${index})">Remove</button>
        </div>
    `).join('');
}

function removeTeamMember(index) {
    teamMemberData.splice(index, 1);
    renderTeamMemberList();
    showToast('Team member removed', 'info');
}

// Enhanced tester management functions (complete implementation)

async function loadExistingTesters() {
    try {
        const response = await fetch('/api/testers');
        if (response.ok) {
            const testers = await response.json();
            const select = document.getElementById('existingTesterSelect');

            select.innerHTML = '<option value="">-- Select from existing testers --</option>';

            testers.forEach(tester => {
                const option = document.createElement('option');
                option.value = JSON.stringify(tester); // Store full object for easy retrieval
                const roles = [];
                if (tester.is_automation_engineer) roles.push('Automation');
                if (tester.is_manual_engineer) roles.push('Manual');
                const roleText = roles.length > 0 ? ` - ${roles.join(', ')}` : '';
                option.textContent = `${tester.name} (${tester.email})${roleText}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading testers:', error);
        showToast('Error loading testers', 'error');
    }
}

function handleTesterSelection() {
    const select = document.getElementById('existingTesterSelect');
    
    // Since we simplified the modal to select-only, we don't need to handle add fields
    if (!select) {
        console.error('Tester select element not found');
        return;
    }
    
    // The function is called but doesn't need to do anything since we only have select functionality
}

function clearTesterForm() {
    const existingTesterSelect = document.getElementById('existingTesterSelect');
    
    // Only clear the select dropdown since we simplified to select-only
    if (existingTesterSelect) {
        existingTesterSelect.value = '';
    }
}

async function addSelectedTester() {
    const existingTesterSelect = document.getElementById('existingTesterSelect');
    
    if (!existingTesterSelect) {
        console.error('Tester select element not found');
        return;
    }

    if (!existingTesterSelect.value) {
        showToast('Please select a tester', 'warning');
        return;
    }

    let testerToAdd = null;

    try {
        testerToAdd = JSON.parse(existingTesterSelect.value);
    } catch (error) {
        console.error('Error parsing tester data:', error);
        showToast('Error parsing tester data', 'error');
        return;
    }

    if (testerToAdd) {
        const alreadyAdded = testerData.some(t => t.email === testerToAdd.email);
        if (alreadyAdded) {
            showToast('This tester is already added to the report', 'warning');
            return;
        }

        testerData.push({
            id: testerToAdd.id,
            name: testerToAdd.name,
            email: testerToAdd.email,
            is_automation_engineer: testerToAdd.is_automation_engineer || false,
            is_manual_engineer: testerToAdd.is_manual_engineer || false
        });

        renderTesterList();
        closeModal('testerModal');
        showToast('Tester added successfully!', 'success');
    }
}

// QA Notes Custom Fields (if implemented in the HTML)

    // This is a placeholder function for removing custom QA fields
    

let qaNotesData = [];

function showAddQANoteModal() {
    showModal('addQANoteModal');
    const noteTextArea = document.getElementById('newQANoteText');
    if (noteTextArea) {
        noteTextArea.value = '';
    }
}

function addQANote() {
    const noteText = document.getElementById('newQANoteText').value.trim();
    if (noteText) {
        qaNotesData.push({ note: noteText });
        renderQANotesList();
        updateQANotesCount();
        closeModal('addQANoteModal');
        showToast('QA note added successfully!', 'success');
    } else {
        showToast('Please enter a note.', 'warning');
    }
}

// Functions for custom QA Note Fields
function showAddQANoteFieldModal() {
    showModal('addQANoteFieldModal');
    // Clear the form fields when opening the modal
    document.getElementById('qaFieldName').value = '';
    document.getElementById('qaFieldValue').value = '';
}

// This function is a placeholder. In a real scenario, it might populate a dropdown
// with predefined field names or allow editing existing ones.
function updateQAFieldOptions() {
    // For now, this function doesn't do anything as there are no predefined options.
    // It's kept to fulfill the request.
    console.log("updateQAFieldOptions called. No predefined options to update.");
}

function addQANoteField() {
    const fieldName = document.getElementById('qaFieldName').value.trim();
    const fieldValue = document.getElementById('qaFieldValue').value.trim();

    if (fieldName && fieldValue) {
        qaNoteFieldsData.push({ name: fieldName, value: fieldValue });
        renderQANoteFieldsList();
        closeModal('addQANoteFieldModal');
        showToast('QA Note Field added successfully!', 'success');
    } else {
        showToast('Please enter both a field name and a field value.', 'warning');
    }
}

function renderQANoteFieldsList() {
    const container = document.getElementById('qaNoteFieldsList');
    if (!container) return;

    if (qaNoteFieldsData.length === 0) {
        container.innerHTML = '<div class="empty-state" style="text-align: center; color: #6c757d; padding: 20px 0;">No custom QA fields added yet.</div>';
        return;
    }

    container.innerHTML = qaNoteFieldsData.map((field, index) => `
        <div class="dynamic-item">
            <div>
                <strong>${field.name}:</strong> ${field.value}
            </div>
            <button type="button" class="btn-sm btn-delete" onclick="removeQANoteField(${index})">Remove</button>
        </div>
    `).join('');
}

function removeQANoteField(index) {
    qaNoteFieldsData.splice(index, 1);
    renderQANoteFieldsList();
    showToast('QA Note Field removed', 'info');
}


function removeQANote(index) {
    qaNotesData.splice(index, 1);
    renderQANotesList();
    updateQANotesCount();
}

function renderQANotesList() {
    const container = document.getElementById('qaNotesList');
    if (!container) return;

    if (qaNotesData.length === 0) {
        container.innerHTML = '<div class="empty-state">No QA notes added yet. Click "Add Note" to get started.</div>';
    } else {
        container.innerHTML = qaNotesData.map((item, index) => `
            <div class="dynamic-item">
                <div>${item.note}</div>
                <button type="button" class="btn-delete" onclick="removeQANote(${index})">Remove</button>
            </div>
        `).join('');
    }
}

function updateQANotesCount() {
    const countField = document.getElementById('qaNotesMetric');
    if (countField) {
        countField.value = qaNotesData.length;
    }
}

// --- Page Management & Navigation (Simplified for multi-page app) ---

function renderQANotesFields() {
    const container = document.getElementById('qaNotesFieldsList');
    if (!container) return;

    // Find the default general notes field (if it exists and is not a custom field)
    // Assuming the general notes textarea is always present and has id 'qaNotesText'
    // This function will only render *additional* custom QA fields.

    // Remove existing custom QA fields before re-rendering
    const existingCustomFields = container.querySelectorAll('.qa-field-item');
    existingCustomFields.forEach(field => field.remove());

    // Add new custom fields
    qaNotesFields.forEach(field => {
        const fieldHTML = renderQANoteFieldHTML(field);
        // Append to the container. If you want it after a specific element, you'd need to find that element.
        // For now, just append to the end of the list.
        container.insertAdjacentHTML('beforeend', fieldHTML);
    });
}

function renderQANoteFieldHTML(field) {
    let inputHTML = '';

    switch (field.type) {
        case 'input':
            inputHTML = `<input type="text" id="${field.id}" name="custom_${field.id}" placeholder="Enter ${field.name.toLowerCase()}" ${field.required ? 'required' : ''} value="${field.value || ''}">`;
            break;
        case 'textarea':
            inputHTML = `<textarea id="${field.id}" name="custom_${field.id}" placeholder="Enter ${field.name.toLowerCase()}" rows="4" ${field.required ? 'required' : ''}>${field.value || ''}</textarea>`.trim();
            break;
        case 'number':
            inputHTML = `<input type="number" id="${field.id}" name="custom_${field.id}" placeholder="Enter ${field.name.toLowerCase()}" ${field.required ? 'required' : ''} value="${field.value || ''}">`;
            break;
        case 'date':
            inputHTML = `<input type="date" id="${field.id}" name="custom_${field.id}" ${field.required ? 'required' : ''} value="${field.value || ''}">`;
            break;
        case 'select':
            inputHTML = `
                <select id="${field.id}" name="custom_${field.id}" ${field.required ? 'required' : ''}>
                    <option value="">Select ${field.name}</option>
                    ${field.options.map(opt => `<option value="${opt}" ${field.value === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                </select>
            `.trim();
            break;
        case 'radio':
            inputHTML = field.options.map((opt, index) => `
                <label class="radio-option">
                    <input type="radio" name="custom_${field.id}" value="${opt}" ${field.required && index === 0 ? 'required' : ''} ${field.value === opt ? 'checked' : ''}>
                    ${opt}
                </label>
            `).join('');
            break;
        case 'checkbox':
            inputHTML = field.options.map(opt => `
                <label class="checkbox-option">
                    <input type="checkbox" name="custom_${field.id}[]" value="${opt}" ${Array.isArray(field.value) && field.value.includes(opt) ? 'checked' : ''}>
                    ${opt}
                </label>
            `).join('');
            break;
    }

    return `
        <div class="qa-field-item form-group full-width">
            <div class="custom-field-header">
                <label for="${field.id}">${field.name}</label>
                <div class="custom-field-badges">
                    ${field.required ? '<span class="badge badge-required">Required</span>' : ''}
                    ${field.showInReport ? '<span class="badge badge-visible">Show in Report</span>' : '<span class="badge badge-hidden">Hidden</span>'}
                    <button type="button" class="btn-remove-field" onclick="removeQANoteField('${field.id}')">Remove</button>
                </div>
            </div>
            <div class="custom-field-input">
                ${inputHTML}
            </div>
        </div>
    `.trim();
}

function removeQANoteField(fieldId) {
    qaNotesFields = qaNotesFields.filter(field => field.id !== fieldId);
    renderQANotesFields();
    showToast('QA note field removed', 'info');
}

async function populatePortfolioDropdownForCreateReport(portfolios) {
    const select = document.getElementById('portfolioName');
    if (!select) {
        console.error('Portfolio select element not found!');
        return;
    }
    
    // Clear loading state and add basic options
    select.innerHTML = '<option value="">Select Portfolio</option>';
    select.innerHTML += '<option value="no-portfolio">No Portfolio (Standalone Project)</option>';

    // Add dynamic portfolios from database
    if (portfolios && Array.isArray(portfolios) && portfolios.length > 0) {
        portfolios.forEach(portfolio => {
            const value = portfolio.name.toLowerCase().replace(/\s+/g, '-');
            // Store the actual ID in a data attribute
            select.innerHTML += `<option value="${value}" data-id="${portfolio.id}">${portfolio.name}</option>`;
        });
    }
}

// Function called when portfolio is selected
async function onPortfolioSelection() {
    const portfolioSelect = document.getElementById('portfolioName');
    const projectSelect = document.getElementById('projectName');
    
    if (!portfolioSelect.value) {
        // Clear projects and disable
        projectSelect.innerHTML = '<option value="">Select Project</option>';
        projectSelect.disabled = true;
        return;
    }
    
    projectSelect.disabled = false;
    projectSelect.innerHTML = '<option value="">Loading projects...</option>';
    
    try {
        let projects = [];
        
        if (portfolioSelect.value === 'no-portfolio') {
            // Load projects without portfolio
            const response = await fetch('/api/projects/without-portfolio');
            if (response.ok) {
                projects = await response.json();
            }
        } else {
            // Get portfolio ID from data attribute
            const selectedOption = portfolioSelect.options[portfolioSelect.selectedIndex];
            const portfolioId = selectedOption.getAttribute('data-id');
            
            if (portfolioId) {
                const response = await fetch(`/api/projects/by-portfolio/${portfolioId}`);
                if (response.ok) {
                    projects = await response.json();
                }
            }
        }
        
        // Populate project dropdown
        projectSelect.innerHTML = '<option value="">Select Project</option>';
        projects.forEach(project => {
            projectSelect.innerHTML += `<option value="${project.name.toLowerCase().replace(/\s+/g, '-')}" data-id="${project.id}">${project.name}</option>`;
        });
        
        if (projects.length === 0) {
            projectSelect.innerHTML = '<option value="">No projects available</option>';
        }
        
    } catch (error) {
        console.error('Error loading projects:', error);
        projectSelect.innerHTML = '<option value="">Error loading projects</option>';
    }
}

async function populateProjectDropdown(projects) {
    const select = document.getElementById('projectName');
    if (!select) return;

    // Keep existing static options (if any, from your original HTML)
    // For a clean slate, you might just clear and re-add.
    // Assuming you want to clear and re-add based on loaded data.
    select.innerHTML = '<option value="">Select Project</option>';

    // Add dynamic projects from database
    projects.forEach(project => {
        const value = project.name.toLowerCase().replace(/\s+/g, '-');
        // Store the actual ID and portfolio ID in data attributes
        select.innerHTML += `<option value="${value}" data-id="${project.id}" data-portfolio-id="${project.portfolio_id}">${project.name}</option>`;
    });
}

// Caching for form dropdown data
let formDataCache = null;
let formDataCacheTime = null;

// Cache invalidation function
function invalidateAllCaches() {
    formDataCache = null;
    formDataCacheTime = null;
    dashboardStatsCache = null;
    allReportsCache = [];
}

// Global variable to store latest project data for auto-loading
let latestProjectData = null;

// Function called when project is selected
async function onProjectSelection() {
    const portfolioSelect = document.getElementById('portfolioName');
    const projectSelect = document.getElementById('projectName');
    
    if (!portfolioSelect.value || !projectSelect.value) {
        return;
    }
    
    let portfolioName, projectName;
    
    // Handle "no-portfolio" case
    if (portfolioSelect.value === 'no-portfolio') {
        portfolioName = 'No Portfolio';
    } else {
        portfolioName = portfolioSelect.options[portfolioSelect.selectedIndex].text;
    }
    
    projectName = projectSelect.options[projectSelect.selectedIndex].text;
    
    try {
        const response = await fetch(`/api/projects/${encodeURIComponent(portfolioName)}/${encodeURIComponent(projectName)}/latest-data`);
        if (response.ok) {
            const data = await response.json();
            
            if (data.hasData) {
                latestProjectData = data;
                
                // Automatically load testers when project is selected
                const latestData = data.latestData;
                if (latestData.testerData && latestData.testerData.length > 0) {
                    console.log('Auto-loading testers for selected project:', latestData.testerData);
                    testerData = [...latestData.testerData];
                    renderTesterList();
                }
                
                showAutoLoadModal(data);
            } else {
                // No previous data, set defaults
                setDefaultValues(data.defaultValues);
            }
        }
    } catch (error) {
        console.error('Error fetching latest project data:', error);
        setDefaultValues();
    }
}

// Function to show the auto-load modal with data preview
function showAutoLoadModal(data) {
    const modal = document.getElementById('autoLoadDataModal');
    const preview = document.getElementById('dataPreview');
    
    // Build data preview
    const latestData = data.latestData;
    const suggestedValues = data.suggestedValues;
    
    let previewHTML = `
        <h4>Latest Report Data:</h4>
        <div class="data-preview-item">
            <span class="data-preview-label">Sprint Number:</span>
            <span class="data-preview-value">${latestData.sprintNumber} → Suggested: ${suggestedValues.sprintNumber}</span>
        </div>
        <div class="data-preview-item">
            <span class="data-preview-label">Cycle Number:</span>
            <span class="data-preview-value">${latestData.cycleNumber} → Suggested: ${suggestedValues.cycleNumber}</span>
        </div>
        <div class="data-preview-item">
            <span class="data-preview-label">Release Number:</span>
            <span class="data-preview-value">${latestData.releaseNumber}</span>
        </div>
        <div class="data-preview-item">
            <span class="data-preview-label">Report Version:</span>
            <span class="data-preview-value">${latestData.reportVersion}</span>
        </div>
        <div class="data-preview-item">
            <span class="data-preview-label">Testers:</span>
            <span class="data-preview-value">${latestData.testerData.length} tester(s)</span>
        </div>
        <div class="data-preview-item">
            <span class="data-preview-label">Team Members:</span>
            <span class="data-preview-value">${latestData.teamMembers.length} member(s)</span>
        </div>
    `;
    
    preview.innerHTML = previewHTML;
    showModal('autoLoadDataModal');
}

// Function to load selected data
function loadSelectedData() {
    if (!latestProjectData) return;
    
    const latestData = latestProjectData.latestData;
    const suggestedValues = latestProjectData.suggestedValues;
    
    // Check which data types to load
    const loadSprintData = document.getElementById('loadSprintData').checked;
    const loadReportData = document.getElementById('loadReportData').checked;
    const loadTesters = document.getElementById('loadTesters').checked;
    const loadTeamMembers = document.getElementById('loadTeamMembers').checked;
    const loadRequestData = document.getElementById('loadRequestData').checked;
    const loadBuildData = document.getElementById('loadBuildData').checked;
    
    // Load Sprint & Release Information
    if (loadSprintData) {
        document.getElementById('sprintNumber').value = suggestedValues.sprintNumber;
        document.getElementById('cycleNumber').value = suggestedValues.cycleNumber;
        document.getElementById('releaseNumber').value = latestData.releaseNumber;
    }
    
    // Load Report Information
    if (loadReportData) {
        document.getElementById('reportVersion').value = latestData.reportVersion;
        // Set today's date
        const today = new Date();
        const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
        document.getElementById('reportDate').value = formattedDate;
    }
    
    // Load Testers
    if (loadTesters && latestData.testerData.length > 0) {
        // Clear existing testers
        testerData = [];
        latestData.testerData.forEach(tester => {
            testerData.push(tester);
        });
        renderTesterList();
    }
    
    // Load Team Members  
    if (loadTeamMembers && latestData.teamMembers.length > 0) {
        // This would need to be implemented based on how team members are stored
        console.log('Loading team members:', latestData.teamMembers);
    }
    
    // Load Request Data
    if (loadRequestData && latestData.requestData.length > 0) {
        requestData = [...latestData.requestData];
        updateRequestList();
    }
    
    // Load Build Data
    if (loadBuildData && latestData.buildData.length > 0) {
        buildData = [...latestData.buildData];
        updateBuildList();
    }
    
    closeModal('autoLoadDataModal');
    showToast('Data loaded successfully!', 'success');
}

// Function to set default values for new projects
function setDefaultValues(defaults) {
    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
    
    if (defaults) {
        document.getElementById('sprintNumber').value = defaults.sprintNumber;
        document.getElementById('cycleNumber').value = defaults.cycleNumber;
        document.getElementById('releaseNumber').value = defaults.releaseNumber;
        document.getElementById('reportVersion').value = defaults.reportVersion;
        document.getElementById('reportDate').value = defaults.reportDate;
    } else {
        // Fallback defaults
        document.getElementById('sprintNumber').value = 1;
        document.getElementById('cycleNumber').value = 1;
        document.getElementById('releaseNumber').value = '1.0';
        document.getElementById('reportVersion').value = '1.0';
        document.getElementById('reportDate').value = formattedDate;
    }
}

// Missing form dropdown data loading function with caching
// Progressive form loading - starts with only portfolios
async function loadFormDropdownData() {
    try {
        console.log('Loading minimal portfolio data for progressive form loading...');
        await loadPortfoliosOnly();
        disableFormFieldsExceptPortfolio();
        setupProgressiveFormHandlers();
    } catch (error) {
        console.error('Error loading form data:', error);
        showToast('Error loading form data', 'error');
    }
}

// Load only portfolios for fast initial loading
async function loadPortfoliosOnly() {
    try {
        const response = await fetch('/api/portfolios');
        if (response.ok) {
            const portfolios = await response.json();
            populatePortfolioDropdownForCreateReport(portfolios);
        } else {
            throw new Error('Failed to load portfolios');
        }
    } catch (error) {
        console.error('Error loading portfolios:', error);
        showToast('Error loading portfolios', 'error');
    }
}

// Load projects for a specific portfolio
async function loadProjectsForPortfolio(portfolioId) {
    try {
        console.log('Loading projects for portfolio:', portfolioId);
        const response = await fetch(`/api/projects/by-portfolio/${portfolioId}`);
        if (response.ok) {
            const projects = await response.json();
            populateProjectDropdownFiltered(projects);
            enableProjectField();
        } else {
            throw new Error('Failed to load projects');
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        showToast('Error loading projects', 'error');
    }
}

// Disable all form fields except Portfolio Name
function disableFormFieldsExceptPortfolio() {
    const fieldsToDisable = [
        'projectName', 'sprintNumber', 'cycleNumber', 'releaseNumber',
        'reportName', 'reportVersion', 'reportDate'
    ];
    
    fieldsToDisable.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.disabled = true;
            field.style.opacity = '0.5';
            field.style.cursor = 'not-allowed';
        }
    });
    
    // Also disable the project dropdown initially
    const projectSelect = document.getElementById('projectName');
    if (projectSelect) {
        projectSelect.innerHTML = '<option value="">Select Portfolio first</option>';
        projectSelect.disabled = true;
        projectSelect.style.opacity = '0.5';
        projectSelect.style.cursor = 'not-allowed';
    }
}

// Enable project field after portfolio is selected
function enableProjectField() {
    const projectSelect = document.getElementById('projectName');
    if (projectSelect) {
        projectSelect.disabled = false;
        projectSelect.style.opacity = '1';
        projectSelect.style.cursor = 'pointer';
    }
}

// Enable all remaining fields after project is selected
function enableAllRemainingFields() {
    const fieldsToEnable = [
        'sprintNumber', 'cycleNumber', 'releaseNumber',
        'reportName', 'reportVersion', 'reportDate'
    ];
    
    fieldsToEnable.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.disabled = false;
            field.style.opacity = '1';
            field.style.cursor = 'auto';
        }
    });
}

// Setup event handlers for progressive form loading
function setupProgressiveFormHandlers() {
    const portfolioSelect = document.getElementById('portfolioName');
    const projectSelect = document.getElementById('projectName');
    
    if (portfolioSelect) {
        // Remove existing event listeners
        portfolioSelect.removeEventListener('change', onPortfolioChange);
        portfolioSelect.addEventListener('change', onPortfolioChange);
    }
    
    if (projectSelect) {
        // Remove existing event listeners
        projectSelect.removeEventListener('change', onProjectChangeProgressive);
        projectSelect.addEventListener('change', onProjectChangeProgressive);
    }
}

// Handle portfolio selection
async function onPortfolioChange(event) {
    const selectedOption = event.target.selectedOptions[0];
    if (selectedOption && selectedOption.value && selectedOption.dataset.id) {
        const portfolioId = selectedOption.dataset.id;
        await loadProjectsForPortfolio(portfolioId);
        
        // Clear project selection when portfolio changes
        const projectSelect = document.getElementById('projectName');
        if (projectSelect) {
            projectSelect.value = '';
        }
        
        // Keep other fields disabled until project is selected
        disableFieldsAfterPortfolio();
    } else {
        // If no portfolio selected, disable everything
        disableFormFieldsExceptPortfolio();
    }
}

// Handle project selection in progressive mode
async function onProjectChangeProgressive(event) {
    if (event.target.value) {
        enableAllRemainingFields();
        
        // Call existing project selection logic for auto-population
        if (typeof onProjectSelection === 'function') {
            await onProjectSelection();
        }
    } else {
        disableFieldsAfterPortfolio();
    }
}

// Disable fields that require project selection
function disableFieldsAfterPortfolio() {
    const fieldsToDisable = [
        'sprintNumber', 'cycleNumber', 'releaseNumber',
        'reportName', 'reportVersion', 'reportDate'
    ];
    
    fieldsToDisable.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.disabled = true;
            field.style.opacity = '0.5';
            field.style.cursor = 'not-allowed';
        }
    });
}

// Enhanced project dropdown population for filtered projects
function populateProjectDropdownFiltered(projects) {
    const select = document.getElementById('projectName');
    if (!select) return;

    select.innerHTML = '<option value="">Select Project</option>';
    
    projects.forEach(project => {
        const value = project.name.toLowerCase().replace(/\s+/g, '-');
        select.innerHTML += `<option value="${value}" data-id="${project.id}">${project.name}</option>`;
    });
}

// Make functions globally accessible
window.createNewReport = createNewReport;
window.searchReports = searchReports;
window.searchReportsImmediate = searchReportsImmediate;
window.viewReport = viewReport;
window.regenerateReport = regenerateReport;
window.deleteReport = deleteReport;
window.exportDashboardReport = exportDashboardReport;
window.toggleSidebar = toggleSidebar;
window.backToDashboard = backToDashboard; // Now redirects to dashboard HTML
window.showSection = showSection;
window.previousSection = previousSection;
window.nextSection = nextSection;
window.showAddPortfolioModal = showAddPortfolioModal;
window.addPortfolio = addPortfolio;
window.showAddProjectModal = showAddProjectModal;
window.addProject = addProject;
window.closeModal = closeModal;
window.showRequestModal = showRequestModal;
window.addRequest = addRequest;
window.removeRequest = removeRequest;
window.showBuildModal = showBuildModal;
window.addBuild = addBuild;
window.removeBuild = removeBuild;
window.showTesterModal = showTesterModal;
// window.addTester = addTester; // Replaced by addSelectedTester
window.removeTester = removeTester;
window.calculatePercentages = calculatePercentages;
window.calculateTestCasesPercentages = calculateTestCasesPercentages;
window.calculateIssuesPercentages = calculateIssuesPercentages;
window.calculateIssuesStatusPercentages = calculateIssuesStatusPercentages;
window.calculateEnhancementsPercentages = calculateEnhancementsPercentages;
window.goToPage = goToPage;
window.exportReportAsPdf = exportReportAsPdf;
window.exportReportAsExcel = exportReportAsExcel;
window.toggleWeightColumn = toggleWeightColumn; // If this is used on a page
window.toggleProjectReasonColumn = toggleProjectReasonColumn; // If this is used on a page
window.showAddQANoteFieldModal = showAddQANoteFieldModal;
window.updateQAFieldOptions = updateQAFieldOptions;
window.addQANoteField = addQANoteField;
window.removeQANoteField = removeQANoteField;
window.loadExistingTeamMembers = loadExistingTeamMembers;
window.handleTeamMemberSelection = handleTeamMemberSelection;
window.addSelectedTeamMember = addSelectedTeamMember;
window.loadExistingTesters = loadExistingTesters;
window.handleTesterSelection = handleTesterSelection;
window.addSelectedTester = addSelectedTester;
window.showToast = showToast;
window.removeToast = removeToast;
window.loadFormDropdownData = loadFormDropdownData; // Make it globally accessible
window.loadPortfoliosOnly = loadPortfoliosOnly;
window.loadProjectsForPortfolio = loadProjectsForPortfolio;
window.onPortfolioChange = onPortfolioChange;
window.onProjectChangeProgressive = onProjectChangeProgressive;
window.enableAllRemainingFields = enableAllRemainingFields;
window.populateProjectDropdownFiltered = populateProjectDropdownFiltered;
window.initializeCharts = initializeCharts; // Make it globally accessible

// Theme Toggle Functionality
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    updateThemeButton(newTheme);
}

function updateThemeButton(theme) {
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    if (theme === 'light') {
        themeIcon.className = 'fas fa-moon';
        themeText.textContent = 'Dark';
    } else {
        themeIcon.className = 'fas fa-sun';
        themeText.textContent = 'Light';
    }
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', initializeTheme);

// Make theme functions globally accessible
window.toggleTheme = toggleTheme;
window.initializeTheme = initializeTheme;
window.resetFormData = resetFormData; // Make it globally accessible
window.invalidateAllCaches = invalidateAllCaches; // Make cache invalidation globally accessible
window.fetchReport = fetchReport; // Make it globally accessible for editing
window.loadReportForEditing = loadReportForEditing; // Make it globally accessible for editing
window.onProjectSelection = onProjectSelection; // Make project selection handler globally accessible
window.onPortfolioSelection = onPortfolioSelection; // Make portfolio selection handler globally accessible
window.loadSelectedData = loadSelectedData; // Make data loading function globally accessible
window.editingReportId = editingReportId; // Make global variable accessible
window.allReportsCache = allReportsCache; // Make global variable accessible
window.dashboardStatsCache = dashboardStatsCache; // Make global variable accessible

// --- LocalStorage Functions ---

function saveFormDataToLocalStorage() {
    try {
        const form = document.getElementById('qaReportForm');
        if (!form) return;

        const formData = new FormData(form);
        const formObject = {};

        // Save form fields
        for (let [key, value] of formData.entries()) {
            formObject[key] = value;
        }

        // Save additional form elements that might not be in FormData
        const additionalFields = [
            'reportDate', 'portfolioName', 'projectName', 'sprintNumber',
            'reportVersion', 'cycleNumber', 'releaseNumber', 'testSummary',
            'testingStatus', 'qaNotesText'
        ];

        additionalFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                formObject[fieldId] = element.value;
            }
        });

        // Save calculated totals
        const calculatedFields = [
            'totalStories', 'totalTestCases', 'totalIssues', 'totalEnhancements'
        ];

        calculatedFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                formObject[fieldId] = element.value;
            }
        });

        localStorage.setItem(FORM_DATA_KEY, JSON.stringify(formObject));

        // Save arrays (requests, builds, testers, team members)
        const arrayData = {
            requestData: requestData,
            buildData: buildData,
            testerData: testerData,
            teamMemberData: teamMemberData
        };

        localStorage.setItem(FORM_ARRAYS_KEY, JSON.stringify(arrayData));

        console.log('Form data saved to localStorage:', Object.keys(formObject).length, 'fields');
    } catch (error) {
        console.error('Error saving form data to localStorage:', error);
    }
}

function loadFormDataFromLocalStorage() {
    try {
        console.log('Loading form data from localStorage...');
        const savedFormData = localStorage.getItem(FORM_DATA_KEY);
        const savedArrayData = localStorage.getItem(FORM_ARRAYS_KEY);

        if (savedFormData) {
            console.log('Found saved form data, loading...');
            const formObject = JSON.parse(savedFormData);

            // Load form fields
            Object.keys(formObject).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    element.value = formObject[key];
                }
            });
            console.log('Loaded', Object.keys(formObject).length, 'form fields');

            // Trigger calculations after loading data
            setTimeout(() => {
                if (typeof calculatePercentages === 'function') calculatePercentages();
                if (typeof calculateTestCasesPercentages === 'function') calculateTestCasesPercentages();
                if (typeof calculateIssuesPercentages === 'function') calculateIssuesPercentages();
                if (typeof calculateIssuesStatusPercentages === 'function') calculateIssuesStatusPercentages();
                if (typeof calculateEnhancementsPercentages === 'function') calculateEnhancementsPercentages();
                if (typeof updateAutoCalculatedFields === 'function') updateAutoCalculatedFields();
            }, 500);
        } else {
            console.log('No saved form data found in localStorage');
        }

        if (savedArrayData) {
            console.log('Found saved array data, loading...');
            const arrayObject = JSON.parse(savedArrayData);

            // Load arrays
            if (arrayObject.requestData) {
                requestData = arrayObject.requestData;
                renderRequestList();
            }

            if (arrayObject.buildData) {
                buildData = arrayObject.buildData;
                renderBuildList();
            }

            if (arrayObject.testerData) {
                testerData = arrayObject.testerData;
                renderTesterList();
            }

            if (arrayObject.teamMemberData) {
                teamMemberData = arrayObject.teamMemberData;
                renderTeamMemberList();
            }
        } else {
            console.log('No saved array data found');
        }

        console.log('Form data loaded from localStorage');
    } catch (error) {
        console.error('Error loading form data from localStorage:', error);
    }
}

function clearFormDataFromLocalStorage() {
    try {
        localStorage.removeItem(FORM_DATA_KEY);
        localStorage.removeItem(FORM_ARRAYS_KEY);
        console.log('Form data cleared from localStorage');
    } catch (error) {
        console.error('Error clearing form data from localStorage:', error);
    }
}

function autoSaveFormData() {
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }
    autoSaveTimeout = setTimeout(() => {
        console.log('Auto-saving form data...');
        saveFormDataToLocalStorage();
    }, 1000); // Save after 1 second of inactivity
}

// Add event listeners for auto-save
function setupAutoSave() {
    const form = document.getElementById('qaReportForm');
    if (form) {
        console.log('Setting up autosave on form');
        form.addEventListener('input', autoSaveFormData);
        form.addEventListener('change', autoSaveFormData);
    } else {
        console.error('qaReportForm not found - autosave not set up');
    }
}

// Clear localStorage when form is submitted
function clearFormDataOnSubmit() {
    try {
        // Clear form data from localStorage
        clearFormDataFromLocalStorage();
        
        // Reset form arrays
        requestData = [];
        buildData = [];
        testerData = [];
        teamMemberData = [];
        qaNoteFieldsData = [];
        qaNotesData = [];
        
        // Reset form fields
        const form = document.getElementById('qaReportForm');
        if (form) {
            form.reset();
        }
        
        // Reset charts if they exist
        resetAllCharts();
        
        // Reset current section to the first one
        currentSection = 0;
        updateNavigationButtons();
        
        console.log('Form data cleared after successful submission');
    } catch (error) {
        console.error('Error clearing form data after submission:', error);
    }
}

// Override the existing arrays when they're modified
const originalAddRequest = window.addRequest;
const originalAddBuild = window.addBuild;
const originalAddSelectedTester = window.addSelectedTester;
const originalAddSelectedTeamMember = window.addSelectedTeamMember;

if (typeof originalAddRequest === 'function') {
    window.addRequest = function(...args) {
        const result = originalAddRequest.apply(this, args);
        autoSaveFormData();
        return result;
    };
}

if (typeof originalAddBuild === 'function') {
    window.addBuild = function(...args) {
        const result = originalAddBuild.apply(this, args);
        autoSaveFormData();
        return result;
    };
}

if (typeof originalAddSelectedTester === 'function') {
    window.addSelectedTester = function(...args) {
        const result = originalAddSelectedTester.apply(this, args);
        autoSaveFormData();
        return result;
    };
}

if (typeof originalAddSelectedTeamMember === 'function') {
    window.addSelectedTeamMember = function(...args) {
        const result = originalAddSelectedTeamMember.apply(this, args);
        autoSaveFormData();
        return result;
    };
}

// Make functions globally accessible

window.setupAutoSave = setupAutoSave;
window.clearFormDataOnSubmit = clearFormDataOnSubmit;
