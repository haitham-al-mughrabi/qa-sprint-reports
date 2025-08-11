// User stories

export function calculatePercentages() {
    const total = calculateUserStoryTotal();
    const values = {
        passed: parseInt(document.getElementById('passedStories')?.value, 10) || 0,
        passedWithIssues: parseInt(document.getElementById('passedWithIssuesStories')?.value, 10) || 0,
        failed: parseInt(document.getElementById('failedStories')?.value, 10) || 0,
        blocked: parseInt(document.getElementById('blockedStories')?.value, 10) || 0,
        cancelled: parseInt(document.getElementById('cancelledStories')?.value, 10) || 0,
        deferred: parseInt(document.getElementById('deferredStories')?.value, 10) || 0,
        notTestable: parseInt(document.getElementById('notTestableStories')?.value, 10) || 0,
    };

    const totalStoriesEl = document.getElementById('totalStories');
    if (totalStoriesEl) totalStoriesEl.value = total;

    const userStoriesMetricEl = document.getElementById('userStoriesMetric');
    if (userStoriesMetricEl) userStoriesMetricEl.value = total;

    Object.keys(values).forEach(key => {
        const percentageElement = document.getElementById(`${key}Percentage`);
        if (percentageElement) {
            percentageElement.textContent = total > 0
                ? `${Math.round((values[key] / total) * 100)}%`
                : '0%';
        }
    });

    updateChart(userStoriesChart, Object.values(values));
}

export function calculateUserStoryTotal() {
    const fields = [
        'passedStories',
        'passedWithIssuesStories',
        'failedStories',
        'blockedStories',
        'cancelledStories',
        'deferredStories',
        'notTestableStories'
    ];
    return fields.reduce((sum, field) => sum + (parseInt(document.getElementById(field)?.value, 10) || 0), 0);
}

// Test cases

export function calculateTestCasesPercentages() {
    const total = calculateTestCasesTotal();

    const totalField = document.getElementById('totalTestCases');
    if (totalField) {
        totalField.removeAttribute('placeholder');
        totalField.value = total;
        totalField.setAttribute('value', String(total));
        totalField.defaultValue = String(total);
        totalField.style.display = 'none';
        totalField.offsetHeight; // Force reflow
        totalField.style.display = '';
        totalField.setAttribute('data-calculated-value', String(total));
        console.log('Total field updated:', totalField.value, 'Calculated:', total);
    }

    const values = {
        passed: parseInt(document.getElementById('passedTestCases')?.value, 10) || 0,
        passedWithIssues: parseInt(document.getElementById('passedWithIssuesTestCases')?.value, 10) || 0,
        failed: parseInt(document.getElementById('failedTestCases')?.value, 10) || 0,
        blocked: parseInt(document.getElementById('blockedTestCases')?.value, 10) || 0,
        cancelled: parseInt(document.getElementById('cancelledTestCases')?.value, 10) || 0,
        deferred: parseInt(document.getElementById('deferredTestCases')?.value, 10) || 0,
        notTestable: parseInt(document.getElementById('notTestableTestCases')?.value, 10) || 0,
    };

    const metricField = document.getElementById('testCasesMetric');
    if (metricField) {
        metricField.value = total;
    }

    Object.keys(values).forEach(key => {
        const percentageElement = document.getElementById(`${key}TestCasesPercentage`);
        if (percentageElement) {
            percentageElement.textContent = total > 0
                ? `${Math.round((values[key] / total) * 100)}%`
                : '0%';
        }
    });

    updateChart(testCasesChart, Object.values(values));
}

export function calculateTestCasesTotal() {
    const fields = [
        'passedTestCases',
        'passedWithIssuesTestCases',
        'failedTestCases',
        'blockedTestCases',
        'cancelledTestCases',
        'deferredTestCases',
        'notTestableTestCases'
    ];
    return fields.reduce((sum, field) => sum + (parseInt(document.getElementById(field)?.value, 10) || 0), 0);
}

// Issues (priority)

export function calculateIssuesPercentages() {
    const total = calculateIssuesTotal();
    const priorityValues = {
        critical: parseInt(document.getElementById('criticalIssues')?.value, 10) || 0,
        high: parseInt(document.getElementById('highIssues')?.value, 10) || 0,
        medium: parseInt(document.getElementById('mediumIssues')?.value, 10) || 0,
        low: parseInt(document.getElementById('lowIssues')?.value, 10) || 0,
    };

    const totalIssuesEl = document.getElementById('totalIssues');
    if (totalIssuesEl) totalIssuesEl.value = total;

    const issuesMetricEl = document.getElementById('issuesMetric');
    if (issuesMetricEl) issuesMetricEl.value = total;

    Object.keys(priorityValues).forEach(key => {
        const percentageElement = document.getElementById(`${key}IssuesPercentage`);
        if (percentageElement) {
            percentageElement.textContent = total > 0
                ? `${Math.round((priorityValues[key] / total) * 100)}%`
                : '0%';
        }
    });

    updateChart(issuesPriorityChart, Object.values(priorityValues));
    calculateIssuesStatusPercentages();
}

export function calculateIssuesTotal() {
    const fields = ['criticalIssues', 'highIssues', 'mediumIssues', 'lowIssues'];
    return fields.reduce((sum, field) => sum + (parseInt(document.getElementById(field)?.value, 10) || 0), 0);
}

// Issues (status)

