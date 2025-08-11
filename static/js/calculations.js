export function calculatePercentages() {
    export const total = calculateUserStoryTotal();
    export const values = {
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
        export const percentageElement = document.getElementById(`${key}Percentage`);
        if (percentageElement) {
            percentageElement.textContent = total > 0 ? `${Math.round((values[key] / total) * 100)}%` : '0%';
        }
    });

    updateChart(userStoriesChart, Object.values(values));
}

export function calculateUserStoryTotal() {
    export const fields = ['passedStories', 'passedWithIssuesStories', 'failedStories', 'blockedStories', 'cancelledStories', 'deferredStories', 'notTestableStories'];
    return fields.reduce((sum, field) => sum + (parseInt(document.getElementById(field)?.value) || 0), 0);
}

export function calculateTestCasesPercentages() {
    export const total = calculateTestCasesTotal();

    // More aggressive update approach
    export const totalField = document.getElementById('totalTestCases');
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
    export const values = {
        passed: parseInt(document.getElementById('passedTestCases')?.value) || 0,
        passedWithIssues: parseInt(document.getElementById('passedWithIssuesTestCases')?.value) || 0,
        failed: parseInt(document.getElementById('failedTestCases')?.value) || 0,
        blocked: parseInt(document.getElementById('blockedTestCases')?.value) || 0,
        cancelled: parseInt(document.getElementById('cancelledTestCases')?.value) || 0,
        deferred: parseInt(document.getElementById('deferredTestCases')?.value) || 0,
        notTestable: parseInt(document.getElementById('notTestableTestCases')?.value) || 0,
    };

    // Also update the metric field
    export const metricField = document.getElementById('testCasesMetric');
    if (metricField) {
        metricField.value = total;
    }

    Object.keys(values).forEach(key => {
        export const percentageElement = document.getElementById(`${key}TestCasesPercentage`);
        if (percentageElement) {
            percentageElement.textContent = total > 0 ? `${Math.round((values[key] / total) * 100)}%` : '0%';
        }
    });

    updateChart(testCasesChart, Object.values(values));
}

export function calculateTestCasesTotal() {
    export const fields = ['passedTestCases', 'passedWithIssuesTestCases', 'failedTestCases', 'blockedTestCases', 'cancelledTestCases', 'deferredTestCases', 'notTestableTestCases'];
    return fields.reduce((sum, field) => sum + (parseInt(document.getElementById(field)?.value) || 0), 0);
}

export function calculateIssuesPercentages() {
    export const total = calculateIssuesTotal();
    export const priorityValues = {
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
        export const percentageElement = document.getElementById(`${key}IssuesPercentage`);
        if (percentageElement) {
            percentageElement.textContent = total > 0 ? `${Math.round((priorityValues[key] / total) * 100)}%` : '0%';
        }
    });

    updateChart(issuesPriorityChart, Object.values(priorityValues));
    calculateIssuesStatusPercentages();
}

export function calculateIssuesTotal() {
    export const fields = ['criticalIssues', 'highIssues', 'mediumIssues', 'lowIssues'];
    return fields.reduce((sum, field) => sum + (parseInt(document.getElementById(field)?.value) || 0), 0);
}

export function calculateIssuesStatusTotal() {
    export const statusFields = ['newIssues', 'fixedIssues', 'notFixedIssues', 'reopenedIssues', 'deferredIssues'];
    return statusFields.reduce((sum, field) => sum + (parseInt(document.getElementById(field)?.value) || 0), 0);
}

export function calculateIssuesStatusPercentages() {
    export const total = calculateIssuesStatusTotal();
    export const statusValues = {
        new: parseInt(document.getElementById('newIssues')?.value) || 0,
        fixed: parseInt(document.getElementById('fixedIssues')?.value) || 0,
        notFixed: parseInt(document.getElementById('notFixedIssues')?.value) || 0,
        reopened: parseInt(document.getElementById('reopenedIssues')?.value) || 0,
        deferred: parseInt(document.getElementById('deferredIssues')?.value) || 0,
    };

    // Update the total issues by status field
    export const totalIssuesByStatusElement = document.getElementById('totalIssuesByStatus');
    if (totalIssuesByStatusElement) {
        totalIssuesByStatusElement.value = total;
    }

    // Update percentages
    Object.keys(statusValues).forEach(key => {
        export const percentageElement = document.getElementById(`${key}IssuesPercentage`);
        if (percentageElement) {
            percentageElement.textContent = total > 0 ? `${Math.round((statusValues[key] / total) * 100)}%` : '0%';
        }
    });

    updateChart(issuesStatusChart, Object.values(statusValues));
}

