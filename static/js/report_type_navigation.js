/**
 * Report Type Navigation Configuration
 * This file defines the navigation structure for different report types
 */

// Define navigation configurations for each report type
const REPORT_TYPE_CONFIGS = {
    'sprint': {
        totalSections: 13,
        sections: [
            { id: 0, title: 'General Details', icon: 'fas fa-info-circle', label: 'General' },
            { id: 1, title: 'Test Summary', icon: 'fas fa-chart-bar', label: 'Summary' },
            { id: 2, title: 'Request & Build Info', icon: 'fas fa-clipboard-list', label: 'Build Info' },
            { id: 3, title: 'Team Information', icon: 'fas fa-users', label: 'Team' },
            { id: 4, title: 'User Stories', icon: 'fas fa-user-check', label: 'Stories' },
            { id: 5, title: 'Test Cases', icon: 'fas fa-flask', label: 'Test Cases' },
            { id: 6, title: 'Issues by Priority', icon: 'fas fa-exclamation-triangle', label: 'Priority' },
            { id: 7, title: 'Issues by Status', icon: 'fas fa-tasks', label: 'Status' },
            { id: 8, title: 'Enhancements', icon: 'fas fa-lightbulb', label: 'Enhancements' },
            { id: 9, title: 'Evaluation', icon: 'fas fa-star', label: 'Evaluation' },
            { id: 10, title: 'Automation Regression', icon: 'fas fa-robot', label: 'Regression' },
            { id: 11, title: 'Automation Test Stability', icon: 'fas fa-balance-scale', label: 'Stability' },
            { id: 12, title: 'QA Notes', icon: 'fas fa-sticky-note', label: 'Notes' }
        ]
    },
    'manual': {
        totalSections: 11,
        sections: [
            { id: 0, title: 'General Details', icon: 'fas fa-info-circle', label: 'General' },
            { id: 1, title: 'Test Summary', icon: 'fas fa-chart-bar', label: 'Summary' },
            { id: 2, title: 'Request & Build Info', icon: 'fas fa-clipboard-list', label: 'Build Info' },
            { id: 3, title: 'Team Information', icon: 'fas fa-users', label: 'Team' },
            { id: 4, title: 'User Stories', icon: 'fas fa-user-check', label: 'Stories' },
            { id: 5, title: 'Test Cases', icon: 'fas fa-flask', label: 'Test Cases' },
            { id: 6, title: 'Issues by Priority', icon: 'fas fa-exclamation-triangle', label: 'Priority' },
            { id: 7, title: 'Issues by Status', icon: 'fas fa-tasks', label: 'Status' },
            { id: 8, title: 'Enhancements', icon: 'fas fa-lightbulb', label: 'Enhancements' },
            { id: 9, title: 'Evaluation', icon: 'fas fa-star', label: 'Evaluation' },
            { id: 10, title: 'QA Notes', icon: 'fas fa-sticky-note', label: 'Notes' }
        ]
    },
    'automation': {
        totalSections: 9,
        sections: [
            { id: 0, title: 'General Details', icon: 'fas fa-info-circle', label: 'General' },
            { id: 1, title: 'Test Summary', icon: 'fas fa-chart-bar', label: 'Summary' },
            { id: 2, title: 'Team Information', icon: 'fas fa-users', label: 'Team' },
            { id: 3, title: 'Regression Test Results', icon: 'fas fa-robot', label: 'Regression' },
            { id: 4, title: 'Test Stability', icon: 'fas fa-balance-scale', label: 'Stability' },
            { id: 5, title: 'Covered Services', icon: 'fas fa-cogs', label: 'Services' },
            { id: 6, title: 'Covered Modules', icon: 'fas fa-puzzle-piece', label: 'Modules' },
            { id: 7, title: 'Bugs', icon: 'fas fa-bug', label: 'Bugs' },
            { id: 8, title: 'QA Notes', icon: 'fas fa-sticky-note', label: 'Notes' }
        ]
    },
    'performance': {
        totalSections: 10,
        sections: [
            { id: 0, title: 'General Details', icon: 'fas fa-info-circle', label: 'General' },
            { id: 1, title: 'Project Details', icon: 'fas fa-project-diagram', label: 'Project' },
            { id: 2, title: 'Team Information', icon: 'fas fa-users', label: 'Team' },
            { id: 3, title: 'Test Objective & Scope', icon: 'fas fa-bullseye', label: 'Objective' },
            { id: 4, title: 'Test Details', icon: 'fas fa-cogs', label: 'Details' },
            { id: 5, title: 'Test Summary', icon: 'fas fa-chart-bar', label: 'Summary' },
            { id: 6, title: 'Test Criteria', icon: 'fas fa-check-circle', label: 'Criteria' },
            { id: 7, title: 'Performance Test Scenarios', icon: 'fas fa-tasks', label: 'Scenarios' },
            { id: 8, title: 'HTTP Requests Status', icon: 'fas fa-server', label: 'HTTP' },
            { id: 9, title: 'QA Notes', icon: 'fas fa-sticky-note', label: 'Notes' }
        ]
    }
};

