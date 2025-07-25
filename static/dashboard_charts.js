let dashboardCharts = {};

document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardStats().then(stats => {
        console.log('Dashboard stats received:', stats);
        if (stats && stats.overall) {
            createDashboardCharts(stats.overall);
        } else {
            console.error('No overall stats data available:', stats);
            // Create charts with empty/default data
            createDashboardCharts({});
        }
    }).catch(error => {
        console.error('Error fetching dashboard stats:', error);
        // Create charts with empty/default data
        createDashboardCharts({});
    });
});

// Listen for theme changes and recreate charts with new colors
window.addEventListener('themeChanged', (event) => {
    console.log('Dashboard charts: Theme changed event received, theme:', event.detail?.theme);
    console.log('Dashboard charts: Recreating charts...');

    // Store current chart data before destroying charts
    const chartData = {};
    Object.keys(dashboardCharts).forEach(key => {
        const chart = dashboardCharts[key];
        if (chart && chart.data) {
            chartData[key] = {
                data: chart.data.datasets[0].data,
                labels: chart.data.labels,
                type: chart.config.type
            };
        }
    });

    // Destroy all existing charts
    Object.values(dashboardCharts).forEach(chart => {
        if (chart && chart.destroy) {
            chart.destroy();
        }
    });

    // Clear the charts object
    dashboardCharts = {};

    // Recreate charts with new theme colors
    setTimeout(() => {
        recreateDashboardCharts(chartData);
    }, 100);
});

// Function to recreate dashboard charts with stored data
function recreateDashboardCharts(chartData) {
    const isLightTheme = window.isCurrentThemeLight ? window.isCurrentThemeLight() : true;
    const borderColor = isLightTheme ? '#ffffff' : '#1e293b';

    // Recreate user stories chart
    if (chartData.userStories) {
        const canvas = document.getElementById('dashboardUserStoriesChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            dashboardCharts.userStories = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: chartData.userStories.labels,
                    datasets: [{
                        data: chartData.userStories.data,
                        backgroundColor: ['#4CAF50', '#FFC107', '#F44336', '#9E9E9E', '#2196F3', '#673AB7', '#00BCD4'],
                        borderWidth: 3,
                        borderColor: borderColor
                    }]
                },
                options: getDashboardChartOptions()
            });
        }
    }

    // Recreate test cases chart
    if (chartData.testCases) {
        const canvas = document.getElementById('dashboardTestCasesChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            dashboardCharts.testCases = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: chartData.testCases.labels,
                    datasets: [{
                        data: chartData.testCases.data,
                        backgroundColor: ['#8BC34A', '#FFEB3B', '#E91E63', '#607D8B', '#9C27B0', '#FF5722', '#795548'],
                        borderWidth: 3,
                        borderColor: borderColor
                    }]
                },
                options: getDashboardChartOptions()
            });
        }
    }

    // Recreate issues priority chart
    if (chartData.issuesPriority) {
        const canvas = document.getElementById('dashboardIssuesPriorityChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            dashboardCharts.issuesPriority = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: chartData.issuesPriority.labels,
                    datasets: [{
                        data: chartData.issuesPriority.data,
                        backgroundColor: ['#F44336', '#FF9800', '#FFC107', '#4CAF50'],
                        borderWidth: 3,
                        borderColor: borderColor
                    }]
                },
                options: getDashboardChartOptions()
            });
        }
    }

    // Recreate issues status chart
    if (chartData.issuesStatus) {
        const canvas = document.getElementById('dashboardIssuesStatusChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            dashboardCharts.issuesStatus = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: chartData.issuesStatus.labels,
                    datasets: [{
                        data: chartData.issuesStatus.data,
                        backgroundColor: ['#2196F3', '#4CAF50', '#E91E63', '#FF5722', '#673AB7'],
                        borderWidth: 3,
                        borderColor: borderColor
                    }]
                },
                options: getDashboardChartOptions()
            });
        }
    }



    console.log('Dashboard charts recreated with new theme colors');
}

