// static/js/form-handling.js
// Form Handling and Data Management

// --- Report Actions (CRUD) ---
function createNewReport() {
    // Redirect to the report types selection page
    window.location.href = '/reports_type.html';
}

async function viewReport(id) {
    window.location.href = `/view_report.html?id=${id}`;
}

async function editReport(id) {
    try {
        const report = await fetchReport(id);
        if (report) {
            // Store the report ID for editing
            window.editingReportId = id;
            
            // Redirect to create report page with the report data
            localStorage.setItem('editingReport', JSON.stringify(report));
            window.location.href = `/create_report.html?edit=${id}`;
        }
    } catch (error) {
        console.error('Error loading report for editing:', error);
        if (typeof showToast === 'function') {
            showToast('Error loading report for editing', 'error');
        }
    }
}

async function confirmDeleteReport(id) {
    if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
        const result = await deleteReportDB(id);
        if (result) {
            // Refresh the reports list
            await searchReports();
            
            // Invalidate dashboard cache
            if (window.dashboardStatsCache) {
                window.dashboardStatsCache = null;
            }
        }
    }
}

// --- Form Handling ---
function resetFormData() {
    const form = document.getElementById('qaReportForm');
    if (form) {
        form.reset();
    }

    // Reset all arrays
    window.requestData = [];
    window.buildData = [];
    window.testerData = [];
    window.teamMemberData = [];
    window.qaNoteFieldsData = [];
    window.qaNotesData = [];
    window.evaluationData = [];
    window.bugsData = [];
    window.performanceScenarios = [];
    window.httpRequestsOverview = [];
    window.servicesData = [];
    window.modulesData = [];

    // Reset editing state
    window.editingReportId = null;

    // Reset current section
    window.currentSection = 0;

    // Clear localStorage
    if (typeof clearFormDataFromLocalStorage === 'function') {
        clearFormDataFromLocalStorage();
    }

    // Reset charts
    if (typeof resetAllCharts === 'function') {
        resetAllCharts();
    }

    // Reset calculations
    if (typeof resetAllCalculations === 'function') {
        resetAllCalculations();
    }

    // Update navigation
    if (typeof updateNavigationButtons === 'function') {
        updateNavigationButtons();
    }

    // Show first section
    if (typeof showSection === 'function') {
        showSection(0);
    }

    if (typeof showToast === 'function') {
        showToast('Form reset successfully', 'info');
    }
}

function collectFormData() {
    const form = document.getElementById('qaReportForm');
    if (!form) {
        console.error('Form not found');
        return null;
    }

    const formData = new FormData(form);
    const data = {};

    // Collect basic form fields
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    // Add report type
    data.reportType = window.currentReportType || 'sprint';

    // Add array data
    data.requestData = window.requestData || [];
    data.buildData = window.buildData || [];
    data.testerData = window.testerData || [];
    data.teamMemberData = window.teamMemberData || [];
    data.qaNoteFieldsData = window.qaNoteFieldsData || [];
    data.qaNotesData = window.qaNotesData || [];
    data.evaluationData = window.evaluationData || [];
    data.bugsData = window.bugsData || [];
    data.performanceScenarios = window.performanceScenarios || [];
    data.httpRequestsOverview = window.httpRequestsOverview || [];
    data.servicesData = window.servicesData || [];
    data.modulesData = window.modulesData || [];

    // Add calculated metrics
    if (typeof calculateUserStoryTotal === 'function') {
        data.userStoriesMetric = calculateUserStoryTotal();
    }
    if (typeof calculateTestCasesTotal === 'function') {
        data.testCasesMetric = calculateTestCasesTotal();
    }
    if (typeof calculateIssuesTotal === 'function') {
        data.issuesMetric = calculateIssuesTotal();
    }
    if (typeof calculateEnhancementsTotal === 'function') {
        data.enhancementsMetric = calculateEnhancementsTotal();
    }

    // Add QA notes count
    data.qaNotesMetric = (window.qaNotesData || []).length;

    return data;
}

