function renderAdditionalInfo(report) {
    const section = document.getElementById('additionalInfoSection');
    let content = '';

    // Requests
    if (report.requestData && report.requestData.length > 0) {
        content += `
            <h3 class="section-title" style="font-size: 1.25rem; margin-top: 1.5rem;">📋 Request Information</h3>
            <div class="dynamic-list">
                ${report.requestData.map(req => `
                    <div class="dynamic-item">
                        <strong>ID:</strong> ${req.id}<br>
                        <strong>URL:</strong> ${req.url}
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Builds
    if (report.buildData && report.buildData.length > 0) {
        content += `
            <h3 class="section-title" style="font-size: 1.25rem; margin-top: 1.5rem;">🏗️ Build Information</h3>
            <div class="dynamic-list">
                ${report.buildData.map(build => `
                    <div class="dynamic-item">
                        <strong>Request ID:</strong> ${build.requestId}<br>
                        <strong>URL:</strong> ${build.requestUrl}<br>
                        <strong>Environment:</strong> ${build.environment}<br>
                        <strong>Cycles:</strong> ${build.cycles}
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Testers
    if (report.testerData && report.testerData.length > 0) {
        content += `
            <h3 class="section-title" style="font-size: 1.25rem; margin-top: 1.5rem;">🧪 Tester Information</h3>
            <div class="dynamic-list">
                ${report.testerData.map(tester => {
                    const roles = [];
                    if (tester.is_automation_engineer) roles.push('Automation Engineer');
                    if (tester.is_manual_engineer) roles.push('Manual Engineer');
                    const roleText = roles.length > 0 ? `<br><strong>Roles:</strong> ${roles.join(', ')}` : '<br><em style="color: #6c757d;">No roles assigned</em>';
                    
                    return `
                    <div class="dynamic-item">
                        <strong>Tester:</strong> ${tester.name}
                        ${tester.email ? `<br><strong>Email:</strong> ${tester.email}` : ''}${roleText}
                    </div>`;
                }).join('')}
            </div>
        `;
    }

    // Team Members
    if (report.teamMemberData && report.teamMemberData.length > 0) {
        content += `
            <h3 class="section-title" style="font-size: 1.25rem; margin-top: 1.5rem;">👥 Team Members</h3>
            <div class="dynamic-list">
                ${report.teamMemberData.map(member => `
                    <div class="dynamic-item">
                        <strong>Member:</strong> ${member.name}
                        ${member.email ? `<br><strong>Email:</strong> ${member.email}` : ''}
                        ${member.role ? `<br><strong>Role:</strong> ${member.role}` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    if (!content) {
        content = '<div class="empty-state"><h3>No Additional Information Provided</h3><p>This report does not contain any extra details.</p></div>';
    }

    section.innerHTML = `<h2 class="section-title">Additional Information</h2>${content}`;
}