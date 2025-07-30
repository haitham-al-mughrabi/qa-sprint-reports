let dashboardCharts = {};

// Self-contained fetch function for dashboard stats with enhanced error handling
async function fetchDashboardStatsLocal() {
    let response;
    try {
        // Add cache-busting parameter to prevent stale data
        const timestamp = new Date().getTime();
        const url = `/api/dashboard/stats?t=${timestamp}`;
        
        console.log('Fetching dashboard stats from:', url);
        response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        console.log('Dashboard stats response status:', response.status);
        
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            
            // Try to get more details from the response
            try {
                const errorData = await response.json().catch(() => ({}));
                if (errorData && errorData.error) {
                    errorMessage += ` - ${errorData.error}`;
                } else if (response.status === 401) {
                    errorMessage = 'Authentication required. Please log in again.';
                } else if (response.status === 403) {
                    errorMessage = 'You do not have permission to view this data.';
                } else if (response.status === 404) {
                    errorMessage = 'Dashboard data not found. The endpoint may be incorrect.';
                } else if (response.status >= 500) {
                    errorMessage = 'Server error. Please try again later.';
                }
            } catch (e) {
                console.warn('Could not parse error response:', e);
            }
            
            throw new Error(errorMessage);
        }
        
        // Parse and validate the response
        const data = await response.json();
        
        if (!data) {
            throw new Error('Empty response received from server');
        }
        
        // Ensure we have the expected structure
        if (!data.overall) {
            console.warn('Unexpected response format - missing "overall" property');
            data.overall = {};
        }
        
        if (!data.projects) {
            console.warn('Unexpected response format - missing "projects" array');
            data.projects = [];
        }
        
        console.log('Successfully fetched dashboard stats:', {
            overall: data.overall ? '...' : 'no data',
            projectsCount: data.projects ? data.projects.length : 0
        });
        
        return data;
        
    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        
        // Return a minimal valid response structure even on error
        return {
            overall: {
                totalReports: 0,
                completedReports: 0,
                inProgressReports: 0,
                pendingReports: 0,
                totalUserStories: 0,
                totalTestCases: 0,
                totalIssues: 0,
                totalEnhancements: 0,
                automationTotalTestCases: 0,
                automationPassedTestCases: 0
            },
            projects: [],
            error: error.message || 'Failed to load dashboard data'
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard charts: DOM loaded, checking for cached stats...');
    
    // Check if stats are already cached by the main dashboard script
    const checkForCachedStats = () => {
        if (window.dashboardStatsCache && window.dashboardStatsCache.overall) {
            console.log('Using cached dashboard stats for charts');
            createDashboardCharts(window.dashboardStatsCache.overall);
        } else if (typeof fetchDashboardStats === 'function') {
            console.log('No cached stats, fetching from main function...');
            fetchDashboardStats().then(stats => {
                console.log('Dashboard stats received:', stats);
                if (stats && stats.overall) {
                    createDashboardCharts(stats.overall);
                } else {
                    console.error('No overall stats data available:', stats);
                    createDashboardCharts({});
                }
            }).catch(error => {
                console.error('Error fetching dashboard stats:', error);
                createDashboardCharts({});
            });
        } else {
            console.log('Main fetch function not available, using local fetch...');
            fetchDashboardStatsLocal().then(stats => {
                console.log('Dashboard stats received:', stats);
                if (stats && stats.overall) {
                    createDashboardCharts(stats.overall);
                } else {
                    console.error('No overall stats data available:', stats);
                    createDashboardCharts({});
                }
            }).catch(error => {
                console.error('Error fetching dashboard stats:', error);
                createDashboardCharts({});
            });
        }
    };
    
    // Wait a bit for the main script to load and fetch data first
    setTimeout(checkForCachedStats, 100);
    
    // Setup MutationObserver to watch for theme attribute changes (fallback)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                console.log('Dashboard charts: Theme attribute changed, recreating charts...');
                // Trigger chart recreation with same logic as themeChanged event
                setTimeout(() => {
                    if (window.dashboardStatsCache && window.dashboardStatsCache.overall) {
                        console.log('Using cached dashboard stats for theme attribute update');
                        // Destroy existing charts first
                        Object.values(dashboardCharts).forEach(chart => {
                            if (chart && chart.destroy) {
                                chart.destroy();
                            }
                        });
                        dashboardCharts = {};
                        createDashboardCharts(window.dashboardStatsCache.overall);
                    }
                }, 100);
            }
        });
    });
    
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
});

