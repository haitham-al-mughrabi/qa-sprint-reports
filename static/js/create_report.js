// Check if Font Awesome is loaded and force reload if needed
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        // Check if Font Awesome icons are loaded by testing a known icon
        const testIcon = document.createElement('i');
        testIcon.className = 'fas fa-info-circle';
        testIcon.style.position = 'absolute';
        testIcon.style.left = '-9999px';
        document.body.appendChild(testIcon);

        const computedStyle = window.getComputedStyle(testIcon, ':before');
        const content = computedStyle.getPropertyValue('content');

        // If Font Awesome isn't loaded, the content will be 'none' or empty
        if (!content || content === 'none' || content === '""') {
            console.warn('Font Awesome icons not loaded, attempting to reload...');

            // Try to reload Font Awesome
            const faLink = document.createElement('link');
            faLink.rel = 'stylesheet';
            faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            faLink.crossOrigin = 'anonymous';
            document.head.appendChild(faLink);
        }

        document.body.removeChild(testIcon);
    }, 1000);
});

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize theme first
    if (window.themeManager) {
        window.themeManager.init();
    }
    // Set active class for navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === window.location.pathname) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    // Initialize form for new report
    resetFormData();
    loadFormDropdownData();
    initializeCharts(); // Ensure charts are initialized when the form page loads

    // Initialize progress bar and steps
    initializeProgressSteps();
    updateProgressBar();

    // Remove hardcoded width/height from chart canvases after initialization
    document.querySelectorAll('.chart-container canvas').forEach(canvas => {
        canvas.removeAttribute('width');
        canvas.removeAttribute('height');
    });

    // Check if there's a report ID in the URL for editing
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');
    if (reportId) {
        editingReportId = reportId;
        const report = await fetchReport(reportId);
        if (report) {
            loadReportForEditing(report);
            document.getElementById('formTitle').textContent = 'Edit QA Report';
        } else {
            showToast('Report not found for editing.', 'error');
            editingReportId = null; // Reset if not found
        }
    } else {
        document.getElementById('formTitle').textContent = 'Create Enhanced QA Report';

    }




    window.addEventListener('beforeunload', (event) => {
        // Only clear if we're not editing a report (to avoid clearing during editing)
        if (!editingReportId) {


        }
    });
});

// Function to update the report title based on custom name input
function updateReportTitle() {
    const reportNameInput = document.getElementById('reportName');
    const formTitle = document.getElementById('formTitle');
    const customName = reportNameInput.value.trim();

    if (customName) {
        formTitle.textContent = customName;
    } else {
        // Use default based on editing state
        if (editingReportId) {
            formTitle.textContent = 'Edit QA Report';
        } else {
            formTitle.textContent = 'Create Enhanced QA Report';
        }
    }
}
