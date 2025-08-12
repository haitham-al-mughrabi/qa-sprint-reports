function getViewChartOptions(isLightMode) {
    // Get current theme
    const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';
    const textColor = isLightTheme ? '#1e293b' : '#f1f5f9';
    
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { 
                    padding: 15, 
                    usePointStyle: true, 
                    font: {
                        size: 10,
                        family: 'Poppins'
                    },
                    color: textColor
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const value = context.parsed || 0;
                        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                        return `${context.label}: ${value} (${percentage}%)`;
                    }
                },
                titleColor: textColor,
                bodyColor: textColor,
                backgroundColor: isLightMode ? '#ffffff' : '#1e293b',
                borderColor: isLightMode ? '#e2e8f0' : '#334155',
                borderWidth: 1,
                titleFont: {
                    family: 'Poppins'
                },
                bodyFont: {
                    family: 'Poppins'
                }
            }
        }
    };
}

        function getBarChartOptions(yAxisLabel, isLightMode) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${context.parsed.y}`;
                    }
                },
                titleColor: '#f1f5f9',
                bodyColor: '#f1f5f9',
                backgroundColor: isLightMode ? '#ffffff' : '#1e293b',
                borderColor: isLightMode ? '#e2e8f0' : '#334155',
                borderWidth: 1,
                titleFont: {
                    family: 'Poppins'
                },
                bodyFont: {
                    family: 'Poppins'
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: 'var(--text-secondary)',
                    font: {
                        family: 'Poppins'
                    }
                },
                grid: {
                    color: 'rgba(51, 65, 85, 0.5)'
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: 'var(--text-secondary)',
                    font: {
                        family: 'Poppins'
                    }
                },
                grid: {
                    color: 'rgba(51, 65, 85, 0.5)'
                },
                title: {
                    display: true,
                    text: yAxisLabel,
                    color: 'var(--text-primary)',
                    font: {
                        family: 'Poppins'
                    }
                }
            }
        }
    };
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString.includes('-') && dateString.length === 10 ? 
        dateString.split('-').reverse().join('-') : dateString);
    return isNaN(date) ? 'Invalid Date' : date.toLocaleDateString('en-GB');
}

function getStatusClass(status) {
    const map = { 
        'passed': 'completed', 
        'passed-with-issues': 'in-progress',
        'failed': 'pending', // Consider a 'failed' specific class if needed
        'blocked': 'pending',
        'cancelled': 'pending',
        'deferred': 'pending',
        'not-testable': 'pending'
    };
    return map[status] || 'pending';
}

function getStatusText(status) {
    const map = { 
        'passed': 'Passed', 
        'passed-with-issues': 'Passed w/ Issues', 
        'failed': 'Failed', 
        'blocked': 'Blocked', 
        'cancelled': 'Cancelled', 
        'deferred': 'Deferred', 
        'not-testable': 'Not Testable' 
    };
    return map[status] || 'Pending';
}

// Main render function that calls all section renderers
function renderReportView(report) {
    console.log('Rendering report view with data:', report);
    
    // Update page title and subtitle
    const reportTitle = document.getElementById('reportTitle');
    const reportSubtitle = document.getElementById('reportSubtitle');
    
    if (reportTitle) {
        reportTitle.textContent = report.reportName || `${report.projectName} - Sprint ${report.sprintNumber}`;
    }
    
    if (reportSubtitle) {
        reportSubtitle.textContent = `${report.portfolioName} | ${formatDate(report.reportDate)} | Status: ${getStatusText(report.testingStatus)}`;
    }
    
    // Get current theme for charts
    const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
    
    // Render all sections
    try {
        renderCoverInfo(report);
        renderTestSummary(report);
        renderMetricsOverview(report);
        renderUserStoriesView(report, isLightMode);
        renderTestCasesView(report, isLightMode);
        renderIssuesView(report, isLightMode);
        renderEnhancementsView(report, isLightMode);
        renderAutomationRegressionView(report, isLightMode);
        renderAdditionalInfo(report);
        renderQANotes(report);
        renderEvaluationView(report, isLightMode);
        
        console.log('All sections rendered successfully');
    } catch (error) {
        console.error('Error rendering report sections:', error);
    }
}