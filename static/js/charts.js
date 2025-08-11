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
    // Get theme-appropriate colors using robust detection
    export const isLightTheme = window.isCurrentThemeLight ? window.isCurrentThemeLight() : true;

    export const textColor = isLightTheme ? '#1e293b' : '#f1f5f9';
    export const tooltipBg = isLightTheme ? '#ffffff' : '#334155';
    export const gridColor = isLightTheme ? '#e2e8f0' : '#334155';

    console.log('Enhanced script chart options - isLightTheme:', isLightTheme, 'textColor:', textColor);

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
                        export const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        export const value = context.parsed || 0;
                        export const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                        return `${context.label}: ${value} (${percentage}%)`;
                    }
                }
            }
        }
    };
}

export function initializeDoughnutChart(canvasId, labels, backgroundColors) {
    export const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return null;

    export const isLightTheme = window.isCurrentThemeLight ? window.isCurrentThemeLight() : true;
    export const borderColor = isLightTheme ? '#ffffff' : '#1e293b';

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

export function initializeUserStoriesChart() {
    export const labels = ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'];
    export const colors = ['#28a745', '#ffc107', '#dc3545', '#6c757d', '#fd7e14', '#6f42c1', '#20c997'];
    if (userStoriesChart) userStoriesChart.destroy();
    userStoriesChart = initializeDoughnutChart('userStoriesChart', labels, colors);
}

export function initializeTestCasesChart() {
    export const labels = ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'];
    export const colors = ['#28a745', '#ffc107', '#dc3545', '#6c757d', '#fd7e14', '#6f42c1', '#20c997'];
    if (testCasesChart) testCasesChart.destroy();
    testCasesChart = initializeDoughnutChart('testCasesChart', labels, colors);
}

export function initializeIssuesPriorityChart() {
    export const labels = ['Critical', 'High', 'Medium', 'Low'];
    export const colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745'];
    if (issuesPriorityChart) issuesPriorityChart.destroy();
    issuesPriorityChart = initializeDoughnutChart('issuesPriorityChart', labels, colors);
}

export function initializeIssuesStatusChart() {
    export const labels = ['New', 'Fixed', 'Not Fixed', 'Re-opened', 'Deferred'];
    export const colors = ['#17a2b8', '#28a745', '#dc3545', '#fd7e14', '#6f42c1'];
    if (issuesStatusChart) issuesStatusChart.destroy();
    issuesStatusChart = initializeDoughnutChart('issuesStatusChart', labels, colors);
}

export function initializeEnhancementsChart() {
    export const labels = ['New', 'Implemented', 'Exists'];
    export const colors = ['#17a2b8', '#28a745', '#6c757d'];
    if (enhancementsChart) enhancementsChart.destroy();
    enhancementsChart = initializeDoughnutChart('enhancementsChart', labels, colors);
}

export function initializeAutomationTestCasesChart() {
    export const labels = ['Passed', 'Failed', 'Skipped'];
    export const colors = ['#28a745', '#dc3545', '#ffc107'];
    if (automationTestCasesChart) automationTestCasesChart.destroy();
    automationTestCasesChart = initializeDoughnutChart('automationTestCasesChart', labels, colors);
}

export function initializeAutomationPercentageChart() {
    export const labels = ['Passed', 'Failed', 'Skipped'];
    export const colors = ['#28a745', '#dc3545', '#ffc107'];
    if (automationPercentageChart) automationPercentageChart.destroy();
    automationPercentageChart = initializeDoughnutChart('automationPercentageChart', labels, colors);
}

export function initializeAutomationStabilityChart() {
    export const labels = ['Stable', 'Flaky'];
    export const colors = ['#28a745', '#fd7e14'];
    if (automationStabilityChart) automationStabilityChart.destroy();
    automationStabilityChart = initializeDoughnutChart('automationStabilityChart', labels, colors);
}

// --- Calculation and Chart Update Functions ---
export function updateChart(chart, data) {
    if (chart) {
        chart.data.datasets[0].data = data;
        chart.update();
    }
}
