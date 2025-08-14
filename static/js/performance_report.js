// Performance Report JavaScript

// Global variables
let currentSection = 0;
let totalSections = 10;
let reportData = {};
let portfolios = [];
let projects = [];
let testers = [];
let teamMembers = [];
let statusCodesData = [];
let performanceScenariosData = [];
let httpRequestsData = [];
let qaNotesData = [];
let savedReportId = null;

// Auto-save functionality
let autoSaveTimeout = null;
const FORM_DATA_KEY = 'performanceReportFormData';
const FORM_ARRAYS_KEY = 'performanceReportArrayData';

// Check if Font Awesome is loaded and force reload if needed
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        // Check if Font Awesome icons are loaded by testing a known icon
        const testIcon = document.createElement('i');
        testIcon.className = 'fas fa-info-circle';
        testIcon.style.position = 'absolute';
        testIcon.style.left = '-9999px';
        document.body.appendChild(testIcon);
        
        const computedStyle = window.getComputedStyle(testIcon, ':before');
        const content = computedStyle.getPropertyValue('content');
        
        // If Font Awesome isn't loaded, the content will be 'none' or empty
        if (!content || content === 'none' || content === '""') {
            console.warn('Font Awesome icons not loaded, attempting to reload...');
            
            // Try to reload Font Awesome
            const faLink = document.createElement('link');
            faLink.rel = 'stylesheet';
            faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            faLink.crossOrigin = 'anonymous';
            document.head.appendChild(faLink);
        }
        
        document.body.removeChild(testIcon);
    }, 1000);
});



// Data migration function to handle old QA notes structure
function migrateQANotesData(qaData) {
    if (!Array.isArray(qaData)) return [];
    
    return qaData.map(item => {
        // If it has the old structure (title + content), convert to new structure (note)
        if (item.title && item.content) {
            return { note: `${item.title}: ${item.content}` };
        }
        // If it has title but no content, use title as note
        else if (item.title && !item.content) {
            return { note: item.title };
        }
        // If it has content but no title, use content as note
        else if (item.content && !item.title) {
            return { note: item.content };
        }
        // If it already has the new structure, keep it
        else if (item.note) {
            return item;
        }
        // Fallback for any other structure
        else {
            return { note: JSON.stringify(item) };
        }
    });
}

// Initialize the form when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme first
    if (window.themeManager) {
        window.themeManager.init();
    }
    
    initializeForm();
    loadPortfolios();
    loadTesters();
    loadTeamMembers();
    
    // Use shared navigation system instead of custom functions
    // The report_type_navigation.js will handle progress and navigation
    
    // Set default date to today
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB').replace(/\//g, '-');
    document.getElementById('reportDate').value = formattedDate;
    
    // Hide loading overlay initially
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
    
    // Ensure currentSection is set for the navigation system
    window.currentSection = window.currentSection || 0;
    currentSection = window.currentSection;
    
    // Setup auto-save functionality
    setupAutoSave();
    
    // Load form data from localStorage if available
    loadFormDataFromLocalStorage();
    
    
});

// Initialize form
function initializeForm() {
    // Set report type
    document.getElementById('reportType').value = 'Performance';
    
    // Initialize project select as disabled until portfolio is selected
    const projectSelect = document.getElementById('projectName');
    if (projectSelect) {
        projectSelect.disabled = true;
    }
    
    // Initialize empty states
    updateTesterList();
    updateTeamMemberList();
    renderQANotesList();
}

