function renderUserStoriesView(report, isLightMode) {
    const table = document.getElementById('userStoriesViewTable');
    const total = report.totalUserStories || 0;
    
    table.innerHTML = `
        <thead>
            <tr>
                <th>Status</th>
                <th>Count</th>
                <th>Percentage</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Total User Stories</strong></td>
                <td>${total}</td>
                <td class="percentage-cell">100%</td>
            </tr>
            <tr>
                <td>Passed</td>
                <td>${report.passedUserStories || 0}</td>
                <td class="percentage-cell">${total ? Math.round(((report.passedUserStories || 0) / total) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Passed with Issues</td>
                <td>${report.passedWithIssuesUserStories || 0}</td>
                <td class="percentage-cell">${total ? Math.round(((report.passedWithIssuesUserStories || 0) / total) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Failed</td>
                <td>${report.failedUserStories || 0}</td>
                <td class="percentage-cell">${total ? Math.round(((report.failedUserStories || 0) / total) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Blocked</td>
                <td>${report.blockedUserStories || 0}</td>
                <td class="percentage-cell">${total ? Math.round(((report.blockedUserStories || 0) / total) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Cancelled</td>
                <td>${report.cancelledUserStories || 0}</td>
                <td class="percentage-cell">${total ? Math.round(((report.cancelledUserStories || 0) / total) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Deferred</td>
                <td>${report.deferredUserStories || 0}</td>
                <td class="percentage-cell">${total ? Math.round(((report.deferredUserStories || 0) / total) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Not Testable</td>
                <td>${report.notTestableUserStories || 0}</td>
                <td class="percentage-cell">${total ? Math.round(((report.notTestableUserStories || 0) / total) * 100) : 0}%</td>
            </tr>
        </tbody>
    `;

    // Create chart with more vibrant colors
    const ctx = document.getElementById('userStoriesViewChart').getContext('2d');
    if (viewCharts.userStories) viewCharts.userStories.destroy();
    
    viewCharts.userStories = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'],
            datasets: [{
                data: [
                    report.passedUserStories || 0,
                    report.passedWithIssuesUserStories || 0,
                    report.failedUserStories || 0,
                    report.blockedUserStories || 0,
                    report.cancelledUserStories || 0,
                    report.deferredUserStories || 0,
                    report.notTestableUserStories || 0
                ],
                backgroundColor: [
                    '#4CAF50', // Green - Passed
                    '#FFC107', // Amber - Passed with Issues
                    '#F44336', // Red - Failed
                    '#9E9E9E', // Grey - Blocked
                    '#2196F3', // Blue - Cancelled
                    '#673AB7', // Deep Purple - Deferred
                    '#00BCD4'  // Cyan - Not Testable
                ],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getViewChartOptions(isLightMode)
    });
}