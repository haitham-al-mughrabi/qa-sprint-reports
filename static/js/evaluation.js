// static/js/evaluation.js
// Evaluation Section Functions

// Function to update evaluation score and chart
function updateEvaluationScore() {
    // Get all evaluation scores from the table inputs
    const criteria = [
        'Involvement', 'Requirements Quality', 'QA Plan Review', 'UX', 'Cooperation',
        'Critical Bugs', 'High Bugs', 'Medium Bugs', 'Low Bugs'
    ];

    const fieldIds = [
        'involvementScore', 'requirementsScore', 'qaPlanScore', 'uxScore', 'cooperationScore',
        'criticalBugsScore', 'highBugsScore', 'mediumBugsScore', 'lowBugsScore'
    ];

    const reasonIds = [
        'involvementReason', 'requirementsReason', 'qaPlanReason', 'uxReason', 'cooperationReason',
        'criticalBugsReason', 'highBugsReason', 'mediumBugsReason', 'lowBugsReason'
    ];

    // Clear existing evaluation data
    window.evaluationData = [];

    let totalScore = 0;
    let filledCount = 0;

    // Collect data from form inputs
    for (let i = 0; i < criteria.length; i++) {
        const scoreInput = document.getElementById(fieldIds[i]);
        const reasonInput = document.getElementById(reasonIds[i]);

        if (scoreInput && reasonInput) {
            const score = parseInt(scoreInput.value) || 0;
            const reason = reasonInput.value.trim();

            if (score > 0) {
                window.evaluationData.push({
                    criteria: criteria[i],
                    score: score,
                    reason: reason || 'No reason provided'
                });
                totalScore += score;
                filledCount++;
            }
        }
    }

    // Calculate final score as sum of all filled scores, capped at 100
    const finalScore = Math.min(totalScore, 100);

    // Update final score display
    const finalScoreElement = document.getElementById('finalScore');
    if (finalScoreElement) {
        finalScoreElement.textContent = `${finalScore}/100`;
    }

    // Update chart
    updateEvaluationChart();
}

// Function to update evaluation chart (pie chart)
function updateEvaluationChart() {
    const canvas = document.getElementById('evaluationChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Destroy existing chart if it exists
    if (window.evaluationChartInstance) {
        window.evaluationChartInstance.destroy();
    }

    const evaluationData = window.evaluationData || [];
    if (evaluationData.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No data to display', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Prepare data for pie chart
    const labels = evaluationData.map(item => item.criteria);
    const data = evaluationData.map(item => item.score);
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0'
    ];

    // Create new pie chart
    window.evaluationChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, data.length),
                borderColor: colors.slice(0, data.length).map(color => color.replace('0.6', '1')),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Evaluation Score Distribution',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value}/100 (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Function to load evaluation data into form
function loadEvaluationData(data) {
    if (!data || !Array.isArray(data)) return;

    // Clear existing data
    window.evaluationData = [...data];

    // Map criteria to field IDs
    const criteriaToFieldId = {
        'Involvement': 'involvementScore',
        'Requirements Quality': 'requirementsScore',
        'QA Plan Review': 'qaPlanScore',
        'UX': 'uxScore',
        'Cooperation': 'cooperationScore',
        'Critical Bugs': 'criticalBugsScore',
        'High Bugs': 'highBugsScore',
        'Medium Bugs': 'mediumBugsScore',
        'Low Bugs': 'lowBugsScore'
    };

    const criteriaToReasonId = {
        'Involvement': 'involvementReason',
        'Requirements Quality': 'requirementsReason',
        'QA Plan Review': 'qaPlanReason',
        'UX': 'uxReason',
        'Cooperation': 'cooperationReason',
        'Critical Bugs': 'criticalBugsReason',
        'High Bugs': 'highBugsReason',
        'Medium Bugs': 'mediumBugsReason',
        'Low Bugs': 'lowBugsReason'
    };

    // Load data into form fields
    data.forEach(item => {
        const scoreFieldId = criteriaToFieldId[item.criteria];
        const reasonFieldId = criteriaToReasonId[item.criteria];

        if (scoreFieldId && reasonFieldId) {
            const scoreField = document.getElementById(scoreFieldId);
            const reasonField = document.getElementById(reasonFieldId);

            if (scoreField) scoreField.value = item.score;
            if (reasonField) reasonField.value = item.reason;
        }
    });

    // Update final score and chart
    updateEvaluationScore();
}

// Function to collect evaluation data from form
function collectEvaluationData() {
    updateEvaluationScore(); // This updates the global evaluationData
    return window.evaluationData || [];
}

// Make evaluation functions globally accessible
window.updateEvaluationScore = updateEvaluationScore;
window.updateEvaluationChart = updateEvaluationChart;
window.loadEvaluationData = loadEvaluationData;
window.collectEvaluationData = collectEvaluationData;