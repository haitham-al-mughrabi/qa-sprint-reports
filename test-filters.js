// Test script to verify all filters are working
// This can be run in the browser console to test filter functionality

function testAllFilters() {
    console.log('🧪 Testing all filter functionality...');
    
    // Test data structure
    const testReports = [
        {
            id: 1,
            title: 'Sprint 1 Report',
            project: 'Project Alpha',
            portfolio: 'Portfolio A',
            testers: ['John Doe', 'Jane Smith'],
            status: 'passed',
            date: '2024-01-15',
            sprint: 1
        },
        {
            id: 2,
            title: 'Sprint 2 Report',
            project: 'Project Beta',
            portfolio: 'Portfolio B',
            testers: ['Bob Wilson'],
            status: 'failed',
            date: '2024-01-20',
            sprint: 2
        },
        {
            id: 3,
            title: 'Sprint 3 Report',
            project: 'Project Alpha',
            portfolio: 'Portfolio A',
            testers: ['Jane Smith'],
            status: 'passed-with-issues',
            date: '2024-01-25',
            sprint: 3
        }
    ];
    
    // Test search filter
    console.log('🔍 Testing search filter...');
    window.currentFilters = { search: 'alpha', project: '', portfolio: '', tester: '', status: '', dateFrom: '', dateTo: '', sprint: '', sort: 'date-desc' };
    let filtered = window.filterReports ? window.filterReports(testReports) : [];
    console.log('Search "alpha" result:', filtered.length === 2 ? '✅ PASS' : '❌ FAIL', filtered);
    
    // Test project filter
    console.log('📁 Testing project filter...');
    window.currentFilters = { search: '', project: 'Project Beta', portfolio: '', tester: '', status: '', dateFrom: '', dateTo: '', sprint: '', sort: 'date-desc' };
    filtered = window.filterReports ? window.filterReports(testReports) : [];
    console.log('Project "Project Beta" result:', filtered.length === 1 ? '✅ PASS' : '❌ FAIL', filtered);
    
    // Test portfolio filter
    console.log('💼 Testing portfolio filter...');
    window.currentFilters = { search: '', project: '', portfolio: 'Portfolio A', tester: '', status: '', dateFrom: '', dateTo: '', sprint: '', sort: 'date-desc' };
    filtered = window.filterReports ? window.filterReports(testReports) : [];
    console.log('Portfolio "Portfolio A" result:', filtered.length === 2 ? '✅ PASS' : '❌ FAIL', filtered);
    
    // Test tester filter
    console.log('👤 Testing tester filter...');
    window.currentFilters = { search: '', project: '', portfolio: '', tester: 'Jane Smith', status: '', dateFrom: '', dateTo: '', sprint: '', sort: 'date-desc' };
    filtered = window.filterReports ? window.filterReports(testReports) : [];
    console.log('Tester "Jane Smith" result:', filtered.length === 2 ? '✅ PASS' : '❌ FAIL', filtered);
    
    // Test status filter
    console.log('🏷️ Testing status filter...');
    window.currentFilters = { search: '', project: '', portfolio: '', tester: '', status: 'failed', dateFrom: '', dateTo: '', sprint: '', sort: 'date-desc' };
    filtered = window.filterReports ? window.filterReports(testReports) : [];
    console.log('Status "failed" result:', filtered.length === 1 ? '✅ PASS' : '❌ FAIL', filtered);
    
    // Test date range filter
    console.log('📅 Testing date range filter...');
    window.currentFilters = { search: '', project: '', portfolio: '', tester: '', status: '', dateFrom: '2024-01-18', dateTo: '2024-01-30', sprint: '', sort: 'date-desc' };
    filtered = window.filterReports ? window.filterReports(testReports) : [];
    console.log('Date range result:', filtered.length === 2 ? '✅ PASS' : '❌ FAIL', filtered);
    
    // Test sprint filter
    console.log('🏃 Testing sprint filter...');
    window.currentFilters = { search: '', project: '', portfolio: '', tester: '', status: '', dateFrom: '', dateTo: '', sprint: '2', sort: 'date-desc' };
    filtered = window.filterReports ? window.filterReports(testReports) : [];
    console.log('Sprint "2" result:', filtered.length === 1 ? '✅ PASS' : '❌ FAIL', filtered);
    
    // Test sorting
    console.log('🔄 Testing sorting...');
    window.currentFilters = { search: '', project: '', portfolio: '', tester: '', status: '', dateFrom: '', dateTo: '', sprint: '', sort: 'title-asc' };
    const sorted = window.sortReports ? window.sortReports(testReports) : [];
    console.log('Title ascending sort result:', sorted[0]?.title === 'Sprint 1 Report' ? '✅ PASS' : '❌ FAIL', sorted.map(r => r.title));
    
    // Test combined filters
    console.log('🔗 Testing combined filters...');
    window.currentFilters = { search: '', project: 'Project Alpha', portfolio: '', tester: 'Jane Smith', status: '', dateFrom: '', dateTo: '', sprint: '', sort: 'date-desc' };
    filtered = window.filterReports ? window.filterReports(testReports) : [];
    console.log('Combined filters result:', filtered.length === 2 ? '✅ PASS' : '❌ FAIL', filtered);
    
    console.log('🎉 Filter testing complete!');
    
    // Reset filters
    window.currentFilters = { search: '', project: '', portfolio: '', tester: '', status: '', dateFrom: '', dateTo: '', sprint: '', sort: 'date-desc' };
}

// Export for browser console use
window.testAllFilters = testAllFilters;

console.log('Filter test script loaded. Run testAllFilters() to test all filters.');