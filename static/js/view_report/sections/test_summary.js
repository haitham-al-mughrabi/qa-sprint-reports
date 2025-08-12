function renderTestSummary(report) {
    const testSummaryContent = document.getElementById('testSummaryContent');
    testSummaryContent.innerHTML = `
        <div class="info-item" style="grid-column: 1 / -1;">
            <div class="info-label">Testing Status</div>
            <div class="info-value">
                <span class="status-badge status-${getStatusClass(report.testingStatus)}">${getStatusText(report.testingStatus)}</span>
            </div>
        </div>
        <div class="info-item" style="grid-column: 1 / -1;">
            <div class="info-label">Test Summary</div>
            <div class="info-value">${report.testSummary || 'No summary provided'}</div>
        </div>
    `;
}