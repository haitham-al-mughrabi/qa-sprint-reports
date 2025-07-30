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
let automationTestCasesChart = null;
let automationPercentageChart = null;
let automationStabilityChart = null;
let scoreColumnCount = 0; // Not directly used in this version but kept for consistency
let weightReasonVisible = false; // Not directly used in this version but kept for consistency

// --- API Communication ---
const API_URL = '/api/reports';
const DASHBOARD_API_URL = '/api/dashboard/stats';



async function fetchReports(page = 1, search = '', limit = reportsPerPage) {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });
        
        if (search) {
            params.append('search', search);
        }
        
        const response = await fetch(`${API_URL}?${params}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ensure consistent data structure
        if (Array.isArray(data)) {
            // If API returns array directly, wrap it in expected structure
            return {
                reports: data,
                total: data.length,
                page: page,
                totalPages: Math.ceil(data.length / limit)
            };
        }
        
        // If API returns structured data, use it as is
        return data;
    } catch (error) {
        console.error("Failed to fetch reports:", error);
        return {
            reports: [],
            total: 0,
            page: 1,
            totalPages: 1
        };
    }
}

async function fetchDashboardStats() {
    try {
        // Use existing cache if available and still valid
        if (dashboardStatsCache && dashboardStatsCache.cacheTime && 
            (Date.now() - dashboardStatsCache.cacheTime) < CACHE_DURATION) {
            return dashboardStatsCache.data;
        }

        // Fetch both regular and cached data to get complete information
        const [regularResponse, cachedResponse] = await Promise.all([
            fetch('/api/dashboard/stats'),
            fetch('/api/dashboard/stats/cached')
        ]);
        
        if (!regularResponse.ok || !cachedResponse.ok) {
            throw new Error(`HTTP error! regular: ${regularResponse.status}, cached: ${cachedResponse.status}`);
        }
        
        const regularData = await regularResponse.json();
        const cachedData = await cachedResponse.json();
        
        // Combine the data: use detailed overall stats from regular endpoint
        // and detailed project stats from cached endpoint
        const combinedData = {
            overall: regularData.overall, // Detailed breakdown for charts
            projects: cachedData.projects // Detailed breakdown for project metrics
        };
        
        // Cache the combined dashboard stats
        dashboardStatsCache = {
            data: combinedData,
            cacheTime: Date.now()
        };
        
        return combinedData;
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
    console.log('Dashboard stats received:', stats); // Debug log
    if (!stats) {
        console.error('No stats data received');
        return;
    }

    // Check if we are on the dashboard page by looking for a key element
    const totalReportsEl = document.getElementById('totalReports');
    if (!totalReportsEl) {
        console.error('Not on dashboard page or totalReports element not found');
        return; // Exit if not on the dashboard page
    }

    // Update overall statistics
    const overall = stats.overall || {};
    totalReportsEl.textContent = overall.totalReports || 0;
    document.getElementById('completedReports').textContent = overall.completedReports || 0;
    document.getElementById('inProgressReports').textContent = overall.inProgressReports || 0;
    document.getElementById('pendingReports').textContent = overall.pendingReports || 0;

    // Update aggregate metrics
    document.getElementById('totalUserStories').textContent = overall.totalUserStories || 0;
    document.getElementById('totalTestCases').textContent = overall.totalTestCases || 0;
    document.getElementById('totalIssues').textContent = overall.totalIssues || 0;
    document.getElementById('totalEnhancements').textContent = overall.totalEnhancements || 0;
    
    // Update automation regression metrics
    document.getElementById('totalAutomationTests').textContent = overall.automationTotalTestCases || 0;
    const automationTotal = overall.automationTotalTestCases || 0;
    const automationPassed = overall.automationPassedTestCases || 0;
    const automationPassRate = automationTotal > 0 ? Math.round((automationPassed / automationTotal) * 100) : 0;
    document.getElementById('automationPassRate').textContent = `${automationPassRate}%`;
    
    // Debug log projects data
    console.log('Projects data in updateDashboardStats:', stats.projects);
    
    // Update project-specific metrics
    renderProjectMetrics(stats.projects || []);
}

function renderProjectMetrics(projects) {
    const container = document.getElementById('projectMetrics');
    if (!container) {
        console.error('Project metrics container not found');
        return;
    }

    // Debug log the projects data being rendered
    console.log('Rendering projects:', projects);
    
    if (!projects || projects.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; color: #6c757d; padding: 40px 0; grid-column: 1 / -1;">
                <div style="font-size: 3em; margin-bottom: 20px;"><i class="fas fa-chart-bar"></i></div>
                <h3>No Project Data Available</h3>
                <p>No project metrics data was found. Create some reports to see metrics here.</p>
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
                <div class="status-badges">
                    <span class="status-badge status-${getStatusClass(project.testingStatus)}">${getStatusText(project.testingStatus)}</span>
                    <span class="risk-badge risk-${project.riskLevel?.toLowerCase() || 'low'}">${project.riskLevel || 'Low'} Risk</span>
                </div>
            </div>

            <!-- Project Summary Stats -->
            <div class="project-summary">
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="summary-icon">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <div class="summary-content">
                            <span class="summary-value">${project.totalReports || 0}</span>
                            <span class="summary-label">Reports</span>
                        </div>
                    </div>
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

            <!-- Complete Project Metrics - ALL DATA -->
            <div class="project-metrics">
                <!-- User Stories - COMPLETE -->
                <div class="metrics-section">
                    <h4 class="metrics-title">
                        <i class="fas fa-user-check"></i> User Stories (${project.totalUserStories || 0} Total)
                    </h4>
                    <div class="metrics-content">
                        <div class="complete-breakdown">
                            <div class="breakdown-grid">
                                <div class="breakdown-item success">
                                    <span class="breakdown-label">Passed</span>
                                    <span class="breakdown-value">${project.passedUserStories || 0}</span>
                                </div>
                                <div class="breakdown-item warning">
                                    <span class="breakdown-label">Passed w/ Issues</span>
                                    <span class="breakdown-value">${project.passedWithIssuesUserStories || 0}</span>
                                </div>
                                <div class="breakdown-item error">
                                    <span class="breakdown-label">Failed</span>
                                    <span class="breakdown-value">${project.failedUserStories || 0}</span>
                                </div>
                                <div class="breakdown-item blocked">
                                    <span class="breakdown-label">Blocked</span>
                                    <span class="breakdown-value">${project.blockedUserStories || 0}</span>
                                </div>
                                <div class="breakdown-item cancelled">
                                    <span class="breakdown-label">Cancelled</span>
                                    <span class="breakdown-value">${project.cancelledUserStories || 0}</span>
                                </div>
                                <div class="breakdown-item deferred">
                                    <span class="breakdown-label">Deferred</span>
                                    <span class="breakdown-value">${project.deferredUserStories || 0}</span>
                                </div>
                                <div class="breakdown-item not-testable">
                                    <span class="breakdown-label">Not Testable</span>
                                    <span class="breakdown-value">${project.notTestableUserStories || 0}</span>
                                </div>
                            </div>
                            <div class="success-rate">
                                <span class="rate-label">Success Rate:</span>
                                <span class="rate-value rate-${getRateClass(project.userStoriesSuccessRate || 0)}">${project.userStoriesSuccessRate || 0}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Test Cases - COMPLETE -->
                <div class="metrics-section">
                    <h4 class="metrics-title">
                        <i class="fas fa-flask"></i> Test Cases (${project.totalTestCases || 0} Total)
                    </h4>
                    <div class="metrics-content">
                        <div class="complete-breakdown">
                            <div class="breakdown-grid">
                                <div class="breakdown-item success">
                                    <span class="breakdown-label">Passed</span>
                                    <span class="breakdown-value">${project.passedTestCases || 0}</span>
                                </div>
                                <div class="breakdown-item warning">
                                    <span class="breakdown-label">Passed w/ Issues</span>
                                    <span class="breakdown-value">${project.passedWithIssuesTestCases || 0}</span>
                                </div>
                                <div class="breakdown-item error">
                                    <span class="breakdown-label">Failed</span>
                                    <span class="breakdown-value">${project.failedTestCases || 0}</span>
                                </div>
                                <div class="breakdown-item blocked">
                                    <span class="breakdown-label">Blocked</span>
                                    <span class="breakdown-value">${project.blockedTestCases || 0}</span>
                                </div>
                                <div class="breakdown-item cancelled">
                                    <span class="breakdown-label">Cancelled</span>
                                    <span class="breakdown-value">${project.cancelledTestCases || 0}</span>
                                </div>
                                <div class="breakdown-item deferred">
                                    <span class="breakdown-label">Deferred</span>
                                    <span class="breakdown-value">${project.deferredTestCases || 0}</span>
                                </div>
                                <div class="breakdown-item not-testable">
                                    <span class="breakdown-label">Not Testable</span>
                                    <span class="breakdown-value">${project.notTestableTestCases || 0}</span>
                                </div>
                            </div>
                            <div class="success-rate">
                                <span class="rate-label">Success Rate:</span>
                                <span class="rate-value rate-${getRateClass(project.testCasesSuccessRate || 0)}">${project.testCasesSuccessRate || 0}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Issues - COMPLETE BY PRIORITY & STATUS -->
                <div class="metrics-section">
                    <h4 class="metrics-title">
                        <i class="fas fa-bug"></i> Issues (${project.totalIssues || 0} Total)
                    </h4>
                    <div class="metrics-content">
                        <div class="issues-breakdown">
                            <div class="issues-section">
                                <h5 class="breakdown-title">By Priority</h5>
                                <div class="breakdown-grid priority-grid">
                                    <div class="breakdown-item critical">
                                        <span class="breakdown-label">Critical</span>
                                        <span class="breakdown-value">${project.criticalIssues || 0}</span>
                                    </div>
                                    <div class="breakdown-item high-priority">
                                        <span class="breakdown-label">High</span>
                                        <span class="breakdown-value">${project.highIssues || 0}</span>
                                    </div>
                                    <div class="breakdown-item medium">
                                        <span class="breakdown-label">Medium</span>
                                        <span class="breakdown-value">${project.mediumIssues || 0}</span>
                                    </div>
                                    <div class="breakdown-item low">
                                        <span class="breakdown-label">Low</span>
                                        <span class="breakdown-value">${project.lowIssues || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="issues-section">
                                <h5 class="breakdown-title">By Status</h5>
                                <div class="breakdown-grid status-grid">
                                    <div class="breakdown-item new">
                                        <span class="breakdown-label">New</span>
                                        <span class="breakdown-value">${project.newIssues || 0}</span>
                                    </div>
                                    <div class="breakdown-item success">
                                        <span class="breakdown-label">Fixed</span>
                                        <span class="breakdown-value">${project.fixedIssues || 0}</span>
                                    </div>
                                    <div class="breakdown-item error">
                                        <span class="breakdown-label">Not Fixed</span>
                                        <span class="breakdown-value">${project.notFixedIssues || 0}</span>
                                    </div>
                                    <div class="breakdown-item reopened">
                                        <span class="breakdown-label">Reopened</span>
                                        <span class="breakdown-value">${project.reopenedIssues || 0}</span>
                                    </div>
                                    <div class="breakdown-item deferred">
                                        <span class="breakdown-label">Deferred</span>
                                        <span class="breakdown-value">${project.deferredIssues || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="success-rate">
                                <span class="rate-label">Resolution Rate:</span>
                                <span class="rate-value rate-${getRateClass(project.issuesResolutionRate || 0)}">${project.issuesResolutionRate || 0}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Enhancements - COMPLETE -->
                ${(project.totalEnhancements || 0) > 0 ? `
                <div class="metrics-section">
                    <h4 class="metrics-title">
                        <i class="fas fa-magic"></i> Enhancements (${project.totalEnhancements || 0} Total)
                    </h4>
                    <div class="metrics-content">
                        <div class="complete-breakdown">
                            <div class="breakdown-grid">
                                <div class="breakdown-item new">
                                    <span class="breakdown-label">New</span>
                                    <span class="breakdown-value">${project.newEnhancements || 0}</span>
                                </div>
                                <div class="breakdown-item success">
                                    <span class="breakdown-label">Implemented</span>
                                    <span class="breakdown-value">${project.implementedEnhancements || 0}</span>
                                </div>
                                <div class="breakdown-item exists">
                                    <span class="breakdown-label">Already Exists</span>
                                    <span class="breakdown-value">${project.existsEnhancements || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Automation - COMPLETE -->
                ${(project.automationTotalTests || 0) > 0 ? `
                <div class="metrics-section">
                    <h4 class="metrics-title">
                        <i class="fas fa-robot"></i> Automation (${project.automationTotalTests || 0} Total Tests)
                    </h4>
                    <div class="metrics-content">
                        <div class="automation-breakdown">
                            <div class="automation-section">
                                <h5 class="breakdown-title">Test Results</h5>
                                <div class="breakdown-grid">
                                    <div class="breakdown-item success">
                                        <span class="breakdown-label">Passed</span>
                                        <span class="breakdown-value">${project.automationPassedTests || 0}</span>
                                    </div>
                                    <div class="breakdown-item error">
                                        <span class="breakdown-label">Failed</span>
                                        <span class="breakdown-value">${project.automationFailedTests || 0}</span>
                                    </div>
                                    <div class="breakdown-item warning">
                                        <span class="breakdown-label">Skipped</span>
                                        <span class="breakdown-value">${project.automationSkippedTests || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="automation-section">
                                <h5 class="breakdown-title">Test Stability</h5>
                                <div class="breakdown-grid">
                                    <div class="breakdown-item success">
                                        <span class="breakdown-label">Stable</span>
                                        <span class="breakdown-value">${project.automationStableTests || 0}</span>
                                    </div>
                                    <div class="breakdown-item flaky">
                                        <span class="breakdown-label">Flaky</span>
                                        <span class="breakdown-value">${project.automationFlakyTests || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="success-rate">
                                <span class="rate-label">Pass Rate:</span>
                                <span class="rate-value rate-${getRateClass(project.automationPassRate || 0)}">${project.automationPassRate || 0}%</span>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Evaluation Scores have been removed as per user request -->
            </div>
        </div>
    `).join('');
}

// Helper function for progress bar colors
function getProgressBarColor(percentage) {
    if (percentage >= 80) return '#4CAF50'; // Green
    if (percentage >= 60) return '#FF9800'; // Orange
    if (percentage >= 40) return '#FFC107'; // Yellow
    return '#F44336'; // Red
}

// Helper function for rate class determination
function getRateClass(percentage) {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'fair';
    return 'poor';
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
    initializeAutomationTestCasesChart();
    initializeAutomationPercentageChart();
    initializeAutomationStabilityChart();
}

function getChartOptions() {
    // Get theme-appropriate colors using robust detection
    const isLightTheme = window.isCurrentThemeLight ? window.isCurrentThemeLight() : true;
    
    const textColor = isLightTheme ? '#1e293b' : '#f1f5f9';
    const tooltipBg = isLightTheme ? '#ffffff' : '#334155';
    const gridColor = isLightTheme ? '#e2e8f0' : '#334155';
    
    console.log('Enhanced script chart options - isLightTheme:', isLightTheme, 'textColor:', textColor);
    
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { 
                    padding: 15, 
                    usePointStyle: true, 
                    font: { size: 11 },
                    color: textColor
                }
            },
            tooltip: {
                titleColor: textColor,
                bodyColor: textColor,
                backgroundColor: tooltipBg,
                borderColor: gridColor,
                borderWidth: 1,
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

    const isLightTheme = window.isCurrentThemeLight ? window.isCurrentThemeLight() : true;
    const borderColor = isLightTheme ? '#ffffff' : '#1e293b';

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: new Array(labels.length).fill(0),
                backgroundColor: backgroundColors,
                borderWidth: 3,
                borderColor: borderColor
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

function initializeAutomationTestCasesChart() {
    const labels = ['Passed', 'Failed', 'Skipped'];
    const colors = ['#28a745', '#dc3545', '#ffc107'];
    if(automationTestCasesChart) automationTestCasesChart.destroy();
    automationTestCasesChart = initializeDoughnutChart('automationTestCasesChart', labels, colors);
}

function initializeAutomationPercentageChart() {
    const labels = ['Passed', 'Failed', 'Skipped'];
    const colors = ['#28a745', '#dc3545', '#ffc107'];
    if(automationPercentageChart) automationPercentageChart.destroy();
    automationPercentageChart = initializeDoughnutChart('automationPercentageChart', labels, colors);
}

function initializeAutomationStabilityChart() {
    const labels = ['Stable', 'Flaky'];
    const colors = ['#28a745', '#fd7e14'];
    if(automationStabilityChart) automationStabilityChart.destroy();
    automationStabilityChart = initializeDoughnutChart('automationStabilityChart', labels, colors);
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

// Automation Regression calculation functions
function calculateAutomationTotal() {
    const passed = parseInt(document.getElementById('automationPassedTestCases')?.value) || 0;
    const failed = parseInt(document.getElementById('automationFailedTestCases')?.value) || 0;
    const skipped = parseInt(document.getElementById('automationSkippedTestCases')?.value) || 0;
    return passed + failed + skipped;
}

function calculateAutomationStabilityTotal() {
    const stable = parseInt(document.getElementById('automationStableTests')?.value) || 0;
    const flaky = parseInt(document.getElementById('automationFlakyTests')?.value) || 0;
    return stable + flaky;
}

function calculateAutomationPercentages() {
    const total = calculateAutomationTotal();
    const values = {
        passed: parseInt(document.getElementById('automationPassedTestCases')?.value) || 0,
        failed: parseInt(document.getElementById('automationFailedTestCases')?.value) || 0,
        skipped: parseInt(document.getElementById('automationSkippedTestCases')?.value) || 0,
    };

    // Update total field (readonly)
    document.getElementById('automationTotalTestCases').value = total;

    // Update percentages
    Object.keys(values).forEach(key => {
        const percentageElement = document.getElementById(`automation${key.charAt(0).toUpperCase() + key.slice(1)}Percentage`);
        const percentageDisplayElement = document.getElementById(`automation${key.charAt(0).toUpperCase() + key.slice(1)}PercentageDisplay`);
        if (percentageElement) {
            const percentage = total > 0 ? Math.round((values[key] / total) * 100) : 0;
            percentageElement.textContent = `${percentage}%`;
            if (percentageDisplayElement) {
                percentageDisplayElement.value = percentage;
            }
        }
    });

    // Update charts if they exist
    if (automationTestCasesChart) {
        updateChart(automationTestCasesChart, Object.values(values));
    }
    if (automationPercentageChart) {
        updateChart(automationPercentageChart, Object.values(values));
    }
}

function calculateAutomationStabilityPercentages() {
    const total = calculateAutomationStabilityTotal();
    const values = {
        stable: parseInt(document.getElementById('automationStableTests')?.value) || 0,
        flaky: parseInt(document.getElementById('automationFlakyTests')?.value) || 0,
    };

    // Update total field (readonly)
    document.getElementById('automationStabilityTotal').value = total;

    // Update percentages
    Object.keys(values).forEach(key => {
        const percentageElement = document.getElementById(`automation${key.charAt(0).toUpperCase() + key.slice(1)}Percentage`);
        if (percentageElement) {
            const percentage = total > 0 ? Math.round((values[key] / total) * 100) : 0;
            percentageElement.textContent = `${percentage}%`;
        }
    });

    // Update charts if they exist
    if (automationStabilityChart) {
        updateChart(automationStabilityChart, Object.values(values));
    }
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
            } else if (section.id === 'section-8') {
                calculateAutomationPercentages();
                calculateAutomationStabilityPercentages();
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
    updateProgressBar();
    window.scrollTo(0, 0);
}

function nextSection() {
    if (currentSection < 8) { // Max section index is 8 (Automation Regression)
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
    const isLastSection = currentSection === 8;
    document.getElementById('nextBtn').style.display = isLastSection ? 'none' : 'inline-block';
    document.getElementById('submitBtn').style.display = isLastSection ? 'inline-block' : 'none';
}

function updateProgressBar() {
    const totalSections = 9;
    const sectionTitles = [
        'General Details',
        'Test Summary',
        'Additional Info',
        'User Stories',
        'Test Cases',
        'Issues Analysis',
        'Enhancements',
        'QA Notes',
        'Automation Regression'
    ];
    
    // Calculate progress - show completion based on current section
    const completedSections = currentSection; // Sections completed (0-based)
    const currentStepNumber = currentSection + 1; // Current step being worked on (1-based)
    const percentage = (completedSections / totalSections) * 100;
    
    // Update progress percentage and fill
    document.getElementById('progressPercent').textContent = `${Math.round(percentage)}%`;
    document.getElementById('progressFill').style.width = `${percentage}%`;
    
    // Update step and title text
    document.getElementById('progressStep').textContent = `Step ${currentStepNumber} of ${totalSections}`;
    document.getElementById('progressTitle').textContent = sectionTitles[currentSection] || 'Unknown Section';
    
    // Update step indicators
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        
        if (index === currentSection) {
            step.classList.add('active');
        } else if (index < currentSection) {
            step.classList.add('completed');
            // Change icon to checkmark for completed steps
            const icon = step.querySelector('.step-circle i');
            if (icon && !icon.classList.contains('fa-check')) {
                icon.className = 'fas fa-check';
            }
        } else {
            // Reset icon for future steps
            const icon = step.querySelector('.step-circle i');
            const stepIcons = [
                'fas fa-info-circle',
                'fas fa-chart-bar',
                'fas fa-plus-square',
                'fas fa-user-check',
                'fas fa-vial',
                'fas fa-bug',
                'fas fa-bolt',
                'fas fa-note-sticky',
                'fas fa-robot'
            ];
            if (icon) {
                icon.className = stepIcons[index] || 'fas fa-circle';
            }
        }
    });
}

// Add click functionality to progress steps
function initializeProgressSteps() {
    document.querySelectorAll('.step').forEach((step, index) => {
        step.addEventListener('click', () => {
            showSection(index);
        });
    });
}

// backToDashboard now redirects to the dashboard page
function backToDashboard() { window.location.href = '/dashboard'; }
function toggleSidebar() { 
    const sidebar = document.getElementById('sidebar');
    const formContainer = document.querySelector('.form-container');
    const toggleBtn = document.querySelector('.sidebar-toggle-btn i');
    
    sidebar.classList.toggle('collapsed');
    formContainer.classList.toggle('sidebar-collapsed');
    
    // Update toggle button icon
    if (sidebar.classList.contains('collapsed')) {
        toggleBtn.classList.remove('fa-bars');
        toggleBtn.classList.add('fa-arrow-right');
    } else {
        toggleBtn.classList.remove('fa-arrow-right');
        toggleBtn.classList.add('fa-bars');
    }
}

// --- Enhanced Reports Table Functions with Filtering ---
// Debounced search to reduce API calls
let searchTimeout;

// Filter state management
let currentFilters = {
    search: '',
    project: '',
    portfolio: '',
    tester: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    sprint: '',
    sort: 'date-desc'
};

let filtersVisible = false;
let allReports = []; // Cache for client-side filtering

async function searchReports() {
    const searchQuery = document.getElementById('searchInput')?.value || '';
    currentFilters.search = searchQuery;
    
    // Clear existing timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    searchTimeout = setTimeout(() => {
        applyFilters();
    }, 300); // 300ms delay
}

