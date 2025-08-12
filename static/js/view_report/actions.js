function editCurrentReport() {
    if (!currentReport) {
        showCustomMessageBox('Report data not loaded yet.');
        return;
    }
    
    // Redirect to create report page with edit mode
    window.location.href = `/create-report?id=${currentReport.id}`;
}

function deleteCurrentReport() {
    if (!currentReport) {
        showErrorToast('Report data not loaded yet.');
        return;
    }

    if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
        fetch(`/api/reports/${currentReport.id}`, { method: 'DELETE' })
            .then(response => {
                if (response.ok) {
                    showSuccessToast('Report deleted successfully!');
                    setTimeout(() => {
                        window.location.href = '/reports';
                    }, 1500);
                } else {
                    showErrorToast('Failed to delete report.');
                }
            })
            .catch(error => {
                console.error('Error deleting report:', error);
                showErrorToast('An error occurred while deleting the report.');
            });
    }
}

async function exportCurrentReportAsPdf() {
    if (!currentReport) {
        showErrorToast('Report data not loaded yet.');
        return;
    }
    
    showInfoToast('Generating comprehensive PDF export...');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = margin;

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace = 80) => {
        if (yPos + requiredSpace > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
            return true;
        }
        return false;
    };

    // Header
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('QA Testing Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 30;

    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text(`${currentReport.portfolioName} - Sprint ${currentReport.sprintNumber}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 18;
    doc.text(`${currentReport.projectName} | Version ${currentReport.reportVersion} | ${formatDate(currentReport.reportDate)}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 40; // Increased space after header

    // Helper function to add a section title
    const addSectionTitle = (title) => {
        checkNewPage(50); // Ensure space for title + some content
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text(title, margin, yPos);
        yPos += 25; // Space after title
    };

    // 1. General Information
    addSectionTitle('General Information');

    const coverData = [
        ['Portfolio Name', currentReport.portfolioName || 'N/A'],
        ['Project Name', currentReport.projectName || 'N/A'],
        ['Sprint Number', `#${currentReport.sprintNumber || 'N/A'}`],
        ['Report Version', `v${currentReport.reportVersion || '1.0'}`],
        ['Release Number', currentReport.releaseNumber || 'N/A'],
        ['Cycle Number', currentReport.cycleNumber || 'N/A'],
        ['Report Date', formatDate(currentReport.reportDate)],
        ['Testing Status', getStatusText(currentReport.testingStatus)]
    ];

    doc.autoTable({
        startY: yPos,
        head: [['Field', 'Value']],
        body: coverData,
        theme: 'grid',
        headStyles: { fillColor: [60, 141, 188], textColor: 255, fontStyle: 'bold' }, // Blue-ish header
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: margin, right: margin }
    });
    yPos = doc.lastAutoTable.finalY + 30;

    // 2. Test Summary & Status
    addSectionTitle('Test Summary & Status');

    const testSummaryData = [
        ['Testing Status', getStatusText(currentReport.testingStatus)],
        ['Test Summary', currentReport.testSummary || 'No summary provided']
    ];

    doc.autoTable({
        startY: yPos,
        head: [['Field', 'Value']],
        body: testSummaryData,
        theme: 'grid',
        headStyles: { fillColor: [60, 141, 188], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: margin, right: margin },
        columnStyles: {
            1: { cellWidth: 'auto', minCellWidth: 350 } // Auto-width for summary text, with a minimum
        }
    });
    yPos = doc.lastAutoTable.finalY + 30;

    // 3. Testing Metrics Overview
    addSectionTitle('Testing Metrics Overview');

    const metricsData = [
        ['Total User Stories', currentReport.totalUserStories || 0],
        ['Total Test Cases', currentReport.totalTestCases || 0],
        ['Total Issues', currentReport.totalIssues || 0],
        ['Total Enhancements', currentReport.totalEnhancements || 0]
    ];

    doc.autoTable({
        startY: yPos,
        head: [['Metric', 'Count']],
        body: metricsData,
        theme: 'grid',
        headStyles: { fillColor: [60, 141, 188], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: margin, right: margin }
    });
    yPos = doc.lastAutoTable.finalY + 30;

    // 4. User Stories Analysis
    addSectionTitle('User Stories Analysis');

    const total = currentReport.totalUserStories || 0;
    const userStoriesData = [
        ['Status', 'Count', 'Percentage'],
        ['Total User Stories', total, '100%'],
        ['Passed', currentReport.passedUserStories || 0, total ? Math.round(((currentReport.passedUserStories || 0) / total) * 100) + '%' : '0%'],
        ['Passed with Issues', currentReport.passedWithIssuesUserStories || 0, total ? Math.round(((currentReport.passedWithIssuesUserStories || 0) / total) * 100) + '%' : '0%'],
        ['Failed', currentReport.failedUserStories || 0, total ? Math.round(((currentReport.failedUserStories || 0) / total) * 100) + '%' : '0%'],
        ['Blocked', currentReport.blockedUserStories || 0, total ? Math.round(((currentReport.blockedUserStories || 0) / total) * 100) + '%' : '0%'],
        ['Cancelled', currentReport.cancelledUserStories || 0, total ? Math.round(((currentReport.cancelledUserStories || 0) / total) * 100) + '%' : '0%'],
        ['Deferred', currentReport.deferredUserStories || 0, total ? Math.round(((currentReport.deferredUserStories || 0) / total) * 100) + '%' : '0%'],
        ['Not Testable', currentReport.notTestableUserStories || 0, total ? Math.round(((currentReport.notTestableUserStories || 0) / total) * 100) + '%' : '0%']
    ];

    // Create table and chart side by side - using web dimensions
    const tableStartY = yPos;
    const tableWidth = 260;
    const chartStartX = margin + tableWidth + 20;
    const chartHeight = 150; // Set to 150pt for square charts
    const chartWidth = 150;  // Set to 150pt for square charts

    doc.autoTable({
        startY: tableStartY,
        head: [userStoriesData[0]],
        body: userStoriesData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [60, 141, 188], textColor: 255, fontStyle: 'bold' },
        margin: { left: margin, right: chartStartX },
        tableWidth: tableWidth,
        styles: { fontSize: 9, cellPadding: 3 }
    });

    // Add chart beside the table with high quality capture
    const userStoriesCanvas = document.getElementById('userStoriesViewChart');
    if (userStoriesCanvas) {
        // Create a temporary canvas with higher resolution
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const scale = 4; // Higher resolution
        tempCanvas.width = userStoriesCanvas.width * scale;
        tempCanvas.height = userStoriesCanvas.height * scale;
        tempCtx.scale(scale, scale);
        tempCtx.drawImage(userStoriesCanvas, 0, 0);
        
        const imgData = tempCanvas.toDataURL('image/png', 1.0);
        doc.addImage(imgData, 'PNG', chartStartX, tableStartY + 5, chartWidth, chartHeight, null, 'FAST');
    }

    yPos = Math.max(doc.lastAutoTable.finalY, tableStartY + chartHeight) + 30;

    // 5. Test Cases Analysis
    addSectionTitle('Test Cases Analysis');

    const totalTestCases = currentReport.totalTestCases || 0;
    const testCasesData = [
        ['Status', 'Count', 'Percentage'],
        ['Total Test Cases', totalTestCases, '100%'],
        ['Passed', currentReport.passedTestCases || 0, totalTestCases ? Math.round(((currentReport.passedTestCases || 0) / totalTestCases) * 100) + '%' : '0%'],
        ['Passed with Issues', currentReport.passedWithIssuesTestCases || 0, totalTestCases ? Math.round(((currentReport.passedWithIssuesTestCases || 0) / totalTestCases) * 100) + '%' : '0%'],
        ['Failed', currentReport.failedTestCases || 0, totalTestCases ? Math.round(((currentReport.failedTestCases || 0) / totalTestCases) * 100) + '%' : '0%'],
        ['Blocked', currentReport.blockedTestCases || 0, totalTestCases ? Math.round(((currentReport.blockedTestCases || 0) / totalTestCases) * 100) + '%' : '0%'],
        ['Cancelled', currentReport.cancelledTestCases || 0, totalTestCases ? Math.round(((currentReport.cancelledTestCases || 0) / totalTestCases) * 100) + '%' : '0%'],
        ['Deferred', currentReport.deferredTestCases || 0, totalTestCases ? Math.round(((currentReport.deferredTestCases || 0) / totalTestCases) * 100) + '%' : '0%'],
        ['Not Testable', currentReport.notTestableTestCases || 0, totalTestCases ? Math.round(((currentReport.notTestableTestCases || 0) / totalTestCases) * 100) + '%' : '0%']
    ];

    // Create table and chart side by side
    const testCasesTableStartY = yPos;

    doc.autoTable({
        startY: testCasesTableStartY,
        head: [testCasesData[0]],
        body: testCasesData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [60, 141, 188], textColor: 255, fontStyle: 'bold' },
        margin: { left: margin, right: chartStartX },
        tableWidth: tableWidth,
        styles: { fontSize: 9, cellPadding: 3 }
    });

    // Add chart beside the table with high quality capture
    const testCasesCanvas = document.getElementById('testCasesViewChart');
    if (testCasesCanvas) {
        // Create a temporary canvas with higher resolution
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const scale = 4;
        tempCanvas.width = testCasesCanvas.width * scale;
        tempCanvas.height = testCasesCanvas.height * scale;
        tempCtx.scale(scale, scale);
        tempCtx.drawImage(testCasesCanvas, 0, 0);
        
        const imgData = tempCanvas.toDataURL('image/png', 1.0);
        doc.addImage(imgData, 'PNG', chartStartX, testCasesTableStartY + 5, chartWidth, chartHeight, null, 'FAST');
    }

    yPos = Math.max(doc.lastAutoTable.finalY, testCasesTableStartY + chartHeight) + 30;

    // 6. Issues by Priority
    addSectionTitle('Issues by Priority');

    const totalIssues = currentReport.totalIssues || 0;
    const totalIssuesByStatus = currentReport.totalIssuesByStatus || 0;
    const issuesPriorityData = [
        ['Priority', 'Count', 'Percentage'],
        ['Total Issues', totalIssues, '100%'],
        ['Critical', currentReport.criticalIssues || 0, totalIssues ? Math.round(((currentReport.criticalIssues || 0) / totalIssues) * 100) + '%' : '0%'],
        ['High', currentReport.highIssues || 0, totalIssues ? Math.round(((currentReport.highIssues || 0) / totalIssues) * 100) + '%' : '0%'],
        ['Medium', currentReport.mediumIssues || 0, totalIssues ? Math.round(((currentReport.mediumIssues || 0) / totalIssues) * 100) + '%' : '0%'],
        ['Low', currentReport.lowIssues || 0, totalIssues ? Math.round(((currentReport.lowIssues || 0) / totalIssues) * 100) + '%' : '0%']
    ];

    // Create table and chart side by side - Issues by Priority (high quality)
    const issuesPriorityTableStartY = yPos;

    doc.autoTable({
        startY: issuesPriorityTableStartY,
        head: [issuesPriorityData[0]],
        body: issuesPriorityData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [60, 141, 188], textColor: 255, fontStyle: 'bold' },
        margin: { left: margin, right: chartStartX },
        tableWidth: tableWidth,
        styles: { fontSize: 9, cellPadding: 3 }
    });

    // Add chart beside the table with high quality capture
    const issuesPriorityCanvas = document.getElementById('issuesPriorityViewChart');
    if (issuesPriorityCanvas) {
        // Create a temporary canvas with higher resolution
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const scale = 4;
        tempCanvas.width = issuesPriorityCanvas.width * scale;
        tempCanvas.height = issuesPriorityCanvas.height * scale;
        tempCtx.scale(scale, scale);
        tempCtx.drawImage(issuesPriorityCanvas, 0, 0);
        
        const imgData = tempCanvas.toDataURL('image/png', 1.0);
        doc.addImage(imgData, 'PNG', chartStartX, issuesPriorityTableStartY + 5, chartWidth, chartHeight, null, 'FAST');
    }

    yPos = Math.max(doc.lastAutoTable.finalY, issuesPriorityTableStartY + chartHeight) + 30;

    // 7. Issues by Status
    addSectionTitle('Issues by Status');

    const issuesStatusData = [
        ['Status', 'Count', 'Percentage'],
        ['Total Issues by Status', totalIssuesByStatus, '100%'],
        ['New', currentReport.newIssues || 0, totalIssuesByStatus ? Math.round(((currentReport.newIssues || 0) / totalIssuesByStatus) * 100) + '%' : '0%'],
        ['Fixed', currentReport.fixedIssues || 0, totalIssuesByStatus ? Math.round(((currentReport.fixedIssues || 0) / totalIssuesByStatus) * 100) + '%' : '0%'],
        ['Not Fixed', currentReport.notFixedIssues || 0, totalIssuesByStatus ? Math.round(((currentReport.notFixedIssues || 0) / totalIssuesByStatus) * 100) + '%' : '0%'],
        ['Re-opened', currentReport.reopenedIssues || 0, totalIssuesByStatus ? Math.round(((currentReport.reopenedIssues || 0) / totalIssuesByStatus) * 100) + '%' : '0%'],
        ['Deferred', currentReport.deferredIssues || 0, totalIssuesByStatus ? Math.round(((currentReport.deferredIssues || 0) / totalIssuesByStatus) * 100) + '%' : '0%']
    ];

    // Create table and chart side by side - Issues by Status (high quality)
    const issuesStatusTableStartY = yPos;

    doc.autoTable({
        startY: issuesStatusTableStartY,
        head: [issuesStatusData[0]],
        body: issuesStatusData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [60, 141, 188], textColor: 255, fontStyle: 'bold' },
        margin: { left: margin, right: chartStartX },
        tableWidth: tableWidth,
        styles: { fontSize: 9, cellPadding: 3 }
    });

    // Add chart beside the table with high quality capture
    const issuesStatusCanvas = document.getElementById('issuesStatusViewChart');
    if (issuesStatusCanvas) {
        // Create a temporary canvas with higher resolution
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const scale = 4;
        tempCanvas.width = issuesStatusCanvas.width * scale;
        tempCanvas.height = issuesStatusCanvas.height * scale;
        tempCtx.scale(scale, scale);
        tempCtx.drawImage(issuesStatusCanvas, 0, 0);
        
        const imgData = tempCanvas.toDataURL('image/png', 1.0);
        doc.addImage(imgData, 'PNG', chartStartX, issuesStatusTableStartY + 5, chartWidth, chartHeight, null, 'FAST');
    }

    yPos = Math.max(doc.lastAutoTable.finalY, issuesStatusTableStartY + chartHeight) + 30;

    // 8. Enhancements Analysis
    addSectionTitle('Enhancements Analysis');

    const totalEnhancements = currentReport.totalEnhancements || 0;
    const enhancementsData = [
        ['Status', 'Count', 'Percentage'],
        ['Total Enhancements', totalEnhancements, '100%'],
        ['New', currentReport.newEnhancements || 0, totalEnhancements ? Math.round(((currentReport.newEnhancements || 0) / totalEnhancements) * 100) + '%' : '0%'],
        ['Implemented', currentReport.implementedEnhancements || 0, totalEnhancements ? Math.round(((currentReport.implementedEnhancements || 0) / totalEnhancements) * 100) + '%' : '0%'],
        ['Exists', currentReport.existsEnhancements || 0, totalEnhancements ? Math.round(((currentReport.existsEnhancements || 0) / totalEnhancements) * 100) + '%' : '0%']
    ];

    // Create table and chart side by side - Enhancements Analysis (high quality)
    const enhancementsTableStartY = yPos;

    doc.autoTable({
        startY: enhancementsTableStartY,
        head: [enhancementsData[0]],
        body: enhancementsData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [60, 141, 188], textColor: 255, fontStyle: 'bold' },
        margin: { left: margin, right: chartStartX },
        tableWidth: tableWidth,
        styles: { fontSize: 9, cellPadding: 3 }
    });

    // Add chart beside the table with high quality capture
    const enhancementsCanvas = document.getElementById('enhancementsViewChart');
    if (enhancementsCanvas) {
        // Create a temporary canvas with higher resolution
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const scale = 4;
        tempCanvas.width = enhancementsCanvas.width * scale;
        tempCanvas.height = enhancementsCanvas.height * scale;
        tempCtx.scale(scale, scale);
        tempCtx.drawImage(enhancementsCanvas, 0, 0);
        
        const imgData = tempCanvas.toDataURL('image/png', 1.0);
        doc.addImage(imgData, 'PNG', chartStartX, enhancementsTableStartY + 5, chartWidth, chartHeight, null, 'FAST');
    }

    yPos = Math.max(doc.lastAutoTable.finalY, enhancementsTableStartY + chartHeight) + 30;

    // 9. Automation Regression - Test Cases
    addSectionTitle('Automation Regression - Test Cases');

    const automationTotal = currentReport.automationTotalTestCases || 0;
    const automationTestCasesData = [
        ['Status', 'Count', 'Percentage'],
        ['Total Test Cases', automationTotal, '100%'],
        ['Passed', currentReport.automationPassedTestCases || 0, currentReport.automationPassedPercentage + '%' || '0%'],
        ['Failed', currentReport.automationFailedTestCases || 0, currentReport.automationFailedPercentage + '%' || '0%'],
        ['Skipped', currentReport.automationSkippedTestCases || 0, currentReport.automationSkippedPercentage + '%' || '0%']
    ];

    // Create table and chart side by side
    const automationTestCasesTableStartY = yPos;

    doc.autoTable({
        startY: automationTestCasesTableStartY,
        head: [automationTestCasesData[0]],
        body: automationTestCasesData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [60, 141, 188], textColor: 255, fontStyle: 'bold' },
        margin: { left: margin, right: chartStartX },
        tableWidth: tableWidth,
        styles: { fontSize: 9, cellPadding: 3 }
    });

    // Add chart beside the table with high quality capture
    const automationTestCasesCanvas = document.getElementById('automationTestCasesViewChart');
    if (automationTestCasesCanvas) {
        // Create a temporary canvas with higher resolution
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const scale = 4;
        tempCanvas.width = automationTestCasesCanvas.width * scale;
        tempCanvas.height = automationTestCasesCanvas.height * scale;
        tempCtx.scale(scale, scale);
        tempCtx.drawImage(automationTestCasesCanvas, 0, 0);
        
        const imgData = tempCanvas.toDataURL('image/png', 1.0);
        doc.addImage(imgData, 'PNG', chartStartX, automationTestCasesTableStartY + 5, chartWidth, chartHeight, null, 'FAST');
    }

    yPos = Math.max(doc.lastAutoTable.finalY, automationTestCasesTableStartY + chartHeight) + 30;

    // 10. Automation Regression - Test Stability
    addSectionTitle('Automation Regression - Test Stability');

    const stabilityTotal = currentReport.automationStabilityTotal || 0;
    const automationStabilityData = [
        ['Stability', 'Count', 'Percentage'],
        ['Total Tests', stabilityTotal, '100%'],
        ['Stable', currentReport.automationStableTests || 0, currentReport.automationStablePercentage + '%' || '0%'],
        ['Flaky', currentReport.automationFlakyTests || 0, currentReport.automationFlakyPercentage + '%' || '0%']
    ];

    // Create table and chart side by side
    const automationStabilityTableStartY = yPos;

    doc.autoTable({
        startY: automationStabilityTableStartY,
        head: [automationStabilityData[0]],
        body: automationStabilityData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [60, 141, 188], textColor: 255, fontStyle: 'bold' },
        margin: { left: margin, right: chartStartX },
        tableWidth: tableWidth,
        styles: { fontSize: 9, cellPadding: 3 }
    });

    // Add chart beside the table with high quality capture
    const automationStabilityCanvas = document.getElementById('automationStabilityViewChart');
    if (automationStabilityCanvas) {
        // Create a temporary canvas with higher resolution
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const scale = 4;
        tempCanvas.width = automationStabilityCanvas.width * scale;
        tempCanvas.height = automationStabilityCanvas.height * scale;
        tempCtx.scale(scale, scale);
        tempCtx.drawImage(automationStabilityCanvas, 0, 0);
        
        const imgData = tempCanvas.toDataURL('image/png', 1.0);
        doc.addImage(imgData, 'PNG', chartStartX, automationStabilityTableStartY + 5, chartWidth, chartHeight, null, 'FAST');
    }

    yPos = Math.max(doc.lastAutoTable.finalY, automationStabilityTableStartY + chartHeight) + 30;

    // 11. Additional Information Sections
    if (currentReport.requestData && currentReport.requestData.length > 0) {
        addSectionTitle('Request Information');
    }
    if (currentReport.buildData && currentReport.buildData.length > 0) {
        addSectionTitle('Build Information');
    }

    if (currentReport.testerData && currentReport.testerData.length > 0) {
        addSectionTitle('Tester Information');

        const testerHeaders = ['Tester Name', 'Email', 'Roles'];
        const testerData = currentReport.testerData.map(tester => {
            const roles = [];
            if (tester.is_automation_engineer) roles.push('Automation Engineer');
            if (tester.is_manual_engineer) roles.push('Manual Engineer');
            const roleText = roles.length > 0 ? roles.join(', ') : 'No roles assigned';
            return [tester.name, tester.email || '', roleText];
        });

        doc.autoTable({
            startY: yPos,
            head: [testerHeaders],
            body: testerData,
            theme: 'grid',
            headStyles: { fillColor: [60, 141, 188], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 },
            margin: { left: margin, right: margin },
            columnStyles: {
                2: { cellWidth: 'auto' } // Auto-width for roles
            }
        });
        yPos = doc.lastAutoTable.finalY + 30;
    }

    if (currentReport.teamMemberData && currentReport.teamMemberData.length > 0) {
        addSectionTitle('Team Members');

        const teamHeaders = ['Team Member Name', 'Email', 'Role'];
        const teamData = currentReport.teamMemberData.map(member => [
            member.name,
            member.email || '',
            member.role || ''
        ]);

        doc.autoTable({
            startY: yPos,
            head: [teamHeaders],
            body: teamData,
            theme: 'grid',
            headStyles: { fillColor: [60, 141, 188], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 },
            margin: { left: margin, right: margin },
            columnStyles: {
                2: { cellWidth: 'auto' } // Auto-width for role
            }
        });
        yPos = doc.lastAutoTable.finalY + 30;
    }

    // 12. QA Notes
    if (currentReport.qaNotesData && currentReport.qaNotesData.length > 0) {
        addSectionTitle('QA Notes');

        const qaNotesHeaders = ['Note'];
        const qaNotesDataForTable = currentReport.qaNotesData
            .filter(noteItem => noteItem.note && noteItem.note.trim())
            .map(noteItem => [noteItem.note]);

        if (qaNotesDataForTable.length > 0) {
            doc.autoTable({
                startY: yPos,
                head: [qaNotesHeaders],
                body: qaNotesDataForTable,
                theme: 'grid',
                headStyles: { fillColor: [60, 141, 188], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 9, cellPadding: 3, cellWidth: 'auto' },
                margin: { left: margin, right: margin }
            });
            yPos = doc.lastAutoTable.finalY + 30;
        }
    }

    // Charts are now placed beside their respective tables above

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
    }

    doc.save(`QA_Report_Complete_${currentReport.portfolioName}_Sprint_${currentReport.sprintNumber}.pdf`);
    showSuccessToast('Comprehensive PDF export completed successfully!');
}

