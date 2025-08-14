let portfolios = [];
let projects = [];
let testers = [];
let teamMembers = [];
let editingId = null;

const roles = ["Project Owner", "Project Analyst", "Project Manager", "Business Analyst", "Technical Lead", "Scrum Master", "Product Owner", "Quality Assurance Lead", "DevOps Engineer", "UI/UX Designer", "Database Administrator", "Security Analyst", "System Administrator", "Stakeholder", "Client Representative"];

// --- INITIALIZATION ---
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

    // Setup and load data
    setupRoleFilters();
    await loadAllData();
    updateAll();
});

function setupRoleFilters() {
    const roleFilter = document.getElementById('roleFilter');
    // Only populate the filter dropdown, not the team member role dropdown (now using pills)
    if (roleFilter) {
        roles.forEach(role => {
            roleFilter.innerHTML += `<option value="${role}">${role}</option>`;
        });
    }
}

async function loadAllData() {
    try {
        // Load data sequentially to avoid overwhelming the server
        const portfolioResponse = await fetch('/api/portfolios');
        const projectResponse = await fetch('/api/projects');
        const testerResponse = await fetch('/api/testers');
        const teamResponse = await fetch('/api/team-members');

        // Process each response
        portfolios = portfolioResponse.ok ? await portfolioResponse.json() : [];
        projects = projectResponse.ok ? await projectResponse.json() : [];
        testers = testerResponse.ok ? await testerResponse.json() : [];
        teamMembers = teamResponse.ok ? await teamResponse.json() : [];

        // Ensure arrays are properly initialized
        portfolios = Array.isArray(portfolios) ? portfolios : [];
        projects = Array.isArray(projects) ? projects : [];
        testers = Array.isArray(testers) ? testers : [];
        teamMembers = Array.isArray(teamMembers) ? teamMembers : [];

    } catch (error) {
        console.error("Failed to load data:", error);
        showToast('Failed to load data. Please refresh the page.', 'error');
        // Initialize with empty arrays as fallback
        portfolios = [];
        projects = [];
        testers = [];
        teamMembers = [];
    }
}

function updateAll() {
    updateStats();
    displayAllLists();
    populatePortfolioFilter();
}

function updateStats() {
    document.getElementById('totalPortfolios').textContent = portfolios.length;
    document.getElementById('totalProjects').textContent = projects.length;
    document.getElementById('totalTesters').textContent = testers.length;
    document.getElementById('totalTeamMembers').textContent = teamMembers.length;
    document.getElementById('projectOwners').textContent = teamMembers.filter(tm => tm.role === 'Project Owner').length;
    document.getElementById('projectAnalysts').textContent = teamMembers.filter(tm => tm.role === 'Project Analyst').length;
    document.getElementById('projectManagers').textContent = teamMembers.filter(tm => tm.role === 'Project Manager').length;
}

// --- DISPLAY & RENDER FUNCTIONS ---
function displayAllLists() {
    displayPortfolios();
    displayProjects();
    displayTesters();
    displayTeamMembers();
}

function renderList(type, data, renderer, emptyIcon, emptyTitle, emptyText) {
    const container = document.getElementById(`${type}List`);
    if (data.length === 0) {
        container.innerHTML = `<div class="empty-data-state">
            <div class="icon-bg"><i class="fas ${emptyIcon}"></i></div>
            <h3>${emptyTitle}</h3>
            <p>${emptyText}</p>
        </div>`;
        return;
    }
    container.innerHTML = data.map(renderer).join('');
}

// Portfolios
function displayPortfolios() {
    const searchTerm = document.getElementById('portfolioSearch')?.value.toLowerCase() || '';
    const filtered = portfolios.filter(p => p.name.toLowerCase().includes(searchTerm));
    renderList('portfolios', filtered, renderPortfolio, 'fa-folder-open', 'No Portfolios Found', 'Add a portfolio to get started.');
}
const renderPortfolio = p => `<div class="data-item"><div class="data-item-header"><h3 class="data-item-title">${p.name}</h3><div class="data-item-actions"><button class="btn-edit" onclick="editPortfolio(${p.id})"><i class="fas fa-edit"></i></button><button class="btn-delete" onclick="deleteItem('portfolios', ${p.id})"><i class="fas fa-trash"></i></button></div></div><div class="data-item-content"><p>${p.description || 'No description'}</p><p><strong>Projects:</strong> ${projects.filter(proj => proj.portfolio_id === p.id).length}</p></div></div>`;

