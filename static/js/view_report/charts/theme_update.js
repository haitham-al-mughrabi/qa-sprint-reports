// Function to update all charts when theme changes
function updateChartsForTheme() {
    if (!currentReport) return;
    
    const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';

    // Destroy existing charts
    Object.values(viewCharts).forEach(chart => {
        if (chart && chart.destroy) {
            chart.destroy();
        }
    });
    
    // Clear the viewCharts object
    viewCharts = {};
    
    // Recreate only the charts (not tables) with new theme colors
    renderUserStoriesChart(currentReport, isLightMode);
    renderTestCasesChart(currentReport, isLightMode);
    renderIssuesPriorityChart(currentReport, isLightMode);
    renderIssuesStatusChart(currentReport, isLightMode);
    renderEnhancementsChart(currentReport, isLightMode);
    renderAutomationTestCasesChart(currentReport, isLightMode);
    renderAutomationStabilityChart(currentReport, isLightMode);
}

// Individual chart rendering functions for theme updates
function renderUserStoriesChart(report, isLightMode) {
    const ctx = document.getElementById('userStoriesViewChart').getContext('2d');
    if (viewCharts.userStories) viewCharts.userStories.destroy();
    
    viewCharts.userStories = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'],
            datasets: [{
                data: [
                    report.passedUserStories || 0,
                    report.passedWithIssuesUserStories || 0,
                    report.failedUserStories || 0,
                    report.blockedUserStories || 0,
                    report.cancelledUserStories || 0,
                    report.deferredUserStories || 0,
                    report.notTestableUserStories || 0
                ],
                backgroundColor: [
                    '#4CAF50', '#FFC107', '#F44336', '#9E9E9E', 
                    '#2196F3', '#673AB7', '#00BCD4'
                ],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getViewChartOptions(isLightMode)
    });
}

function renderTestCasesChart(report, isLightMode) {
    const ctx = document.getElementById('testCasesViewChart').getContext('2d');
    if (viewCharts.testCases) viewCharts.testCases.destroy();
    
    viewCharts.testCases = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'],
            datasets: [{
                data: [
                    report.passedTestCases || 0,
                    report.passedWithIssuesTestCases || 0,
                    report.failedTestCases || 0,
                    report.blockedTestCases || 0,
                    report.cancelledTestCases || 0,
                    report.deferredTestCases || 0,
                    report.notTestableTestCases || 0
                ],
                backgroundColor: [
                    '#8BC34A', '#FFEB3B', '#E91E63', '#607D8B', 
                    '#9C27B0', '#FF5722', '#795548'
                ],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getViewChartOptions(isLightMode)
    });
}

function renderIssuesPriorityChart(report, isLightMode) {
    const priorityCtx = document.getElementById('issuesPriorityViewChart').getContext('2d');
    if (viewCharts.issuesPriority) viewCharts.issuesPriority.destroy();
    
    viewCharts.issuesPriority = new Chart(priorityCtx, {
        type: 'doughnut',
        data: {
            labels: ['Critical', 'High', 'Medium', 'Low'],
            datasets: [{
                data: [
                    report.criticalIssues || 0,
                    report.highIssues || 0,
                    report.mediumIssues || 0,
                    report.lowIssues || 0
                ],
                backgroundColor: [
                    '#F44336', '#FF9800', '#FFC107', '#4CAF50'
                ],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getViewChartOptions(isLightMode)
    });
}

function renderIssuesStatusChart(report, isLightMode) {
    const statusCtx = document.getElementById('issuesStatusViewChart').getContext('2d');
    if (viewCharts.issuesStatus) viewCharts.issuesStatus.destroy();
    
    viewCharts.issuesStatus = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['New', 'Fixed', 'Not Fixed', 'Re-opened', 'Deferred'],
            datasets: [{
                data: [
                    report.newIssues || 0,
                    report.fixedIssues || 0,
                    report.notFixedIssues || 0,
                    report.reopenedIssues || 0,
                    report.deferredIssues || 0
                ],
                backgroundColor: [
                    '#2196F3', '#4CAF50', '#E91E63', '#FF5722', '#673AB7'
                ],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getViewChartOptions(isLightMode)
    });
}

function renderEnhancementsChart(report, isLightMode) {
    const ctx = document.getElementById('enhancementsViewChart').getContext('2d');
    if (viewCharts.enhancements) viewCharts.enhancements.destroy();
    
    viewCharts.enhancements = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['New', 'Implemented', 'Exists'],
            datasets: [{
                data: [
                    report.newEnhancements || 0,
                    report.implementedEnhancements || 0,
                    report.existsEnhancements || 0
                ],
                backgroundColor: [
                    '#00BCD4', '#4CAF50', '#9E9E9E'
                ],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getViewChartOptions(isLightMode)
    });
}

function renderAutomationTestCasesChart(report, isLightMode) {
    const ctx = document.getElementById('automationTestCasesViewChart').getContext('2d');
    if (viewCharts.automationTestCases) viewCharts.automationTestCases.destroy();
    
    viewCharts.automationTestCases = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Passed', 'Failed', 'Skipped'],
            datasets: [{
                data: [
                    report.automationPassedTestCases || 0,
                    report.automationFailedTestCases || 0,
                    report.automationSkippedTestCases || 0
                ],
                backgroundColor: [
                    '#28a745', '#dc3545', '#ffc107'
                ],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getViewChartOptions(isLightMode)
    });
}

function renderAutomationStabilityChart(report, isLightMode) {
    const ctx = document.getElementById('automationStabilityViewChart').getContext('2d');
    if (viewCharts.automationStability) viewCharts.automationStability.destroy();
    
    viewCharts.automationStability = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Stable', 'Flaky'],
            datasets: [{
                data: [
                    report.automationStableTests || 0,
                    report.automationFlakyTests || 0
                ],
                backgroundColor: [
                    '#28a745', '#fd7e14'
                ],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getViewChartOptions(isLightMode)
    });
}