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
    console.log('loadAllData called');
    try {
        console.log('Fetching data from /api/form-data');
        const response = await fetch('/api/form-data');
        console.log('Response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Raw data received:', data);

            portfolios = data.portfolios || [];
            projects = data.projects || [];
            testers = data.testers || [];
            teamMembers = data.team_members || [];

            console.log('Data loaded successfully:', {
                portfolios: portfolios.length,
                projects: projects.length,
                testers: testers.length,
                teamMembers: teamMembers.length
            });
            console.log('Portfolios data:', portfolios);
        } else {
            console.error('Failed to load data:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error response:', errorText);
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
    displayPortfolios();
    displayProjects();
    displayTesters();
    displayTeamMembers();
}

// Display functions with search functionality
function displayPortfolios() {
    const searchTerm = document.getElementById('portfolioSearch')?.value.toLowerCase() || '';
    const filteredPortfolios = portfolios.filter(portfolio =>
        portfolio.name.toLowerCase().includes(searchTerm) ||
        (portfolio.description && portfolio.description.toLowerCase().includes(searchTerm))
    );
    renderPortfolios(filteredPortfolios);
}

function displayProjects() {
    const searchTerm = document.getElementById('projectSearch')?.value.toLowerCase() || '';
    const portfolioFilter = document.getElementById('portfolioFilter')?.value || '';

    let filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm) ||
        (project.description && project.description.toLowerCase().includes(searchTerm))
    );

    if (portfolioFilter) {
        filteredProjects = filteredProjects.filter(project =>
            project.portfolio_id == portfolioFilter
        );
    }

    renderProjects(filteredProjects);
}

function displayTesters() {
    const searchTerm = document.getElementById('testerSearch')?.value.toLowerCase() || '';
    const filteredTesters = testers.filter(tester =>
        tester.name.toLowerCase().includes(searchTerm) ||
        tester.email.toLowerCase().includes(searchTerm)
    );
    renderTesters(filteredTesters);
}

function displayTeamMembers() {
    const searchTerm = document.getElementById('teamSearch')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('roleFilter')?.value || '';

    let filteredMembers = teamMembers.filter(member =>
        member.name.toLowerCase().includes(searchTerm) ||
        member.email.toLowerCase().includes(searchTerm)
    );

    if (roleFilter) {
        filteredMembers = filteredMembers.filter(member =>
            member.role === roleFilter
        );
    }

    renderTeamMembers(filteredMembers);
}

function renderPortfolios(portfoliosToRender = portfolios) {
    const container = document.getElementById('portfoliosList');
    if (!container) return;

    if (portfoliosToRender.length === 0) {
        container.innerHTML = `
            <div class="empty-data-state">
                <div class="icon-bg">
                    <i class="fas fa-briefcase"></i>
                </div>
                <h3>No Portfolios Found</h3>
                <p>Create your first portfolio to get started.</p>
                <button class="action-btn" onclick="showAddPortfolioModal()">+ Add Portfolio</button>
            </div>
        `;
        return;
    }

    container.innerHTML = portfoliosToRender.map(portfolio => `
        <div class="data-item portfolio">
            <div class="data-item-header">
                <h3 class="data-item-title">${portfolio.name}</h3>
                <div class="data-item-actions">
                    <button class="btn-edit" onclick="editPortfolio(${portfolio.id})" title="Edit Portfolio">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deletePortfolio(${portfolio.id})" title="Delete Portfolio">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="data-item-content">
                <p>${portfolio.description || 'No description provided'}</p>
                <div class="project-count">
                    <i class="fas fa-project-diagram"></i>
                    ${projects.filter(p => p.portfolio_id === portfolio.id).length} Projects
                </div>
            </div>
        </div>
    `).join('');
}