// Projects
function displayProjects() {
    const searchTerm = document.getElementById('projectSearch')?.value.toLowerCase() || '';
    const portfolioId = document.getElementById('portfolioFilter')?.value;
    let filtered = projects;
    if (portfolioId) {
        filtered = filtered.filter(p => p.portfolio_id == portfolioId);
    }
    if (searchTerm) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
    }
    renderList('projects', filtered, renderProject, 'fa-rocket', 'No Projects Found', 'Add a project to get started.');
}
const renderProject = p => `<div class="data-item"><div class="data-item-header"><h3 class="data-item-title">${p.name}</h3><div class="data-item-actions"><button class="btn-edit" onclick="editProject(${p.id})"><i class="fas fa-edit"></i></button><button class="btn-delete" onclick="deleteItem('projects', ${p.id})"><i class="fas fa-trash"></i></button></div></div><div class="data-item-content"><p><strong>Portfolio:</strong> ${portfolios.find(pf => pf.id === p.portfolio_id)?.name || 'No Portfolio'}</p><p>${p.description || 'No description'}</p></div></div>`;

// Testers
function displayTesters() {
    const searchTerm = document.getElementById('testerSearch')?.value.toLowerCase() || '';
    const filtered = testers.filter(t => t.name.toLowerCase().includes(searchTerm) || t.email.toLowerCase().includes(searchTerm));
    renderList('testers', filtered, renderTester, 'fa-vial', 'No Testers Found', 'Add a tester to the system.');
}
const renderTester = t => {
    const roleBadges = [];
    if (t.is_automation_engineer) roleBadges.push('<span class="role-badge">Automation Engineer</span>');
    if (t.is_manual_engineer) roleBadges.push('<span class="role-badge">Manual Engineer</span>');
    if (t.is_performance_tester) roleBadges.push('<span class="role-badge">Performance Tester</span>');
    if (t.is_security_tester) roleBadges.push('<span class="role-badge">Security Tester</span>');
    if (t.is_api_tester) roleBadges.push('<span class="role-badge">API Tester</span>');
    if (t.is_mobile_tester) roleBadges.push('<span class="role-badge">Mobile Tester</span>');
    if (t.is_web_tester) roleBadges.push('<span class="role-badge">Web Tester</span>');
    if (t.is_accessibility_tester) roleBadges.push('<span class="role-badge">Accessibility Tester</span>');
    if (t.is_usability_tester) roleBadges.push('<span class="role-badge">Usability Tester</span>');
    if (t.is_test_lead) roleBadges.push('<span class="role-badge test-lead">Test Lead</span>');

    const roleDisplay = roleBadges.length > 0 ? roleBadges.join(' ') : '<span style="color: var(--text-secondary); font-style: italic;">No roles assigned</span>';

    // Show assigned projects count
    const projectCount = t.project_ids ? t.project_ids.length : 0;
    const projectText = projectCount === 1 ? '1 project' : `${projectCount} projects`;

    return `<div class="data-item">
        <div class="data-item-header">
            <h3 class="data-item-title">${t.name}</h3>
            <div class="data-item-actions">
                <button class="btn-secondary" onclick="showAssignTesterProjectsModal(${t.id})" title="Assign Projects"><i class="fas fa-link"></i></button>
                <button class="btn-edit" onclick="editTester(${t.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="deleteItem('testers', ${t.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="data-item-content">
            <p><strong>Email:</strong> ${t.email}</p>
            <p><strong>Roles:</strong> ${roleDisplay}</p>
            <p><strong>Assigned to:</strong> ${projectText}</p>
        </div>
    </div>`;
};