// Listen for theme changes and recreate charts with fresh data
window.addEventListener('themeChanged', (event) => {
    console.log('Dashboard charts: Theme changed event received, theme:', event.detail?.theme);
    console.log('Dashboard charts: Recreating charts with fresh data...');

    // Destroy all existing charts
    Object.values(dashboardCharts).forEach(chart => {
        if (chart && chart.destroy) {
            chart.destroy();
        }
    });

    // Clear the charts object
    dashboardCharts = {};

    // Recreate charts with fresh data from cache or refetch
    setTimeout(() => {
        if (window.dashboardStatsCache && window.dashboardStatsCache.overall) {
            console.log('Using cached dashboard stats for theme update');
            createDashboardCharts(window.dashboardStatsCache.overall);
        } else if (typeof fetchDashboardStats === 'function') {
            console.log('Fetching fresh dashboard stats for theme update');
            fetchDashboardStats().then(stats => {
                if (stats && stats.overall) {
                    createDashboardCharts(stats.overall);
                } else {
                    createDashboardCharts({});
                }
            }).catch(error => {
                console.error('Error fetching dashboard stats for theme update:', error);
                createDashboardCharts({});
            });
        } else {
            console.log('Fetching dashboard stats locally for theme update');
            fetchDashboardStatsLocal().then(stats => {
                if (stats && stats.overall) {
                    createDashboardCharts(stats.overall);
                } else {
                    createDashboardCharts({});
                }
            }).catch(error => {
                console.error('Error fetching local dashboard stats for theme update:', error);
                createDashboardCharts({});
            });
        }
    }, 100);
});


