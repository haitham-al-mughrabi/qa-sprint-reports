// Simple Manage Data JavaScript
let portfolios = [];
let projects = [];
let testers = [];
let teamMembers = [];
let editingId = null;
let editingType = null;

// Roles definitions
const testerRoles = [
    'Manual Tester',
    'Automation Tester', 
    'Performance Tester',
    'Quality Manager',
    'Quality Team Lead'
];

const teamMemberRoles = [
    'Project Owner',
    'Project Manager',
    'Business Analyst',
    'Technical Lead',
    'Senior Developer',
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'Mobile Developer',
    'DevOps Engineer',
    'Database Administrator',
    'System Administrator',
    'UI/UX Designer',
    'Product Owner',
    'Scrum Master',
    'Software Architect',
    'Quality Assurance Lead',
    'Security Analyst',
    'Data Scientist',
    'Data Engineer'
];

let selectedTesterRoles = [];
let selectedTeamMemberRoles = [];

// Initialize the application
async function initApp() {
    try {
        setupRoleSelects();
        await loadAllData();
        renderAllData();
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('Error initializing application', 'error');
    }
}

// Setup role selects
function setupRoleSelects() {
    // Populate tester roles
    const testerSelect = document.getElementById('testerRoles');
    if (testerSelect) {
        testerSelect.innerHTML = '<option value="">Select a role...</option>';
        testerRoles.forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            testerSelect.appendChild(option);
        });
    }

    // Populate team member roles
    const teamMemberSelect = document.getElementById('teamMemberRoles');
    if (teamMemberSelect) {
        teamMemberSelect.innerHTML = '<option value="">Select a role...</option>';
        teamMemberRoles.forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            teamMemberSelect.appendChild(option);
        });
    }

    // Setup multi-select event listeners
    if (testerSelect) {
        testerSelect.addEventListener('change', function(e) {
            const selectedRole = e.target.value;
            if (selectedRole && !selectedTesterRoles.includes(selectedRole)) {
                selectedTesterRoles.push(selectedRole);
                renderSelectedRoles('tester');
            }
            e.target.value = '';
        });
    }

    if (teamMemberSelect) {
        teamMemberSelect.addEventListener('change', function(e) {
            const selectedRole = e.target.value;
            if (selectedRole && !selectedTeamMemberRoles.includes(selectedRole)) {
                selectedTeamMemberRoles.push(selectedRole);
                renderSelectedRoles('teamMember');
            }
            e.target.value = '';
        });
    }

    // Populate filters
    populateFilters();
}

// Populate filter dropdowns
function populateFilters() {
    // Tester role filter
    const testerRoleFilter = document.getElementById('testerRoleFilter');
    if (testerRoleFilter) {
        testerRoleFilter.innerHTML = '<option value="">All Roles</option>';
        testerRoles.forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            testerRoleFilter.appendChild(option);
        });
    }

    // Team member role filter
    const teamMemberRoleFilter = document.getElementById('teamMemberRoleFilter');
    if (teamMemberRoleFilter) {
        teamMemberRoleFilter.innerHTML = '<option value="">All Roles</option>';
        teamMemberRoles.forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            teamMemberRoleFilter.appendChild(option);
        });
    }
}

// Load all data from APIs
async function loadAllData() {
    try {
        const [portfolioData, projectData, testerData, teamMemberData] = await Promise.all([
            fetch('/api/portfolios').then(res => res.json()),
            fetch('/api/projects').then(res => res.json()),
            fetch('/api/testers').then(res => res.json()),
            fetch('/api/team-members').then(res => res.json())
        ]);

        portfolios = portfolioData;
        projects = projectData;
        testers = testerData;
        teamMembers = teamMemberData;

        // Update portfolio dropdown for projects
        updateProjectPortfolioDropdown();
        updatePortfolioFilter();
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data', 'error');
    }
}

// Update project portfolio dropdown
function updateProjectPortfolioDropdown() {
    const select = document.getElementById('projectPortfolio');
    if (select) {
        select.innerHTML = '<option value="">Select Portfolio</option>';
        portfolios.forEach(portfolio => {
            const option = document.createElement('option');
            option.value = portfolio.id;
            option.textContent = portfolio.name;
            select.appendChild(option);
        });
    }
}

