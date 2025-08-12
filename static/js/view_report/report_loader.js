// Get report ID from URL
const reportId = window.location.pathname.split('/').pop();
console.log('Attempting to load report ID:', reportId); // Log the ID being used

// Load report data when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Load user info first
    await loadUserInfo();
    
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
    
    await loadReportData(reportId);
});

async function loadReportData(id) {
    try {
        // Ensure the URL is correctly formed and accessible
        const apiUrl = `/api/reports/${id}`;
        console.log('Fetching report from:', apiUrl); // Log the full API URL

        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            // Log detailed error information from the server response
            const errorText = await response.text(); // Get response body as text
            console.error(`HTTP error! Status: ${response.status}, Status Text: ${response.statusText}, Response Body: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        currentReport = await response.json();
        console.log('Report data loaded successfully:', currentReport); // Log the loaded data
        
        renderReportView(currentReport);
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('reportContent').style.display = 'block';
    } catch (error) {
        console.error('Error loading report:', error);
        document.getElementById('loadingSection').innerHTML = `
            <div class="empty-state">
                <span class="icon">⚠️</span>
                <h3>Error Loading Report</h3>
                <p>Failed to load report data. Please check the console for more details.</p>
                <a href="/" class="action-btn" style="margin-top: 1rem;">← Back to Dashboard</a>
            </div>
        `;
    }
}