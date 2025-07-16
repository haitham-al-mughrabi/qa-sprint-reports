let projects = [];
let selectedProjectId = null;

document.addEventListener('DOMContentLoaded', () => {
    const projectSearchInput = document.getElementById('projectSearchInput');
    const loadProjectStatsBtn = document.getElementById('loadProjectStatsBtn');

    // Fetch projects and populate the dropdown
    fetch('/api/projects')
        .then(response => response.json())
        .then(data => {
            projects = data;
            renderProjectDropdown(projects);
        });

    loadProjectStatsBtn.addEventListener('click', () => {
        if (selectedProjectId) {
            loadProjectStatistics(selectedProjectId);
        }
    });
});

function renderProjectDropdown(projectsToRender) {
    const dropdownContent = document.getElementById('projectDropdownContent');
    dropdownContent.innerHTML = '';
    projectsToRender.forEach(project => {
        const a = document.createElement('a');
        a.href = "#";
        a.textContent = project.name;
        a.onclick = () => selectProject(project);
        dropdownContent.appendChild(a);
    });
    dropdownContent.style.display = 'block';
}

function filterProjects() {
    const filter = document.getElementById('projectSearchInput').value.toUpperCase();
    const filteredProjects = projects.filter(p => p.name.toUpperCase().includes(filter));
    renderProjectDropdown(filteredProjects);
}

function selectProject(project) {
    selectedProjectId = project.id;
    document.getElementById('projectSearchInput').value = project.name;
    document.getElementById('projectDropdownContent').style.display = 'none';
}

