function renderEnhancementsView(report, isLightMode) {
    const table = document.getElementById('enhancementsViewTable');
    const total = report.totalEnhancements || 0;
    
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
                <td><strong>Total Enhancements</strong></td>
                <td>${total}</td>
                <td class="percentage-cell">100%</td>
            </tr>
            <tr>
                <td>New</td>
                <td>${report.newEnhancements || 0}</td>
                <td class="percentage-cell">${total ? Math.round(((report.newEnhancements || 0) / total) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Implemented</td>
                <td>${report.implementedEnhancements || 0}</td>
                <td class="percentage-cell">${total ? Math.round(((report.implementedEnhancements || 0) / total) * 100) : 0}%</td>
            </tr>
            <tr>
                <td>Exists</td>
                <td>${report.existsEnhancements || 0}</td>
                <td class="percentage-cell">${total ? Math.round(((report.existsEnhancements || 0) / total) * 100) : 0}%</td>
            </tr>
        </tbody>
    `;

    // Create chart with more vibrant colors
    const ctx = document.getElementById('enhancementsViewChart').getContext('2d');
    if (viewCharts.enhancements) viewCharts.enhancements.destroy();
    
    viewCharts.enhancements = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['New', 'Implemented', 'Exists'],
            datasets: [{
                data: [
                    report.newEnhancements || 0,
                    report.implementedEnhancements || 0,
                    report.existsEnhancements || 0
                ],
                backgroundColor: [
                    '#00BCD4', // Cyan - New
                    '#4CAF50', // Green - Implemented
                    '#9E9E9E'  // Grey - Exists
                ],
                borderWidth: 3,
                borderColor: 'var(--surface)'
            }]
        },
        options: getViewChartOptions(isLightMode)
    });
}