// Enhanced filter functions
async function applyFilters() {
    showReportsLoading();
    
    // Update filter state from form inputs
    updateFilterState();
    
    console.log('Applying filters:', currentFilters);
    
    try {
        // Fetch all reports if not cached or if we need fresh data
        if (allReports.length === 0) {
            console.log('Fetching reports for filtering...');
            const result = await fetchReports(1, '', 1000); // Fetch large number to get all
            allReports = result.reports || [];
            console.log('Fetched', allReports.length, 'reports for filtering');
        }
        
        // Apply client-side filtering
        let filteredReports = filterReports(allReports);
        console.log('After filtering:', filteredReports.length, 'reports');
        
        // Apply sorting
        filteredReports = sortReports(filteredReports);
        console.log('After sorting:', filteredReports.length, 'reports');
        
        // Update results count and active filters display
        updateFilterResultsDisplay(filteredReports.length);
        
        // Render filtered results
        renderReportsTable(filteredReports);
        
        // Update pagination for filtered results (disable pagination for filtered results)
        renderPagination({
            reports: filteredReports,
            total: filteredReports.length,
            page: 1,
            totalPages: 1 // Show all filtered results on one page
        });
        
    } catch (error) {
        console.error('Error applying filters:', error);
        showToast('Error applying filters', 'error');
        
        // Fallback: try to show all reports without filtering
        try {
            const result = await fetchReports(1, '', 100);
            renderReportsTable(result.reports || []);
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
        }
    }
    
    hideReportsLoading();
}

