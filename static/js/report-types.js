// static/js/report-types.js
// Report Type Configuration and Management

// Function to manage required attributes based on report type
function updateRequiredFieldsForReportType(reportType) {
    // Remove required from all report-type-specific fields first
    const allTypeSpecificFields = [
        'autoReportDate', 'autoEnvironment', 'autoSprintNumber', 'autoCycleNumber', 'autoReleaseNumber',
        'perfReportDate', 'perfEnvironment', 'perfSprintNumber', 'perfCycleNumber', 'perfReleaseNumber'
    ];
    
    allTypeSpecificFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.removeAttribute('required');
        }
    });
    
    // Add required attribute only to fields for the current report type
    if (reportType === 'automation') {
        const requiredAutoFields = ['autoReportDate', 'autoEnvironment'];
        requiredAutoFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.setAttribute('required', 'required');
            }
        });
    } else if (reportType === 'performance') {
        const requiredPerfFields = ['perfReportDate', 'perfEnvironment'];
        requiredPerfFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.setAttribute('required', 'required');
            }
        });
    }
    // For sprint and manual, the default fields (reportDate, environment) are already required
}

// Function to ensure Sprint Reports maintain full backward compatibility
function ensureSprintReportCompatibility() {
    console.log('Ensuring Sprint Report backward compatibility...');

    // Show only sprint navigation group
    const sprintNavGroup = document.querySelector('.sprint-nav-group');
    if (sprintNavGroup) {
        sprintNavGroup.style.display = 'block';
    }

    // Set active state for first sprint nav item
    const sprintNavItems = document.querySelectorAll('.sprint-nav');
    sprintNavItems.forEach((item, index) => {
        if (index === 0) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update progress bar for sprint report (10 sections)
    updateProgressBarForReportType('sprint', 10);

    // Update Testing Metrics for Sprint Report
    updateTestingMetricsForReportType('sprint');

    // Set report date
    const reportDateField = document.getElementById('reportDate');
    if (reportDateField && !reportDateField.value) {
        reportDateField.value = getCurrentDate();
    }

    // Hide all sections first, then show the first section
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });

    // Show the first section
    setTimeout(() => showSection(0), 100);

    console.log('✅ Sprint Report compatibility ensured');
    
    // Update required fields for sprint report type
    updateRequiredFieldsForReportType('sprint');
}

// Function to configure Manual Reports (all sections except Automation Regression)
function configureManualReport() {
    console.log('Configuring Manual Report...');

    // Show only manual navigation group
    const manualNavGroup = document.querySelector('.manual-nav-group');
    if (manualNavGroup) {
        manualNavGroup.style.display = 'block';
    }

    // Set active state for first manual nav item
    const manualNavItems = document.querySelectorAll('.manual-nav');
    manualNavItems.forEach((item, index) => {
        if (index === 0) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update progress bar for manual report (9 sections)
    updateProgressBarForReportType('manual', 9);

    // Update Testing Metrics for Manual Report
    updateTestingMetricsForReportType('manual');

    // Set report date
    const reportDateField = document.getElementById('reportDate');
    if (reportDateField && !reportDateField.value) {
        reportDateField.value = getCurrentDate();
    }

    // Hide all sections first, then show the first section
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });

    // Show the first section
    setTimeout(() => showSection(0), 100);

    console.log('✅ Manual Report configured (9 sections, excluding Automation Regression)');
    
    // Update required fields for manual report type
    updateRequiredFieldsForReportType('manual');
}

// Function to configure Automation Reports
function configureAutomationReport() {
    console.log('Configuring Automation Report...');

    // Show only automation navigation items and keep them visible
    const automationNavItems = document.querySelectorAll('.automation-nav');
    automationNavItems.forEach((item, index) => {
        item.style.display = 'block';
        item.style.visibility = 'visible';
        // Set first item as active
        if (index === 0) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update progress bar for automation report (8 sections)
    updateProgressBarForReportType('automation', 8);

    // Update Testing Metrics for Automation Report
    updateTestingMetricsForReportType('automation');

    // Set report date for automation report
    const reportDateField = document.getElementById('reportDate');
    const autoReportDateField = document.getElementById('autoReportDate');
    if (reportDateField && !reportDateField.value) {
        reportDateField.value = getCurrentDate();
    }
    if (autoReportDateField && !autoReportDateField.value) {
        autoReportDateField.value = getCurrentDate();
    }

    // Hide all sections first, then show the first section
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });

    // Show the first section
    setTimeout(() => showSection(0), 100);

    console.log('✅ Automation Report configured (8 sections with renamed and new sections)');
    
    // Update required fields for automation report type
    updateRequiredFieldsForReportType('automation');
}