// Team Members
function displayTeamMembers() {
    const searchTerm = document.getElementById('teamSearch')?.value.toLowerCase() || '';
    const role = document.getElementById('roleFilter')?.value;
    let filtered = teamMembers;
    if (role) {
        filtered = filtered.filter(m => m.role === role);
    }
    if (searchTerm) {
        filtered = filtered.filter(m => m.name.toLowerCase().includes(searchTerm) || m.email.toLowerCase().includes(searchTerm));
    }
    renderList('teamMembers', filtered, renderTeamMember, 'fa-users', 'No Team Members Found', 'Add a team member to the system.');
}
const renderTeamMember = m => `<div class="data-item"><div class="data-item-header"><h3 class="data-item-title">${m.name}</h3><div class="data-item-actions"><button class="btn-edit" onclick="editTeamMember(${m.id})"><i class="fas fa-edit"></i></button><button class="btn-delete" onclick="deleteItem('team-members', ${m.id})"><i class="fas fa-trash"></i></button></div></div><div class="data-item-content"><p><strong>Email:</strong> ${m.email}</p><span class="role-badge">${m.role}</span></div></div>`;

// --- TABS & MODALS ---
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tabs .btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show target content
    const targetContent = document.getElementById(tabName);
    if (targetContent) {
        targetContent.style.display = 'block';
        targetContent.classList.add('active');
    }

    // Add active class to clicked button
    const activeButton = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }

    // Call the appropriate display function to populate the tab content
    switch (tabName) {
        case 'portfolios':
            displayPortfolios();
            break;
        case 'projects':
            displayProjects();
            break;
        case 'testers':
            displayTesters();
            break;
        case 'team':
            displayTeamMembers();
            break;
    }
}

function showModal(modalId) { document.getElementById(modalId).style.display = 'flex'; }
function closeModal(modalId) { document.getElementById(modalId).style.display = 'none'; }

