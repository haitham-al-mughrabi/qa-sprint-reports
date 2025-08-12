function renderMetricsOverview(report) {
    const metricsOverview = document.getElementById('metricsOverview');
    metricsOverview.innerHTML = `
        <div class="info-item">
            <div class="info-label">Total User Stories</div>
            <div class="info-value metric-highlight">${report.totalUserStories || 0}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Total Test Cases</div>
            <div class="info-value metric-highlight">${report.totalTestCases || 0}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Total Issues</div>
            <div class="info-value metric-highlight">${report.totalIssues || 0}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Total Enhancements</div>
            <div class="info-value metric-highlight">${report.totalEnhancements || 0}</div>
        </div>
    `;
}