function updateFilterState() {
    currentFilters.search = document.getElementById('searchInput')?.value || '';
    currentFilters.project = document.getElementById('projectFilter')?.value || '';
    currentFilters.portfolio = document.getElementById('portfolioFilter')?.value || '';
    currentFilters.tester = document.getElementById('testerFilter')?.value || '';
    currentFilters.status = document.getElementById('statusFilter')?.value || '';
    currentFilters.dateFrom = document.getElementById('dateFromFilter')?.value || '';
    currentFilters.dateTo = document.getElementById('dateToFilter')?.value || '';
    currentFilters.sprint = document.getElementById('sprintFilter')?.value || '';
    currentFilters.sort = document.getElementById('sortFilter')?.value || 'date-desc';
}

function filterReports(reports) {
    if (!Array.isArray(reports)) {
        console.warn('filterReports: reports is not an array', reports);
        return [];
    }
    
    return reports.filter(report => {
        if (!report) return false;
        
        // Search filter - make it more robust
        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            const searchableFields = [
                report.title || '',
                report.project || '',
                report.portfolio || '',
                report.reportName || '',
                report.projectName || '',
                report.portfolioName || ''
            ];
            const searchableText = searchableFields.join(' ').toLowerCase();
            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }
        
        // Project filter - handle different field names
        if (currentFilters.project) {
            const projectName = report.project || report.projectName || '';
            if (projectName !== currentFilters.project) {
                return false;
            }
        }
        
        // Portfolio filter - handle different field names
        if (currentFilters.portfolio) {
            const portfolioName = report.portfolio || report.portfolioName || '';
            if (portfolioName !== currentFilters.portfolio) {
                return false;
            }
        }
        
        // Tester filter - handle different data structures
        if (currentFilters.tester) {
            let hasMatchingTester = false;
            
            // Get all possible tester values from the report
            const allTesterValues = [];
            
            // Check testers array
            if (Array.isArray(report.testers)) {
                report.testers.forEach(tester => {
                    if (typeof tester === 'string') {
                        allTesterValues.push(tester.trim());
                    } else if (typeof tester === 'object' && tester.name) {
                        allTesterValues.push(tester.name.trim());
                    }
                });
            }
            // Check testerData array (from form)
            else if (Array.isArray(report.testerData)) {
                report.testerData.forEach(tester => {
                    if (tester && typeof tester === 'object' && tester.name) {
                        allTesterValues.push(tester.name.trim());
                    }
                });
            }
            // Check tester_data array (from database)
            else if (Array.isArray(report.tester_data)) {
                report.tester_data.forEach(tester => {
                    if (tester && typeof tester === 'object' && tester.name) {
                        allTesterValues.push(tester.name.trim());
                    }
                });
            }
            // Check testers as JSON string
            else if (typeof report.testers === 'string') {
                try {
                    const parsedTesters = JSON.parse(report.testers);
                    if (Array.isArray(parsedTesters)) {
                        parsedTesters.forEach(tester => {
                            const name = typeof tester === 'object' ? tester.name : tester;
                            if (name) allTesterValues.push(name.toString().trim());
                        });
                    }
                } catch (e) {
                    // If not JSON, treat as comma-separated string
                    const testerList = report.testers.split(',').map(t => t.trim()).filter(t => t);
                    allTesterValues.push(...testerList);
                }
            }
            
            // Check single tester fields
            const singleTesterFields = ['tester', 'testerName', 'assignedTester'];
            singleTesterFields.forEach(field => {
                if (report[field] && typeof report[field] === 'string') {
                    allTesterValues.push(report[field].trim());
                }
            });
            
            // Check if any tester value matches
            hasMatchingTester = allTesterValues.some(testerValue => 
                testerValue === currentFilters.tester
            );
            
            if (!hasMatchingTester) {
                // Only log for debugging if needed
                // console.log('Tester filter failed for report:', report.id || report.title, 'Looking for:', currentFilters.tester, 'Found values:', allTesterValues);
                return false;
            }
        }
        
        // Status filter - handle different field names
        if (currentFilters.status) {
            const status = report.status || report.testingStatus || '';
            if (status !== currentFilters.status) {
                return false;
            }
        }
        
        // Date range filter - handle different date formats
        if (currentFilters.dateFrom || currentFilters.dateTo) {
            // Try multiple date field names
            const reportDateStr = report.date || report.reportDate || report.createdAt || report.created_at || report.dateCreated || '';
            
            // If no date found, skip date filtering for this report (don't exclude it)
            if (!reportDateStr) {
                // Only log for debugging if needed
                // console.log('No date found for report:', report.id || report.title, 'Skipping date filter');
                // Don't return false - let report pass through if no date available
            } else {
                // Handle different date formats
                let reportDate;
                
                // Try parsing as-is first
                reportDate = new Date(reportDateStr);
                
                // If invalid, try parsing DD-MM-YYYY format
                if (isNaN(reportDate.getTime()) && typeof reportDateStr === 'string') {
                    const parts = reportDateStr.split('-');
                    if (parts.length === 3) {
                        // Try DD-MM-YYYY
                        if (parts[0].length === 2) {
                            reportDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                        }
                        // Try YYYY-MM-DD (should work with new Date())
                        else if (parts[0].length === 4) {
                            reportDate = new Date(reportDateStr);
                        }
                    }
                }
                
                // Only apply date filtering if we have a valid date
                if (!isNaN(reportDate.getTime())) {
                    if (currentFilters.dateFrom) {
                        const fromDate = new Date(currentFilters.dateFrom);
                        fromDate.setHours(0, 0, 0, 0); // Start of day
                        if (reportDate < fromDate) {
                            return false;
                        }
                    }
                    
                    if (currentFilters.dateTo) {
                        const toDate = new Date(currentFilters.dateTo);
                        toDate.setHours(23, 59, 59, 999); // End of day
                        if (reportDate > toDate) {
                            return false;
                        }
                    }
                } else {
                    // Invalid date format - log for debugging but don't exclude report
                    // console.log('Invalid date format:', reportDateStr, 'for report:', report.id || report.title);
                }
            }
        }
        
        // Sprint filter - handle different field names and types
        if (currentFilters.sprint) {
            const sprintNumber = report.sprint || report.sprintNumber || '';
            const filterSprint = currentFilters.sprint.toString();
            const reportSprint = sprintNumber.toString();
            
            if (reportSprint !== filterSprint) {
                return false;
            }
        }
        
        return true;
    });
}