// Simple toast notification function
function showToast(message, type = 'info') {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            padding: 12px 20px; border-radius: 5px; color: white;
            font-weight: bold; opacity: 0; transition: opacity 0.3s;
        `;
        document.body.appendChild(toast);
    }

    // Set background color based on type
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    toast.style.backgroundColor = colors[type] || colors.info;

    // Show toast
    toast.textContent = message;
    toast.style.opacity = '1';

    // Hide after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 3000);
}

function populatePortfolioDropdown(selectedId = '') {
    // Legacy function - kept for compatibility if used elsewhere
    const select = document.getElementById('projectPortfolio');
    if (!select) return;

    select.innerHTML = '<option value="">No Portfolio (Standalone Project)</option>';

    if (portfolios && Array.isArray(portfolios)) {
        portfolios.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.name;
            if (p.id == selectedId) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }
}

function populatePortfolioPills(selectedId = '') {
    const container = document.getElementById('projectPortfoliosContainer');
    if (!container) {
        console.error('Portfolio container not found!');
        return;
    }

    // Find standalone pill and existing portfolio pills
    const standalonePill = container.querySelector('.standalone-pill');
    const existingPortfolioPills = container.querySelectorAll('.portfolio-pill:not(.standalone-pill)');

    if (!standalonePill) {
        console.error('Standalone pill not found in container!');
        return;
    }

    // Remove existing portfolio pills (keep standalone)
    existingPortfolioPills.forEach(pill => pill.remove());

    // Reset all pills
    container.querySelectorAll('.portfolio-pill').forEach(pill => {
        pill.classList.remove('selected');
        pill.setAttribute('aria-pressed', 'false');
    });

    // Add portfolio pills
    if (portfolios && Array.isArray(portfolios) && portfolios.length > 0) {
        portfolios.forEach((p, index) => {
            if (!p || !p.name) {
                console.warn(`Portfolio at index ${index} is invalid:`, p);
                return;
            }

            const pill = document.createElement('div');
            pill.className = 'tag-pill portfolio-pill';
            pill.setAttribute('data-portfolio-id', p.id);
            pill.setAttribute('tabindex', '0');
            pill.setAttribute('role', 'button');
            pill.setAttribute('aria-pressed', 'false');
            pill.onclick = () => toggleSingleTagPill(pill);
            pill.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSingleTagPill(pill);
                }
            };
            pill.innerHTML = `
                <i class="fas fa-briefcase"></i>
                <span>${p.name}</span>
            `;
            container.appendChild(pill);

            // Select if this is the selected portfolio
            if (p.id == selectedId) {
                pill.classList.add('selected');
                pill.setAttribute('aria-pressed', 'true');
            }
        });
    } else {
        console.warn('No portfolios available or portfolios is not an array:', portfolios);
    }

    // Select standalone if no portfolio selected or if selectedId is empty
    if (!selectedId || selectedId === '') {
        standalonePill.classList.add('selected');
        standalonePill.setAttribute('aria-pressed', 'true');
    }

}
function populatePortfolioFilter() {
    const select = document.getElementById('portfolioFilter');
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">All Portfolios</option>';

    if (portfolios && Array.isArray(portfolios)) {
        select.innerHTML += portfolios.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }

    select.value = currentValue;
}

function populateProjectAssignmentList(selectedProjectIds = []) {
    const container = document.getElementById('projectAssignmentList');
    if (!container) return;

    container.innerHTML = '';

    if (projects && Array.isArray(projects) && projects.length > 0) {
        projects.forEach(project => {
            const portfolioName = project.portfolio_name || 'No Portfolio';
            const isSelected = selectedProjectIds.includes(project.id);

            const tagPill = document.createElement('div');
            tagPill.className = `tag-pill ${isSelected ? 'selected' : ''}`;
            tagPill.setAttribute('data-project-id', project.id);
            tagPill.setAttribute('tabindex', '0');
            tagPill.setAttribute('role', 'button');
            tagPill.setAttribute('aria-pressed', isSelected.toString());
            tagPill.onclick = () => toggleProjectTagPill(tagPill);
            tagPill.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleProjectTagPill(tagPill);
                }
            };
            tagPill.innerHTML = `
                <i class="fas fa-project-diagram"></i>
                <span>
                    <strong>${project.name}</strong>
                    <small style="display: block; font-size: 0.8em; opacity: 0.8;">${portfolioName}</small>
                </span>
            `;
            container.appendChild(tagPill);
        });
    } else {
        container.innerHTML = '<p style="color: var(--text-secondary); font-style: italic; text-align: center; padding: 2rem;">No projects available</p>';
    }
}

// --- CRUD OPERATIONS ---
// Show Modals for Adding
function showAddPortfolioModal() { editingId = null; document.getElementById('portfolioName').value = ''; document.getElementById('portfolioDescription').value = ''; showModal('addPortfolioModal'); }
async function showAddProjectModalWithPortfolios() {
    editingId = null;
    document.getElementById('projectName').value = '';
    document.getElementById('projectDescription').value = '';

    try {
        // Always ensure fresh data is loaded
        await loadAllData();

        // Wait a moment to ensure data is fully processed
        await new Promise(resolve => setTimeout(resolve, 100));

        // Populate portfolio pills after data is confirmed loaded
        populatePortfolioPills(); // Default to standalone
    } catch (error) {
        console.error('Error loading portfolios for Add Project modal:', error);
        showToast('Failed to load portfolios. Please try again.', 'error');
        // Still show modal with empty portfolios
        populatePortfolioPills();
    }

    showModal('addProjectModal');
}
async function showAddTesterModal() {
    editingId = null;
    document.getElementById('testerName').value = '';
    document.getElementById('testerEmail').value = '';

    // Reset all role tag pills
    document.querySelectorAll('#testerRolesContainer .tag-pill').forEach(pill => {
        pill.classList.remove('selected');
    });

    // Ensure projects are loaded before populating project list
    if (!projects || projects.length === 0) {
        await loadAllData();
    }

    populateProjectAssignmentList();
    showModal('addTesterModal');
}
function showAddTeamMemberModal() {
    editingId = null;
    document.getElementById('teamMemberName').value = '';
    document.getElementById('teamMemberEmail').value = '';

    // Reset all role tag pills
    document.querySelectorAll('#teamMemberRolesContainer .role-pill').forEach(pill => {
        pill.classList.remove('selected');
        pill.setAttribute('aria-pressed', 'false');
    });

    showModal('addTeamMemberModal');
}

// Show Modals for Editing
function editPortfolio(id) { const p = portfolios.find(i => i.id === id); if (!p) return; editingId = id; document.getElementById('portfolioName').value = p.name; document.getElementById('portfolioDescription').value = p.description; showModal('addPortfolioModal'); }
function editProject(id) {
    const p = projects.find(i => i.id === id);
    if (!p) return;

    editingId = id;
    document.getElementById('projectName').value = p.name;
    document.getElementById('projectDescription').value = p.description;
    populatePortfolioPills(p.portfolio_id);
    showModal('addProjectModal');
}
async function editTester(id) {
    const t = testers.find(i => i.id === id);
    if (!t) return;

    editingId = id;
    document.getElementById('testerName').value = t.name;
    document.getElementById('testerEmail').value = t.email;

    // Set all role tag pills
    const roleMapping = {
        'isAutomationEngineer': t.is_automation_engineer,
        'isManualEngineer': t.is_manual_engineer,
        'isPerformanceTester': t.is_performance_tester,
        'isSecurityTester': t.is_security_tester,
        'isApiTester': t.is_api_tester,
        'isMobileTester': t.is_mobile_tester,
        'isWebTester': t.is_web_tester,
        'isAccessibilityTester': t.is_accessibility_tester,
        'isUsabilityTester': t.is_usability_tester,
        'isTestLead': t.is_test_lead
    };

    document.querySelectorAll('#testerRolesContainer .tag-pill').forEach(pill => {
        const role = pill.getAttribute('data-role');
        if (roleMapping[role]) {
            pill.classList.add('selected');
            pill.setAttribute('aria-pressed', 'true');
        } else {
            pill.classList.remove('selected');
            pill.setAttribute('aria-pressed', 'false');
        }
    });

    // Ensure projects are loaded before populating project list
    if (!projects || projects.length === 0) {
        await loadAllData();
    }

    // Populate project assignment list with current assignments
    populateProjectAssignmentList(t.project_ids || []);

    showModal('addTesterModal');
}
function editTeamMember(id) {
    const m = teamMembers.find(i => i.id === id);
    if (!m) return;

    editingId = id;
    document.getElementById('teamMemberName').value = m.name;
    document.getElementById('teamMemberEmail').value = m.email;

    // Reset all role tag pills first
    document.querySelectorAll('#teamMemberRolesContainer .role-pill').forEach(pill => {
        pill.classList.remove('selected');
        pill.setAttribute('aria-pressed', 'false');
    });

    // Select the member's current role
    if (m.role) {
        const rolePill = document.querySelector(`#teamMemberRolesContainer .role-pill[data-role="${m.role}"]`);
        if (rolePill) {
            rolePill.classList.add('selected');
            rolePill.setAttribute('aria-pressed', 'true');
        }
    }

    showModal('addTeamMemberModal');
}