// Function to configure Performance Reports
function configurePerformanceReport() {
    console.log('Configuring Performance Report...');

    // Show only performance navigation items
    const performanceNavItems = document.querySelectorAll('.performance-nav');
    performanceNavItems.forEach((item, index) => {
        item.style.display = 'block';
        // Set first item as active
        if (index === 0) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update progress bar for performance report (6 sections)
    updateProgressBarForReportType('performance', 6);

    // Set report date for performance report
    const reportDateField = document.getElementById('reportDate');
    const perfReportDateField = document.getElementById('perfReportDate');
    if (reportDateField && !reportDateField.value) {
        reportDateField.value = getCurrentDate();
    }
    if (perfReportDateField && !perfReportDateField.value) {
        perfReportDateField.value = getCurrentDate();
    }

    // Hide all sections first, then show the first section
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });

    // Show the first section
    setTimeout(() => showSection(0), 100);

    console.log('✅ Performance Report configured (6 sections with performance-specific content)');
    
    // Update required fields for performance report type
    updateRequiredFieldsForReportType('performance');
}

// Function to update Additional Information section for Automation Reports
function updateAutomationAdditionalInfo() {
    const additionalInfoSection = document.getElementById('section-2');
    if (!additionalInfoSection) return;

    // Hide Request Information and Build Information for Automation Reports
    const requestCard = additionalInfoSection.querySelector('.info-card-v2:has([onclick="showRequestModal()"])');
    const buildCard = additionalInfoSection.querySelector('.info-card-v2:has([onclick="showBuildModal()"])');

    if (requestCard) requestCard.style.display = 'none';
    if (buildCard) buildCard.style.display = 'none';

    // Keep only Tester(s) Information and Team Members
    const testerCard = additionalInfoSection.querySelector('.info-card-v2:has([onclick="showTesterModal()"])');
    const teamMemberCard = additionalInfoSection.querySelector('.info-card-v2:has([onclick="showTeamMemberModal()"])');

    if (testerCard) testerCard.style.display = 'block';
    if (teamMemberCard) teamMemberCard.style.display = 'block';
}