function createDashboardCharts(overallStats) {
    console.log('Creating dashboard charts with data:', overallStats);

    if (!window.Chart) {
        console.error('Chart.js is not loaded');
        return;
    }

    // Use actual database data, provide minimal fallbacks only when data is completely unavailable
    overallStats = overallStats || {};

    // Only provide fallbacks for essential fields if they're completely missing
    if (!overallStats.totalUserStories && !overallStats.totalTestCases && !overallStats.totalIssues) {
        console.warn('No real data available from database, using minimal fallbacks');
        overallStats = {
            totalUserStories: 0,
            passedUserStories: 0,
            passedWithIssuesUserStories: 0,
            failedUserStories: 0,
            blockedUserStories: 0,
            cancelledUserStories: 0,
            deferredUserStories: 0,
            notTestableUserStories: 0,

            totalTestCases: 0,
            passedTestCases: 0,
            passedWithIssuesTestCases: 0,
            failedTestCases: 0,
            blockedTestCases: 0,
            cancelledTestCases: 0,
            deferredTestCases: 0,
            notTestableTestCases: 0,

            totalIssues: 0,
            criticalIssues: 0,
            highIssues: 0,
            mediumIssues: 0,
            lowIssues: 0,

            newIssues: 0,
            fixedIssues: 0,
            notFixedIssues: 0,
            reopenedIssues: 0,
            deferredIssues: 0,

            ...overallStats // Keep any real data that exists
        };
    }
    console.log('Using stats data:', overallStats);

    try {
        const userStoriesCanvas = document.getElementById('dashboardUserStoriesChart');
        if (!userStoriesCanvas) {
            console.error('User stories chart canvas not found');
            return;
        }

        // Get theme colors for this chart
        const isLightTheme = window.themeManager ? window.themeManager.isLightTheme() : true;
        const borderColor = isLightTheme ? '#ffffff' : '#1e293b';

        const userStoriesCtx = userStoriesCanvas.getContext('2d');
        dashboardCharts.userStories = new Chart(userStoriesCtx, {
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
                    borderColor: borderColor
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

        // Get theme colors for this chart
        const isLightTheme = window.themeManager ? window.themeManager.isLightTheme() : true;
        const borderColor = isLightTheme ? '#ffffff' : '#1e293b';

        const testCasesCtx = testCasesCanvas.getContext('2d');
        dashboardCharts.testCases = new Chart(testCasesCtx, {
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
                    borderColor: borderColor
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

        // Get theme colors for this chart
        const isLightTheme = window.themeManager ? window.themeManager.isLightTheme() : true;
        const borderColor = isLightTheme ? '#ffffff' : '#1e293b';

        const issuesPriorityCtx = issuesPriorityCanvas.getContext('2d');
        dashboardCharts.issuesPriority = new Chart(issuesPriorityCtx, {
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
                    borderColor: borderColor
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

        // Get theme colors for this chart
        const isLightTheme = window.themeManager ? window.themeManager.isLightTheme() : true;
        const borderColor = isLightTheme ? '#ffffff' : '#1e293b';

        const issuesStatusCtx = issuesStatusCanvas.getContext('2d');
        dashboardCharts.issuesStatus = new Chart(issuesStatusCtx, {
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
                    borderColor: borderColor
                }]
            },
            options: getDashboardChartOptions()
        });
    } catch (error) {
        console.error('Error creating issues status chart:', error);
    }


    // Create enhanced visual elements
    createProgressCircles(overallStats);

}

function getDashboardChartOptions() {
    // Get theme-appropriate colors using robust detection
    const isLightTheme = window.isCurrentThemeLight ? window.isCurrentThemeLight() : true;
    
    // Explicit color definitions
    const textColor = isLightTheme ? '#1e293b' : '#f1f5f9';
    const gridColor = isLightTheme ? '#e2e8f0' : '#334155';
    const tooltipBg = isLightTheme ? '#ffffff' : '#334155';
    
    console.log('Dashboard chart options - isLightTheme:', isLightTheme, 'textColor:', textColor);

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
                    color: textColor
                }
            },
            tooltip: {
                titleColor: textColor,
                bodyColor: textColor,
                backgroundColor: tooltipBg,
                borderColor: gridColor,
                borderWidth: 1,
                titleFont: { family: 'Poppins' },
                bodyFont: { family: 'Poppins' }
            }
        }
    };
}

// Enhanced Visual Elements Functions

function createProgressCircles(overallStats) {
    // User Stories Progress
    const userStoriesTotal = overallStats.totalUserStories || 0;
    const userStoriesPassed = (overallStats.passedUserStories || 0) + (overallStats.passedWithIssuesUserStories || 0);
    const userStoriesProgress = userStoriesTotal > 0 ? Math.round((userStoriesPassed / userStoriesTotal) * 100) : 0;

    updateProgressCircle('userStoriesProgressBar', 'userStoriesPercentage', userStoriesProgress);

    // Test Cases Progress
    const testCasesTotal = overallStats.totalTestCases || 0;
    const testCasesPassed = (overallStats.passedTestCases || 0) + (overallStats.passedWithIssuesTestCases || 0);
    const testCasesProgress = testCasesTotal > 0 ? Math.round((testCasesPassed / testCasesTotal) * 100) : 0;

    updateProgressCircle('testCasesProgressBar', 'testCasesPercentage', testCasesProgress);

    // Issues Resolution
    const issuesTotal = overallStats.totalIssues || 0;
    const issuesFixed = overallStats.fixedIssues || 0;
    const issuesProgress = issuesTotal > 0 ? Math.round((issuesFixed / issuesTotal) * 100) : 0;

    updateProgressCircle('issuesProgressBar', 'issuesPercentage', issuesProgress);
}

function updateProgressCircle(barId, textId, percentage) {
    const circumference = 2 * Math.PI * 45; // radius = 45
    const offset = circumference - (percentage / 100) * circumference;

    setTimeout(() => {
        const progressBar = document.getElementById(barId);
        const progressText = document.getElementById(textId);

        if (progressBar && progressText) {
            progressBar.style.strokeDasharray = `${circumference} ${circumference}`;
            progressBar.style.strokeDashoffset = offset;
            progressText.textContent = `${percentage}%`;
        }
    }, 500);
}




// Data extraction functions using real database data



function calculateProjectQualityScore(project) {
    // Calculate quality score for individual project
    const userStoriesRate = project.totalUserStories > 0 ?
        ((project.passedUserStories || 0) / project.totalUserStories) * 100 : 0;
    const testCasesRate = project.totalTestCases > 0 ?
        ((project.passedTestCases || 0) / project.totalTestCases) * 100 : 0;
    const issueFixRate = project.totalIssues > 0 ?
        ((project.fixedIssues || 0) / project.totalIssues) * 100 : 100;

    return Math.round((userStoriesRate * 0.4) + (testCasesRate * 0.4) + (issueFixRate * 0.2));
}