// Save Data (Create/Update)
async function saveData(type, body, modalId) {
    const url = editingId ? `/api/${type}/${editingId}` : `/api/${type}`;
    const method = editingId ? 'PUT' : 'POST';
    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            const result = await response.json();

            // Reload all data to ensure consistency
            await loadAllData();
            updateAll();
            closeModal(modalId);

            const action = editingId ? 'updated' : 'created';
            const itemName = type.replace(/-/g, ' ').slice(0, -1); // Remove 's' and replace hyphens
            showToast(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} ${action} successfully!`, 'success');

            return true;
        } else {
            let errorMessage = 'Unknown error';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
                errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }

            console.error(`Failed to save ${type}:`, errorMessage);
            showToast(`Failed to save ${type.replace(/-/g, ' ')}: ${errorMessage}`, 'error');
            return false;
        }
    } catch (error) {
        console.error(`Network error saving ${type}:`, error);
        showToast(`Network error occurred while saving ${type.replace(/-/g, ' ')}.`, 'error');
        return false;
    } finally {
        editingId = null;
    }
}

async function savePortfolio() {
    const name = document.getElementById('portfolioName').value.trim();
    const description = document.getElementById('portfolioDescription').value.trim();

    if (!name) {
        showToast('Portfolio name is required', 'warning');
        return;
    }

    const wasCreating = !editingId; // Remember if we were creating (not editing)
    const result = await saveData('portfolios', { name, description }, 'addPortfolioModal');

    if (result && wasCreating) {
        // If it's a new portfolio (not editing), offer to add a project
        setTimeout(() => {
            if (confirm('Would you like to add a project to the new portfolio?')) {
                // Open project modal with portfolio pills refreshed
                showAddProjectModal();
            }
        }, 500);
    }
}
async function saveProject() {
    const name = document.getElementById('projectName').value.trim();
    const description = document.getElementById('projectDescription').value.trim();

    // Get selected portfolio from tag pills
    const selectedPortfolioPill = document.querySelector('#projectPortfoliosContainer .portfolio-pill.selected');

    let portfolio_id = null;
    if (selectedPortfolioPill) {
        const portfolioIdAttr = selectedPortfolioPill.getAttribute('data-portfolio-id');
        // If it's empty string (standalone), keep it as null, otherwise use the ID
        portfolio_id = portfolioIdAttr && portfolioIdAttr !== '' ? parseInt(portfolioIdAttr) : null;
    }

    if (!name) {
        showToast('Project name is required', 'warning');
        return;
    }

    await saveData('projects', { name, portfolio_id, description }, 'addProjectModal');
}
async function saveTester() {
    const name = document.getElementById('testerName').value.trim();
    const email = document.getElementById('testerEmail').value.trim();

    if (!name || !email) {
        showToast('Name and email are required', 'warning');
        return;
    }

    // Get all selected role tag pills
    const selectedRoles = {};
    document.querySelectorAll('#testerRolesContainer .tag-pill').forEach(pill => {
        const role = pill.getAttribute('data-role');
        const roleKey = role.replace(/([A-Z])/g, '_$1').toLowerCase();
        selectedRoles[roleKey] = pill.classList.contains('selected');
    });

    const testerData = {
        name,
        email,
        ...selectedRoles
    };

    // Get selected project IDs from tag pills
    const selectedProjectPills = document.querySelectorAll('#projectAssignmentList .tag-pill.selected');
    const selectedProjectIds = Array.from(selectedProjectPills).map(pill => parseInt(pill.getAttribute('data-project-id')));
    testerData.project_ids = selectedProjectIds;

    await saveData('testers', testerData, 'addTesterModal');
}
async function saveTeamMember() {
    const name = document.getElementById('teamMemberName').value.trim();
    const email = document.getElementById('teamMemberEmail').value.trim();

    // Get selected role from tag pills
    const selectedRolePill = document.querySelector('#teamMemberRolesContainer .role-pill.selected');
    const role = selectedRolePill ? selectedRolePill.getAttribute('data-role') : null;

    if (!name || !email) {
        showToast('Please enter both name and email', 'warning');
        return;
    }

    if (!role) {
        showToast('Please select a role', 'warning');
        return;
    }

    await saveData('team-members', { name, email, role }, 'addTeamMemberModal');
}

// Tester-Project Assignment Functions
let currentTesterId = null;

function showAssignTesterProjectsModal(testerId) {
    currentTesterId = testerId;
    const tester = testers.find(t => t.id === testerId);
    if (!tester) return;

    // Update tester info
    document.getElementById('selectedTesterInfo').textContent = `${tester.name} (${tester.email})`;

    // Populate project checkboxes
    populateProjectCheckboxes(testerId);

    showModal('assignTesterProjectsModal');
}

async function populateProjectCheckboxes(testerId) {
    const container = document.getElementById('projectCheckboxList');

    // Get tester's current projects
    let testerProjects = [];
    try {
        const response = await fetch(`/api/testers/${testerId}/projects`);
        if (response.ok) {
            testerProjects = await response.json();
        }
    } catch (error) {
        console.error('Error loading tester projects:', error);
    }

    const testerProjectIds = testerProjects.map(p => p.id);

    // Create checkboxes for all projects
    container.innerHTML = projects.map(project => {
        const portfolioName = project.portfolio_name || 'No Portfolio';
        const isChecked = testerProjectIds.includes(project.id) ? 'checked' : '';
        return `
            <label class="checkbox-item">
                <input type="checkbox" value="${project.id}" ${isChecked}>
                <span class="checkbox-text">
                    <strong>${project.name}</strong>
                    <small>(${portfolioName})</small>
                </span>
            </label>
        `;
    }).join('');
}

async function saveTesterProjects() {
    if (!currentTesterId) return;

    const checkboxes = document.querySelectorAll('#projectCheckboxList input[type="checkbox"]:checked');
    const projectIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    try {
        const response = await fetch(`/api/testers/${currentTesterId}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_ids: projectIds })
        });

        if (response.ok) {
            closeModal('assignTesterProjectsModal');
            showToast('Tester projects updated successfully!', 'success');
            updateAll(); // Refresh the displays
        } else {
            showToast('Failed to update tester projects.', 'error');
        }
    } catch (error) {
        console.error('Error saving tester projects:', error);
        showToast('An error occurred while updating tester projects.', 'error');
    }
}

