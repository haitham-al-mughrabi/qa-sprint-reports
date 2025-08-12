export function showSection(sectionIndex) {
    // Use report type-aware navigation if available
    if (typeof window.showSectionForReportType === 'function') {
        window.showSectionForReportType(sectionIndex);
        return;
    }
    
    // Fallback to original implementation
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

export function nextSection() {
    // Use report type-aware navigation if available
    if (typeof window.nextSectionForReportType === 'function') {
        window.nextSectionForReportType();
        return;
    }
    
    // Fallback to original implementation
    if (currentSection < 12) { // Max section index is 12 (QA Notes)
        showSection(currentSection + 1);
    }
}

export function previousSection() {
    // Use report type-aware navigation if available
    if (typeof window.previousSectionForReportType === 'function') {
        window.previousSectionForReportType();
        return;
    }
    
    // Fallback to original implementation
    if (currentSection > 0) {
        showSection(currentSection - 1);
    }
}

export function updateNavigationButtons() {
    // Use report type-aware navigation if available
    if (typeof window.updateNavigationButtonsForReportType === 'function') {
        window.updateNavigationButtonsForReportType();
        return;
    }
    
    // Fallback to original implementation
    document.getElementById('prevBtn').disabled = currentSection === 0;
    const isLastSection = currentSection === 12;
    document.getElementById('nextBtn').style.display = isLastSection ? 'none' : 'inline-block';
    document.getElementById('submitBtn').style.display = isLastSection ? 'inline-block' : 'none';
}

export function updateProgressBar() {
    // Use report type-aware navigation if available
    if (typeof window.updateProgressBarForReportType === 'function') {
        window.updateProgressBarForReportType();
        return;
    }
    
    // Fallback to original implementation
    const totalSections = 13;
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
        'Automation Regression',
        'Automation Test Stability',
        'QA Notes'
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
            // For future steps, ensure they have the correct icon (but don't force reset on initial load)
            const icon = step.querySelector('.step-circle i');
            const stepIcons = [
                'fas fa-info-circle',
                'fas fa-chart-bar',
                'fas fa-clipboard-list',
                'fas fa-users',
                'fas fa-user-check',
                'fas fa-flask',
                'fas fa-exclamation-triangle',
                'fas fa-tasks',
                'fas fa-lightbulb',
                'fas fa-star',
                'fas fa-robot',
                'fas fa-balance-scale',
                'fas fa-sticky-note'
            ];
            if (icon) {
                // Only reset icon if it's currently a checkmark (from previous completion)
                if (icon.classList.contains('fa-check')) {
                    icon.className = stepIcons[index] || 'fas fa-circle';
                }
                // Otherwise, leave the icon as it is (preserves initial HTML icons)
            }
        }
    });
}

// Add click functionality to progress steps
export function initializeProgressSteps() {
    // Use report type-aware navigation if available
    if (typeof window.initializeProgressStepsForReportType === 'function') {
        window.initializeProgressStepsForReportType();
        return;
    }
    
    // Fallback to original implementation
    document.querySelectorAll('.step').forEach((step, index) => {
        step.addEventListener('click', () => {
            showSection(index);
        });
    });
}

// backToDashboard now redirects to the dashboard page
export function backToDashboard() { window.location.href = '/dashboard'; }
export function toggleSidebar() {
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
