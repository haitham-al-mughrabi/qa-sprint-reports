function renderIssuesView(report, isLightMode) {
    const priorityTable = document.getElementById('issuesPriorityViewTable');
    const openStatusTable = document.getElementById('issuesOpenStatusViewTable');
    const resolutionStatusTable = document.getElementById('issuesResolutionStatusViewTable');
    const statusTable = document.getElementById('issuesStatusViewTable'); // Legacy support
    
    const priorityTotal = report.totalIssues || 0;
    const statusTotal = report.totalIssuesByStatus || 0;
    
    // Calculate new sub-section totals
    const openStatusTotal = (report.newIssues || 0) + (report.reopenedIssues || 0) + (report.deferredOldBugsIssues || 0);
    const resolutionStatusTotal = (report.fixedIssues || 0) + (report.notFixedIssues || 0);
    
    // Priority table (unchanged)
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

    // Open Status table
    openStatusTable.innerHTML = `
        <thead>
            <tr>
                <th>Status</th>
                <th>Count</th>
                <th>Percentage</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Total</strong></td>
                <td>${openStatusTotal}</td>
                <td class="percentage-cell">100%</td>
            </tr>
            <tr>
                <td>New</td>
                <td>${report.newIssues || 0}</td>
                <td class="percentage-cell">${openStatusTotal ? Math.round(((report.newIssues || 0) / openStatusTotal) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Re-opened</td>
                <td>${report.reopenedIssues || 0}</td>
                <td class="percentage-cell">${openStatusTotal ? Math.round(((report.reopenedIssues || 0) / openStatusTotal) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Deferred (old bugs)</td>
                <td>${report.deferredOldBugsIssues || 0}</td>
                <td class="percentage-cell">${openStatusTotal ? Math.round(((report.deferredOldBugsIssues || 0) / openStatusTotal) * 100) : 0}%</td>
            </tr>
        </tbody>
    `;

    // Resolution Status table
    resolutionStatusTable.innerHTML = `
        <thead>
            <tr>
                <th>Status</th>
                <th>Count</th>
                <th>Percentage</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Total</strong></td>
                <td>${resolutionStatusTotal}</td>
                <td class="percentage-cell">100%</td>
            </tr>
            <tr>
                <td>Fixed</td>
                <td>${report.fixedIssues || 0}</td>
                <td class="percentage-cell">${resolutionStatusTotal ? Math.round(((report.fixedIssues || 0) / resolutionStatusTotal) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Not Fixed</td>
                <td>${report.notFixedIssues || 0}</td>
                <td class="percentage-cell">${resolutionStatusTotal ? Math.round(((report.notFixedIssues || 0) / resolutionStatusTotal) * 100) : 0}%</td>
            </tr>
        </tbody>
    `;

    // Legacy Status table for backward compatibility
    if (statusTable) {
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
                    <td>Deferred (old bugs)</td>
                    <td>${report.deferredOldBugsIssues || 0}</td>
                    <td class="percentage-cell">${statusTotal ? Math.round(((report.deferredOldBugsIssues || 0) / statusTotal) * 100) : 0}%</td>
                </tr>
            </tbody>
        `;
    }

    // Priority chart (unchanged)
    const priorityCtx = document.getElementById('issuesPriorityViewChart').getContext('2d');
    if (viewCharts.issuesPriority) viewCharts.issuesPriority.destroy();
    
    viewCharts.issuesPriority = new Chart(priorityCtx, {
        type: 'doughnut',
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

    // Open Status chart
    const openStatusCtx = document.getElementById('issuesOpenStatusViewChart').getContext('2d');
    if (viewCharts.issuesOpenStatus) viewCharts.issuesOpenStatus.destroy();
    
    viewCharts.issuesOpenStatus = new Chart(openStatusCtx, {
        type: 'doughnut',
        data: {
            labels: ['New', 'Re-opened', 'Deferred (old bugs)'],
            datasets: [{
                data: [
                    report.newIssues || 0,
                    report.reopenedIssues || 0,
                    report.deferredOldBugsIssues || 0
                ],
                backgroundColor: [
                    '#2196F3', // Blue - New
                    '#FF5722', // Deep Orange - Re-opened
                    '#673AB7'  // Deep Purple - Deferred
                ],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getViewChartOptions(isLightMode)
    });

    // Resolution Status chart
    const resolutionStatusCtx = document.getElementById('issuesResolutionStatusViewChart').getContext('2d');
    if (viewCharts.issuesResolutionStatus) viewCharts.issuesResolutionStatus.destroy();
    
    viewCharts.issuesResolutionStatus = new Chart(resolutionStatusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Fixed', 'Not Fixed'],
            datasets: [{
                data: [
                    report.fixedIssues || 0,
                    report.notFixedIssues || 0
                ],
                backgroundColor: [
                    '#4CAF50', // Green - Fixed
                    '#E91E63'  // Pink - Not Fixed
                ],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getViewChartOptions(isLightMode)
    });

    // Legacy Status chart for backward compatibility
    const statusCtx = document.getElementById('issuesStatusViewChart');
    if (statusCtx) {
        const statusContext = statusCtx.getContext('2d');
        if (viewCharts.issuesStatus) viewCharts.issuesStatus.destroy();
        
        viewCharts.issuesStatus = new Chart(statusContext, {
            type: 'doughnut',
            data: {
                labels: ['New', 'Fixed', 'Not Fixed', 'Re-opened', 'Deferred (old bugs)'],
                datasets: [{
                    data: [
                        report.newIssues || 0,
                        report.fixedIssues || 0,
                        report.notFixedIssues || 0,
                        report.reopenedIssues || 0,
                        report.deferredOldBugsIssues || 0
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
}