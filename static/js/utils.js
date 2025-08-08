// static/js/utils.js
// Utility Functions

// Toast notification system
function showToast(message, type = 'info', duration = 5000) {
    // Create toast container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="removeToast(this.parentElement.parentElement)">&times;</button>
        </div>
    `;

    container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast) {
    if (toast && toast.parentElement) {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }
}

function getCurrentDate() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function convertDateFormat(dateString) {
    if (!dateString) return '';

    // If already in yyyy-mm-dd format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
    }

    // Convert dd-mm-yyyy to yyyy-mm-dd
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
        const parts = dateString.split('-');
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    return dateString; // Return original if no pattern matches
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    // Handles both 'dd-mm-yyyy' and ISO strings
    const date = new Date(dateString.includes('-') && dateString.length === 10 ?
        dateString.split('-').reverse().join('-') : dateString);
    return isNaN(date) ? 'Invalid Date' : date.toLocaleDateString('en-GB');
}

function getStatusClass(status) {
    const map = {
        'passed': 'completed',
        'passed-with-issues': 'in-progress',
        'failed': 'pending',
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

// Helper function for progress bar colors
function getProgressBarColor(percentage) {
    if (percentage >= 80) return '#4CAF50'; // Green
    if (percentage >= 60) return '#FF9800'; // Orange
    return '#f44336'; // Red
}

// Helper function for rate class determination
function getRateClass(percentage) {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'average';
    return 'poor';
}

function toggleWeightColumn() {
    const columns = document.querySelectorAll('.weight-column');
    const button = document.getElementById('toggleWeightBtn');

    if (!columns.length || !button) return;

    const isVisible = columns[0].style.display !== 'none';

    columns.forEach(col => {
        col.style.display = isVisible ? 'none' : 'table-cell';
    });

    button.textContent = isVisible ? 'Show Weight' : 'Hide Weight';
}

function toggleProjectReasonColumn() {
    const columns = document.querySelectorAll('.project-reason-column');
    const button = document.getElementById('toggleProjectReasonBtn');

    if (!columns.length || !button) return;

    const isVisible = columns[0].style.display !== 'none';

    columns.forEach(col => {
        col.style.display = isVisible ? 'none' : 'table-cell';
    });

    button.textContent = isVisible ? 'Show Reason' : 'Hide Reason';
}

// Make functions globally accessible
window.showToast = showToast;
window.removeToast = removeToast;
window.getCurrentDate = getCurrentDate;
window.convertDateFormat = convertDateFormat;
window.formatDate = formatDate;
window.getStatusClass = getStatusClass;
window.getStatusText = getStatusText;
window.getProgressBarColor = getProgressBarColor;
window.getRateClass = getRateClass;
window.toggleWeightColumn = toggleWeightColumn;
window.toggleProjectReasonColumn = toggleProjectReasonColumn;