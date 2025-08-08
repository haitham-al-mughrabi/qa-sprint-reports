// static/js/charts.js
// Chart Management Functions

// --- Chart initialization functions ---
function initializeCharts() {
    initializeUserStoriesChart();
    initializeTestCasesChart();
    initializeIssuesPriorityChart();
    initializeIssuesStatusChart();
    initializeEnhancementsChart();
    initializeAutomationTestCasesChart();
    initializeAutomationPercentageChart();
    initializeAutomationStabilityChart();
}

function getChartOptions() {
    // Get theme-appropriate colors using robust detection
    const isLightTheme = window.isCurrentThemeLight ? window.isCurrentThemeLight() : true;
    
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 15,
                    usePointStyle: true,
                    color: isLightTheme ? '#333' : '#fff',
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: isLightTheme ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                titleColor: isLightTheme ? '#fff' : '#333',
                bodyColor: isLightTheme ? '#fff' : '#333',
                borderColor: isLightTheme ? '#333' : '#ccc',
                borderWidth: 1
            }
        },
        scales: {
            x: {
                ticks: {
                    color: isLightTheme ? '#666' : '#ccc'
                },
                grid: {
                    color: isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
                }
            },
            y: {
                ticks: {
                    color: isLightTheme ? '#666' : '#ccc'
                },
                grid: {
                    color: isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
                }
            }
        }
    };
}

function initializeDoughnutChart(canvasId, labels, backgroundColors) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) {
        console.warn(`Canvas context not found for ${canvasId}`);
        return null;
    }

    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded yet, retrying in 500ms...');
        setTimeout(() => initializeDoughnutChart(canvasId, labels, backgroundColors), 500);
        return null;
    }

    try {
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: labels.map(() => 0), // Initialize with zeros for each label
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color.replace('0.6', '1')),
                    borderWidth: 2
                }]
            },
            options: getChartOptions()
        });
        console.log(`Chart initialized successfully for ${canvasId}`);
        return chart;
    } catch (error) {
        console.error(`Error initializing chart for ${canvasId}:`, error);
        return null;
    }
}

function initializeUserStoriesChart() {
    const labels = ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'];
    const colors = ['#28a745', '#ffc107', '#dc3545', '#6c757d', '#fd7e14', '#6f42c1', '#20c997'];
    window.userStoriesChart = initializeDoughnutChart('userStoriesChart', labels, colors);
}

function initializeTestCasesChart() {
    const labels = ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'];
    const colors = ['#28a745', '#ffc107', '#dc3545', '#6c757d', '#fd7e14', '#6f42c1', '#20c997'];
    window.testCasesChart = initializeDoughnutChart('testCasesChart', labels, colors);
}

function initializeIssuesPriorityChart() {
    const labels = ['Critical', 'High', 'Medium', 'Low'];
    const colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745'];
    window.issuesPriorityChart = initializeDoughnutChart('issuesPriorityChart', labels, colors);
}

function initializeIssuesStatusChart() {
    const labels = ['New', 'Fixed', 'Not Fixed', 'Re-opened', 'Deferred'];
    const colors = ['#17a2b8', '#28a745', '#dc3545', '#fd7e14', '#6f42c1'];
    window.issuesStatusChart = initializeDoughnutChart('issuesStatusChart', labels, colors);
}

function initializeEnhancementsChart() {
    const labels = ['New', 'Implemented', 'Exists'];
    const colors = ['#17a2b8', '#28a745', '#6c757d'];
    window.enhancementsChart = initializeDoughnutChart('enhancementsChart', labels, colors);
}

function initializeAutomationTestCasesChart() {
    const canvasId = 'automationTestCasesChart';
    const canvas = document.getElementById(canvasId);
    console.log('Initializing automation test cases chart, canvas found:', !!canvas);
    
    if (!canvas) {
        console.warn(`Canvas element '${canvasId}' not found, retrying in 500ms...`);
        setTimeout(() => initializeAutomationTestCasesChart(), 500);
        return;
    }
    
    const labels = ['Passed', 'Failed', 'Skipped'];
    const colors = ['#28a745', '#dc3545', '#ffc107'];
    window.automationTestCasesChart = initializeDoughnutChart(canvasId, labels, colors);
    console.log('Automation test cases chart initialized:', !!window.automationTestCasesChart);
}

function initializeAutomationPercentageChart() {
    const labels = ['Passed', 'Failed', 'Skipped'];
    const colors = ['#28a745', '#dc3545', '#ffc107'];
    window.automationPercentageChart = initializeDoughnutChart('automationPercentageChart', labels, colors);
}