// Delete Data
async function deleteItem(type, id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
        const response = await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
        if (response.ok) {
            await loadAllData();
            updateAll();
        }
        else { alert(`Failed to delete ${type}.`); }
    } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        alert(`An error occurred while deleting ${type}.`);
    }
}

// Tag/Pill Selection Functions
function toggleTagPill(pill) {
    // Add selecting animation
    pill.classList.add('selecting');
    setTimeout(() => pill.classList.remove('selecting'), 300);

    // Toggle selected state
    pill.classList.toggle('selected');

    // Update ARIA attributes
    const isSelected = pill.classList.contains('selected');
    pill.setAttribute('aria-pressed', isSelected.toString());
}

// Single Selection Tag/Pill Function (for Team Member Roles)
function toggleSingleTagPill(pill) {
    // Add selecting animation
    pill.classList.add('selecting');
    setTimeout(() => pill.classList.remove('selecting'), 300);

    // Get the container to find all pills
    const container = pill.closest('.tag-pill-container');

    // Check if this is a portfolio pill or role pill container
    const isPortfolioContainer = container.id === 'projectPortfoliosContainer';
    const pillSelector = isPortfolioContainer ? '.portfolio-pill' : '.role-pill';
    const allPills = container.querySelectorAll(pillSelector);


    // Remove selected state from all pills
    allPills.forEach(p => {
        p.classList.remove('selected');
        p.setAttribute('aria-pressed', 'false');
    });

    // Add selected state to clicked pill
    pill.classList.add('selected');
    pill.setAttribute('aria-pressed', 'true');

    // Log the selected portfolio ID for debugging
    if (isPortfolioContainer) {
        const portfolioId = pill.getAttribute('data-portfolio-id');
    }
}

