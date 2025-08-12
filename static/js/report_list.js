document.addEventListener('DOMContentLoaded', async () => {
    // Initialize theme first
    if (window.themeManager) {
        window.themeManager.init();
    }
    
    // Set active class for navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === window.location.pathname) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Initialize filter dropdowns and load data
    await initializeFilterDropdowns();
    
    // Initial data load with filters
    applyFilters();
});

function showReportsLoading() {
    document.getElementById('reports-loading').style.display = 'flex';
    document.getElementById('reportsTable').style.display = 'none';
}

function hideReportsLoading() {
    document.getElementById('reports-loading').style.display = 'none';
    document.getElementById('reportsTable').style.display = 'table';
}
