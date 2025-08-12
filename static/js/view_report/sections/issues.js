function renderIssuesView(report, isLightMode) {
    const priorityTable = document.getElementById('issuesPriorityViewTable');
    const statusTable = document.getElementById('issuesStatusViewTable');
    const priorityTotal = report.totalIssues || 0;
    const statusTotal = report.totalIssuesByStatus || 0;
    
    // Priority table
    priorityTable.innerHTML = `
        <thead>
            <tr>
                <th>Priority</th>
                <th>Count</th>
                <th>Percentage</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Total Issues</strong></td>
                <td>${priorityTotal}</td>
                <td class="percentage-cell">100%</td>
            </tr>
            <tr>
                <td>Critical</td>
                <td>${report.criticalIssues || 0}</td>
                <td class="percentage-cell">${priorityTotal ? Math.round(((report.criticalIssues || 0) / priorityTotal) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>High</td>
                <td>${report.highIssues || 0}</td>
                <td class="percentage-cell">${priorityTotal ? Math.round(((report.highIssues || 0) / priorityTotal) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Medium</td>
                <td>${report.mediumIssues || 0}</td>
                <td class="percentage-cell">${priorityTotal ? Math.round(((report.mediumIssues || 0) / priorityTotal) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Low</td>
                <td>${report.lowIssues || 0}</td>
                <td class="percentage-cell">${priorityTotal ? Math.round(((report.lowIssues || 0) / priorityTotal) * 100) : 0}%</td>
            </tr>
        </tbody>
    `;

    // Status table
    statusTable.innerHTML = `
        <thead>
            <tr>
                <th>Status</th>
                <th>Count</th>
                <th>Percentage</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Total Issues by Status</strong></td>
                <td>${statusTotal}</td>
                <td class="percentage-cell">100%</td>
            </tr>
            <tr>
                <td>New</td>
                <td>${report.newIssues || 0}</td>
                <td class="percentage-cell">${statusTotal ? Math.round(((report.newIssues || 0) / statusTotal) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Fixed</td>
                <td>${report.fixedIssues || 0}</td>
                <td class="percentage-cell">${statusTotal ? Math.round(((report.fixedIssues || 0) / statusTotal) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Not Fixed</td>
                <td>${report.notFixedIssues || 0}</td>
                <td class="percentage-cell">${statusTotal ? Math.round(((report.notFixedIssues || 0) / statusTotal) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Re-opened</td>
                <td>${report.reopenedIssues || 0}</td>
                <td class="percentage-cell">${statusTotal ? Math.round(((report.reopenedIssues || 0) / statusTotal) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Deferred</td>
                <td>${report.deferredIssues || 0}</td>
                <td class="percentage-cell">${statusTotal ? Math.round(((report.deferredIssues || 0) / statusTotal) * 100) : 0}%</td>
            </tr>
        </tbody>
    `;

    // Priority chart with more vibrant colors
    const priorityCtx = document.getElementById('issuesPriorityViewChart').getContext('2d');
    if (viewCharts.issuesPriority) viewCharts.issuesPriority.destroy();
    
    viewCharts.issuesPriority = new Chart(priorityCtx, {
        type: 'doughnut', // Changed to doughnut for consistency with other charts
        data: {
            labels: ['Critical', 'High', 'Medium', 'Low'],
            datasets: [{
                data: [
                    report.criticalIssues || 0,
                    report.highIssues || 0,
                    report.mediumIssues || 0,
                    report.lowIssues || 0
                ],
                backgroundColor: [
                    '#F44336', // Red - Critical
                    '#FF9800', // Orange - High
                    '#FFC107', // Amber - Medium
                    '#4CAF50'  // Green - Low
                ],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getViewChartOptions(isLightMode)
    });

    // Status chart with more vibrant colors
    const statusCtx = document.getElementById('issuesStatusViewChart').getContext('2d');
    if (viewCharts.issuesStatus) viewCharts.issuesStatus.destroy();
    
    viewCharts.issuesStatus = new Chart(statusCtx, {
        type: 'doughnut', // Changed to doughnut for consistency with other charts
        data: {
            labels: ['New', 'Fixed', 'Not Fixed', 'Re-opened', 'Deferred'],
            datasets: [{
                data: [
                    report.newIssues || 0,
                    report.fixedIssues || 0,
                    report.notFixedIssues || 0,
                    report.reopenedIssues || 0,
                    report.deferredIssues || 0
                ],
                backgroundColor: [
                    '#2196F3', // Blue - New
                    '#4CAF50', // Green - Fixed
                    '#E91E63', // Pink - Not Fixed
                    '#FF5722', // Deep Orange - Re-opened
                    '#673AB7'  // Deep Purple - Deferred
                ],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getViewChartOptions(isLightMode)
    });
}