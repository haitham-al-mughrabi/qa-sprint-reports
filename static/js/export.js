// static/js/export.js
// Export Functions

// --- Enhanced Export Functions ---
async function exportReportAsPdf(id) {
    if (typeof showToast === 'function') {
        showToast('Preparing PDF export...', 'info', 2000);
    }

    try {
        const response = await fetch(`/api/reports/${id}/export/pdf`, {
            method: 'GET',
            headers: {
                'Accept': 'application/pdf'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Export failed: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QA_Report_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        if (typeof showToast === 'function') {
            showToast('PDF exported successfully!', 'success');
        }
    } catch (error) {
        console.error('PDF export error:', error);
        if (typeof showToast === 'function') {
            showToast('PDF export failed: ' + error.message, 'error');
        }
    }
}

async function exportReportAsExcel(id) {
    if (typeof showToast === 'function') {
        showToast('Preparing Excel export...', 'info', 2000);
    }

    try {
        // First fetch the report data
        const report = await fetchReport(id);
        if (!report) {
            throw new Error('Report not found');
        }

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Main report data
        const reportHeaders = [
            "Field", "Value"
        ];

        const reportData = [
            ["Portfolio", report.portfolioName || ''],
            ["Project", report.projectName || ''],
            ["Report Date", report.reportDate || ''],
            ["Environment", report.environment || ''],
            ["Sprint Number", report.sprintNumber || ''],
            ["Cycle Number", report.cycleNumber || ''],
            ["Release Number", report.releaseNumber || ''],
            ["Report Type", report.reportType || ''],
            ["Status", report.status || ''],
            ["Created By", report.createdBy || ''],
            ["Created At", report.createdAt || '']
        ];

        // Add metrics based on report type
        if (report.reportType === 'sprint' || report.reportType === 'manual') {
            reportData.push(
                ["User Stories Total", report.userStoriesMetric || 0],
                ["Test Cases Total", report.testCasesMetric || 0],
                ["Issues Total", report.issuesMetric || 0],
                ["Enhancements Total", report.enhancementsMetric || 0],
                ["QA Notes Count", report.qaNotesMetric || 0]
            );
        }

        if (report.reportType === 'automation') {
            reportData.push(
                ["Automation Total Tests", report.automationTotalTestCases || 0],
                ["Automation Passed Tests", report.automationPassedTestCases || 0],
                ["Automation Failed Tests", report.automationFailedTestCases || 0],
                ["Automation Skipped Tests", report.automationSkippedTestCases || 0]
            );
        }

        const wsReport = XLSX.utils.aoa_to_sheet([reportHeaders, ...reportData]);
        XLSX.utils.book_append_sheet(workbook, wsReport, "Report Summary");

        // User Stories data (for sprint/manual reports)
        if ((report.reportType === 'sprint' || report.reportType === 'manual') && 
            (report.passedStories || report.failedStories || report.blockedStories)) {
            const userStoriesHeaders = ["Status", "Count"];
            const userStoriesData = [
                ["Passed", report.passedStories || 0],
                ["Passed with Issues", report.passedWithIssuesStories || 0],
                ["Failed", report.failedStories || 0],
                ["Blocked", report.blockedStories || 0],
                ["Cancelled", report.cancelledStories || 0],
                ["Deferred", report.deferredStories || 0],
                ["Not Testable", report.notTestableStories || 0]
            ];
            const wsUserStories = XLSX.utils.aoa_to_sheet([userStoriesHeaders, ...userStoriesData]);
            XLSX.utils.book_append_sheet(workbook, wsUserStories, "User Stories");
        }

        // Test Cases data (for sprint/manual reports)
        if ((report.reportType === 'sprint' || report.reportType === 'manual') && 
            (report.passedTestCases || report.failedTestCases || report.blockedTestCases)) {
            const testCasesHeaders = ["Status", "Count"];
            const testCasesData = [
                ["Passed", report.passedTestCases || 0],
                ["Passed with Issues", report.passedWithIssuesTestCases || 0],
                ["Failed", report.failedTestCases || 0],
                ["Blocked", report.blockedTestCases || 0],
                ["Cancelled", report.cancelledTestCases || 0],
                ["Deferred", report.deferredTestCases || 0],
                ["Not Testable", report.notTestableTestCases || 0]
            ];
            const wsTestCases = XLSX.utils.aoa_to_sheet([testCasesHeaders, ...testCasesData]);
            XLSX.utils.book_append_sheet(workbook, wsTestCases, "Test Cases");
        }

        // Issues data (for sprint/manual reports)
        if ((report.reportType === 'sprint' || report.reportType === 'manual') && 
            (report.criticalIssues || report.highIssues || report.mediumIssues || report.lowIssues)) {
            const issuesHeaders = ["Priority", "Count", "Status", "Count"];
            const issuesData = [
                ["Critical", report.criticalIssues || 0, "New", report.newIssues || 0],
                ["High", report.highIssues || 0, "Fixed", report.fixedIssues || 0],
                ["Medium", report.mediumIssues || 0, "Not Fixed", report.notFixedIssues || 0],
                ["Low", report.lowIssues || 0, "Re-opened", report.reopenedIssues || 0],
                ["", "", "Deferred", report.deferredIssues || 0]
            ];
            const wsIssues = XLSX.utils.aoa_to_sheet([issuesHeaders, ...issuesData]);
            XLSX.utils.book_append_sheet(workbook, wsIssues, "Issues");
        }

        // Enhancements data (for sprint/manual reports)
        if ((report.reportType === 'sprint' || report.reportType === 'manual') && 
            (report.newEnhancements || report.implementedEnhancements || report.existsEnhancements)) {
            const enhancementsHeaders = ["Status", "Count"];
            const enhancementsData = [
                ["New", report.newEnhancements || 0],
                ["Implemented", report.implementedEnhancements || 0],
                ["Exists", report.existsEnhancements || 0]
            ];
            const wsEnhancements = XLSX.utils.aoa_to_sheet([enhancementsHeaders, ...enhancementsData]);
            XLSX.utils.book_append_sheet(workbook, wsEnhancements, "Enhancements");
        }

        // Automation data (for automation reports)
        if (report.reportType === 'automation' && 
            (report.automationPassedTestCases || report.automationFailedTestCases || report.automationSkippedTestCases)) {
            const automationHeaders = ["Status", "Count"];
            const automationData = [
                ["Passed", report.automationPassedTestCases || 0],
                ["Failed", report.automationFailedTestCases || 0],
                ["Skipped", report.automationSkippedTestCases || 0],
                ["Stable", report.automationStableTests || 0],
                ["Flaky", report.automationFlakyTests || 0]
            ];
            const wsAutomation = XLSX.utils.aoa_to_sheet([automationHeaders, ...automationData]);
            XLSX.utils.book_append_sheet(workbook, wsAutomation, "Automation");
        }

        // Performance Scenarios (for performance reports)
        if (report.performanceScenarios && report.performanceScenarios.length > 0) {
            const scenariosHeaders = ["Scenario Name", "Users", "Steps"];
            const scenariosData = report.performanceScenarios.map(scenario => [
                scenario.scenario_name || '',
                scenario.users || '',
                scenario.steps || ''
            ]);
            const wsScenarios = XLSX.utils.aoa_to_sheet([scenariosHeaders, ...scenariosData]);
            XLSX.utils.book_append_sheet(workbook, wsScenarios, "Performance Scenarios");
        }

        // HTTP Requests (for performance reports)
        if (report.httpRequestsOverview && report.httpRequestsOverview.length > 0) {
            const requestsHeaders = ["Endpoint", "Status", "Count", "Avg Time"];
            const requestsData = report.httpRequestsOverview.map(request => [
                request.request_endpoint || '',
                request.status || '',
                request.count || '',
                request.avg_time || ''
            ]);
            const wsRequests = XLSX.utils.aoa_to_sheet([requestsHeaders, ...requestsData]);
            XLSX.utils.book_append_sheet(workbook, wsRequests, "HTTP Requests");
        }

        // Bugs (for automation reports)
        if (report.bugsData && report.bugsData.length > 0) {
            const bugsHeaders = ["Title", "Description", "Severity", "Status", "URL"];
            const bugsData = report.bugsData.map(bug => [
                bug.title || '',
                bug.description || '',
                bug.severity || '',
                bug.status || '',
                bug.url || ''
            ]);
            const wsBugs = XLSX.utils.aoa_to_sheet([bugsHeaders, ...bugsData]);
            XLSX.utils.book_append_sheet(workbook, wsBugs, "Bugs");
        }

        // Request Data
        if (report.requestData && report.requestData.length > 0) {
            const requestHeaders = ["Request ID", "URL"];
            const requestsSheetData = report.requestData.map(request => [request.requestId, request.requestUrl]);
            const wsRequests = XLSX.utils.aoa_to_sheet([requestHeaders, ...requestsSheetData]);
            XLSX.utils.book_append_sheet(workbook, wsRequests, "Requests");
        }

        // Build Data
        if (report.buildData && report.buildData.length > 0) {
            const buildHeaders = ["Request ID", "URL", "Environment", "Cycles"];
            const buildsSheetData = report.buildData.map(build => [build.requestId, build.requestUrl, build.environment, build.cycles]);
            const wsBuilds = XLSX.utils.aoa_to_sheet([buildHeaders, ...buildsSheetData]);
            XLSX.utils.book_append_sheet(workbook, wsBuilds, "Builds");
        }

        // Tester Data
        if (report.testerData && report.testerData.length > 0) {
            const testerHeaders = ["Tester Name", "Email", "Roles"];
            const testersSheetData = report.testerData.map(tester => {
                const roles = [];
                if (tester.is_automation_engineer) roles.push('Automation Engineer');
                if (tester.is_manual_engineer) roles.push('Manual Engineer');
                const roleText = roles.length > 0 ? roles.join(', ') : 'No roles assigned';
                return [tester.name, tester.email, roleText];
            });
            const wsTesters = XLSX.utils.aoa_to_sheet([testerHeaders, ...testersSheetData]);
            XLSX.utils.book_append_sheet(workbook, wsTesters, "Testers");
        }

        // Team Member Data
        if (report.teamMemberData && report.teamMemberData.length > 0) {
            const teamMemberHeaders = ["Name", "Email", "Role"];
            const teamMembersSheetData = report.teamMemberData.map(member => [member.name, member.email, member.role]);
            const wsTeamMembers = XLSX.utils.aoa_to_sheet([teamMemberHeaders, ...teamMembersSheetData]);
            XLSX.utils.book_append_sheet(workbook, wsTeamMembers, "Team Members");
        }

        // QA Notes
        if (report.qaNotesData && report.qaNotesData.length > 0) {
            const qaNotesHeaders = ["Note"];
            const qaNotesSheetData = report.qaNotesData.map(note => [note.note || '']);
            const wsQANotes = XLSX.utils.aoa_to_sheet([qaNotesHeaders, ...qaNotesSheetData]);
            XLSX.utils.book_append_sheet(workbook, wsQANotes, "QA Notes");
        }

        // Evaluation Data
        if (report.evaluationData && report.evaluationData.length > 0) {
            const evaluationHeaders = ["Criteria", "Score", "Reason"];
            const evaluationSheetData = report.evaluationData.map(eval => [eval.criteria, eval.score, eval.reason]);
            const wsEvaluation = XLSX.utils.aoa_to_sheet([evaluationHeaders, ...evaluationSheetData]);
            XLSX.utils.book_append_sheet(workbook, wsEvaluation, "Evaluation");
        }

        try {
            const fileName = `QA_Report_${report.portfolioName || 'Unknown'}_${report.reportType || 'Report'}_${report.sprintNumber || id}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            if (typeof showToast === 'function') {
                showToast('Excel report exported successfully!', 'success');
            }
        } catch (error) {
            console.error('Error exporting Excel file:', error);
            if (typeof showToast === 'function') {
                showToast('Failed to export Excel file. Please try again.', 'error');
            }
        }
    } catch (error) {
        console.error('Excel export error:', error);
        if (typeof showToast === 'function') {
            showToast('Excel export failed: ' + error.message, 'error');
        }
    }
}

// Make functions globally accessible
window.exportReportAsPdf = exportReportAsPdf;
window.exportReportAsExcel = exportReportAsExcel;