function sortReports(reports) {
    if (!Array.isArray(reports)) {
        console.warn('sortReports: reports is not an array', reports);
        return [];
    }
    
    const [field, direction] = currentFilters.sort.split('-');
    
    return [...reports].sort((a, b) => {
        let aValue, bValue;
        
        switch (field) {
            case 'date':
                aValue = new Date(a.date || a.reportDate || a.createdAt || 0);
                bValue = new Date(b.date || b.reportDate || b.createdAt || 0);
                // Handle invalid dates
                if (isNaN(aValue.getTime())) aValue = new Date(0);
                if (isNaN(bValue.getTime())) bValue = new Date(0);
                break;
            case 'title':
                aValue = (a.title || a.reportName || '').toLowerCase();
                bValue = (b.title || b.reportName || '').toLowerCase();
                break;
            case 'project':
                aValue = (a.project || a.projectName || '').toLowerCase();
                bValue = (b.project || b.projectName || '').toLowerCase();
                break;
            case 'sprint':
                aValue = parseInt(a.sprint || a.sprintNumber || 0) || 0;
                bValue = parseInt(b.sprint || b.sprintNumber || 0) || 0;
                break;
            default:
                return 0;
        }
        
        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return direction === 'asc' ? -1 : 1;
        if (bValue == null) return direction === 'asc' ? 1 : -1;
        
        if (direction === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
    });
}

function updateFilterResultsDisplay(count) {
    const resultsCountElement = document.getElementById('resultsCount');
    if (resultsCountElement) {
        resultsCountElement.textContent = count;
    }
    
    // Update active filters display
    updateActiveFiltersDisplay();
}

function updateActiveFiltersDisplay() {
    const activeFiltersContainer = document.getElementById('activeFilters');
    if (!activeFiltersContainer) return;
    
    activeFiltersContainer.innerHTML = '';
    
    const filterLabels = {
        search: 'Search',
        project: 'Project',
        portfolio: 'Portfolio',
        tester: 'Tester',
        status: 'Status',
        dateFrom: 'From Date',
        dateTo: 'To Date',
        sprint: 'Sprint'
    };
    
    Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && key !== 'sort') {
            const tag = document.createElement('div');
            tag.className = 'active-filter-tag';
            tag.innerHTML = `
                <span>${filterLabels[key]}: ${value}</span>
                <i class="fas fa-times remove-filter" onclick="removeFilter('${key}')"></i>
            `;
            activeFiltersContainer.appendChild(tag);
        }
    });
}