// Determine report type from URL or default to sprint
function getCurrentReportType() {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/sprint-report')) {
        return 'sprint';
    } else if (currentPath.includes('/manual-report')) {
        return 'manual';
    } else if (currentPath.includes('/automation-report')) {
        return 'automation';
    } else if (currentPath.includes('/performance-report')) {
        return 'performance';
    }
    return 'sprint'; // default
}

// Get the current report configuration
function getCurrentReportConfig() {
    const reportType = getCurrentReportType();
    return REPORT_TYPE_CONFIGS[reportType] || REPORT_TYPE_CONFIGS['sprint'];
}

// Update progress bar based on report type
function updateProgressBarForReportType() {
    const config = getCurrentReportConfig();
    const totalSections = config.totalSections;
    const sections = config.sections;
    
    // Get current section (try window.currentSection first, then fallback)
    const currentSectionIndex = window.currentSection || (typeof currentSection !== 'undefined' ? currentSection : 0);
    
    // Calculate progress
    const completedSections = currentSectionIndex;
    const currentStepNumber = currentSectionIndex + 1;
    const percentage = (completedSections / totalSections) * 100;

    // Update progress percentage and fill
    const progressPercent = document.getElementById('progressPercent');
    const progressFill = document.getElementById('progressFill');
    const progressStep = document.getElementById('progressStep');
    const progressTitle = document.getElementById('progressTitle');

    if (progressPercent) progressPercent.textContent = `${Math.round(percentage)}%`;
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressStep) progressStep.textContent = `Step ${currentStepNumber} of ${totalSections}`;
    if (progressTitle) progressTitle.textContent = sections[currentSectionIndex]?.title || 'Unknown Section';

    // Update step indicators
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index >= sections.length) {
            // Hide steps that don't exist for this report type
            step.style.display = 'none';
            return;
        }
        
        // Show the step
        step.style.display = '';
        
        step.classList.remove('active', 'completed');

        if (index === currentSectionIndex) {
            step.classList.add('active');
        } else if (index < currentSectionIndex) {
            step.classList.add('completed');
            // Change icon to checkmark for completed steps
            const icon = step.querySelector('.step-circle i');
            if (icon && !icon.classList.contains('fa-check')) {
                icon.className = 'fas fa-check';
            }
        } else {
            // For future steps, ensure they have the correct icon
            const icon = step.querySelector('.step-circle i');
            const sectionConfig = sections[index];
            if (icon && sectionConfig) {
                // Only reset icon if it's currently a checkmark (from previous completion)
                if (icon.classList.contains('fa-check')) {
                    icon.className = sectionConfig.icon;
                }
            }
        }
        
        // Update step label
        const label = step.querySelector('.step-label');
        if (label && sections[index]) {
            label.textContent = sections[index].label;
        }
    });
}

// Update navigation buttons based on report type
function updateNavigationButtonsForReportType() {
    const config = getCurrentReportConfig();
    const maxSectionIndex = config.totalSections - 1;
    
    // Get current section (try window.currentSection first, then fallback)
    const currentSectionIndex = window.currentSection || (typeof currentSection !== 'undefined' ? currentSection : 0);
    
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (prevBtn) prevBtn.disabled = currentSectionIndex === 0;
    
    const isLastSection = currentSectionIndex === maxSectionIndex;
    if (nextBtn) nextBtn.style.display = isLastSection ? 'none' : 'inline-block';
    if (submitBtn) submitBtn.style.display = isLastSection ? 'inline-block' : 'none';
}