function loadFormData(reportData) {
    if (!reportData) return;

    const form = document.getElementById('qaReportForm');
    if (!form) {
        console.error('Form not found');
        return;
    }

    // Set report type first
    if (reportData.reportType) {
        window.currentReportType = reportData.reportType;
        if (typeof changeReportType === 'function') {
            changeReportType(reportData.reportType);
        }
    }

    // Load basic form fields
    Object.keys(reportData).forEach(key => {
        const field = form.querySelector(`[name="${key}"]`);
        if (field && typeof reportData[key] === 'string') {
            field.value = reportData[key];
        }
    });

    // Load array data
    if (reportData.requestData) {
        window.requestData = reportData.requestData;
        if (typeof renderRequestList === 'function') {
            renderRequestList();
        }
    }

    if (reportData.buildData) {
        window.buildData = reportData.buildData;
        if (typeof renderBuildList === 'function') {
            renderBuildList();
        }
    }

    if (reportData.testerData) {
        window.testerData = reportData.testerData;
        if (typeof renderTesterList === 'function') {
            renderTesterList();
        }
    }

    if (reportData.teamMemberData) {
        window.teamMemberData = reportData.teamMemberData;
        if (typeof renderTeamMemberList === 'function') {
            renderTeamMemberList();
        }
    }

    if (reportData.qaNoteFieldsData) {
        window.qaNoteFieldsData = reportData.qaNoteFieldsData;
        if (typeof renderQANoteFieldsList === 'function') {
            renderQANoteFieldsList();
        }
    }

    if (reportData.qaNotesData) {
        window.qaNotesData = reportData.qaNotesData;
        if (typeof renderQANotesList === 'function') {
            renderQANotesList();
        }
    }

    if (reportData.evaluationData) {
        window.evaluationData = reportData.evaluationData;
        if (typeof loadEvaluationData === 'function') {
            loadEvaluationData(reportData.evaluationData);
        }
    }

    if (reportData.bugsData) {
        window.bugsData = reportData.bugsData;
        if (typeof renderBugsList === 'function') {
            renderBugsList();
        }
    }

    if (reportData.performanceScenarios) {
        window.performanceScenarios = reportData.performanceScenarios;
        if (typeof renderScenariosList === 'function') {
            renderScenariosList();
        }
    }

    if (reportData.httpRequestsOverview) {
        window.httpRequestsOverview = reportData.httpRequestsOverview;
        if (typeof renderHttpRequestsTable === 'function') {
            renderHttpRequestsTable();
        }
    }

    if (reportData.servicesData) {
        window.servicesData = reportData.servicesData;
        if (typeof renderServicesList === 'function') {
            renderServicesList();
        }
    }

    if (reportData.modulesData) {
        window.modulesData = reportData.modulesData;
        if (typeof renderModulesList === 'function') {
            renderModulesList();
        }
    }

    // Recalculate charts and metrics
    setTimeout(() => {
        if (typeof calculatePercentages === 'function') {
            calculatePercentages();
        }
        if (typeof calculateTestCasesPercentages === 'function') {
            calculateTestCasesPercentages();
        }
        if (typeof calculateIssuesPercentages === 'function') {
            calculateIssuesPercentages();
        }
        if (typeof calculateEnhancementsPercentages === 'function') {
            calculateEnhancementsPercentages();
        }
        if (typeof calculateAutomationPercentages === 'function') {
            calculateAutomationPercentages();
        }
    }, 100);
}

async function submitForm() {
    const formData = collectFormData();
    if (!formData) {
        if (typeof showToast === 'function') {
            showToast('Error collecting form data', 'error');
        }
        return;
    }

    // Validate required fields
    const requiredFields = ['portfolioName', 'projectName', 'reportDate'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
        if (typeof showToast === 'function') {
            showToast(`Please fill in required fields: ${missingFields.join(', ')}`, 'warning');
        }
        return;
    }

    try {
        const result = await saveReport(formData);
        if (result) {
            // Clear form data from localStorage
            if (typeof clearFormDataOnSubmit === 'function') {
                clearFormDataOnSubmit();
            }

            // Redirect to reports page
            setTimeout(() => {
                window.location.href = '/reports.html';
            }, 1500);
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        if (typeof showToast === 'function') {
            showToast('Error submitting form: ' + error.message, 'error');
        }
    }
}

// Form validation
function validateForm() {
    const form = document.getElementById('qaReportForm');
    if (!form) return false;

    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    const missingFields = [];

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            missingFields.push(field.name || field.id);
            field.classList.add('is-invalid');
        } else {
            field.classList.remove('is-invalid');
        }
    });

    if (!isValid && typeof showToast === 'function') {
        showToast(`Please fill in required fields: ${missingFields.join(', ')}`, 'warning');
    }

    return isValid;
}

// Auto-save functionality
function setupFormAutoSave() {
    const form = document.getElementById('qaReportForm');
    if (!form) return;

    // Add event listeners for auto-save
    form.addEventListener('input', () => {
        if (typeof autoSaveFormData === 'function') {
            autoSaveFormData();
        }
    });

    form.addEventListener('change', () => {
        if (typeof autoSaveFormData === 'function') {
            autoSaveFormData();
        }
    });
}

// Initialize form on page load
function initializeForm() {
    // Check if we're editing a report
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId) {
        window.editingReportId = editId;
        
        // Try to load from localStorage first (for page refresh)
        const savedReport = localStorage.getItem('editingReport');
        if (savedReport) {
            try {
                const reportData = JSON.parse(savedReport);
                loadFormData(reportData);
                localStorage.removeItem('editingReport'); // Clean up
            } catch (error) {
                console.error('Error loading saved report data:', error);
            }
        } else {
            // Load from API
            fetchReport(editId).then(reportData => {
                if (reportData) {
                    loadFormData(reportData);
                }
            });
        }
    }

    // Load saved form data from localStorage
    if (typeof loadFormDataFromLocalStorage === 'function') {
        loadFormDataFromLocalStorage();
    }

    // Setup auto-save
    setupFormAutoSave();

    // Initialize charts
    if (typeof initializeCharts === 'function') {
        initializeCharts();
    }

    // Set default date
    const reportDateField = document.getElementById('reportDate');
    if (reportDateField && !reportDateField.value) {
        reportDateField.value = getCurrentDate();
    }

    // Update navigation
    if (typeof updateNavigationButtons === 'function') {
        updateNavigationButtons();
    }
}

// Make functions globally accessible
window.createNewReport = createNewReport;
window.viewReport = viewReport;
window.editReport = editReport;
window.confirmDeleteReport = confirmDeleteReport;
window.resetFormData = resetFormData;
window.collectFormData = collectFormData;
window.loadFormData = loadFormData;
window.submitForm = submitForm;
window.validateForm = validateForm;
window.setupFormAutoSave = setupFormAutoSave;
window.initializeForm = initializeForm;