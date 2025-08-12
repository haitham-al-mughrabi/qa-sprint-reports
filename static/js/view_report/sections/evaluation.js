function renderEvaluationView(report, isLightMode) {
    const evaluationCriteria = [
        { key: 'involvement', label: 'Involvement', maxScore: 20 },
        { key: 'requirementsQuality', label: 'Requirements Quality', maxScore: 10 },
        { key: 'qaPlanReview', label: 'QA Plan Review', maxScore: 5 },
        { key: 'ux', label: 'UX', maxScore: 5 },
        { key: 'cooperation', label: 'Cooperation', maxScore: 10 },
        { key: 'criticalBugs', label: 'Critical Bugs', maxScore: 0 },
        { key: 'highBugs', label: 'High Bugs', maxScore: 15 },
        { key: 'mediumBugs', label: 'Medium Bugs', maxScore: 10 },
        { key: 'lowBugs', label: 'Low Bugs', maxScore: 5 }
    ];

    // Check if there's any evaluation data
    const hasEvaluationData = evaluationCriteria.some(criteria => {
        const scoreKey = `${criteria.key}Score`;
        const reasonKey = `${criteria.key}Reason`;
        return (report[scoreKey] && report[scoreKey] > 0) || (report[reasonKey] && report[reasonKey].trim());
    });

    const evaluationSection = document.getElementById('evaluationSection');
    if (!hasEvaluationData) {
        evaluationSection.style.display = 'none';
        return;
    }
    
    evaluationSection.style.display = 'block';

    // Render evaluation table
    const tableBody = document.getElementById('evaluationTableBody');
    let tableRows = '';
    let finalScore = 0;

    evaluationCriteria.forEach(criteria => {
        const scoreKey = `${criteria.key}Score`;
        const reasonKey = `${criteria.key}Reason`;
        const score = report[scoreKey] || 0;
        const reason = report[reasonKey] || 'N/A';
        
        finalScore += score;
        
        tableRows += `
            <tr>
                <td><strong>${criteria.label}</strong></td>
                <td>${criteria.maxScore}</td>
                <td>${score}</td>
                <td>${reason}</td>
            </tr>
        `;
    });

    tableBody.innerHTML = tableRows;
    document.getElementById('finalScoreDisplay').textContent = finalScore;

    // Render evaluation chart
    renderEvaluationChart(report, isLightMode);
}

function renderEvaluationChart(report, isLightMode) {
    const ctx = document.getElementById('evaluationViewChart');
    if (!ctx) return;

    const evaluationData = {
        'Involvement': report.involvementScore || 0,
        'Requirements Quality': report.requirementsQualityScore || 0,
        'QA Plan Review': report.qaPlanReviewScore || 0,
        'UX': report.uxScore || 0,
        'Cooperation': report.cooperationScore || 0,
        'Critical Bugs': report.criticalBugsScore || 0,
        'High Bugs': report.highBugsScore || 0,
        'Medium Bugs': report.mediumBugsScore || 0,
        'Low Bugs': report.lowBugsScore || 0
    };

    const maxScores = {
        'Involvement': 20,
        'Requirements Quality': 10,
        'QA Plan Review': 5,
        'UX': 5,
        'Cooperation': 10,
        'Critical Bugs': 0,
        'High Bugs': 15,
        'Medium Bugs': 10,
        'Low Bugs': 5
    };

    const labels = Object.keys(evaluationData).filter(key => evaluationData[key] > 0);
    const data = labels.map(label => evaluationData[label]);
    const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
        '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899'
    ];

    // Destroy existing chart if it exists
    if (viewCharts.evaluationChart) {
        viewCharts.evaluationChart.destroy();
    }

    const finalScore = Object.values(evaluationData).reduce((a, b) => a + b, 0);

    viewCharts.evaluationChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: colors.slice(0, labels.length).map(color => color + '80'),
                borderWidth: 2
            }]
        },
        options: {
            ...getViewChartOptions(isLightMode),
            plugins: {
                ...getViewChartOptions(isLightMode).plugins,
                title: {
                    display: true,
                    text: `Total Score: ${finalScore}/100`,
                    font: {
                        size: 14,
                        weight: 'bold',
                        family: 'Poppins'
                    },
                    color: isLightMode ? '#1e293b' : '#f1f5f9'
                },
                tooltip: {
                    ...getViewChartOptions(isLightMode).plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const label = context.label;
                            const value = context.parsed;
                            const maxValue = maxScores[label];
                            return `${label}: ${value}/${maxValue}`;
                        }
                    }
                }
            }
        }
    });
}