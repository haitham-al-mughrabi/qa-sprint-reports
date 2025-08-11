async function searchReports() {
    export const searchQuery = document.getElementById('searchInput')?.value || '';
    currentFilters.search = searchQuery;

    // Clear existing timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    searchTimeout = setTimeout(() => {
        applyFilters();
    }, 300); // 300ms delay
}

// Enhanced filter functions
async function applyFilters() {
    showReportsLoading();

    // Update filter state from form inputs
    updateFilterState();

    console.log('Applying filters:', currentFilters);

    try {
        // Fetch all reports if not cached or if we need fresh data
        if (allReports.length === 0) {
            console.log('Fetching reports for filtering...');
            export const result = await fetchReports(1, '', 1000); // Fetch large number to get all
            allReports = result.reports || [];
            console.log('Fetched', allReports.length, 'reports for filtering');
        }

        // Apply client-side filtering
        export let filteredReports = filterReports(allReports);
        console.log('After filtering:', filteredReports.length, 'reports');

        // Apply sorting
        filteredReports = sortReports(filteredReports);
        console.log('After sorting:', filteredReports.length, 'reports');

        // Update results count and active filters display
        updateFilterResultsDisplay(filteredReports.length);

        // Render filtered results
        renderReportsTable(filteredReports);

        // Update pagination for filtered results (disable pagination for filtered results)
        renderPagination({
            reports: filteredReports,
            total: filteredReports.length,
            page: 1,
            totalPages: 1 // Show all filtered results on one page
        });

    } catch (error) {
        console.error('Error applying filters:', error);
        showToast('Error applying filters', 'error');

        // Fallback: try to show all reports without filtering
        try {
            export const result = await fetchReports(1, '', 100);
            renderReportsTable(result.reports || []);
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
        }
    }

    hideReportsLoading();
}

export function updateFilterState() {
    currentFilters.search = document.getElementById('searchInput')?.value || '';
    currentFilters.project = document.getElementById('projectFilter')?.value || '';
    currentFilters.portfolio = document.getElementById('portfolioFilter')?.value || '';
    currentFilters.tester = document.getElementById('testerFilter')?.value || '';
    currentFilters.status = document.getElementById('statusFilter')?.value || '';
    currentFilters.dateFrom = document.getElementById('dateFromFilter')?.value || '';
    currentFilters.dateTo = document.getElementById('dateToFilter')?.value || '';
    currentFilters.sprint = document.getElementById('sprintFilter')?.value || '';
    currentFilters.sort = document.getElementById('sortFilter')?.value || 'date-desc';
}

export function filterReports(reports) {
    if (!Array.isArray(reports)) {
        console.warn('filterReports: reports is not an array', reports);
        return [];
    }

    return reports.filter(report => {
        if (!report) return false;

        // Search filter - make it more robust
        if (currentFilters.search) {
            export const searchTerm = currentFilters.search.toLowerCase();
            export const searchableFields = [
                report.title || '',
                report.project || '',
                report.portfolio || '',
                report.reportName || '',
                report.projectName || '',
                report.portfolioName || ''
            ];
            export const searchableText = searchableFields.join(' ').toLowerCase();
            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }

        // Project filter - handle different field names
        if (currentFilters.project) {
            export const projectName = report.project || report.projectName || '';
            if (projectName !== currentFilters.project) {
                return false;
            }
        }

        // Portfolio filter - handle different field names
        if (currentFilters.portfolio) {
            export const portfolioName = report.portfolio || report.portfolioName || '';
            if (portfolioName !== currentFilters.portfolio) {
                return false;
            }
        }

        // Tester filter - handle different data structures
        if (currentFilters.tester) {
            export let hasMatchingTester = false;

            // Get all possible tester values from the report
            export const allTesterValues = [];

            // Check testers array
            if (Array.isArray(report.testers)) {
                report.testers.forEach(tester => {
                    if (typeof tester === 'string') {
                        allTesterValues.push(tester.trim());
                    } else if (typeof tester === 'object' && tester.name) {
                        allTesterValues.push(tester.name.trim());
                    }
                });
            }
            // Check testerData array (from form)
            else if (Array.isArray(report.testerData)) {
                report.testerData.forEach(tester => {
                    if (tester && typeof tester === 'object' && tester.name) {
                        allTesterValues.push(tester.name.trim());
                    }
                });
            }
            // Check tester_data array (from database)
            else if (Array.isArray(report.tester_data)) {
                report.tester_data.forEach(tester => {
                    if (tester && typeof tester === 'object' && tester.name) {
                        allTesterValues.push(tester.name.trim());
                    }
                });
            }
            // Check testers as JSON string
            else if (typeof report.testers === 'string') {
                try {
                    export const parsedTesters = JSON.parse(report.testers);
                    if (Array.isArray(parsedTesters)) {
                        parsedTesters.forEach(tester => {
                            export const name = typeof tester === 'object' ? tester.name : tester;
                            if (name) allTesterValues.push(name.toString().trim());
                        });
                    }
                } catch (e) {
                    // If not JSON, treat as comma-separated string
                    export const testerList = report.testers.split(',').map(t => t.trim()).filter(t => t);
                    allTesterValues.push(...testerList);
                }
            }

            // Check single tester fields
            export const singleTesterFields = ['tester', 'testerName', 'assignedTester'];
            singleTesterFields.forEach(field => {
                if (report[field] && typeof report[field] === 'string') {
                    allTesterValues.push(report[field].trim());
                }
            });

            // Check if any tester value matches
            hasMatchingTester = allTesterValues.some(testerValue =>
                testerValue === currentFilters.tester
            );

            if (!hasMatchingTester) {
                // Only log for debugging if needed
                // console.log('Tester filter failed for report:', report.id || report.title, 'Looking for:', currentFilters.tester, 'Found values:', allTesterValues);
                return false;
            }
        }

        // Status filter - handle different field names
        if (currentFilters.status) {
            export const status = report.status || report.testingStatus || '';
            if (status !== currentFilters.status) {
                return false;
            }
        }

        // Date range filter - handle different date formats
        if (currentFilters.dateFrom || currentFilters.dateTo) {
            // Try multiple date field names
            export const reportDateStr = report.date || report.reportDate || report.createdAt || report.created_at || report.dateCreated || '';

            // If no date found, skip date filtering for this report (don't exclude it)
            if (!reportDateStr) {
                // Only log for debugging if needed
                // console.log('No date found for report:', report.id || report.title, 'Skipping date filter');
                // Don't return false - let report pass through if no date available
            } else {
                // Handle different date formats
                export let reportDate;

                // Try parsing as-is first
                reportDate = new Date(reportDateStr);

                // If invalid, try parsing DD-MM-YYYY format
                if (isNaN(reportDate.getTime()) && typeof reportDateStr === 'string') {
                    export const parts = reportDateStr.split('-');
                    if (parts.length === 3) {
                        // Try DD-MM-YYYY
                        if (parts[0].length === 2) {
                            reportDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                        }
                        // Try YYYY-MM-DD (should work with new Date())
                        else if (parts[0].length === 4) {
                            reportDate = new Date(reportDateStr);
                        }
                    }
                }

                // Only apply date filtering if we have a valid date
                if (!isNaN(reportDate.getTime())) {
                    if (currentFilters.dateFrom) {
                        export const fromDate = new Date(currentFilters.dateFrom);
                        fromDate.setHours(0, 0, 0, 0); // Start of day
                        if (reportDate < fromDate) {
                            return false;
                        }
                    }

                    if (currentFilters.dateTo) {
                        export const toDate = new Date(currentFilters.dateTo);
                        toDate.setHours(23, 59, 59, 999); // End of day
                        if (reportDate > toDate) {
                            return false;
                        }
                    }
                } else {
                    // Invalid date format - log for debugging but don't exclude report
                    // console.log('Invalid date format:', reportDateStr, 'for report:', report.id || report.title);
                }
            }
        }

        // Sprint filter - handle different field names and types
        if (currentFilters.sprint) {
            export const sprintNumber = report.sprint || report.sprintNumber || '';
            export const filterSprint = currentFilters.sprint.toString();
            export const reportSprint = sprintNumber.toString();

            if (reportSprint !== filterSprint) {
                return false;
            }
        }

        return true;
    });
}

export function sortReports(reports) {
    if (!Array.isArray(reports)) {
        console.warn('sortReports: reports is not an array', reports);
        return [];
    }

    export const [field, direction] = currentFilters.sort.split('-');

    return [...reports].sort((a, b) => {
        export let aValue, bValue;

        switch (field) {
            case 'date':
                aValue = new Date(a.date || a.reportDate || a.createdAt || 0);
                bValue = new Date(b.date || b.reportDate || b.createdAt || 0);
                // Handle invalid dates
                if (isNaN(aValue.getTime())) aValue = new Date(0);
                if (isNaN(bValue.getTime())) bValue = new Date(0);
                break;
            case 'title':
                aValue = (a.title || a.reportName || '').toLowerCase();
                bValue = (b.title || b.reportName || '').toLowerCase();
                break;
            case 'project':
                aValue = (a.project || a.projectName || '').toLowerCase();
                bValue = (b.project || b.projectName || '').toLowerCase();
                break;
            case 'sprint':
                aValue = parseInt(a.sprint || a.sprintNumber || 0) || 0;
                bValue = parseInt(b.sprint || b.sprintNumber || 0) || 0;
                break;
            default:
                return 0;
        }

        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return direction === 'asc' ? -1 : 1;
        if (bValue == null) return direction === 'asc' ? 1 : -1;

        if (direction === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
    });
}

export function updateFilterResultsDisplay(count) {
    export const resultsCountElement = document.getElementById('resultsCount');
    if (resultsCountElement) {
        resultsCountElement.textContent = count;
    }

    // Update active filters display
    updateActiveFiltersDisplay();
}

export function updateActiveFiltersDisplay() {
    export const activeFiltersContainer = document.getElementById('activeFilters');
    if (!activeFiltersContainer) return;

    activeFiltersContainer.innerHTML = '';

    export const filterLabels = {
        search: 'Search',
        project: 'Project',
        portfolio: 'Portfolio',
        tester: 'Tester',
        status: 'Status',
        dateFrom: 'From Date',
        dateTo: 'To Date',
        sprint: 'Sprint'
    };

    Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && key !== 'sort') {
            export const tag = document.createElement('div');
            tag.className = 'active-filter-tag';
            tag.innerHTML = `
                <span>${filterLabels[key]}: ${value}</span>
                <i class="fas fa-times remove-filter" onclick="removeFilter('${key}')"></i>
            `;
            activeFiltersContainer.appendChild(tag);
        }
    });
}

export function removeFilter(filterKey) {
    // Clear the filter
    currentFilters[filterKey] = '';

    // Update the corresponding form input
    export const inputElement = document.getElementById(filterKey + 'Filter') || document.getElementById('searchInput');
    if (inputElement) {
        inputElement.value = '';
    }

    // Reapply filters
    applyFilters();
}

export function clearAllFilters() {
    // Reset all filters
    Object.keys(currentFilters).forEach(key => {
        if (key !== 'sort') {
            currentFilters[key] = '';
        }
    });

    // Reset sort to default
    currentFilters.sort = 'date-desc';

    // Clear all form inputs safely
    export const inputs = [
        'searchInput',
        'projectFilter',
        'portfolioFilter',
        'testerFilter',
        'statusFilter',
        'dateFromFilter',
        'dateToFilter',
        'sprintFilter'
    ];

    inputs.forEach(inputId => {
        export const element = document.getElementById(inputId);
        if (element) {
            element.value = '';
        }
    });

    // Reset sort filter
    export const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.value = 'date-desc';
    }

    // Remove active quick filter buttons
    document.querySelectorAll('.quick-filter-btn.active').forEach(btn => {
        btn.classList.remove('active');
    });

    console.log('All filters cleared');

    // Reapply filters (which will show all reports)
    applyFilters();
}

export function toggleFiltersVisibility() {
    export const filtersContainer = document.getElementById('filtersContainer');
    export const toggleText = document.getElementById('toggleText');
    export const toggleIcon = document.querySelector('.toggle-filters i');

    filtersVisible = !filtersVisible;

    if (filtersVisible) {
        filtersContainer.classList.remove('hidden');
        toggleText.textContent = 'Hide Filters';
        toggleIcon.className = 'fas fa-eye';
    } else {
        filtersContainer.classList.add('hidden');
        toggleText.textContent = 'Show Filters';
        toggleIcon.className = 'fas fa-eye-slash';
    }
}

