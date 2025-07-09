// static/manage_data.js
let portfolios = [];
let projects = [];
let testers = [];
let teamMembers = [];
let editingId = null;
let editingType = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    await loadAllData();
    updateStats();
    renderAllLists();
});

// Tab Management
function showTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    // Load data for the selected tab if needed
    if (tabName === 'projects') {
        populatePortfolioFilter();
    }
}

// Data Loading
async function loadAllData() {
    try {
        const response = await fetch('/api/form-data');
        if (response.ok) {
            const data = await response.json();
            portfolios = data.portfolios || [];
            projects = data.projects || [];
            testers = data.testers || [];
            teamMembers = data.team_members || [];
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Statistics Updates
function updateStats() {
    document.getElementById('totalPortfolios').textContent = portfolios.length;
    document.getElementById('totalProjects').textContent = projects.length;
    document.getElementById('totalTesters').textContent = testers.length;
    document.getElementById('totalTeamMembers').textContent = teamMembers.length;
    
    // Team member role counts
    document.getElementById('projectOwners').textContent = teamMembers.filter(tm => tm.role === 'Project Owner').length;
    document.getElementById('projectAnalysts').textContent = teamMembers.filter(tm => tm.role === 'Project Analyst').length;
    document.getElementById('projectManagers').textContent = teamMembers.filter(tm => tm.role === 'Project Manager').length;
}

// Render Functions
function renderAllLists() {
    renderPortfolios();
    renderProjects();
    renderTesters();
    renderTeamMembers();
}

function renderPortfolios() {
    const container = document.getElementById('portfoliosList');
    if (portfolios.length === 0) {
        container.innerHTML = `
            <div class="empty-data-state">
                <div class="icon">📁</div>
                <h3>No Portfolios Found</h3>
                <p>Create your first portfolio to get started.</p>
                <button class="action-btn" onclick="showAddPortfolioModal()">+ Add Portfolio</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = portfolios.map(portfolio => `
        <div class="data-item portfolio">
            <div class="data-item-header">
                <h3 class="data-item-title">${portfolio.name}</h3>
                <div class="data-item-actions">
                    <button class="btn-edit" onclick="editPortfolio(${portfolio.id})">Edit</button>
                    <button class="btn-delete" onclick="deletePortfolio(${portfolio.id})">Delete</button>
                </div>
            </div>
            <div class="data-item-content">
                <p>${portfolio.description || 'No description provided'}</p>
                <div class="project-count">
                    ${projects.filter(p => p.portfolio_id === portfolio.id).length} Projects
                </div>
            </div>
        </div>
    `).join('');
}

function renderProjects() {
    const container = document.getElementById('projectsList');
    if (projects.length === 0) {
        container.innerHTML = `
            <div class="empty-data-state">
                <div class="icon">🚀</div>
                <h3>No Projects Found</h3>
                <p>Create your first project to get started.</p>
                <button class="action-btn" onclick="showAddProjectModal()">+ Add Project</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = projects.map(project => {
        const portfolio = portfolios.find(p => p.id === project.portfolio_id);
        return `
            <div class="data-item project">
                <div class="data-item-header">
                    <h3 class="data-item-title">${project.name}</h3>
                    <div class="data-item-actions">
                        <button class="btn-edit" onclick="editProject(${project.id})">Edit</button>
                        <button class="btn-delete" onclick="deleteProject(${project.id})">Delete</button>
                    </div>
                </div>
                <div class="data-item-content">
                    <p><strong>Portfolio:</strong> ${portfolio ? portfolio.name : 'Unknown'}</p>
                    <p>${project.description || 'No description provided'}</p>
                </div>
            </div>
        `;
    }).join('');
}

function renderTesters() {
    const container = document.getElementById('testersList');
    if (testers.length === 0) {
        container.innerHTML = `
            <div class="empty-data-state">
                <div class="icon">🧪</div>
                <h3>No Testers Found</h3>
                <p>Add testers to your system.</p>
                <button class="action-btn" onclick="showAddTesterModal()">+ Add Tester</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = testers.map(tester => `
        <div class="data-item tester">
            <div class="data-item-header">
                <h3 class="data-item-title">${tester.name}</h3>
                <div class="data-item-actions">
                    <button class="btn-edit" onclick="editTester(${tester.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteTester(${tester.id})">Delete</button>
                </div>
            </div>
            <div class="data-item-content">
                <p><strong>Email:</strong> ${tester.email}</p>
            </div>
        </div>
    `).join('');
}

function renderTeamMembers() {
    const container = document.getElementById('teamMembersList');
    if (teamMembers.length === 0) {
        container.innerHTML = `
            <div class="empty-data-state">
                <div class="icon">👥</div>
                <h3>No Team Members Found</h3>
                <p>Add team members to your system.</p>
                <button class="action-btn" onclick="showAddTeamMemberModal()">+ Add Team Member</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = teamMembers.map(member => `
        <div class="data-item team-member">
            <div class="data-item-header">
                <h3 class="data-item-title">${member.name}</h3>
                <div class="data-item-actions">
                    <button class="btn-edit" onclick="editTeamMember(${member.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteTeamMember(${member.id})">Delete</button>
                </div>
            </div>
            <div class="data-item-content">
                <p><strong>Email:</strong> ${member.email}</p>
                <span class="role-badge ${member.role.toLowerCase().replace(/\s+/g, '-')}">${member.role}</span>
            </div>
        </div>
    `).join('');
}

// Modal Functions
function showAddPortfolioModal() {
    editingId = null;
    editingType = 'portfolio';
    document.getElementById('portfolioName').value = '';
    document.getElementById('portfolioDescription').value = '';
    showModal('addPortfolioModal');
}

function showAddProjectModal() {
    editingId = null;
    editingType = 'project';
    document.getElementById('projectName').value = '';
    document.getElementById('projectDescription').value = '';
    populatePortfolioDropdown();
    showModal('addProjectModal');
}

function showAddTesterModal() {
    editingId = null;
    editingType = 'tester';
    document.getElementById('testerName').value = '';
    document.getElementById('testerEmail').value = '';
    showModal('addTesterModal');
}

function showAddTeamMemberModal() {
    editingId = null;
    editingType = 'teamMember';
    document.getElementById('teamMemberName').value = '';
    document.getElementById('teamMemberEmail').value = '';
    document.getElementById('teamMemberRole').value = '';
    showModal('addTeamMemberModal');
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Helper Functions
function populatePortfolioDropdown(portfolios) {
    const select = document.getElementById('portfolioName');
    // Keep existing static options
    const existingOptions = Array.from(select.options).map(opt => ({ value: opt.value, text: opt.text }));
    
    // Clear and rebuild
    select.innerHTML = '<option value="">Select Portfolio</option>';
    
    // Add existing static options
    existingOptions.slice(1).forEach(opt => {
        if (opt.value) {
            select.innerHTML += `<option value="${opt.value}">${opt.text}</option>`;
        }
    });
    
    // Add dynamic portfolios
    portfolios.forEach(portfolio => {
        select.innerHTML += `<option value="${portfolio.name.toLowerCase().replace(/\s+/g, '-')}">${portfolio.name}</option>`;
    });
}

// QA Notes custom fields management
let qaNotesFields = [];

function showAddQANoteFieldModal() {
    document.getElementById('qaFieldName').value = '';
    document.getElementById('qaFieldType').value = 'input';
    document.getElementById('qaFieldRequired').checked = false;
    document.getElementById('qaFieldShowInReport').checked = true;
    document.getElementById('qaFieldOptionsList').value = '';
    updateQAFieldOptions();
    showModal('addQANoteFieldModal');
}

function updateQAFieldOptions() {
    const type = document.getElementById('qaFieldType').value;
    const optionsDiv = document.getElementById('qaFieldOptions');
    
    if (type === 'select' || type === 'radio' || type === 'checkbox') {
        optionsDiv.style.display = 'block';
    } else {
        optionsDiv.style.display = 'none';
    }
}

function addQANoteField() {
    const name = document.getElementById('qaFieldName').value.trim();
    const type = document.getElementById('qaFieldType').value;
    const required = document.getElementById('qaFieldRequired').checked;
    const showInReport = document.getElementById('qaFieldShowInReport').checked;
    const optionsList = document.getElementById('qaFieldOptionsList').value.trim();
    
    if (!name) {
        showToast('Please enter a field name', 'warning');
        return;
    }
    
    const options = (type === 'select' || type === 'radio' || type === 'checkbox') && optionsList 
        ? optionsList.split('\n').map(opt => opt.trim()).filter(opt => opt)
        : [];
    
    const qaField = {
        id: `qa_note_${Date.now()}`,
        name,
        type,
        required,
        showInReport,
        options,
        value: type === 'checkbox' ? [] : ''
    };
    
    qaNotesFields.push(qaField);
    renderQANotesFields();
    closeModal('addQANoteFieldModal');
    showToast('QA note field added successfully!', 'success');
}

function renderQANotesFields() {
    const container = document.getElementById('qaNotesFieldsList');
    if (!container) return;
    
    // Find the default general notes field
    const defaultField = container.querySelector('.custom-field-item');
    
    // Remove existing custom fields (keep default)
    const customFields = container.querySelectorAll('.qa-field-item');
    customFields.forEach(field => field.remove());
    
    // Add new custom fields
    qaNotesFields.forEach(field => {
        const fieldHTML = renderQANoteFieldHTML(field);
        if (defaultField) {
            defaultField.insertAdjacentHTML('afterend', fieldHTML);
        } else {
            container.innerHTML += fieldHTML;
        }
    });
}

function renderQANoteFieldHTML(field) {
    let inputHTML = '';
    
    switch (field.type) {
        case 'input':
            inputHTML = `<input type="text" id="${field.id}" name="${field.id}" placeholder="Enter ${field.name.toLowerCase()}" ${field.required ? 'required' : ''}>`;
            break;
        case 'textarea':
            inputHTML = `<textarea id="${field.id}" name="${field.id}" placeholder="Enter ${field.name.toLowerCase()}" rows="4" ${field.required ? 'required' : ''}></textarea>`;
            break;
        case 'number':
            inputHTML = `<input type="number" id="${field.id}" name="${field.id}" placeholder="Enter ${field.name.toLowerCase()}" ${field.required ? 'required' : ''}>`;
            break;
        case 'date':
            inputHTML = `<input type="date" id="${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>`;
            break;
        case 'select':
            inputHTML = `
                <select id="${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>
                    <option value="">Select ${field.name}</option>
                    ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                </select>
            `;
            break;
        case 'radio':
            inputHTML = field.options.map((opt, index) => `
                <label class="radio-option">
                    <input type="radio" name="${field.id}" value="${opt}" ${field.required && index === 0 ? 'required' : ''}>
                    ${opt}
                </label>
            `).join('');
            break;
        case 'checkbox':
            inputHTML = field.options.map(opt => `
                <label class="checkbox-option">
                    <input type="checkbox" name="${field.id}" value="${opt}">
                    ${opt}
                </label>
            `).join('');
            break;
    }
    
    return `
        <div class="qa-field-item">
            <div class="custom-field-header">
                <h4>${field.name}</h4>
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
    `;
}

function removeQANoteField(fieldId) {
    qaNotesFields = qaNotesFields.filter(field => field.id !== fieldId);
    renderQANotesFields();
    showToast('QA note field removed', 'info');
}

function populatePortfolioFilter() {
    const select = document.getElementById('portfolioFilter');
    select.innerHTML = '<option value="">All Portfolios</option>';
    portfolios.forEach(portfolio => {
        select.innerHTML += `<option value="${portfolio.id}">${portfolio.name}</option>`;
    });
}

function populateProjectDropdown(projects) {
    const select = document.getElementById('projectName');
    // Keep existing static options
    const existingOptions = Array.from(select.options).map(opt => ({ value: opt.value, text: opt.text }));
    
    select.innerHTML = '<option value="">Select Project</option>';
    
    // Add existing static options
    existingOptions.slice(1).forEach(opt => {
        if (opt.value) {
            select.innerHTML += `<option value="${opt.value}">${opt.text}</option>`;
        }
    });
    
    // Add dynamic projects
    projects.forEach(project => {
        select.innerHTML += `<option value="${project.name.toLowerCase().replace(/\s+/g, '-')}">${project.name}</option>`;
    });
}

// CRUD Operations (placeholder functions - you'll need to implement these)
async function savePortfolio() {
    const name = document.getElementById('portfolioName').value.trim();
    const description = document.getElementById('portfolioDescription').value.trim();
    
    if (!name) {
        alert('Please enter a portfolio name');
        return;
    }
    
    // TODO: Implement API call
    console.log('Saving portfolio:', { name, description });
    closeModal('addPortfolioModal');
}

async function saveProject() {
    const name = document.getElementById('projectName').value.trim();
    const portfolioId = document.getElementById('projectPortfolio').value;
    const description = document.getElementById('projectDescription').value.trim();
    
    if (!name || !portfolioId) {
        alert('Please enter project name and select a portfolio');
        return;
    }
    
    // TODO: Implement API call
    console.log('Saving project:', { name, portfolioId, description });
    closeModal('addProjectModal');
}

async function saveTester() {
    const name = document.getElementById('testerName').value.trim();
    const email = document.getElementById('testerEmail').value.trim();
    
    if (!name || !email) {
        alert('Please enter both name and email');
        return;
    }
    
    // TODO: Implement API call
    console.log('Saving tester:', { name, email });
    closeModal('addTesterModal');
}

async function saveTeamMember() {
    const name = document.getElementById('teamMemberName').value.trim();
    const email = document.getElementById('teamMemberEmail').value.trim();
    const role = document.getElementById('teamMemberRole').value;
    
    if (!name || !email || !role) {
        alert('Please fill in all fields');
        return;
    }
    
    // TODO: Implement API call
    console.log('Saving team member:', { name, email, role });
    closeModal('addTeamMemberModal');
}

// Search Functions (placeholder)
function searchPortfolios() {
    // TODO: Implement search functionality
}

function searchProjects() {
    // TODO: Implement search functionality
}

function searchTesters() {
    // TODO: Implement search functionality
}

function searchTeamMembers() {
    // TODO: Implement search functionality
}

// Edit Functions (placeholder)
function editPortfolio(id) {
    // TODO: Implement edit functionality
}

function editProject(id) {
    // TODO: Implement edit functionality
}

function editTester(id) {
    // TODO: Implement edit functionality
}

function editTeamMember(id) {
    // TODO: Implement edit functionality
}

// Delete Functions (placeholder)
function deletePortfolio(id) {
    if (confirm('Are you sure you want to delete this portfolio?')) {
        // TODO: Implement delete functionality
    }
}

function deleteProject(id) {
    if (confirm('Are you sure you want to delete this project?')) {
        // TODO: Implement delete functionality
    }
}

function deleteTester(id) {
    if (confirm('Are you sure you want to delete this tester?')) {
        // TODO: Implement delete functionality
    }
}

function deleteTeamMember(id) {
    if (confirm('Are you sure you want to delete this team member?')) {
        // TODO: Implement delete functionality
    }
}

// Modal close on outside click
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}