// Update portfolio filter
function updatePortfolioFilter() {
    const filter = document.getElementById('portfolioFilter');
    if (filter) {
        filter.innerHTML = '<option value="">All Portfolios</option>';
        portfolios.forEach(portfolio => {
            const option = document.createElement('option');
            option.value = portfolio.id;
            option.textContent = portfolio.name;
            filter.appendChild(option);
        });
    }
}

// Render all data
function renderAllData() {
    displayPortfolios();
    displayProjects();
    displayTesters();
    displayTeamMembers();
}

// Display functions
function displayPortfolios() {
    const searchTerm = document.getElementById('portfolioSearch')?.value.toLowerCase() || '';
    let filtered = portfolios;

    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            (p.description && p.description.toLowerCase().includes(searchTerm))
        );
    }

    renderList('portfolioList', filtered, renderPortfolio);
}

function displayProjects() {
    const searchTerm = document.getElementById('projectSearch')?.value.toLowerCase() || '';
    const portfolioFilter = document.getElementById('portfolioFilter')?.value || '';
    let filtered = projects;

    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            (p.description && p.description.toLowerCase().includes(searchTerm))
        );
    }

    if (portfolioFilter) {
        filtered = filtered.filter(p => p.portfolio_id == portfolioFilter);
    }

    renderList('projectList', filtered, renderProject);
}

function displayTesters() {
    const searchTerm = document.getElementById('testerSearch')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('testerRoleFilter')?.value || '';
    let filtered = testers;

    if (searchTerm) {
        filtered = filtered.filter(t => 
            t.name.toLowerCase().includes(searchTerm) ||
            t.email.toLowerCase().includes(searchTerm)
        );
    }

    if (roleFilter) {
        filtered = filtered.filter(t => {
            const roles = Array.isArray(t.roles) ? t.roles : (t.role ? [t.role] : []);
            return roles.includes(roleFilter);
        });
    }

    renderList('testerList', filtered, renderTester);
}

function displayTeamMembers() {
    const searchTerm = document.getElementById('teamMemberSearch')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('teamMemberRoleFilter')?.value || '';
    let filtered = teamMembers;

    if (searchTerm) {
        filtered = filtered.filter(tm => 
            tm.name.toLowerCase().includes(searchTerm) ||
            tm.email.toLowerCase().includes(searchTerm)
        );
    }

    if (roleFilter) {
        filtered = filtered.filter(tm => {
            const roles = Array.isArray(tm.roles) ? tm.roles : (tm.role ? [tm.role] : []);
            return roles.includes(roleFilter);
        });
    }

    renderList('teamMemberList', filtered, renderTeamMember);
}

// Render list helper
function renderList(containerId, data, renderer) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No items found</p>
            </div>
        `;
        return;
    }

    container.innerHTML = data.map(renderer).join('');
}

// Render functions
function renderPortfolio(portfolio) {
    const projectCount = projects.filter(p => p.portfolio_id === portfolio.id).length;
    
    return `
        <div class="data-item">
            <div class="data-item-header">
                <h3 class="data-item-title">${portfolio.name}</h3>
                <div class="data-item-actions">
                    <button class="btn-edit" onclick="editPortfolio(${portfolio.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deletePortfolio(${portfolio.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="data-item-content">
                <p>${portfolio.description || 'No description'}</p>
                <p><strong>Projects:</strong> ${projectCount}</p>
            </div>
        </div>
    `;
}

function renderProject(project) {
    const portfolio = portfolios.find(p => p.id === project.portfolio_id);
    
    return `
        <div class="data-item">
            <div class="data-item-header">
                <h3 class="data-item-title">${project.name}</h3>
                <div class="data-item-actions">
                    <button class="btn-edit" onclick="editProject(${project.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteProject(${project.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="data-item-content">
                <p><strong>Portfolio:</strong> ${portfolio ? portfolio.name : 'Unknown'}</p>
                <p>${project.description || 'No description'}</p>
            </div>
        </div>
    `;
}

function renderTester(tester) {
    const roles = Array.isArray(tester.roles) ? tester.roles : (tester.role ? [tester.role] : []);
    
    return `
        <div class="data-item">
            <div class="data-item-header">
                <h3 class="data-item-title">${tester.name}</h3>
                <div class="data-item-actions">
                    <button class="btn-edit" onclick="editTester(${tester.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteTester(${tester.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="data-item-content">
                <p><strong>Email:</strong> ${tester.email}</p>
                <div class="roles-container">
                    ${roles.map(role => `<span class="role-badge">${role}</span>`).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderTeamMember(teamMember) {
    const roles = Array.isArray(teamMember.roles) ? teamMember.roles : (teamMember.role ? [teamMember.role] : []);
    
    return `
        <div class="data-item">
            <div class="data-item-header">
                <h3 class="data-item-title">${teamMember.name}</h3>
                <div class="data-item-actions">
                    <button class="btn-edit" onclick="editTeamMember(${teamMember.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteTeamMember(${teamMember.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="data-item-content">
                <p><strong>Email:</strong> ${teamMember.email}</p>
                <div class="roles-container">
                    ${roles.map(role => `<span class="role-badge">${role}</span>`).join('')}
                </div>
            </div>
        </div>
    `;
}

// Modal functions
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
    }
    resetForm();
}

