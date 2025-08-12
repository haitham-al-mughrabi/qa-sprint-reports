function renderTestCasesView(report, isLightMode) {
    const table = document.getElementById('testCasesViewTable');
    const total = report.totalTestCases || 0;
    
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
                <td><strong>Total Test Cases</strong></td>
                <td>${total}</td>
                <td class="percentage-cell">100%</td>
            </tr>
            <tr>
                <td>Passed</td>
                <td>${report.passedTestCases || 0}</td>
                <td class="percentage-cell">${total ? Math.round(((report.passedTestCases || 0) / total) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Passed with Issues</td>
                <td>${report.passedWithIssuesTestCases || 0}</td>
                <td class="percentage-cell">${total ? Math.round(((report.passedWithIssuesTestCases || 0) / total) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Failed</td>
                <td>${report.failedTestCases || 0}</td>
                <td class="percentage-cell">${total ? Math.round(((report.failedTestCases || 0) / total) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Blocked</td>
                <td>${report.blockedTestCases || 0}</td>
                <td class="percentage-cell">${total ? Math.round(((report.blockedTestCases || 0) / total) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Cancelled</td>
                <td>${report.cancelledTestCases || 0}</td>
                <td class="percentage-cell">${total ? Math.round(((report.cancelledTestCases || 0) / total) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Deferred</td>
                <td>${report.deferredTestCases || 0}</td>
                <td class="percentage-cell">${total ? Math.round(((report.deferredTestCases || 0) / total) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Not Testable</td>
                <td>${report.notTestableTestCases || 0}</td>
                <td class="percentage-cell">${total ? Math.round(((report.notTestableTestCases || 0) / total) * 100) : 0}%</td>
            </tr>
        </tbody>
    `;

    // Create chart with more vibrant colors
    const ctx = document.getElementById('testCasesViewChart').getContext('2d');
    if (viewCharts.testCases) viewCharts.testCases.destroy();
    
    viewCharts.testCases = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'],
            datasets: [{
                data: [
                    report.passedTestCases || 0,
                    report.passedWithIssuesTestCases || 0,
                    report.failedTestCases || 0,
                    report.blockedTestCases || 0,
                    report.cancelledTestCases || 0,
                    report.deferredTestCases || 0,
                    report.notTestableTestCases || 0
                ],
                backgroundColor: [
                    '#8BC34A', // Light Green - Passed
                    '#FFEB3B', // Yellow - Passed with Issues
                    '#E91E63', // Pink - Failed
                    '#607D8B', // Blue Grey - Blocked
                    '#9C27B0', // Purple - Cancelled
                    '#FF5722', // Deep Orange - Deferred
                    '#795548'  // Brown - Not Testable
                ],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getViewChartOptions(isLightMode)
    });
}