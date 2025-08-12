export function getProgressBarColor(percentage) {
    if (percentage >= 80) return '#4CAF50'; // Green
    if (percentage >= 60) return '#FF9800'; // Orange
    if (percentage >= 40) return '#FFC107'; // Yellow
    return '#F44336'; // Red
}

// Helper function for rate class determination
export function getRateClass(percentage) {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'fair';
    return 'poor';
}

// Helper functions for dashboard
export function getStatusClass(status) {
    switch (status) {
        case 'passed': return 'passed';
        case 'failed': return 'failed';
        case 'passed-with-issues': return 'passed-with-issues';
        case 'not-testable': return 'not-testable';
        case 'deferred': return 'deferred';
        case 'blocked': return 'blocked';
        case 'in-progress': return 'in-progress';
        default: return 'pending';
    }
}

export function getStatusText(status) {
    switch (status) {
        case 'passed': return 'Passed';
        case 'failed': return 'Failed';
        case 'passed-with-issues': return 'Passed with Issues';
        case 'not-testable': return 'Not Testable';
        case 'deferred': return 'Deferred';
        case 'blocked': return 'Blocked';
        case 'in-progress': return 'In Progress';
        default: return 'Pending';
    }
}

export function formatDate(dateString) {
    if (!dateString) return 'No reports';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch {
        return dateString;
    }
}
