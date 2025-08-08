// static/js/main.js
// Main initialization file that coordinates all modules

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing QA Reports System...');

    try {
        // Initialize based on current page
        const currentPage = getCurrentPageType();
        console.log('Current page type:', currentPage);

        switch (currentPage) {
            case 'dashboard':
                await initializeDashboard();
                break;
            case 'reports':
                await initializeReportsPage();
                break;
            case 'create-report':
                await initializeCreateReportPage();
                break;
            case 'view-report':
                await initializeViewReportPage();
                break;
            case 'report-types':
                initializeReportTypesPage();
                break;
            default:
                console.log('No specific initialization for this page');
        }

        console.log('✅ QA Reports System initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing QA Reports System:', error);
        if (typeof showToast === 'function') {
            showToast('Error initializing application: ' + error.message, 'error');
        }
    }
});

// Determine current page type based on URL
function getCurrentPageType() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';

    if (filename === 'index.html' || filename === '' || filename === '/') {
        return 'dashboard';
    } else if (filename === 'reports.html') {
        return 'reports';
    } else if (filename === 'create_report.html') {
        return 'create-report';
    } else if (filename === 'view_report.html') {
        return 'view-report';
    } else if (filename === 'reports_type.html') {
        return 'report-types';
    }

    return 'unknown';
}

// Initialize Dashboard Page
async function initializeDashboard() {
    console.log('Initializing Dashboard...');

    try {
        // Fetch dashboard stats
        const stats = await fetchDashboardStats();
        
        // Update dashboard display
        if (typeof updateDashboardStats === 'function') {
            updateDashboardStats(stats);
        }

        // Initialize any dashboard-specific charts or components
        console.log('✅ Dashboard initialized');
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        throw error;
    }
}

// Initialize Reports Page
async function initializeReportsPage() {
    console.log('Initializing Reports Page...');

    try {
        // Set up search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput && typeof debouncedSearchReports === 'function') {
            searchInput.addEventListener('input', debouncedSearchReports);
        }

        // Set up filter change listeners
        const filters = ['statusFilter', 'reportTypeFilter', 'sortBy', 'sortOrder'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter && typeof searchReports === 'function') {
                filter.addEventListener('change', searchReports);
            }
        });

        // Initial load of reports
        if (typeof searchReports === 'function') {
            await searchReports();
        }

        console.log('✅ Reports page initialized');
    } catch (error) {
        console.error('Error initializing reports page:', error);
        throw error;
    }
}

// Initialize Create Report Page
async function initializeCreateReportPage() {
    console.log('Initializing Create Report Page...');

    try {
        // Initialize form
        if (typeof initializeForm === 'function') {
            initializeForm();
        }

        // Set up auto-save
        if (typeof setupAutoSave === 'function') {
            setupAutoSave();
        }

        // Set up auto-save overrides
        if (typeof setupAutoSaveOverrides === 'function') {
            setupAutoSaveOverrides();
        }

        // Initialize charts
        if (typeof initializeCharts === 'function') {
            initializeCharts();
        }

        // Set default report date
        const reportDateField = document.getElementById('reportDate');
        if (reportDateField && !reportDateField.value && typeof getCurrentDate === 'function') {
            reportDateField.value = getCurrentDate();
        }

        // Initialize navigation
        if (typeof updateNavigationButtons === 'function') {
            updateNavigationButtons();
        }

        // Load form data from localStorage if available
        if (typeof loadFormDataFromLocalStorage === 'function') {
            loadFormDataFromLocalStorage();
        }

        // Set up form validation
        const form = document.getElementById('qaReportForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (typeof submitForm === 'function') {
                    submitForm();
                }
            });
        }

        // Set up calculation event listeners
        setupCalculationListeners();

        console.log('✅ Create Report page initialized');
    } catch (error) {
        console.error('Error initializing create report page:', error);
        throw error;
    }
}

// Initialize View Report Page
async function initializeViewReportPage() {
    console.log('Initializing View Report Page...');

    try {
        // Get report ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const reportId = urlParams.get('id');

        if (!reportId) {
            throw new Error('No report ID provided');
        }

        // Fetch and display report
        if (typeof fetchReport === 'function') {
            const report = await fetchReport(reportId);
            if (report) {
                displayReportData(report);
            } else {
                throw new Error('Report not found');
            }
        }

        console.log('✅ View Report page initialized');
    } catch (error) {
        console.error('Error initializing view report page:', error);
        if (typeof showToast === 'function') {
            showToast('Error loading report: ' + error.message, 'error');
        }
        // Redirect to reports page after a delay
        setTimeout(() => {
            window.location.href = '/reports.html';
        }, 3000);
    }
}

