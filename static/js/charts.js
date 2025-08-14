export function initializeCharts() {
    initializeUserStoriesChart();
    initializeTestCasesChart();
    initializeIssuesPriorityChart();
    initializeIssuesStatusChart();
    initializeEnhancementsChart();
    initializeAutomationTestCasesChart();
    initializeAutomationPercentageChart();
    initializeAutomationStabilityChart();
}

export function getChartOptions() {
    const isLightTheme = window.isCurrentThemeLight ? window.isCurrentThemeLight() : true;

    const textColor = isLightTheme ? '#1e293b' : '#f1f5f9';
    const tooltipBg = isLightTheme ? '#ffffff' : '#334155';
    const gridColor = isLightTheme ? '#e2e8f0' : '#334155';

    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 15,
                    usePointStyle: true,
                    font: { size: 11 },
                    color: textColor
                }
            },
            tooltip: {
                titleColor: textColor,
                bodyColor: textColor,
                backgroundColor: tooltipBg,
                borderColor: gridColor,
                borderWidth: 1,
                callbacks: {
                    label: function (context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const value = context.parsed || 0;
                        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                        return `${context.label}: ${value} (${percentage}%)`;
                    }
                }
            }
        }
    };
}

export function initializeDoughnutChart(canvasId, labels, backgroundColors) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return null;

    const isLightTheme = window.isCurrentThemeLight ? window.isCurrentThemeLight() : true;
    const borderColor = isLightTheme ? '#ffffff' : '#1e293b';

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: new Array(labels.length).fill(0),
                backgroundColor: backgroundColors,
                borderWidth: 3,
                borderColor: borderColor
            }]
        },
        options: getChartOptions()
    });
}

// Individual chart setups

export function initializeUserStoriesChart() {
    const labels = ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'];
    const colors = ['#28a745', '#ffc107', '#dc3545', '#6c757d', '#fd7e14', '#6f42c1', '#20c997'];
    if (userStoriesChart) userStoriesChart.destroy();
    userStoriesChart = initializeDoughnutChart('userStoriesChart', labels, colors);
}

export function initializeTestCasesChart() {
    const labels = ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'];
    const colors = ['#28a745', '#ffc107', '#dc3545', '#6c757d', '#fd7e14', '#6f42c1', '#20c997'];
    if (testCasesChart) testCasesChart.destroy();
    testCasesChart = initializeDoughnutChart('testCasesChart', labels, colors);
}

export function initializeIssuesPriorityChart() {
    const labels = ['Critical', 'High', 'Medium', 'Low'];
    const colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745'];
    if (issuesPriorityChart) issuesPriorityChart.destroy();
    issuesPriorityChart = initializeDoughnutChart('issuesPriorityChart', labels, colors);
}

export function initializeIssuesStatusChart() {
    const labels = ['New', 'Fixed', 'Not Fixed', 'Re-opened', 'Deferred'];
    const colors = ['#17a2b8', '#28a745', '#dc3545', '#fd7e14', '#6f42c1'];
    if (issuesStatusChart) issuesStatusChart.destroy();
    issuesStatusChart = initializeDoughnutChart('issuesStatusChart', labels, colors);
}

export function initializeEnhancementsChart() {
    const labels = ['New', 'Implemented', 'Exists'];
    const colors = ['#17a2b8', '#28a745', '#6c757d'];
    if (enhancementsChart) enhancementsChart.destroy();
    enhancementsChart = initializeDoughnutChart('enhancementsChart', labels, colors);
}

export function initializeAutomationTestCasesChart() {
    const labels = ['Passed', 'Failed', 'Skipped'];
    const colors = ['#28a745', '#dc3545', '#ffc107'];
    if (automationTestCasesChart) automationTestCasesChart.destroy();
    automationTestCasesChart = initializeDoughnutChart('automationTestCasesChart', labels, colors);
}

export function initializeAutomationPercentageChart() {
    const labels = ['Passed', 'Failed', 'Skipped'];
    const colors = ['#28a745', '#dc3545', '#ffc107'];
    if (automationPercentageChart) automationPercentageChart.destroy();
    automationPercentageChart = initializeDoughnutChart('automationPercentageChart', labels, colors);
}

export function initializeAutomationStabilityChart() {
    const labels = ['Stable', 'Flaky'];
    const colors = ['#28a745', '#fd7e14'];
    if (automationStabilityChart) automationStabilityChart.destroy();
    automationStabilityChart = initializeDoughnutChart('automationStabilityChart', labels, colors);
}

// Chart updater

export function updateChart(chart, data) {
    if (chart) {
        chart.data.datasets[0].data = data;
        chart.update();
    }
}
