// Define exports properly at top-level
export async function fetchReports(page = 1, search = '', limit = reportsPerPage) {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });

        if (search) {
            params.append('search', search);
        }

        const response = await fetch(`${API_URL}?${params}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data)) {
            return {
                reports: data,
                total: data.length,
                page: page,
                totalPages: Math.ceil(data.length / limit)
            };
        }

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

export async function fetchDashboardStats() {
    try {
        if (dashboardStatsCache && dashboardStatsCache.cacheTime &&
            (Date.now() - dashboardStatsCache.cacheTime) < CACHE_DURATION) {
            return dashboardStatsCache.data;
        }

        let response;
        let data;

        try {
            response = await fetch('/api/dashboard/stats/cached', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });

            if (response.ok) {
                data = await response.json();

                if (data.projects && data.projects.length > 0) {
                    const firstProject = data.projects[0];
                    if (firstProject.passedUserStories !== undefined || firstProject.passedTestCases !== undefined) {
                        // all good
                    }
                }
            } else {
                const errorText = await response.text();
                throw new Error(`Cached endpoint failed: ${response.status} - ${errorText}`);
            }
        } catch (cachedError) {
            try {
                response = await fetch('/api/dashboard/stats', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Regular endpoint failed: ${response.status} - ${errorText}`);
                }

                data = await response.json();
            } catch (regularError) {
                throw regularError;
            }
        }

        if (!data || !data.overall) {
            throw new Error('Invalid data structure received from API');
        }

        dashboardStatsCache = {
            data: data,
            cacheTime: Date.now()
        };

        return data;
    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);

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

export async function fetchReport(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch report:", error);
        return null;
    }
}

export async function saveReport(reportData) {
    const url = editingReportId ? `${API_URL}/${editingReportId}` : API_URL;
    const method = editingReportId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
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

export async function deleteReportDB(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to delete report:", error);
        return null;
    }
}