// Initialize Report Types Page
function initializeReportTypesPage() {
    console.log('Initializing Report Types Page...');

    // Set up report type selection buttons
    const reportTypeButtons = document.querySelectorAll('[data-report-type]');
    reportTypeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const reportType = e.target.getAttribute('data-report-type') || 
                             e.target.closest('[data-report-type]').getAttribute('data-report-type');
            
            if (reportType) {
                // Store selected report type
                localStorage.setItem('selectedReportType', reportType);
                // Redirect to create report page
                window.location.href = '/create_report.html';
            }
        });
    });

    console.log('✅ Report Types page initialized');
}

// Set up calculation event listeners
function setupCalculationListeners() {
    // User Stories calculation listeners
    const userStoryFields = [
        'passedStories', 'passedWithIssuesStories', 'failedStories', 
        'blockedStories', 'cancelledStories', 'deferredStories', 'notTestableStories'
    ];
    
    userStoryFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && typeof calculatePercentages === 'function') {
            field.addEventListener('input', calculatePercentages);
            field.addEventListener('change', calculatePercentages);
        }
    });

    // Test Cases calculation listeners
    const testCaseFields = [
        'passedTestCases', 'passedWithIssuesTestCases', 'failedTestCases',
        'blockedTestCases', 'cancelledTestCases', 'deferredTestCases', 'notTestableTestCases'
    ];
    
    testCaseFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && typeof calculateTestCasesPercentages === 'function') {
            field.addEventListener('input', calculateTestCasesPercentages);
            field.addEventListener('change', calculateTestCasesPercentages);
        }
    });

    // Issues calculation listeners
    const issueFields = [
        'criticalIssues', 'highIssues', 'mediumIssues', 'lowIssues',
        'newIssues', 'fixedIssues', 'notFixedIssues', 'reopenedIssues', 'deferredIssues'
    ];
    
    issueFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && typeof calculateIssuesPercentages === 'function') {
            field.addEventListener('input', calculateIssuesPercentages);
            field.addEventListener('change', calculateIssuesPercentages);
        }
    });

    // Enhancements calculation listeners
    const enhancementFields = ['newEnhancements', 'implementedEnhancements', 'existsEnhancements'];
    
    enhancementFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && typeof calculateEnhancementsPercentages === 'function') {
            field.addEventListener('input', calculateEnhancementsPercentages);
            field.addEventListener('change', calculateEnhancementsPercentages);
        }
    });

    // Automation calculation listeners
    const automationFields = [
        'automationPassedTestCases', 'automationFailedTestCases', 'automationSkippedTestCases',
        'automationStableTests', 'automationFlakyTests'
    ];
    
    automationFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && typeof calculateAutomationPercentages === 'function') {
            field.addEventListener('input', calculateAutomationPercentages);
            field.addEventListener('change', calculateAutomationPercentages);
        }
    });

    // Evaluation calculation listeners
    const evaluationFields = [
        'involvementScore', 'requirementsScore', 'qaPlanScore', 'uxScore', 'cooperationScore',
        'criticalBugsScore', 'highBugsScore', 'mediumBugsScore', 'lowBugsScore',
        'involvementReason', 'requirementsReason', 'qaPlanReason', 'uxReason', 'cooperationReason',
        'criticalBugsReason', 'highBugsReason', 'mediumBugsReason', 'lowBugsReason'
    ];
    
    evaluationFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && typeof updateEvaluationScore === 'function') {
            field.addEventListener('input', updateEvaluationScore);
            field.addEventListener('change', updateEvaluationScore);
        }
    });
}

// Display report data (for view report page)
function displayReportData(report) {
    // This function would populate the view report page with data
    // Implementation depends on the specific HTML structure of the view page
    console.log('Displaying report data:', report);
    
    // Update page title
    document.title = `${report.portfolioName} - ${report.projectName} Report`;
    
    // You would implement the specific display logic here based on your HTML structure
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (typeof showToast === 'function') {
        showToast('An unexpected error occurred. Please refresh the page.', 'error');
    }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (typeof showToast === 'function') {
        showToast('An unexpected error occurred. Please try again.', 'error');
    }
});

// Make functions globally accessible
window.getCurrentPageType = getCurrentPageType;
window.initializeDashboard = initializeDashboard;
window.initializeReportsPage = initializeReportsPage;
window.initializeCreateReportPage = initializeCreateReportPage;
window.initializeViewReportPage = initializeViewReportPage;
window.initializeReportTypesPage = initializeReportTypesPage;
window.setupCalculationListeners = setupCalculationListeners;
window.displayReportData = displayReportData;