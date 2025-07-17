// Manage Data Application
class ManageDataApp {
    constructor() {
        this.data = {
            portfolios: [],
            projects: [],
            testers: [],
            teamMembers: []
        };
        this.editingId = null;
        this.editingType = null;
        
        // Define roles
        this.testerRoles = [
            'Manual Tester',
            'Automation Tester', 
            'Performance Tester',
            'Quality Manager',
            'Quality Team Lead',
            'Quality Assurance Lead',
            'Security Analyst'
        ];
        
        this.teamMemberRoles = [
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
        
        this.selectedRoles = {
            tester: [],
            teamMember: []
        };
    }

    // Initialize the application
    async init() {
        this.setupEventListeners();
        this.populateRoleSelects();
        await this.loadAllData();
        this.renderAll();
    }

    // Setup event listeners
    setupEventListeners() {
        // Multi-select role handling
        this.setupMultiSelect('testerRoles', 'selectedTesterRoles', 'tester');
        this.setupMultiSelect('teamMemberRoles', 'selectedTeamMemberRoles', 'teamMember');
    }

    // Setup multi-select functionality
    setupMultiSelect(selectId, containerId, type) {
        const select = document.getElementById(selectId);
        const container = document.getElementById(containerId);
        
        select.addEventListener('change', (e) => {
            const selectedOption = e.target.value;
            if (selectedOption && !this.selectedRoles[type].includes(selectedOption)) {
                this.selectedRoles[type].push(selectedOption);
                this.renderSelectedRoles(type);
            }
            e.target.value = '';
        });
    }

    // Populate role select elements
    populateRoleSelects() {
        // Populate tester roles
        const testerSelect = document.getElementById('testerRoles');
        testerSelect.innerHTML = '<option value="">Select a role...</option>';
        this.testerRoles.forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            testerSelect.appendChild(option);
        });