// Function to update Testing Metrics based on report type
function updateTestingMetricsForReportType(reportType) {
    const metricsTable = document.querySelector('#section-1 .data-table tbody');
    if (!metricsTable) return;

    let metricsHTML = '';

    if (reportType === 'sprint') {
        // Sprint Report - Show all metrics
        metricsHTML = `
            <tr>
                <td><strong><i class="fas fa-user-check"></i> User Stories</strong><br><small>Auto-calculated from section 4</small></td>
                <td><input type="number" id="userStoriesMetric" name="userStoriesMetric" readonly class="readonly-field"></td>
                <td><small>Sum of all user story statuses</small></td>
            </tr>
            <tr>
                <td><strong><i class="fas fa-flask"></i> Test Cases</strong><br><small>Auto-calculated from section 5</small></td>
                <td><input type="number" id="testCasesMetric" name="testCasesMetric" readonly class="readonly-field"></td>
                <td><small>Sum of all test case statuses</small></td>
            </tr>
            <tr>
                <td><strong><i class="fas fa-bug"></i> Issues</strong><br><small>Auto-calculated from section 6</small></td>
                <td><input type="number" id="issuesMetric" name="issuesMetric" readonly class="readonly-field"></td>
                <td><small>Sum of all issue priorities</small></td>
            </tr>
            <tr>
                <td><strong><i class="fas fa-bolt"></i> Enhancements</strong><br><small>Auto-calculated from section 6</small></td>
                <td><input type="number" id="enhancementsMetric" name="enhancementsMetric" readonly class="readonly-field"></td>
                <td><small>Sum of all enhancement statuses</small></td>
            </tr>
            <tr>
                <td><strong><i class="fas fa-chart-bar"></i> QA Notes Count</strong><br><small>Auto-calculated from section 8</small></td>
                <td><input type="number" name="qaNotesMetric" id="qaNotesMetric" min="0" placeholder="0" readonly class="readonly-field"></td>
                <td><small>Number of QA notes</small></td>
            </tr>
        `;
    } else if (reportType === 'manual') {
        // Manual Report - Show all metrics except automation
        metricsHTML = `
            <tr>
                <td><strong><i class="fas fa-user-check"></i> User Stories</strong><br><small>Auto-calculated from section 4</small></td>
                <td><input type="number" id="userStoriesMetric" name="userStoriesMetric" readonly class="readonly-field"></td>
                <td><small>Sum of all user story statuses</small></td>
            </tr>
            <tr>
                <td><strong><i class="fas fa-flask"></i> Test Cases</strong><br><small>Auto-calculated from section 5</small></td>
                <td><input type="number" id="testCasesMetric" name="testCasesMetric" readonly class="readonly-field"></td>
                <td><small>Sum of all test case statuses</small></td>
            </tr>
            <tr>
                <td><strong><i class="fas fa-bug"></i> Issues</strong><br><small>Auto-calculated from section 6</small></td>
                <td><input type="number" id="issuesMetric" name="issuesMetric" readonly class="readonly-field"></td>
                <td><small>Sum of all issue priorities</small></td>
            </tr>
            <tr>
                <td><strong><i class="fas fa-bolt"></i> Enhancements</strong><br><small>Auto-calculated from section 6</small></td>
                <td><input type="number" id="enhancementsMetric" name="enhancementsMetric" readonly class="readonly-field"></td>
                <td><small>Sum of all enhancement statuses</small></td>
            </tr>
            <tr>
                <td><strong><i class="fas fa-chart-bar"></i> QA Notes Count</strong><br><small>Auto-calculated from section 8</small></td>
                <td><input type="number" name="qaNotesMetric" id="qaNotesMetric" min="0" placeholder="0" readonly class="readonly-field"></td>
                <td><small>Number of QA notes</small></td>
            </tr>
        `;
    } else if (reportType === 'automation') {
        // Automation Report - Hide Testing Metrics section completely
        const metricsCard = document.querySelector('#section-a1 .metrics-table-card');
        if (metricsCard) {
            metricsCard.style.display = 'none';
        }
        return; // Don't populate metrics table
    } else if (reportType === 'performance') {
        // Performance Report - Hide Testing Metrics section completely  
        const metricsCard = document.querySelector('#section-p1 .metrics-table-card');
        if (metricsCard) {
            metricsCard.style.display = 'none';
        }
        return; // Don't populate metrics table
    }

    metricsTable.innerHTML = metricsHTML;
}

// Function to update report title based on report type
function updateReportTitle() {
    const formTitle = document.getElementById('formTitle');
    if (formTitle) {
        let title = 'Create Report';
        switch (window.currentReportType || currentReportType) {
            case 'sprint':
                title = 'Sprint Report';
                break;
            case 'manual':
                title = 'Manual Report';
                break;
            case 'automation':
                title = 'Automation Report';
                break;
            case 'performance':
                title = 'Performance Report';
                break;
        }
        formTitle.textContent = title;
        document.title = title + ' - QA Reports System';
    }
}