export function calculateIssuesStatusTotal() {
    const statusFields = ['newIssues', 'fixedIssues', 'notFixedIssues', 'reopenedIssues', 'deferredIssues'];
    return statusFields.reduce((sum, field) => sum + (parseInt(document.getElementById(field)?.value, 10) || 0), 0);
}

export function calculateIssuesStatusPercentages() {
    const total = calculateIssuesStatusTotal();
    const statusValues = {
        new: parseInt(document.getElementById('newIssues')?.value, 10) || 0,
        fixed: parseInt(document.getElementById('fixedIssues')?.value, 10) || 0,
        notFixed: parseInt(document.getElementById('notFixedIssues')?.value, 10) || 0,
        reopened: parseInt(document.getElementById('reopenedIssues')?.value, 10) || 0,
        deferred: parseInt(document.getElementById('deferredIssues')?.value, 10) || 0,
    };

    const totalIssuesByStatusElement = document.getElementById('totalIssuesByStatus');
    if (totalIssuesByStatusElement) {
        totalIssuesByStatusElement.value = total;
    }

    Object.keys(statusValues).forEach(key => {
        const percentageElement = document.getElementById(`${key}IssuesPercentage`);
        if (percentageElement) {
            percentageElement.textContent = total > 0
                ? `${Math.round((statusValues[key] / total) * 100)}%`
                : '0%';
        }
    });

    updateChart(issuesStatusChart, Object.values(statusValues));
}

// Enhancements

export function calculateEnhancementsPercentages() {
    const total = calculateEnhancementsTotal();
    const values = {
        new: parseInt(document.getElementById('newEnhancements')?.value, 10) || 0,
        implemented: parseInt(document.getElementById('implementedEnhancements')?.value, 10) || 0,
        exists: parseInt(document.getElementById('existsEnhancements')?.value, 10) || 0,
    };

    const totalEnhancementsEl = document.getElementById('totalEnhancements');
    if (totalEnhancementsEl) totalEnhancementsEl.value = total;

    const enhancementsMetricEl = document.getElementById('enhancementsMetric');
    if (enhancementsMetricEl) enhancementsMetricEl.value = total;

    Object.keys(values).forEach(key => {
        const percentageElement = document.getElementById(`${key}EnhancementsPercentage`);
        if (percentageElement) {
            percentageElement.textContent = total > 0
                ? `${Math.round((values[key] / total) * 100)}%`
                : '0%';
        }
    });

    updateChart(enhancementsChart, Object.values(values));
}

export function calculateEnhancementsTotal() {
    const fields = ['newEnhancements', 'implementedEnhancements', 'existsEnhancements'];
    return fields.reduce((sum, field) => sum + (parseInt(document.getElementById(field)?.value, 10) || 0), 0);
}

// Automation

export function calculateAutomationTotal() {
    const passed = parseInt(document.getElementById('automationPassedTestCases')?.value, 10) || 0;
    const failed = parseInt(document.getElementById('automationFailedTestCases')?.value, 10) || 0;
    const skipped = parseInt(document.getElementById('automationSkippedTestCases')?.value, 10) || 0;
    return passed + failed + skipped;
}

export function calculateAutomationStabilityTotal() {
    const stable = parseInt(document.getElementById('automationStableTests')?.value, 10) || 0;
    const flaky = parseInt(document.getElementById('automationFlakyTests')?.value, 10) || 0;
    return stable + flaky;
}

export function calculateAutomationPercentages() {
    const total = calculateAutomationTotal();
    const values = {
        passed: parseInt(document.getElementById('automationPassedTestCases')?.value, 10) || 0,
        failed: parseInt(document.getElementById('automationFailedTestCases')?.value, 10) || 0,
        skipped: parseInt(document.getElementById('automationSkippedTestCases')?.value, 10) || 0,
    };

    document.getElementById('automationTotalTestCases').value = total;

    Object.keys(values).forEach(key => {
        const percentage = total > 0 ? Math.round((values[key] / total) * 100) : 0;

        const percentageElement = document.getElementById(`automation${key.charAt(0).toUpperCase() + key.slice(1)}Percentage`);
        if (percentageElement) {
            percentageElement.textContent = `${percentage}%`;
        }

        const percentageDisplayElement = document.getElementById(`automation${key.charAt(0).toUpperCase() + key.slice(1)}PercentageDisplay`);
        if (percentageDisplayElement) {
            percentageDisplayElement.value = percentage;
        }
    });

    if (automationTestCasesChart) {
        updateChart(automationTestCasesChart, Object.values(values));
    }

    if (automationPercentageChart) {
        updateChart(automationPercentageChart, Object.values(values));
    }
}

export function calculateAutomationStabilityPercentages() {
    const total = calculateAutomationStabilityTotal();
    const values = {
        stable: parseInt(document.getElementById('automationStableTests')?.value, 10) || 0,
        flaky: parseInt(document.getElementById('automationFlakyTests')?.value, 10) || 0,
    };

    document.getElementById('automationStabilityTotal').value = total;

    Object.keys(values).forEach(key => {
        const percentage = total > 0 ? Math.round((values[key] / total) * 100) : 0;

        const percentageElement = document.getElementById(`automation${key.charAt(0).toUpperCase() + key.slice(1)}Percentage`);
        if (percentageElement) {
            percentageElement.textContent = `${percentage}%`;
        }
    });

    if (automationStabilityChart) {
        updateChart(automationStabilityChart, Object.values(values));
    }
}
