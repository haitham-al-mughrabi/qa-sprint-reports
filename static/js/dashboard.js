export function updateDashboardStats(stats) {
    console.log('Dashboard stats received:', stats);
    if (!stats) {
        console.error('No stats data received');
        return;
    }

    const totalReportsEl = document.getElementById('totalReports');
    if (!totalReportsEl) {
        console.error('Not on dashboard page or totalReports element not found');
        return;
    }

    const overall = stats.overall || {};
    totalReportsEl.textContent = overall.totalReports || 0;
    document.getElementById('completedReports').textContent = overall.completedReports || 0;
    document.getElementById('inProgressReports').textContent = overall.inProgressReports || 0;
    document.getElementById('pendingReports').textContent = overall.pendingReports || 0;

    document.getElementById('totalUserStories').textContent = overall.totalUserStories || 0;
    document.getElementById('totalTestCases').textContent = overall.totalTestCases || 0;
    document.getElementById('totalIssues').textContent = overall.totalIssues || 0;
    document.getElementById('totalEnhancements').textContent = overall.totalEnhancements || 0;

    document.getElementById('totalAutomationTests').textContent = overall.automationTotalTestCases || 0;
    const automationTotal = overall.automationTotalTestCases || 0;
    const automationPassed = overall.automationPassedTestCases || 0;
    const automationPassRate = automationTotal > 0 ? Math.round((automationPassed / automationTotal) * 100) : 0;
    document.getElementById('automationPassRate').textContent = `${automationPassRate}%`;

    console.log('Projects data in updateDashboardStats:', stats.projects);
    renderProjectMetrics(stats.projects || []);
}


