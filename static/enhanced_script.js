// static/enhanced_script.js

// --- Global variables ---
let currentSection = 0;
let editingReportId = null;
let currentPage = 1;
const reportsPerPage = 10;
let allReportsCache = []; // Cache for all reports to avoid re-fetching
let dashboardStatsCache = null; // Cache for dashboard statistics

// Form-specific variables
let requestData = [];
let buildData = [];
let testerData = [];
let customFieldsData = [];
let userStoriesChart = null;
let testCasesChart = null;
let issuesPriorityChart = null;
let issuesStatusChart = null;
let enhancementsChart = null;
let scoreColumnCount = 0;
let weightReasonVisible = false;

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
        const response = await fetch(DASHBOARD_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
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

// --- Initialize App ---
// Update the existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async () => {
    // Initial data load
    allReportsCache = await fetchReports();
    dashboardStatsCache = await fetchDashboardStats();
    
    updateDashboardStats(dashboardStatsCache);
    searchReports(); // Initial render of the reports table

    // Set up form and charts
    document.getElementById('reportDate').value = getCurrentDate();
    updateNavigationButtons();
    initializeCharts();
    
    // Load dropdown data for portfolios and projects
    await loadFormDropdownData();
});

async function loadFormDropdownData() {
    try {
        // Load portfolios
        const portfolioResponse = await fetch('/api/portfolios');
        if (portfolioResponse.ok) {
            const portfolios = await portfolioResponse.json();
            populatePortfolioDropdown(portfolios);
        }
        
        // Load projects
        const projectResponse = await fetch('/api/projects');
        if (projectResponse.ok) {
            const projects = await projectResponse.json();
            populateProjectDropdown(projects);
        }
    } catch (error) {
        console.error('Error loading form data:', error);
    }
}

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

// Replace all alert() calls with showToast()
// Update all your existing functions to use showToast instead of alert


// --- Dashboard Functions ---
function updateDashboardStats(stats) {
    if (!stats) return;

    // Update overall statistics
    const overall = stats.overall;
    document.getElementById('totalReports').textContent = overall.totalReports || 0;
    document.getElementById('completedReports').textContent = overall.completedReports || 0;
    document.getElementById('inProgressReports').textContent = overall.inProgressReports || 0;
    document.getElementById('pendingReports').textContent = overall.pendingReports || 0;
    
    // Update aggregate metrics
    document.getElementById('totalUserStories').textContent = overall.totalUserStories || 0;
    document.getElementById('totalTestCases').textContent = overall.totalTestCases || 0;
    document.getElementById('totalIssues').textContent = overall.totalIssues || 0;
    document.getElementById('totalEnhancements').textContent = overall.totalEnhancements || 0;
    document.getElementById('avgEvaluationScore').textContent = overall.avgEvaluationScore || '0.0';
    document.getElementById('avgProjectEvaluationScore').textContent = overall.avgProjectEvaluationScore || '0.0';

    // Update project-specific metrics
    renderProjectMetrics(stats.projects);
}