function loadProjectStatistics(projectId) {
    fetch(`/api/project-stats/${projectId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(stats => {
            document.getElementById('projectStatsContent').style.display = 'block';
            renderProjectOverallStats(stats.overall);
            renderSuccessRates(stats.overall);
            renderQualityMetrics(stats.overall);
            renderProjectCharts(stats.charts);
            renderAdditionalCharts(stats.overall);
            renderProjectTesters(stats.testers);
            renderProjectReports(stats.reports);
            renderProjectTimeStats(stats.time_stats);
        })
        .catch(error => {
            console.error('Error loading project statistics:', error);
            document.getElementById('projectStatsContent').innerHTML = `
                <div class="empty-state">
                    <span class="icon">⚠️</span>
                    <h3>Error Loading Statistics</h3>
                    <p>Failed to load project data. Please ensure the project has reports and try again.</p>
                </div>
            `;
        });
}

function renderProjectOverallStats(overallStats) {
    const container = document.getElementById('projectStatsOverall');
    container.innerHTML = `
        <div class="stat-card">
            <div class="icon"><i class="fas fa-file-alt"></i></div>
            <h3>${overallStats.totalReports}</h3>
            <p>Total Reports</p>
        </div>
        <div class="stat-card">
            <div class="icon"><i class="fas fa-user-check"></i></div>
            <h3>${overallStats.totalUserStories}</h3>
            <p>Total User Stories</p>
        </div>
        <div class="stat-card">
            <div class="icon"><i class="fas fa-flask"></i></div>
            <h3>${overallStats.totalTestCases}</h3>
            <p>Total Test Cases</p>
        </div>
        <div class="stat-card">
            <div class="icon"><i class="fas fa-exclamation-triangle"></i></div>
            <h3>${overallStats.totalIssues}</h3>
            <p>Total Issues</p>
        </div>
        <div class="stat-card">
            <div class="icon"><i class="fas fa-magic"></i></div>
            <h3>${overallStats.totalEnhancements}</h3>
            <p>Total Enhancements</p>
        </div>
        <div class="stat-card">
            <div class="icon"><i class="fas fa-rocket"></i></div>
            <h3>${overallStats.latestReleaseNumber}</h3>
            <p>Latest Release</p>
        </div>
    `;
}

function renderSuccessRates(overallStats) {
    const container = document.getElementById('successRates');
    container.innerHTML = `
        <div class="success-rate-card">
            <div class="rate-value">${overallStats.userStorySuccessRate}%</div>
            <div class="rate-label">User Story Success Rate</div>
            <div class="rate-progress">
                <div class="rate-progress-fill" style="width: ${overallStats.userStorySuccessRate}%"></div>
            </div>
        </div>
        <div class="success-rate-card">
            <div class="rate-value">${overallStats.testCaseSuccessRate}%</div>
            <div class="rate-label">Test Case Success Rate</div>
            <div class="rate-progress">
                <div class="rate-progress-fill" style="width: ${overallStats.testCaseSuccessRate}%"></div>
            </div>
        </div>
        <div class="success-rate-card">
            <div class="rate-value">${overallStats.issueFixRate}%</div>
            <div class="rate-label">Issue Fix Rate</div>
            <div class="rate-progress">
                <div class="rate-progress-fill" style="width: ${overallStats.issueFixRate}%"></div>
            </div>
        </div>
        <div class="success-rate-card">
            <div class="rate-value">${overallStats.enhancementCompletionRate}%</div>
            <div class="rate-label">Enhancement Completion Rate</div>
            <div class="rate-progress">
                <div class="rate-progress-fill" style="width: ${overallStats.enhancementCompletionRate}%"></div>
            </div>
        </div>
    `;
}

function renderQualityMetrics(overallStats) {
    const container = document.getElementById('qualityMetrics');
    container.innerHTML = `
        <div class="quality-metric-card">
            <div class="metric-header">
                <div class="metric-icon"><i class="fas fa-star"></i></div>
                <div class="metric-title">Average Evaluation Score</div>
            </div>
            <div class="metric-value">${overallStats.avgEvaluationScore}</div>
            <div class="metric-description">Overall quality assessment across all reports</div>
        </div>
        <div class="quality-metric-card">
            <div class="metric-header">
                <div class="metric-icon"><i class="fas fa-project-diagram"></i></div>
                <div class="metric-title">Project Evaluation Score</div>
            </div>
            <div class="metric-value">${overallStats.avgProjectEvaluationScore}</div>
            <div class="metric-description">Average project-level evaluation score</div>
        </div>
        <div class="quality-metric-card">
            <div class="metric-header">
                <div class="metric-icon"><i class="fas fa-check-circle"></i></div>
                <div class="metric-title">Passed Items</div>
            </div>
            <div class="metric-value">${overallStats.passedUserStories + overallStats.passedTestCases}</div>
            <div class="metric-description">Total user stories and test cases passed</div>
        </div>
        <div class="quality-metric-card">
            <div class="metric-header">
                <div class="metric-icon"><i class="fas fa-tools"></i></div>
                <div class="metric-title">Resolved Items</div>
            </div>
            <div class="metric-value">${overallStats.fixedIssues + overallStats.implementedEnhancements}</div>
            <div class="metric-description">Total issues fixed and enhancements implemented</div>
        </div>
    `;
}

function renderProjectCharts(chartData) {
    new Chart(document.getElementById('projectUserStoriesChart').getContext('2d'), {
        type: 'doughnut',
        data: chartData.userStories,
        options: getDashboardChartOptions()
    });

    new Chart(document.getElementById('projectTestCasesChart').getContext('2d'), {
        type: 'doughnut',
        data: chartData.testCases,
        options: getDashboardChartOptions()
    });

    new Chart(document.getElementById('projectIssuesPriorityChart').getContext('2d'), {
        type: 'doughnut',
        data: chartData.issuesPriority,
        options: getDashboardChartOptions()
    });

    new Chart(document.getElementById('projectIssuesStatusChart').getContext('2d'), {
        type: 'doughnut',
        data: chartData.issuesStatus,
        options: getDashboardChartOptions()
    });
}

function renderAdditionalCharts(overallStats) {
    // Success Rates Overview Chart
    new Chart(document.getElementById('projectSuccessRatesChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['User Stories', 'Test Cases', 'Issues Fixed', 'Enhancements'],
            datasets: [{
                label: 'Success Rate %',
                data: [
                    overallStats.userStorySuccessRate,
                    overallStats.testCaseSuccessRate,
                    overallStats.issueFixRate,
                    overallStats.enhancementCompletionRate
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
                        color: '#f1f5f9',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(241, 245, 249, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#f1f5f9'
                    },
                    grid: {
                        color: 'rgba(241, 245, 249, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    titleColor: '#f1f5f9',
                    bodyColor: '#f1f5f9',
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
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

    // Quality Trends Chart
    new Chart(document.getElementById('projectQualityTrendsChart').getContext('2d'), {
        type: 'radar',
        data: {
            labels: ['Evaluation Score', 'Project Score', 'Success Rate', 'Completion Rate'],
            datasets: [{
                label: 'Quality Metrics',
                data: [
                    overallStats.avgEvaluationScore * 10, // Scale to 0-100
                    overallStats.avgProjectEvaluationScore * 10, // Scale to 0-100
                    (overallStats.userStorySuccessRate + overallStats.testCaseSuccessRate) / 2,
                    (overallStats.issueFixRate + overallStats.enhancementCompletionRate) / 2
                ],
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                borderColor: '#8b5cf6',
                borderWidth: 2,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
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
                        color: '#f1f5f9',
                        stepSize: 20
                    },
                    grid: {
                        color: 'rgba(241, 245, 249, 0.1)'
                    },
                    pointLabels: {
                        color: '#f1f5f9',
                        font: {
                            size: 10
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    titleColor: '#f1f5f9',
                    bodyColor: '#f1f5f9',
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    borderWidth: 1
                }
            }
        }
    });
}

function renderProjectTesters(testers) {
    const container = document.getElementById('projectTesters');
    container.innerHTML = testers.map(tester => `
        <div class="tester-card">
            <h3>${tester.name}</h3>
            <p>${tester.email}</p>
        </div>
    `).join('');
}

function renderProjectReports(reports) {
    const container = document.getElementById('projectReports');
    container.innerHTML = reports.map(report => `
        <div class="report-card">
            <h3>Report #${report.id}</h3>
            <p>Date: ${report.reportDate}</p>
            <p>Version: ${report.reportVersion}</p>
        </div>
    `).join('');
}

function renderProjectTimeStats(timeStats) {
    const container = document.getElementById('projectTimeStats');
    container.innerHTML = `
        <div class="time-stat-card">
            <h3>Reports per Month</h3>
            <ul>
                ${Object.entries(timeStats.monthly).map(([month, count]) => `<li>${month}: ${count}</li>`).join('')}
            </ul>
        </div>
        <div class="time-stat-card">
            <h3>Reports per Quarter</h3>
            <ul>
                ${Object.entries(timeStats.quarterly).map(([quarter, count]) => `<li>${quarter}: ${count}</li>`).join('')}
            </ul>
        </div>
    `;
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