function initializeAutomationStabilityChart() {
    const canvasId = 'automationStabilityChart';
    const canvas = document.getElementById(canvasId);
    console.log('Initializing automation stability chart, canvas found:', !!canvas);
    
    if (!canvas) {
        console.warn(`Canvas element '${canvasId}' not found, retrying in 500ms...`);
        setTimeout(() => initializeAutomationStabilityChart(), 500);
        return;
    }
    
    const labels = ['Stable', 'Flaky'];
    const colors = ['#28a745', '#fd7e14'];
    window.automationStabilityChart = initializeDoughnutChart(canvasId, labels, colors);
    console.log('Automation stability chart initialized:', !!window.automationStabilityChart);
}

// --- Automation chart update functions ---
function calculateAutomationPercentages() {
    const passed = parseInt(document.getElementById('automationPassedTestCases')?.value || '0');
    const failed = parseInt(document.getElementById('automationFailedTestCases')?.value || '0');
    const skipped = parseInt(document.getElementById('automationSkippedTestCases')?.value || '0');
    
    const total = passed + failed + skipped;
    document.getElementById('automationTotalTestCases').value = total;
    
    if (total > 0) {
        document.getElementById('automationPassedPercentage').textContent = Math.round((passed / total) * 100) + '%';
        document.getElementById('automationFailedPercentage').textContent = Math.round((failed / total) * 100) + '%';
        document.getElementById('automationSkippedPercentage').textContent = Math.round((skipped / total) * 100) + '%';
        
        // Update chart
        if (window.automationTestCasesChart) {
            updateChartData(window.automationTestCasesChart, [passed, failed, skipped]);
        }
    }
}

function calculateAutomationStabilityPercentages() {
    const stable = parseInt(document.getElementById('automationStableTests')?.value || '0');
    const flaky = parseInt(document.getElementById('automationFlakyTests')?.value || '0');
    
    const total = stable + flaky;
    document.getElementById('automationStabilityTotal').value = total;
    
    if (total > 0) {
        document.getElementById('automationStablePercentage').textContent = Math.round((stable / total) * 100) + '%';
        document.getElementById('automationFlakyPercentage').textContent = Math.round((flaky / total) * 100) + '%';
        
        // Update chart
        if (window.automationStabilityChart) {
            updateChartData(window.automationStabilityChart, [stable, flaky]);
        }
    }
}

// --- Calculation and Chart Update Functions ---
function updateChart(chart, data) {
    if (chart) {
        chart.data.datasets[0].data = data;
        chart.update();
    }
}

function calculatePercentages() {
    const total = calculateUserStoryTotal();
    const values = {
        passed: parseInt(document.getElementById('passedStories')?.value) || 0,
        passedWithIssues: parseInt(document.getElementById('passedWithIssuesStories')?.value) || 0,
        failed: parseInt(document.getElementById('failedStories')?.value) || 0,
        blocked: parseInt(document.getElementById('blockedStories')?.value) || 0,
        cancelled: parseInt(document.getElementById('cancelledStories')?.value) || 0,
        deferred: parseInt(document.getElementById('deferredStories')?.value) || 0,
        notTestable: parseInt(document.getElementById('notTestableStories')?.value) || 0
    };

    // Update metrics field
    const metricsField = document.getElementById('userStoriesMetric');
    if (metricsField) {
        metricsField.value = total;
    }

    // Update chart
    updateChart(window.userStoriesChart, [
        values.passed, values.passedWithIssues, values.failed,
        values.blocked, values.cancelled, values.deferred, values.notTestable
    ]);
}

function calculateUserStoryTotal() {
    const fields = ['passedStories', 'passedWithIssuesStories', 'failedStories', 'blockedStories', 'cancelledStories', 'deferredStories', 'notTestableStories'];
    return fields.reduce((sum, field) => sum + (parseInt(document.getElementById(field)?.value) || 0), 0);
}

function calculateTestCasesPercentages() {
    const total = calculateTestCasesTotal();

    const values = {
        passed: parseInt(document.getElementById('passedTestCases')?.value) || 0,
        passedWithIssues: parseInt(document.getElementById('passedWithIssuesTestCases')?.value) || 0,
        failed: parseInt(document.getElementById('failedTestCases')?.value) || 0,
        blocked: parseInt(document.getElementById('blockedTestCases')?.value) || 0,
        cancelled: parseInt(document.getElementById('cancelledTestCases')?.value) || 0,
        deferred: parseInt(document.getElementById('deferredTestCases')?.value) || 0,
        notTestable: parseInt(document.getElementById('notTestableTestCases')?.value) || 0
    };

    // Update metrics field
    const metricsField = document.getElementById('testCasesMetric');
    if (metricsField) {
        metricsField.value = total;
    }

    // Update chart
    updateChart(window.testCasesChart, [
        values.passed, values.passedWithIssues, values.failed,
        values.blocked, values.cancelled, values.deferred, values.notTestable
    ]);
}

