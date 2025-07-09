async function exportCurrentReportAsPdf() {
    if (!currentReport) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Helper function to add charts as images
    async function addChartToPDF(chartId, yPosition, title, width = 180, height = 100) {
        const canvas = document.getElementById(chartId);
        if (canvas && viewCharts[chartId.replace('ViewChart', '').replace('View', '')]) {
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(title, 10, yPosition);
            
            const imgData = canvas.toDataURL('image/png');
            doc.addImage(imgData, 'PNG', 10, yPosition + 5, width, height);
            return yPosition + height + 15;
        }
        return yPosition;
    }

    // Helper function to check if we need a new page
    function checkPageBreak(currentY, requiredSpace = 40) {
        if (currentY + requiredSpace > 270) {
            doc.addPage();
            return 20;
        }
        return currentY;
    }

    let yPos = 20;

    // Title and Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('QA Testing Report', 105, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text(`${currentReport.portfolioName} - Sprint ${currentReport.sprintNumber}`, 105, yPos, { align: 'center' });
    yPos += 8;
    doc.text(`${currentReport.projectName} | Version ${currentReport.reportVersion} | ${formatDate(currentReport.reportDate)}`, 105, yPos, { align: 'center' });
    yPos += 20;

    // Cover Information Section
    yPos = checkPageBreak(yPos, 60);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('General Details', 10, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
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
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [79, 172, 254], textColor: 255 },
        columnStyles: { 0: { fontStyle: 'bold' } }
    });
    yPos = doc.lastAutoTable.finalY + 15;

    // Test Summary
    if (currentReport.testSummary) {
        yPos = checkPageBreak(yPos, 40);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Test Summary & Status', 10, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const summaryText = doc.splitTextToSize(currentReport.testSummary, 190);
        doc.text(summaryText, 10, yPos);
        yPos += summaryText.length * 6 + 15;
    }

    // Testing Metrics Overview
    yPos = checkPageBreak(yPos, 50);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Testing Metrics Overview', 10, yPos);
    yPos += 10;

    const metricsData = [
        ['Total User Stories', currentReport.totalUserStories || 0],
        ['Total Test Cases', currentReport.totalTestCases || 0],
        ['Total Issues', currentReport.totalIssues || 0],
        ['Total Enhancements', currentReport.totalEnhancements || 0],
        ['Evaluation Score', currentReport.evaluationTotalScore || '0.0'],
        ['Project Score', currentReport.projectEvaluationTotalScore || '0.0']
    ];

    doc.autoTable({
        startY: yPos,
        head: [['Metric', 'Value']],
        body: metricsData,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [79, 172, 254], textColor: 255 },
        columnStyles: { 0: { fontStyle: 'bold' } }
    });
    yPos = doc.lastAutoTable.finalY + 20;

    // User Stories Analysis with Chart
    yPos = checkPageBreak(yPos, 130);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('User Stories Analysis', 10, yPos);
    yPos += 15;

    // User Stories Table
    const total = currentReport.totalUserStories || 0;
    const userStoriesData = [
        ['Total User Stories', total, '100%'],
        ['Passed', currentReport.passedUserStories || 0, `${total ? Math.round(((currentReport.passedUserStories || 0) / total) * 100) : 0}%`],
        ['Passed with Issues', currentReport.passedWithIssuesUserStories || 0, `${total ? Math.round(((currentReport.passedWithIssuesUserStories || 0) / total) * 100) : 0}%`],
        ['Failed', currentReport.failedUserStories || 0, `${total ? Math.round(((currentReport.failedUserStories || 0) / total) * 100) : 0}%`],
        ['Blocked', currentReport.blockedUserStories || 0, `${total ? Math.round(((currentReport.blockedUserStories || 0) / total) * 100) : 0}%`],
        ['Cancelled', currentReport.cancelledUserStories || 0, `${total ? Math.round(((currentReport.cancelledUserStories || 0) / total) * 100) : 0}%`],
        ['Deferred', currentReport.deferredUserStories || 0, `${total ? Math.round(((currentReport.deferredUserStories || 0) / total) * 100) : 0}%`],
        ['Not Testable', currentReport.notTestableUserStories || 0, `${total ? Math.round(((currentReport.notTestableUserStories || 0) / total) * 100) : 0}%`]
    ];

    doc.autoTable({
        startY: yPos,
        head: [['Status', 'Count', 'Percentage']],
        body: userStoriesData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [40, 167, 69], textColor: 255 }
    });
    yPos = doc.lastAutoTable.finalY + 10;

    // Add User Stories Chart
    yPos = await addChartToPDF('userStoriesViewChart', yPos, 'User Stories Distribution Chart');

    // Test Cases Analysis with Chart
    doc.addPage();
    yPos = 20;
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Test Cases Analysis', 10, yPos);
    yPos += 15;

    const testCasesTotal = currentReport.totalTestCases || 0;
    const testCasesData = [
        ['Total Test Cases', testCasesTotal, '100%'],
        ['Passed', currentReport.passedTestCases || 0, `${testCasesTotal ? Math.round(((currentReport.passedTestCases || 0) / testCasesTotal) * 100) : 0}%`],
        ['Passed with Issues', currentReport.passedWithIssuesTestCases || 0, `${testCasesTotal ? Math.round(((currentReport.passedWithIssuesTestCases || 0) / testCasesTotal) * 100) : 0}%`],
        ['Failed', currentReport.failedTestCases || 0, `${testCasesTotal ? Math.round(((currentReport.failedTestCases || 0) / testCasesTotal) * 100) : 0}%`],
        ['Blocked', currentReport.blockedTestCases || 0, `${testCasesTotal ? Math.round(((currentReport.blockedTestCases || 0) / testCasesTotal) * 100) : 0}%`],
        ['Cancelled', currentReport.cancelledTestCases || 0, `${testCasesTotal ? Math.round(((currentReport.cancelledTestCases || 0) / testCasesTotal) * 100) : 0}%`],
        ['Deferred', currentReport.deferredTestCases || 0, `${testCasesTotal ? Math.round(((currentReport.deferredTestCases || 0) / testCasesTotal) * 100) : 0}%`],
        ['Not Testable', currentReport.notTestableTestCases || 0, `${testCasesTotal ? Math.round(((currentReport.notTestableTestCases || 0) / testCasesTotal) * 100) : 0}%`]
    ];

    doc.autoTable({
        startY: yPos,
        head: [['Status', 'Count', 'Percentage']],
        body: testCasesData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [40, 167, 69], textColor: 255 }
    });
    yPos = doc.lastAutoTable.finalY + 10;

    // Add Test Cases Chart
    yPos = await addChartToPDF('testCasesViewChart', yPos, 'Test Cases Distribution Chart');

    // Issues Analysis with Charts
    doc.addPage();
    yPos = 20;
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Issues Analysis', 10, yPos);
    yPos += 15;

    // Issues by Priority
    const issuesTotal = currentReport.totalIssues || 0;
    const issuesPriorityData = [
        ['Total Issues', issuesTotal, '100%'],
        ['Critical', currentReport.criticalIssues || 0, `${issuesTotal ? Math.round(((currentReport.criticalIssues || 0) / issuesTotal) * 100) : 0}%`],
        ['High', currentReport.highIssues || 0, `${issuesTotal ? Math.round(((currentReport.highIssues || 0) / issuesTotal) * 100) : 0}%`],
        ['Medium', currentReport.mediumIssues || 0, `${issuesTotal ? Math.round(((currentReport.mediumIssues || 0) / issuesTotal) * 100) : 0}%`],
        ['Low', currentReport.lowIssues || 0, `${issuesTotal ? Math.round(((currentReport.lowIssues || 0) / issuesTotal) * 100) : 0}%`]
    ];

    doc.autoTable({
        startY: yPos,
        head: [['Priority', 'Count', 'Percentage']],
        body: issuesPriorityData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [220, 53, 69], textColor: 255 }
    });
    yPos = doc.lastAutoTable.finalY + 10;

    // Add Issues Priority Chart
    yPos = await addChartToPDF('issuesPriorityViewChart', yPos, 'Issues by Priority Chart', 180, 80);

    // Issues by Status
    yPos = checkPageBreak(yPos, 100);
    const issuesStatusData = [
        ['New', currentReport.newIssues || 0, `${issuesTotal ? Math.round(((currentReport.newIssues || 0) / issuesTotal) * 100) : 0}%`],
        ['Fixed', currentReport.fixedIssues || 0, `${issuesTotal ? Math.round(((currentReport.fixedIssues || 0) / issuesTotal) * 100) : 0}%`],
        ['Not Fixed', currentReport.notFixedIssues || 0, `${issuesTotal ? Math.round(((currentReport.notFixedIssues || 0) / issuesTotal) * 100) : 0}%`],
        ['Re-opened', currentReport.reopenedIssues || 0, `${issuesTotal ? Math.round(((currentReport.reopenedIssues || 0) / issuesTotal) * 100) : 0}%`],
        ['Deferred', currentReport.deferredIssues || 0, `${issuesTotal ? Math.round(((currentReport.deferredIssues || 0) / issuesTotal) * 100) : 0}%`]
    ];

    doc.autoTable({
        startY: yPos,
        head: [['Status', 'Count', 'Percentage']],
        body: issuesStatusData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [23, 162, 184], textColor: 255 }
    });
    yPos = doc.lastAutoTable.finalY + 10;

    // Add Issues Status Chart
    yPos = await addChartToPDF('issuesStatusViewChart', yPos, 'Issues by Status Chart', 180, 80);

    // Enhancements Analysis with Chart
    yPos = checkPageBreak(yPos, 130);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Enhancements Analysis', 10, yPos);
    yPos += 15;

    const enhancementsTotal = currentReport.totalEnhancements || 0;
    const enhancementsData = [
        ['Total Enhancements', enhancementsTotal, '100%'],
        ['New', currentReport.newEnhancements || 0, `${enhancementsTotal ? Math.round(((currentReport.newEnhancements || 0) / enhancementsTotal) * 100) : 0}%`],
        ['Implemented', currentReport.implementedEnhancements || 0, `${enhancementsTotal ? Math.round(((currentReport.implementedEnhancements || 0) / enhancementsTotal) * 100) : 0}%`],
        ['Exists', currentReport.existsEnhancements || 0, `${enhancementsTotal ? Math.round(((currentReport.existsEnhancements || 0) / enhancementsTotal) * 100) : 0}%`]
    ];

    doc.autoTable({
        startY: yPos,
        head: [['Status', 'Count', 'Percentage']],
        body: enhancementsData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [111, 66, 193], textColor: 255 }
    });
    yPos = doc.lastAutoTable.finalY + 10;

    // Add Enhancements Chart
    yPos = await addChartToPDF('enhancementsViewChart', yPos, 'Enhancements Distribution Chart');

    // Additional Information
    if ((currentReport.requestData && currentReport.requestData.length > 0) ||
        (currentReport.buildData && currentReport.buildData.length > 0) ||
        (currentReport.testerData && currentReport.testerData.length > 0)) {
        
        doc.addPage();
        yPos = 20;
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Additional Information', 10, yPos);
        yPos += 15;

        // Requests
        if (currentReport.requestData && currentReport.requestData.length > 0) {
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Request Information', 10, yPos);
            yPos += 8;

            const requestsData = currentReport.requestData.map(req => [req.id, req.url]);
            doc.autoTable({
                startY: yPos,
                head: [['Request ID', 'URL']],
                body: requestsData,
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [100, 180, 250], textColor: 255 }
            });
            yPos = doc.lastAutoTable.finalY + 15;
        }

        // Builds
        if (currentReport.buildData && currentReport.buildData.length > 0) {
            yPos = checkPageBreak(yPos, 40);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Build Information', 10, yPos);
            yPos += 8;

            const buildsData = currentReport.buildData.map(build => [build.requestId, build.environment, build.cycles]);
            doc.autoTable({
                startY: yPos,
                head: [['Request ID', 'Environment', 'Cycles']],
                body: buildsData,
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [100, 180, 250], textColor: 255 }
            });
            yPos = doc.lastAutoTable.finalY + 15;
        }

        // Testers
        if (currentReport.testerData && currentReport.testerData.length > 0) {
            yPos = checkPageBreak(yPos, 40);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Testers', 10, yPos);
            yPos += 8;

            const testersData = currentReport.testerData.map(tester => [tester.name]);
            doc.autoTable({
                startY: yPos,
                head: [['Tester Name']],
                body: testersData,
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [100, 180, 250], textColor: 255 }
            });
            yPos = doc.lastAutoTable.finalY + 15;
        }
    }

    // Evaluation Results
    if (currentReport.evaluationData && Object.keys(currentReport.evaluationData).length > 0) {
        yPos = checkPageBreak(yPos, 60);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Evaluation Results', 10, yPos);
        yPos += 15;

        doc.setFontSize(12);
        doc.text(`Total Evaluation Score: ${currentReport.evaluationTotalScore || '0.0'}`, 10, yPos);
        yPos += 15;

        const evalData = Object.entries(currentReport.evaluationData)
            .filter(([key]) => key.includes('_score'))
            .map(([key, value]) => {
                const baseName = key.replace('eval_', '').replace('_score', '');
                const weightKey = `eval_${baseName}_weight`;
                return [
                    baseName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    value || 'N/A',
                    currentReport.evaluationData[weightKey] || 'N/A'
                ];
            });

        if (evalData.length > 0) {
            doc.autoTable({
                startY: yPos,
                head: [['Criteria', 'Score', 'Weight']],
                body: evalData,
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [79, 172, 254], textColor: 255 }
            });
            yPos = doc.lastAutoTable.finalY + 15;
        }
    }

    // Project Evaluation Results
    if (currentReport.projectEvaluationData && Object.keys(currentReport.projectEvaluationData).length > 0) {
        yPos = checkPageBreak(yPos, 60);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Project Evaluation Results', 10, yPos);
        yPos += 15;

        doc.setFontSize(12);
        doc.text(`Total Project Score: ${currentReport.projectEvaluationTotalScore || '0.0'}`, 10, yPos);
        yPos += 15;

        const projEvalData = Object.entries(currentReport.projectEvaluationData)
            .filter(([key]) => key.includes('_score'))
            .map(([key, value]) => {
                const baseName = key.replace('proj_', '').replace('_score', '');
                const reasonKey = `proj_${baseName}_reason`;
                return [
                    baseName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    value || 'N/A',
                    currentReport.projectEvaluationData[reasonKey] || 'N/A'
                ];
            });

        if (projEvalData.length > 0) {
            doc.autoTable({
                startY: yPos,
                head: [['Criteria', 'Score', 'Reason']],
                body: projEvalData,
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [79, 172, 254], textColor: 255 }
            });
            yPos = doc.lastAutoTable.finalY + 15;
        }
    }

    // Custom Fields
    if (currentReport.customFields && Object.keys(currentReport.customFields).length > 0) {
        yPos = checkPageBreak(yPos, 40);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Custom Fields', 10, yPos);
        yPos += 15;

        const customFieldsData = Object.entries(currentReport.customFields).map(([key, value]) => [
            key.replace(/custom_/g, '').replace(/_/g, ' '),
            Array.isArray(value) ? value.join(', ') : (value || 'N/A')
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Field Name', 'Value']],
            body: customFieldsData,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [79, 172, 254], textColor: 255 }
        });
        yPos = doc.lastAutoTable.finalY + 15;
    }

    // QA Notes
    if (currentReport.qaNotesText) {
        yPos = checkPageBreak(yPos, 40);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('QA Notes', 10, yPos);
        yPos += 15;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const notesText = doc.splitTextToSize(currentReport.qaNotesText, 190);
        doc.text(notesText, 10, yPos);
    }

    // Save the PDF
    doc.save(`QA_Report_${currentReport.portfolioName}_Sprint_${currentReport.sprintNumber}_Complete.pdf`);
}