function renderProjectMetrics(projects) {
    const container = document.getElementById('projectMetrics');
    if (!projects || projects.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; color: #6c757d; padding: 40px 0;">
                <div style="font-size: 3em; margin-bottom: 20px;">📊</div>
                <h3>No Projects Found</h3>
                <p>Create your first report to see project metrics here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = projects.map(project => `
        <div class="project-metric-card">
            <div class="project-header">
                <h3>${project.projectName}</h3>
                <p class="portfolio-name">${project.portfolioName}</p>
                <span class="status-badge status-${getStatusClass(project.testingStatus)}">${getStatusText(project.testingStatus)}</span>
            </div>
            <div class="project-metrics">
                <div class="metric-row">
                    <div class="metric-item">
                        <span class="metric-value">${project.totalReports}</span>
                        <span class="metric-label">Reports</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-value">${project.totalUserStories}</span>
                        <span class="metric-label">User Stories</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-value">${project.totalTestCases}</span>
                        <span class="metric-label">Test Cases</span>
                    </div>
                </div>
                <div class="metric-row">
                    <div class="metric-item">
                        <span class="metric-value">${project.totalIssues}</span>
                        <span class="metric-label">Issues</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-value">${project.totalEnhancements}</span>
                        <span class="metric-label">Enhancements</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-value">${project.avgEvaluationScore.toFixed(1)}</span>
                        <span class="metric-label">Eval Score</span>
                    </div>
                </div>
                <div class="metric-row">
                    <div class="metric-item">
                        <span class="metric-value">${project.avgProjectEvaluationScore.toFixed(1)}</span>
                        <span class="metric-label">Project Score</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-value">${formatDate(project.lastReportDate)}</span>
                        <span class="metric-label">Last Report</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

async function exportDashboardReport() {
    if (!dashboardStatsCache) {
        alert('No dashboard data available to export.');
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
            project.avgEvaluationScore.toFixed(1)
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
    const values = {
        passed: parseInt(document.getElementById('passedTestCases')?.value) || 0,
        passedWithIssues: parseInt(document.getElementById('passedWithIssuesTestCases')?.value) || 0,
        failed: parseInt(document.getElementById('failedTestCases')?.value) || 0,
        blocked: parseInt(document.getElementById('blockedTestCases')?.value) || 0,
        cancelled: parseInt(document.getElementById('cancelledTestCases')?.value) || 0,
        deferred: parseInt(document.getElementById('deferredTestCases')?.value) || 0,
        notTestable: parseInt(document.getElementById('notTestableTestCases')?.value) || 0,
    };

    // Update total field (readonly)
    document.getElementById('totalTestCases').value = total;
    document.getElementById('testCasesMetric').value = total;

    // Update percentages
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
    
    // Update total field (readonly)
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

    // Update total field (readonly)
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

function calculateEvaluationTotals() {
    const scoreFields = document.querySelectorAll('input[name^="eval_"][name$="_score"]');
    let total = 0;
    let count = 0;
    
    scoreFields.forEach(field => {
        const value = parseFloat(field.value);
        if (!isNaN(value)) {
            total += value;
            count++;
        }
    });
    
    const average = count > 0 ? (total / count).toFixed(2) : '0.00';
    const totalField = document.getElementById('evaluationTotalScoreField');
    const metricField = document.getElementById('evaluationTotalScore');
    
    if (totalField) totalField.value = average;
    if (metricField) metricField.value = average;
}

function calculateProjectEvaluationTotals() {
    const scoreFields = document.querySelectorAll('input[name^="proj_"][name$="_score"]:not([name="proj_final_score"])');
    let total = 0;
    let count = 0;
    
    scoreFields.forEach(field => {
        const value = parseFloat(field.value);
        if (!isNaN(value)) {
            total += value;
            count++;
        }
    });
    
    const average = count > 0 ? (total / count).toFixed(2) : '0.00';
    const totalField = document.getElementById('projectEvaluationTotalScoreField');
    const metricField = document.getElementById('projectEvaluationTotalScore');
    
    if (totalField) totalField.value = average;
    if (metricField) metricField.value = average;
}

// --- Evaluation Section Functions ---
function addScoreColumn() {
    scoreColumnCount++;
    const headerRow = document.getElementById('evaluationHeader');
    const table = document.getElementById('evaluationTable');
    
    // Add header
    const newHeader = document.createElement('th');
    newHeader.textContent = `Score ${scoreColumnCount}`;
    newHeader.className = 'dynamic-score-column';
    headerRow.insertBefore(newHeader, headerRow.children[headerRow.children.length - (weightReasonVisible ? 2 : 0)]);
    
    // Add cells to each row
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row, index) => {
        if (row.querySelector('input[name$="_score"]')) { // Only score rows, not total row
            const newCell = document.createElement('td');
            newCell.className = 'dynamic-score-column';
            const input = document.createElement('input');
            input.type = 'text';
            input.name = `eval_score_${scoreColumnCount}_${index}`;
            input.placeholder = 'Enter score';
            input.oninput = calculateEvaluationTotals;
            newCell.appendChild(input);
            row.insertBefore(newCell, row.children[row.children.length - (weightReasonVisible ? 2 : 0)]);
        } else {
            // Total row
            const newCell = document.createElement('td');
            newCell.className = 'dynamic-score-column';
            newCell.textContent = '-';
            row.insertBefore(newCell, row.children[row.children.length - (weightReasonVisible ? 2 : 0)]);
        }
    });
}

function toggleWeightReason() {
    weightReasonVisible = !weightReasonVisible;
    const columns = document.querySelectorAll('.weight-reason-column');
    const button = document.getElementById('toggleWeightReasonBtn');
    
    columns.forEach(col => {
        col.style.display = weightReasonVisible ? 'table-cell' : 'none';
    });
    
    button.textContent = weightReasonVisible ? 'Hide Weight & Reason' : 'Show Weight & Reason';
}

// --- Custom Fields Functions ---
function showAddCustomFieldModal() {
    showModal('addCustomFieldModal');
}

function updateCustomFieldOptions() {
    const type = document.getElementById('customFieldType').value;
    const optionsDiv = document.getElementById('customFieldOptions');
    
    if (type === 'select' || type === 'radio' || type === 'checkbox') {
        optionsDiv.style.display = 'block';
    } else {
        optionsDiv.style.display = 'none';
    }
}

function addCustomField() {
    const name = document.getElementById('customFieldName').value.trim();
    const type = document.getElementById('customFieldType').value;
    const required = document.getElementById('customFieldRequired').checked;
    const showInReport = document.getElementById('customFieldShowInReport').checked;
    const optionsList = document.getElementById('customFieldOptionsList').value.trim();
    
    if (!name) {
        alert('Please enter a field name.');
        return;
    }
    
    const options = (type === 'select' || type === 'radio' || type === 'checkbox') && optionsList 
        ? optionsList.split('\n').map(opt => opt.trim()).filter(opt => opt)
        : [];
    
    const customField = {
        id: `custom_${Date.now()}`,
        name,
        type,
        required,
        showInReport,
        options,
        value: type === 'checkbox' ? [] : ''
    };
    
    customFieldsData.push(customField);
    renderCustomFields();
    closeModal('addCustomFieldModal');
    
    // Clear form
    document.getElementById('customFieldName').value = '';
    document.getElementById('customFieldType').value = 'input';
    document.getElementById('customFieldRequired').checked = false;
    document.getElementById('customFieldShowInReport').checked = true;
    document.getElementById('customFieldOptionsList').value = '';
    updateCustomFieldOptions();
}

function renderCustomFields() {
    const container = document.getElementById('customFieldsList');
    
    if (customFieldsData.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; color: #6c757d; padding: 40px 0;">
                <div style="font-size: 3em; margin-bottom: 20px;">📝</div>
                <h3>No Custom Fields Added</h3>
                <p>Click "Add Custom Field" to create custom fields for this report.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = customFieldsData.map(field => renderCustomFieldHTML(field)).join('');
}

function renderCustomFieldHTML(field) {
    let inputHTML = '';
    
    switch (field.type) {
        case 'input':
            inputHTML = `<input type="text" id="${field.id}" name="${field.id}" placeholder="Enter ${field.name.toLowerCase()}" ${field.required ? 'required' : ''}>`;
            break;
        case 'textarea':
            inputHTML = `<textarea id="${field.id}" name="${field.id}" placeholder="Enter ${field.name.toLowerCase()}" rows="4" ${field.required ? 'required' : ''}></textarea>`;
            break;
        case 'number':
            inputHTML = `<input type="number" id="${field.id}" name="${field.id}" placeholder="Enter ${field.name.toLowerCase()}" ${field.required ? 'required' : ''}>`;
            break;
        case 'date':
            inputHTML = `<input type="date" id="${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>`;
            break;
        case 'select':
            inputHTML = `
                <select id="${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>
                    <option value="">Select ${field.name}</option>
                    ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                </select>
            `;
            break;
        case 'radio':
            inputHTML = field.options.map((opt, index) => `
                <label class="radio-option">
                    <input type="radio" name="${field.id}" value="${opt}" ${field.required && index === 0 ? 'required' : ''}>
                    ${opt}
                </label>
            `).join('');
            break;
        case 'checkbox':
            inputHTML = field.options.map(opt => `
                <label class="checkbox-option">
                    <input type="checkbox" name="${field.id}" value="${opt}">
                    ${opt}
                </label>
            `).join('');
            break;
    }
    
    return `
        <div class="custom-field-item">
            <div class="custom-field-header">
                <h4>${field.name}</h4>
                <div class="custom-field-badges">
                    ${field.required ? '<span class="badge badge-required">Required</span>' : ''}
                    ${field.showInReport ? '<span class="badge badge-visible">Show in Report</span>' : '<span class="badge badge-hidden">Hidden</span>'}
                    <button type="button" class="btn-remove-field" onclick="removeCustomField('${field.id}')">Remove</button>
                </div>
            </div>
            <div class="custom-field-input">
                ${inputHTML}
            </div>
        </div>
    `;
}

function removeCustomField(fieldId) {
    customFieldsData = customFieldsData.filter(field => field.id !== fieldId);
    renderCustomFields();
}

// --- Dynamic Form Sections (Request, Build, Tester) ---
function showRequestModal() { showModal('requestModal'); }
function showBuildModal() { showModal('buildModal'); }
function showTesterModal() { showModal('testerModal'); }

function addRequest() {
    const requestId = document.getElementById('requestId').value.trim();
    const requestUrl = document.getElementById('requestUrl').value.trim();
    if (requestId && requestUrl) {
        requestData.push({ id: requestId, url: requestUrl });
        renderRequestList();
        closeModal('requestModal');
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
    }
}

function addTester() {
    const testerName = document.getElementById('testerName').value.trim();
    if (testerName) {
        testerData.push({ name: testerName });
        renderTesterList();
        closeModal('testerModal');
    }
}

function renderDynamicList(containerId, data, renderItemFn, removeFn) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (data.length === 0) {
        container.innerHTML = `<div class="empty-state" style="text-align: center; color: #6c757d; padding: 20px 0;">No items added yet.</div>`;
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
    renderDynamicList('testerList', testerData, (item, index) => `
        <div class="dynamic-item">
            <div><strong>Tester:</strong> ${item.name}</div>
            <button type="button" class="btn-sm btn-delete" onclick="removeTester(${index})">Remove</button>
        </div>`, removeTester);
}

function removeRequest(index) { requestData.splice(index, 1); renderRequestList(); }
function removeBuild(index) { buildData.splice(index, 1); renderBuildList(); }
function removeTester(index) { testerData.splice(index, 1); renderTesterList(); }

// --- Page Management & Navigation ---
function showPage(pageId) {
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector(`.nav-link[onclick="showPage('${pageId}')"]`)?.classList.add('active');
    
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId)?.classList.add('active');

    if (pageId === 'reportsPage') {
        searchReports();
    } else if (pageId === 'dashboardPage') {
        // Refresh dashboard data
        fetchDashboardStats().then(stats => {
            dashboardStatsCache = stats;
            updateDashboardStats(stats);
        });
    }
}