export function applyQuickFilter(type) {
    // Remove active class from all quick filter buttons
    document.querySelectorAll('.quick-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Add active class to clicked button
    if (event && event.target) {
        event.target.classList.add('active');
    }

    // Clear existing filters first (except search)
    export const searchValue = document.getElementById('searchInput').value;
    clearAllFilters();
    document.getElementById('searchInput').value = searchValue;
    currentFilters.search = searchValue;

    export const today = new Date();
    export const todayStr = today.toISOString().split('T')[0];

    switch (type) {
        case 'today':
            document.getElementById('dateFromFilter').value = todayStr;
            document.getElementById('dateToFilter').value = todayStr;
            currentFilters.dateFrom = todayStr;
            currentFilters.dateTo = todayStr;
            break;

        case 'week':
            export const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            export const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            export const weekStartStr = weekStart.toISOString().split('T')[0];
            export const weekEndStr = weekEnd.toISOString().split('T')[0];

            document.getElementById('dateFromFilter').value = weekStartStr;
            document.getElementById('dateToFilter').value = weekEndStr;
            currentFilters.dateFrom = weekStartStr;
            currentFilters.dateTo = weekEndStr;
            break;

        case 'month':
            export const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            export const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

            export const monthStartStr = monthStart.toISOString().split('T')[0];
            export const monthEndStr = monthEnd.toISOString().split('T')[0];

            document.getElementById('dateFromFilter').value = monthStartStr;
            document.getElementById('dateToFilter').value = monthEndStr;
            currentFilters.dateFrom = monthStartStr;
            currentFilters.dateTo = monthEndStr;
            break;

        case 'failed':
            document.getElementById('statusFilter').value = 'failed';
            currentFilters.status = 'failed';
            break;

        case 'recent':
            export const recentStart = new Date(today);
            recentStart.setDate(today.getDate() - 7);

            export const recentStartStr = recentStart.toISOString().split('T')[0];

            document.getElementById('dateFromFilter').value = recentStartStr;
            document.getElementById('dateToFilter').value = todayStr;
            currentFilters.dateFrom = recentStartStr;
            currentFilters.dateTo = todayStr;
            break;
    }

    applyFilters();
}

// Function to refresh filter data
async function refreshFilterData() {
    console.log('🔄 Refreshing filter data...');
    allReports = []; // Clear cache
    await initializeFilterDropdowns();
    applyFilters();
}

// Function to show all reports without filtering
async function showAllReports() {
    console.log('📋 Showing all reports without filtering...');
    showReportsLoading();

    try {
        // Fetch all reports
        export const result = await fetchReports(1, '', 1000);
        export const reports = result.reports || [];

        console.log('Total reports fetched:', reports.length);

        // Show all reports without any filtering
        renderReportsTable(reports);

        // Update results count
        export const resultsCountElement = document.getElementById('resultsCount');
        if (resultsCountElement) {
            resultsCountElement.textContent = reports.length;
        }

        // Clear active filters display
        export const activeFiltersContainer = document.getElementById('activeFilters');
        if (activeFiltersContainer) {
            activeFiltersContainer.innerHTML = '';
        }

        console.log('All reports displayed successfully');

    } catch (error) {
        console.error('Error showing all reports:', error);
        showToast('Error loading reports', 'error');
    }

    hideReportsLoading();
}

// Test API function
async function testAPI() {
    console.log('🧪 Testing API endpoint...');
    try {
        export const response = await fetch('/api/reports');
        console.log('API Response status:', response.status);
        console.log('API Response headers:', [...response.headers.entries()]);

        export const data = await response.json();
        console.log('Raw API data:', data);
        console.log('Data type:', typeof data);
        console.log('Is array:', Array.isArray(data));

        if (Array.isArray(data)) {
            console.log('Array length:', data.length);
            if (data.length > 0) {
                console.log('First item:', data[0]);
                console.log('First item keys:', Object.keys(data[0]));
            }
        } else if (data && typeof data === 'object') {
            console.log('Object keys:', Object.keys(data));
            if (data.reports) {
                console.log('Reports array length:', data.reports.length);
                if (data.reports.length > 0) {
                    console.log('First report:', data.reports[0]);
                }
            }
        }
    } catch (error) {
        console.error('API test failed:', error);
    }
}

// Test testers API function
async function testTestersAPI() {
    console.log('🧪 Testing testers API endpoint...');
    try {
        export const response = await fetch('/api/testers');
        console.log('Testers API Response status:', response.status);

        export const data = await response.json();
        console.log('Raw testers data:', data);
        console.log('Testers count:', data.length);

        if (data.length > 0) {
            console.log('First tester:', data[0]);
            console.log('Tester keys:', Object.keys(data[0]));
        }
    } catch (error) {
        console.error('Testers API test failed:', error);
    }
}

// Test individual filters function
export function testIndividualFilters() {
    console.log('🧪 Testing individual filters...');

    if (allReports.length === 0) {
        console.log('No reports loaded. Run refreshFilterData() first.');
        return;
    }

    console.log('Total reports:', allReports.length);

    // Test each filter individually
    export const originalFilters = { ...currentFilters };

    // Test search filter
    currentFilters = { search: '', project: '', portfolio: '', tester: '', status: '', dateFrom: '', dateTo: '', sprint: '', sort: 'date-desc' };
    currentFilters.search = 'test';
    export let filtered = filterReports(allReports);
    console.log('Search "test" results:', filtered.length);

    // Test project filter (use first available project)
    export const projects = [...new Set(allReports.map(r => r.project || r.projectName).filter(Boolean))];
    if (projects.length > 0) {
        currentFilters = { search: '', project: '', portfolio: '', tester: '', status: '', dateFrom: '', dateTo: '', sprint: '', sort: 'date-desc' };
        currentFilters.project = projects[0];
        filtered = filterReports(allReports);
        console.log(`Project "${projects[0]}" results:`, filtered.length);
    }

    // Test tester filter (use first available tester)
    export const testers = new Set();
    allReports.forEach(report => {
        // Extract testers using same logic as initialization
        if (Array.isArray(report.testers)) {
            report.testers.forEach(tester => {
                export const name = typeof tester === 'object' ? tester.name : tester;
                if (name) testers.add(name.toString().trim());
            });
        } else if (Array.isArray(report.testerData)) {
            report.testerData.forEach(tester => {
                if (tester && tester.name) testers.add(tester.name.trim());
            });
        }
    });

    export const testersList = [...testers];
    if (testersList.length > 0) {
        currentFilters = { search: '', project: '', portfolio: '', tester: '', status: '', dateFrom: '', dateTo: '', sprint: '', sort: 'date-desc' };
        currentFilters.tester = testersList[0];
        filtered = filterReports(allReports);
        console.log(`Tester "${testersList[0]}" results:`, filtered.length);

        // Debug first few reports for tester data
        console.log('First 3 reports tester data:');
        allReports.slice(0, 3).forEach((report, i) => {
            console.log(`Report ${i + 1}:`, {
                title: report.title,
                testers: report.testers,
                testerData: report.testerData,
                tester_data: report.tester_data
            });
        });
    }

    // Test status filter
    export const statuses = [...new Set(allReports.map(r => r.status || r.testingStatus).filter(Boolean))];
    if (statuses.length > 0) {
        currentFilters = { search: '', project: '', portfolio: '', tester: '', status: '', dateFrom: '', dateTo: '', sprint: '', sort: 'date-desc' };
        currentFilters.status = statuses[0];
        filtered = filterReports(allReports);
        console.log(`Status "${statuses[0]}" results:`, filtered.length);
    }

    // Test no filters (should return all)
    currentFilters = { search: '', project: '', portfolio: '', tester: '', status: '', dateFrom: '', dateTo: '', sprint: '', sort: 'date-desc' };
    filtered = filterReports(allReports);
    console.log('No filters results (should be all):', filtered.length);

    // Restore original filters
    currentFilters = originalFilters;

    console.log('Individual filter testing complete!');
}

// Debug function to analyze report data structure
export function debugReportData() {
    console.log('🔍 Debugging report data structure...');
    console.log('Total reports:', allReports.length);

    if (allReports.length > 0) {
        export const sampleReport = allReports[0];
        console.log('Sample report structure:', sampleReport);
        console.log('Available fields:', Object.keys(sampleReport));

        // Analyze tester data
        console.log('\n👤 Tester data analysis:');
        allReports.slice(0, 5).forEach((report, index) => {
            console.log(`Report ${index + 1}:`, {
                id: report.id,
                title: report.title,
                testers: report.testers,
                tester: report.tester,
                testerName: report.testerName,
                assignedTester: report.assignedTester
            });
        });

        // Analyze date data
        console.log('\n📅 Date data analysis:');
        allReports.slice(0, 5).forEach((report, index) => {
            console.log(`Report ${index + 1}:`, {
                id: report.id,
                title: report.title,
                date: report.date,
                reportDate: report.reportDate,
                createdAt: report.createdAt,
                created_at: report.created_at,
                dateCreated: report.dateCreated
            });
        });

        // Count unique testers
        export const allTesters = new Set();
        allReports.forEach(report => {
            if (Array.isArray(report.testers)) {
                report.testers.forEach(tester => {
                    if (tester) allTesters.add(typeof tester === 'object' ? tester.name : tester);
                });
            } else if (report.testers) {
                allTesters.add(report.testers);
            } else if (report.tester) {
                allTesters.add(report.tester);
            }
        });

        console.log('\n📊 Summary:');
        console.log('Unique testers found:', [...allTesters]);
        console.log('Total unique testers:', allTesters.size);
    }
}

// Initialize filter dropdowns with data
async function initializeFilterDropdowns() {
    try {
        // Fetch all reports to populate filter options
        export const result = await fetchReports(1, '', 1000);
        allReports = result.reports || [];

        console.log('Initializing filters with', allReports.length, 'reports');
        console.log('Raw API result:', result);

        // If no reports, try to understand why
        if (allReports.length === 0) {
            console.warn('No reports found. API result structure:', result);
            console.warn('Possible issues: 1) No data in database, 2) API endpoint issue, 3) Data structure mismatch');
            return;
        }

        // Extract unique values for dropdowns with robust field handling
        export const projects = new Set();
        export const portfolios = new Set();
        export const testers = new Set();

        // Debug: Log first few reports to understand data structure
        if (allReports.length > 0) {
            console.log('Sample report data structure:', allReports[0]);
            console.log('All report keys:', Object.keys(allReports[0]));

            // Specifically check tester-related fields
            export const sampleReport = allReports[0];
            console.log('Tester-related fields in sample report:', {
                testers: sampleReport.testers,
                tester: sampleReport.tester,
                testerData: sampleReport.testerData,
                tester_data: sampleReport.tester_data,
                assignedTesters: sampleReport.assignedTesters,
                testTeam: sampleReport.testTeam
            });
        }

        allReports.forEach((report, index) => {
            // Debug first few reports
            if (index < 3) {
                console.log(`Report ${index}:`, {
                    project: report.project,
                    projectName: report.projectName,
                    portfolio: report.portfolio,
                    portfolioName: report.portfolioName,
                    testers: report.testers,
                    tester: report.tester,
                    date: report.date,
                    reportDate: report.reportDate,
                    createdAt: report.createdAt
                });
            }

            // Extract project names
            export const projectName = report.project || report.projectName;
            if (projectName) projects.add(projectName);

            // Extract portfolio names
            export const portfolioName = report.portfolio || report.portfolioName;
            if (portfolioName) portfolios.add(portfolioName);

            // Extract tester names - handle different data structures
            export const possibleTesterFields = [
                'testers', 'tester', 'testerData', 'tester_data',
                'assignedTesters', 'testTeam', 'testerName', 'assignedTester'
            ];

            // Log tester fields for debugging (only for first few reports)
            if (index < 3) {
                console.log(`Report ${index} tester fields:`,
                    possibleTesterFields.reduce((acc, field) => {
                        acc[field] = report[field];
                        return acc;
                    }, {})
                );
            }

            // Check for testers array
            if (Array.isArray(report.testers)) {
                report.testers.forEach(tester => {
                    if (tester && typeof tester === 'string') {
                        testers.add(tester.trim());
                    } else if (tester && typeof tester === 'object') {
                        // Handle different object structures
                        export const name = tester.name || tester.testerName || tester.email || tester.id;
                        if (name) testers.add(name.toString().trim());
                    }
                });
            }
            // Check for testerData array (from form)
            else if (Array.isArray(report.testerData)) {
                report.testerData.forEach(tester => {
                    if (tester && typeof tester === 'object' && tester.name) {
                        testers.add(tester.name.trim());
                    }
                });
            }
            // Check for tester_data array (snake_case from database)
            else if (Array.isArray(report.tester_data)) {
                report.tester_data.forEach(tester => {
                    if (tester && typeof tester === 'object' && tester.name) {
                        testers.add(tester.name.trim());
                    }
                });
            }
            // Check for testers as JSON string
            else if (report.testers && typeof report.testers === 'string') {
                try {
                    // Try to parse as JSON first
                    export const parsedTesters = JSON.parse(report.testers);
                    if (Array.isArray(parsedTesters)) {
                        parsedTesters.forEach(tester => {
                            export const name = typeof tester === 'object' ? tester.name : tester;
                            if (name) testers.add(name.toString().trim());
                        });
                    }
                } catch (e) {
                    // If not JSON, treat as comma-separated string
                    export const testerList = report.testers.split(',').map(t => t.trim()).filter(t => t);
                    testerList.forEach(tester => testers.add(tester));
                }
            }
            // Check for single tester field
            else if (report.tester && typeof report.tester === 'string') {
                testers.add(report.tester.trim());
            }
            // Check for additional possible tester fields
            else if (report.testerName) {
                testers.add(report.testerName.toString().trim());
            }
            else if (report.assignedTester) {
                testers.add(report.assignedTester.toString().trim());
            }
        });

        // Convert sets to sorted arrays
        export const sortedProjects = [...projects].sort();
        export const sortedPortfolios = [...portfolios].sort();
        export const sortedTesters = [...testers].sort();

        console.log('Filter options extracted:', {
            projects: sortedProjects,
            portfolios: sortedPortfolios,
            testers: sortedTesters
        });

        console.log('Filter counts:', {
            projects: sortedProjects.length,
            portfolios: sortedPortfolios.length,
            testers: sortedTesters.length
        });

        // If no testers found in reports, try to load from testers API
        if (sortedTesters.length === 0) {
            console.log('No testers found in reports, trying to load from testers API...');
            try {
                export const testersResponse = await fetch('/api/testers');
                if (testersResponse.ok) {
                    export const testersData = await testersResponse.json();
                    console.log('Loaded testers from API:', testersData);
                    testersData.forEach(tester => {
                        if (tester.name) {
                            testers.add(tester.name);
                        }
                    });
                    export const updatedSortedTesters = [...testers].sort();
                    console.log('Updated testers list:', updatedSortedTesters);

                    // Update the tester dropdown with API data
                    export const testerFilter = document.getElementById('testerFilter');
                    if (testerFilter) {
                        // Clear existing options except the first one
                        while (testerFilter.children.length > 1) {
                            testerFilter.removeChild(testerFilter.lastChild);
                        }

                        updatedSortedTesters.forEach(tester => {
                            export const option = document.createElement('option');
                            option.value = tester;
                            option.textContent = tester;
                            testerFilter.appendChild(option);
                        });
                    }
                }
            } catch (error) {
                console.error('Error loading testers from API:', error);
            }
        }

        // Populate project dropdown
        export const projectFilter = document.getElementById('projectFilter');
        if (projectFilter) {
            // Clear existing options except the first one
            while (projectFilter.children.length > 1) {
                projectFilter.removeChild(projectFilter.lastChild);
            }

            sortedProjects.forEach(project => {
                export const option = document.createElement('option');
                option.value = project;
                option.textContent = project;
                projectFilter.appendChild(option);
            });
        }

        // Populate portfolio dropdown
        export const portfolioFilter = document.getElementById('portfolioFilter');
        if (portfolioFilter) {
            // Clear existing options except the first one
            while (portfolioFilter.children.length > 1) {
                portfolioFilter.removeChild(portfolioFilter.lastChild);
            }

            sortedPortfolios.forEach(portfolio => {
                export const option = document.createElement('option');
                option.value = portfolio;
                option.textContent = portfolio;
                portfolioFilter.appendChild(option);
            });
        }

        // Populate tester dropdown
        export const testerFilter = document.getElementById('testerFilter');
        if (testerFilter) {
            // Clear existing options except the first one
            while (testerFilter.children.length > 1) {
                testerFilter.removeChild(testerFilter.lastChild);
            }

            sortedTesters.forEach(tester => {
                export const option = document.createElement('option');
                option.value = tester;
                option.textContent = tester;
                testerFilter.appendChild(option);
            });
        }

    } catch (error) {
        console.error('Error initializing filter dropdowns:', error);
        showToast('Error loading filter options', 'error');
    }
}

// Immediate search for pagination and buttons
async function searchReportsImmediate() {
    export const searchQuery = document.getElementById('searchInput')?.value || '';
    showReportsLoading();
    export const result = await fetchReports(currentPage, searchQuery);
    hideReportsLoading();

    renderReportsTable(result.reports);
    renderPagination(result);
}

export function renderReportsTable(reports) {
    export const tbody = document.getElementById('reportsTableBody');
    if (!tbody) return; // Ensure tbody exists

    if (reports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">📋</div><h3>No Reports Found</h3><p>Create a new report or adjust your search.</p></div></td></tr>`;
        return;
    }
    tbody.innerHTML = reports.map(report => `
        <tr>
            <td><strong>${report.portfolioName || 'N/A'} - Sprint ${report.sprintNumber || 'N/A'}</strong><br><small>v${report.reportVersion || '1.0'} | R${report.releaseNumber || 'N/A'}</small></td>
            <td>${report.projectName || 'N/A'}</td>
            <td>${report.portfolioName || 'N/A'}</td>
            <td>#${report.sprintNumber || 'N/A'}</td>
            <td>${formatDate(report.reportDate)}</td>
            <td><span class="status-badge status-${getStatusClass(report.testingStatus)}">${getStatusText(report.testingStatus)}</span></td>
            <td>
                <div class="action-buttons-cell">
                    <button class="btn-sm btn-view" onclick="viewReport(${report.id})" title="View Report"><i class="fas fa-eye"></i></button>
                    <button class="btn-sm btn-regenerate" onclick="regenerateReport(${report.id})" title="Edit Report"><i class="fas fa-edit"></i></button>
                    <button class="btn-sm btn-delete" onclick="deleteReport(${report.id})" title="Delete Report"><i class="fas fa-trash-alt"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

export function renderPagination(result) {
    export const pagination = document.getElementById('pagination');
    if (!pagination) return; // Ensure pagination element exists

    if (result.totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    export let paginationHTML = `<button class="pagination-btn" onclick="goToPage(${result.page - 1})" ${!result.hasPrev ? 'disabled' : ''}>←</button>`;
    for (let i = 1; i <= result.totalPages; i++) {
        paginationHTML += `<button class="pagination-btn ${i === result.page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    paginationHTML += `<button class="pagination-btn" onclick="goToPage(${result.page + 1})" ${!result.hasNext ? 'disabled' : ''}>→</button>`;
    pagination.innerHTML = paginationHTML;
}

export function goToPage(page) {
    currentPage = page;
    searchReportsImmediate();
}

// --- Report Actions (CRUD) ---
export function createNewReport() {
    // Redirect to the create report page
    window.location.href = '/create-report';
}

async function regenerateReport(id) {
    // Redirect to the create report page with the report ID for editing
    window.location.href = `/create-report?id=${id}`;
}

async function deleteReport(id) {
    export const confirmDelete = await new Promise(resolve => {
        export const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';

        modal.innerHTML = `
            <div class="modal-content">
                <h3>Confirm Deletion</h3>
                <p>Are you sure you want to delete this report? This action cannot be undone.</p>
                <div class="modal-buttons">
                    <button type="button" class="btn btn-secondary" id="cancelDeleteBtn">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        export const confirmBtn = document.getElementById('confirmDeleteBtn');
        export const cancelBtn = document.getElementById('cancelDeleteBtn');

        confirmBtn.onclick = () => {
            modal.remove();
            resolve(true);
        };

        cancelBtn.onclick = () => {
            modal.remove();
            resolve(false);
        };
    });

    if (confirmDelete) {
        export const result = await deleteReportDB(id);
        if (result) {
            allReportsCache = allReportsCache.filter(r => r.id !== id);
            // Re-fetch dashboard stats if the function exists
            if (typeof fetchDashboardStats === 'function') {
                dashboardStatsCache = await fetchDashboardStats();
                updateDashboardStats(dashboardStatsCache);
            }
            searchReportsImmediate(); // Re-render the reports table
            showToast('Report deleted successfully', 'success');
        } else {
            showToast('Failed to delete report', 'error');
        }
    }
}

export function viewReport(id) {
    window.location.href = `/report/${id}`;
}

// --- Form Handling ---
export function resetFormData() {
    export const form = document.getElementById('qaReportForm');
    if (form) {
        form.reset();

        // Set default values
        document.getElementById('reportDate').value = getCurrentDate();
        document.getElementById('reportVersion').value = '3';

        requestData = [];
        buildData = [];
        testerData = [];
        teamMemberData = []; // Reset team member data
        qaNoteFieldsData = []; // Reset custom QA note fields
        qaNotesData = []; // Reset QA notes array data
        // customFieldsData = []; // Reset custom fields data - REMOVED

        renderRequestList();
        renderBuildList();
        renderTesterList();
        renderTeamMemberList();
        renderQANotesList();
        renderQANoteFieldsList();
        updateQANotesCount();

        resetAllCharts();
        currentSection = 0; // Reset to first section
        updateNavigationButtons();
    }
}

export function resetAllCharts() {
    // Destroy existing charts to prevent memory leaks and then re-initialize them
    if (userStoriesChart) userStoriesChart.destroy();
    if (testCasesChart) testCasesChart.destroy();
    if (issuesPriorityChart) issuesPriorityChart.destroy();
    if (issuesStatusChart) issuesStatusChart.destroy();
    if (enhancementsChart) enhancementsChart.destroy();
    if (automationTestCasesChart) automationTestCasesChart.destroy();
    if (automationPercentageChart) automationPercentageChart.destroy();
    if (automationStabilityChart) automationStabilityChart.destroy();
    if (evaluationChart) evaluationChart.destroy();

    initializeCharts(); // Re-initialize all charts to their default empty state
}

async function loadReportForEditing(report) {
    resetFormData(); // Reset first to clear any previous data

    // First, load the dropdown data to ensure options are available
    await loadFormDropdownData();

    // Wait a bit for dropdowns to be populated
    await new Promise(resolve => setTimeout(resolve, 500));

    // Load portfolio first
    export const portfolioSelect = document.getElementById('portfolioName');
    if (portfolioSelect && report.portfolioName) {
        portfolioSelect.value = report.portfolioName;
        // Trigger portfolio selection to load projects
        await onPortfolioSelection();

        // Wait for projects to load
        await new Promise(resolve => setTimeout(resolve, 300));

        // Then load project
        export const projectSelect = document.getElementById('projectName');
        if (projectSelect && report.projectName) {
            projectSelect.value = report.projectName;
        }
    }

    // Basic fields (excluding portfolioName and projectName as they're handled above)
    export const basicFields = ['sprintNumber', 'reportVersion', 'reportName', 'cycleNumber', 'reportDate', 'testSummary', 'testingStatus', 'releaseNumber', 'testEnvironment'];

    // Evaluation fields
    export const evaluationFields = [
        'involvementScore', 'involvementReason',
        'requirementsQualityScore', 'requirementsQualityReason',
        'qaPlanReviewScore', 'qaPlanReviewReason',
        'uxScore', 'uxReason',
        'cooperationScore', 'cooperationReason',
        'criticalBugsScore', 'criticalBugsReason',
        'highBugsScore', 'highBugsReason',
        'mediumBugsScore', 'mediumBugsReason',
        'lowBugsScore', 'lowBugsReason'
    ];
    basicFields.forEach(field => {
        export const element = document.getElementById(field);
        if (element && report[field] !== undefined) {
            element.value = report[field];
        }
    });

    // Load evaluation fields
    evaluationFields.forEach(field => {
        export const element = document.getElementById(field);
        if (element && report[field] !== undefined) {
            element.value = report[field];
        }
    });

    // Calculate final score after loading evaluation data
    calculateFinalScore();

    // User Stories
    export const userStoryFields = ['passedUserStories', 'passedWithIssuesUserStories', 'failedUserStories', 'blockedUserStories', 'cancelledUserStories', 'deferredUserStories', 'notTestableUserStories'];
    userStoryFields.forEach(field => {
        export const element = document.getElementById(field.replace('UserStories', 'Stories')); // Adjust ID for HTML
        if (element && report[field] !== undefined) {
            element.value = report[field];
        }
    });

    // Test Cases
    export const testCaseFields = ['passedTestCases', 'passedWithIssuesTestCases', 'failedTestCases', 'blockedTestCases', 'cancelledTestCases', 'deferredTestCases', 'notTestableTestCases'];
    testCaseFields.forEach(field => {
        export const element = document.getElementById(field);
        if (element && report[field] !== undefined) {
            element.value = report[field];
        }
    });

    // Issues
    export const issueFields = ['criticalIssues', 'highIssues', 'mediumIssues', 'lowIssues', 'newIssues', 'fixedIssues', 'notFixedIssues', 'reopenedIssues', 'deferredIssues'];
    issueFields.forEach(field => {
        export const element = document.getElementById(field);
        if (element && report[field] !== undefined) {
            element.value = report[field];
        }
    });

    // Enhancements
    export const enhancementFields = ['newEnhancements', 'implementedEnhancements', 'existsEnhancements'];
    enhancementFields.forEach(field => {
        export const element = document.getElementById(field);
        if (element && report[field] !== undefined) {
            element.value = report[field];
        }
    });

    // Dynamic data
    requestData = report.requestData || [];
    buildData = report.buildData || [];
    testerData = report.testerData || [];
    // Assuming teamMemberData are part of the report object
    teamMemberData = report.teamMemberData || []; // Assuming this field exists in your report model
    qaNoteFieldsData = report.qaNoteFieldsData || []; // Load custom QA note fields
    qaNotesData = report.qaNotesData || []; // Load QA notes array data
    // customFieldsData = report.customFields || {}; // Assuming this is an object in your report model - REMOVED

    renderRequestList();
    renderBuildList();
    renderTesterList();
    renderTeamMemberList();
    renderQANotesList();
    renderQANoteFieldsList(); // Render custom QA note fields
    // renderCustomFields(); // If you have a render function for custom fields

    // Recalculate all totals and charts
    calculatePercentages();
    calculateTestCasesPercentages();
    calculateIssuesPercentages();
    calculateEnhancementsPercentages();
    calculateAutomationPercentages();
    calculateAutomationStabilityPercentages();
}

// Form submission handler
// This listener should only be active on the create_report.html page
document.addEventListener('DOMContentLoaded', () => {
    export const qaReportForm = document.getElementById('qaReportForm');
    if (qaReportForm) {
        qaReportForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            export const formData = new FormData(this);
            export const reportData = {};

            // Collect form data
            for (let [key, value] of formData.entries()) {
                // Handle special cases for array inputs (e.g., checkboxes if any)
                if (key.endsWith('[]')) {
                    export const arrayKey = key.slice(0, -2);
                    if (!reportData[arrayKey]) {
                        reportData[arrayKey] = [];
                    }
                    reportData[arrayKey].push(value);
                } else {
                    reportData[key] = value;
                }
            }

            // Add dynamic data (requestData, buildData, testerData, teamMemberData)
            reportData.requestData = requestData;
            reportData.buildData = buildData;
            reportData.testerData = testerData;
            reportData.teamMemberData = teamMemberData; // Add team member data
            reportData.qaNoteFieldsData = qaNoteFieldsData; // Add custom QA note fields
            reportData.qaNotesData = qaNotesData; // Add QA notes array data
            // reportData.customFields = customFieldsData; // Add custom fields data - REMOVED

            export const savedReport = await saveReport(reportData);
            if (savedReport) {
                showToast('Report saved successfully!', 'success');

                // Clear form data from localStorage and reset form
                clearFormDataOnSubmit();

                // Redirect to reports list after saving
                window.location.href = '/reports';
            } else {
                showToast('Failed to save report. Please try again.', 'error');
            }
        });
    }
});


// --- Enhanced Export Functions ---
async function exportReportAsPdf(id) {
    export const report = allReportsCache.find(r => r.id === id);
    if (!report) {
        console.error("Report not found for PDF export:", id);
        showToast('Report not found for PDF export.', 'error');
        return;
    }

    export const { jsPDF } = window.jspdf;
    export const doc = new jsPDF();

    export let yPos = 20;

    // Helper functions
    export const addTitle = (text, fontSize = 16) => {
        doc.setFontSize(fontSize);
        doc.setFont(undefined, 'bold');
        doc.text(text, 105, yPos, { align: 'center' });
        yPos += fontSize * 0.8;
    };

    export const addSection = (title, fontSize = 14) => {
        yPos += 10;
        doc.setFontSize(fontSize);
        doc.setFont(undefined, 'bold');
        doc.text(title, 10, yPos);
        yPos += 10;
    };

    export const addText = (text, x = 10) => {
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        export const splitText = doc.splitTextToSize(text, 190);
        doc.text(splitText, x, yPos);
        yPos += splitText.length * 6;
    };

    // Report Header
    addTitle("QA Testing Report", 18);
    addText(`Generated on: ${new Date().toLocaleDateString()}`, 150);

    // Cover Information
    addSection("Cover Information");
    addText(`Portfolio: ${report.portfolioName || 'N/A'}`);
    addText(`Project: ${report.projectName || 'N/A'}`);
    addText(`Sprint: ${report.sprintNumber || 'N/A'} | Version: ${report.reportVersion || 'N/A'} | Cycle: ${report.cycleNumber || 'N/A'}`);
    addText(`Report Date: ${formatDate(report.reportDate)} | Status: ${getStatusText(report.testingStatus)}`);
    if (report.reportName) {
        addText(`Report Name: ${report.reportName}`);
    }

    // Test Summary
    if (report.testSummary) {
        addSection("Test Summary");
        addText(report.testSummary);
    }

    // Metrics Summary
    addSection("Testing Metrics Summary");
    doc.autoTable({
        startY: yPos,
        head: [['Metric', 'Count']],
        body: [
            ['Total User Stories', report.totalUserStories || 0],
            ['Total Test Cases', report.totalTestCases || 0],
            ['Total Issues', report.totalIssues || 0],
            ['Total Enhancements', report.totalEnhancements || 0],
            ['QA Notes', report.qaNotesData && report.qaNotesData.length > 0 ? `${report.qaNotesData.length} notes` : 'N/A']
        ],
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [66, 133, 244], textColor: 255 }
    });
    yPos = doc.lastAutoTable.finalY + 15;

    // Check if we need a new page
    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }

    // Dynamic sections with tables
    export const addDataTable = (title, data, headers) => {
        if (data && data.length > 0) {
            addSection(title);
            doc.autoTable({
                startY: yPos,
                head: [headers],
                body: data,
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [100, 180, 250], textColor: 255 }
            });
            yPos = doc.lastAutoTable.finalY + 10;
        }
    };

    // Requests
    if (report.requestData && report.requestData.length > 0) {
        export const requestsData = report.requestData.map(req => [req.id, req.url]);
        addDataTable("Request Information", requestsData, ['Request ID', 'URL']);
    }

    // Builds
    if (report.buildData && report.buildData.length > 0) {
        export const buildsData = report.buildData.map(build => [build.requestId, build.environment, build.cycles]);
        addDataTable("Build Information", buildsData, ['Request ID', 'Environment', 'Cycles']);
    }

    // Testers
    if (report.testerData && report.testerData.length > 0) {
        export const testersData = report.testerData.map(tester => {
            export const roles = [];
            if (tester.is_automation_engineer) roles.push('Automation Engineer');
            if (tester.is_manual_engineer) roles.push('Manual Engineer');
            export const roleText = roles.length > 0 ? roles.join(', ') : 'No roles assigned';
            return [tester.name, tester.email, roleText];
        });
        addDataTable("Testers", testersData, ['Tester Name', 'Email', 'Roles']);
    }

    // Team Members
    if (report.teamMemberData && report.teamMemberData.length > 0) {
        export const teamMembersData = report.teamMemberData.map(member => [
            member.name,
            member.role,
            member.email
        ]);
        addDataTable("Team Members", teamMembersData, ['Name', 'Role', 'Email']);
    }

    // User Stories Breakdown
    if (report.totalUserStories > 0) {
        addSection("User Stories Breakdown");
        doc.autoTable({
            startY: yPos,
            head: [['Status', 'Count', 'Percentage']],
            body: [
                ['Passed', report.passedUserStories || 0, `${Math.round(((report.passedUserStories || 0) / report.totalUserStories) * 100)}%`],
                ['Passed with Issues', report.passedWithIssuesUserStories || 0, `${Math.round(((report.passedWithIssuesUserStories || 0) / report.totalUserStories) * 100)}%`],
                ['Failed', report.failedUserStories || 0, `${Math.round(((report.failedUserStories || 0) / report.totalUserStories) * 100)}%`],
                ['Blocked', report.blockedUserStories || 0, `${Math.round(((report.blockedUserStories || 0) / report.totalUserStories) * 100)}%`],
                ['Cancelled', report.cancelledUserStories || 0, `${Math.round(((report.cancelledUserStories || 0) / report.totalUserStories) * 100)}%`],
                ['Deferred', report.deferredUserStories || 0, `${Math.round(((report.deferredUserStories || 0) / report.totalUserStories) * 100)}%`],
                ['Not Testable', report.notTestableUserStories || 0, `${Math.round(((report.notTestableUserStories || 0) / report.totalUserStories) * 100)}%`]
            ],
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [40, 167, 69], textColor: 255 }
        });
        yPos = doc.lastAutoTable.finalY + 10;
    }

    // QA Notes
    if (report.qaNotesData && report.qaNotesData.length > 0) {
        if (yPos > 200) {
            doc.addPage();
            yPos = 20;
        }
        addSection("QA Notes");
        report.qaNotesData.forEach((note, index) => {
            addText(`Note ${index + 1}: ${note.note}`);
        });
    }

    doc.save(`QA_Report_${report.portfolioName}_Sprint_${report.sprintNumber}.pdf`);
    showToast('PDF report exported successfully!', 'success');
}

async function exportReportAsExcel(id) {
    export const report = allReportsCache.find(r => r.id === id);
    if (!report) {
        console.error("Report not found for Excel export:", id);
        showToast('Report not found for Excel export.', 'error');
        return;
    }

    export const workbook = XLSX.utils.book_new();

    // Summary Sheet
    export const summaryData = [
        ["Field", "Value"],
        ["Portfolio Name", report.portfolioName || 'N/A'],
        ["Project Name", report.projectName || 'N/A'],
        ["Sprint Number", report.sprintNumber || 'N/A'],
        ["Report Version", report.reportVersion || 'N/A'],
        ["Report Name", report.reportName || 'N/A'],
        ["Cycle Number", report.cycleNumber || 'N/A'],
        ["Report Date", formatDate(report.reportDate)],
        ["Testing Status", getStatusText(report.testingStatus)],
        ["Test Summary", report.testSummary || 'N/A'],
        ["", ""],
        ["METRICS", ""],
        ["Total User Stories", report.totalUserStories || 0],
        ["Total Test Cases", report.totalTestCases || 0],
        ["Total Issues", report.totalIssues || 0],
        ["Total Enhancements", report.totalEnhancements || 0],
        ["QA Notes", report.qaNotesData && report.qaNotesData.length > 0 ? `${report.qaNotesData.length} notes` : 'N/A']
    ];
    export const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, wsSummary, "Summary");

    // User Stories Sheet
    export const userStoriesData = [
        ["Status", "Count", "Percentage"],
        ["Passed", report.passedUserStories || 0, report.totalUserStories ? Math.round(((report.passedUserStories || 0) / report.totalUserStories) * 100) : 0],
        ["Passed with Issues", report.passedWithIssuesUserStories || 0, report.totalUserStories ? Math.round(((report.passedWithIssuesUserStories || 0) / report.totalUserStories) * 100) : 0],
        ["Failed", report.failedUserStories || 0, report.totalUserStories ? Math.round(((report.failedUserStories || 0) / report.totalUserStories) * 100) : 0],
        ["Blocked", report.blockedUserStories || 0, report.totalUserStories ? Math.round(((report.blockedUserStories || 0) / report.totalUserStories) * 100) : 0],
        ["Cancelled", report.cancelledUserStories || 0, report.totalUserStories ? Math.round(((report.cancelledUserStories || 0) / report.totalUserStories) * 100) : 0],
        ["Deferred", report.deferredUserStories || 0, report.totalUserStories ? Math.round(((report.deferredUserStories || 0) / report.totalUserStories) * 100) : 0],
        ["Not Testable", report.notTestableUserStories || 0, report.totalUserStories ? Math.round(((report.notTestableUserStories || 0) / report.totalUserStories) * 100) : 0]
    ];
    export const wsUserStories = XLSX.utils.aoa_to_sheet(userStoriesData);
    XLSX.utils.book_append_sheet(workbook, wsUserStories, "User Stories");

    // Test Cases Sheet
    export const testCasesData = [
        ["Status", "Count", "Percentage"],
        ["Passed", report.passedTestCases || 0, report.totalTestCases ? Math.round(((report.passedTestCases || 0) / report.totalTestCases) * 100) : 0],
        ["Passed with Issues", report.passedWithIssuesTestCases || 0, report.totalTestCases ? Math.round(((report.passedWithIssuesTestCases || 0) / report.totalTestCases) * 100) : 0],
        ["Failed", report.failedTestCases || 0, report.totalTestCases ? Math.round(((report.failedTestCases || 0) / report.totalTestCases) * 100) : 0],
        ["Blocked", report.blockedTestCases || 0, report.totalTestCases ? Math.round(((report.blockedTestCases || 0) / report.totalTestCases) * 100) : 0],
        ["Cancelled", report.cancelledTestCases || 0, report.totalTestCases ? Math.round(((report.cancelledTestCases || 0) / report.totalTestCases) * 100) : 0],
        ["Deferred", report.deferredTestCases || 0, report.totalTestCases ? Math.round(((report.deferredTestCases || 0) / report.totalTestCases) * 100) : 0],
        ["Not Testable", report.notTestableTestCases || 0, report.totalTestCases ? Math.round(((report.notTestableTestCases || 0) / report.totalTestCases) * 100) : 0]
    ];
    export const wsTestCases = XLSX.utils.aoa_to_sheet(testCasesData);
    XLSX.utils.book_append_sheet(workbook, wsTestCases, "Test Cases");

    // Issues Sheet
    export const issuesData = [
        ["Priority/Status", "Count", "Percentage"],
        ["", "", ""],
        ["PRIORITY BREAKDOWN", "", ""],
        ["Critical", report.criticalIssues || 0, report.totalIssues ? Math.round(((report.criticalIssues || 0) / report.totalIssues) * 100) : 0],
        ["High", report.highIssues || 0, report.totalIssues ? Math.round(((report.highIssues || 0) / report.totalIssues) * 100) : 0],
        ["Medium", report.mediumIssues || 0, report.totalIssues ? Math.round(((report.mediumIssues || 0) / report.totalIssues) * 100) : 0],
        ["Low", report.lowIssues || 0, report.totalIssues ? Math.round(((report.lowIssues || 0) / report.totalIssues) * 100) : 0],
        ["", "", ""],
        ["STATUS BREAKDOWN", "", ""],
        ["New", report.newIssues || 0, report.totalIssues ? Math.round(((report.newIssues || 0) / report.totalIssues) * 100) : 0],
        ["Fixed", report.fixedIssues || 0, report.totalIssues ? Math.round(((report.fixedIssues || 0) / report.totalIssues) * 100) : 0],
        ["Not Fixed", report.notFixedIssues || 0, report.totalIssues ? Math.round(((report.notFixedIssues || 0) / report.totalIssues) * 100) : 0],
        ["Re-opened", report.reopenedIssues || 0, report.totalIssues ? Math.round(((report.reopenedIssues || 0) / report.totalIssues) * 100) : 0],
        ["Deferred", report.deferredIssues || 0, report.totalIssues ? Math.round(((report.deferredIssues || 0) / report.totalIssues) * 100) : 0]
    ];
    export const wsIssues = XLSX.utils.aoa_to_sheet(issuesData);
    XLSX.utils.book_append_sheet(workbook, wsIssues, "Issues");

    // Enhancements Sheet
    export const enhancementsData = [
        ["Status", "Count", "Percentage"],
        ["New", report.newEnhancements || 0, report.totalEnhancements ? Math.round(((report.newEnhancements || 0) / report.totalEnhancements) * 100) : 0],
        ["Implemented", report.implementedEnhancements || 0, report.totalEnhancements ? Math.round(((report.implementedEnhancements || 0) / report.totalEnhancements) * 100) : 0],
        ["Exists", report.existsEnhancements || 0, report.totalEnhancements ? Math.round(((report.existsEnhancements || 0) / report.totalEnhancements) * 100) : 0]
    ];
    export const wsEnhancements = XLSX.utils.aoa_to_sheet(enhancementsData);
    XLSX.utils.book_append_sheet(workbook, wsEnhancements, "Enhancements");

    // Detailed Metrics Sheet
    export const detailedMetricsData = [
        ["Metric Category", "Metric", "Value"],
        ["", "", ""],
        ["USER STORIES METRICS", "", ""],
        ["Passed", "Count", report.passedUserStories || 0],
        ["Passed with Issues", "Count", report.passedWithIssuesUserStories || 0],
        ["Failed", "Count", report.failedUserStories || 0],
        ["Blocked", "Count", report.blockedUserStories || 0],
        ["Cancelled", "Count", report.cancelledUserStories || 0],
        ["Deferred", "Count", report.deferredUserStories || 0],
        ["Not Testable", "Count", report.notTestableUserStories || 0],
        ["Total", "Count", report.totalUserStories || 0],
        ["", "", ""],
        ["TEST CASES METRICS", "", ""],
        ["Passed", "Count", report.passedTestCases || 0],
        ["Passed with Issues", "Count", report.passedWithIssuesTestCases || 0],
        ["Failed", "Count", report.failedTestCases || 0],
        ["Blocked", "Count", report.blockedTestCases || 0],
        ["Cancelled", "Count", report.cancelledTestCases || 0],
        ["Deferred", "Count", report.deferredTestCases || 0],
        ["Not Testable", "Count", report.notTestableTestCases || 0],
        ["Total", "Count", report.totalTestCases || 0],
        ["", "", ""],
        ["ISSUES METRICS", "", ""],
        ["Critical Priority", "Count", report.criticalIssues || 0],
        ["High Priority", "Count", report.highIssues || 0],
        ["Medium Priority", "Count", report.mediumIssues || 0],
        ["Low Priority", "Count", report.lowIssues || 0],
        ["New Status", "Count", report.newIssues || 0],
        ["Fixed Status", "Count", report.fixedIssues || 0],
        ["Not Fixed Status", "Count", report.notFixedIssues || 0],
        ["Re-opened Status", "Count", report.reopenedIssues || 0],
        ["Deferred Status", "Count", report.deferredIssues || 0],
        ["Total", "Count", report.totalIssues || 0],
        ["", "", ""],
        ["ENHANCEMENTS METRICS", "", ""],
        ["New", "Count", report.newEnhancements || 0],
        ["Implemented", "Count", report.implementedEnhancements || 0],
        ["Exists", "Count", report.existsEnhancements || 0],
        ["Total", "Count", report.totalEnhancements || 0],
        ["", "", ""],
        ["CALCULATED METRICS", "", ""],
        ["User Stories Metric", "Auto-calculated", report.userStoriesMetric || 0],
        ["Test Cases Metric", "Auto-calculated", report.testCasesMetric || 0],
        ["Issues Metric", "Auto-calculated", report.issuesMetric || 0],
        ["Enhancements Metric", "Auto-calculated", report.enhancementsMetric || 0],
        ["QA Notes Metric", "Count", report.qaNotesMetric || 0],
        ["", "", ""],
        ["TIMESTAMPS", "", ""],
        ["Created At", "DateTime", report.createdAt || 'N/A'],
        ["Updated At", "DateTime", report.updatedAt || 'N/A']
    ];
    export const wsDetailedMetrics = XLSX.utils.aoa_to_sheet(detailedMetricsData);
    XLSX.utils.book_append_sheet(workbook, wsDetailedMetrics, "Detailed Metrics");

    // Dynamic Data Sheets
    if (report.requestData && report.requestData.length > 0) {
        export const requestHeaders = ["Request ID", "URL"];
        export const requestsSheetData = report.requestData.map(req => [req.id, req.url]);
        export const wsRequests = XLSX.utils.aoa_to_sheet([requestHeaders, ...requestsSheetData]);
        XLSX.utils.book_append_sheet(workbook, wsRequests, "Requests");
    }

    if (report.buildData && report.buildData.length > 0) {
        export const buildHeaders = ["Request ID", "URL", "Environment", "Cycles"];
        export const buildsSheetData = report.buildData.map(build => [build.requestId, build.requestUrl, build.environment, build.cycles]);
        export const wsBuilds = XLSX.utils.aoa_to_sheet([buildHeaders, ...buildsSheetData]);
        XLSX.utils.book_append_sheet(workbook, wsBuilds, "Builds");
    }

    if (report.testerData && report.testerData.length > 0) {
        export const testerHeaders = ["Tester Name", "Email", "Roles"];
        export const testersSheetData = report.testerData.map(tester => {
            export const roles = [];
            if (tester.is_automation_engineer) roles.push('Automation Engineer');
            if (tester.is_manual_engineer) roles.push('Manual Engineer');
            export const roleText = roles.length > 0 ? roles.join(', ') : 'No roles assigned';
            return [tester.name, tester.email, roleText];
        });
        export const wsTesters = XLSX.utils.aoa_to_sheet([testerHeaders, ...testersSheetData]);
        XLSX.utils.book_append_sheet(workbook, wsTesters, "Testers");
    }

    if (report.teamMemberData && report.teamMemberData.length > 0) {
        export const teamMemberHeaders = ["Name", "Email", "Role"];
        export const teamMembersSheetData = report.teamMemberData.map(member => [member.name, member.email, member.role]);
        export const wsTeamMembers = XLSX.utils.aoa_to_sheet([teamMemberHeaders, ...teamMembersSheetData]);
        XLSX.utils.book_append_sheet(workbook, wsTeamMembers, "Team Members");
    }
    XLSX.writeFile(workbook, `QA_Report_${report.portfolioName}_Sprint_${report.sprintNumber}.xlsx`);
    showToast('Excel report exported successfully!', 'success');
}

// --- Modal & Utility Functions ---
export function showModal(modalId) {
    console.log('showModal called with modalId:', modalId);
    export const modal = document.getElementById(modalId);
    console.log('Modal element found:', modal);
    if (modal) {
        modal.style.display = 'flex';
        console.log('Modal display set to flex');
    } else {
        console.error('Modal element not found:', modalId);
    }
}

export function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // Clear form inputs
    export const modal = document.getElementById(modalId);
    if (modal) { // Check if modal exists before querying
        export const inputs = modal.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
    }
}

export function showAddPortfolioModal() {
    showModal('addPortfolioModal');
}

export function showAddProjectModal() {
    showModal('addProjectModal');
}

async function addPortfolio() {
    export const name = document.getElementById('newPortfolioName').value.trim();
    if (name) {
        try {
            export const response = await fetch('/api/portfolios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name })
            });
            if (response.ok) {
                export const newPortfolio = await response.json();
                showToast('Portfolio added successfully! Now please add a project to this portfolio.', 'success');
                invalidateAllCaches(); // Clear caches since data changed

                // Reload portfolios and select the new one
                await loadPortfoliosOnly();

                // Select the newly created portfolio
                export const portfolioSelect = document.getElementById('portfolioName');
                if (portfolioSelect) {
                    // Find and select the new portfolio option
                    export const portfolioValue = name.toLowerCase().replace(/\s+/g, '-');
                    portfolioSelect.value = portfolioValue;

                    // Trigger the change event to load projects for this portfolio
                    export const changeEvent = new Event('change', { bubbles: true });
                    portfolioSelect.dispatchEvent(changeEvent);
                }

                closeModal('addPortfolioModal');

                // Force user to add a project by showing the project modal
                setTimeout(() => {
                    showToast('Please add a project to the new portfolio before proceeding.', 'info');
                    showAddProjectModal();
                }, 500);

            } else {
                export const error = await response.json();
                showToast('Error adding portfolio: ' + (error.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error adding portfolio:', error);
            showToast('Error adding portfolio', 'error');
        }
    } else {
        showToast('Please enter a portfolio name.', 'warning');
    }
}

async function addProject() {
    export const name = document.getElementById('newProjectName').value.trim();
    export const portfolioSelect = document.getElementById('portfolioName');

    if (!portfolioSelect.value) {
        showToast('Please select a portfolio first.', 'warning');
        return;
    }

    export const selectedPortfolioOption = portfolioSelect.options[portfolioSelect.selectedIndex];
    export const actualPortfolioId = selectedPortfolioOption ? selectedPortfolioOption.dataset.id : null;

    if (name && actualPortfolioId) {
        try {
            export const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, portfolio_id: actualPortfolioId })
            });
            if (response.ok) {
                export const newProject = await response.json();
                showToast('Project added successfully!', 'success');
                invalidateAllCaches(); // Clear caches since data changed

                // Reload projects for the current portfolio
                await loadProjectsForPortfolio(actualPortfolioId);

                // Select the newly created project
                export const projectSelect = document.getElementById('projectName');
                if (projectSelect) {
                    export const projectValue = name.toLowerCase().replace(/\s+/g, '-');
                    projectSelect.value = projectValue;

                    // Trigger the change event to enable remaining fields
                    export const changeEvent = new Event('change', { bubbles: true });
                    projectSelect.dispatchEvent(changeEvent);
                }

                closeModal('addProjectModal');
            } else {
                export const error = await response.json();
                showToast('Error adding project: ' + (error.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error adding project:', error);
            showToast('Error adding project', 'error');
        }
    } else {
        showToast('Please enter a project name and ensure a portfolio is selected.', 'warning');
    }
}

export function getCurrentDate() {
    export const today = new Date();
    return `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
}

export function generateDefaultReportName() {
    export const portfolioSelect = document.getElementById('portfolioName');
    export const projectSelect = document.getElementById('projectName');
    export const sprintNumber = document.getElementById('sprintNumber');
    export const cycleNumber = document.getElementById('cycleNumber');

    if (portfolioSelect?.value && projectSelect?.value && sprintNumber?.value && cycleNumber?.value) {
        export const portfolio = portfolioSelect.options[portfolioSelect.selectedIndex].text;
        export const project = projectSelect.options[projectSelect.selectedIndex].text;
        export const today = getCurrentDate();

        return `Sprint-${portfolio}-${project}-${today}-${sprintNumber.value}-${cycleNumber.value}`;
    }

    return '';
}

// Evaluation Section Functions
export function toggleEvaluationCriteria() {
    export const content = document.getElementById('criteriaContent');
    export const icon = document.getElementById('criteriaToggleIcon');

    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        icon.classList.remove('expanded');
    } else {
        content.classList.add('expanded');
        icon.classList.add('expanded');
    }
}

export function calculateFinalScore() {
    export const scoreFields = [
        'involvementScore',
        'requirementsQualityScore',
        'qaPlanReviewScore',
        'uxScore',
        'cooperationScore',
        'highBugsScore',
        'mediumBugsScore',
        'lowBugsScore'
    ];

    export let totalScore = 0;
    scoreFields.forEach(fieldId => {
        export const field = document.getElementById(fieldId);
        if (field && field.value) {
            totalScore += parseInt(field.value) || 0;
        }
    });

    document.getElementById('finalScore').textContent = totalScore;

    // Update the evaluation chart
    updateEvaluationChart();
}

export function updateEvaluationChart() {
    export const ctx = document.getElementById('evaluationChart');
    if (!ctx) return;

    export const scores = {
        'Involvement': parseInt(document.getElementById('involvementScore')?.value) || 0,
        'Requirements Quality': parseInt(document.getElementById('requirementsQualityScore')?.value) || 0,
        'QA Plan Review': parseInt(document.getElementById('qaPlanReviewScore')?.value) || 0,
        'UX': parseInt(document.getElementById('uxScore')?.value) || 0,
        'Cooperation': parseInt(document.getElementById('cooperationScore')?.value) || 0,
        'Critical Bugs': parseInt(document.getElementById('criticalBugsScore')?.value) || 0,
        'High Bugs': parseInt(document.getElementById('highBugsScore')?.value) || 0,
        'Medium Bugs': parseInt(document.getElementById('mediumBugsScore')?.value) || 0,
        'Low Bugs': parseInt(document.getElementById('lowBugsScore')?.value) || 0
    };

    export const maxScores = {
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

    export const labels = Object.keys(scores);
    export const data = Object.values(scores);
    export const maxData = Object.values(maxScores);

    export const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
        '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899'
    ];

    if (evaluationChart) {
        evaluationChart.destroy();
    }

    evaluationChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(color => color + '80'),
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
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                title: {
                    display: true,
                    text: `Total Score: ${data.reduce((a, b) => a + b, 0)}/100`,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            export const label = context.label;
                            export const value = context.parsed;
                            export const maxValue = maxData[context.dataIndex];
                            return `${label}: ${value}/${maxValue}`;
                        }
                    }
                }
            }
        }
    });
}

