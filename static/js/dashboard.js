// static/js/dashboard.js
// Dashboard Functions

function updateDashboardStats(stats) {
    console.log('Dashboard stats received:', stats); // Debug log
    if (!stats) {
        console.error('No stats provided to updateDashboardStats');
        return;
    }

    // Update overall statistics
    if (stats.overall) {
        const elements = {
            'totalReports': stats.overall.totalReports || 0,
            'completedReports': stats.overall.completedReports || 0,
            'inProgressReports': stats.overall.inProgressReports || 0,
            'pendingReports': stats.overall.pendingReports || 0,
            'totalUserStories': stats.overall.totalUserStories || 0,
            'totalTestCases': stats.overall.totalTestCases || 0,
            'totalIssues': stats.overall.totalIssues || 0,
            'totalEnhancements': stats.overall.totalEnhancements || 0,
            'automationTotalTestCases': stats.overall.automationTotalTestCases || 0,
            'automationPassedTestCases': stats.overall.automationPassedTestCases || 0
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value.toLocaleString();
            }
        });

        // Calculate and update automation pass rate
        const automationPassRate = document.getElementById('automationPassRate');
        if (automationPassRate && stats.overall.automationTotalTestCases > 0) {
            const rate = ((stats.overall.automationPassedTestCases / stats.overall.automationTotalTestCases) * 100).toFixed(1);
            automationPassRate.textContent = `${rate}%`;
        } else if (automationPassRate) {
            automationPassRate.textContent = '0%';
        }
    }

    // Update project metrics if available
    if (stats.projects && Array.isArray(stats.projects)) {
        renderProjectMetrics(stats.projects);
    }
}

function renderProjectMetrics(projects) {
    const container = document.getElementById('projectMetrics');
    if (!container) {
        console.log('Project metrics container not found');
        return;
    }

    if (!projects || projects.length === 0) {
        container.innerHTML = '<div class="no-data">No project data available</div>';
        return;
    }

    console.log(`Rendering metrics for ${projects.length} projects`);

    let html = '';
    projects.forEach(project => {
        // Calculate pass rates with fallback for missing data
        const userStoriesTotal = (project.passedUserStories || 0) + (project.failedUserStories || 0) + (project.blockedUserStories || 0);
        const testCasesTotal = (project.passedTestCases || 0) + (project.failedTestCases || 0) + (project.blockedTestCases || 0);
        const issuesTotal = (project.criticalIssues || 0) + (project.highIssues || 0) + (project.mediumIssues || 0) + (project.lowIssues || 0);

        const userStoriesPassRate = userStoriesTotal > 0 ? ((project.passedUserStories || 0) / userStoriesTotal * 100) : 0;
        const testCasesPassRate = testCasesTotal > 0 ? ((project.passedTestCases || 0) / testCasesTotal * 100) : 0;
        const issuesResolvedRate = issuesTotal > 0 ? ((project.fixedIssues || 0) / issuesTotal * 100) : 0;

        // Automation metrics with fallback
        const automationTotal = (project.automationPassedTestCases || 0) + (project.automationFailedTestCases || 0) + (project.automationSkippedTestCases || 0);
        const automationPassRate = automationTotal > 0 ? ((project.automationPassedTestCases || 0) / automationTotal * 100) : 0;

        html += `
            <div class="project-card">
                <div class="project-header">
                    <h3 class="project-name">${project.projectName || 'Unknown Project'}</h3>
                    <span class="portfolio-badge">${project.portfolioName || 'Unknown Portfolio'}</span>
                </div>
                <div class="project-stats">
                    <div class="stat-row">
                        <div class="stat-item">
                            <div class="stat-label">Reports</div>
                            <div class="stat-value">${project.totalReports || 0}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">User Stories</div>
                            <div class="stat-value">${userStoriesTotal}</div>
                            <div class="stat-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${userStoriesPassRate}%; background-color: ${getProgressBarColor(userStoriesPassRate)}"></div>
                                </div>
                                <span class="progress-text ${getRateClass(userStoriesPassRate)}">${userStoriesPassRate.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="stat-row">
                        <div class="stat-item">
                            <div class="stat-label">Test Cases</div>
                            <div class="stat-value">${testCasesTotal}</div>
                            <div class="stat-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${testCasesPassRate}%; background-color: ${getProgressBarColor(testCasesPassRate)}"></div>
                                </div>
                                <span class="progress-text ${getRateClass(testCasesPassRate)}">${testCasesPassRate.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Issues</div>
                            <div class="stat-value">${issuesTotal}</div>
                            <div class="stat-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${issuesResolvedRate}%; background-color: ${getProgressBarColor(issuesResolvedRate)}"></div>
                                </div>
                                <span class="progress-text ${getRateClass(issuesResolvedRate)}">${issuesResolvedRate.toFixed(1)}% resolved</span>
                            </div>
                        </div>
                    </div>
        `;

        // Only show automation metrics if there's automation data
        if (automationTotal > 0) {
            html += `
                    <div class="stat-row">
                        <div class="stat-item">
                            <div class="stat-label">Automation</div>
                            <div class="stat-value">${automationTotal}</div>
                            <div class="stat-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${automationPassRate}%; background-color: ${getProgressBarColor(automationPassRate)}"></div>
                                </div>
                                <span class="progress-text ${getRateClass(automationPassRate)}">${automationPassRate.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Enhancements</div>
                            <div class="stat-value">${(project.newEnhancements || 0) + (project.implementedEnhancements || 0) + (project.existsEnhancements || 0)}</div>
                        </div>
                    </div>
            `;
        } else {
            html += `
                    <div class="stat-row">
                        <div class="stat-item">
                            <div class="stat-label">Enhancements</div>
                            <div class="stat-value">${(project.newEnhancements || 0) + (project.implementedEnhancements || 0) + (project.existsEnhancements || 0)}</div>
                        </div>
                    </div>
            `;
        }

        html += `
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    console.log('Project metrics rendered successfully');
}

// Make functions globally accessible
window.updateDashboardStats = updateDashboardStats;
window.renderProjectMetrics = renderProjectMetrics;