function renderProjects(projectsToRender = projects) {
    const container = document.getElementById('projectsList');
    if (!container) return;

    if (projectsToRender.length === 0) {
        container.innerHTML = `
            <div class="empty-data-state">
                <div class="icon-bg">
                    <i class="fas fa-project-diagram"></i>
                </div>
                <h3>No Projects Found</h3>
                <p>Create your first project to get started.</p>
                <button class="action-btn" onclick="showAddProjectModal()">+ Add Project</button>
            </div>
        `;
        return;
    }

    container.innerHTML = projectsToRender.map(project => {
        const portfolio = portfolios.find(p => p.id === project.portfolio_id);
        return `
            <div class="data-item project">
                <div class="data-item-header">
                    <h3 class="data-item-title">${project.name}</h3>
                    <div class="data-item-actions">
                        <button class="btn-edit" onclick="editProject(${project.id})" title="Edit Project">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="deleteProject(${project.id})" title="Delete Project">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="data-item-content">
                    <p><strong>Portfolio:</strong> ${portfolio ? portfolio.name : 'Standalone Project'}</p>
                    <p>${project.description || 'No description provided'}</p>
                </div>
            </div>
        `;
    }).join('');
}

function renderTesters(testersToRender = testers) {
    const container = document.getElementById('testersList');
    if (!container) return;

    if (testersToRender.length === 0) {
        container.innerHTML = `
            <div class="empty-data-state">
                <div class="icon-bg">
                    <i class="fas fa-user-cog"></i>
                </div>
                <h3>No Testers Found</h3>
                <p>Add testers to your system.</p>
                <button class="action-btn" onclick="showAddTesterModal()">+ Add Tester</button>
            </div>
        `;
        return;
    }

    container.innerHTML = testersToRender.map(tester => `
        <div class="data-item tester">
            <div class="data-item-header">
                <h3 class="data-item-title">${tester.name}</h3>
                <div class="data-item-actions">
                    <button class="btn-edit" onclick="editTester(${tester.id})" title="Edit Tester">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteTester(${tester.id})" title="Delete Tester">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="data-item-content">
                <p><strong>Email:</strong> ${tester.email}</p>
            </div>
        </div>
    `).join('');
}

