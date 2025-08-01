let projects = [];
let selectedProjectId = null;
let projectStatsCache = null; // Cache project statistics data

let projectCharts = {};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - initializing project statistics page');
    
    const projectSearchInput = document.getElementById('projectSearchInput');
    const loadProjectStatsBtn = document.getElementById('loadProjectStatsBtn');
    const projectDropdownContent = document.getElementById('projectDropdownContent');
    
    // Check if required elements exist
    if (!projectSearchInput) {
        console.error('Project search input not found');
        return;
    }
    if (!loadProjectStatsBtn) {
        console.error('Load project stats button not found');
        return;
    }
    if (!projectDropdownContent) {
        console.error('Project dropdown content not found');
        return;
    }
    
    console.log('All required DOM elements found');
    
    // Check if Chart.js is loaded
    if (window.Chart) {
        console.log('Chart.js is loaded');
    } else {
        console.error('Chart.js is not loaded');
    }

    // Fetch projects and populate the dropdown
    fetch('/api/projects')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Projects loaded:', data);
            projects = data;
            renderProjectDropdown(projects);
        })
        .catch(error => {
            console.error('Error loading projects:', error);
            const dropdownContent = document.getElementById('projectDropdownContent');
            if (dropdownContent) {
                dropdownContent.innerHTML = '<div style="padding: 10px; color: red;">Error loading projects</div>';
            }
        });

    loadProjectStatsBtn.addEventListener('click', () => {
        console.log('Load stats button clicked, selectedProjectId:', selectedProjectId);
        if (selectedProjectId) {
            loadProjectStatsBtn.disabled = true;
            loadProjectStatsBtn.textContent = 'Loading...';
            loadProjectStatistics(selectedProjectId);
        } else {
            alert('Please select a project first');
        }
    });
    
    // Setup MutationObserver to watch for theme attribute changes (fallback)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                console.log('Project statistics: Theme attribute changed, recreating charts...');
                // Trigger chart recreation with same logic as themeChanged event
                setTimeout(() => {
                    if (selectedProjectId && projectStatsCache) {
                        console.log('Recreating project statistics from cache for theme attribute update');
                        // Destroy existing charts first
                        Object.values(projectCharts).forEach(chart => {
                            if (chart && chart.destroy) {
                                chart.destroy();
                            }
                        });
                        projectCharts = {};
                        renderAllProjectStatistics(projectStatsCache);
                    } else if (selectedProjectId) {
                        console.log('No cached data, reloading project statistics for theme attribute update:', selectedProjectId);
                        // Destroy existing charts first
                        Object.values(projectCharts).forEach(chart => {
                            if (chart && chart.destroy) {
                                chart.destroy();
                            }
                        });
                        projectCharts = {};
                        loadProjectStatistics(selectedProjectId);
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

// Listen for theme changes and recreate charts and statistics with cached data
window.addEventListener('themeChanged', () => {
    console.log('Theme changed, recreating project statistics with cached data...');
    
    // Destroy all existing charts
    Object.values(projectCharts).forEach(chart => {
        if (chart && chart.destroy) {
            chart.destroy();
        }
    });

    // Clear the charts object
    projectCharts = {};

    // Recreate all statistics and charts using cached data
    setTimeout(() => {
        if (selectedProjectId && projectStatsCache) {
            console.log('Recreating project statistics from cache for theme update');
            renderAllProjectStatistics(projectStatsCache);
        } else if (selectedProjectId) {
            console.log('No cached data, reloading project statistics for theme update:', selectedProjectId);
            loadProjectStatistics(selectedProjectId);
        }
    }, 100);
});


function renderProjectDropdown(projectsToRender) {
    const dropdownContent = document.getElementById('projectDropdownContent');
    if (!dropdownContent) {
        console.error('Dropdown content element not found');
        return;
    }
    
    console.log('Rendering projects dropdown:', projectsToRender);
    dropdownContent.innerHTML = '';
    
    if (!projectsToRender || projectsToRender.length === 0) {
        dropdownContent.innerHTML = '<div style="padding: 10px; color: #666;">No projects available</div>';
        dropdownContent.style.display = 'block';
        return;
    }
    
    projectsToRender.forEach(project => {
        const a = document.createElement('a');
        a.href = "#";
        a.textContent = project.name || 'Unknown Project';
        a.onclick = () => selectProject(project);
        dropdownContent.appendChild(a);
    });
    dropdownContent.style.display = 'block';
    console.log('Dropdown rendered with', projectsToRender.length, 'projects');
}

function filterProjects() {
    const filter = document.getElementById('projectSearchInput').value.toUpperCase();
    const filteredProjects = projects.filter(p => p.name.toUpperCase().includes(filter));
    renderProjectDropdown(filteredProjects);
}

function selectProject(project) {
    console.log('Project selected:', project);
    selectedProjectId = project.id;
    document.getElementById('projectSearchInput').value = project.name;
    document.getElementById('projectDropdownContent').style.display = 'none';
    
    // Enable the load stats button
    const loadBtn = document.getElementById('loadProjectStatsBtn');
    if (loadBtn) {
        loadBtn.disabled = false;
        loadBtn.style.opacity = '1';
    }
}

function loadProjectStatistics(projectId) {
    console.log('Loading statistics for project:', projectId);
    
    fetch(`/api/project-stats/${projectId}`)
        .then(response => {
            console.log('API response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(stats => {
            console.log('Statistics loaded:', stats);
            
            // Cache the stats data for theme changes
            projectStatsCache = stats;
            
            // Reset the button state
            const loadBtn = document.getElementById('loadProjectStatsBtn');
            if (loadBtn) {
                loadBtn.disabled = false;
                loadBtn.textContent = 'Load Stats';
            }
            
            document.getElementById('projectStatsContent').style.display = 'block';
            
            // Render all project statistics
            renderAllProjectStatistics(stats);
        })
        .catch(error => {
            console.error('Error loading project statistics:', error);
            
            // Reset the button state
            const loadBtn = document.getElementById('loadProjectStatsBtn');
            if (loadBtn) {
                loadBtn.disabled = false;
                loadBtn.textContent = 'Load Stats';
            }
            
            const projectStatsContent = document.getElementById('projectStatsContent');
            if (projectStatsContent) {
                projectStatsContent.style.display = 'block';
                projectStatsContent.innerHTML = `
                    <div class="empty-state">
                        <span class="icon">⚠️</span>
                        <h3>Error Loading Statistics</h3>
                        <p>Failed to load project data: ${error.message}</p>
                        <p>Please ensure the project has reports and try again.</p>
                    </div>
                `;
            }
        });
}

// Function to render all project statistics sections
function renderAllProjectStatistics(stats) {
    // Render each section with error handling
    try {
        renderProjectOverallStats(stats.overall);
        console.log('Overall stats rendered');
    } catch (error) {
        console.error('Error rendering overall stats:', error);
    }
    
    try {
        renderSuccessRates(stats.overall);
        console.log('Success rates rendered');
    } catch (error) {
        console.error('Error rendering success rates:', error);
    }
    
    try {
        renderQualityMetrics(stats.overall);
        console.log('Quality metrics rendered');
    } catch (error) {
        console.error('Error rendering quality metrics:', error);
    }
    
    try {
        renderProjectCharts(stats.charts);
        console.log('Project charts rendered');
    } catch (error) {
        console.error('Error rendering project charts:', error);
    }
    
    try {
        renderAdditionalCharts(stats.overall);
        console.log('Additional charts rendered');
    } catch (error) {
        console.error('Error rendering additional charts:', error);
    }
    
    try {
        renderProjectTesters(stats.testers);
        console.log('Project testers rendered');
    } catch (error) {
        console.error('Error rendering project testers:', error);
    }
    
    try {
        renderProjectReports(stats.reports);
        console.log('Project reports rendered');
    } catch (error) {
        console.error('Error rendering project reports:', error);
    }
    
    try {
        renderProjectTimeStats(stats.time_stats);
        console.log('Time stats rendered');
    } catch (error) {
        console.error('Error rendering time stats:', error);
    }
}

function renderProjectOverallStats(overallStats) {
    const container = document.getElementById('projectStatsOverall');
    if (!container) {
        console.error('Project stats overall container not found');
        return;
    }

    if (!overallStats) {
        console.error('Overall stats data is missing');
        container.innerHTML = '<div class="empty-state">No data available</div>';
        return;
    }

    container.innerHTML = `
        <div class="stat-card">
            <div class="icon"><i class="fas fa-file-alt"></i></div>
            <h3>${overallStats.totalReports || 0}</h3>
            <p>Total Reports</p>
        </div>
        <div class="stat-card">
            <div class="icon"><i class="fas fa-user-check"></i></div>
            <h3>${overallStats.totalUserStories || 0}</h3>
            <p>Total User Stories</p>
        </div>
        <div class="stat-card">
            <div class="icon"><i class="fas fa-flask"></i></div>
            <h3>${overallStats.totalTestCases || 0}</h3>
            <p>Total Test Cases</p>
        </div>
        <div class="stat-card">
            <div class="icon"><i class="fas fa-exclamation-triangle"></i></div>
            <h3>${overallStats.totalIssues || 0}</h3>
            <p>Total Issues</p>
        </div>
        <div class="stat-card">
            <div class="icon"><i class="fas fa-magic"></i></div>
            <h3>${overallStats.totalEnhancements || 0}</h3>
            <p>Total Enhancements</p>
        </div>
        <div class="stat-card">
            <div class="icon"><i class="fas fa-rocket"></i></div>
            <h3>${overallStats.latestReleaseNumber || 'N/A'}</h3>
            <p>Latest Release</p>
        </div>
    `;
}

function renderSuccessRates(overallStats) {
    const container = document.getElementById('successRates');
    if (!container) {
        console.error('Success rates container not found');
        return;
    }

    if (!overallStats) {
        console.error('Overall stats data is missing');
        container.innerHTML = '<div class="empty-state">No data available</div>';
        return;
    }

    const userStoryRate = overallStats.userStorySuccessRate || 0;
    const testCaseRate = overallStats.testCaseSuccessRate || 0;
    const issueFixRate = overallStats.issueFixRate || 0;
    const enhancementRate = overallStats.enhancementCompletionRate || 0;

    container.innerHTML = `
        <div class="success-rate-card">
            <div class="rate-value">${userStoryRate}%</div>
            <div class="rate-label">User Story Success Rate</div>
            <div class="rate-progress">
                <div class="rate-progress-fill" style="width: ${userStoryRate}%"></div>
            </div>
        </div>
        <div class="success-rate-card">
            <div class="rate-value">${testCaseRate}%</div>
            <div class="rate-label">Test Case Success Rate</div>
            <div class="rate-progress">
                <div class="rate-progress-fill" style="width: ${testCaseRate}%"></div>
            </div>
        </div>
        <div class="success-rate-card">
            <div class="rate-value">${issueFixRate}%</div>
            <div class="rate-label">Issue Fix Rate</div>
            <div class="rate-progress">
                <div class="rate-progress-fill" style="width: ${issueFixRate}%"></div>
            </div>
        </div>
        <div class="success-rate-card">
            <div class="rate-value">${enhancementRate}%</div>
            <div class="rate-label">Enhancement Completion Rate</div>
            <div class="rate-progress">
                <div class="rate-progress-fill" style="width: ${enhancementRate}%"></div>
            </div>
        </div>
    `;
}

function renderQualityMetrics(overallStats) {
    const container = document.getElementById('qualityMetrics');
    if (!container) {
        console.error('Quality metrics container not found');
        return;
    }

    if (!overallStats) {
        console.error('Overall stats data is missing');
        container.innerHTML = '<div class="empty-state">No data available</div>';
        return;
    }

    // Evaluation scores have been removed as per user request
    const passedUserStories = overallStats.passedUserStories || 0;
    const passedTestCases = overallStats.passedTestCases || 0;
    const fixedIssues = overallStats.fixedIssues || 0;
    const implementedEnhancements = overallStats.implementedEnhancements || 0;

    container.innerHTML = `
        <div class="quality-metric-card">
            <div class="metric-header">
                <div class="metric-icon"><i class="fas fa-check-circle"></i></div>
                <div class="metric-title">Passed Items</div>
            </div>
            <div class="metric-value">${passedUserStories + passedTestCases}</div>
            <div class="metric-description">Total user stories and test cases passed</div>
        </div>
        <div class="quality-metric-card">
            <div class="metric-header">
                <div class="metric-icon"><i class="fas fa-tools"></i></div>
                <div class="metric-title">Resolved Items</div>
            </div>
            <div class="metric-value">${fixedIssues + implementedEnhancements}</div>
            <div class="metric-description">Total issues fixed and enhancements implemented</div>
        </div>
    `;
}

function renderProjectCharts(chartData) {
    if (!window.Chart) {
        console.error('Chart.js is not loaded');
        return;
    }

    if (!chartData) {
        console.error('Chart data is missing');
        return;
    }

    const chartConfigs = [
        { id: 'projectUserStoriesChart', data: chartData.userStories },
        { id: 'projectTestCasesChart', data: chartData.testCases },
        { id: 'projectIssuesPriorityChart', data: chartData.issuesPriority },
        { id: 'projectIssuesStatusChart', data: chartData.issuesStatus }
    ];

    chartConfigs.forEach(config => {
        try {
            const canvas = document.getElementById(config.id);
            if (!canvas) {
                console.error(`Canvas element ${config.id} not found`);
                return;
            }

            if (!config.data || !config.data.datasets || !config.data.datasets[0] || !config.data.datasets[0].data) {
                console.error(`Invalid chart data for ${config.id}`);
                return;
            }

            // Destroy existing chart if it exists
            if (projectCharts[config.id]) {
                projectCharts[config.id].destroy();
            }

            // Create new chart instance
            projectCharts[config.id] = new Chart(canvas.getContext('2d'), {
                type: 'doughnut',
                data: config.data,
                options: getDashboardChartOptions()
            });
        } catch (error) {
            console.error(`Error creating chart ${config.id}:`, error);
        }
    });
}

function renderAdditionalCharts(overallStats) {
    if (!window.Chart) {
        console.error('Chart.js is not loaded');
        return;
    }

    if (!overallStats) {
        console.error('Overall stats data is missing');
        return;
    }
    
    // Clear any existing charts to prevent memory leaks
    const additionalChartIds = [
        'projectSuccessRatesChart',
        'projectQualityTrendsChart',
        'projectAutomationTestCasesChart',
        'projectAutomationStabilityChart'
    ];
    
    additionalChartIds.forEach(chartId => {
        if (projectCharts[chartId]) {
            projectCharts[chartId].destroy();
            delete projectCharts[chartId];
        }
    });

    // Success Rates Overview Chart
    try {
        const successRatesCanvas = document.getElementById('projectSuccessRatesChart');
        if (!successRatesCanvas) {
            console.error('Success rates chart canvas not found');
            return;
        }

        const isLightTheme = window.themeManager ? window.themeManager.isLightTheme() : true;
        const textColor = isLightTheme ? '#1e293b' : '#f1f5f9';
        const gridColor = isLightTheme ? '#e2e8f0' : '#334155';
        const tooltipBg = isLightTheme ? '#ffffff' : '#334155';
        
        projectCharts['successRates'] = new Chart(successRatesCanvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['User Stories', 'Test Cases', 'Issues Fixed', 'Enhancements'],
            datasets: [{
                label: 'Success Rate %',
                data: [
                    overallStats.userStorySuccessRate || 0,
                    overallStats.testCaseSuccessRate || 0,
                    overallStats.issueFixRate || 0,
                    overallStats.enhancementCompletionRate || 0
                ],
                backgroundColor: [
                    '#4CAF50',
                    '#2196F3',
                    '#FF9800',
                    '#9C27B0'
                ],
                borderColor: [
                    '#4CAF50',
                    '#2196F3',
                    '#FF9800',
                    '#9C27B0'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: textColor,
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: gridColor
                    },
                    title: {
                        color: textColor
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    },
                    title: {
                        color: textColor
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    titleColor: textColor,
                    bodyColor: textColor,
                    backgroundColor: tooltipBg,
                    borderColor: gridColor,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + '%';
                        }
                    }
                }
            }
        }
    });
    } catch (error) {
        console.error('Error creating success rates chart:', error);
    }

    // Quality Trends Chart
    try {
        const qualityTrendsCanvas = document.getElementById('projectQualityTrendsChart');
        if (!qualityTrendsCanvas) {
            console.error('Quality trends chart canvas not found');
            return;
        }

        const isLightTheme2 = window.themeManager ? window.themeManager.isLightTheme() : true;
        const textColor2 = isLightTheme2 ? '#1e293b' : '#f1f5f9';
        const gridColor2 = isLightTheme2 ? '#e2e8f0' : '#334155';
        const tooltipBg2 = isLightTheme2 ? '#ffffff' : '#334155';
        const pointBorderColor = isLightTheme2 ? '#1e293b' : '#fff';
        
        projectCharts['qualityTrends'] = new Chart(qualityTrendsCanvas.getContext('2d'), {
        type: 'radar',
        data: {
            labels: ['Success Rate', 'Test Coverage', 'Issue Resolution'],
            datasets: [{
                label: 'Quality Metrics',
                data: [
                    ((overallStats.userStorySuccessRate || 0) + (overallStats.testCaseSuccessRate || 0)) / 2,
                    (overallStats.testCaseSuccessRate || 0), // Using test case success rate as a proxy for test coverage
                    (overallStats.issueFixRate || 0) // Issue resolution rate
                ],
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                borderColor: '#8b5cf6',
                borderWidth: 2,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: pointBorderColor,
                pointHoverBackgroundColor: pointBorderColor,
                pointHoverBorderColor: '#8b5cf6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: textColor2,
                        stepSize: 20
                    },
                    grid: {
                        color: gridColor2
                    },
                    pointLabels: {
                        color: textColor2,
                        font: {
                            size: 10
                        }
                    },
                    angleLines: {
                        color: gridColor2
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    titleColor: textColor2,
                    bodyColor: textColor2,
                    backgroundColor: tooltipBg2,
                    borderColor: gridColor2,
                    borderWidth: 1
                }
            }
        }
    });
    } catch (error) {
        console.error('Error creating quality trends chart:', error);
    }

    // Automation Test Cases Chart
    try {
        const automationTestCasesCanvas = document.getElementById('projectAutomationTestCasesChart');
        if (!automationTestCasesCanvas) {
            console.error('Automation test cases chart canvas not found');
            return;
        }

        const isLightTheme3 = window.themeManager ? window.themeManager.isLightTheme() : true;
        const borderColor3 = isLightTheme3 ? '#ffffff' : '#1e293b';
        const textColor3 = isLightTheme3 ? '#1e293b' : '#f1f5f9';
        const tooltipBg3 = isLightTheme3 ? '#ffffff' : '#334155';
        const gridColor3 = isLightTheme3 ? '#e2e8f0' : '#334155';

        projectCharts['automationTestCases'] = new Chart(automationTestCasesCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed', 'Skipped'],
                datasets: [{
                    data: [
                        overallStats.automationPassedTestCases || 0,
                        overallStats.automationFailedTestCases || 0,
                        overallStats.automationSkippedTestCases || 0
                    ],
                    backgroundColor: ['#4CAF50', '#F44336', '#FF9800'],
                    borderWidth: 3,
                    borderColor: borderColor3
                }]
            },
            options: {
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
                            color: textColor3
                        }
                    },
                    tooltip: {
                        titleColor: textColor3,
                        bodyColor: textColor3,
                        backgroundColor: tooltipBg3,
                        borderColor: gridColor3,
                        borderWidth: 1
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating automation test cases chart:', error);
    }

    // Automation Stability Chart
    try {
        const automationStabilityCanvas = document.getElementById('projectAutomationStabilityChart');
        if (!automationStabilityCanvas) {
            console.error('Automation stability chart canvas not found');
            return;
        }

        const isLightTheme4 = window.themeManager ? window.themeManager.isLightTheme() : true;
        const borderColor4 = isLightTheme4 ? '#ffffff' : '#1e293b';
        const textColor4 = isLightTheme4 ? '#1e293b' : '#f1f5f9';
        const tooltipBg4 = isLightTheme4 ? '#ffffff' : '#334155';
        const gridColor4 = isLightTheme4 ? '#e2e8f0' : '#334155';

        projectCharts['automationStability'] = new Chart(automationStabilityCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Stable', 'Flaky'],
                datasets: [{
                    data: [
                        overallStats.automationStableTests || 0,
                        overallStats.automationFlakyTests || 0
                    ],
                    backgroundColor: ['#4CAF50', '#E91E63'],
                    borderWidth: 3,
                    borderColor: borderColor4
                }]
            },
            options: {
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
                            color: textColor4
                        }
                    },
                    tooltip: {
                        titleColor: textColor4,
                        bodyColor: textColor4,
                        backgroundColor: tooltipBg4,
                        borderColor: gridColor4,
                        borderWidth: 1
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating automation stability chart:', error);
    }
}

function renderProjectTesters(testers) {
    const container = document.getElementById('projectTesters');
    if (!container) {
        console.error('Project testers container not found');
        return;
    }

    if (!testers || !Array.isArray(testers)) {
        console.error('Testers data is missing or invalid');
        container.innerHTML = '<div class="empty-state">No testers data available</div>';
        return;
    }

    if (testers.length === 0) {
        container.innerHTML = '<div class="empty-state">No testers assigned to this project</div>';
        return;
    }

    container.innerHTML = testers.map(tester => `
        <div class="tester-card">
            <h3>${tester.name || 'Unknown'}</h3>
            <p>${tester.email || 'No email'}</p>
        </div>
    `).join('');
}

function renderProjectReports(reports) {
    const container = document.getElementById('projectReports');
    if (!container) {
        console.error('Project reports container not found');
        return;
    }

    if (!reports || !Array.isArray(reports)) {
        console.error('Reports data is missing or invalid');
        container.innerHTML = '<div class="empty-state">No reports data available</div>';
        return;
    }

    if (reports.length === 0) {
        container.innerHTML = '<div class="empty-state">No reports found for this project</div>';
        return;
    }

    container.innerHTML = reports.map(report => `
        <div class="report-card">
            <h3>Report #${report.id || 'Unknown'}</h3>
            <p>Date: ${report.reportDate || 'N/A'}</p>
            <p>Version: ${report.reportVersion || 'N/A'}</p>
        </div>
    `).join('');
}

function renderProjectTimeStats(timeStats) {
    const container = document.getElementById('projectTimeStats');
    if (!container) {
        console.error('Project time stats container not found');
        return;
    }

    if (!timeStats || typeof timeStats !== 'object') {
        console.error('Time stats data is missing or invalid');
        container.innerHTML = '<div class="empty-state">No time statistics available</div>';
        return;
    }

    const monthlyStats = timeStats.monthly || {};
    const quarterlyStats = timeStats.quarterly || {};

    container.innerHTML = `
        <div class="time-stat-card">
            <h3>Reports per Month</h3>
            <ul>
                ${Object.keys(monthlyStats).length > 0 ? 
                    Object.entries(monthlyStats).map(([month, count]) => `<li>${month}: ${count}</li>`).join('') :
                    '<li>No monthly data available</li>'
                }
            </ul>
        </div>
        <div class="time-stat-card">
            <h3>Reports per Quarter</h3>
            <ul>
                ${Object.keys(quarterlyStats).length > 0 ? 
                    Object.entries(quarterlyStats).map(([quarter, count]) => `<li>${quarter}: ${count}</li>`).join('') :
                    '<li>No quarterly data available</li>'
                }
            </ul>
        </div>
    `;
}

function getDashboardChartOptions() {
    // Get theme-appropriate colors using robust detection
    const isLightTheme = window.isCurrentThemeLight ? window.isCurrentThemeLight() : true;
    
    const textColor = isLightTheme ? '#1e293b' : '#f1f5f9';
    const tooltipBg = isLightTheme ? '#ffffff' : '#334155';
    const gridColor = isLightTheme ? '#e2e8f0' : '#334155';
    
    console.log('Project stats chart options - isLightTheme:', isLightTheme, 'textColor:', textColor);
    
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