        // Populate team member roles
        const teamMemberSelect = document.getElementById('teamMemberRoles');
        teamMemberSelect.innerHTML = '<option value="">Select a role...</option>';
        this.teamMemberRoles.forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            teamMemberSelect.appendChild(option);
        });

        // Populate filter selects
        this.populateFilterSelects();
    }

    // Populate filter selects
    populateFilterSelects() {
        // Tester role filter
        const testerRoleFilter = document.getElementById('testerRoleFilter');
        testerRoleFilter.innerHTML = '<option value="">All Roles</option>';
        this.testerRoles.forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            testerRoleFilter.appendChild(option);
        });

        // Team member role filter
        const teamMemberRoleFilter = document.getElementById('teamMemberRoleFilter');
        teamMemberRoleFilter.innerHTML = '<option value="">All Roles</option>';
        this.teamMemberRoles.forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            teamMemberRoleFilter.appendChild(option);
        });

        // Portfolio filter (populated after loading data)
        this.populatePortfolioFilter();
    }

    // Populate portfolio filter
    populatePortfolioFilter() {
        const portfolioFilter = document.getElementById('portfolioFilter');
        portfolioFilter.innerHTML = '<option value="">All Portfolios</option>';
        this.data.portfolios.forEach(portfolio => {
            const option = document.createElement('option');
            option.value = portfolio.id;
            option.textContent = portfolio.name;
            portfolioFilter.appendChild(option);
        });
    }

    // Render selected roles
    renderSelectedRoles(type) {
        const containerId = type === 'tester' ? 'selectedTesterRoles' : 'selectedTeamMemberRoles';
        const container = document.getElementById(containerId);
        
        container.innerHTML = '';
        this.selectedRoles[type].forEach(role => {
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
    removeSelectedRole(type, role) {
        const index = this.selectedRoles[type].indexOf(role);
        if (index > -1) {
            this.selectedRoles[type].splice(index, 1);
            this.renderSelectedRoles(type);
        }
    }

    // Load all data from API
    async loadAllData() {
        try {
            const [portfolios, projects, testers, teamMembers] = await Promise.all([
                this.fetchData('/api/portfolios'),
                this.fetchData('/api/projects'),
                this.fetchData('/api/testers'),
                this.fetchData('/api/team-members')
            ]);

            this.data.portfolios = portfolios;
            this.data.projects = projects;
            this.data.testers = testers;
            this.data.teamMembers = teamMembers;

            // Populate project portfolio dropdown
            this.populateProjectPortfolioDropdown();
            this.populatePortfolioFilter();

        } catch (error) {
            console.error('Error loading data:', error);
            this.showToast('Error loading data', 'error');
        }
    }

    // Fetch data from API
    async fetchData(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    // Populate project portfolio dropdown
    populateProjectPortfolioDropdown() {
        const select = document.getElementById('projectPortfolio');
        select.innerHTML = '<option value="">Select Portfolio</option>';
        this.data.portfolios.forEach(portfolio => {
            const option = document.createElement('option');
            option.value = portfolio.id;
            option.textContent = portfolio.name;
            select.appendChild(option);
        });
    }

    // Render all data
    renderAll() {
        this.displayPortfolios();
        this.displayProjects();
        this.displayTesters();
        this.displayTeamMembers();
    }

    // Display portfolios
    displayPortfolios() {
        const searchTerm = document.getElementById('portfolioSearch').value.toLowerCase();
        let filtered = this.data.portfolios;

        if (searchTerm) {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(searchTerm) ||
                (p.description && p.description.toLowerCase().includes(searchTerm))
            );
        }

        this.renderList('portfolioList', filtered, this.renderPortfolio.bind(this), 'No portfolios found');
    }

    // Display projects
    displayProjects() {
        const searchTerm = document.getElementById('projectSearch').value.toLowerCase();
        const portfolioFilter = document.getElementById('portfolioFilter').value;
        let filtered = this.data.projects;

        if (searchTerm) {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(searchTerm) ||
                (p.description && p.description.toLowerCase().includes(searchTerm))
            );
        }

        if (portfolioFilter) {
            filtered = filtered.filter(p => p.portfolio_id == portfolioFilter);
        }

        this.renderList('projectList', filtered, this.renderProject.bind(this), 'No projects found');
    }

    // Display testers
    displayTesters() {
        const searchTerm = document.getElementById('testerSearch').value.toLowerCase();
        const roleFilter = document.getElementById('testerRoleFilter').value;
        let filtered = this.data.testers;

        if (searchTerm) {
            filtered = filtered.filter(t => 
                t.name.toLowerCase().includes(searchTerm) ||
                t.email.toLowerCase().includes(searchTerm) ||
                (t.roles && t.roles.some(role => role.toLowerCase().includes(searchTerm)))
            );
        }

        if (roleFilter) {
            filtered = filtered.filter(t => t.roles && t.roles.includes(roleFilter));
        }

        this.renderList('testerList', filtered, this.renderTester.bind(this), 'No testers found');
    }

    // Display team members
    displayTeamMembers() {
        const searchTerm = document.getElementById('teamMemberSearch').value.toLowerCase();
        const roleFilter = document.getElementById('teamMemberRoleFilter').value;
        let filtered = this.data.teamMembers;

        if (searchTerm) {
            filtered = filtered.filter(tm => 
                tm.name.toLowerCase().includes(searchTerm) ||
                tm.email.toLowerCase().includes(searchTerm) ||
                (tm.roles && tm.roles.some(role => role.toLowerCase().includes(searchTerm)))
            );
        }

        if (roleFilter) {
            filtered = filtered.filter(tm => tm.roles && tm.roles.includes(roleFilter));
        }

        this.renderList('teamMemberList', filtered, this.renderTeamMember.bind(this), 'No team members found');
    }

    // Render list
    renderList(containerId, data, renderer, emptyMessage) {
        const container = document.getElementById(containerId);
        
        if (data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>${emptyMessage}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.map(renderer).join('');
    }

    // Render portfolio
    renderPortfolio(portfolio) {
        const projectCount = this.data.projects.filter(p => p.portfolio_id === portfolio.id).length;
        
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

    // Render project
    renderProject(project) {
        const portfolio = this.data.portfolios.find(p => p.id === project.portfolio_id);
        
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

    // Render tester
    renderTester(tester) {
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

    // Render team member
    renderTeamMember(teamMember) {
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
    showModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        this.resetForm(modalId);
    }

    resetForm(modalId) {
        this.editingId = null;
        this.editingType = null;
        this.selectedRoles.tester = [];
        this.selectedRoles.teamMember = [];
        
        // Reset form fields
        const modal = document.getElementById(modalId);
        const inputs = modal.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.type !== 'button' && input.type !== 'submit') {
                input.value = '';
            }
        });
        
        // Clear selected roles display
        const selectedRoleContainers = modal.querySelectorAll('.selected-roles');
        selectedRoleContainers.forEach(container => {
            container.innerHTML = '';
        });
    }

    // Show add modals
    showAddPortfolioModal() {
        document.getElementById('portfolioModalTitle').textContent = 'Add Portfolio';
        this.showModal('portfolioModal');
    }

    showAddProjectModal() {
        document.getElementById('projectModalTitle').textContent = 'Add Project';
        this.populateProjectPortfolioDropdown();
        this.showModal('projectModal');
    }

    showAddTesterModal() {
        document.getElementById('testerModalTitle').textContent = 'Add Tester';
        this.selectedRoles.tester = [];
        this.renderSelectedRoles('tester');
        this.showModal('testerModal');
    }

    showAddTeamMemberModal() {
        document.getElementById('teamMemberModalTitle').textContent = 'Add Team Member';
        this.selectedRoles.teamMember = [];
        this.renderSelectedRoles('teamMember');
        this.showModal('teamMemberModal');
    }

    // Edit functions
    editPortfolio(id) {
        const portfolio = this.data.portfolios.find(p => p.id === id);
        if (!portfolio) return;

        this.editingId = id;
        this.editingType = 'portfolio';
        
        document.getElementById('portfolioModalTitle').textContent = 'Edit Portfolio';
        document.getElementById('portfolioName').value = portfolio.name;
        document.getElementById('portfolioDescription').value = portfolio.description || '';
        
        this.showModal('portfolioModal');
    }

    editProject(id) {
        const project = this.data.projects.find(p => p.id === id);
        if (!project) return;

        this.editingId = id;
        this.editingType = 'project';
        
        document.getElementById('projectModalTitle').textContent = 'Edit Project';
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectDescription').value = project.description || '';
        
        this.populateProjectPortfolioDropdown();
        document.getElementById('projectPortfolio').value = project.portfolio_id;
        
        this.showModal('projectModal');
    }

    editTester(id) {
        const tester = this.data.testers.find(t => t.id === id);
        if (!tester) return;

        this.editingId = id;
        this.editingType = 'tester';
        
        document.getElementById('testerModalTitle').textContent = 'Edit Tester';
        document.getElementById('testerName').value = tester.name;
        document.getElementById('testerEmail').value = tester.email;
        
        // Handle roles (backward compatibility)
        this.selectedRoles.tester = Array.isArray(tester.roles) ? [...tester.roles] : (tester.role ? [tester.role] : []);
        this.renderSelectedRoles('tester');
        
        this.showModal('testerModal');
    }

    editTeamMember(id) {
        const teamMember = this.data.teamMembers.find(tm => tm.id === id);
        if (!teamMember) return;

        this.editingId = id;
        this.editingType = 'teamMember';
        
        document.getElementById('teamMemberModalTitle').textContent = 'Edit Team Member';
        document.getElementById('teamMemberName').value = teamMember.name;
        document.getElementById('teamMemberEmail').value = teamMember.email;
        
        // Handle roles (backward compatibility)
        this.selectedRoles.teamMember = Array.isArray(teamMember.roles) ? [...teamMember.roles] : (teamMember.role ? [teamMember.role] : []);
        this.renderSelectedRoles('teamMember');
        
        this.showModal('teamMemberModal');
    }

    // Save functions
    async savePortfolio() {
        const name = document.getElementById('portfolioName').value.trim();
        const description = document.getElementById('portfolioDescription').value.trim();

        if (!name) {
            this.showToast('Portfolio name is required', 'error');
            return;
        }

        const data = { name, description };

        try {
            await this.saveData('portfolios', data);
            this.closeModal('portfolioModal');
            this.showToast('Portfolio saved successfully', 'success');
        } catch (error) {
            console.error('Error saving portfolio:', error);
            this.showToast('Error saving portfolio', 'error');
        }
    }

    async saveProject() {
        const name = document.getElementById('projectName').value.trim();
        const portfolio_id = document.getElementById('projectPortfolio').value;
        const description = document.getElementById('projectDescription').value.trim();

        if (!name) {
            this.showToast('Project name is required', 'error');
            return;
        }

        if (!portfolio_id) {
            this.showToast('Portfolio is required', 'error');
            return;
        }

        const data = { name, portfolio_id: parseInt(portfolio_id), description };

        try {
            await this.saveData('projects', data);
            this.closeModal('projectModal');
            this.showToast('Project saved successfully', 'success');
        } catch (error) {
            console.error('Error saving project:', error);
            this.showToast('Error saving project', 'error');
        }
    }

    async saveTester() {
        const name = document.getElementById('testerName').value.trim();
        const email = document.getElementById('testerEmail').value.trim();
        const roles = [...this.selectedRoles.tester];

        if (!name) {
            this.showToast('Tester name is required', 'error');
            return;
        }

        if (!email) {
            this.showToast('Tester email is required', 'error');
            return;
        }

        if (roles.length === 0) {
            this.showToast('At least one role is required', 'error');
            return;
        }

        const data = { name, email, roles };

        try {
            await this.saveData('testers', data);
            this.closeModal('testerModal');
            this.showToast('Tester saved successfully', 'success');
        } catch (error) {
            console.error('Error saving tester:', error);
            this.showToast('Error saving tester', 'error');
        }
    }

    async saveTeamMember() {
        const name = document.getElementById('teamMemberName').value.trim();
        const email = document.getElementById('teamMemberEmail').value.trim();
        const roles = [...this.selectedRoles.teamMember];

        if (!name) {
            this.showToast('Team member name is required', 'error');
            return;
        }

        if (!email) {
            this.showToast('Team member email is required', 'error');
            return;
        }

        if (roles.length === 0) {
            this.showToast('At least one role is required', 'error');
            return;
        }

        const data = { name, email, roles };

        try {
            await this.saveData('team-members', data);
            this.closeModal('teamMemberModal');
            this.showToast('Team member saved successfully', 'success');
        } catch (error) {
            console.error('Error saving team member:', error);
            this.showToast('Error saving team member', 'error');
        }
    }

    // Generic save data function
    async saveData(type, data) {
        const url = this.editingId ? `/api/${type}/${this.editingId}` : `/api/${type}`;
        const method = this.editingId ? 'PUT' : 'POST';

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

        await this.loadAllData();
        this.renderAll();
    }

    // Delete function
    async deleteItem(type, id) {
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

            await this.loadAllData();
            this.renderAll();
            this.showToast('Item deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting item:', error);
            this.showToast('Error deleting item', 'error');
        }
    }

    // Toast notification
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
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
}

// Create global instance
const manageDataAppInstance = new ManageDataApp();

// Global functions for onclick handlers
window.showAddPortfolioModal = () => manageDataAppInstance.showAddPortfolioModal();
window.showAddProjectModal = () => manageDataAppInstance.showAddProjectModal();
window.showAddTesterModal = () => manageDataAppInstance.showAddTesterModal();
window.showAddTeamMemberModal = () => manageDataAppInstance.showAddTeamMemberModal();

window.savePortfolio = () => manageDataAppInstance.savePortfolio();
window.saveProject = () => manageDataAppInstance.saveProject();
window.saveTester = () => manageDataAppInstance.saveTester();
window.saveTeamMember = () => manageDataAppInstance.saveTeamMember();

window.displayPortfolios = () => manageDataAppInstance.displayPortfolios();
window.displayProjects = () => manageDataAppInstance.displayProjects();
window.displayTesters = () => manageDataAppInstance.displayTesters();
window.displayTeamMembers = () => manageDataAppInstance.displayTeamMembers();

window.closeModal = (modalId) => manageDataAppInstance.closeModal(modalId);

// Edit functions
window.editPortfolio = (id) => manageDataAppInstance.editPortfolio(id);
window.editProject = (id) => manageDataAppInstance.editProject(id);
window.editTester = (id) => manageDataAppInstance.editTester(id);
window.editTeamMember = (id) => manageDataAppInstance.editTeamMember(id);

// Delete functions
window.deletePortfolio = (id) => manageDataAppInstance.deleteItem('portfolios', id);
window.deleteProject = (id) => manageDataAppInstance.deleteItem('projects', id);
window.deleteTester = (id) => manageDataAppInstance.deleteItem('testers', id);
window.deleteTeamMember = (id) => manageDataAppInstance.deleteItem('team-members', id);

// Role management functions
window.removeSelectedRole = (type, role) => {
    manageDataAppInstance.removeSelectedRole(type, role);
};

// Export for use in HTML
window.ManageDataApp = manageDataAppInstance;