function renderTeamMembers(membersToRender = teamMembers) {
    const container = document.getElementById('teamMembersList');
    if (!container) return;

    if (membersToRender.length === 0) {
        container.innerHTML = `
            <div class="empty-data-state">
                <div class="icon-bg">
                    <i class="fas fa-users"></i>
                </div>
                <h3>No Team Members Found</h3>
                <p>Add team members to your system.</p>
                <button class="action-btn" onclick="showAddTeamMemberModal()">+ Add Team Member</button>
            </div>
        `;
        return;
    }

    container.innerHTML = membersToRender.map(member => `
        <div class="data-item team-member">
            <div class="data-item-header">
                <h3 class="data-item-title">${member.name}</h3>
                <div class="data-item-actions">
                    <button class="btn-edit" onclick="editTeamMember(${member.id})" title="Edit Team Member">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteTeamMember(${member.id})" title="Delete Team Member">
                        <i class="fas fa-trash"></i>
                    </button>
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
    document.querySelector('#addPortfolioModal .modal-title').textContent = 'Add New Portfolio';
    showModal('addPortfolioModal');
}

function showAddProjectModal() {
    editingId = null;
    editingType = 'project';
    document.getElementById('projectName').value = '';
    document.getElementById('projectDescription').value = '';

    // Populate portfolio pills
    populatePortfolioPills();

    document.querySelector('#addProjectModal .modal-title').textContent = 'Add New Project';
    showModal('addProjectModal');
}

function showAddTesterModal() {
    editingId = null;
    editingType = 'tester';
    document.getElementById('testerName').value = '';
    document.getElementById('testerEmail').value = '';
    document.querySelector('#addTesterModal .modal-title').textContent = 'Add New Tester';
    showModal('addTesterModal');
}

function showAddTeamMemberModal() {
    editingId = null;
    editingType = 'teamMember';
    document.getElementById('teamMemberName').value = '';
    document.getElementById('teamMemberEmail').value = '';
    document.getElementById('teamMemberRole').value = '';
    document.querySelector('#addTeamMemberModal .modal-title').textContent = 'Add New Team Member';
    showModal('addTeamMemberModal');
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Helper Functions
function populatePortfolioPills() {
    console.log('populatePortfolioPills called');
    console.log('Portfolios available:', portfolios);

    const container = document.getElementById('projectPortfoliosContainer');
    if (!container) {
        console.error('projectPortfoliosContainer not found');
        return;
    }

    // Clear existing portfolio pills (keep the standalone pill)
    const existingPills = container.querySelectorAll('.tag-pill:not(.standalone-pill)');
    console.log('Removing existing pills:', existingPills.length);
    existingPills.forEach(pill => pill.remove());

    // Reset standalone pill selection
    const standalonePill = container.querySelector('.standalone-pill');
    if (standalonePill) {
        standalonePill.classList.add('active');
        standalonePill.setAttribute('aria-pressed', 'true');
        console.log('Standalone pill activated');
    } else {
        console.error('Standalone pill not found');
    }

    // Add portfolio pills
    if (portfolios && portfolios.length > 0) {
        console.log('Adding portfolio pills for', portfolios.length, 'portfolios');
        portfolios.forEach(portfolio => {
            console.log('Creating pill for portfolio:', portfolio);
            const pill = document.createElement('div');
            pill.className = 'tag-pill portfolio-pill';
            pill.setAttribute('data-portfolio-id', portfolio.id);
            pill.setAttribute('tabindex', '0');
            pill.setAttribute('role', 'button');
            pill.setAttribute('aria-pressed', 'false');
            pill.onclick = function () { toggleSingleTagPill(this); };
            pill.onkeydown = function (event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleSingleTagPill(this);
                }
            };
            pill.innerHTML = `
                <i class="fas fa-briefcase"></i>
                <span>${portfolio.name}</span>
            `;
            container.appendChild(pill);
        });
        console.log('Portfolio pills added successfully');
    } else {
        console.log('No portfolios available or portfolios array is empty');
    }
}

// Tag pill toggle functions
function toggleSingleTagPill(pill) {
    // For single selection (like portfolio or role selection)
    const container = pill.parentElement;
    const allPills = container.querySelectorAll('.tag-pill');

    // Remove active class from all pills
    allPills.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-pressed', 'false');
    });

    // Add active class to clicked pill
    pill.classList.add('active');
    pill.setAttribute('aria-pressed', 'true');
}

function toggleTagPill(pill) {
    // For multiple selection (like tester roles)
    pill.classList.toggle('active');
    const isActive = pill.classList.contains('active');
    pill.setAttribute('aria-pressed', isActive.toString());
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
    if (!select) return;

    select.innerHTML = '<option value="">All Portfolios</option>';
    if (portfolios && portfolios.length > 0) {
        portfolios.forEach(portfolio => {
            select.innerHTML += `<option value="${portfolio.id}">${portfolio.name}</option>`;
        });
    }
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

// CRUD Operations
async function savePortfolio() {
    const name = document.getElementById('portfolioName').value.trim();
    const description = document.getElementById('portfolioDescription').value.trim();

    if (!name) {
        showToast('Please enter a portfolio name', 'warning');
        return;
    }

    try {
        const method = editingId ? 'PUT' : 'POST';
        const url = editingId ? `/api/portfolios/${editingId}` : '/api/portfolios';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description })
        });

        if (response.ok) {
            const savedPortfolio = await response.json();

            if (editingId) {
                const index = portfolios.findIndex(p => p.id === editingId);
                if (index !== -1) portfolios[index] = savedPortfolio;
                showToast('Portfolio updated successfully!', 'success');
            } else {
                portfolios.push(savedPortfolio);
                showToast('Portfolio created successfully!', 'success');
            }

            await loadAllData();
            updateStats();
            renderPortfolios();
            closeModal('addPortfolioModal');
        } else {
            const error = await response.json();
            showToast('Error saving portfolio: ' + (error.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error saving portfolio:', error);
        showToast('Error saving portfolio', 'error');
    }
}

async function saveProject() {
    const name = document.getElementById('projectName').value.trim();
    const description = document.getElementById('projectDescription').value.trim();

    if (!name) {
        showToast('Please enter project name', 'warning');
        return;
    }

    // Get selected portfolio from tag pills
    const container = document.getElementById('projectPortfoliosContainer');
    const activePill = container.querySelector('.tag-pill.active');
    const portfolioId = activePill ? activePill.getAttribute('data-portfolio-id') : '';

    try {
        const method = editingId ? 'PUT' : 'POST';
        const url = editingId ? `/api/projects/${editingId}` : '/api/projects';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                portfolio_id: portfolioId || null,
                description
            })
        });

        if (response.ok) {
            const savedProject = await response.json();

            if (editingId) {
                const index = projects.findIndex(p => p.id === editingId);
                if (index !== -1) projects[index] = savedProject;
                showToast('Project updated successfully!', 'success');
            } else {
                projects.push(savedProject);
                showToast('Project created successfully!', 'success');
            }

            await loadAllData();
            updateStats();
            renderProjects();
            closeModal('addProjectModal');
        } else {
            const error = await response.json();
            showToast('Error saving project: ' + (error.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error saving project:', error);
        showToast('Error saving project', 'error');
    }
}

async function saveTester() {
    const name = document.getElementById('testerName').value.trim();
    const email = document.getElementById('testerEmail').value.trim();

    if (!name || !email) {
        showToast('Please enter both name and email', 'warning');
        return;
    }

    try {
        const method = editingId ? 'PUT' : 'POST';
        const url = editingId ? `/api/testers/${editingId}` : '/api/testers';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email })
        });

        if (response.ok) {
            const savedTester = await response.json();

            if (editingId) {
                const index = testers.findIndex(t => t.id === editingId);
                if (index !== -1) testers[index] = savedTester;
                showToast('Tester updated successfully!', 'success');
            } else {
                testers.push(savedTester);
                showToast('Tester created successfully!', 'success');
            }

            await loadAllData();
            updateStats();
            renderTesters();
            closeModal('addTesterModal');
        } else {
            const error = await response.json();
            showToast('Error saving tester: ' + (error.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error saving tester:', error);
        showToast('Error saving tester', 'error');
    }
}

async function saveTeamMember() {
    const name = document.getElementById('teamMemberName').value.trim();
    const email = document.getElementById('teamMemberEmail').value.trim();
    const role = document.getElementById('teamMemberRole').value;

    if (!name || !email || !role) {
        showToast('Please fill in all fields', 'warning');
        return;
    }

    try {
        const method = editingId ? 'PUT' : 'POST';
        const url = editingId ? `/api/team-members/${editingId}` : '/api/team-members';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, role })
        });

        if (response.ok) {
            const savedMember = await response.json();

            if (editingId) {
                const index = teamMembers.findIndex(tm => tm.id === editingId);
                if (index !== -1) teamMembers[index] = savedMember;
                showToast('Team member updated successfully!', 'success');
            } else {
                teamMembers.push(savedMember);
                showToast('Team member created successfully!', 'success');
            }

            await loadAllData();
            updateStats();
            renderTeamMembers();
            closeModal('addTeamMemberModal');
        } else {
            const error = await response.json();
            showToast('Error saving team member: ' + (error.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error saving team member:', error);
        showToast('Error saving team member', 'error');
    }
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

// Edit Functions
function editPortfolio(id) {
    const portfolio = portfolios.find(p => p.id === id);
    if (!portfolio) return;

    editingId = id;
    editingType = 'portfolio';

    document.getElementById('portfolioName').value = portfolio.name || '';
    document.getElementById('portfolioDescription').value = portfolio.description || '';

    showModal('addPortfolioModal');
}

function editProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    editingId = id;
    editingType = 'project';

    document.getElementById('projectName').value = project.name || '';
    document.getElementById('projectDescription').value = project.description || '';

    // Populate portfolio pills and select the correct one
    populatePortfolioPills();

    // Select the appropriate portfolio pill
    const container = document.getElementById('projectPortfoliosContainer');
    const allPills = container.querySelectorAll('.tag-pill');

    allPills.forEach(pill => {
        pill.classList.remove('active');
        pill.setAttribute('aria-pressed', 'false');
    });

    if (project.portfolio_id) {
        const targetPill = container.querySelector(`[data-portfolio-id="${project.portfolio_id}"]`);
        if (targetPill) {
            targetPill.classList.add('active');
            targetPill.setAttribute('aria-pressed', 'true');
        }
    } else {
        // Select standalone pill if no portfolio
        const standalonePill = container.querySelector('.standalone-pill');
        if (standalonePill) {
            standalonePill.classList.add('active');
            standalonePill.setAttribute('aria-pressed', 'true');
        }
    }

    showModal('addProjectModal');
}

function editTester(id) {
    const tester = testers.find(t => t.id === id);
    if (!tester) return;

    editingId = id;
    editingType = 'tester';

    document.getElementById('testerName').value = tester.name || '';
    document.getElementById('testerEmail').value = tester.email || '';

    showModal('addTesterModal');
}

function editTeamMember(id) {
    const member = teamMembers.find(tm => tm.id === id);
    if (!member) return;

    editingId = id;
    editingType = 'teamMember';

    document.getElementById('teamMemberName').value = member.name || '';
    document.getElementById('teamMemberEmail').value = member.email || '';
    document.getElementById('teamMemberRole').value = member.role || '';

    showModal('addTeamMemberModal');
}

// Delete Functions
async function deletePortfolio(id) {
    if (!confirm('Are you sure you want to delete this portfolio? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/portfolios/${id}`, { method: 'DELETE' });

        if (response.ok) {
            portfolios = portfolios.filter(p => p.id !== id);
            showToast('Portfolio deleted successfully!', 'success');
            updateStats();
            renderPortfolios();
        } else {
            const error = await response.json();
            showToast('Error deleting portfolio: ' + (error.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error deleting portfolio:', error);
        showToast('Error deleting portfolio', 'error');
    }
}

async function deleteProject(id) {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });

        if (response.ok) {
            projects = projects.filter(p => p.id !== id);
            showToast('Project deleted successfully!', 'success');
            updateStats();
            renderProjects();
        } else {
            const error = await response.json();
            showToast('Error deleting project: ' + (error.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        showToast('Error deleting project', 'error');
    }
}

async function deleteTester(id) {
    if (!confirm('Are you sure you want to delete this tester? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/testers/${id}`, { method: 'DELETE' });

        if (response.ok) {
            testers = testers.filter(t => t.id !== id);
            showToast('Tester deleted successfully!', 'success');
            updateStats();
            renderTesters();
        } else {
            const error = await response.json();
            showToast('Error deleting tester: ' + (error.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error deleting tester:', error);
        showToast('Error deleting tester', 'error');
    }
}

async function deleteTeamMember(id) {
    if (!confirm('Are you sure you want to delete this team member? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/team-members/${id}`, { method: 'DELETE' });

        if (response.ok) {
            teamMembers = teamMembers.filter(tm => tm.id !== id);
            showToast('Team member deleted successfully!', 'success');
            updateStats();
            renderTeamMembers();
        } else {
            const error = await response.json();
            showToast('Error deleting team member: ' + (error.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error deleting team member:', error);
        showToast('Error deleting team member', 'error');
    }
}

// Toast notification system
function showToast(message, type = 'info', duration = 5000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"></div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="removeToast(this.parentElement)">×</button>
    `;

    container.appendChild(toast);

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

// Modal close on outside click
window.onclick = function (event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}