// Load portfolios from API
async function loadPortfolios() {
    try {
        const response = await fetch('/api/portfolios');
        if (response.ok) {
            portfolios = await response.json();
            const portfolioSelect = document.getElementById('portfolioName');
            portfolioSelect.innerHTML = '<option value="">Select Portfolio</option>';
            portfolios.forEach(portfolio => {
                const option = document.createElement('option');
                option.value = portfolio.name;
                option.textContent = portfolio.name;
                option.dataset.id = portfolio.id; // Add the ID for API calls
                portfolioSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading portfolios:', error);
        showToast('Error loading portfolios', 'error');
    }
}

// Load projects based on selected portfolio
async function onPortfolioSelection() {
    const portfolioSelect = document.getElementById('portfolioName');
    const projectSelect = document.getElementById('projectName');
    
    if (!portfolioSelect.value) {
        projectSelect.innerHTML = '<option value="">Select Project</option>';
        projectSelect.disabled = true;
        return;
    }
    
    // Get the portfolio ID from the selected option's dataset
    const selectedOption = portfolioSelect.options[portfolioSelect.selectedIndex];
    const portfolioId = selectedOption ? selectedOption.dataset.id : null;
    
    if (!portfolioId) {
        showToast('Portfolio ID not found. Please refresh and try again.', 'error');
        return;
    }
    
    projectSelect.disabled = false;
    projectSelect.innerHTML = '<option value="">Loading projects...</option>';

    try {
        const response = await fetch(`/api/projects/by-portfolio/${portfolioId}`);
        if (response.ok) {
            projects = await response.json();
            projectSelect.innerHTML = '<option value="">Select Project</option>';
            
            if (projects.length === 0) {
                projectSelect.innerHTML = '<option value="">No projects available</option>';
                projectSelect.disabled = true;
                showToast('No projects found for this portfolio', 'warning');
                return;
            }
            
            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.name;
                option.textContent = project.name;
                option.dataset.id = project.id; // Add project ID for future use
                projectSelect.appendChild(option);
            });
            
            showToast(`Loaded ${projects.length} projects`, 'success', 2000);
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        projectSelect.innerHTML = '<option value="">Error loading projects</option>';
        projectSelect.disabled = true;
        showToast('Error loading projects. Please try again.', 'error');
    }
}

// Handle project selection
async function onProjectSelection() {
    const portfolioName = document.getElementById('portfolioName').value;
    const projectName = document.getElementById('projectName').value;
    
    if (!portfolioName || !projectName) return;

    try {
        const response = await fetch(`/api/projects/${portfolioName}/${projectName}/latest-data`);
        if (response.ok) {
            const data = await response.json();
            if (data.hasData) {
                // Auto-populate with suggested values
                if (data.suggestedValues) {
                    // Use latest data for testers and team members
                    if (data.latestData.testerData) {
                        testers = data.latestData.testerData;
                        updateTesterList();
                    }
                    if (data.latestData.teamMembers) {
                        teamMembers = data.latestData.teamMembers;
                        updateTeamMemberList();
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading project data:', error);
    }
}

// Load testers from API
async function loadTesters() {
    try {
        const response = await fetch('/api/testers');
        if (response.ok) {
            const allTesters = await response.json();
            const testerSelect = document.getElementById('testerSelect');
            testerSelect.innerHTML = '<option value="">Select a tester</option>';
            allTesters.forEach(tester => {
                const option = document.createElement('option');
                option.value = JSON.stringify(tester);
                option.textContent = `${tester.name} (${tester.email})`;
                testerSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading testers:', error);
    }
}

// Load team members from API
async function loadTeamMembers() {
    try {
        const response = await fetch('/api/team-members');
        if (response.ok) {
            const allTeamMembers = await response.json();
            const teamMemberSelect = document.getElementById('teamMemberSelect');
            teamMemberSelect.innerHTML = '<option value="">Select a team member</option>';
            allTeamMembers.forEach(member => {
                const option = document.createElement('option');
                option.value = JSON.stringify(member);
                option.textContent = `${member.name} (${member.email})`;
                teamMemberSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading team members:', error);
    }
}

// Section navigation functions - use shared navigation system
function showSection(sectionIndex) {
    // Use the shared navigation system instead
    if (window.showSectionForReportType) {
        window.showSectionForReportType(sectionIndex);
    } else {
        // Fallback for backwards compatibility
        if (sectionIndex < 0 || sectionIndex >= totalSections) return;
        
        // Hide current section
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        document.getElementById(`section-${sectionIndex}`).classList.add('active');
        
        // Update sidebar navigation
        document.querySelectorAll('.nav-item').forEach((item, index) => {
            item.classList.toggle('active', index === sectionIndex);
        });
        
        currentSection = sectionIndex;
        window.currentSection = sectionIndex;
        updateProgress();
        updateNavigationButtons();
    }
}

// Navigation validation - enhance the shared navigation with validation
function nextSection() {
    return nextSectionForReportType();
}

function previousSection() {
    return previousSectionForReportType();
}

// Override the shared nextSection to add validation - with delay to ensure navigation is loaded
setTimeout(function() {
    if (window.nextSectionForReportType) {
        const originalNext = window.nextSectionForReportType;
        window.nextSectionForReportType = function() {
            const currentSectionIndex = window.currentSection || 0;
            
            // Validate current section before proceeding
            if (currentSectionIndex === 0) { // General Details section
                const portfolioName = document.getElementById('portfolioName').value;
                const projectName = document.getElementById('projectName').value;
                const testEnvironment = document.getElementById('testEnvironment').value;
                
                if (!portfolioName || !projectName || !testEnvironment) {
                    showToast('Please complete all required fields before proceeding', 'warning');
                    
                    // Highlight missing fields
                    if (!portfolioName) validateField('portfolioName', '');
                    if (!projectName) validateField('projectName', '');
                    if (!testEnvironment) validateField('testEnvironment', '');
                    
                    return;
                }
            }
            
            // Call the original function if validation passes
            originalNext();
        };
    }
}, 500);

// Progress and navigation functions are now handled by the shared system
// These are kept for backwards compatibility but delegate to shared functions
function initializeProgressSteps() {
    if (window.initializeProgressStepsForReportType) {
        window.initializeProgressStepsForReportType();
    }
}

function updateProgress() {
    if (window.updateProgressBarForReportType) {
        window.updateProgressBarForReportType();
    }
}

function updateNavigationButtons() {
    if (window.updateNavigationButtonsForReportType) {
        window.updateNavigationButtonsForReportType();
    }
}

// Sidebar toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

// Update report title
function updateReportTitle() {
    const reportName = document.getElementById('reportName').value;
    const formTitle = document.getElementById('formTitle');
    
    if (reportName.trim()) {
        formTitle.textContent = `Create Performance Report: ${reportName}`;
    } else {
        formTitle.textContent = 'Create Performance Report';
    }
}

// Tester management functions
function showTesterModal() {
    document.getElementById('testerModal').style.display = 'block';
    clearTesterForm();
}

function closeTesterModal() {
    document.getElementById('testerModal').style.display = 'none';
    clearTesterForm();
}

function clearTesterForm() {
    document.getElementById('testerSelect').value = '';
    document.getElementById('testerName').value = '';
    document.getElementById('testerEmail').value = '';
}

function updateTesterForm() {
    const testerSelect = document.getElementById('testerSelect');
    const selectedValue = testerSelect.value;
    
    if (selectedValue) {
        const tester = JSON.parse(selectedValue);
        document.getElementById('testerName').value = tester.name || '';
        document.getElementById('testerEmail').value = tester.email || '';
    } else {
        clearTesterForm();
    }
}

function addTester() {
    const name = document.getElementById('testerName').value.trim();
    const email = document.getElementById('testerEmail').value.trim();
    
    if (!name || !email) {
        alert('Please fill in all tester fields');
        return;
    }
    
    // Check if tester already exists
    const exists = testers.some(t => t.email === email);
    if (exists) {
        alert('This tester is already added');
        return;
    }
    
    testers.push({ name, email });
    updateTesterList();
    closeTesterModal();
}

function removeTester(index) {
    testers.splice(index, 1);
    updateTesterList();
}

function updateTesterList() {
    const container = document.getElementById('testerList');
    
    if (testers.length === 0) {
        container.innerHTML = '<div class="empty-state">No testers added yet. Click "Add/Select Tester" to get started.</div>';
        return;
    }
    
    container.innerHTML = testers.map((tester, index) => `
        <div class="dynamic-item">
            <div class="item-content">
                <div class="item-header">
                    <strong>${tester.name}</strong>
                    <button type="button" class="remove-btn" onclick="removeTester(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="item-details">
                    <span><i class="fas fa-envelope"></i> ${tester.email}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Team member management functions
function showTeamMemberModal() {
    document.getElementById('teamMemberModal').style.display = 'block';
    clearTeamMemberForm();
}

function closeTeamMemberModal() {
    document.getElementById('teamMemberModal').style.display = 'none';
    clearTeamMemberForm();
}

function clearTeamMemberForm() {
    document.getElementById('teamMemberSelect').value = '';
    document.getElementById('teamMemberName').value = '';
    document.getElementById('teamMemberEmail').value = '';
    document.getElementById('teamMemberRole').value = '';
}

function updateTeamMemberForm() {
    const teamMemberSelect = document.getElementById('teamMemberSelect');
    const selectedValue = teamMemberSelect.value;
    
    if (selectedValue) {
        const member = JSON.parse(selectedValue);
        document.getElementById('teamMemberName').value = member.name || '';
        document.getElementById('teamMemberEmail').value = member.email || '';
        document.getElementById('teamMemberRole').value = member.role || '';
    } else {
        clearTeamMemberForm();
    }
}

function addTeamMember() {
    const name = document.getElementById('teamMemberName').value.trim();
    const email = document.getElementById('teamMemberEmail').value.trim();
    const role = document.getElementById('teamMemberRole').value.trim();
    
    if (!name || !email || !role) {
        alert('Please fill in all team member fields');
        return;
    }
    
    // Check if team member already exists
    const exists = teamMembers.some(m => m.email === email);
    if (exists) {
        alert('This team member is already added');
        return;
    }
    
    teamMembers.push({ name, email, role });
    updateTeamMemberList();
    closeTeamMemberModal();
}

function removeTeamMember(index) {
    teamMembers.splice(index, 1);
    updateTeamMemberList();
}

function updateTeamMemberList() {
    const container = document.getElementById('teamMemberList');
    
    if (teamMembers.length === 0) {
        container.innerHTML = '<div class="empty-state">No team members added yet.</div>';
        return;
    }
    
    container.innerHTML = teamMembers.map((member, index) => `
        <div class="dynamic-item">
            <div class="item-content">
                <div class="item-header">
                    <strong>${member.name}</strong>
                    <button type="button" class="remove-btn" onclick="removeTeamMember(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="item-details">
                    <span><i class="fas fa-envelope"></i> ${member.email}</span>
                    <span><i class="fas fa-user-tag"></i> ${member.role}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Calculate failure rate
function calculateFailureRate() {
    const totalRequests = parseInt(document.getElementById('totalRequests').value) || 0;
    const failedRequests = parseInt(document.getElementById('failedRequests').value) || 0;
    
    let failureRate = 0;
    if (totalRequests > 0) {
        failureRate = ((failedRequests / totalRequests) * 100).toFixed(2);
    }
    
    document.getElementById('failureRate').value = `${failureRate}%`;
}

// Status codes management
function addStatusCode() {
    const container = document.getElementById('statusCodesContainer');
    
    // Remove empty state if it exists
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    const statusCodeItem = document.createElement('div');
    statusCodeItem.className = 'status-code-item';
    statusCodeItem.innerHTML = `
        <input type="text" placeholder="Status Code (e.g., 200)" class="status-code-input">
        <input type="number" placeholder="Count" min="0" class="status-count-input">
        <select class="status-category-select" onchange="updateStatusColor(this)">
            <option value="">Select Category</option>
            <option value="2xx">2xx - Success</option>
            <option value="3xx">3xx - Redirection</option>
            <option value="4xx">4xx - Client Error</option>
            <option value="5xx">5xx - Server Error</option>
            <option value="0">0 - Connection Error</option>
        </select>
        <div class="status-code-color"></div>
        <button type="button" class="status-code-remove" onclick="removeStatusCode(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(statusCodeItem);
}

function removeStatusCode(button) {
    const container = document.getElementById('statusCodesContainer');
    button.parentElement.remove();
    
    // Add empty state if no items left
    if (container.children.length === 0) {
        container.innerHTML = '<div class="empty-state">No status codes added yet.</div>';
    }
}

function updateStatusColor(select) {
    const colorDiv = select.parentElement.querySelector('.status-code-color');
    const category = select.value;
    
    const colors = {
        '2xx': '#28a745',
        '3xx': '#ffc107',
        '4xx': '#fd7e14',
        '5xx': '#dc3545',
        '0': '#6c757d'
    };
    
    colorDiv.style.backgroundColor = colors[category] || '#f8f9fa';
}

// Performance scenarios management
function addPerformanceScenario() {
    const container = document.getElementById('performanceScenariosContainer');
    
    // Remove empty state if it exists
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    const scenarioIndex = performanceScenariosData.length;
    const scenarioItem = document.createElement('div');
    scenarioItem.className = 'performance-scenario-item';
    scenarioItem.innerHTML = `
        <button type="button" class="remove-btn" onclick="removePerformanceScenario(${scenarioIndex})">
            <i class="fas fa-times"></i>
        </button>
        <div class="scenario-header">
            <div class="form-group">
                <label>Scenario Title</label>
                <input type="text" placeholder="e.g., Login Load Test" class="scenario-title-input">
            </div>
            <div class="form-group">
                <label>Users</label>
                <input type="number" placeholder="100" min="1" class="scenario-users-input">
            </div>
        </div>
        <div class="scenario-steps">
            <label>Steps</label>
            <textarea placeholder="Describe the test scenario steps..." rows="4" class="scenario-steps-input"></textarea>
        </div>
    `;
    
    container.appendChild(scenarioItem);
    performanceScenariosData.push({});
}

function removePerformanceScenario(index) {
    const container = document.getElementById('performanceScenariosContainer');
    const items = container.querySelectorAll('.performance-scenario-item');
    
    if (items[index]) {
        items[index].remove();
        performanceScenariosData.splice(index, 1);
        
        // Re-index remaining items
        updatePerformanceScenariosList();
    }
    
    // Add empty state if no items left
    if (container.children.length === 0) {
        container.innerHTML = '<div class="empty-state">No performance scenarios added yet. Click "Add Scenario" to get started.</div>';
    }
}

function updatePerformanceScenariosList() {
    // This function would re-render the scenarios with correct indices
    // For now, we'll keep it simple and let the user manage manually
}

// HTTP requests management
function addHttpRequest() {
    const tableBody = document.getElementById('httpRequestsTableBody');
    
    // Remove empty state if it exists
    const emptyState = tableBody.querySelector('.empty-state');
    if (emptyState) {
        emptyState.parentElement.remove();
    }
    
    // Add to data array
    const requestIndex = httpRequestsData.length;
    httpRequestsData.push({
        endpoint: '',
        status: '',
        count: 0,
        avgTime: ''
    });
    
    const row = document.createElement('tr');
    row.className = 'http-request-row';
    row.dataset.index = requestIndex;
    row.innerHTML = `
        <td><input type="text" placeholder="e.g., /api/login" class="request-endpoint-input" onchange="updateHttpRequestData(${requestIndex}, 'endpoint', this.value)"></td>
        <td>
            <select class="request-status-select" onchange="updateHttpRequestData(${requestIndex}, 'status', this.value); updateRequestStatusColor(this)">
                <option value="">Select Status</option>
                <!-- 2xx Success -->
                <option value="200">200 - OK</option>
                <option value="201">201 - Created</option>
                <option value="202">202 - Accepted</option>
                <option value="204">204 - No Content</option>
                <!-- 3xx Redirection -->
                <option value="301">301 - Moved Permanently</option>
                <option value="302">302 - Found</option>
                <option value="304">304 - Not Modified</option>
                <option value="307">307 - Temporary Redirect</option>
                <option value="308">308 - Permanent Redirect</option>
                <!-- 4xx Client Error -->
                <option value="400">400 - Bad Request</option>
                <option value="401">401 - Unauthorized</option>
                <option value="403">403 - Forbidden</option>
                <option value="404">404 - Not Found</option>
                <option value="405">405 - Method Not Allowed</option>
                <option value="408">408 - Request Timeout</option>
                <option value="409">409 - Conflict</option>
                <option value="410">410 - Gone</option>
                <option value="413">413 - Payload Too Large</option>
                <option value="414">414 - URI Too Long</option>
                <option value="415">415 - Unsupported Media Type</option>
                <option value="422">422 - Unprocessable Entity</option>
                <option value="429">429 - Too Many Requests</option>
                <!-- 5xx Server Error -->
                <option value="500">500 - Internal Server Error</option>
                <option value="501">501 - Not Implemented</option>
                <option value="502">502 - Bad Gateway</option>
                <option value="503">503 - Service Unavailable</option>
                <option value="504">504 - Gateway Timeout</option>
                <option value="505">505 - HTTP Version Not Supported</option>
                <option value="507">507 - Insufficient Storage</option>
                <option value="508">508 - Loop Detected</option>
                <option value="510">510 - Not Extended</option>
                <option value="511">511 - Network Authentication Required</option>
                <!-- Cloudflare/CDN Specific -->
                <option value="520">520 - Web Server Returned Unknown Error</option>
                <option value="521">521 - Web Server Is Down</option>
                <option value="522">522 - Connection Timed Out</option>
                <option value="523">523 - Origin Is Unreachable</option>
                <option value="524">524 - A Timeout Occurred</option>
                <option value="525">525 - SSL Handshake Failed</option>
                <option value="526">526 - Invalid SSL Certificate</option>
                <option value="527">527 - Railgun Error</option>
                <option value="529">529 - Site Is Overloaded</option>
                <option value="530">530 - Site Is Frozen</option>
                <!-- Connection Errors -->
                <option value="0">0 - Connection Error</option>
            </select>
        </td>
        <td><input type="number" placeholder="1000" min="0" class="request-count-input" onchange="updateHttpRequestData(${requestIndex}, 'count', parseInt(this.value) || 0)"></td>
        <td><input type="text" placeholder="250ms" class="request-avgtime-input" onchange="updateHttpRequestData(${requestIndex}, 'avgTime', this.value)"></td>
        <td>
            <button type="button" class="table-action-btn" onclick="removeHttpRequest(this, ${requestIndex})">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    tableBody.appendChild(row);
}

function updateHttpRequestData(index, field, value) {
    if (httpRequestsData[index]) {
        httpRequestsData[index][field] = value;
    }
}

function removeHttpRequest(button, index) {
    const tableBody = document.getElementById('httpRequestsTableBody');
    button.closest('tr').remove();
    
    // Remove from data array
    httpRequestsData.splice(index, 1);
    
    // Re-render the table to fix indices
    updateHttpRequestsTable();
    
    // Add empty state if no rows left
    if (tableBody.children.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="5" class="empty-state">No HTTP requests added yet. Click "Add Request" to get started.</td>';
        tableBody.appendChild(emptyRow);
    }
}

function updateHttpRequestsTable() {
    const tableBody = document.getElementById('httpRequestsTableBody');
    tableBody.innerHTML = '';
    
    if (httpRequestsData.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="5" class="empty-state">No HTTP requests added yet. Click "Add Request" to get started.</td>';
        tableBody.appendChild(emptyRow);
        return;
    }
    
    httpRequestsData.forEach((request, index) => {
        const row = document.createElement('tr');
        row.className = 'http-request-row';
        row.dataset.index = index;
        row.innerHTML = `
            <td><input type="text" placeholder="e.g., /api/login" class="request-endpoint-input" value="${request.endpoint || ''}" onchange="updateHttpRequestData(${index}, 'endpoint', this.value)"></td>
            <td>
                <select class="request-status-select" onchange="updateHttpRequestData(${index}, 'status', this.value); updateRequestStatusColor(this)">
                    <option value="">Select Status</option>
                    <option value="200" ${request.status === '200' ? 'selected' : ''}>200 - OK</option>
                    <option value="201" ${request.status === '201' ? 'selected' : ''}>201 - Created</option>
                    <option value="202" ${request.status === '202' ? 'selected' : ''}>202 - Accepted</option>
                    <option value="204" ${request.status === '204' ? 'selected' : ''}>204 - No Content</option>
                    <option value="301" ${request.status === '301' ? 'selected' : ''}>301 - Moved Permanently</option>
                    <option value="302" ${request.status === '302' ? 'selected' : ''}>302 - Found</option>
                    <option value="304" ${request.status === '304' ? 'selected' : ''}>304 - Not Modified</option>
                    <option value="307" ${request.status === '307' ? 'selected' : ''}>307 - Temporary Redirect</option>
                    <option value="308" ${request.status === '308' ? 'selected' : ''}>308 - Permanent Redirect</option>
                    <option value="400" ${request.status === '400' ? 'selected' : ''}>400 - Bad Request</option>
                    <option value="401" ${request.status === '401' ? 'selected' : ''}>401 - Unauthorized</option>
                    <option value="403" ${request.status === '403' ? 'selected' : ''}>403 - Forbidden</option>
                    <option value="404" ${request.status === '404' ? 'selected' : ''}>404 - Not Found</option>
                    <option value="405" ${request.status === '405' ? 'selected' : ''}>405 - Method Not Allowed</option>
                    <option value="408" ${request.status === '408' ? 'selected' : ''}>408 - Request Timeout</option>
                    <option value="409" ${request.status === '409' ? 'selected' : ''}>409 - Conflict</option>
                    <option value="410" ${request.status === '410' ? 'selected' : ''}>410 - Gone</option>
                    <option value="413" ${request.status === '413' ? 'selected' : ''}>413 - Payload Too Large</option>
                    <option value="414" ${request.status === '414' ? 'selected' : ''}>414 - URI Too Long</option>
                    <option value="415" ${request.status === '415' ? 'selected' : ''}>415 - Unsupported Media Type</option>
                    <option value="422" ${request.status === '422' ? 'selected' : ''}>422 - Unprocessable Entity</option>
                    <option value="429" ${request.status === '429' ? 'selected' : ''}>429 - Too Many Requests</option>
                    <option value="500" ${request.status === '500' ? 'selected' : ''}>500 - Internal Server Error</option>
                    <option value="501" ${request.status === '501' ? 'selected' : ''}>501 - Not Implemented</option>
                    <option value="502" ${request.status === '502' ? 'selected' : ''}>502 - Bad Gateway</option>
                    <option value="503" ${request.status === '503' ? 'selected' : ''}>503 - Service Unavailable</option>
                    <option value="504" ${request.status === '504' ? 'selected' : ''}>504 - Gateway Timeout</option>
                    <option value="505" ${request.status === '505' ? 'selected' : ''}>505 - HTTP Version Not Supported</option>
                    <option value="507" ${request.status === '507' ? 'selected' : ''}>507 - Insufficient Storage</option>
                    <option value="508" ${request.status === '508' ? 'selected' : ''}>508 - Loop Detected</option>
                    <option value="510" ${request.status === '510' ? 'selected' : ''}>510 - Not Extended</option>
                    <option value="511" ${request.status === '511' ? 'selected' : ''}>511 - Network Authentication Required</option>
                    <option value="520" ${request.status === '520' ? 'selected' : ''}>520 - Web Server Returned Unknown Error</option>
                    <option value="521" ${request.status === '521' ? 'selected' : ''}>521 - Web Server Is Down</option>
                    <option value="522" ${request.status === '522' ? 'selected' : ''}>522 - Connection Timed Out</option>
                    <option value="523" ${request.status === '523' ? 'selected' : ''}>523 - Origin Is Unreachable</option>
                    <option value="524" ${request.status === '524' ? 'selected' : ''}>524 - A Timeout Occurred</option>
                    <option value="525" ${request.status === '525' ? 'selected' : ''}>525 - SSL Handshake Failed</option>
                    <option value="526" ${request.status === '526' ? 'selected' : ''}>526 - Invalid SSL Certificate</option>
                    <option value="527" ${request.status === '527' ? 'selected' : ''}>527 - Railgun Error</option>
                    <option value="529" ${request.status === '529' ? 'selected' : ''}>529 - Site Is Overloaded</option>
                    <option value="530" ${request.status === '530' ? 'selected' : ''}>530 - Site Is Frozen</option>
                    <option value="0" ${request.status === '0' ? 'selected' : ''}>0 - Connection Error</option>
                </select>
            </td>
            <td><input type="number" placeholder="1000" min="0" class="request-count-input" value="${request.count || ''}" onchange="updateHttpRequestData(${index}, 'count', parseInt(this.value) || 0)"></td>
            <td><input type="text" placeholder="250ms" class="request-avgtime-input" value="${request.avgTime || ''}" onchange="updateHttpRequestData(${index}, 'avgTime', this.value)"></td>
            <td>
                <button type="button" class="table-action-btn" onclick="removeHttpRequest(this, ${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
        
        // Apply status color
        const select = row.querySelector('.request-status-select');
        updateRequestStatusColor(select);
    });
}

function updateRequestStatusColor(select) {
    const status = select.value;
    const statusCategory = getStatusCategory(status);
    
    select.className = `request-status-select status-${statusCategory}`;
}

function getStatusCategory(status) {
    const code = parseInt(status);
    if (code >= 200 && code < 300) return '2xx';
    if (code >= 300 && code < 400) return '3xx';
    if (code >= 400 && code < 500) return '4xx';
    if (code >= 500 && code < 600) return '5xx';
    // Handle Cloudflare/CDN specific codes (520-530 range)
    if (code >= 520 && code <= 530) return '5xx';
    if (code === 0) return '0';
    return '';
}

// QA Notes management (using sprint report structure)
function showAddQANoteModal() {
    document.getElementById('addQANoteModal').style.display = 'block';
    document.getElementById('newQANoteText').value = '';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function addQANote() {
    const noteText = document.getElementById('newQANoteText').value.trim();
    if (noteText) {
        qaNotesData.push({ note: noteText });
        renderQANotesList();
        closeModal('addQANoteModal');
        showToast('QA Note added successfully', 'success');
    } else {
        alert('Please enter a note');
    }
}

function removeQANote(index) {
    qaNotesData.splice(index, 1);
    renderQANotesList();
    showToast('QA Note removed', 'info');
}

function renderQANotesList() {
    const container = document.getElementById('qaNotesList');
    if (!container) return;

    if (qaNotesData.length === 0) {
        container.innerHTML = '<div class="empty-state">No QA notes added yet. Click "Add Note" to get started.</div>';
    } else {
        container.innerHTML = qaNotesData.map((item, index) => `
            <div class="dynamic-item">
                <div>${item.note}</div>
                <button type="button" class="remove-btn" onclick="removeQANote(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
}

// Alias for backward compatibility
function updateQANotesList() {
    renderQANotesList();
}

// Form submission
async function submitForm() {
    try {        
        // Collect all form data first
        const formData = collectFormData();
        
        // Check if form data collection failed
        if (!formData) {
            console.error('Form data collection failed');
            return;
        }
        
        // Validate required fields
        if (!validateFormData(formData)) {
            return;
        }
        
        // Only show loading overlay after validation passes
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        // Submit to API
        
        const response = await fetch('/api/reports', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            console.error('❌ Failed to parse JSON response:', jsonError);
            const textResponse = await response.text();
            throw new Error(`Server returned invalid JSON. Status: ${response.status}, Response: ${textResponse}`);
        }
        
        if (response.ok && result.success) {            
            savedReportId = result.report.id;
            const loadingOverlay = document.getElementById('loadingOverlay');
            const successMessage = document.getElementById('successMessage');
            
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            if (successMessage) {
                successMessage.style.display = 'flex';
            }
            
            // Clear form data from localStorage after successful save
            clearFormDataFromLocalStorage();
            
            showToast('Report saved successfully!', 'success');
            
            // Redirect to reports page after 3 seconds
            setTimeout(() => {
                window.location.href = '/reports';
            }, 3000);
            
        } else {
            console.error('❌ API returned error:', result);
            
            // Handle specific error cases
            if (response.status === 401) {
                throw new Error('Authentication required. Please log in again.');
            } else if (response.status === 403) {
                throw new Error('Access denied. You may not have permission to create reports.');
            } else if (response.status === 422) {
                throw new Error('Invalid data format. Please check your form data.');
            } else {
                throw new Error(result.message || `Server error (${response.status}): Failed to save report`);
            }
        }
        
    } catch (error) {
        console.error('Error submitting form:', error);
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        showToast('Error saving report: ' + error.message, 'error');
    }
}

function collectFormData() {
    
    // Check if required DOM elements exist
    const requiredElements = ['reportName', 'portfolioName', 'projectName', 'testEnvironment', 'reportDate'];
    const missingElements = [];
    
    requiredElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (!element) {
            missingElements.push(elementId);
        }
    });
    
    if (missingElements.length > 0) {
        console.error('Missing DOM elements:', missingElements);
        showToast('Form elements are missing. Please refresh the page.', 'error');
        return null;
    }
    
    // Use the global data arrays that are managed by the modal system
    const statusCodes = statusCodesData.map(item => ({
        code: item.statusCode,
        count: item.count,
        status_text: item.statusText
    }));
    
    // Collect performance scenarios from global data
    const performanceScenarios = performanceScenariosData.map(item => ({
        name: item.name,
        description: item.description,
        users: item.users,
        duration: item.duration,
        result: item.result
    }));
    
    // Collect HTTP requests from global data array
    const httpRequests = httpRequestsData.map(item => ({
        endpoint: item.endpoint,
        status: item.status,
        count: item.count,
        avgTime: item.avgTime
    }));
    
    const formData = {
        // Basic information
        reportName: document.getElementById('reportName')?.value || '',
        portfolioName: document.getElementById('portfolioName')?.value || '',
        projectName: document.getElementById('projectName')?.value || '',
        testEnvironment: document.getElementById('testEnvironment')?.value || '',
        reportVersion: document.getElementById('reportVersion')?.value || '',
        reportDate: document.getElementById('reportDate')?.value || '',
        reportType: 'performance',
        
        // Required fields for database (with defaults for performance reports)
        sprintNumber: 1, // Performance reports don't have sprints, use default
        cycleNumber: 1,  // Performance reports don't have cycles, use default
        
        // Test objective & scope
        testObjective: document.getElementById('testObjective')?.value || '',
        testScope: document.getElementById('testScope')?.value || '',
        
        // Test details
        testingStatus: document.getElementById('testingStatus')?.value || '',
        numberOfUsers: parseInt(document.getElementById('numberOfUsers')?.value) || 0,
        executionDuration: document.getElementById('executionDuration')?.value || '',
        
        // Test summary
        userLoad: document.getElementById('userLoad')?.value || '',
        responseTime: document.getElementById('responseTime')?.value || '',
        requestVolume: document.getElementById('requestVolume')?.value || '',
        errorRate: document.getElementById('errorRate')?.value || '',
        slowest: document.getElementById('slowest')?.value || '',
        fastest: document.getElementById('fastest')?.value || '',
        
        // Test criteria
        totalRequests: parseInt(document.getElementById('totalRequests')?.value) || 0,
        failedRequests: parseInt(document.getElementById('failedRequests')?.value) || 0,
        averageResponse: document.getElementById('averageResponse')?.value || '',
        averageResponseUnit: document.getElementById('averageResponseUnit')?.value || '',
        maxResponse: document.getElementById('maxResponse')?.value || '',
        maxResponseUnit: document.getElementById('maxResponseUnit')?.value || '',
        
        // Dynamic data
        testerData: testers,
        teamMemberData: teamMembers, // Keep this for consistency with backend
        statusCodes: statusCodes,
        performanceScenarios: performanceScenarios,
        httpRequestsData: httpRequests,
        qaNotesData: qaNotesData
    };
    return formData;
}

function validateFormData(data) {
    const requiredFields = [
        { field: 'portfolioName', name: 'Portfolio Name' },
        { field: 'projectName', name: 'Project Name' },
        { field: 'reportDate', name: 'Report Date' },
        { field: 'testEnvironment', name: 'Test Environment' }
    ];
    
    const missingFields = [];
    
    for (const { field, name } of requiredFields) {
        const value = data[field];
        const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
        
        if (isEmpty) {
            missingFields.push(name);
        }
    }
    
    
    if (missingFields.length > 0) {
        const errorMsg = `Please fill in the following required fields: ${missingFields.join(', ')}`;
        showToast(errorMsg, 'error');
        
        // Focus on first missing field
        const firstMissingFieldId = requiredFields.find(rf => missingFields.includes(rf.name))?.field;
        if (firstMissingFieldId) {
            const element = document.getElementById(firstMissingFieldId);
            if (element) {
                element.focus();
                element.style.borderColor = 'var(--danger)';
                setTimeout(() => {
                    element.style.borderColor = '';
                }, 3000);
            }
        }
        
        return false;
    }
    
    return true;
}

// Success actions
function viewReport() {
    if (savedReportId) {
        window.location.href = `/report/${savedReportId}`;
    }
}

function createNewReport() {
    window.location.reload();
}

// Clear functions for navigation buttons
function clearCurrentSection() {
    const currentSectionIndex = window.currentSection || 0;
    const sectionElement = document.getElementById(`section-${currentSectionIndex}`);
    
    if (sectionElement) {
        // Clear all inputs, selects, and textareas in the current section
        const formElements = sectionElement.querySelectorAll('input, select, textarea');
        formElements.forEach(element => {
            if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = false;
            } else {
                element.value = '';
            }
            // Remove validation classes
            element.classList.remove('is-valid', 'is-invalid');
        });
        
        // Clear any dynamic lists in the current section
        if (currentSectionIndex === 2) { // Team Information section
            testers = [];
            teamMembers = [];
            updateTesterList();
            updateTeamMemberList();
        } else if (currentSectionIndex === 6) { // Test Criteria section
            // Clear status codes data and update display
            statusCodesData = [];
            updateStatusCodesDisplay();
        } else if (currentSectionIndex === 7) { // Performance Scenarios section  
            performanceScenariosData = [];
            updatePerformanceScenariosDisplay();
        } else if (currentSectionIndex === 8) { // HTTP Requests section
            httpRequestsData = [];
            const tableBody = document.getElementById('httpRequestsTableBody');
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No HTTP requests added yet. Click "Add Request" to get started.</td></tr>';
            }
        } else if (currentSectionIndex === 9) { // QA Notes section
            qaNotesData = [];
            renderQANotesList();
        }
        
        showToast('Current section cleared', 'info');
    }
}

function clearAllFields() {
    if (confirm('Are you sure you want to clear all fields? This action cannot be undone.')) {
        // Clear all form elements
        document.querySelectorAll('#qaReportForm input, #qaReportForm select, #qaReportForm textarea').forEach(element => {
            if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = false;
            } else {
                element.value = '';
            }
            // Remove validation classes
            element.classList.remove('is-valid', 'is-invalid');
        });
        
        // Clear all dynamic data
        testers = [];
        teamMembers = [];
        statusCodesData = [];
        performanceScenariosData = [];
        httpRequestsData = [];
        qaNotesData = [];
        
        // Update all dynamic lists
        updateTesterList();
        updateTeamMemberList();
        renderQANotesList();
        
        // Reset other dynamic components
        statusCodesData = [];
        performanceScenariosData = [];
        updateStatusCodesDisplay();
        updatePerformanceScenariosDisplay();
        
        const httpTableBody = document.getElementById('httpRequestsTableBody');
        if (httpTableBody) {
            httpTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No HTTP requests added yet. Click "Add Request" to get started.</td></tr>';
        }
        
        // Reset to first section
        showSection(0);
        
        // Set default date to today
        const today = new Date();
        const formattedDate = today.toLocaleDateString('en-GB').replace(/\\//g, '-');
        document.getElementById('reportDate').value = formattedDate;
        
        // Set report type
        document.getElementById('reportType').value = 'Performance';
        
        showToast('All fields cleared', 'info');
    }
}

// Theme toggle function
function toggleTheme() {
    if (window.themeManager && typeof window.themeManager.toggleTheme === 'function') {
        window.themeManager.toggleTheme();
    }
}

// Form validation with visual feedback
function validateField(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (!field) return false;
    
    if (!value || value.trim() === '') {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
        return false;
    } else {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
        return true;
    }
}

// Enhanced form validation with step-by-step feedback
function validateCurrentSection() {
    const currentSectionElement = document.getElementById(`section-${currentSection}`);
    const inputs = currentSectionElement.querySelectorAll('input, select, textarea');
    let isValid = true;
    
    inputs.forEach(input => {
        if (input.hasAttribute('required') && !input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

// Enhanced toast notification system from enhanced_script.js
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
    
    const icon = getToastIcon(type);
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" onclick="removeToast(this.parentElement)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after specified duration
    setTimeout(() => {
        removeToast(toast);
    }, duration);
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

function getToastIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// Auto-save functionality from enhanced_script.js
function autoSaveFormData() {
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }
    autoSaveTimeout = setTimeout(() => {
        saveFormDataToLocalStorage();
    }, 1000); // Save after 1 second of inactivity
}

function setupAutoSave() {
    const form = document.getElementById('qaReportForm');
    if (!form) return;

    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', autoSaveFormData);
        input.addEventListener('change', autoSaveFormData);
    });
}

function saveFormDataToLocalStorage() {
    try {
        const form = document.getElementById('qaReportForm');
        if (!form) return;

        const formData = new FormData(form);
        const formObject = {};
        
        for (let [key, value] of formData.entries()) {
            formObject[key] = value;
        }

        localStorage.setItem(FORM_DATA_KEY, JSON.stringify(formObject));

        // Save array data separately
        const arrayData = {
            testers: testers,
            teamMembers: teamMembers,
            statusCodesData: statusCodesData,
            performanceScenariosData: performanceScenariosData,
            httpRequestsData: httpRequestsData,
            qaNotesData: qaNotesData
        };
        localStorage.setItem(FORM_ARRAYS_KEY, JSON.stringify(arrayData));
        
    } catch (error) {
        console.error('Error saving form data:', error);
    }
}

function loadFormDataFromLocalStorage() {
    try {
        const savedFormData = localStorage.getItem(FORM_DATA_KEY);
        const savedArrayData = localStorage.getItem(FORM_ARRAYS_KEY);

        if (savedFormData) {
            const formObject = JSON.parse(savedFormData);
            const form = document.getElementById('qaReportForm');
            
            if (form) {
                Object.entries(formObject).forEach(([key, value]) => {
                    const field = form.querySelector(`[name="${key}"]`);
                    if (field) {
                        field.value = value;
                    }
                });
            }
        }

        if (savedArrayData) {
            const arrayData = JSON.parse(savedArrayData);
            
            if (arrayData.testers) {
                testers = arrayData.testers;
                updateTesterList();
            }
            if (arrayData.teamMembers) {
                teamMembers = arrayData.teamMembers;
                updateTeamMemberList();
            }
            if (arrayData.qaNotesData) {
                qaNotesData = migrateQANotesData(arrayData.qaNotesData);
                renderQANotesList();
            }
            if (arrayData.httpRequestsData) {
                httpRequestsData = arrayData.httpRequestsData;
                updateHttpRequestsTable();
            }
            if (arrayData.statusCodesData) {
                statusCodesData = arrayData.statusCodesData;
                updateStatusCodesDisplay();
            }
            if (arrayData.performanceScenariosData) {
                performanceScenariosData = arrayData.performanceScenariosData;
                updatePerformanceScenariosDisplay();
            }
            if (arrayData.httpRequestsData) {
                httpRequestsData = arrayData.httpRequestsData;
            }
        }
        
    } catch (error) {
        console.error('Error loading form data:', error);
    }
}

function clearFormDataFromLocalStorage() {
    localStorage.removeItem(FORM_DATA_KEY);
    localStorage.removeItem(FORM_ARRAYS_KEY);
}

// Modal utility functions from enhanced_script.js
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        // Clear form inputs in modal
        const inputs = modal.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = ['testerModal', 'teamMemberModal', 'qaNoteModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};

// Status/Error Code Modal Functions
function showStatusCodeModal() {
    showModal('statusCodeModal');
    document.getElementById('statusCodeSelect').value = '';
    document.getElementById('statusCodeCount').value = '';
}

function closeStatusCodeModal() {
    closeModal('statusCodeModal');
}

function updateStatusCodeInfo() {
    // This function could be extended to show additional info about the selected status code
    const select = document.getElementById('statusCodeSelect');
    const selectedValue = select.value;
    
    if (selectedValue) {
        // Focus the count field for easier data entry
        document.getElementById('statusCodeCount').focus();
    }
}

function addStatusCode() {
    const statusSelect = document.getElementById('statusCodeSelect');
    const countInput = document.getElementById('statusCodeCount');
    
    const statusCode = statusSelect.value;
    const count = parseInt(countInput.value);
    
    if (!statusCode || !count || count <= 0) {
        showToast('Please select a status code and enter a valid count', 'warning');
        return;
    }
    
    // Find if this status code already exists
    const existingIndex = statusCodesData.findIndex(item => item.statusCode === statusCode);
    
    if (existingIndex > -1) {
        // Update existing entry
        statusCodesData[existingIndex].count = count;
        showToast('Status code count updated', 'success');
    } else {
        // Add new entry
        const statusText = statusSelect.options[statusSelect.selectedIndex].text;
        statusCodesData.push({
            statusCode: statusCode,
            statusText: statusText,
            count: count
        });
        showToast('Status code added successfully', 'success');
    }
    
    updateStatusCodesDisplay();
    closeStatusCodeModal();
}

function updateStatusCodesDisplay() {
    const container = document.getElementById('statusCodesContainer');
    
    if (statusCodesData.length === 0) {
        container.innerHTML = '<div class="empty-state">No status codes added yet.</div>';
        return;
    }
    
    const html = statusCodesData.map((item, index) => `
        <div class="status-code-item">
            <div class="status-code-info">
                <span class="status-code-badge status-${getStatusCategory(item.statusCode)}">${item.statusText}</span>
                <span class="status-count">Count: ${item.count}</span>
            </div>
            <button type="button" class="table-action-btn" onclick="removeStatusCode(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function removeStatusCode(index) {
    statusCodesData.splice(index, 1);
    updateStatusCodesDisplay();
    showToast('Status code removed', 'info');
}

// Test Scenario Modal Functions
function showTestScenarioModal() {
    showModal('testScenarioModal');
    clearTestScenarioForm();
}

function closeTestScenarioModal() {
    closeModal('testScenarioModal');
}

function clearTestScenarioForm() {
    document.getElementById('scenarioName').value = '';
    document.getElementById('scenarioDescription').value = '';
    document.getElementById('scenarioUsers').value = '';
    document.getElementById('scenarioDuration').value = '';
    document.getElementById('scenarioResult').value = '';
}

function addTestScenario() {
    const name = document.getElementById('scenarioName').value.trim();
    const description = document.getElementById('scenarioDescription').value.trim();
    const users = parseInt(document.getElementById('scenarioUsers').value);
    const duration = parseInt(document.getElementById('scenarioDuration').value);
    const result = document.getElementById('scenarioResult').value;
    
    if (!name || !description || !users || !duration || !result) {
        showToast('Please fill in all scenario fields', 'warning');
        return;
    }
    
    if (users <= 0 || duration <= 0) {
        showToast('Users and duration must be greater than 0', 'warning');
        return;
    }
    
    const scenario = {
        name: name,
        description: description,
        users: users,
        duration: duration,
        result: result
    };
    
    performanceScenariosData.push(scenario);
    updatePerformanceScenariosDisplay();
    closeTestScenarioModal();
    showToast('Test scenario added successfully', 'success');
}

function updatePerformanceScenariosDisplay() {
    const container = document.getElementById('performanceScenariosContainer');
    
    if (performanceScenariosData.length === 0) {
        container.innerHTML = '<div class="empty-state">No performance scenarios added yet. Click "Add Scenario" to get started.</div>';
        return;
    }
    
    const html = performanceScenariosData.map((scenario, index) => `
        <div class="performance-scenario-item">
            <div class="scenario-header">
                <h4>${scenario.name}</h4>
                <div class="scenario-actions">
                    <span class="scenario-result scenario-result-${scenario.result}">${scenario.result.charAt(0).toUpperCase() + scenario.result.slice(1)}</span>
                    <button type="button" class="table-action-btn" onclick="removePerformanceScenario(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="scenario-content">
                <p class="scenario-description">${scenario.description}</p>
                <div class="scenario-details">
                    <span><i class="fas fa-users"></i> ${scenario.users} users</span>
                    <span><i class="fas fa-clock"></i> ${scenario.duration} minutes</span>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function removePerformanceScenario(index) {
    performanceScenariosData.splice(index, 1);
    updatePerformanceScenariosDisplay();
    showToast('Test scenario removed', 'info');
}

// Make functions globally available
window.showToast = showToast;
window.removeToast = removeToast;
window.autoSaveFormData = autoSaveFormData;
window.showModal = showModal;
window.closeModal = closeModal;
window.showStatusCodeModal = showStatusCodeModal;
window.closeStatusCodeModal = closeStatusCodeModal;
window.addStatusCode = addStatusCode;
window.removeStatusCode = removeStatusCode;
window.showTestScenarioModal = showTestScenarioModal;
window.closeTestScenarioModal = closeTestScenarioModal;
window.addTestScenario = addTestScenario;
window.removePerformanceScenario = removePerformanceScenario;
window.onPortfolioSelection = onPortfolioSelection;
window.onProjectSelection = onProjectSelection;