// Function to update progress bar for different report types
function updateProgressBarForReportType(reportType, totalSections) {
    const progressSteps = document.querySelector('.progress-steps');
    if (!progressSteps) {
        console.error('Progress steps element not found!');
        return;
    }

    // Clear existing steps
    progressSteps.innerHTML = '';

    let stepConfigs = [];

    if (reportType === 'sprint') {
        stepConfigs = [
            { step: 0, icon: 'fas fa-info-circle', label: 'General' },
            { step: 1, icon: 'fas fa-chart-bar', label: 'Summary' },
            { step: 2, icon: 'fas fa-plus-square', label: 'Additional' },
            { step: 3, icon: 'fas fa-user-check', label: 'Stories' },
            { step: 4, icon: 'fas fa-vial', label: 'Tests' },
            { step: 5, icon: 'fas fa-bug', label: 'Issues' },
            { step: 6, icon: 'fas fa-bolt', label: 'Enhance' },
            { step: 7, icon: 'fas fa-robot', label: 'Auto' },
            { step: 8, icon: 'fas fa-star', label: 'Eval' },
            { step: 9, icon: 'fas fa-note-sticky', label: 'Notes' }
        ];
    } else if (reportType === 'manual') {
        stepConfigs = [
            { step: 0, icon: 'fas fa-info-circle', label: 'General' },
            { step: 1, icon: 'fas fa-chart-bar', label: 'Summary' },
            { step: 2, icon: 'fas fa-plus-square', label: 'Additional' },
            { step: 3, icon: 'fas fa-user-check', label: 'Stories' },
            { step: 4, icon: 'fas fa-vial', label: 'Tests' },
            { step: 5, icon: 'fas fa-bug', label: 'Issues' },
            { step: 6, icon: 'fas fa-bolt', label: 'Enhance' },
            { step: 7, icon: 'fas fa-star', label: 'Eval' },
            { step: 8, icon: 'fas fa-note-sticky', label: 'Notes' }
        ];
    } else if (reportType === 'automation') {
        stepConfigs = [
            { step: 0, icon: 'fas fa-info-circle', label: 'General' },
            { step: 1, icon: 'fas fa-chart-bar', label: 'Summary' },
            { step: 2, icon: 'fas fa-plus-square', label: 'Additional' },
            { step: 3, icon: 'fas fa-robot', label: 'Regression' },
            { step: 4, icon: 'fas fa-note-sticky', label: 'Notes' },
            { step: 5, icon: 'fas fa-server', label: 'Services' },
            { step: 6, icon: 'fas fa-puzzle-piece', label: 'Modules' },
            { step: 7, icon: 'fas fa-bug', label: 'Bugs' }
        ];
    } else if (reportType === 'performance') {
        stepConfigs = [
            { step: 0, icon: 'fas fa-info-circle', label: 'General' },
            { step: 1, icon: 'fas fa-tachometer-alt', label: 'Summary' },
            { step: 2, icon: 'fas fa-chart-line', label: 'Response' },
            { step: 3, icon: 'fas fa-table', label: 'Criteria' },
            { step: 4, icon: 'fas fa-play-circle', label: 'Scenarios' },
            { step: 5, icon: 'fas fa-network-wired', label: 'Requests' }
        ];
    }

    // Create step elements
    stepConfigs.forEach((config, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = `step ${index === 0 ? 'active' : ''}`;
        stepDiv.setAttribute('data-step', config.step);
        stepDiv.style.cursor = 'pointer';
        stepDiv.onclick = () => showSection(config.step);

        stepDiv.innerHTML = `
            <div class="step-circle">
                <i class="${config.icon}"></i>
            </div>
            <span class="step-label">${config.label}</span>
        `;

        progressSteps.appendChild(stepDiv);
    });

    // Update progress text
    const progressStep = document.getElementById('progressStep');
    const progressTitle = document.getElementById('progressTitle');
    if (progressStep) progressStep.textContent = `Step 1 of ${totalSections}`;
    if (progressTitle) progressTitle.textContent = stepConfigs[0] ? stepConfigs[0].label : 'General';
}

// Report Type Selector Function
function changeReportType(newType) {
    console.log('Changing report type to:', newType);
    const currentType = window.currentReportType || 'sprint';

    if (newType !== currentType) {
        // Save current form data before switching
        if (typeof saveFormDataToLocalStorage === 'function') {
            saveFormDataToLocalStorage();
        }

        // Update the global report type
        window.currentReportType = newType;
        currentReportType = newType;

        // Update the report title
        updateReportTitle();

        // Hide all navigation groups first
        const allNavGroups = document.querySelectorAll('.nav-group');
        allNavGroups.forEach(group => {
            group.style.display = 'none';
        });

        // Hide all individual nav items (for automation and performance)
        const allNavItems = document.querySelectorAll('#sidebar .nav-item');
        allNavItems.forEach(item => {
            if (!item.closest('.nav-group')) {
                item.style.display = 'none';
            }
        });

        // Configure the form for the new report type
        if (newType === 'sprint') {
            ensureSprintReportCompatibility();
        } else if (newType === 'manual') {
            configureManualReport();
        } else if (newType === 'performance') {
            configurePerformanceReport();
        } else if (newType === 'automation') {
            configureAutomationReport();
        }

        // Show a toast notification
        if (typeof showToast === 'function') {
            showToast(`Switched to ${newType.charAt(0).toUpperCase() + newType.slice(1)} Report`, 'success');
        }
    }
}

// Make functions globally accessible
window.updateRequiredFieldsForReportType = updateRequiredFieldsForReportType;
window.ensureSprintReportCompatibility = ensureSprintReportCompatibility;
window.configureManualReport = configureManualReport;
window.configureAutomationReport = configureAutomationReport;
window.configurePerformanceReport = configurePerformanceReport;
window.updateAutomationAdditionalInfo = updateAutomationAdditionalInfo;
window.updateTestingMetricsForReportType = updateTestingMetricsForReportType;
window.updateReportTitle = updateReportTitle;
window.updateProgressBarForReportType = updateProgressBarForReportType;
window.changeReportType = changeReportType;