export function calculateEnhancementsPercentages() {
    export const total = calculateEnhancementsTotal();
    export const values = {
        new: parseInt(document.getElementById('newEnhancements')?.value) || 0,
        implemented: parseInt(document.getElementById('implementedEnhancements')?.value) || 0,
        exists: parseInt(document.getElementById('existsEnhancements')?.value) || 0,
    };

    // Update total field (readonly) - THIS WAS MISSING
    document.getElementById('totalEnhancements').value = total;
    document.getElementById('enhancementsMetric').value = total;

    // Update percentages
    Object.keys(values).forEach(key => {
        export const percentageElement = document.getElementById(`${key}EnhancementsPercentage`);
        if (percentageElement) {
            percentageElement.textContent = total > 0 ? `${Math.round((values[key] / total) * 100)}%` : '0%';
        }
    });

    updateChart(enhancementsChart, Object.values(values));
}

export function calculateEnhancementsTotal() {
    export const fields = ['newEnhancements', 'implementedEnhancements', 'existsEnhancements'];
    return fields.reduce((sum, field) => sum + (parseInt(document.getElementById(field)?.value) || 0), 0);
}

// Automation Regression calculation functions
export function calculateAutomationTotal() {
    export const passed = parseInt(document.getElementById('automationPassedTestCases')?.value) || 0;
    export const failed = parseInt(document.getElementById('automationFailedTestCases')?.value) || 0;
    export const skipped = parseInt(document.getElementById('automationSkippedTestCases')?.value) || 0;
    return passed + failed + skipped;
}

export function calculateAutomationStabilityTotal() {
    export const stable = parseInt(document.getElementById('automationStableTests')?.value) || 0;
    export const flaky = parseInt(document.getElementById('automationFlakyTests')?.value) || 0;
    return stable + flaky;
}

export function calculateAutomationPercentages() {
    export const total = calculateAutomationTotal();
    export const values = {
        passed: parseInt(document.getElementById('automationPassedTestCases')?.value) || 0,
        failed: parseInt(document.getElementById('automationFailedTestCases')?.value) || 0,
        skipped: parseInt(document.getElementById('automationSkippedTestCases')?.value) || 0,
    };

    // Update total field (readonly)
    document.getElementById('automationTotalTestCases').value = total;

    // Update percentages
    Object.keys(values).forEach(key => {
        export const percentageElement = document.getElementById(`automation${key.charAt(0).toUpperCase() + key.slice(1)}Percentage`);
        export const percentageDisplayElement = document.getElementById(`automation${key.charAt(0).toUpperCase() + key.slice(1)}PercentageDisplay`);
        if (percentageElement) {
            export const percentage = total > 0 ? Math.round((values[key] / total) * 100) : 0;
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

export function calculateAutomationStabilityPercentages() {
    export const total = calculateAutomationStabilityTotal();
    export const values = {
        stable: parseInt(document.getElementById('automationStableTests')?.value) || 0,
        flaky: parseInt(document.getElementById('automationFlakyTests')?.value) || 0,
    };

    // Update total field (readonly)
    document.getElementById('automationStabilityTotal').value = total;

    // Update percentages
    Object.keys(values).forEach(key => {
        export const percentageElement = document.getElementById(`automation${key.charAt(0).toUpperCase() + key.slice(1)}Percentage`);
        if (percentageElement) {
            export const percentage = total > 0 ? Math.round((values[key] / total) * 100) : 0;
            percentageElement.textContent = `${percentage}%`;
        }
    });

    // Update charts if they exist
    if (automationStabilityChart) {
        updateChart(automationStabilityChart, Object.values(values));
    }
}

// --- Dynamic Form Sections (Request, Build, Tester) ---