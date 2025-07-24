document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardStats().then(stats => {
        createDashboardCharts(stats.overall);
    });
});

function createDashboardCharts(overallStats) {
    if (!window.Chart) {
        console.error('Chart.js is not loaded');
        return;
    }

    if (!overallStats) {
        console.error('Overall stats data is missing');
        return;
    }

    try {
        const userStoriesCanvas = document.getElementById('dashboardUserStoriesChart');
        if (!userStoriesCanvas) {
            console.error('User stories chart canvas not found');
            return;
        }

        const userStoriesCtx = userStoriesCanvas.getContext('2d');
        new Chart(userStoriesCtx, {
        type: 'doughnut',
        data: {
            labels: ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'],
            datasets: [{
                data: [
                    overallStats.passedUserStories || 0,
                    overallStats.passedWithIssuesUserStories || 0,
                    overallStats.failedUserStories || 0,
                    overallStats.blockedUserStories || 0,
                    overallStats.cancelledUserStories || 0,
                    overallStats.deferredUserStories || 0,
                    overallStats.notTestableUserStories || 0
                ],
                backgroundColor: ['#4CAF50', '#FFC107', '#F44336', '#9E9E9E', '#2196F3', '#673AB7', '#00BCD4'],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getDashboardChartOptions()
    });
    } catch (error) {
        console.error('Error creating user stories chart:', error);
    }

    try {
        const testCasesCanvas = document.getElementById('dashboardTestCasesChart');
        if (!testCasesCanvas) {
            console.error('Test cases chart canvas not found');
            return;
        }

        const testCasesCtx = testCasesCanvas.getContext('2d');
        new Chart(testCasesCtx, {
        type: 'doughnut',
        data: {
            labels: ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'],
            datasets: [{
                data: [
                    overallStats.passedTestCases || 0,
                    overallStats.passedWithIssuesTestCases || 0,
                    overallStats.failedTestCases || 0,
                    overallStats.blockedTestCases || 0,
                    overallStats.cancelledTestCases || 0,
                    overallStats.deferredTestCases || 0,
                    overallStats.notTestableTestCases || 0
                ],
                backgroundColor: ['#8BC34A', '#FFEB3B', '#E91E63', '#607D8B', '#9C27B0', '#FF5722', '#795548'],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getDashboardChartOptions()
    });
    } catch (error) {
        console.error('Error creating test cases chart:', error);
    }

    try {
        const issuesPriorityCanvas = document.getElementById('dashboardIssuesPriorityChart');
        if (!issuesPriorityCanvas) {
            console.error('Issues priority chart canvas not found');
            return;
        }

        const issuesPriorityCtx = issuesPriorityCanvas.getContext('2d');
        new Chart(issuesPriorityCtx, {
        type: 'doughnut',
        data: {
            labels: ['Critical', 'High', 'Medium', 'Low'],
            datasets: [{
                data: [
                    overallStats.criticalIssues || 0,
                    overallStats.highIssues || 0,
                    overallStats.mediumIssues || 0,
                    overallStats.lowIssues || 0
                ],
                backgroundColor: ['#F44336', '#FF9800', '#FFC107', '#4CAF50'],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getDashboardChartOptions()
    });
    } catch (error) {
        console.error('Error creating issues priority chart:', error);
    }

    try {
        const issuesStatusCanvas = document.getElementById('dashboardIssuesStatusChart');
        if (!issuesStatusCanvas) {
            console.error('Issues status chart canvas not found');
            return;
        }

        const issuesStatusCtx = issuesStatusCanvas.getContext('2d');
        new Chart(issuesStatusCtx, {
        type: 'doughnut',
        data: {
            labels: ['New', 'Fixed', 'Not Fixed', 'Re-opened', 'Deferred'],
            datasets: [{
                data: [
                    overallStats.newIssues || 0,
                    overallStats.fixedIssues || 0,
                    overallStats.notFixedIssues || 0,
                    overallStats.reopenedIssues || 0,
                    overallStats.deferredIssues || 0
                ],
                backgroundColor: ['#2196F3', '#4CAF50', '#E91E63', '#FF5722', '#673AB7'],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getDashboardChartOptions()
    });
    } catch (error) {
        console.error('Error creating issues status chart:', error);
    }
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