export function formatDate(dateString) {
    if (!dateString) return 'N/A';
    // Handles both 'dd-mm-yyyy' and ISO strings
    export const date = new Date(dateString.includes('-') && dateString.length === 10 ?
        dateString.split('-').reverse().join('-') : dateString);
    return isNaN(date) ? 'Invalid Date' : date.toLocaleDateString('en-GB');
}

export function getStatusClass(status) {
    export const map = {
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

export function getStatusText(status) {
    export const map = {
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

// --- Event Listeners and Window Functions ---
// Close modal when clicking outside
window.onclick = function (event) {
    export const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Expose functions to the global scope
window.showAddQANoteFieldModal = showAddQANoteFieldModal;
window.updateQAFieldOptions = updateQAFieldOptions;
window.addQANoteField = addQANoteField;

// Date format validation and auto-generate report name
document.addEventListener('DOMContentLoaded', function () {
    export const reportDateField = document.getElementById('reportDate');
    if (reportDateField) {
        reportDateField.addEventListener('input', function (e) {
            export const datePattern = /^\d{2}-\d{2}-\d{4}$/;
            if (this.value && !datePattern.test(this.value)) {
                this.setCustomValidity('Please enter date in dd-mm-yyyy format');
            } else {
                this.setCustomValidity('');
            }
        });
    }

    // Add event listeners for auto-generating report name
    export const fieldsForReportName = ['portfolioName', 'projectName', 'sprintNumber', 'cycleNumber'];
    fieldsForReportName.forEach(fieldId => {
        export const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('change', function () {
                export const reportNameField = document.getElementById('reportName');
                if (reportNameField && !reportNameField.value.trim()) {
                    export const defaultName = generateDefaultReportName();
                    if (defaultName) {
                        reportNameField.placeholder = defaultName;
                    }
                }
            });
        }
    });
});

export function toggleWeightColumn() {
    export const columns = document.querySelectorAll('.weight-column');
    export const button = document.getElementById('toggleWeightBtn');

    if (!columns.length || !button) return;

    export const isVisible = columns[0].style.display !== 'none';

    columns.forEach(col => {
        col.style.display = isVisible ? 'none' : 'table-cell';
    });

    button.textContent = isVisible ? 'Show Weight' : 'Hide Weight';
}

export function toggleProjectReasonColumn() {
    export const columns = document.querySelectorAll('.project-reason-column');
    export const button = document.getElementById('toggleProjectReasonBtn');

    if (!columns.length || !button) return;

    export const isVisible = columns[0].style.display !== 'none';

    columns.forEach(col => {
        col.style.display = isVisible ? 'none' : 'table-cell';
    });

    button.textContent = isVisible ? 'Show Reason' : 'Hide Reason';
}

export let teamMemberData = [];

async function showTeamMemberModal() {
    await loadExistingTeamMembers();
    clearTeamMemberForm();
    showModal('teamMemberModal');
}

async function loadExistingTeamMembers() {
    try {
        export const response = await fetch('/api/team-members');
        if (response.ok) {
            export const teamMembers = await response.json();
            export const select = document.getElementById('existingTeamMemberSelect');

            select.innerHTML = '<option value="">-- Select from existing team members --</option>';

            teamMembers.forEach(member => {
                export const option = document.createElement('option');
                option.value = JSON.stringify(member); // Store full object for easy retrieval
                option.textContent = `${member.name} - ${member.role} (${member.email})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading team members:', error);
        showToast('Error loading team members', 'error');
    }
}

export function handleTeamMemberSelection() {
    export const select = document.getElementById('existingTeamMemberSelect');

    // Since we simplified the modal to select-only, we don't need to handle role field
    if (!select) {
        console.error('Team member select element not found');
        return;
    }

    // The function is called but doesn't need to do anything since we only have select functionality
}

export function clearTeamMemberForm() {
    export const existingSelect = document.getElementById('existingTeamMemberSelect');

    // Only clear the select dropdown since we simplified to select-only
    if (existingSelect) {
        existingSelect.value = '';
    }
}

async function addSelectedTeamMember() {
    export const existingSelect = document.getElementById('existingTeamMemberSelect');

    if (!existingSelect) {
        console.error('Team member select element not found');
        return;
    }

    if (!existingSelect.value) {
        showToast('Please select a team member', 'warning');
        return;
    }

    export let memberToAdd = null;

    try {
        memberToAdd = JSON.parse(existingSelect.value);
    } catch (error) {
        console.error('Error parsing team member data:', error);
        showToast('Error parsing team member data', 'error');
        return;
    }

    if (memberToAdd) {
        export const alreadyAdded = teamMemberData.some(tm => tm.email === memberToAdd.email);
        if (alreadyAdded) {
            showToast('This team member is already added to the report', 'warning');
            return;
        }

        teamMemberData.push({
            id: memberToAdd.id,
            name: memberToAdd.name,
            email: memberToAdd.email,
            role: memberToAdd.role
        });

        renderTeamMemberList();
        closeModal('teamMemberModal');
        showToast('Team member added successfully!', 'success');
    }
}

export function renderTeamMemberList() {
    export const container = document.getElementById('teamMemberList');
    if (!container) return;

    if (teamMemberData.length === 0) {
        container.innerHTML = '<div class="empty-state" style="text-align: center; color: #6c757d; padding: 20px 0;">No team members added yet. Click "Add Team Member" to get started.</div>';
        return;
    }

    container.innerHTML = teamMemberData.map((member, index) => `
        <div class="dynamic-item">
            <div>
                <strong>Name:</strong> ${member.name}<br>
                <strong>Role:</strong> <span class="role-badge ${member.role.toLowerCase().replace(/\s+/g, '-')}">${member.role}</span><br>
                <strong>Email:</strong> ${member.email}
            </div>
            <button type="button" class="btn-sm btn-delete" onclick="removeTeamMember(${index})">Remove</button>
        </div>
    `).join('');
}

export function removeTeamMember(index) {
    teamMemberData.splice(index, 1);
    renderTeamMemberList();
    showToast('Team member removed', 'info');
}

// Enhanced tester management functions (complete implementation)

async function loadExistingTesters() {
    try {
        export const response = await fetch('/api/testers');
        if (response.ok) {
            export const testers = await response.json();
            export const select = document.getElementById('existingTesterSelect');

            select.innerHTML = '<option value="">-- Select from existing testers --</option>';

            testers.forEach(tester => {
                export const option = document.createElement('option');
                option.value = JSON.stringify(tester); // Store full object for easy retrieval
                export const roles = [];
                if (tester.is_automation_engineer) roles.push('Automation');
                if (tester.is_manual_engineer) roles.push('Manual');
                export const roleText = roles.length > 0 ? ` - ${roles.join(', ')}` : '';
                option.textContent = `${tester.name} (${tester.email})${roleText}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading testers:', error);
        showToast('Error loading testers', 'error');
    }
}

export function handleTesterSelection() {
    export const select = document.getElementById('existingTesterSelect');

    // Since we simplified the modal to select-only, we don't need to handle add fields
    if (!select) {
        console.error('Tester select element not found');
        return;
    }

    // The function is called but doesn't need to do anything since we only have select functionality
}

export function clearTesterForm() {
    export const existingTesterSelect = document.getElementById('existingTesterSelect');

    // Only clear the select dropdown since we simplified to select-only
    if (existingTesterSelect) {
        existingTesterSelect.value = '';
    }
}

async function addSelectedTester() {
    export const existingTesterSelect = document.getElementById('existingTesterSelect');

    if (!existingTesterSelect) {
        console.error('Tester select element not found');
        return;
    }

    if (!existingTesterSelect.value) {
        showToast('Please select a tester', 'warning');
        return;
    }

    export let testerToAdd = null;

    try {
        testerToAdd = JSON.parse(existingTesterSelect.value);
    } catch (error) {
        console.error('Error parsing tester data:', error);
        showToast('Error parsing tester data', 'error');
        return;
    }

    if (testerToAdd) {
        export const alreadyAdded = testerData.some(t => t.email === testerToAdd.email);
        if (alreadyAdded) {
            showToast('This tester is already added to the report', 'warning');
            return;
        }

        testerData.push({
            id: testerToAdd.id,
            name: testerToAdd.name,
            email: testerToAdd.email,
            is_automation_engineer: testerToAdd.is_automation_engineer || false,
            is_manual_engineer: testerToAdd.is_manual_engineer || false
        });

        renderTesterList();
        closeModal('testerModal');
        showToast('Tester added successfully!', 'success');
    }
}

// QA Notes Custom Fields (if implemented in the HTML)

// This is a placeholder function for removing custom QA fields


export let qaNotesData = [];

export function showAddQANoteModal() {
    showModal('addQANoteModal');
    export const noteTextArea = document.getElementById('newQANoteText');
    if (noteTextArea) {
        noteTextArea.value = '';
    }
}

export function addQANote() {
    export const noteText = document.getElementById('newQANoteText').value.trim();
    if (noteText) {
        qaNotesData.push({ note: noteText });
        renderQANotesList();
        updateQANotesCount();
        closeModal('addQANoteModal');
        showToast('QA note added successfully!', 'success');
    } else {
        showToast('Please enter a note.', 'warning');
    }
}

// Functions for custom QA Note Fields
export function showAddQANoteFieldModal() {
    showModal('addQANoteFieldModal');
    // Clear the form fields when opening the modal
    document.getElementById('qaFieldName').value = '';
    document.getElementById('qaFieldValue').value = '';
}

// This function is a placeholder. In a real scenario, it might populate a dropdown
// with predefined field names or allow editing existing ones.
export function updateQAFieldOptions() {
    // For now, this function doesn't do anything as there are no predefined options.
    // It's kept to fulfill the request.
    console.log("updateQAFieldOptions called. No predefined options to update.");
}

export function addQANoteField() {
    export const fieldName = document.getElementById('qaFieldName').value.trim();
    export const fieldValue = document.getElementById('qaFieldValue').value.trim();

    if (fieldName && fieldValue) {
        qaNoteFieldsData.push({ name: fieldName, value: fieldValue });
        renderQANoteFieldsList();
        closeModal('addQANoteFieldModal');
        showToast('QA Note Field added successfully!', 'success');
    } else {
        showToast('Please enter both a field name and a field value.', 'warning');
    }
}

export function renderQANoteFieldsList() {
    export const container = document.getElementById('qaNoteFieldsList');
    if (!container) return;

    if (qaNoteFieldsData.length === 0) {
        container.innerHTML = '<div class="empty-state" style="text-align: center; color: #6c757d; padding: 20px 0;">No custom QA fields added yet.</div>';
        return;
    }

    container.innerHTML = qaNoteFieldsData.map((field, index) => `
        <div class="dynamic-item">
            <div>
                <strong>${field.name}:</strong> ${field.value}
            </div>
            <button type="button" class="btn-sm btn-delete" onclick="removeQANoteField(${index})">Remove</button>
        </div>
    `).join('');
}

export function removeQANoteField(index) {
    qaNoteFieldsData.splice(index, 1);
    renderQANoteFieldsList();
    showToast('QA Note Field removed', 'info');
}


export function removeQANote(index) {
    qaNotesData.splice(index, 1);
    renderQANotesList();
    updateQANotesCount();
}

export function renderQANotesList() {
    export const container = document.getElementById('qaNotesList');
    if (!container) return;

    if (qaNotesData.length === 0) {
        container.innerHTML = '<div class="empty-state">No QA notes added yet. Click "Add Note" to get started.</div>';
    } else {
        container.innerHTML = qaNotesData.map((item, index) => `
            <div class="dynamic-item">
                <div>${item.note}</div>
                <button type="button" class="btn-delete" onclick="removeQANote(${index})">Remove</button>
            </div>
        `).join('');
    }
}

export function updateQANotesCount() {
    export const countField = document.getElementById('qaNotesMetric');
    if (countField) {
        countField.value = qaNotesData.length;
    }
}

// --- Page Management & Navigation (Simplified for multi-page app) ---

export function renderQANotesFields() {
    export const container = document.getElementById('qaNotesFieldsList');
    if (!container) return;

    // Find the default general notes field (if it exists and is not a custom field)
    // Assuming the general notes textarea is always present and has id 'qaNotesText'
    // This function will only render *additional* custom QA fields.

    // Remove existing custom QA fields before re-rendering
    export const existingCustomFields = container.querySelectorAll('.qa-field-item');
    existingCustomFields.forEach(field => field.remove());

    // Add new custom fields
    qaNotesFields.forEach(field => {
        export const fieldHTML = renderQANoteFieldHTML(field);
        // Append to the container. If you want it after a specific element, you'd need to find that element.
        // For now, just append to the end of the list.
        container.insertAdjacentHTML('beforeend', fieldHTML);
    });
}

export function renderQANoteFieldHTML(field) {
    export let inputHTML = '';

    switch (field.type) {
        case 'input':
            inputHTML = `<input type="text" id="${field.id}" name="custom_${field.id}" placeholder="Enter ${field.name.toLowerCase()}" ${field.required ? 'required' : ''} value="${field.value || ''}">`;
            break;
        case 'textarea':
            inputHTML = `<textarea id="${field.id}" name="custom_${field.id}" placeholder="Enter ${field.name.toLowerCase()}" rows="4" ${field.required ? 'required' : ''}>${field.value || ''}</textarea>`.trim();
            break;
        case 'number':
            inputHTML = `<input type="number" id="${field.id}" name="custom_${field.id}" placeholder="Enter ${field.name.toLowerCase()}" ${field.required ? 'required' : ''} value="${field.value || ''}">`;
            break;
        case 'date':
            inputHTML = `<input type="date" id="${field.id}" name="custom_${field.id}" ${field.required ? 'required' : ''} value="${field.value || ''}">`;
            break;
        case 'select':
            inputHTML = `
                <select id="${field.id}" name="custom_${field.id}" ${field.required ? 'required' : ''}>
                    <option value="">Select ${field.name}</option>
                    ${field.options.map(opt => `<option value="${opt}" ${field.value === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                </select>
            `.trim();
            break;
        case 'radio':
            inputHTML = field.options.map((opt, index) => `
                <label class="radio-option">
                    <input type="radio" name="custom_${field.id}" value="${opt}" ${field.required && index === 0 ? 'required' : ''} ${field.value === opt ? 'checked' : ''}>
                    ${opt}
                </label>
            `).join('');
            break;
        case 'checkbox':
            inputHTML = field.options.map(opt => `
                <label class="checkbox-option">
                    <input type="checkbox" name="custom_${field.id}[]" value="${opt}" ${Array.isArray(field.value) && field.value.includes(opt) ? 'checked' : ''}>
                    ${opt}
                </label>
            `).join('');
            break;
    }

    return `
        <div class="qa-field-item form-group full-width">
            <div class="custom-field-header">
                <label for="${field.id}">${field.name}</label>
                <div class="custom-field-badges">
                    ${field.required ? '<span class="badge badge-required">Required</span>' : ''}
                    ${field.showInReport ? '<span class="badge badge-visible">Show in Report</span>' : '<span class="badge badge-hidden">Hidden</span>'}
                    <button type="button" class="btn-remove-field" onclick="removeQANoteField('${field.id}')">Remove</button>
                </div>
            </div>
            <div class="custom-field-input">
                ${inputHTML}
            </div>
        </div>
    `.trim();
}

export function removeQANoteField(fieldId) {
    qaNotesFields = qaNotesFields.filter(field => field.id !== fieldId);
    renderQANotesFields();
    showToast('QA note field removed', 'info');
}

async function populatePortfolioDropdownForCreateReport(portfolios) {
    export const select = document.getElementById('portfolioName');
    if (!select) {
        console.error('Portfolio select element not found!');
        return;
    }

    // Clear loading state and add basic options
    select.innerHTML = '<option value="">Select Portfolio</option>';
    select.innerHTML += '<option value="no-portfolio">No Portfolio (Standalone Project)</option>';

    // Add dynamic portfolios from database
    if (portfolios && Array.isArray(portfolios) && portfolios.length > 0) {
        portfolios.forEach(portfolio => {
            export const value = portfolio.name.toLowerCase().replace(/\s+/g, '-');
            // Store the actual ID in a data attribute
            select.innerHTML += `<option value="${value}" data-id="${portfolio.id}">${portfolio.name}</option>`;
        });
    }
}

// Function called when portfolio is selected
async function onPortfolioSelection() {
    export const portfolioSelect = document.getElementById('portfolioName');
    export const projectSelect = document.getElementById('projectName');

    if (!portfolioSelect.value) {
        // Clear projects and disable
        projectSelect.innerHTML = '<option value="">Select Project</option>';
        projectSelect.disabled = true;
        return;
    }

    projectSelect.disabled = false;
    projectSelect.innerHTML = '<option value="">Loading projects...</option>';

    try {
        export let projects = [];

        if (portfolioSelect.value === 'no-portfolio') {
            // Load projects without portfolio
            export const response = await fetch('/api/projects/without-portfolio');
            if (response.ok) {
                projects = await response.json();
            }
        } else {
            // Get portfolio ID from data attribute
            export const selectedOption = portfolioSelect.options[portfolioSelect.selectedIndex];
            export const portfolioId = selectedOption.getAttribute('data-id');

            if (portfolioId) {
                export const response = await fetch(`/api/projects/by-portfolio/${portfolioId}`);
                if (response.ok) {
                    projects = await response.json();
                }
            }
        }

        // Populate project dropdown
        projectSelect.innerHTML = '<option value="">Select Project</option>';
        projects.forEach(project => {
            projectSelect.innerHTML += `<option value="${project.name.toLowerCase().replace(/\s+/g, '-')}" data-id="${project.id}">${project.name}</option>`;
        });

        if (projects.length === 0) {
            projectSelect.innerHTML = '<option value="">No projects available</option>';
        }

    } catch (error) {
        console.error('Error loading projects:', error);
        projectSelect.innerHTML = '<option value="">Error loading projects</option>';
    }
}

async function populateProjectDropdown(projects) {
    export const select = document.getElementById('projectName');
    if (!select) return;

    // Keep existing static options (if any, from your original HTML)
    // For a clean slate, you might just clear and re-add.
    // Assuming you want to clear and re-add based on loaded data.
    select.innerHTML = '<option value="">Select Project</option>';

    // Add dynamic projects from database
    projects.forEach(project => {
        export const value = project.name.toLowerCase().replace(/\s+/g, '-');
        // Store the actual ID and portfolio ID in data attributes
        select.innerHTML += `<option value="${value}" data-id="${project.id}" data-portfolio-id="${project.portfolio_id}">${project.name}</option>`;
    });
}

// Caching for form dropdown data
export let formDataCache = null;
export let formDataCacheTime = null;

// Cache invalidation function
export function invalidateAllCaches() {
    formDataCache = null;
    formDataCacheTime = null;
    dashboardStatsCache = null;
    allReportsCache = [];
}

// Global variable to store latest project data for auto-loading
export let latestProjectData = null;

// Function called when project is selected
async function onProjectSelection() {
    console.log('onProjectSelection called');
    export const portfolioSelect = document.getElementById('portfolioName');
    export const projectSelect = document.getElementById('projectName');

    console.log('Portfolio value:', portfolioSelect?.value);
    console.log('Project value:', projectSelect?.value);

    if (!portfolioSelect.value || !projectSelect.value) {
        console.log('Missing portfolio or project value, returning');
        return;
    }

    export let portfolioName, projectName;

    // Handle "no-portfolio" case
    if (portfolioSelect.value === 'no-portfolio') {
        portfolioName = 'No Portfolio';
    } else {
        portfolioName = portfolioSelect.options[portfolioSelect.selectedIndex].text;
    }

    projectName = projectSelect.options[projectSelect.selectedIndex].text;
    console.log('Fetching data for:', portfolioName, '/', projectName);

    // Convert to lowercase for case-insensitive matching
    export const portfolioNameLower = portfolioName.toLowerCase();
    export const projectNameLower = projectName.toLowerCase();

    console.log('URL will be:', `/api/projects/${encodeURIComponent(portfolioNameLower)}/${encodeURIComponent(projectNameLower)}/latest-data`);

    try {
        export const response = await fetch(`/api/projects/${encodeURIComponent(portfolioNameLower)}/${encodeURIComponent(projectNameLower)}/latest-data`);
        console.log('API response status:', response.status);

        if (response.ok) {
            export const data = await response.json();
            console.log('API response data:', data);

            if (data.hasData) {
                console.log('Has data, showing modal');
                console.log('Data received:', JSON.stringify(data, null, 2));
                latestProjectData = data;

                // Automatically load testers when project is selected
                export const latestData = data.latestData;
                if (latestData.testerData && latestData.testerData.length > 0) {
                    console.log('Auto-loading testers for selected project:', latestData.testerData);
                    testerData = [...latestData.testerData];
                    renderTesterList();
                }

                console.log('About to call showAutoLoadModal...');
                showAutoLoadModal(data);
            } else {
                console.log('No previous data found for this project');
                console.log('Default values:', data.defaultValues);
                // No previous data, set defaults
                setDefaultValues(data.defaultValues);
            }
        }
    } catch (error) {
        console.error('Error fetching latest project data:', error);
        setDefaultValues();
    }
}

// Function to show the auto-load modal with data preview
export function showAutoLoadModal(data) {
    console.log('showAutoLoadModal called with data:', data);
    export const modal = document.getElementById('autoLoadDataModal');
    export const preview = document.getElementById('dataPreview');

    console.log('Modal element:', modal);
    console.log('Preview element:', preview);

    if (!modal) {
        console.error('Modal element not found! Make sure you are on the create report page.');
        return;
    }

    if (!preview) {
        console.error('Preview element not found!');
        return;
    }

    // Build data preview
    export const latestData = data.latestData;
    export const suggestedValues = data.suggestedValues;

    export let previewHTML = `
        <h4>Latest Report Data:</h4>
        <div class="data-preview-item">
            <span class="data-preview-label">Sprint Number:</span>
            <span class="data-preview-value">${latestData.sprintNumber} → Suggested: ${suggestedValues.sprintNumber}</span>
        </div>
        <div class="data-preview-item">
            <span class="data-preview-label">Cycle Number:</span>
            <span class="data-preview-value">${latestData.cycleNumber} → Suggested: ${suggestedValues.cycleNumber}</span>
        </div>
        <div class="data-preview-item">
            <span class="data-preview-label">Release Number:</span>
            <span class="data-preview-value">${latestData.releaseNumber} → Suggested: ${suggestedValues.releaseNumber}</span>
        </div>
        <div class="data-preview-item">
            <span class="data-preview-label">Report Version:</span>
            <span class="data-preview-value">${latestData.reportVersion}</span>
        </div>
        <div class="data-preview-item">
            <span class="data-preview-label">Testers:</span>
            <span class="data-preview-value">${latestData.testerData.length} tester(s)</span>
        </div>
        <div class="data-preview-item">
            <span class="data-preview-label">Team Members:</span>
            <span class="data-preview-value">${latestData.teamMembers.length} member(s)</span>
        </div>
    `;

    preview.innerHTML = previewHTML;
    console.log('Preview HTML set, about to show modal');
    console.log('Preview HTML content:', previewHTML);
    showModal('autoLoadDataModal');
    console.log('showModal call completed');
}

// Function to load selected data
export function loadSelectedData() {
    if (!latestProjectData) return;

    export const latestData = latestProjectData.latestData;
    export const suggestedValues = latestProjectData.suggestedValues;

    // Check which data types to load
    export const loadSprintData = document.getElementById('loadSprintData').checked;
    export const loadReportData = document.getElementById('loadReportData').checked;
    export const loadTesters = document.getElementById('loadTesters').checked;
    export const loadTeamMembers = document.getElementById('loadTeamMembers').checked;

    // Load Sprint & Release Information with the new logic
    if (loadSprintData) {
        document.getElementById('sprintNumber').value = suggestedValues.sprintNumber;
        document.getElementById('cycleNumber').value = suggestedValues.cycleNumber;
        document.getElementById('releaseNumber').value = suggestedValues.releaseNumber;
    }

    // Load Report Information
    if (loadReportData) {
        document.getElementById('reportVersion').value = latestData.reportVersion;
        // Set today's date
        export const today = new Date();
        export const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
        document.getElementById('reportDate').value = formattedDate;
    }

    // Load Testers
    if (loadTesters && latestData.testerData.length > 0) {
        // Clear existing testers
        testerData = [];
        latestData.testerData.forEach(tester => {
            testerData.push(tester);
        });
        renderTesterList();
    }

    // Load Team Members  
    if (loadTeamMembers && latestData.teamMembers.length > 0) {
        teamMemberData = [...latestData.teamMembers];
        renderTeamMemberList();
    }

    closeModal('autoLoadDataModal');
    showToast('Data loaded successfully!', 'success');
}

// Function to set default values for new projects
export function setDefaultValues(defaults) {
    export const today = new Date();
    export const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;

    if (defaults) {
        document.getElementById('sprintNumber').value = defaults.sprintNumber;
        document.getElementById('cycleNumber').value = defaults.cycleNumber;
        document.getElementById('releaseNumber').value = defaults.releaseNumber;
        document.getElementById('reportVersion').value = defaults.reportVersion;
        document.getElementById('reportDate').value = defaults.reportDate;
    } else {
        // Fallback defaults
        document.getElementById('sprintNumber').value = 1;
        document.getElementById('cycleNumber').value = 1;
        document.getElementById('releaseNumber').value = '1.0';
        document.getElementById('reportVersion').value = '1.0';
        document.getElementById('reportDate').value = formattedDate;
    }
}

// Missing form dropdown data loading function with caching
// Progressive form loading - starts with only portfolios
async function loadFormDropdownData() {
    try {
        console.log('Loading minimal portfolio data for progressive form loading...');
        await loadPortfoliosOnly();
        disableFormFieldsExceptPortfolio();
        setupProgressiveFormHandlers();
    } catch (error) {
        console.error('Error loading form data:', error);
        showToast('Error loading form data', 'error');
    }
}

// Load only portfolios for fast initial loading
async function loadPortfoliosOnly() {
    try {
        export const response = await fetch('/api/portfolios');
        if (response.ok) {
            export const portfolios = await response.json();
            populatePortfolioDropdownForCreateReport(portfolios);
        } else {
            throw new Error('Failed to load portfolios');
        }
    } catch (error) {
        console.error('Error loading portfolios:', error);
        showToast('Error loading portfolios', 'error');
    }
}

// Load projects for a specific portfolio
async function loadProjectsForPortfolio(portfolioId) {
    try {
        console.log('Loading projects for portfolio:', portfolioId);
        export const response = await fetch(`/api/projects/by-portfolio/${portfolioId}`);
        if (response.ok) {
            export const projects = await response.json();
            populateProjectDropdownFiltered(projects);
            enableProjectField();
        } else {
            throw new Error('Failed to load projects');
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        showToast('Error loading projects', 'error');
    }
}

// Disable all form fields except Portfolio Name
export function disableFormFieldsExceptPortfolio() {
    export const fieldsToDisable = [
        'projectName', 'sprintNumber', 'cycleNumber', 'releaseNumber',
        'reportName', 'reportVersion', 'reportDate'
    ];

    fieldsToDisable.forEach(fieldId => {
        export const field = document.getElementById(fieldId);
        if (field) {
            field.disabled = true;
            field.style.opacity = '0.5';
            field.style.cursor = 'not-allowed';
        }
    });

    // Also disable the project dropdown initially
    export const projectSelect = document.getElementById('projectName');
    if (projectSelect) {
        projectSelect.innerHTML = '<option value="">Select Portfolio first</option>';
        projectSelect.disabled = true;
        projectSelect.style.opacity = '0.5';
        projectSelect.style.cursor = 'not-allowed';
    }
}

// Enable project field after portfolio is selected
export function enableProjectField() {
    export const projectSelect = document.getElementById('projectName');
    if (projectSelect) {
        projectSelect.disabled = false;
        projectSelect.style.opacity = '1';
        projectSelect.style.cursor = 'pointer';
    }
}

// Enable all remaining fields after project is selected
export function enableAllRemainingFields() {
    export const fieldsToEnable = [
        'sprintNumber', 'cycleNumber', 'releaseNumber',
        'reportName', 'reportVersion', 'reportDate'
    ];

    fieldsToEnable.forEach(fieldId => {
        export const field = document.getElementById(fieldId);
        if (field) {
            field.disabled = false;
            field.style.opacity = '1';
            field.style.cursor = 'auto';
        }
    });
}

// Setup event handlers for progressive form loading
export function setupProgressiveFormHandlers() {
    export const portfolioSelect = document.getElementById('portfolioName');
    export const projectSelect = document.getElementById('projectName');

    if (portfolioSelect) {
        // Remove existing event listeners
        portfolioSelect.removeEventListener('change', onPortfolioChange);
        portfolioSelect.addEventListener('change', onPortfolioChange);
    }

    if (projectSelect) {
        // Remove existing event listeners
        projectSelect.removeEventListener('change', onProjectChangeProgressive);
        projectSelect.addEventListener('change', onProjectChangeProgressive);
    }
}

// Handle portfolio selection
async function onPortfolioChange(event) {
    export const selectedOption = event.target.selectedOptions[0];
    if (selectedOption && selectedOption.value && selectedOption.dataset.id) {
        export const portfolioId = selectedOption.dataset.id;
        await loadProjectsForPortfolio(portfolioId);

        // Clear project selection when portfolio changes
        export const projectSelect = document.getElementById('projectName');
        if (projectSelect) {
            projectSelect.value = '';
        }

        // Keep other fields disabled until project is selected
        disableFieldsAfterPortfolio();
    } else {
        // If no portfolio selected, disable everything
        disableFormFieldsExceptPortfolio();
    }
}

// Handle project selection in progressive mode
async function onProjectChangeProgressive(event) {
    if (event.target.value) {
        enableAllRemainingFields();

        // Call existing project selection logic for auto-population
        if (typeof onProjectSelection === 'function') {
            await onProjectSelection();
        }
    } else {
        disableFieldsAfterPortfolio();
    }
}

// Disable fields that require project selection
export function disableFieldsAfterPortfolio() {
    export const fieldsToDisable = [
        'sprintNumber', 'cycleNumber', 'releaseNumber',
        'reportName', 'reportVersion', 'reportDate'
    ];

    fieldsToDisable.forEach(fieldId => {
        export const field = document.getElementById(fieldId);
        if (field) {
            field.disabled = true;
            field.style.opacity = '0.5';
            field.style.cursor = 'not-allowed';
        }
    });
}

// Enhanced project dropdown population for filtered projects
export function populateProjectDropdownFiltered(projects) {
    export const select = document.getElementById('projectName');
    if (!select) return;

    select.innerHTML = '<option value="">Select Project</option>';

    projects.forEach(project => {
        export const value = project.name.toLowerCase().replace(/\s+/g, '-');
        select.innerHTML += `<option value="${value}" data-id="${project.id}">${project.name}</option>`;
    });
}

// Make functions globally accessible
window.createNewReport = createNewReport;
window.searchReports = searchReports;
window.searchReportsImmediate = searchReportsImmediate;
window.viewReport = viewReport;
window.regenerateReport = regenerateReport;
window.deleteReport = deleteReport;
window.exportDashboardReport = exportDashboardReport;
window.toggleSidebar = toggleSidebar;
window.backToDashboard = backToDashboard; // Now redirects to dashboard HTML
window.showSection = showSection;
window.previousSection = previousSection;
window.nextSection = nextSection;
window.showAddPortfolioModal = showAddPortfolioModal;
window.addPortfolio = addPortfolio;
window.applyFilters = applyFilters;
window.clearAllFilters = clearAllFilters;
window.toggleFiltersVisibility = toggleFiltersVisibility;
window.applyQuickFilter = applyQuickFilter;
window.removeFilter = removeFilter;
window.initializeFilterDropdowns = initializeFilterDropdowns;
window.refreshFilterData = refreshFilterData;
window.debugReportData = debugReportData;
window.testAPI = testAPI;
window.testTestersAPI = testTestersAPI;
window.testIndividualFilters = testIndividualFilters;
window.showAllReports = showAllReports;
window.showAddProjectModal = showAddProjectModal;
window.addProject = addProject;
window.closeModal = closeModal;
window.showRequestModal = showRequestModal;
window.addRequest = addRequest;
window.removeRequest = removeRequest;
window.showBuildModal = showBuildModal;
window.addBuild = addBuild;
window.removeBuild = removeBuild;
window.showTesterModal = showTesterModal;
// window.addTester = addTester; // Replaced by addSelectedTester
window.removeTester = removeTester;
window.calculatePercentages = calculatePercentages;
window.calculateTestCasesPercentages = calculateTestCasesPercentages;
window.calculateIssuesPercentages = calculateIssuesPercentages;
window.calculateIssuesStatusTotal = calculateIssuesStatusTotal;
window.calculateIssuesStatusPercentages = calculateIssuesStatusPercentages;
window.calculateEnhancementsPercentages = calculateEnhancementsPercentages;
window.calculateAutomationPercentages = calculateAutomationPercentages;
window.calculateAutomationStabilityPercentages = calculateAutomationStabilityPercentages;
window.goToPage = goToPage;
window.exportReportAsPdf = exportReportAsPdf;
window.exportReportAsExcel = exportReportAsExcel;
window.toggleWeightColumn = toggleWeightColumn; // If this is used on a page
window.toggleProjectReasonColumn = toggleProjectReasonColumn; // If this is used on a page
window.showAddQANoteFieldModal = showAddQANoteFieldModal;
window.updateQAFieldOptions = updateQAFieldOptions;
window.addQANoteField = addQANoteField;
window.removeQANoteField = removeQANoteField;
window.loadExistingTeamMembers = loadExistingTeamMembers;
window.handleTeamMemberSelection = handleTeamMemberSelection;
window.addSelectedTeamMember = addSelectedTeamMember;
window.loadExistingTesters = loadExistingTesters;
window.handleTesterSelection = handleTesterSelection;
window.addSelectedTester = addSelectedTester;
window.showToast = showToast;
window.removeToast = removeToast;
window.loadFormDropdownData = loadFormDropdownData; // Make it globally accessible
window.loadPortfoliosOnly = loadPortfoliosOnly;
window.loadProjectsForPortfolio = loadProjectsForPortfolio;
window.onPortfolioChange = onPortfolioChange;
window.onProjectChangeProgressive = onProjectChangeProgressive;
window.enableAllRemainingFields = enableAllRemainingFields;
window.populateProjectDropdownFiltered = populateProjectDropdownFiltered;
window.initializeCharts = initializeCharts; // Make it globally accessible

// Theme Toggle Functionality
export function toggleTheme() {
    export const currentTheme = document.documentElement.getAttribute('data-theme');
    export const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    updateThemeButton(newTheme);
}

export function updateThemeButton(theme) {
    export const themeIcon = document.getElementById('theme-icon');
    export const themeText = document.getElementById('theme-text');

    if (theme === 'light') {
        themeIcon.className = 'fas fa-moon';
        themeText.textContent = 'Dark';
    } else {
        themeIcon.className = 'fas fa-sun';
        themeText.textContent = 'Light';
    }
}

export function initializeTheme() {
    export const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();

    // Setup MutationObserver to watch for theme attribute changes (fallback)
    export const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                console.log('Create report: Theme attribute changed, recreating charts...');
                // Trigger chart recreation with same logic as themeChanged event
                setTimeout(() => {
                    // Store current chart data before destroying charts
                    export const chartConfigs = [
                        { chart: userStoriesChart, id: 'userStoriesChart', labels: ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'], colors: ['#28a745', '#ffc107', '#dc3545', '#6c757d', '#fd7e14', '#6f42c1', '#20c997'] },
                        { chart: testCasesChart, id: 'testCasesChart', labels: ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'], colors: ['#28a745', '#ffc107', '#dc3545', '#6c757d', '#fd7e14', '#6f42c1', '#20c997'] },
                        { chart: issuesPriorityChart, id: 'issuesPriorityChart', labels: ['Critical', 'High', 'Medium', 'Low'], colors: ['#dc3545', '#fd7e14', '#ffc107', '#28a745'] },
                        { chart: issuesStatusChart, id: 'issuesStatusChart', labels: ['New', 'Fixed', 'Not Fixed', 'Re-opened', 'Deferred'], colors: ['#17a2b8', '#28a745', '#dc3545', '#fd7e14', '#6f42c1'] },
                        { chart: enhancementsChart, id: 'enhancementsChart', labels: ['New', 'Implemented', 'Exists'], colors: ['#17a2b8', '#28a745', '#6c757d'] }
                    ];

                    // Store data and destroy existing charts
                    export const chartData = {};
                    chartConfigs.forEach(config => {
                        if (config.chart && config.chart.data) {
                            chartData[config.id] = config.chart.data.datasets[0].data;
                        }
                        if (config.chart && config.chart.destroy) {
                            config.chart.destroy();
                        }
                    });

                    // Recreate charts with new theme colors
                    recreateFormCharts(chartConfigs, chartData);
                }, 100);
            }
        });
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
});

// Listen for theme changes and update chart colors
window.addEventListener('themeChanged', (event) => {
    console.log('Theme changed, recreating form charts...');

    // Store current chart data before destroying charts
    export const chartConfigs = [
        { chart: userStoriesChart, id: 'userStoriesChart', labels: ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'], colors: ['#28a745', '#ffc107', '#dc3545', '#6c757d', '#fd7e14', '#6f42c1', '#20c997'] },
        { chart: testCasesChart, id: 'testCasesChart', labels: ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'], colors: ['#28a745', '#ffc107', '#dc3545', '#6c757d', '#fd7e14', '#6f42c1', '#20c997'] },
        { chart: issuesPriorityChart, id: 'issuesPriorityChart', labels: ['Critical', 'High', 'Medium', 'Low'], colors: ['#dc3545', '#fd7e14', '#ffc107', '#28a745'] },
        { chart: issuesStatusChart, id: 'issuesStatusChart', labels: ['New', 'Fixed', 'Not Fixed', 'Re-opened', 'Deferred'], colors: ['#17a2b8', '#28a745', '#dc3545', '#fd7e14', '#6f42c1'] },
        { chart: enhancementsChart, id: 'enhancementsChart', labels: ['New', 'Implemented', 'Exists'], colors: ['#17a2b8', '#28a745', '#6c757d'] }
    ];

    // Store data and destroy existing charts
    export const chartData = {};
    chartConfigs.forEach(config => {
        if (config.chart && config.chart.data) {
            chartData[config.id] = config.chart.data.datasets[0].data;
        }
        if (config.chart && config.chart.destroy) {
            config.chart.destroy();
        }
    });

    // Recreate charts with new theme colors
    setTimeout(() => {
        recreateFormCharts(chartConfigs, chartData);
    }, 100);
});

// Function to recreate form charts with stored data
export function recreateFormCharts(chartConfigs, chartData) {
    export const isLightTheme = window.isCurrentThemeLight ? window.isCurrentThemeLight() : true;
    export const borderColor = isLightTheme ? '#ffffff' : '#1e293b';

    chartConfigs.forEach(config => {
        export const canvas = document.getElementById(config.id);
        if (canvas) {
            export const ctx = canvas.getContext('2d');
            export const data = chartData[config.id] || new Array(config.labels.length).fill(0);

            export const newChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: config.labels,
                    datasets: [{
                        data: data,
                        backgroundColor: config.colors,
                        borderWidth: 3,
                        borderColor: borderColor
                    }]
                },
                options: getChartOptions()
            });

            // Reassign to global variables
            switch (config.id) {
                case 'userStoriesChart':
                    userStoriesChart = newChart;
                    break;
                case 'testCasesChart':
                    testCasesChart = newChart;
                    break;
                case 'issuesPriorityChart':
                    issuesPriorityChart = newChart;
                    break;
                case 'issuesStatusChart':
                    issuesStatusChart = newChart;
                    break;
                case 'enhancementsChart':
                    enhancementsChart = newChart;
                    break;
            }
        }
    });

    console.log('Form charts recreated with new theme colors');
}

// Make theme functions globally accessible
window.toggleTheme = toggleTheme;
window.initializeTheme = initializeTheme;
window.resetFormData = resetFormData; // Make it globally accessible
window.invalidateAllCaches = invalidateAllCaches; // Make cache invalidation globally accessible
window.fetchReport = fetchReport; // Make it globally accessible for editing
window.loadReportForEditing = loadReportForEditing; // Make it globally accessible for editing
window.onProjectSelection = onProjectSelection; // Make project selection handler globally accessible
window.onPortfolioSelection = onPortfolioSelection; // Make portfolio selection handler globally accessible

// Make evaluation functions globally accessible
window.toggleEvaluationCriteria = toggleEvaluationCriteria;
window.calculateFinalScore = calculateFinalScore;
window.updateEvaluationChart = updateEvaluationChart;
window.loadSelectedData = loadSelectedData; // Make data loading function globally accessible
window.editingReportId = editingReportId; // Make global variable accessible
window.allReportsCache = allReportsCache; // Make global variable accessible
window.dashboardStatsCache = dashboardStatsCache; // Make global variable accessible

// --- LocalStorage Functions ---

export function saveFormDataToLocalStorage() {
    try {
        export const form = document.getElementById('qaReportForm');
        if (!form) return;

        export const formData = new FormData(form);
        export const formObject = {};

        // Save form fields
        for (let [key, value] of formData.entries()) {
            formObject[key] = value;
        }

        // Save additional form elements that might not be in FormData
        export const additionalFields = [
            'reportDate', 'portfolioName', 'projectName', 'sprintNumber',
            'reportVersion', 'cycleNumber', 'releaseNumber', 'testSummary',
            'testingStatus', 'testEnvironment'
        ];

        // Evaluation fields
        export const evaluationFields = [
            'involvementScore', 'involvementReason',
            'requirementsQualityScore', 'requirementsQualityReason',
            'qaPlanReviewScore', 'qaPlanReviewReason',
            'uxScore', 'uxReason',
            'cooperationScore', 'cooperationReason',
            'criticalBugsScore', 'criticalBugsReason',
            'highBugsScore', 'highBugsReason',
            'mediumBugsScore', 'mediumBugsReason',
            'lowBugsScore', 'lowBugsReason'
        ];

        additionalFields.forEach(fieldId => {
            export const element = document.getElementById(fieldId);
            if (element) {
                formObject[fieldId] = element.value;
            }
        });

        // Add evaluation fields to form data
        evaluationFields.forEach(fieldId => {
            export const element = document.getElementById(fieldId);
            if (element) {
                formObject[fieldId] = element.value;
            }
        });

        // Save calculated totals
        export const calculatedFields = [
            'totalStories', 'totalTestCases', 'totalIssues', 'totalEnhancements'
        ];

        calculatedFields.forEach(fieldId => {
            export const element = document.getElementById(fieldId);
            if (element) {
                formObject[fieldId] = element.value;
            }
        });

        localStorage.setItem(FORM_DATA_KEY, JSON.stringify(formObject));

        // Save arrays (requests, builds, testers, team members)
        export const arrayData = {
            requestData: requestData,
            buildData: buildData,
            testerData: testerData,
            teamMemberData: teamMemberData
        };

        localStorage.setItem(FORM_ARRAYS_KEY, JSON.stringify(arrayData));

        console.log('Form data saved to localStorage:', Object.keys(formObject).length, 'fields');
    } catch (error) {
        console.error('Error saving form data to localStorage:', error);
    }
}

export function loadFormDataFromLocalStorage() {
    try {
        console.log('Loading form data from localStorage...');
        export const savedFormData = localStorage.getItem(FORM_DATA_KEY);
        export const savedArrayData = localStorage.getItem(FORM_ARRAYS_KEY);

        if (savedFormData) {
            console.log('Found saved form data, loading...');
            export const formObject = JSON.parse(savedFormData);

            // Load form fields
            Object.keys(formObject).forEach(key => {
                export const element = document.getElementById(key);
                if (element) {
                    element.value = formObject[key];
                }
            });
            console.log('Loaded', Object.keys(formObject).length, 'form fields');

            // Trigger calculations after loading data
            setTimeout(() => {
                if (typeof calculatePercentages === 'function') calculatePercentages();
                if (typeof calculateTestCasesPercentages === 'function') calculateTestCasesPercentages();
                if (typeof calculateIssuesPercentages === 'function') calculateIssuesPercentages();
                if (typeof calculateIssuesStatusPercentages === 'function') calculateIssuesStatusPercentages();
                if (typeof calculateEnhancementsPercentages === 'function') calculateEnhancementsPercentages();
                if (typeof calculateAutomationPercentages === 'function') calculateAutomationPercentages();
                if (typeof calculateAutomationStabilityPercentages === 'function') calculateAutomationStabilityPercentages();
                if (typeof updateAutoCalculatedFields === 'function') updateAutoCalculatedFields();
            }, 500);
        } else {
            console.log('No saved form data found in localStorage');
        }

        if (savedArrayData) {
            console.log('Found saved array data, loading...');
            export const arrayObject = JSON.parse(savedArrayData);

            // Load arrays
            if (arrayObject.requestData) {
                requestData = arrayObject.requestData;
                renderRequestList();
            }

            if (arrayObject.buildData) {
                buildData = arrayObject.buildData;
                renderBuildList();
            }

            if (arrayObject.testerData) {
                testerData = arrayObject.testerData;
                renderTesterList();
            }

            if (arrayObject.teamMemberData) {
                teamMemberData = arrayObject.teamMemberData;
                renderTeamMemberList();
            }
        } else {
            console.log('No saved array data found');
        }

        console.log('Form data loaded from localStorage');
    } catch (error) {
        console.error('Error loading form data from localStorage:', error);
    }
}

export function clearFormDataFromLocalStorage() {
    try {
        localStorage.removeItem(FORM_DATA_KEY);
        localStorage.removeItem(FORM_ARRAYS_KEY);
        console.log('Form data cleared from localStorage');
    } catch (error) {
        console.error('Error clearing form data from localStorage:', error);
    }
}

export function autoSaveFormData() {
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }
    autoSaveTimeout = setTimeout(() => {
        console.log('Auto-saving form data...');
        saveFormDataToLocalStorage();
    }, 1000); // Save after 1 second of inactivity
}

// Add event listeners for auto-save
export function setupAutoSave() {
    export const form = document.getElementById('qaReportForm');
    if (form) {
        console.log('Setting up autosave on form');
        form.addEventListener('input', autoSaveFormData);
        form.addEventListener('change', autoSaveFormData);
    } else {
        console.error('qaReportForm not found - autosave not set up');
    }
}

// Clear localStorage when form is submitted
export function clearFormDataOnSubmit() {
    try {
        // Clear form data from localStorage
        clearFormDataFromLocalStorage();

        // Reset form arrays
        requestData = [];
        buildData = [];
        testerData = [];
        teamMemberData = [];
        qaNoteFieldsData = [];
        qaNotesData = [];

        // Reset form fields
        export const form = document.getElementById('qaReportForm');
        if (form) {
            form.reset();
        }

        // Reset charts if they exist
        resetAllCharts();

        // Reset current section to the first one
        currentSection = 0;
        updateNavigationButtons();

        console.log('Form data cleared after successful submission');
    } catch (error) {
        console.error('Error clearing form data after submission:', error);
    }
}

// Override the existing arrays when they're modified
export const originalAddRequest = window.addRequest;
export const originalAddBuild = window.addBuild;
export const originalAddSelectedTester = window.addSelectedTester;
export const originalAddSelectedTeamMember = window.addSelectedTeamMember;

if (typeof originalAddRequest === 'function') {
    window.addRequest = function (...args) {
        export const result = originalAddRequest.apply(this, args);
        autoSaveFormData();
        return result;
    };
}

if (typeof originalAddBuild === 'function') {
    window.addBuild = function (...args) {
        export const result = originalAddBuild.apply(this, args);
        autoSaveFormData();
        return result;
    };
}

if (typeof originalAddSelectedTester === 'function') {
    window.addSelectedTester = function (...args) {
        export const result = originalAddSelectedTester.apply(this, args);
        autoSaveFormData();
        return result;
    };
}

if (typeof originalAddSelectedTeamMember === 'function') {
    window.addSelectedTeamMember = function (...args) {
        export const result = originalAddSelectedTeamMember.apply(this, args);
        autoSaveFormData();
        return result;
    };
}

// Make functions globally accessible

window.setupAutoSave = setupAutoSave;
window.clearFormDataOnSubmit = clearFormDataOnSubmit;