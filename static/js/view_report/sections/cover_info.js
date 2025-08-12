function renderCoverInfo(report) {
    const coverInfo = document.getElementById('coverInfo');
    coverInfo.innerHTML = `
        <div class="info-item">
            <div class="info-label">Report Name</div>
            <div class="info-value">${report.reportName || 'N/A'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Portfolio Name</div>
            <div class="info-value">${report.portfolioName || 'N/A'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Project Name</div>
            <div class="info-value">${report.projectName || 'N/A'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Report Date</div>
            <div class="info-value">${formatDate(report.reportDate)}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Test Environment</div>
            <div class="info-value">${report.testEnvironment || 'N/A'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Sprint Number</div>
            <div class="info-value">#${report.sprintNumber || 'N/A'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Cycle Number</div>
            <div class="info-value">${report.cycleNumber || 'N/A'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Release Number</div>
            <div class="info-value">${report.releaseNumber || 'N/A'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Report Version</div>
            <div class="info-value">v${report.reportVersion || '3'}</div>
        </div>
    `;
}