export function renderProjectMetrics(projects) {
    const container = document.getElementById('projectMetrics');
    if (!container) {
        console.error('Project metrics container not found');
        return;
    }
    
    // Debug log the projects data being rendered
    console.log('Rendering projects:', projects);
    
    if (!projects || projects.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; color: #6c757d; padding: 40px 0; grid-column: 1 / -1;">
                <div style="font-size: 3em; margin-bottom: 20px;"><i class="fas fa-chart-bar"></i></div>
                <h3>No Project Data Available</h3>
                <p>No project metrics data was found. Create some reports to see metrics here.</p>
            </div>
        `;
        return;
    }    

    // Check if we have detailed breakdown data
    const hasDetailedData = projects.length > 0 &&
        (projects[0].passedUserStories !== undefined ||
        projects[0].passedTestCases !== undefined ||
        projects[0].criticalIssues !== undefined);


    console.log('Has detailed breakdown data:', hasDetailedData);

    if (hasDetailedData) {
        // Render full detailed project cards
        container.innerHTML = projects.map(project => `
            <div class="project-metric-card">
                <div class="project-header">
                    <div class="project-title-section">
                        <div class="project-icon">
                            <i class="fas fa-rocket"></i>
                        </div>
                        <div class="project-info">
                            <h3>${project.projectName}</h3>
                            <p class="portfolio-name">${project.portfolioName}</p>
                        </div>
                    </div>
                    <div class="status-badges">
                        <span class="status-badge status-${getStatusClass(project.testingStatus)}">${getStatusText(project.testingStatus)}</span>
                        <span class="risk-badge risk-${project.riskLevel?.toLowerCase() || 'low'}">${project.riskLevel || 'Low'} Risk</span>
                    </div>
                </div>

            <!-- Project Summary Stats -->
            <div class="project-summary">
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="summary-icon">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <div class="summary-content">
                            <span class="summary-value">${project.totalReports || 0}</span>
                            <span class="summary-label">Reports</span>
                        </div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-icon">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div class="summary-content">
                            <span class="summary-value">${formatDate(project.lastReportDate)}</span>
                            <span class="summary-label">Last Report</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Complete Project Metrics - ALL DATA -->
            <div class="project-metrics">
                <!-- User Stories - COMPLETE -->
                <div class="metrics-section">
                    <h4 class="metrics-title">
                        <i class="fas fa-user-check"></i> User Stories (${project.totalUserStories || 0} Total)
                    </h4>
                    <div class="metrics-content">
                        <div class="complete-breakdown">
                            <div class="breakdown-grid">
                                <div class="breakdown-item success">
                                    <span class="breakdown-label">Passed</span>
                                    <span class="breakdown-value">${project.passedUserStories || 0}</span>
                                </div>
                                <div class="breakdown-item warning">
                                    <span class="breakdown-label">Passed w/ Issues</span>
                                    <span class="breakdown-value">${project.passedWithIssuesUserStories || 0}</span>
                                </div>
                                <div class="breakdown-item error">
                                    <span class="breakdown-label">Failed</span>
                                    <span class="breakdown-value">${project.failedUserStories || 0}</span>
                                </div>
                                <div class="breakdown-item blocked">
                                    <span class="breakdown-label">Blocked</span>
                                    <span class="breakdown-value">${project.blockedUserStories || 0}</span>
                                </div>
                                <div class="breakdown-item cancelled">
                                    <span class="breakdown-label">Cancelled</span>
                                    <span class="breakdown-value">${project.cancelledUserStories || 0}</span>
                                </div>
                                <div class="breakdown-item deferred">
                                    <span class="breakdown-label">Deferred</span>
                                    <span class="breakdown-value">${project.deferredUserStories || 0}</span>
                                </div>
                                <div class="breakdown-item not-testable">
                                    <span class="breakdown-label">Not Testable</span>
                                    <span class="breakdown-value">${project.notTestableUserStories || 0}</span>
                                </div>
                            </div>
                            <div class="success-rate">
                                <span class="rate-label">Success Rate:</span>
                                <span class="rate-value rate-${getRateClass(project.userStoriesSuccessRate || 0)}">${project.userStoriesSuccessRate || 0}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Test Cases - COMPLETE -->
                <div class="metrics-section">
                    <h4 class="metrics-title">
                        <i class="fas fa-flask"></i> Test Cases (${project.totalTestCases || 0} Total)
                    </h4>
                    <div class="metrics-content">
                        <div class="complete-breakdown">
                            <div class="breakdown-grid">
                                <div class="breakdown-item success">
                                    <span class="breakdown-label">Passed</span>
                                    <span class="breakdown-value">${project.passedTestCases || 0}</span>
                                </div>
                                <div class="breakdown-item warning">
                                    <span class="breakdown-label">Passed w/ Issues</span>
                                    <span class="breakdown-value">${project.passedWithIssuesTestCases || 0}</span>
                                </div>
                                <div class="breakdown-item error">
                                    <span class="breakdown-label">Failed</span>
                                    <span class="breakdown-value">${project.failedTestCases || 0}</span>
                                </div>
                                <div class="breakdown-item blocked">
                                    <span class="breakdown-label">Blocked</span>
                                    <span class="breakdown-value">${project.blockedTestCases || 0}</span>
                                </div>
                                <div class="breakdown-item cancelled">
                                    <span class="breakdown-label">Cancelled</span>
                                    <span class="breakdown-value">${project.cancelledTestCases || 0}</span>
                                </div>
                                <div class="breakdown-item deferred">
                                    <span class="breakdown-label">Deferred</span>
                                    <span class="breakdown-value">${project.deferredTestCases || 0}</span>
                                </div>
                                <div class="breakdown-item not-testable">
                                    <span class="breakdown-label">Not Testable</span>
                                    <span class="breakdown-value">${project.notTestableTestCases || 0}</span>
                                </div>
                            </div>
                            <div class="success-rate">
                                <span class="rate-label">Success Rate:</span>
                                <span class="rate-value rate-${getRateClass(project.testCasesSuccessRate || 0)}">${project.testCasesSuccessRate || 0}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Issues - COMPLETE BY PRIORITY & STATUS -->
                <div class="metrics-section">
                    <h4 class="metrics-title">
                        <i class="fas fa-bug"></i> Issues (${project.totalIssues || 0} Total)
                    </h4>
                    <div class="metrics-content">
                        <div class="issues-breakdown">
                            <div class="issues-section">
                                <h5 class="breakdown-title">By Priority</h5>
                                <div class="breakdown-grid priority-grid">
                                    <div class="breakdown-item critical">
                                        <span class="breakdown-label">Critical</span>
                                        <span class="breakdown-value">${project.criticalIssues || 0}</span>
                                    </div>
                                    <div class="breakdown-item high-priority">
                                        <span class="breakdown-label">High</span>
                                        <span class="breakdown-value">${project.highIssues || 0}</span>
                                    </div>
                                    <div class="breakdown-item medium">
                                        <span class="breakdown-label">Medium</span>
                                        <span class="breakdown-value">${project.mediumIssues || 0}</span>
                                    </div>
                                    <div class="breakdown-item low">
                                        <span class="breakdown-label">Low</span>
                                        <span class="breakdown-value">${project.lowIssues || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="issues-section">
                                <h5 class="breakdown-title">By Status</h5>
                                <div class="breakdown-grid status-grid">
                                    <div class="breakdown-item new">
                                        <span class="breakdown-label">New</span>
                                        <span class="breakdown-value">${project.newIssues || 0}</span>
                                    </div>
                                    <div class="breakdown-item success">
                                        <span class="breakdown-label">Fixed</span>
                                        <span class="breakdown-value">${project.fixedIssues || 0}</span>
                                    </div>
                                    <div class="breakdown-item error">
                                        <span class="breakdown-label">Not Fixed</span>
                                        <span class="breakdown-value">${project.notFixedIssues || 0}</span>
                                    </div>
                                    <div class="breakdown-item reopened">
                                        <span class="breakdown-label">Reopened</span>
                                        <span class="breakdown-value">${project.reopenedIssues || 0}</span>
                                    </div>
                                    <div class="breakdown-item deferred">
                                        <span class="breakdown-label">Deferred</span>
                                        <span class="breakdown-value">${project.deferredIssues || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="success-rate">
                                <span class="rate-label">Resolution Rate:</span>
                                <span class="rate-value rate-${getRateClass(project.issuesResolutionRate || 0)}">${project.issuesResolutionRate || 0}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Enhancements - COMPLETE -->
                ${(project.totalEnhancements || 0) > 0 ? `
                <div class="metrics-section">
                    <h4 class="metrics-title">
                        <i class="fas fa-magic"></i> Enhancements (${project.totalEnhancements || 0} Total)
                    </h4>
                    <div class="metrics-content">
                        <div class="complete-breakdown">
                            <div class="breakdown-grid">
                                <div class="breakdown-item new">
                                    <span class="breakdown-label">New</span>
                                    <span class="breakdown-value">${project.newEnhancements || 0}</span>
                                </div>
                                <div class="breakdown-item success">
                                    <span class="breakdown-label">Implemented</span>
                                    <span class="breakdown-value">${project.implementedEnhancements || 0}</span>
                                </div>
                                <div class="breakdown-item exists">
                                    <span class="breakdown-label">Already Exists</span>
                                    <span class="breakdown-value">${project.existsEnhancements || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Automation - COMPLETE -->
                ${(project.automationTotalTests || 0) > 0 ? `
                <div class="metrics-section">
                    <h4 class="metrics-title">
                        <i class="fas fa-robot"></i> Automation (${project.automationTotalTests || 0} Total Tests)
                    </h4>
                    <div class="metrics-content">
                        <div class="automation-breakdown">
                            <div class="automation-section">
                                <h5 class="breakdown-title">Test Results</h5>
                                <div class="breakdown-grid">
                                    <div class="breakdown-item success">
                                        <span class="breakdown-label">Passed</span>
                                        <span class="breakdown-value">${project.automationPassedTests || 0}</span>
                                    </div>
                                    <div class="breakdown-item error">
                                        <span class="breakdown-label">Failed</span>
                                        <span class="breakdown-value">${project.automationFailedTests || 0}</span>
                                    </div>
                                    <div class="breakdown-item warning">
                                        <span class="breakdown-label">Skipped</span>
                                        <span class="breakdown-value">${project.automationSkippedTests || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="automation-section">
                                <h5 class="breakdown-title">Test Stability</h5>
                                <div class="breakdown-grid">
                                    <div class="breakdown-item success">
                                        <span class="breakdown-label">Stable</span>
                                        <span class="breakdown-value">${project.automationStableTests || 0}</span>
                                    </div>
                                    <div class="breakdown-item flaky">
                                        <span class="breakdown-label">Flaky</span>
                                        <span class="breakdown-value">${project.automationFlakyTests || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="success-rate">
                                <span class="rate-label">Pass Rate:</span>
                                <span class="rate-value rate-${getRateClass(project.automationPassRate || 0)}">${project.automationPassRate || 0}%</span>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Evaluation Scores have been removed as per user request -->
            </div>
        </div>
        `).join('');
    } else {
        // Render simplified project cards when detailed data is not available
        console.log('Rendering simplified project cards due to missing detailed data');
        container.innerHTML = projects.map(project => `
            <div class="project-metric-card">
                <div class="project-header">
                    <div class="project-title-section">
                        <div class="project-icon">
                            <i class="fas fa-rocket"></i>
                        </div>
                        <div class="project-info">
                            <h3>${project.projectName}</h3>
                            <p class="portfolio-name">${project.portfolioName}</p>
                        </div>
                    </div>
                    <div class="status-badges">
                        <span class="status-badge status-${getStatusClass(project.testingStatus)}">${getStatusText(project.testingStatus)}</span>
                        <span class="risk-badge risk-low">Low Risk</span>
                    </div>
                </div>

                <!-- Project Summary Stats -->
                <div class="project-summary">
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-icon">
                                <i class="fas fa-file-alt"></i>
                            </div>
                            <div class="summary-content">
                                <span class="summary-value">${project.totalReports || 0}</span>
                                <span class="summary-label">Reports</span>
                            </div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-icon">
                                <i class="fas fa-calendar-alt"></i>
                            </div>
                            <div class="summary-content">
                                <span class="summary-value">${formatDate(project.lastReportDate)}</span>
                                <span class="summary-label">Last Report</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Simplified Project Metrics -->
                <div class="project-metrics">
                    <div class="metrics-section">
                        <h4 class="metrics-title">
                            <i class="fas fa-chart-bar"></i> Summary Metrics
                        </h4>
                        <div class="metrics-content">
                            <div class="simple-metrics-grid">
                                <div class="simple-metric">
                                    <div class="metric-icon"><i class="fas fa-user-check"></i></div>
                                    <div class="metric-content">
                                        <span class="metric-value">${project.totalUserStories || 0}</span>
                                        <span class="metric-label">User Stories</span>
                                    </div>
                                </div>
                                <div class="simple-metric">
                                    <div class="metric-icon"><i class="fas fa-flask"></i></div>
                                    <div class="metric-content">
                                        <span class="metric-value">${project.totalTestCases || 0}</span>
                                        <span class="metric-label">Test Cases</span>
                                    </div>
                                </div>
                                <div class="simple-metric">
                                    <div class="metric-icon"><i class="fas fa-bug"></i></div>
                                    <div class="metric-content">
                                        <span class="metric-value">${project.totalIssues || 0}</span>
                                        <span class="metric-label">Issues</span>
                                    </div>
                                </div>
                                <div class="simple-metric">
                                    <div class="metric-icon"><i class="fas fa-magic"></i></div>
                                    <div class="metric-content">
                                        <span class="metric-value">${project.totalEnhancements || 0}</span>
                                        <span class="metric-label">Enhancements</span>
                                    </div>
                                </div>
                            </div>
                            <div class="data-notice">
                                <i class="fas fa-info-circle"></i>
                                <span>Detailed breakdown data is being loaded. Refresh the page to see complete metrics.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Helper function for progress bar colors
async function exportDashboardReport() {
    if (!dashboardStatsCache) {
        showToast('No dashboard data available to export', 'warning');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('QA Dashboard Report', 105, yPos, { align: 'center' });
    yPos += 20;

    // Overall Statistics
    doc.setFontSize(14);
    doc.text('Overall Statistics', 10, yPos);
    yPos += 10;

    const overall = dashboardStatsCache.overall;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Reports: ${overall.totalReports}`, 10, yPos);
    doc.text(`Completed: ${overall.completedReports}`, 60, yPos);
    doc.text(`In Progress: ${overall.inProgressReports}`, 110, yPos);
    doc.text(`Pending: ${overall.pendingReports}`, 160, yPos);
    yPos += 10;

    doc.text(`User Stories: ${overall.totalUserStories}`, 10, yPos);
    doc.text(`Test Cases: ${overall.totalTestCases}`, 60, yPos);
    doc.text(`Issues: ${overall.totalIssues}`, 110, yPos);
    doc.text(`Enhancements: ${overall.totalEnhancements}`, 160, yPos);
    yPos += 20;

    // Project Metrics Table
    if (dashboardStatsCache.projects && dashboardStatsCache.projects.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Project Metrics', 10, yPos);
        yPos += 10;

        const projectTableData = dashboardStatsCache.projects.map(project => [
            project.projectName,
            project.portfolioName,
            project.totalReports.toString(),
            project.totalUserStories.toString(),
            project.totalTestCases.toString(),
            project.totalIssues.toString(),
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Project', 'Portfolio', 'Reports', 'Stories', 'Cases', 'Issues', 'Score']],
            body: projectTableData,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [66, 133, 244], textColor: 255, fontStyle: 'bold' }
        });
    }

    doc.save('QA_Dashboard_Report.pdf');
}

// --- Chart initialization functions ---