function calculateTestCasesTotal() {
    const fields = ['passedTestCases', 'passedWithIssuesTestCases', 'failedTestCases', 'blockedTestCases', 'cancelledTestCases', 'deferredTestCases', 'notTestableTestCases'];
    return fields.reduce((sum, field) => sum + (parseInt(document.getElementById(field)?.value) || 0), 0);
}

function calculateIssuesPercentages() {
    const total = calculateIssuesTotal();
    const priorityValues = {
        critical: parseInt(document.getElementById('criticalIssues')?.value) || 0,
        high: parseInt(document.getElementById('highIssues')?.value) || 0,
        medium: parseInt(document.getElementById('mediumIssues')?.value) || 0,
        low: parseInt(document.getElementById('lowIssues')?.value) || 0
    };

    // Update metrics field
    const metricsField = document.getElementById('issuesMetric');
    if (metricsField) {
        metricsField.value = total;
    }

    // Update priority chart
    updateChart(window.issuesPriorityChart, [
        priorityValues.critical, priorityValues.high, priorityValues.medium, priorityValues.low
    ]);

    // Update status chart
    calculateIssuesStatusPercentages();
}

function calculateIssuesTotal() {
    const fields = ['criticalIssues', 'highIssues', 'mediumIssues', 'lowIssues'];
    return fields.reduce((sum, field) => sum + (parseInt(document.getElementById(field)?.value) || 0), 0);
}

function calculateIssuesStatusPercentages() {
    const total = calculateIssuesTotal();
    const statusValues = {
        new: parseInt(document.getElementById('newIssues')?.value) || 0,
        fixed: parseInt(document.getElementById('fixedIssues')?.value) || 0,
        notFixed: parseInt(document.getElementById('notFixedIssues')?.value) || 0,
        reopened: parseInt(document.getElementById('reopenedIssues')?.value) || 0,
        deferred: parseInt(document.getElementById('deferredIssues')?.value) || 0
    };

    // Update status chart
    updateChart(window.issuesStatusChart, [
        statusValues.new, statusValues.fixed, statusValues.notFixed,
        statusValues.reopened, statusValues.deferred
    ]);
}

function calculateEnhancementsPercentages() {
    const total = calculateEnhancementsTotal();
    const values = {
        new: parseInt(document.getElementById('newEnhancements')?.value) || 0,
        implemented: parseInt(document.getElementById('implementedEnhancements')?.value) || 0,
        exists: parseInt(document.getElementById('existsEnhancements')?.value) || 0
    };

    // Update metrics field
    const metricsField = document.getElementById('enhancementsMetric');
    if (metricsField) {
        metricsField.value = total;
    }

    // Update chart
    updateChart(window.enhancementsChart, [values.new, values.implemented, values.exists]);
}

function calculateEnhancementsTotal() {
    const fields = ['newEnhancements', 'implementedEnhancements', 'existsEnhancements'];
    return fields.reduce((sum, field) => sum + (parseInt(document.getElementById(field)?.value) || 0), 0);
}

// Automation Regression calculation functions
function calculateAutomationTotal() {
    const passed = parseInt(document.getElementById('automationPassedTestCases')?.value) || 0;
    const failed = parseInt(document.getElementById('automationFailedTestCases')?.value) || 0;
    const skipped = parseInt(document.getElementById('automationSkippedTestCases')?.value) || 0;
    return passed + failed + skipped;
}

function calculateAutomationStabilityTotal() {
    const stable = parseInt(document.getElementById('automationStableTests')?.value) || 0;
    const flaky = parseInt(document.getElementById('automationFlakyTests')?.value) || 0;
    return stable + flaky;
}

function calculateAutomationPercentages() {
    const total = calculateAutomationTotal();
    const values = {
        passed: parseInt(document.getElementById('automationPassedTestCases')?.value) || 0,
        failed: parseInt(document.getElementById('automationFailedTestCases')?.value) || 0,
        skipped: parseInt(document.getElementById('automationSkippedTestCases')?.value) || 0
    };

    // Update test cases chart
    updateChart(window.automationTestCasesChart, [values.passed, values.failed, values.skipped]);

    // Calculate percentages for percentage chart
    if (total > 0) {
        const passedPercentage = (values.passed / total) * 100;
        const failedPercentage = (values.failed / total) * 100;
        const skippedPercentage = (values.skipped / total) * 100;

        // Update percentage chart
        updateChart(window.automationPercentageChart, [passedPercentage, failedPercentage, skippedPercentage]);
    } else {
        updateChart(window.automationPercentageChart, [0, 0, 0]);
    }

    // Update stability chart
    calculateAutomationStabilityPercentages();
}