function removeFilter(filterKey) {
    // Clear the filter
    currentFilters[filterKey] = '';
    
    // Update the corresponding form input
    const inputElement = document.getElementById(filterKey + 'Filter') || document.getElementById('searchInput');
    if (inputElement) {
        inputElement.value = '';
    }
    
    // Reapply filters
    applyFilters();
}

function clearAllFilters() {
    // Reset all filters
    Object.keys(currentFilters).forEach(key => {
        if (key !== 'sort') {
            currentFilters[key] = '';
        }
    });
    
    // Reset sort to default
    currentFilters.sort = 'date-desc';
    
    // Clear all form inputs safely
    const inputs = [
        'searchInput',
        'projectFilter',
        'portfolioFilter', 
        'testerFilter',
        'statusFilter',
        'dateFromFilter',
        'dateToFilter',
        'sprintFilter'
    ];
    
    inputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.value = '';
        }
    });
    
    // Reset sort filter
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.value = 'date-desc';
    }
    
    // Remove active quick filter buttons
    document.querySelectorAll('.quick-filter-btn.active').forEach(btn => {
        btn.classList.remove('active');
    });
    
    console.log('All filters cleared');
    
    // Reapply filters (which will show all reports)
    applyFilters();
}

function toggleFiltersVisibility() {
    const filtersContainer = document.getElementById('filtersContainer');
    const toggleText = document.getElementById('toggleText');
    const toggleIcon = document.querySelector('.toggle-filters i');
    
    filtersVisible = !filtersVisible;
    
    if (filtersVisible) {
        filtersContainer.classList.remove('hidden');
        toggleText.textContent = 'Hide Filters';
        toggleIcon.className = 'fas fa-eye';
    } else {
        filtersContainer.classList.add('hidden');
        toggleText.textContent = 'Show Filters';
        toggleIcon.className = 'fas fa-eye-slash';
    }
}