function showSection(sectionIndex) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${sectionIndex}`)?.classList.add('active');
    
    document.querySelectorAll('#sidebar .nav-item').forEach((item, index) => {
        item.classList.toggle('active', index === sectionIndex);
    });
    
    currentSection = sectionIndex;
    updateNavigationButtons();
}

function nextSection() { if (currentSection < 10) showSection(currentSection + 1); }
function previousSection() { if (currentSection > 0) showSection(currentSection - 1); }

function updateNavigationButtons() {
    document.getElementById('prevBtn').disabled = currentSection === 0;
    const isLastSection = currentSection === 10;
    document.getElementById('nextBtn').style.display = isLastSection ? 'none' : 'inline-block';
    document.getElementById('submitBtn').style.display = isLastSection ? 'inline-block' : 'none';
}

function backToDashboard() { showPage('dashboardPage'); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

// --- Reports Table Functions ---
function searchReports() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    
    const filtered = allReportsCache.filter(report => 
        Object.values(report).some(value => 
            String(value).toLowerCase().includes(searchQuery)
        )
    );

    // Apply pagination to the filtered results
    const total = filtered.length;
    const totalPages = Math.ceil(total / reportsPerPage);
    const start = (currentPage - 1) * reportsPerPage;
    const paginatedData = filtered.slice(start, start + reportsPerPage);

    renderReportsTable(paginatedData);
    renderPagination({
        total,
        page: currentPage,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
    });
}

function renderReportsTable(reports) {
    const tbody = document.getElementById('reportsTableBody');
    if (reports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">📋</div><h3>No Reports Found</h3><p>Create a new report or adjust your search.</p></div></td></tr>`;
        return;
    }
    tbody.innerHTML = reports.map(report => `
        <tr>
            <td><strong>${report.portfolioName || 'N/A'} - Sprint ${report.sprintNumber || 'N/A'}</strong><br><small>v${report.reportVersion || '1.0'}</small></td>
            <td>${report.projectName || 'N/A'}</td>
            <td>${report.portfolioName || 'N/A'}</td>
            <td>#${report.sprintNumber || 'N/A'}</td>
            <td>${formatDate(report.reportDate)}</td>
            <td><span class="status-badge status-${getStatusClass(report.testingStatus)}">${getStatusText(report.testingStatus)}</span></td>
            <td>
                <div class="action-buttons-cell">
                    <button class="btn-sm btn-view" onclick="viewReport(${report.id})" title="View Report">👁️</button>
                    <button class="btn-sm btn-regenerate" onclick="regenerateReport(${report.id})" title="Edit Report">🔄</button>
                    <button class="btn-sm btn-export-pdf" onclick="exportReportAsPdf(${report.id})" title="Export as PDF">📄</button>
                    <button class="btn-sm btn-export-excel" onclick="exportReportAsExcel(${report.id})" title="Export as Excel">📊</button>
                    <button class="btn-sm btn-delete" onclick="deleteReport(${report.id})" title="Delete Report">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderPagination(result) {
    const pagination = document.getElementById('pagination');
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
    searchReports();
}

// --- Report Actions (CRUD) ---
function createNewReport() {
    editingReportId = null;
    resetFormData();
    showSection(0);
    showPage('formPage');
    document.getElementById('formTitle').textContent = 'Create Enhanced QA Report';
}

async function regenerateReport(id) {
    const report = await fetchReport(id);
    if (report) {
        editingReportId = id;
        loadReportForEditing(report);
        showPage('formPage');
        document.getElementById('formTitle').textContent = 'Edit QA Report';
    }
}

async function deleteReport(id) {
    if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
        const result = await deleteReportDB(id);
        if (result) {
            allReportsCache = allReportsCache.filter(r => r.id !== id);
            dashboardStatsCache = await fetchDashboardStats();
            searchReports();
            updateDashboardStats(dashboardStatsCache);
        }
    }
}

function viewReport(id) {
    window.open(`/report/${id}`, '_blank');
}

// --- Form Handling ---
function resetFormData() {
    document.getElementById('qaReportForm').reset();
    document.getElementById('reportDate').value = getCurrentDate();
    requestData = [];
    buildData = [];
    testerData = [];
    customFieldsData = [];
    scoreColumnCount = 0;
    weightReasonVisible = false;
    renderRequestList();
    renderBuildList();
    renderTesterList();
    renderCustomFields();
    resetAllCharts();
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
    resetFormData();
    
    // Basic fields
    const basicFields = ['portfolioName', 'projectName', 'sprintNumber', 'reportVersion', 'cycleNumber', 'reportDate', 'testSummary', 'testingStatus', 'qaNotesText'];
    basicFields.forEach(field => {
        const element = document.getElementById(field);
        if (element && report[field]) {
            element.value = report[field];
        }
    });
    
    // User Stories
    const userStoryFields = ['passedUserStories', 'passedWithIssuesUserStories', 'failedUserStories', 'blockedUserStories', 'cancelledUserStories', 'deferredUserStories', 'notTestableUserStories'];
    userStoryFields.forEach(field => {
        const element = document.getElementById(field.replace('UserStories', 'Stories'));
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
    customFieldsData = Object.entries(report.customFields || {}).map(([key, value]) => ({
        id: key,
        name: key.replace('custom_', '').replace(/_/g, ' '),
        value: value,
        type: 'input', // Default type for loaded data
        required: false,
        showInReport: true,
        options: []
    }));
    
    renderRequestList();
    renderBuildList();
    renderTesterList();
    renderCustomFields();
    
    // Load evaluation data
    if (report.evaluationData) {
        Object.entries(report.evaluationData).forEach(([key, value]) => {
            const element = document.querySelector(`input[name="${key}"]`);
            if (element) {
                element.value = value;
            }
        });
    }
    
    // Load project evaluation data
    if (report.projectEvaluationData) {
        Object.entries(report.projectEvaluationData).forEach(([key, value]) => {
            const element = document.querySelector(`input[name="${key}"]`);
            if (element) {
                element.value = value;
            }
        });
    }
    
    // Recalculate all totals and charts
    calculatePercentages();
    calculateTestCasesPercentages();
    calculateIssuesPercentages();
    calculateEnhancementsPercentages();
    calculateEvaluationTotals();
    calculateProjectEvaluationTotals();
}

// Form submission handler
document.getElementById('qaReportForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const reportData = {};
    
    // Collect form data
    for (let [key, value] of formData.entries()) {
        if (key.includes('[]')) {
            // Handle checkbox arrays
            const arrayKey = key.replace('[]', '');
            if (!reportData[arrayKey]) reportData[arrayKey] = [];
            reportData[arrayKey].push(value);
        } else {
            reportData[key] = value;
        }
    }

    // Add dynamic data
    reportData.requestData = requestData;
    reportData.buildData = buildData;
    reportData.testerData = testerData;

    // Add evaluation data
    const evaluationData = {};
    const projectEvaluationData = {};
    
    // Collect evaluation fields
    document.querySelectorAll('input[name^="eval_"]').forEach(input => {
        if (input.value.trim()) {
            evaluationData[input.name] = input.value;
        }
    });
    
    // Collect project evaluation fields
    document.querySelectorAll('input[name^="proj_"]').forEach(input => {
        if (input.value.trim()) {
            projectEvaluationData[input.name] = input.value;
        }
    });
    
    reportData.evaluationData = evaluationData;
    reportData.projectEvaluationData = projectEvaluationData;

    // Add custom fields data
    const customFields = {};
    customFieldsData.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            if (field.type === 'checkbox') {
                const checkedBoxes = document.querySelectorAll(`input[name="${field.id}"]:checked`);
                customFields[field.id] = Array.from(checkedBoxes).map(cb => cb.value);
            } else {
                customFields[field.id] = element.value;
            }
        }
    });
    reportData.customFields = customFields;

    const savedReport = await saveReport(reportData);
    if (savedReport) {
        // Refresh local data cache and UI
        allReportsCache = await fetchReports();
        dashboardStatsCache = await fetchDashboardStats();
        updateDashboardStats(dashboardStatsCache);
        showPage('reportsPage');
        alert('Report saved successfully!');
    } else {
        alert('Failed to save report. Please try again.');
    }
});

// --- Enhanced Export Functions ---
async function exportReportAsPdf(id) {
    const report = allReportsCache.find(r => r.id === id);
    if (!report) {
        console.error("Report not found for PDF export:", id);
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
            ['Evaluation Score', report.evaluationTotalScore || 0],
            ['Project Evaluation Score', report.projectEvaluationTotalScore || 0]
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
        const testersData = report.testerData.map(tester => [tester.name]);
        addDataTable("Testers", testersData, ['Tester Name']);
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
}

async function exportReportAsExcel(id) {
    const report = allReportsCache.find(r => r.id === id);
    if (!report) {
        console.error("Report not found for Excel export:", id);
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
        ["Evaluation Score", report.evaluationTotalScore || 0],
        ["Project Evaluation Score", report.projectEvaluationTotalScore || 0],
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
        const testerHeaders = ["Tester Name"];
        const testersSheetData = report.testerData.map(tester => [tester.name]);
        const wsTesters = XLSX.utils.aoa_to_sheet([testerHeaders, ...testersSheetData]);
        XLSX.utils.book_append_sheet(workbook, wsTesters, "Testers");
    }

    // Evaluation Data Sheet
    if (report.evaluationData && Object.keys(report.evaluationData).length > 0) {
        const evalHeaders = ["Criteria", "Value"];
        const evalSheetData = Object.entries(report.evaluationData).map(([key, value]) => [
            key.replace(/eval_|_score|_weight|_reason/g, '').replace(/_/g, ' '),
            value
        ]);
        const wsEvaluation = XLSX.utils.aoa_to_sheet([evalHeaders, ...evalSheetData]);
        XLSX.utils.book_append_sheet(workbook, wsEvaluation, "Evaluation");
    }

    // Project Evaluation Data Sheet
    if (report.projectEvaluationData && Object.keys(report.projectEvaluationData).length > 0) {
        const projEvalHeaders = ["Criteria", "Value"];
        const projEvalSheetData = Object.entries(report.projectEvaluationData).map(([key, value]) => [
            key.replace(/proj_|_score|_reason/g, '').replace(/_/g, ' '),
            value
        ]);
        const wsProjEvaluation = XLSX.utils.aoa_to_sheet([projEvalHeaders, ...projEvalSheetData]);
        XLSX.utils.book_append_sheet(workbook, wsProjEvaluation, "Project Evaluation");
    }

    // Custom Fields Sheet
    if (report.customFields && Object.keys(report.customFields).length > 0) {
        const customFieldHeaders = ["Field Name", "Value"];
        const customFieldsSheetData = Object.entries(report.customFields).map(([key, value]) => [
            key.replace(/custom_/g, '').replace(/_/g, ' '),
            Array.isArray(value) ? value.join(', ') : value
        ]);
        const wsCustomFields = XLSX.utils.aoa_to_sheet([customFieldHeaders, ...customFieldsSheetData]);
        XLSX.utils.book_append_sheet(workbook, wsCustomFields, "Custom Fields");
    }

    XLSX.writeFile(workbook, `QA_Report_${report.portfolioName}_Sprint_${report.sprintNumber}.xlsx`);
}

// --- Modal & Utility Functions ---
function showModal(modalId) { 
    document.getElementById(modalId).style.display = 'block'; 
}

function closeModal(modalId) { 
    document.getElementById(modalId).style.display = 'none';
    // Clear form inputs
    const modal = document.getElementById(modalId);
    const inputs = modal.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });
}

function showAddPortfolioModal() {
    showModal('addPortfolioModal');
}

function showAddProjectModal() {
    showModal('addProjectModal');
}

function addPortfolio() {
    const name = document.getElementById('newPortfolioName').value.trim();
    if (name) {
        const select = document.getElementById('portfolioName');
        const option = new Option(name, name.toLowerCase().replace(/\s+/g, '-'));
        select.add(option);
        select.value = option.value;
        closeModal('addPortfolioModal');
    }
}

function addProject() {
    const name = document.getElementById('newProjectName').value.trim();
    if (name) {
        const select = document.getElementById('projectName');
        const option = new Option(name, name.toLowerCase().replace(/\s+/g, '-'));
        select.add(option);
        select.value = option.value;
        closeModal('addProjectModal');
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
    const isVisible = columns[0].style.display !== 'none';
    
    columns.forEach(col => {
        col.style.display = isVisible ? 'none' : 'table-cell';
    });
    
    button.textContent = isVisible ? 'Show Weight' : 'Hide Weight';
}

function toggleProjectReasonColumn() {
    const columns = document.querySelectorAll('.project-reason-column');
    const button = document.getElementById('toggleProjectReasonBtn');
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
                option.value = JSON.stringify(member);
                option.textContent = `${member.name} - ${member.role} (${member.email})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading team members:', error);
    }
}