function calculateAutomationStabilityPercentages() {
    const total = calculateAutomationStabilityTotal();
    const values = {
        stable: parseInt(document.getElementById('automationStableTests')?.value) || 0,
        flaky: parseInt(document.getElementById('automationFlakyTests')?.value) || 0
    };

    // Update stability chart
    updateChart(window.automationStabilityChart, [values.stable, values.flaky]);
}

// Function to reset all charts
function resetAllCharts() {
    const charts = [
        window.userStoriesChart,
        window.testCasesChart,
        window.issuesPriorityChart,
        window.issuesStatusChart,
        window.enhancementsChart,
        window.automationTestCasesChart,
        window.automationPercentageChart,
        window.automationStabilityChart
    ];

    charts.forEach(chart => {
        if (chart) {
            chart.data.datasets[0].data = chart.data.datasets[0].data.map(() => 0);
            chart.update();
        }
    });
}

// Function to reset all calculations
function resetAllCalculations() {
    // Reset all metric fields
    const metricFields = [
        'userStoriesMetric',
        'testCasesMetric',
        'issuesMetric',
        'enhancementsMetric',
        'qaNotesMetric'
    ];

    metricFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = 0;
        }
    });
}

// Function to update bugs count metric
function updateBugsCount() {
    const bugsMetricField = document.getElementById('bugsMetric');
    if (bugsMetricField) {
        bugsMetricField.value = (window.bugsData || []).length;
    }
}

// Function to update scenarios count metric
function updateScenariosCount() {
    const scenariosMetricField = document.getElementById('scenariosMetric');
    if (scenariosMetricField) {
        scenariosMetricField.value = (window.performanceScenarios || []).length;
    }
}

// Function to update HTTP requests count metric
function updateHttpRequestsCount() {
    const httpRequestsMetricField = document.getElementById('httpRequestsMetric');
    if (httpRequestsMetricField) {
        httpRequestsMetricField.value = (window.httpRequestsOverview || []).length;
    }
}

// Make functions globally accessible
window.initializeCharts = initializeCharts;
window.getChartOptions = getChartOptions;
window.initializeDoughnutChart = initializeDoughnutChart;
window.initializeUserStoriesChart = initializeUserStoriesChart;
window.initializeTestCasesChart = initializeTestCasesChart;
window.initializeIssuesPriorityChart = initializeIssuesPriorityChart;
window.initializeIssuesStatusChart = initializeIssuesStatusChart;
window.initializeEnhancementsChart = initializeEnhancementsChart;
window.initializeAutomationTestCasesChart = initializeAutomationTestCasesChart;
window.initializeAutomationPercentageChart = initializeAutomationPercentageChart;
window.initializeAutomationStabilityChart = initializeAutomationStabilityChart;
window.updateChart = updateChart;
window.calculatePercentages = calculatePercentages;
window.calculateUserStoryTotal = calculateUserStoryTotal;
window.calculateTestCasesPercentages = calculateTestCasesPercentages;
window.calculateTestCasesTotal = calculateTestCasesTotal;
window.calculateIssuesPercentages = calculateIssuesPercentages;
window.calculateIssuesTotal = calculateIssuesTotal;
window.calculateIssuesStatusPercentages = calculateIssuesStatusPercentages;
window.calculateEnhancementsPercentages = calculateEnhancementsPercentages;
window.calculateEnhancementsTotal = calculateEnhancementsTotal;
window.calculateAutomationTotal = calculateAutomationTotal;
window.calculateAutomationStabilityTotal = calculateAutomationStabilityTotal;
window.calculateAutomationPercentages = calculateAutomationPercentages;
window.calculateAutomationStabilityPercentages = calculateAutomationStabilityPercentages;
window.resetAllCharts = resetAllCharts;
window.resetAllCalculations = resetAllCalculations;
window.updateBugsCount = updateBugsCount;
window.updateScenariosCount = updateScenariosCount;
window.initializeAutomationTestCasesChart = initializeAutomationTestCasesChart;
window.initializeAutomationStabilityChart = initializeAutomationStabilityChart;
window.updateHttpRequestsCount = updateHttpRequestsCount;