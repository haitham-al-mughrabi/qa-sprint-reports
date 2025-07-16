document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardStats().then(stats => {
        createDashboardCharts(stats.overall);
    });
});

function createDashboardCharts(overallStats) {
    const userStoriesCtx = document.getElementById('dashboardUserStoriesChart').getContext('2d');
    new Chart(userStoriesCtx, {
        type: 'doughnut',
        data: {
            labels: ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'],
            datasets: [{
                data: [
                    overallStats.passedUserStories,
                    overallStats.passedWithIssuesUserStories,
                    overallStats.failedUserStories,
                    overallStats.blockedUserStories,
                    overallStats.cancelledUserStories,
                    overallStats.deferredUserStories,
                    overallStats.notTestableUserStories
                ],
                backgroundColor: ['#4CAF50', '#FFC107', '#F44336', '#9E9E9E', '#2196F3', '#673AB7', '#00BCD4'],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getDashboardChartOptions()
    });

    const testCasesCtx = document.getElementById('dashboardTestCasesChart').getContext('2d');
    new Chart(testCasesCtx, {
        type: 'doughnut',
        data: {
            labels: ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'],
            datasets: [{
                data: [
                    overallStats.passedTestCases,
                    overallStats.passedWithIssuesTestCases,
                    overallStats.failedTestCases,
                    overallStats.blockedTestCases,
                    overallStats.cancelledTestCases,
                    overallStats.deferredTestCases,
                    overallStats.notTestableTestCases
                ],
                backgroundColor: ['#8BC34A', '#FFEB3B', '#E91E63', '#607D8B', '#9C27B0', '#FF5722', '#795548'],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getDashboardChartOptions()
    });

    const issuesPriorityCtx = document.getElementById('dashboardIssuesPriorityChart').getContext('2d');
    new Chart(issuesPriorityCtx, {
        type: 'doughnut',
        data: {
            labels: ['Critical', 'High', 'Medium', 'Low'],
            datasets: [{
                data: [
                    overallStats.criticalIssues,
                    overallStats.highIssues,
                    overallStats.mediumIssues,
                    overallStats.lowIssues
                ],
                backgroundColor: ['#F44336', '#FF9800', '#FFC107', '#4CAF50'],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getDashboardChartOptions()
    });

    const issuesStatusCtx = document.getElementById('dashboardIssuesStatusChart').getContext('2d');
    new Chart(issuesStatusCtx, {
        type: 'doughnut',
        data: {
            labels: ['New', 'Fixed', 'Not Fixed', 'Re-opened', 'Deferred'],
            datasets: [{
                data: [
                    overallStats.newIssues,
                    overallStats.fixedIssues,
                    overallStats.notFixedIssues,
                    overallStats.reopenedIssues,
                    overallStats.deferredIssues
                ],
                backgroundColor: ['#2196F3', '#4CAF50', '#E91E63', '#FF5722', '#673AB7'],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getDashboardChartOptions()
    });
}

function getDashboardChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 15,
                    usePointStyle: true,
                    font: {
                        size: 10,
                        family: 'Poppins'
                    },
                    color: '#f1f5f9'
                }
            },
            tooltip: {
                titleColor: '#f1f5f9',
                bodyColor: '#f1f5f9',
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                borderWidth: 1,
                titleFont: { family: 'Poppins' },
                bodyFont: { family: 'Poppins' }
            }
        }
    };
}