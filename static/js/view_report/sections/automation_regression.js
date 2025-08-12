function renderAutomationRegressionView(report, isLightMode) {
    // Render Test Cases Table
    const testCasesTable = document.getElementById('automationTestCasesViewTable');
    const total = report.automationTotalTestCases || 0;
    
    testCasesTable.innerHTML = `
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
                <td>${report.automationPassedTestCases || 0}</td>
                <td class="percentage-cell">${report.automationPassedPercentage || 0}%</td>
            </tr>
            <tr>
                <td>Failed</td>
                <td>${report.automationFailedTestCases || 0}</td>
                <td class="percentage-cell">${report.automationFailedPercentage || 0}%</td>
            </tr>
            <tr>
                <td>Skipped</td>
                <td>${report.automationSkippedTestCases || 0}</td>
                <td class="percentage-cell">${report.automationSkippedPercentage || 0}%</td>
            </tr>
        </tbody>
    `;

    // Create Test Cases Chart
    const testCasesCtx = document.getElementById('automationTestCasesViewChart').getContext('2d');
    if (viewCharts.automationTestCases) viewCharts.automationTestCases.destroy();
    
    viewCharts.automationTestCases = new Chart(testCasesCtx, {
        type: 'doughnut',
        data: {
            labels: ['Passed', 'Failed', 'Skipped'],
            datasets: [{
                data: [
                    report.automationPassedTestCases || 0,
                    report.automationFailedTestCases || 0,
                    report.automationSkippedTestCases || 0
                ],
                backgroundColor: [
                    '#28a745', // Green - Passed
                    '#dc3545', // Red - Failed
                    '#ffc107'  // Yellow - Skipped
                ],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getViewChartOptions(isLightMode)
    });

    // Render Stability Table
    const stabilityTable = document.getElementById('automationStabilityViewTable');
    const stabilityTotal = report.automationStabilityTotal || 0;
    
    stabilityTable.innerHTML = `
        <thead>
            <tr>
                <th>Stability</th>
                <th>Count</th>
                <th>Percentage</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Total Tests</strong></td>
                <td>${stabilityTotal}</td>
                <td class="percentage-cell">100%</td>
            </tr>
            <tr>
                <td>Stable</td>
                <td>${report.automationStableTests || 0}</td>
                <td class="percentage-cell">${report.automationStablePercentage || 0}%</td>
            </tr>
            <tr>
                <td>Flaky</td>
                <td>${report.automationFlakyTests || 0}</td>
                <td class="percentage-cell">${report.automationFlakyPercentage || 0}%</td>
            </tr>
        </tbody>
    `;

    // Create Stability Chart
    const stabilityCtx = document.getElementById('automationStabilityViewChart').getContext('2d');
    if (viewCharts.automationStability) viewCharts.automationStability.destroy();
    
    viewCharts.automationStability = new Chart(stabilityCtx, {
        type: 'doughnut',
        data: {
            labels: ['Stable', 'Flaky'],
            datasets: [{
                data: [
                    report.automationStableTests || 0,
                    report.automationFlakyTests || 0
                ],
                backgroundColor: [
                    '#28a745', // Green - Stable
                    '#fd7e14'  // Orange - Flaky
                ],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getViewChartOptions(isLightMode)
    });
}