function exportCurrentReportAsExcel() {
    if (!currentReport) {
        showErrorToast('Report data not loaded yet.');
        return;
    }
    
    showInfoToast('Generating Excel export...');
    
    // Use the same comprehensive Excel export as the main function
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
        ["Field", "Value"],
        ["Portfolio Name", currentReport.portfolioName || 'N/A'],
        ["Project Name", currentReport.projectName || 'N/A'],
        ["Sprint Number", currentReport.sprintNumber || 'N/A'],
        ["Report Version", currentReport.reportVersion || 'N/A'],
        ["Cycle Number", currentReport.cycleNumber || 'N/A'],
        ["Report Date", formatDate(currentReport.reportDate)],
        ["Testing Status", getStatusText(currentReport.testingStatus)],
        ["Test Summary", currentReport.testSummary || 'N/A'],
        ["", ""],
        ["METRICS", ""],
        ["Total User Stories", currentReport.totalUserStories || 0],
        ["Total Test Cases", currentReport.totalTestCases || 0],
        ["Total Issues", currentReport.totalIssues || 0],
        ["Total Enhancements", currentReport.totalEnhancements || 0],
        ["", ""],
        ["AUTOMATION REGRESSION", ""],
        ["Automation Total Test Cases", currentReport.automationTotalTestCases || 0],
        ["Automation Passed Test Cases", currentReport.automationPassedTestCases || 0],
        ["Automation Failed Test Cases", currentReport.automationFailedTestCases || 0],
        ["Automation Skipped Test Cases", currentReport.automationSkippedTestCases || 0],
        ["Automation Stable Tests", currentReport.automationStableTests || 0],
        ["Automation Flaky Tests", currentReport.automationFlakyTests || 0],
        ["QA Notes", currentReport.qaNotesData && currentReport.qaNotesData.length > 0 ? `${currentReport.qaNotesData.length} notes` : 'N/A']
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, wsSummary, "Summary");

    // User Stories Sheet
    const userStoriesData = [
        ["Status", "Count", "Percentage"],
        ["Passed", currentReport.passedUserStories || 0, currentReport.totalUserStories ? Math.round(((currentReport.passedUserStories || 0) / currentReport.totalUserStories) * 100) : 0],
        ["Passed with Issues", currentReport.passedWithIssuesUserStories || 0, currentReport.totalUserStories ? Math.round(((currentReport.passedWithIssuesUserStories || 0) / currentReport.totalUserStories) * 100) : 0],
        ["Failed", currentReport.failedUserStories || 0, currentReport.totalUserStories ? Math.round(((currentReport.failedUserStories || 0) / currentReport.totalUserStories) * 100) : 0],
        ["Blocked", currentReport.blockedUserStories || 0, currentReport.totalUserStories ? Math.round(((currentReport.blockedUserStories || 0) / currentReport.totalUserStories) * 100) : 0],
        ["Cancelled", currentReport.cancelledUserStories || 0, currentReport.totalUserStories ? Math.round(((currentReport.cancelledUserStories || 0) / currentReport.totalUserStories) * 100) : 0],
        ["Deferred", currentReport.deferredUserStories || 0, currentReport.totalUserStories ? Math.round(((currentReport.deferredUserStories || 0) / currentReport.totalUserStories) * 100) : 0],
        ["Not Testable", currentReport.notTestableUserStories || 0, currentReport.totalUserStories ? Math.round(((currentReport.notTestableUserStories || 0) / currentReport.totalUserStories) * 100) : 0]
    ];
    const wsUserStories = XLSX.utils.aoa_to_sheet(userStoriesData);
    XLSX.utils.book_append_sheet(workbook, wsUserStories, "User Stories");

    // Test Cases Sheet
    const testCasesData = [
        ["Status", "Count", "Percentage"],
        ["Passed", currentReport.passedTestCases || 0, currentReport.totalTestCases ? Math.round(((currentReport.passedTestCases || 0) / currentReport.totalTestCases) * 100) : 0],
        ["Passed with Issues", currentReport.passedWithIssuesTestCases || 0, currentReport.totalTestCases ? Math.round(((currentReport.passedWithIssuesTestCases || 0) / currentReport.totalTestCases) * 100) : 0],
        ["Failed", currentReport.failedTestCases || 0, currentReport.totalTestCases ? Math.round(((currentReport.failedTestCases || 0) / currentReport.totalTestCases) * 100) : 0],
        ["Blocked", currentReport.blockedTestCases || 0, currentReport.totalTestCases ? Math.round(((currentReport.blockedTestCases || 0) / currentReport.totalTestCases) * 100) : 0],
        ["Cancelled", currentReport.cancelledTestCases || 0, currentReport.totalTestCases ? Math.round(((currentReport.cancelledTestCases || 0) / currentReport.totalTestCases) * 100) : 0],
        ["Deferred", currentReport.deferredTestCases || 0, currentReport.totalTestCases ? Math.round(((currentReport.deferredTestCases || 0) / currentReport.totalTestCases) * 100) : 0],
        ["Not Testable", currentReport.notTestableTestCases || 0, currentReport.totalTestCases ? Math.round(((currentReport.notTestableTestCases || 0) / currentReport.totalTestCases) * 100) : 0]
    ];
    const wsTestCases = XLSX.utils.aoa_to_sheet(testCasesData);
    XLSX.utils.book_append_sheet(workbook, wsTestCases, "Test Cases");

    // Issues Sheet
    const issuesData = [
        ["Priority/Status", "Count", "Percentage"],
        ["", "", ""],
        ["PRIORITY BREAKDOWN", "", ""],
        ["Critical", currentReport.criticalIssues || 0, currentReport.totalIssues ? Math.round(((currentReport.criticalIssues || 0) / currentReport.totalIssues) * 100) : 0],
        ["High", currentReport.highIssues || 0, currentReport.totalIssues ? Math.round(((currentReport.highIssues || 0) / currentReport.totalIssues) * 100) : 0],
        ["Medium", currentReport.mediumIssues || 0, currentReport.totalIssues ? Math.round(((currentReport.mediumIssues || 0) / currentReport.totalIssues) * 100) : 0],
        ["Low", currentReport.lowIssues || 0, currentReport.totalIssues ? Math.round(((currentReport.lowIssues || 0) / currentReport.totalIssues) * 100) : 0],
        ["", "", ""],
        ["STATUS BREAKDOWN", "", ""],
        ["New", currentReport.newIssues || 0, currentReport.totalIssuesByStatus ? Math.round(((currentReport.newIssues || 0) / currentReport.totalIssuesByStatus) * 100) : 0],
        ["Fixed", currentReport.fixedIssues || 0, currentReport.totalIssuesByStatus ? Math.round(((currentReport.fixedIssues || 0) / currentReport.totalIssuesByStatus) * 100) : 0],
        ["Not Fixed", currentReport.notFixedIssues || 0, currentReport.totalIssuesByStatus ? Math.round(((currentReport.notFixedIssues || 0) / currentReport.totalIssuesByStatus) * 100) : 0],
        ["Re-opened", currentReport.reopenedIssues || 0, currentReport.totalIssuesByStatus ? Math.round(((currentReport.reopenedIssues || 0) / currentReport.totalIssuesByStatus) * 100) : 0],
        ["Deferred", currentReport.deferredIssues || 0, currentReport.totalIssuesByStatus ? Math.round(((currentReport.deferredIssues || 0) / currentReport.totalIssuesByStatus) * 100) : 0]
    ];
    const wsIssues = XLSX.utils.aoa_to_sheet(issuesData);
    XLSX.utils.book_append_sheet(workbook, wsIssues, "Issues");

    // Enhancements Sheet
    const enhancementsData = [
        ["Status", "Count", "Percentage"],
        ["New", currentReport.newEnhancements || 0, currentReport.totalEnhancements ? Math.round(((currentReport.newEnhancements || 0) / currentReport.totalEnhancements) * 100) : 0],
        ["Implemented", currentReport.implementedEnhancements || 0, currentReport.totalEnhancements ? Math.round(((currentReport.implementedEnhancements || 0) / currentReport.totalEnhancements) * 100) : 0],
        ["Exists", currentReport.existsEnhancements || 0, currentReport.totalEnhancements ? Math.round(((currentReport.existsEnhancements || 0) / currentReport.totalEnhancements) * 100) : 0]
    ];
    const wsEnhancements = XLSX.utils.aoa_to_sheet(enhancementsData);
    XLSX.utils.book_append_sheet(workbook, wsEnhancements, "Enhancements");

    // Automation Regression Sheets
    const automationTestCasesData = [
        ["Status", "Count", "Percentage"],
        ["Passed", currentReport.automationPassedTestCases || 0, currentReport.automationPassedPercentage || 0],
        ["Failed", currentReport.automationFailedTestCases || 0, currentReport.automationFailedPercentage || 0],
        ["Skipped", currentReport.automationSkippedTestCases || 0, currentReport.automationSkippedPercentage || 0]
    ];
    const wsAutomationTestCases = XLSX.utils.aoa_to_sheet(automationTestCasesData);
    XLSX.utils.book_append_sheet(workbook, wsAutomationTestCases, "Automation Test Cases");

    const automationStabilityData = [
        ["Stability", "Count", "Percentage"],
        ["Stable", currentReport.automationStableTests || 0, currentReport.automationStablePercentage || 0],
        ["Flaky", currentReport.automationFlakyTests || 0, currentReport.automationFlakyPercentage || 0]
    ];
    const wsAutomationStability = XLSX.utils.aoa_to_sheet(automationStabilityData);
    XLSX.utils.book_append_sheet(workbook, wsAutomationStability, "Automation Stability");

    // Add all the additional sheets like in the main function - REMOVED evaluation
    // if (currentReport.evaluationData && Object.keys(currentReport.evaluationData).length > 0) {
    //     const evaluationHeaders = ["Evaluation Criteria", "Score", "Weight", "Weighted Score"];
    //     const evaluationSheetData = [];
    //     
    //     for (const [key, value] of Object.entries(currentReport.evaluationData)) {
    //         if (key.includes('_score')) {
    //             const criteriaName = key.replace('_score', '').replace(/_/g, ' ').toUpperCase();
    //             const weightKey = key.replace('_score', '_weight');
    //             const weight = currentReport.evaluationData[weightKey] || 1;
    //             const weightedScore = (value || 0) * weight;
    //             evaluationSheetData.push([criteriaName, value || 0, weight, weightedScore]);
    //         }
    //     }
    //     
    //     if (evaluationSheetData.length > 0) {
    //         evaluationSheetData.unshift(["", "", "", ""]);
    //         evaluationSheetData.unshift(["TOTAL EVALUATION SCORE", "", "", currentReport.evaluationTotalScore || 0]);
    //         const wsEvaluation = XLSX.utils.aoa_to_sheet([evaluationHeaders, ...evaluationSheetData]);
    //         XLSX.utils.book_append_sheet(workbook, wsEvaluation, "Evaluation");
    //     }
    // }

    // Dynamic Data Sheets
    if (currentReport.requestData && currentReport.requestData.length > 0) {
        const requestHeaders = ["Request ID", "URL"];
        const requestsSheetData = currentReport.requestData.map(req => [req.id, req.url]);
        const wsRequests = XLSX.utils.aoa_to_sheet([requestHeaders, ...requestsSheetData]);
        XLSX.utils.book_append_sheet(workbook, wsRequests, "Requests");
    }

    if (currentReport.buildData && currentReport.buildData.length > 0) {
        const buildHeaders = ["Request ID", "URL", "Environment", "Cycles"];
        const buildsSheetData = currentReport.buildData.map(build => [build.requestId, build.requestUrl, build.environment, build.cycles]);
        const wsBuilds = XLSX.utils.aoa_to_sheet([buildHeaders, ...buildsSheetData]);
        XLSX.utils.book_append_sheet(workbook, wsBuilds, "Builds");
    }

    if (currentReport.testerData && currentReport.testerData.length > 0) {
        const testerHeaders = ["Tester Name", "Email", "Roles"];
        const testersSheetData = currentReport.testerData.map(tester => {
            const roles = [];
            if (tester.is_automation_engineer) roles.push('Automation Engineer');
            if (tester.is_manual_engineer) roles.push('Manual Engineer');
            const roleText = roles.length > 0 ? roles.join(', ') : 'No roles assigned';
            return [tester.name, tester.email || '', roleText];
        });
        const wsTesters = XLSX.utils.aoa_to_sheet([testerHeaders, ...testersSheetData]);
        XLSX.utils.book_append_sheet(workbook, wsTesters, "Testers");
    }

    if (currentReport.teamMemberData && currentReport.teamMemberData.length > 0) {
        const teamHeaders = ["Team Member Name", "Email", "Role"];
        const teamSheetData = currentReport.teamMemberData.map(member => [member.name, member.email || '', member.role || '']);
        const wsTeam = XLSX.utils.aoa_to_sheet([teamHeaders, ...teamSheetData]);
        XLSX.utils.book_append_sheet(workbook, wsTeam, "Team Members");
    }

    // Custom Fields - REMOVED
    // if (currentReport.customFields && Object.keys(currentReport.customFields).length > 0) {
    //     const customFieldsHeaders = ["Field Name", "Value"];
    //     const customFieldsSheetData = Object.entries(currentReport.customFields).map(([key, value]) => [key, value]);
    //     const wsCustomFields = XLSX.utils.aoa_to_sheet([customFieldsHeaders, ...customFieldsSheetData]);
    //     XLSX.utils.book_append_sheet(workbook, wsCustomFields, "Custom Fields");
    // }

    XLSX.writeFile(workbook, `QA_Report_${currentReport.portfolioName}_Sprint_${currentReport.sprintNumber}_Complete.xlsx`);
    showSuccessToast('Excel export completed successfully!');
}

