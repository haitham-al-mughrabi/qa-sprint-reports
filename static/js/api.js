// static/js/api.js
// API Communication Functions

async function fetchReports(page = 1, search = '', limit = window.reportsPerPage || 10) {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });

        if (search) {
            params.append('search', search);
        }

        const response = await fetch(`${window.API_URL || '/api/reports'}?${params}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Ensure consistent data structure
        if (Array.isArray(data)) {
            // If API returns array directly, wrap it in expected structure
            return {
                reports: data,
                total: data.length,
                page: page,
                totalPages: Math.ceil(data.length / limit)
            };
        }

        // If API returns structured data, use it as is
        return data;
    } catch (error) {
        console.error("Failed to fetch reports:", error);
        return {
            reports: [],
            total: 0,
            page: 1,
            totalPages: 1
        };
    }
}

async function fetchDashboardStats() {
    try {
        // Use existing cache if available and still valid
        if (window.dashboardStatsCache && window.dashboardStatsCache.cacheTime &&
            (Date.now() - window.dashboardStatsCache.cacheTime) < (window.CACHE_DURATION || 300000)) {
            return window.dashboardStatsCache.data;
        }

        console.log('Fetching dashboard stats from API...');

        // Try cached endpoint first (has detailed breakdown data), fallback to regular endpoint
        let response;
        let data;

        try {
            console.log('Attempting to fetch from cached endpoint...');
            response = await fetch('/api/dashboard/stats/cached', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });

            console.log('Cached endpoint response status:', response.status);

            if (response.ok) {
                data = await response.json();
                console.log('Successfully fetched from cached endpoint, projects:', data.projects?.length || 0);

                // Validate that we have the detailed breakdown data
                if (data.projects && data.projects.length > 0) {
                    const firstProject = data.projects[0];
                    if (firstProject.passedUserStories !== undefined || firstProject.passedTestCases !== undefined) {
                        console.log('Cached endpoint has detailed breakdown data - using it');
                    } else {
                        console.log('Cached endpoint missing detailed breakdown data');
                    }
                }
            } else {
                const errorText = await response.text();
                throw new Error(`Cached endpoint failed: ${response.status} - ${errorText}`);
            }
        } catch (cachedError) {
            console.log('Cached endpoint failed, trying regular endpoint:', cachedError.message);

            // Fallback to regular endpoint (but it has limited data)
            try {
                console.log('Attempting to fetch from regular endpoint...');
                response = await fetch('/api/dashboard/stats', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });

                console.log('Regular endpoint response status:', response.status);

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Regular endpoint failed: ${response.status} - ${errorText}`);
                }
                data = await response.json();
                console.log('Successfully fetched from regular endpoint, projects:', data.projects?.length || 0);
                console.log('Warning: Regular endpoint has limited project data - some metrics may not display');
            } catch (regularError) {
                console.error('Both endpoints failed:', regularError.message);
                throw regularError;
            }
        }

        // Ensure we have the expected data structure
        if (!data || !data.overall) {
            throw new Error('Invalid data structure received from API');
        }

        // Cache the dashboard stats
        window.dashboardStatsCache = {
            data: data,
            cacheTime: Date.now()
        };

        console.log('Dashboard stats cached successfully:', {
            overall: data.overall ? 'present' : 'missing',
            projects: data.projects ? data.projects.length : 0
        });

        return data;
    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);

        // Return empty structure to prevent crashes
        return {
            overall: {
                totalReports: 0,
                completedReports: 0,
                inProgressReports: 0,
                pendingReports: 0,
                totalUserStories: 0,
                totalTestCases: 0,
                totalIssues: 0,
                totalEnhancements: 0,
                automationTotalTestCases: 0,
                automationPassedTestCases: 0
            },
            projects: []
        };
    }
}

async function fetchReport(id) {
    try {
        const response = await fetch(`${window.API_URL || '/api/reports'}/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch report:", error);
        return null;
    }
}

async function saveReport(reportData) {
    const url = window.editingReportId ? `${window.API_URL || '/api/reports'}/${window.editingReportId}` : (window.API_URL || '/api/reports');
    const method = window.editingReportId ? 'PUT' : 'POST';
    const actionText = window.editingReportId ? 'updating' : 'creating';

    if (typeof showToast === 'function') {
        showToast(`${actionText === 'creating' ? 'Creating' : 'Updating'} report...`, 'info', 2000);
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        }

        const result = await response.json();
        if (typeof showToast === 'function') {
            showToast(`Report ${actionText === 'creating' ? 'created' : 'updated'} successfully!`, 'success');
        }
        return result;
    } catch (error) {
        console.error(`Failed to save report:`, error);
        if (typeof showToast === 'function') {
            showToast(`Failed to ${actionText === 'creating' ? 'create' : 'update'} report: ${error.message}`, 'error');
        }
        return null;
    }
}

async function deleteReportDB(id) {
    if (typeof showToast === 'function') {
        showToast('Deleting report...', 'info', 2000);
    }

    try {
        const response = await fetch(`${window.API_URL || '/api/reports'}/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        }

        const result = await response.json();
        if (typeof showToast === 'function') {
            showToast('Report deleted successfully!', 'success');
        }
        return result;
    } catch (error) {
        console.error("Failed to delete report:", error);
        if (typeof showToast === 'function') {
            showToast(`Failed to delete report: ${error.message}`, 'error');
        }
        return null;
    }
}

// Make functions globally accessible
window.fetchReports = fetchReports;
window.fetchDashboardStats = fetchDashboardStats;
window.fetchReport = fetchReport;
window.saveReport = saveReport;
window.deleteReportDB = deleteReportDB;