function handleTeamMemberSelection() {
    const select = document.getElementById('existingTeamMemberSelect');
    const newNameField = document.getElementById('newTeamMemberName');
    const newEmailField = document.getElementById('newTeamMemberEmail');
    const newRoleField = document.getElementById('newTeamMemberRole');
    
    if (select.value) {
        const selectedMember = JSON.parse(select.value);
        newNameField.value = '';
        newEmailField.value = '';
        newRoleField.value = '';
        newNameField.disabled = true;
        newEmailField.disabled = true;
        newRoleField.disabled = true;
    } else {
        newNameField.disabled = false;
        newEmailField.disabled = false;
        newRoleField.disabled = false;
    }
}

function clearTeamMemberForm() {
    document.getElementById('existingTeamMemberSelect').value = '';
    document.getElementById('newTeamMemberName').value = '';
    document.getElementById('newTeamMemberEmail').value = '';
    document.getElementById('newTeamMemberRole').value = '';
    document.getElementById('newTeamMemberName').disabled = false;
    document.getElementById('newTeamMemberEmail').disabled = false;
    document.getElementById('newTeamMemberRole').disabled = false;
}

async function addSelectedTeamMember() {
    const existingSelect = document.getElementById('existingTeamMemberSelect');
    const newName = document.getElementById('newTeamMemberName').value.trim();
    const newEmail = document.getElementById('newTeamMemberEmail').value.trim();
    const newRole = document.getElementById('newTeamMemberRole').value;
    
    let memberToAdd = null;
    
    if (existingSelect.value) {
        memberToAdd = JSON.parse(existingSelect.value);
    } else if (newName && newEmail && newRole) {
        try {
            const response = await fetch('/api/team-members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, email: newEmail, role: newRole })
            });
            
            if (response.ok) {
                memberToAdd = await response.json();
            } else {
                const error = await response.json();
                showToast('Error creating team member: ' + (error.error || 'Unknown error'), 'error');
                return;
            }
        } catch (error) {
            console.error('Error creating team member:', error);
            showToast('Error creating team member', 'error');
            return;
        }
    } else {
        showToast('Please either select an existing team member or provide all details for a new member', 'warning');
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

async function loadTeamMembersForSelection() {
    try {
        const response = await fetch('/api/team-members');
        if (response.ok) {
            const existingMembers = await response.json();
            // You can populate a dropdown to select existing members
            // or show suggestions as the user types
        }
    } catch (error) {
        console.error('Error loading team members:', error);
    }
}

function addTeamMember() {
    const name = document.getElementById('teamMemberName').value.trim();
    const role = document.getElementById('teamMemberRole').value.trim();
    const email = document.getElementById('teamMemberEmail').value.trim();
    
    if (name && role && email) {
        teamMemberData.push({ name, role, email });
        renderTeamMemberList();
        closeModal('teamMemberModal');
        
        // Clear form
        document.getElementById('teamMemberName').value = '';
        document.getElementById('teamMemberRole').value = '';
        document.getElementById('teamMemberEmail').value = '';
    } else {
        alert('Please fill in all fields');
    }
}

function renderTeamMemberList() {
    const container = document.getElementById('teamMemberList');
    if (teamMemberData.length === 0) {
        container.innerHTML = '<div class="empty-state">No team members added yet.</div>';
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
}

// Enhanced tester management functions
async function showTesterModal() {
    await loadExistingTesters();
    clearTesterForm();
    showModal('testerModal');
}

async function loadExistingTesters() {
    try {
        const response = await fetch('/api/testers');
        if (response.ok) {
            const testers = await response.json();
            const select = document.getElementById('existingTesterSelect');
            
            // Clear existing options except the first one
            select.innerHTML = '<option value="">-- Select from existing testers --</option>';
            
            // Add existing testers as options
            testers.forEach(tester => {
                const option = document.createElement('option');
                option.value = JSON.stringify(tester);
                option.textContent = `${tester.name} (${tester.email})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading testers:', error);
    }
}

function handleTesterSelection() {
    const select = document.getElementById('existingTesterSelect');
    const newNameField = document.getElementById('newTesterName');
    const newEmailField = document.getElementById('newTesterEmail');
    
    if (select.value) {
        // If existing tester selected, clear new tester fields
        newNameField.value = '';
        newEmailField.value = '';
        newNameField.disabled = true;
        newEmailField.disabled = true;
    } else {
        // If no existing tester selected, enable new tester fields
        newNameField.disabled = false;
        newEmailField.disabled = false;
    }
}

function clearTesterForm() {
    document.getElementById('existingTesterSelect').value = '';
    document.getElementById('newTesterName').value = '';
    document.getElementById('newTesterEmail').value = '';
    document.getElementById('newTesterName').disabled = false;
    document.getElementById('newTesterEmail').disabled = false;
}

async function addSelectedTester() {
    const existingTesterSelect = document.getElementById('existingTesterSelect');
    const newTesterName = document.getElementById('newTesterName').value.trim();
    const newTesterEmail = document.getElementById('newTesterEmail').value.trim();
    
    let testerToAdd = null;
    
    if (existingTesterSelect.value) {
        // Use existing tester
        testerToAdd = JSON.parse(existingTesterSelect.value);
    } else if (newTesterName && newTesterEmail) {
        // Create new tester
        try {
            const response = await fetch('/api/testers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTesterName, email: newTesterEmail })
            });
            
            if (response.ok) {
                testerToAdd = await response.json();
            } else {
                const error = await response.json();
                alert('Error creating tester: ' + (error.error || 'Unknown error'));
                return;
            }
        } catch (error) {
            console.error('Error creating tester:', error);
            alert('Error creating tester');
            return;
        }
    } else {
        alert('Please either select an existing tester or provide name and email for a new tester');
        return;
    }
    
    if (testerToAdd) {
        // Check if tester already added to this report
        const alreadyAdded = testerData.some(t => t.email === testerToAdd.email);
        if (alreadyAdded) {
            alert('This tester is already added to the report');
            return;
        }
        
        // Add tester to report
        testerData.push({
            id: testerToAdd.id,
            name: testerToAdd.name,
            email: testerToAdd.email
        });
        
        renderTesterList();
        closeModal('testerModal');
    }
}

// Update the render function to show email
function renderTesterList() {
    const container = document.getElementById('testerList');
    if (testerData.length === 0) {
        container.innerHTML = '<div class="empty-state" style="text-align: center; color: #6c757d; padding: 20px 0;">No testers added yet. Click "Add/Select Tester" to get started.</div>';
        return;
    }
    
    container.innerHTML = testerData.map((tester, index) => `
        <div class="dynamic-item">
            <div>
                <strong>Name:</strong> ${tester.name}<br>
                <strong>Email:</strong> ${tester.email}
            </div>
            <button type="button" class="btn-sm btn-delete" onclick="removeTester(${index})">Remove</button>
        </div>
    `).join('');
}

let qaNotesFields = [];

function showAddQANoteFieldModal() {
    showModal('addQANoteFieldModal');
}

function renderQANotesFields() {
    const container = document.getElementById('qaNotesFieldsList');
    if (!container) return;
    
    if (qaNotesFields.length === 0) {
        // Keep the default general notes field
        return;
    }
    
    // Add custom QA note fields after the default one
    const customFieldsHTML = qaNotesFields.map(field => renderCustomFieldHTML(field)).join('');
    
    // Find the default field and add custom fields after it
    const defaultField = container.querySelector('.custom-field-item');
    if (defaultField && customFieldsHTML) {
        defaultField.insertAdjacentHTML('afterend', customFieldsHTML);
    }
}

function addQANoteField() {
    // Similar to addCustomField but for QA notes
    const fieldData = {
        id: `qa_note_${Date.now()}`,
        name: document.getElementById('qaFieldName').value,
        type: document.getElementById('qaFieldType').value,
        // ... other properties
    };
    
    qaNotesFields.push(fieldData);
    renderQANotesFields();
    closeModal('addQANoteFieldModal');
}

// Missing portfolio and project dropdown population functions
function populatePortfolioDropdown(portfolios) {
    const select = document.getElementById('portfolioName');
    if (!select) return;
    
    // Keep existing static options
    const existingOptions = Array.from(select.options).map(opt => ({ value: opt.value, text: opt.text }));
    
    // Clear and rebuild
    select.innerHTML = '<option value="">Select Portfolio</option>';
    
    // Add existing static options (skip the first empty option)
    existingOptions.slice(1).forEach(opt => {
        if (opt.value) {
            select.innerHTML += `<option value="${opt.value}">${opt.text}</option>`;
        }
    });
    
    // Add dynamic portfolios from database
    portfolios.forEach(portfolio => {
        const value = portfolio.name.toLowerCase().replace(/\s+/g, '-');
        // Check if this portfolio already exists in static options
        const exists = existingOptions.some(opt => opt.value === value);
        if (!exists) {
            select.innerHTML += `<option value="${value}">${portfolio.name}</option>`;
        }
    });
}

function populateProjectDropdown(projects) {
    const select = document.getElementById('projectName');
    if (!select) return;
    
    // Keep existing static options
    const existingOptions = Array.from(select.options).map(opt => ({ value: opt.value, text: opt.text }));
    
    select.innerHTML = '<option value="">Select Project</option>';
    
    // Add existing static options (skip the first empty option)
    existingOptions.slice(1).forEach(opt => {
        if (opt.value) {
            select.innerHTML += `<option value="${opt.value}">${opt.text}</option>`;
        }
    });
    
    // Add dynamic projects from database
    projects.forEach(project => {
        const value = project.name.toLowerCase().replace(/\s+/g, '-');
        // Check if this project already exists in static options
        const exists = existingOptions.some(opt => opt.value === value);
        if (!exists) {
            select.innerHTML += `<option value="${value}">${project.name}</option>`;
        }
    });
}

// Missing form dropdown data loading function
async function loadFormDropdownData() {
    try {
        // Load portfolios
        const portfolioResponse = await fetch('/api/portfolios');
        if (portfolioResponse.ok) {
            const portfolios = await portfolioResponse.json();
            populatePortfolioDropdown(portfolios);
        }
        
        // Load projects
        const projectResponse = await fetch('/api/projects');
        if (projectResponse.ok) {
            const projects = await projectResponse.json();
            populateProjectDropdown(projects);
        }
    } catch (error) {
        console.error('Error loading form data:', error);
        showToast('Error loading form data', 'error');
    }
}

// Missing weight column toggle function
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

// Missing project reason column toggle function
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


function showAddQANoteFieldModal() {
    // Clear form
    document.getElementById('qaFieldName').value = '';
    document.getElementById('qaFieldType').value = 'input';
    document.getElementById('qaFieldRequired').checked = false;
    document.getElementById('qaFieldShowInReport').checked = true;
    document.getElementById('qaFieldOptionsList').value = '';
    updateQAFieldOptions();
    showModal('addQANoteFieldModal');
}

function updateQAFieldOptions() {
    const type = document.getElementById('qaFieldType').value;
    const optionsDiv = document.getElementById('qaFieldOptions');
    
    if (type === 'select' || type === 'radio' || type === 'checkbox') {
        optionsDiv.style.display = 'block';
    } else {
        optionsDiv.style.display = 'none';
    }
}

function addQANoteField() {
    const name = document.getElementById('qaFieldName').value.trim();
    const type = document.getElementById('qaFieldType').value;
    const required = document.getElementById('qaFieldRequired').checked;
    const showInReport = document.getElementById('qaFieldShowInReport').checked;
    const optionsList = document.getElementById('qaFieldOptionsList').value.trim();
    
    if (!name) {
        showToast('Please enter a field name', 'warning');
        return;
    }
    
    const options = (type === 'select' || type === 'radio' || type === 'checkbox') && optionsList 
        ? optionsList.split('\n').map(opt => opt.trim()).filter(opt => opt)
        : [];
    
    const qaField = {
        id: `qa_note_${Date.now()}`,
        name,
        type,
        required,
        showInReport,
        options,
        value: type === 'checkbox' ? [] : ''
    };
    
    qaNotesFields.push(qaField);
    renderQANotesFields();
    closeModal('addQANoteFieldModal');
    showToast('QA note field added successfully!', 'success');
}

function renderQANotesFields() {
    const container = document.getElementById('qaNotesFieldsList');
    if (!container) return;
    
    // Find the default general notes field
    const defaultField = container.querySelector('.custom-field-item');
    
    // Remove existing custom QA fields (keep default)
    const customFields = container.querySelectorAll('.qa-field-item');
    customFields.forEach(field => field.remove());
    
    // Add new custom fields
    qaNotesFields.forEach(field => {
        const fieldHTML = renderQANoteFieldHTML(field);
        if (defaultField) {
            defaultField.insertAdjacentHTML('afterend', fieldHTML);
        } else {
            container.innerHTML += fieldHTML;
        }
    });
}

function renderQANoteFieldHTML(field) {
    let inputHTML = '';
    
    switch (field.type) {
        case 'input':
            inputHTML = `<input type="text" id="${field.id}" name="${field.id}" placeholder="Enter ${field.name.toLowerCase()}" ${field.required ? 'required' : ''}>`;
            break;
        case 'textarea':
            inputHTML = `<textarea id="${field.id}" name="${field.id}" placeholder="Enter ${field.name.toLowerCase()}" rows="4" ${field.required ? 'required' : ''}></textarea>`;
            break;
        case 'number':
            inputHTML = `<input type="number" id="${field.id}" name="${field.id}" placeholder="Enter ${field.name.toLowerCase()}" ${field.required ? 'required' : ''}>`;
            break;
        case 'date':
            inputHTML = `<input type="date" id="${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>`;
            break;
        case 'select':
            inputHTML = `
                <select id="${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>
                    <option value="">Select ${field.name}</option>
                    ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                </select>
            `;
            break;
        case 'radio':
            inputHTML = field.options.map((opt, index) => `
                <label class="radio-option">
                    <input type="radio" name="${field.id}" value="${opt}" ${field.required && index === 0 ? 'required' : ''}>
                    ${opt}
                </label>
            `).join('');
            break;
        case 'checkbox':
            inputHTML = field.options.map(opt => `
                <label class="checkbox-option">
                    <input type="checkbox" name="${field.id}" value="${opt}">
                    ${opt}
                </label>
            `).join('');
            break;
    }
    
    return `
        <div class="qa-field-item">
            <div class="custom-field-header">
                <h4>${field.name}</h4>
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
    `;
}

function removeQANoteField(fieldId) {
    qaNotesFields = qaNotesFields.filter(field => field.id !== fieldId);
    renderQANotesFields();
    showToast('QA note field removed', 'info');
}

// Enhanced team member management functions (complete implementation)

async function loadExistingTeamMembers() {
    try {
        const response = await fetch('/api/team-members');
        if (response.ok) {
            const teamMembers = await response.json();
            const select = document.getElementById('existingTeamMemberSelect');
            
            select.innerHTML = '<option value="">-- Select from existing team members --</option>';
            
            teamMembers.forEach(member => {
                const option = document.createElement('option');
                option.value = JSON.stringify(member);
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
    const newNameField = document.getElementById('newTeamMemberName');
    const newEmailField = document.getElementById('newTeamMemberEmail');
    const newRoleField = document.getElementById('newTeamMemberRole');
    
    if (select.value) {
        newNameField.value = '';
        newEmailField.value = '';
        newRoleField.value = '';
        newNameField.disabled = true;
        newEmailField.disabled = true;
        newRoleField.disabled = true;
    } else {
        newNameField.disabled = false;
        newEmailField.disabled = false;
        newRoleField.disabled = false;
    }
}

function clearTeamMemberForm() {
    document.getElementById('existingTeamMemberSelect').value = '';
    document.getElementById('newTeamMemberName').value = '';
    document.getElementById('newTeamMemberEmail').value = '';
    document.getElementById('newTeamMemberRole').value = '';
    document.getElementById('newTeamMemberName').disabled = false;
    document.getElementById('newTeamMemberEmail').disabled = false;
    document.getElementById('newTeamMemberRole').disabled = false;
}

async function addSelectedTeamMember() {
    const existingSelect = document.getElementById('existingTeamMemberSelect');
    const newName = document.getElementById('newTeamMemberName').value.trim();
    const newEmail = document.getElementById('newTeamMemberEmail').value.trim();
    const newRole = document.getElementById('newTeamMemberRole').value;
    
    let memberToAdd = null;
    
    if (existingSelect.value) {
        memberToAdd = JSON.parse(existingSelect.value);
    } else if (newName && newEmail && newRole) {
        try {
            const response = await fetch('/api/team-members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, email: newEmail, role: newRole })
            });
            
            if (response.ok) {
                memberToAdd = await response.json();
                showToast('New team member created and added!', 'success');
            } else {
                const error = await response.json();
                showToast('Error creating team member: ' + (error.error || 'Unknown error'), 'error');
                return;
            }
        } catch (error) {
            console.error('Error creating team member:', error);
            showToast('Error creating team member', 'error');
            return;
        }
    } else {
        showToast('Please either select an existing team member or provide all details for a new member', 'warning');
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
                option.value = JSON.stringify(tester);
                option.textContent = `${tester.name} (${tester.email})`;
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
    const newNameField = document.getElementById('newTesterName');
    const newEmailField = document.getElementById('newTesterEmail');
    
    if (select.value) {
        newNameField.value = '';
        newEmailField.value = '';
        newNameField.disabled = true;
        newEmailField.disabled = true;
    } else {
        newNameField.disabled = false;
        newEmailField.disabled = false;
    }
}

function clearTesterForm() {
    document.getElementById('existingTesterSelect').value = '';
    document.getElementById('newTesterName').value = '';
    document.getElementById('newTesterEmail').value = '';
    document.getElementById('newTesterName').disabled = false;
    document.getElementById('newTesterEmail').disabled = false;
}

async function addSelectedTester() {
    const existingTesterSelect = document.getElementById('existingTesterSelect');
    const newTesterName = document.getElementById('newTesterName').value.trim();
    const newTesterEmail = document.getElementById('newTesterEmail').value.trim();
    
    let testerToAdd = null;
    
    if (existingTesterSelect.value) {
        testerToAdd = JSON.parse(existingTesterSelect.value);
    } else if (newTesterName && newTesterEmail) {
        try {
            const response = await fetch('/api/testers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTesterName, email: newTesterEmail })
            });
            
            if (response.ok) {
                testerToAdd = await response.json();
                showToast('New tester created and added!', 'success');
            } else {
                const error = await response.json();
                showToast('Error creating tester: ' + (error.error || 'Unknown error'), 'error');
                return;
            }
        } catch (error) {
            console.error('Error creating tester:', error);
            showToast('Error creating tester', 'error');
            return;
        }
    } else {
        showToast('Please either select an existing tester or provide name and email for a new tester', 'warning');
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
            email: testerToAdd.email
        });
        
        renderTesterList();
        closeModal('testerModal');
        showToast('Tester added successfully!', 'success');
    }
}

function renderTesterList() {
    const container = document.getElementById('testerList');
    if (!container) return;
    
    if (testerData.length === 0) {
        container.innerHTML = '<div class="empty-state" style="text-align: center; color: #6c757d; padding: 20px 0;">No testers added yet. Click "Add/Select Tester" to get started.</div>';
        return;
    }
    
    container.innerHTML = testerData.map((tester, index) => `
        <div class="dynamic-item">
            <div>
                <strong>Name:</strong> ${tester.name}<br>
                <strong>Email:</strong> ${tester.email}
            </div>
            <button type="button" class="btn-sm btn-delete" onclick="removeTester(${index})">Remove</button>
        </div>
    `).join('');
}

function removeTester(index) {
    testerData.splice(index, 1);
    renderTesterList();
    showToast('Tester removed', 'info');
}

// Make functions globally accessible
window.showPage = showPage;
window.createNewReport = createNewReport;
window.searchReports = searchReports;
window.viewReport = viewReport;
window.regenerateReport = regenerateReport;
window.deleteReport = deleteReport;
window.exportDashboardReport = exportDashboardReport;
window.toggleSidebar = toggleSidebar;
window.backToDashboard = backToDashboard;
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
window.addTester = addTester;
window.removeTester = removeTester;
window.calculatePercentages = calculatePercentages;
window.calculateTestCasesPercentages = calculateTestCasesPercentages;
window.calculateIssuesPercentages = calculateIssuesPercentages;
window.calculateIssuesStatusPercentages = calculateIssuesStatusPercentages;
window.calculateEnhancementsPercentages = calculateEnhancementsPercentages;
window.calculateEvaluationTotals = calculateEvaluationTotals;
window.calculateProjectEvaluationTotals = calculateProjectEvaluationTotals;
window.addScoreColumn = addScoreColumn;
window.toggleWeightReason = toggleWeightReason;
window.showAddCustomFieldModal = showAddCustomFieldModal;
window.updateCustomFieldOptions = updateCustomFieldOptions;
window.addCustomField = addCustomField;
window.removeCustomField = removeCustomField;
window.goToPage = goToPage;
window.exportReportAsPdf = exportReportAsPdf;
window.exportReportAsExcel = exportReportAsExcel;
window.toggleWeightColumn = toggleWeightColumn;
window.toggleProjectReasonColumn = toggleProjectReasonColumn;
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