async function exportStyledReportAsPdf() {
    if (!currentReport) {
        showErrorToast('Report data not loaded yet.');
        return;
    }

    showInfoToast('Generating styled PDF export...');

    const { jsPDF } = window.jspdf;
    const reportContent = document.querySelector('#reportContent');
    const sections = Array.from(reportContent.querySelectorAll('.dashboard-section'));

    if (!sections.length) {
        showErrorToast('Report content not found.');
        return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 15;

    // Correctly detect theme based on the 'data-theme' attribute
    const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
    
    // Use EXACT colors from the CSS light theme variables to match view report
    const themeColors = {
        background: isLightMode ? '#ffffff' : '#0f172a',
        surface: isLightMode ? '#f8fafc' : '#1e293b',
        textPrimary: isLightMode ? '#1e293b' : '#f1f5f9',
        textSecondary: isLightMode ? '#64748b' : '#94a3b8',
        border: isLightMode ? '#e2e8f0' : '#334155',
        primary: '#3b82f6'
    };
    
    const themeBackgroundColor = themeColors.background;
    const textColor = themeColors.textPrimary;
    
    console.log('Light mode detected:', isLightMode);
    console.log('Using background color:', themeBackgroundColor);

    const addPageBackground = () => {
        pdf.setFillColor(themeBackgroundColor);
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
    };

    addPageBackground();

    pdf.setTextColor(textColor);
    pdf.setFontSize(18);
    pdf.text(document.getElementById('reportTitle').innerText, pdfWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
    pdf.setFontSize(10);
    pdf.text(document.getElementById('reportSubtitle').innerText, pdfWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    for (const section of sections) {
        try {
            const canvas = await html2canvas(section, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: themeBackgroundColor
            });

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pdfWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            if (yPosition + imgHeight > pdfHeight - 15) {
                pdf.addPage();
                addPageBackground();
                yPosition = 15;
            }

            pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight, null, 'FAST');
            yPosition += imgHeight + 5;

        } catch (error) {
            console.error('Could not render section to PDF:', error, section);
        }
    }

    pdf.save(`QA_Report_${currentReport.portfolioName}_Sprint_${currentReport.sprintNumber}_Styled.pdf`);
    showSuccessToast('Styled PDF export completed successfully!');
}

// Custom Message Box (instead of alert)
function showCustomMessageBox(message) {
    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--surface);
        color: var(--text-primary);
        padding: 20px;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-heavy);
        z-index: 9999;
        text-align: center;
        max-width: 300px;
        border: 1px solid var(--border);
    `;
    messageBox.innerHTML = `
        <p>${message}</p>
        <button onclick="this.parentNode.remove()" style="
            background: var(--primary);
            color: var(--text-primary);
            border: none;
            padding: 8px 15px;
            border-radius: var(--border-radius);
            cursor: pointer;
            margin-top: 10px;
        ">OK</button>
    `;
    document.body.appendChild(messageBox);
}

// Authentication functions
async function loadUserInfo() {
    try {
        const response = await fetch('/api/auth/profile');
        if (response.ok) {
            const result = await response.json();
            const user = result.user || result; // Handle different response formats
            
            // Update user name in navigation
            const userNameElement = document.querySelector('.user-name');
            if (userNameElement && user.first_name) {
                userNameElement.textContent = user.first_name;
            }
            
            // Show/hide admin links based on user role
            const adminLinks = document.querySelectorAll('.admin-only');
            if (user.is_admin) {
                adminLinks.forEach(link => link.style.display = 'block');
            } else {
                adminLinks.forEach(link => link.style.display = 'none');
            }
        } else {
            // User not authenticated, redirect to login
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Failed to load user info:', error);
        window.location.href = '/login';
    }
}

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    } catch (error) {
        window.location.href = '/login';
    }
}

function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('mobile-active');
}