function applyQuickFilter(type) {
    // Remove active class from all quick filter buttons
    document.querySelectorAll('.quick-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Clear existing filters first (except search)
    const searchValue = document.getElementById('searchInput').value;
    clearAllFilters();
    document.getElementById('searchInput').value = searchValue;
    currentFilters.search = searchValue;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (type) {
        case 'today':
            document.getElementById('dateFromFilter').value = todayStr;
            document.getElementById('dateToFilter').value = todayStr;
            currentFilters.dateFrom = todayStr;
            currentFilters.dateTo = todayStr;
            break;
            
        case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            const weekStartStr = weekStart.toISOString().split('T')[0];
            const weekEndStr = weekEnd.toISOString().split('T')[0];
            
            document.getElementById('dateFromFilter').value = weekStartStr;
            document.getElementById('dateToFilter').value = weekEndStr;
            currentFilters.dateFrom = weekStartStr;
            currentFilters.dateTo = weekEndStr;
            break;
            
        case 'month':
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            
            const monthStartStr = monthStart.toISOString().split('T')[0];
            const monthEndStr = monthEnd.toISOString().split('T')[0];
            
            document.getElementById('dateFromFilter').value = monthStartStr;
            document.getElementById('dateToFilter').value = monthEndStr;
            currentFilters.dateFrom = monthStartStr;
            currentFilters.dateTo = monthEndStr;
            break;
            
        case 'failed':
            document.getElementById('statusFilter').value = 'failed';
            currentFilters.status = 'failed';
            break;
            
        case 'recent':
            const recentStart = new Date(today);
            recentStart.setDate(today.getDate() - 7);
            
            const recentStartStr = recentStart.toISOString().split('T')[0];
            
            document.getElementById('dateFromFilter').value = recentStartStr;
            document.getElementById('dateToFilter').value = todayStr;
            currentFilters.dateFrom = recentStartStr;
            currentFilters.dateTo = todayStr;
            break;
    }
    
    applyFilters();
}

// Function to refresh filter data
async function refreshFilterData() {
    console.log('🔄 Refreshing filter data...');
    allReports = []; // Clear cache
    await initializeFilterDropdowns();
    applyFilters();
}

// Function to show all reports without filtering
async function showAllReports() {
    console.log('📋 Showing all reports without filtering...');
    showReportsLoading();
    
    try {
        // Fetch all reports
        const result = await fetchReports(1, '', 1000);
        const reports = result.reports || [];
        
        console.log('Total reports fetched:', reports.length);
        
        // Show all reports without any filtering
        renderReportsTable(reports);
        
        // Update results count
        const resultsCountElement = document.getElementById('resultsCount');
        if (resultsCountElement) {
            resultsCountElement.textContent = reports.length;
        }
        
        // Clear active filters display
        const activeFiltersContainer = document.getElementById('activeFilters');
        if (activeFiltersContainer) {
            activeFiltersContainer.innerHTML = '';
        }
        
        console.log('All reports displayed successfully');
        
    } catch (error) {
        console.error('Error showing all reports:', error);
        showToast('Error loading reports', 'error');
    }
    
    hideReportsLoading();
}

// Test API function
async function testAPI() {
    console.log('🧪 Testing API endpoint...');
    try {
        const response = await fetch('/api/reports');
        console.log('API Response status:', response.status);
        console.log('API Response headers:', [...response.headers.entries()]);
        
        const data = await response.json();
        console.log('Raw API data:', data);
        console.log('Data type:', typeof data);
        console.log('Is array:', Array.isArray(data));
        
        if (Array.isArray(data)) {
            console.log('Array length:', data.length);
            if (data.length > 0) {
                console.log('First item:', data[0]);
                console.log('First item keys:', Object.keys(data[0]));
            }
        } else if (data && typeof data === 'object') {
            console.log('Object keys:', Object.keys(data));
            if (data.reports) {
                console.log('Reports array length:', data.reports.length);
                if (data.reports.length > 0) {
                    console.log('First report:', data.reports[0]);
                }
            }
        }
    } catch (error) {
        console.error('API test failed:', error);
    }
}

// Test testers API function
async function testTestersAPI() {
    console.log('🧪 Testing testers API endpoint...');
    try {
        const response = await fetch('/api/testers');
        console.log('Testers API Response status:', response.status);
        
        const data = await response.json();
        console.log('Raw testers data:', data);
        console.log('Testers count:', data.length);
        
        if (data.length > 0) {
            console.log('First tester:', data[0]);
            console.log('Tester keys:', Object.keys(data[0]));
        }
    } catch (error) {
        console.error('Testers API test failed:', error);
    }
}

// Test individual filters function
function testIndividualFilters() {
    console.log('🧪 Testing individual filters...');
    
    if (allReports.length === 0) {
        console.log('No reports loaded. Run refreshFilterData() first.');
        return;
    }
    
    console.log('Total reports:', allReports.length);
    
    // Test each filter individually
    const originalFilters = { ...currentFilters };
    
    // Test search filter
    currentFilters = { search: '', project: '', portfolio: '', tester: '', status: '', dateFrom: '', dateTo: '', sprint: '', sort: 'date-desc' };
    currentFilters.search = 'test';
    let filtered = filterReports(allReports);
    console.log('Search "test" results:', filtered.length);
    
    // Test project filter (use first available project)
    const projects = [...new Set(allReports.map(r => r.project || r.projectName).filter(Boolean))];
    if (projects.length > 0) {
        currentFilters = { search: '', project: '', portfolio: '', tester: '', status: '', dateFrom: '', dateTo: '', sprint: '', sort: 'date-desc' };
        currentFilters.project = projects[0];
        filtered = filterReports(allReports);
        console.log(`Project "${projects[0]}" results:`, filtered.length);
    }
    
    // Test tester filter (use first available tester)
    const testers = new Set();
    allReports.forEach(report => {
        // Extract testers using same logic as initialization
        if (Array.isArray(report.testers)) {
            report.testers.forEach(tester => {
                const name = typeof tester === 'object' ? tester.name : tester;
                if (name) testers.add(name.toString().trim());
            });
        } else if (Array.isArray(report.testerData)) {
            report.testerData.forEach(tester => {
                if (tester && tester.name) testers.add(tester.name.trim());
            });
        }
    });
    
    const testersList = [...testers];
    if (testersList.length > 0) {
        currentFilters = { search: '', project: '', portfolio: '', tester: '', status: '', dateFrom: '', dateTo: '', sprint: '', sort: 'date-desc' };
        currentFilters.tester = testersList[0];
        filtered = filterReports(allReports);
        console.log(`Tester "${testersList[0]}" results:`, filtered.length);
        
        // Debug first few reports for tester data
        console.log('First 3 reports tester data:');
        allReports.slice(0, 3).forEach((report, i) => {
            console.log(`Report ${i + 1}:`, {
                title: report.title,
                testers: report.testers,
                testerData: report.testerData,
                tester_data: report.tester_data
            });
        });
    }
    
    // Test status filter
    const statuses = [...new Set(allReports.map(r => r.status || r.testingStatus).filter(Boolean))];
    if (statuses.length > 0) {
        currentFilters = { search: '', project: '', portfolio: '', tester: '', status: '', dateFrom: '', dateTo: '', sprint: '', sort: 'date-desc' };
        currentFilters.status = statuses[0];
        filtered = filterReports(allReports);
        console.log(`Status "${statuses[0]}" results:`, filtered.length);
    }
    
    // Test no filters (should return all)
    currentFilters = { search: '', project: '', portfolio: '', tester: '', status: '', dateFrom: '', dateTo: '', sprint: '', sort: 'date-desc' };
    filtered = filterReports(allReports);
    console.log('No filters results (should be all):', filtered.length);
    
    // Restore original filters
    currentFilters = originalFilters;
    
    console.log('Individual filter testing complete!');
}

// Debug function to analyze report data structure
function debugReportData() {
    console.log('🔍 Debugging report data structure...');
    console.log('Total reports:', allReports.length);
    
    if (allReports.length > 0) {
        const sampleReport = allReports[0];
        console.log('Sample report structure:', sampleReport);
        console.log('Available fields:', Object.keys(sampleReport));
        
        // Analyze tester data
        console.log('\n👤 Tester data analysis:');
        allReports.slice(0, 5).forEach((report, index) => {
            console.log(`Report ${index + 1}:`, {
                id: report.id,
                title: report.title,
                testers: report.testers,
                tester: report.tester,
                testerName: report.testerName,
                assignedTester: report.assignedTester
            });
        });
        
        // Analyze date data
        console.log('\n📅 Date data analysis:');
        allReports.slice(0, 5).forEach((report, index) => {
            console.log(`Report ${index + 1}:`, {
                id: report.id,
                title: report.title,
                date: report.date,
                reportDate: report.reportDate,
                createdAt: report.createdAt,
                created_at: report.created_at,
                dateCreated: report.dateCreated
            });
        });
        
        // Count unique testers
        const allTesters = new Set();
        allReports.forEach(report => {
            if (Array.isArray(report.testers)) {
                report.testers.forEach(tester => {
                    if (tester) allTesters.add(typeof tester === 'object' ? tester.name : tester);
                });
            } else if (report.testers) {
                allTesters.add(report.testers);
            } else if (report.tester) {
                allTesters.add(report.tester);
            }
        });
        
        console.log('\n📊 Summary:');
        console.log('Unique testers found:', [...allTesters]);
        console.log('Total unique testers:', allTesters.size);
    }
}

// Initialize filter dropdowns with data
async function initializeFilterDropdowns() {
    try {
        // Fetch all reports to populate filter options
        const result = await fetchReports(1, '', 1000);
        allReports = result.reports || [];
        
        console.log('Initializing filters with', allReports.length, 'reports');
        console.log('Raw API result:', result);
        
        // If no reports, try to understand why
        if (allReports.length === 0) {
            console.warn('No reports found. API result structure:', result);
            console.warn('Possible issues: 1) No data in database, 2) API endpoint issue, 3) Data structure mismatch');
            return;
        }
        
        // Extract unique values for dropdowns with robust field handling
        const projects = new Set();
        const portfolios = new Set();
        const testers = new Set();
        
        // Debug: Log first few reports to understand data structure
        if (allReports.length > 0) {
            console.log('Sample report data structure:', allReports[0]);
            console.log('All report keys:', Object.keys(allReports[0]));
            
            // Specifically check tester-related fields
            const sampleReport = allReports[0];
            console.log('Tester-related fields in sample report:', {
                testers: sampleReport.testers,
                tester: sampleReport.tester,
                testerData: sampleReport.testerData,
                tester_data: sampleReport.tester_data,
                assignedTesters: sampleReport.assignedTesters,
                testTeam: sampleReport.testTeam
            });
        }
        
        allReports.forEach((report, index) => {
            // Debug first few reports
            if (index < 3) {
                console.log(`Report ${index}:`, {
                    project: report.project,
                    projectName: report.projectName,
                    portfolio: report.portfolio,
                    portfolioName: report.portfolioName,
                    testers: report.testers,
                    tester: report.tester,
                    date: report.date,
                    reportDate: report.reportDate,
                    createdAt: report.createdAt
                });
            }
            
            // Extract project names
            const projectName = report.project || report.projectName;
            if (projectName) projects.add(projectName);
            
            // Extract portfolio names
            const portfolioName = report.portfolio || report.portfolioName;
            if (portfolioName) portfolios.add(portfolioName);
            
            // Extract tester names - handle different data structures
            const possibleTesterFields = [
                'testers', 'tester', 'testerData', 'tester_data', 
                'assignedTesters', 'testTeam', 'testerName', 'assignedTester'
            ];
            
            // Log tester fields for debugging (only for first few reports)
            if (index < 3) {
                console.log(`Report ${index} tester fields:`, 
                    possibleTesterFields.reduce((acc, field) => {
                        acc[field] = report[field];
                        return acc;
                    }, {})
                );
            }
            
            // Check for testers array
            if (Array.isArray(report.testers)) {
                report.testers.forEach(tester => {
                    if (tester && typeof tester === 'string') {
                        testers.add(tester.trim());
                    } else if (tester && typeof tester === 'object') {
                        // Handle different object structures
                        const name = tester.name || tester.testerName || tester.email || tester.id;
                        if (name) testers.add(name.toString().trim());
                    }
                });
            } 
            // Check for testerData array (from form)
            else if (Array.isArray(report.testerData)) {
                report.testerData.forEach(tester => {
                    if (tester && typeof tester === 'object' && tester.name) {
                        testers.add(tester.name.trim());
                    }
                });
            }
            // Check for tester_data array (snake_case from database)
            else if (Array.isArray(report.tester_data)) {
                report.tester_data.forEach(tester => {
                    if (tester && typeof tester === 'object' && tester.name) {
                        testers.add(tester.name.trim());
                    }
                });
            }
            // Check for testers as JSON string
            else if (report.testers && typeof report.testers === 'string') {
                try {
                    // Try to parse as JSON first
                    const parsedTesters = JSON.parse(report.testers);
                    if (Array.isArray(parsedTesters)) {
                        parsedTesters.forEach(tester => {
                            const name = typeof tester === 'object' ? tester.name : tester;
                            if (name) testers.add(name.toString().trim());
                        });
                    }
                } catch (e) {
                    // If not JSON, treat as comma-separated string
                    const testerList = report.testers.split(',').map(t => t.trim()).filter(t => t);
                    testerList.forEach(tester => testers.add(tester));
                }
            } 
            // Check for single tester field
            else if (report.tester && typeof report.tester === 'string') {
                testers.add(report.tester.trim());
            }
            // Check for additional possible tester fields
            else if (report.testerName) {
                testers.add(report.testerName.toString().trim());
            }
            else if (report.assignedTester) {
                testers.add(report.assignedTester.toString().trim());
            }
        });
        
        // Convert sets to sorted arrays
        const sortedProjects = [...projects].sort();
        const sortedPortfolios = [...portfolios].sort();
        const sortedTesters = [...testers].sort();
        
        console.log('Filter options extracted:', {
            projects: sortedProjects,
            portfolios: sortedPortfolios,
            testers: sortedTesters
        });
        
        console.log('Filter counts:', {
            projects: sortedProjects.length,
            portfolios: sortedPortfolios.length,
            testers: sortedTesters.length
        });
        
        // If no testers found in reports, try to load from testers API
        if (sortedTesters.length === 0) {
            console.log('No testers found in reports, trying to load from testers API...');
            try {
                const testersResponse = await fetch('/api/testers');
                if (testersResponse.ok) {
                    const testersData = await testersResponse.json();
                    console.log('Loaded testers from API:', testersData);
                    testersData.forEach(tester => {
                        if (tester.name) {
                            testers.add(tester.name);
                        }
                    });
                    const updatedSortedTesters = [...testers].sort();
                    console.log('Updated testers list:', updatedSortedTesters);
                    
                    // Update the tester dropdown with API data
                    const testerFilter = document.getElementById('testerFilter');
                    if (testerFilter) {
                        // Clear existing options except the first one
                        while (testerFilter.children.length > 1) {
                            testerFilter.removeChild(testerFilter.lastChild);
                        }
                        
                        updatedSortedTesters.forEach(tester => {
                            const option = document.createElement('option');
                            option.value = tester;
                            option.textContent = tester;
                            testerFilter.appendChild(option);
                        });
                    }
                }
            } catch (error) {
                console.error('Error loading testers from API:', error);
            }
        }
        
        // Populate project dropdown
        const projectFilter = document.getElementById('projectFilter');
        if (projectFilter) {
            // Clear existing options except the first one
            while (projectFilter.children.length > 1) {
                projectFilter.removeChild(projectFilter.lastChild);
            }
            
            sortedProjects.forEach(project => {
                const option = document.createElement('option');
                option.value = project;
                option.textContent = project;
                projectFilter.appendChild(option);
            });
        }
        
        // Populate portfolio dropdown
        const portfolioFilter = document.getElementById('portfolioFilter');
        if (portfolioFilter) {
            // Clear existing options except the first one
            while (portfolioFilter.children.length > 1) {
                portfolioFilter.removeChild(portfolioFilter.lastChild);
            }
            
            sortedPortfolios.forEach(portfolio => {
                const option = document.createElement('option');
                option.value = portfolio;
                option.textContent = portfolio;
                portfolioFilter.appendChild(option);
            });
        }
        
        // Populate tester dropdown
        const testerFilter = document.getElementById('testerFilter');
        if (testerFilter) {
            // Clear existing options except the first one
            while (testerFilter.children.length > 1) {
                testerFilter.removeChild(testerFilter.lastChild);
            }
            
            sortedTesters.forEach(tester => {
                const option = document.createElement('option');
                option.value = tester;
                option.textContent = tester;
                testerFilter.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error initializing filter dropdowns:', error);
        showToast('Error loading filter options', 'error');
    }
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
    const basicFields = ['portfolioName', 'projectName', 'sprintNumber', 'reportVersion', 'reportName', 'cycleNumber', 'reportDate', 'testSummary', 'testingStatus', 'releaseNumber'];
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
    calculateAutomationPercentages();
    calculateAutomationStabilityPercentages();
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
            ['QA Notes', report.qaNotesData && report.qaNotesData.length > 0 ? `${report.qaNotesData.length} notes` : 'N/A']
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
    if (report.qaNotesData && report.qaNotesData.length > 0) {
        if (yPos > 200) {
            doc.addPage();
            yPos = 20;
        }
        addSection("QA Notes");
        report.qaNotesData.forEach((note, index) => {
            addText(`Note ${index + 1}: ${note.note}`);
        });
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
        ["QA Notes", report.qaNotesData && report.qaNotesData.length > 0 ? `${report.qaNotesData.length} notes` : 'N/A']
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
            <span class="data-preview-value">${latestData.releaseNumber} → Suggested: ${suggestedValues.releaseNumber}</span>
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
    
    // Load Sprint & Release Information
    if (loadSprintData) {
        document.getElementById('sprintNumber').value = suggestedValues.sprintNumber;
        document.getElementById('cycleNumber').value = suggestedValues.cycleNumber;
        document.getElementById('releaseNumber').value = suggestedValues.releaseNumber;
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
        teamMemberData = [...latestData.teamMembers];
        renderTeamMemberList();
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
window.applyFilters = applyFilters;
window.clearAllFilters = clearAllFilters;
window.toggleFiltersVisibility = toggleFiltersVisibility;
window.applyQuickFilter = applyQuickFilter;
window.removeFilter = removeFilter;
window.initializeFilterDropdowns = initializeFilterDropdowns;
window.refreshFilterData = refreshFilterData;
window.debugReportData = debugReportData;
window.testAPI = testAPI;
window.testTestersAPI = testTestersAPI;
window.testIndividualFilters = testIndividualFilters;
window.showAllReports = showAllReports;
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
window.calculateAutomationPercentages = calculateAutomationPercentages;
window.calculateAutomationStabilityPercentages = calculateAutomationStabilityPercentages;
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
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    
    // Setup MutationObserver to watch for theme attribute changes (fallback)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                console.log('Create report: Theme attribute changed, recreating charts...');
                // Trigger chart recreation with same logic as themeChanged event
                setTimeout(() => {
                    // Store current chart data before destroying charts
                    const chartConfigs = [
                        { chart: userStoriesChart, id: 'userStoriesChart', labels: ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'], colors: ['#28a745', '#ffc107', '#dc3545', '#6c757d', '#fd7e14', '#6f42c1', '#20c997'] },
                        { chart: testCasesChart, id: 'testCasesChart', labels: ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'], colors: ['#28a745', '#ffc107', '#dc3545', '#6c757d', '#fd7e14', '#6f42c1', '#20c997'] },
                        { chart: issuesPriorityChart, id: 'issuesPriorityChart', labels: ['Critical', 'High', 'Medium', 'Low'], colors: ['#dc3545', '#fd7e14', '#ffc107', '#28a745'] },
                        { chart: issuesStatusChart, id: 'issuesStatusChart', labels: ['New', 'Fixed', 'Not Fixed', 'Re-opened', 'Deferred'], colors: ['#17a2b8', '#28a745', '#dc3545', '#fd7e14', '#6f42c1'] },
                        { chart: enhancementsChart, id: 'enhancementsChart', labels: ['New', 'Implemented', 'Exists'], colors: ['#17a2b8', '#28a745', '#6c757d'] }
                    ];
                    
                    // Store data and destroy existing charts
                    const chartData = {};
                    chartConfigs.forEach(config => {
                        if (config.chart && config.chart.data) {
                            chartData[config.id] = config.chart.data.datasets[0].data;
                        }
                        if (config.chart && config.chart.destroy) {
                            config.chart.destroy();
                        }
                    });
                    
                    // Recreate charts with new theme colors
                    recreateFormCharts(chartConfigs, chartData);
                }, 100);
            }
        });
    });
    
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
});

// Listen for theme changes and update chart colors
window.addEventListener('themeChanged', (event) => {
    console.log('Theme changed, recreating form charts...');
    
    // Store current chart data before destroying charts
    const chartConfigs = [
        { chart: userStoriesChart, id: 'userStoriesChart', labels: ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'], colors: ['#28a745', '#ffc107', '#dc3545', '#6c757d', '#fd7e14', '#6f42c1', '#20c997'] },
        { chart: testCasesChart, id: 'testCasesChart', labels: ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'], colors: ['#28a745', '#ffc107', '#dc3545', '#6c757d', '#fd7e14', '#6f42c1', '#20c997'] },
        { chart: issuesPriorityChart, id: 'issuesPriorityChart', labels: ['Critical', 'High', 'Medium', 'Low'], colors: ['#dc3545', '#fd7e14', '#ffc107', '#28a745'] },
        { chart: issuesStatusChart, id: 'issuesStatusChart', labels: ['New', 'Fixed', 'Not Fixed', 'Re-opened', 'Deferred'], colors: ['#17a2b8', '#28a745', '#dc3545', '#fd7e14', '#6f42c1'] },
        { chart: enhancementsChart, id: 'enhancementsChart', labels: ['New', 'Implemented', 'Exists'], colors: ['#17a2b8', '#28a745', '#6c757d'] }
    ];
    
    // Store data and destroy existing charts
    const chartData = {};
    chartConfigs.forEach(config => {
        if (config.chart && config.chart.data) {
            chartData[config.id] = config.chart.data.datasets[0].data;
        }
        if (config.chart && config.chart.destroy) {
            config.chart.destroy();
        }
    });
    
    // Recreate charts with new theme colors
    setTimeout(() => {
        recreateFormCharts(chartConfigs, chartData);
    }, 100);
});

// Function to recreate form charts with stored data
function recreateFormCharts(chartConfigs, chartData) {
    const isLightTheme = window.isCurrentThemeLight ? window.isCurrentThemeLight() : true;
    const borderColor = isLightTheme ? '#ffffff' : '#1e293b';

    chartConfigs.forEach(config => {
        const canvas = document.getElementById(config.id);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const data = chartData[config.id] || new Array(config.labels.length).fill(0);
            
            const newChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: config.labels,
                    datasets: [{
                        data: data,
                        backgroundColor: config.colors,
                        borderWidth: 3,
                        borderColor: borderColor
                    }]
                },
                options: getChartOptions()
            });
            
            // Reassign to global variables
            switch (config.id) {
                case 'userStoriesChart':
                    userStoriesChart = newChart;
                    break;
                case 'testCasesChart':
                    testCasesChart = newChart;
                    break;
                case 'issuesPriorityChart':
                    issuesPriorityChart = newChart;
                    break;
                case 'issuesStatusChart':
                    issuesStatusChart = newChart;
                    break;
                case 'enhancementsChart':
                    enhancementsChart = newChart;
                    break;
            }
        }
    });

    console.log('Form charts recreated with new theme colors');
}

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
            'testingStatus'
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
                if (typeof calculateAutomationPercentages === 'function') calculateAutomationPercentages();
                if (typeof calculateAutomationStabilityPercentages === 'function') calculateAutomationStabilityPercentages();
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
