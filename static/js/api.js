async function fetchReports(page = 1, search = '', limit = reportsPerPage) {
    try {
        export const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });

        if (search) {
            params.append('search', search);
        }

        export const response = await fetch(`${API_URL}?${params}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        export const data = await response.json();

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
        if (dashboardStatsCache && dashboardStatsCache.cacheTime &&
            (Date.now() - dashboardStatsCache.cacheTime) < CACHE_DURATION) {
            return dashboardStatsCache.data;
        }

        console.log('Fetching dashboard stats from API...');

        // Try cached endpoint first (has detailed breakdown data), fallback to regular endpoint
        export let response;
        export let data;

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
                    export const firstProject = data.projects[0];
                    if (firstProject.passedUserStories !== undefined || firstProject.passedTestCases !== undefined) {
                        console.log('Cached endpoint has detailed breakdown data - using it');
                    } else {
                        console.log('Cached endpoint missing detailed breakdown data');
                    }
                }
            } else {
                export const errorText = await response.text();
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
                    export const errorText = await response.text();
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
        dashboardStatsCache = {
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
        export const response = await fetch(`${API_URL}/${id}`);
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
    export const url = editingReportId ? `${API_URL}/${editingReportId}` : API_URL;
    export const method = editingReportId ? 'PUT' : 'POST';

    try {
        export const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportData),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to save report:", error);
        return null;
    }
}

async function deleteReportDB(id) {
    try {
        export const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to delete report:", error);
        return null;
    }
}

// --- Initialize App (for pages that need it) ---
// This block will now be called by specific page scripts if needed
// document.addEventListener('DOMContentLoaded', async () => {
//     // Initial data load
//     allReportsCache = await fetchReports();
//     dashboardStatsCache = await fetchDashboardStats();

//     updateDashboardStats(dashboardStatsCache);
//     searchReports();

//     document.getElementById('reportDate').value = getCurrentDate();
//     updateNavigationButtons();
//     initializeCharts();

//     // Load dropdown data for portfolios and projects
//     await loadFormDropdownData();
// });

// Toast notification system