// Update sidebar navigation based on report type
function updateSidebarNavigationForReportType() {
    const config = getCurrentReportConfig();
    const sidebar = document.getElementById('sidebar');
    
    if (!sidebar) return;
    
    // Remove existing nav items (except header)
    const existingNavItems = sidebar.querySelectorAll('.nav-item');
    existingNavItems.forEach(item => item.remove());
    
    // Get current section (try window.currentSection first, then fallback)
    const currentSectionIndex = window.currentSection || (typeof currentSection !== 'undefined' ? currentSection : 0);
    
    // Add nav items for current report type
    config.sections.forEach((section, index) => {
        const navItem = document.createElement('a');
        navItem.href = '#';
        navItem.className = 'nav-item';
        if (index === currentSectionIndex) {
            navItem.classList.add('active');
        }
        navItem.onclick = () => showSection(index);
        navItem.innerHTML = `<i class="${section.icon}"></i> ${section.title}`;
        
        sidebar.appendChild(navItem);
    });
}

// Navigation functions that work with any report type
function nextSectionForReportType() {
    const config = getCurrentReportConfig();
    const maxSectionIndex = config.totalSections - 1;
    
    // Get current section (try window.currentSection first, then fallback)
    const currentSectionIndex = window.currentSection || (typeof currentSection !== 'undefined' ? currentSection : 0);
    
    if (currentSectionIndex < maxSectionIndex) {
        showSection(currentSectionIndex + 1);
    }
}

function previousSectionForReportType() {
    // Get current section (try window.currentSection first, then fallback)
    const currentSectionIndex = window.currentSection || (typeof currentSection !== 'undefined' ? currentSection : 0);
    
    if (currentSectionIndex > 0) {
        showSection(currentSectionIndex - 1);
    }
}

// Initialize progress steps with click functionality
function initializeProgressStepsForReportType() {
    document.querySelectorAll('.step').forEach((step, index) => {
        step.addEventListener('click', () => {
            const config = getCurrentReportConfig();
            if (index < config.totalSections) {
                showSection(index);
            }
        });
    });
}

// Show section function that works with any report type
function showSectionForReportType(sectionIndex) {
    const config = getCurrentReportConfig();
    
    // Validate section index
    if (sectionIndex < 0 || sectionIndex >= config.totalSections) {
        return;
    }
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    
    // Show target section
    const targetSection = document.getElementById(`section-${sectionIndex}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update sidebar navigation
    document.querySelectorAll('#sidebar .nav-item').forEach((item, index) => {
        item.classList.toggle('active', index === sectionIndex);
    });

    // Update current section (make sure it's global)
    window.currentSection = sectionIndex;
    if (typeof currentSection !== 'undefined') {
        currentSection = sectionIndex;
    }
    
    // Update all navigation components
    updateProgressBarForReportType();
    updateNavigationButtonsForReportType();
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Initialize the navigation system for the current report type
function initializeReportTypeNavigation() {
    console.log('Initializing report type navigation for:', getCurrentReportType());
    
    // Update sidebar for current report type
    updateSidebarNavigationForReportType();
    
    // Initialize progress steps
    initializeProgressStepsForReportType();
    
    // Update initial state
    if (typeof currentSection !== 'undefined') {
        updateProgressBarForReportType();
        updateNavigationButtonsForReportType();
    }
    
    // Ensure current section is 0 if not set
    if (typeof window.currentSection === 'undefined') {
        window.currentSection = 0;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure other scripts have loaded
    setTimeout(initializeReportTypeNavigation, 100);
});

// Export functions for global use
window.updateProgressBarForReportType = updateProgressBarForReportType;
window.updateNavigationButtonsForReportType = updateNavigationButtonsForReportType;
window.updateSidebarNavigationForReportType = updateSidebarNavigationForReportType;
window.nextSectionForReportType = nextSectionForReportType;
window.previousSectionForReportType = previousSectionForReportType;
window.showSectionForReportType = showSectionForReportType;
window.initializeProgressStepsForReportType = initializeProgressStepsForReportType;
window.getCurrentReportType = getCurrentReportType;
window.getCurrentReportConfig = getCurrentReportConfig;
window.initializeReportTypeNavigation = initializeReportTypeNavigation;