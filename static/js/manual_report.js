
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

// Override navigation functions for manual report (11 sections)
let currentSection = 0;
const totalSections = 11;

// Section titles for manual report
const sectionTitles = [
    'General Details',
    'Test Summary',
    'Request & Build Info',
    'Team Information',
    'User Stories',
    'Test Cases',
    'Issues by Priority',
    'Issues by Status',
    'Enhancements',
    'Evaluation',
    'QA Notes'
];

// Override showSection function
function showSection(sectionIndex) {
    if (sectionIndex < 0 || sectionIndex >= totalSections) {
        console.warn('Invalid section index:', sectionIndex);
        return;
    }

    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.classList.remove('active');
    });

    // Show the selected section
    const targetSection = document.getElementById(`section-${sectionIndex}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Highlight the corresponding nav item
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems[sectionIndex]) {
        navItems[sectionIndex].classList.add('active');
    }

    // Update current section
    currentSection = sectionIndex;

    // Update progress bar
    updateProgressBar();

    // Update navigation buttons
    updateNavigationButtons();

    // Scroll to top of content area
    document.querySelector('.content-area').scrollTop = 0;
}

// Override nextSection function
function nextSection() {
    if (currentSection < totalSections - 1) {
        showSection(currentSection + 1);
    }
}

// Override previousSection function  
function previousSection() {
    if (currentSection > 0) {
        showSection(currentSection - 1);
    }
}

// Override updateProgressBar function
function updateProgressBar() {
    const progressPercent = Math.round((currentSection / (totalSections - 1)) * 100);
    const progressFill = document.getElementById('progressFill');
    const progressPercentSpan = document.getElementById('progressPercent');
    const progressStep = document.getElementById('progressStep');
    const progressTitle = document.getElementById('progressTitle');

    if (progressFill) {
        progressFill.style.width = progressPercent + '%';
    }

    if (progressPercentSpan) {
        progressPercentSpan.textContent = progressPercent + '%';
    }

    if (progressStep) {
        progressStep.textContent = `Step ${currentSection + 1} of ${totalSections}`;
    }

    if (progressTitle) {
        progressTitle.textContent = sectionTitles[currentSection] || '';
    }

    // Update step indicators
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index === currentSection) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }

        if (index < currentSection) {
            step.classList.add('completed');
        } else {
            step.classList.remove('completed');
        }
    });
}

// Override updateNavigationButtons function
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    if (prevBtn) {
        prevBtn.disabled = currentSection === 0;
    }

    if (nextBtn && submitBtn) {
        if (currentSection === totalSections - 1) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-block';
        } else {
            nextBtn.style.display = 'inline-block';
            submitBtn.style.display = 'none';
        }
    }
}

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
    if (typeof resetFormData === 'function') resetFormData();
    if (typeof loadFormDropdownData === 'function') loadFormDropdownData();
    if (typeof initializeCharts === 'function') initializeCharts(); // Ensure charts are initialized when the form page loads

    // Initialize progress bar and navigation for manual report
    currentSection = 0;
    updateProgressBar();
    updateNavigationButtons();

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
            document.getElementById('formTitle').textContent = 'Edit Manual Report';
        } else {
            showToast('Report not found for editing.', 'error');
            editingReportId = null; // Reset if not found
        }
    } else {
        document.getElementById('formTitle').textContent = 'Create Manual Report';

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
            formTitle.textContent = 'Edit Manual Report';
        } else {
            formTitle.textContent = 'Create Manual Report';
        }
    }
}