function resetForm() {
    editingId = null;
    editingType = null;
    selectedTesterRoles = [];
    selectedTeamMemberRoles = [];
    
    // Clear selected roles display
    renderSelectedRoles('tester');
    renderSelectedRoles('teamMember');
}

// Render selected roles
function renderSelectedRoles(type) {
    const containerId = type === 'tester' ? 'selectedTesterRoles' : 'selectedTeamMemberRoles';
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const roles = type === 'tester' ? selectedTesterRoles : selectedTeamMemberRoles;
    
    container.innerHTML = '';
    roles.forEach(role => {
        const roleElement = document.createElement('div');
        roleElement.className = 'selected-role';
        roleElement.innerHTML = `
            ${role}
            <button type="button" onclick="removeSelectedRole('${type}', '${role}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(roleElement);
    });
}

// Remove selected role
function removeSelectedRole(type, role) {
    if (type === 'tester') {
        const index = selectedTesterRoles.indexOf(role);
        if (index > -1) {
            selectedTesterRoles.splice(index, 1);
            renderSelectedRoles('tester');
        }
    } else if (type === 'teamMember') {
        const index = selectedTeamMemberRoles.indexOf(role);
        if (index > -1) {
            selectedTeamMemberRoles.splice(index, 1);
            renderSelectedRoles('teamMember');
        }
    }
}

// Show add modals
function showAddPortfolioModal() {
    document.getElementById('portfolioModalTitle').textContent = 'Add Portfolio';
    document.getElementById('portfolioName').value = '';
    document.getElementById('portfolioDescription').value = '';
    showModal('portfolioModal');
}

function showAddProjectModal() {
    document.getElementById('projectModalTitle').textContent = 'Add Project';
    document.getElementById('projectName').value = '';
    document.getElementById('projectDescription').value = '';
    updateProjectPortfolioDropdown();
    showModal('projectModal');
}

function showAddTesterModal() {
    document.getElementById('testerModalTitle').textContent = 'Add Tester';
    document.getElementById('testerName').value = '';
    document.getElementById('testerEmail').value = '';
    selectedTesterRoles = [];
    renderSelectedRoles('tester');
    showModal('testerModal');
}

function showAddTeamMemberModal() {
    document.getElementById('teamMemberModalTitle').textContent = 'Add Team Member';
    document.getElementById('teamMemberName').value = '';
    document.getElementById('teamMemberEmail').value = '';
    selectedTeamMemberRoles = [];
    renderSelectedRoles('teamMember');
    showModal('teamMemberModal');
}

// Edit functions
function editPortfolio(id) {
    const portfolio = portfolios.find(p => p.id === id);
    if (!portfolio) return;

    editingId = id;
    editingType = 'portfolio';
    
    document.getElementById('portfolioModalTitle').textContent = 'Edit Portfolio';
    document.getElementById('portfolioName').value = portfolio.name;
    document.getElementById('portfolioDescription').value = portfolio.description || '';
    
    showModal('portfolioModal');
}

function editProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    editingId = id;
    editingType = 'project';
    
    document.getElementById('projectModalTitle').textContent = 'Edit Project';
    document.getElementById('projectName').value = project.name;
    document.getElementById('projectDescription').value = project.description || '';
    
    updateProjectPortfolioDropdown();
    document.getElementById('projectPortfolio').value = project.portfolio_id;
    
    showModal('projectModal');
}

function editTester(id) {
    const tester = testers.find(t => t.id === id);
    if (!tester) return;

    editingId = id;
    editingType = 'tester';
    
    document.getElementById('testerModalTitle').textContent = 'Edit Tester';
    document.getElementById('testerName').value = tester.name;
    document.getElementById('testerEmail').value = tester.email;
    
    selectedTesterRoles = Array.isArray(tester.roles) ? [...tester.roles] : (tester.role ? [tester.role] : []);
    renderSelectedRoles('tester');
    
    showModal('testerModal');
}

function editTeamMember(id) {
    const teamMember = teamMembers.find(tm => tm.id === id);
    if (!teamMember) return;

    editingId = id;
    editingType = 'teamMember';
    
    document.getElementById('teamMemberModalTitle').textContent = 'Edit Team Member';
    document.getElementById('teamMemberName').value = teamMember.name;
    document.getElementById('teamMemberEmail').value = teamMember.email;
    
    selectedTeamMemberRoles = Array.isArray(teamMember.roles) ? [...teamMember.roles] : (teamMember.role ? [teamMember.role] : []);
    renderSelectedRoles('teamMember');
    
    showModal('teamMemberModal');
}

// Save functions
async function savePortfolio() {
    const name = document.getElementById('portfolioName').value.trim();
    const description = document.getElementById('portfolioDescription').value.trim();

    if (!name) {
        showToast('Portfolio name is required', 'error');
        return;
    }

    try {
        const data = { name, description };
        await saveData('portfolios', data);
        closeModal('portfolioModal');
        showToast('Portfolio saved successfully', 'success');
    } catch (error) {
        console.error('Error saving portfolio:', error);
        showToast('Error saving portfolio', 'error');
    }
}

async function saveProject() {
    const name = document.getElementById('projectName').value.trim();
    const portfolio_id = document.getElementById('projectPortfolio').value;
    const description = document.getElementById('projectDescription').value.trim();

    if (!name) {
        showToast('Project name is required', 'error');
        return;
    }

    if (!portfolio_id) {
        showToast('Portfolio is required', 'error');
        return;
    }

    try {
        const data = { name, portfolio_id: parseInt(portfolio_id), description };
        await saveData('projects', data);
        closeModal('projectModal');
        showToast('Project saved successfully', 'success');
    } catch (error) {
        console.error('Error saving project:', error);
        showToast('Error saving project', 'error');
    }
}

async function saveTester() {
    const name = document.getElementById('testerName').value.trim();
    const email = document.getElementById('testerEmail').value.trim();

    if (!name) {
        showToast('Tester name is required', 'error');
        return;
    }

    if (!email) {
        showToast('Tester email is required', 'error');
        return;
    }

    if (selectedTesterRoles.length === 0) {
        showToast('At least one role is required', 'error');
        return;
    }

    try {
        const data = { name, email, roles: selectedTesterRoles };
        await saveData('testers', data);
        closeModal('testerModal');
        showToast('Tester saved successfully', 'success');
    } catch (error) {
        console.error('Error saving tester:', error);
        showToast('Error saving tester', 'error');
    }
}

async function saveTeamMember() {
    const name = document.getElementById('teamMemberName').value.trim();
    const email = document.getElementById('teamMemberEmail').value.trim();

    if (!name) {
        showToast('Team member name is required', 'error');
        return;
    }

    if (!email) {
        showToast('Team member email is required', 'error');
        return;
    }

    if (selectedTeamMemberRoles.length === 0) {
        showToast('At least one role is required', 'error');
        return;
    }

    try {
        const data = { name, email, roles: selectedTeamMemberRoles };
        await saveData('team-members', data);
        closeModal('teamMemberModal');
        showToast('Team member saved successfully', 'success');
    } catch (error) {
        console.error('Error saving team member:', error);
        showToast('Error saving team member', 'error');
    }
}

// Generic save function
async function saveData(type, data) {
    const url = editingId ? `/api/${type}/${editingId}` : `/api/${type}`;
    const method = editingId ? 'PUT' : 'POST';

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    await loadAllData();
    renderAllData();
}

// Delete functions
async function deletePortfolio(id) {
    await deleteItem('portfolios', id);
}

async function deleteProject(id) {
    await deleteItem('projects', id);
}

async function deleteTester(id) {
    await deleteItem('testers', id);
}

async function deleteTeamMember(id) {
    await deleteItem('team-members', id);
}

async function deleteItem(type, id) {
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }

    try {
        const response = await fetch(`/api/${type}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        await loadAllData();
        renderAllData();
        showToast('Item deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting item:', error);
        showToast('Error deleting item', 'error');
    }
}

// Toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);