function createDashboardCharts(overallStats) {
    console.log('Creating dashboard charts with data:', overallStats);

    if (!window.Chart) {
        console.error('Chart.js is not loaded, waiting...');
        setTimeout(() => createDashboardCharts(overallStats), 100);
        return;
    }
    
    console.log('Chart.js is available, proceeding with chart creation...');

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
    console.log('Using stats data for charts:', overallStats);

    try {
        const userStoriesCanvas = document.getElementById('dashboardUserStoriesChart');
        if (!userStoriesCanvas) {
            console.error('User stories chart canvas not found');
            return;
        }
        console.log('User stories canvas found, creating chart...');

        // Get theme colors for this chart
        const isLightTheme = window.themeManager ? window.themeManager.isLightTheme() : true;

        const userStoriesCtx = userStoriesCanvas.getContext('2d');
        const userStoriesChartData = [
            overallStats.passedUserStories || 0,
            overallStats.passedWithIssuesUserStories || 0,
            overallStats.failedUserStories || 0,
            overallStats.blockedUserStories || 0,
            overallStats.cancelledUserStories || 0,
            overallStats.deferredUserStories || 0,
            overallStats.notTestableUserStories || 0
        ];
        console.log('User Stories Chart Data:', userStoriesChartData);
        dashboardCharts.userStories = new Chart(userStoriesCtx, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'],
                datasets: [{
                    data: userStoriesChartData,
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

        // Get theme colors for this chart
        const isLightTheme = window.themeManager ? window.themeManager.isLightTheme() : true;

        const testCasesCtx = testCasesCanvas.getContext('2d');
        const testCasesChartData = [
            overallStats.passedTestCases || 0,
            overallStats.passedWithIssuesTestCases || 0,
            overallStats.failedTestCases || 0,
            overallStats.blockedTestCases || 0,
            overallStats.cancelledTestCases || 0,
            overallStats.deferredTestCases || 0,
            overallStats.notTestableTestCases || 0
        ];
        console.log('Test Cases Chart Data:', testCasesChartData);
        dashboardCharts.testCases = new Chart(testCasesCtx, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'],
                datasets: [{
                    data: testCasesChartData,
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

        // Get theme colors for this chart
        const isLightTheme = window.themeManager ? window.themeManager.isLightTheme() : true;

        const issuesPriorityCtx = issuesPriorityCanvas.getContext('2d');
        const issuesPriorityChartData = [
            overallStats.criticalIssues || 0,
            overallStats.highIssues || 0,
            overallStats.mediumIssues || 0,
            overallStats.lowIssues || 0
        ];
        console.log('Issues Priority Chart Data:', issuesPriorityChartData);
        dashboardCharts.issuesPriority = new Chart(issuesPriorityCtx, {
            type: 'doughnut',
            data: {
                labels: ['Critical', 'High', 'Medium', 'Low'],
                datasets: [{
                    data: issuesPriorityChartData,
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

        // Get theme colors for this chart
        const isLightTheme = window.themeManager ? window.themeManager.isLightTheme() : true;

        const issuesStatusCtx = issuesStatusCanvas.getContext('2d');
        const issuesStatusChartData = [
            overallStats.newIssues || 0,
            overallStats.fixedIssues || 0,
            overallStats.notFixedIssues || 0,
            overallStats.reopenedIssues || 0,
            overallStats.deferredIssues || 0
        ];
        console.log('Issues Status Chart Data:', issuesStatusChartData);
        dashboardCharts.issuesStatus = new Chart(issuesStatusCtx, {
            type: 'doughnut',
            data: {
                labels: ['New', 'Fixed', 'Not Fixed', 'Re-opened', 'Deferred'],
                datasets: [{
                    data: issuesStatusChartData,
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

    try {
        const automationTestCasesCanvas = document.getElementById('dashboardAutomationTestCasesChart');
        if (!automationTestCasesCanvas) {
            console.error('Automation test cases chart canvas not found');
            return;
        }

        // Get theme colors for this chart
        const isLightTheme = window.themeManager ? window.themeManager.isLightTheme() : true;

        const automationTestCasesCtx = automationTestCasesCanvas.getContext('2d');
        const automationTestCasesChartData = [
            overallStats.automationPassedTestCases || 0,
            overallStats.automationFailedTestCases || 0,
            overallStats.automationSkippedTestCases || 0
        ];
        console.log('Automation Test Cases Chart Data:', automationTestCasesChartData);
        dashboardCharts.automationTestCases = new Chart(automationTestCasesCtx, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed', 'Skipped'],
                datasets: [{
                    data: automationTestCasesChartData,
                    backgroundColor: ['#4CAF50', '#F44336', '#FF9800'],
                    borderWidth: 3,
                    borderColor: 'var(--surface)'
                }]
            },
            options: getDashboardChartOptions()
        });
    } catch (error) {
        console.error('Error creating automation test cases chart:', error);
    }

    try {
        const automationStabilityCanvas = document.getElementById('dashboardAutomationStabilityChart');
        if (!automationStabilityCanvas) {
            console.error('Automation stability chart canvas not found');
            return;
        }

        // Get theme colors for this chart
        const isLightTheme = window.themeManager ? window.themeManager.isLightTheme() : true;

        const automationStabilityCtx = automationStabilityCanvas.getContext('2d');
        const automationStabilityChartData = [
            overallStats.automationStableTests || 0,
            overallStats.automationFlakyTests || 0
        ];
        console.log('Automation Stability Chart Data:', automationStabilityChartData);
        dashboardCharts.automationStability = new Chart(automationStabilityCtx, {
            type: 'doughnut',
            data: {
                labels: ['Stable', 'Flaky'],
                datasets: [{
                    data: automationStabilityChartData,
                    backgroundColor: ['#4CAF50', '#E91E63'],
                    borderWidth: 3,
                    borderColor: 'var(--surface)'
                }]
            },
            options: getDashboardChartOptions()
        });
    } catch (error) {
        console.error('Error creating automation stability chart:', error);
    }

    try {
        const enhancementsCanvas = document.getElementById('dashboardEnhancementsChart');
        if (!enhancementsCanvas) {
            console.error('Enhancements chart canvas not found');
            return;
        }

        // Get theme colors for this chart
        const isLightTheme = window.themeManager ? window.themeManager.isLightTheme() : true;
    

        const enhancementsCtx = enhancementsCanvas.getContext('2d');
        const enhancementsChartData = [
            overallStats.newEnhancements || 0,
            overallStats.implementedEnhancements || 0,
            overallStats.existsEnhancements || 0
        ];
        console.log('Enhancements Chart Data:', enhancementsChartData);
        dashboardCharts.enhancements = new Chart(enhancementsCtx, {
            type: 'doughnut',
            data: {
                labels: ['New', 'Implemented', 'Exists'],
                datasets: [{
                    data: enhancementsChartData,
                    backgroundColor: ['#00BCD4', '#4CAF50', '#9E9E9E'],
                    borderWidth: 3,
                    borderColor: 'var(--surface)'
                }]
            },
            options: getDashboardChartOptions()
        });
    } catch (error) {
        console.error('Error creating enhancements chart:', error);
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
    const tooltipBg = isLightTheme ? '#ffffff' : '#1e293b';
    const borderColor = 'var(--surface)';
    
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
                        size: 10, // Aligned with view_report.html
                        family: 'Poppins' // Aligned with view_report.html
                    },
                    color: textColor
                }
            },
            tooltip: {
                callbacks: { // Added callbacks for percentage display, aligned with view_report.html
                    label: function(context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const value = context.parsed || 0;
                        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                        return `${context.label}: ${value} (${percentage}%)`;
                    }
                },
                titleColor: textColor,
                bodyColor: textColor,
                backgroundColor: tooltipBg,
                borderColor: 'var(--surface)',
                borderWidth: 1,
                titleFont: { family: 'Poppins' }, // Aligned with view_report.html
                bodyFont: { family: 'Poppins' } // Aligned with view_report.html
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

