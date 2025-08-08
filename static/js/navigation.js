// static/js/navigation.js
// Navigation and Section Management

// --- Page Management & Navigation (Simplified for multi-page app) ---
// The showPage function is no longer needed for navigation between main pages.
// Browser handles page loads.

function showSection(sectionIndex) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });

    // Show the selected section
    const targetSection = document.querySelector(`[data-section="${sectionIndex}"]`) || 
                         document.getElementById(`section-${sectionIndex}`) ||
                         document.querySelector(`.section:nth-child(${sectionIndex + 1})`);
    
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }

    // Update current section
    window.currentSection = sectionIndex;

    // Update navigation buttons
    updateNavigationButtons();

    // Update progress bar
    updateProgressBar(sectionIndex);

    // Update sidebar navigation
    updateSidebarNavigation(sectionIndex);
}

function nextSection() {
    const totalSections = getTotalSections();
    if (window.currentSection < totalSections - 1) {
        showSection(window.currentSection + 1);
    }
}

function prevSection() {
    if (window.currentSection > 0) {
        showSection(window.currentSection - 1);
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    const totalSections = getTotalSections();

    if (prevBtn) {
        prevBtn.style.display = window.currentSection === 0 ? 'none' : 'inline-block';
    }

    if (nextBtn && submitBtn) {
        if (window.currentSection === totalSections - 1) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-block';
        } else {
            nextBtn.style.display = 'inline-block';
            submitBtn.style.display = 'none';
        }
    }
}

function updateProgressBar(sectionIndex) {
    const totalSections = getTotalSections();
    const progressStep = document.getElementById('progressStep');
    const progressTitle = document.getElementById('progressTitle');
    const progressSteps = document.querySelectorAll('.step');

    if (progressStep) {
        progressStep.textContent = `Step ${sectionIndex + 1} of ${totalSections}`;
    }

    // Update step titles based on report type
    const stepTitles = getStepTitles();
    if (progressTitle && stepTitles[sectionIndex]) {
        progressTitle.textContent = stepTitles[sectionIndex];
    }

    // Update progress steps visual state
    progressSteps.forEach((step, index) => {
        if (index === sectionIndex) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

function updateSidebarNavigation(sectionIndex) {
    // Update sidebar navigation items
    const navItems = document.querySelectorAll('#sidebar .nav-item');
    navItems.forEach((item, index) => {
        if (index === sectionIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function getTotalSections() {
    const reportType = window.currentReportType || 'sprint';
    
    switch (reportType) {
        case 'sprint':
            return 10;
        case 'manual':
            return 9;
        case 'automation':
            return 8;
        case 'performance':
            return 6;
        default:
            return 10;
    }
}

function getStepTitles() {
    const reportType = window.currentReportType || 'sprint';
    
    switch (reportType) {
        case 'sprint':
            return [
                'General Information',
                'Testing Summary',
                'Additional Information',
                'User Stories',
                'Test Cases',
                'Issues & Enhancements',
                'Enhancements',
                'Automation Regression',
                'Evaluation',
                'QA Notes'
            ];
        case 'manual':
            return [
                'General Information',
                'Testing Summary',
                'Additional Information',
                'User Stories',
                'Test Cases',
                'Issues & Enhancements',
                'Enhancements',
                'Evaluation',
                'QA Notes'
            ];
        case 'automation':
            return [
                'General Information',
                'Testing Summary',
                'Additional Information',
                'Automation Regression',
                'QA Notes',
                'Services',
                'Modules',
                'Bugs'
            ];
        case 'performance':
            return [
                'General Information',
                'Performance Summary',
                'Response Time Analysis',
                'Performance Criteria',
                'Test Scenarios',
                'HTTP Requests Overview'
            ];
        default:
            return [
                'General Information',
                'Testing Summary',
                'Additional Information',
                'User Stories',
                'Test Cases',
                'Issues & Enhancements',
                'Enhancements',
                'Automation Regression',
                'Evaluation',
                'QA Notes'
            ];
    }
}

// Event Listeners and Window Functions
// Close modal when clicking outside
window.onclick = function (event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Make functions globally accessible
window.showSection = showSection;
window.nextSection = nextSection;
window.prevSection = prevSection;
window.updateNavigationButtons = updateNavigationButtons;
window.updateProgressBar = updateProgressBar;
window.updateSidebarNavigation = updateSidebarNavigation;
window.getTotalSections = getTotalSections;
window.getStepTitles = getStepTitles;