function toggleProjectTagPill(pill) {
    // Add selecting animation
    pill.classList.add('selecting');
    setTimeout(() => pill.classList.remove('selecting'), 300);

    // Toggle selected state
    pill.classList.toggle('selected');

    // Update ARIA attributes
    const isSelected = pill.classList.contains('selected');
    pill.setAttribute('aria-pressed', isSelected.toString());
}

// Function to get selected role pills data
function getSelectedRoles() {
    const selectedRoles = {};
    document.querySelectorAll('#testerRolesContainer .tag-pill').forEach(pill => {
        const role = pill.getAttribute('data-role');
        selectedRoles[role] = pill.classList.contains('selected');
    });
    return selectedRoles;
}

// Function to get selected project pills data
function getSelectedProjectIds() {
    const selectedPills = document.querySelectorAll('#projectAssignmentList .tag-pill.selected');
    return Array.from(selectedPills).map(pill => parseInt(pill.getAttribute('data-project-id')));
}

// Authentication functions
async function loadUserInfo() {
    try {
        const response = await fetch('/api/auth/profile');
        if (response.ok) {
            const user = await response.json();
            document.getElementById('userDisplayName').textContent = user.first_name;

            // Show admin links if user is admin
            if (user.role === 'admin') {
                document.getElementById('adminLinks').style.display = 'block';
            }
        } else {
            // User not authenticated, redirect to login
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Failed to load user info:', error);
        window.location.href = '/login';
    }
}

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    } catch (error) {
        window.location.href = '/login';
    }
}

function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('mobile-active');
}
