// static/js/modals.js
// Modal and Dynamic Form Management

// --- Modal & Utility Functions ---
function showModal(modalId) {
    console.log('showModal called with modalId:', modalId);
    const modal = document.getElementById(modalId);
    console.log('Modal element found:', modal);
    if (modal) {
        modal.style.display = 'flex';
        console.log('Modal display set to flex');
    } else {
        console.error('Modal element not found:', modalId);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        // Clear form inputs
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

function showAddPortfolioModal() {
    showModal('addPortfolioModal');
}

function showAddProjectModal() {
    showModal('addProjectModal');
}

async function addPortfolio() {
    const name = document.getElementById('newPortfolioName').value.trim();
    if (name) {
        try {
            const response = await fetch('/api/portfolios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name })
            });
            if (response.ok) {
                const newPortfolio = await response.json();
                if (typeof showToast === 'function') {
                    showToast('Portfolio added successfully! Now please add a project to this portfolio.', 'success');
                }
                if (typeof invalidateAllCaches === 'function') {
                    invalidateAllCaches(); // Clear caches since data changed
                }

                // Reload portfolios and select the new one
                if (typeof loadPortfoliosOnly === 'function') {
                    await loadPortfoliosOnly();
                }

                // Select the newly created portfolio
                const portfolioSelect = document.getElementById('portfolioName');
                if (portfolioSelect) {
                    // Find and select the new portfolio option
                    const portfolioValue = name.toLowerCase().replace(/\s+/g, '-');
                    portfolioSelect.value = portfolioValue;

                    // Trigger the change event to load projects for this portfolio
                    const changeEvent = new Event('change', { bubbles: true });
                    portfolioSelect.dispatchEvent(changeEvent);
                }

                closeModal('addPortfolioModal');

                // Force user to add a project by showing the project modal
                setTimeout(() => {
                    if (typeof showToast === 'function') {
                        showToast('Please add a project to the new portfolio before proceeding.', 'info');
                    }
                    showAddProjectModal();
                }, 500);

            } else {
                const error = await response.json();
                if (typeof showToast === 'function') {
                    showToast('Error adding portfolio: ' + (error.error || 'Unknown error'), 'error');
                }
            }
        } catch (error) {
            console.error('Error adding portfolio:', error);
            if (typeof showToast === 'function') {
                showToast('Error adding portfolio', 'error');
            }
        }
    } else {
        if (typeof showToast === 'function') {
            showToast('Please enter a portfolio name.', 'warning');
        }
    }
}

async function addProject() {
    const name = document.getElementById('newProjectName').value.trim();
    const portfolioSelect = document.getElementById('portfolioName');

    if (!portfolioSelect.value) {
        if (typeof showToast === 'function') {
            showToast('Please select a portfolio first.', 'warning');
        }
        return;
    }

    const selectedPortfolioOption = portfolioSelect.options[portfolioSelect.selectedIndex];
    const actualPortfolioId = selectedPortfolioOption ? selectedPortfolioOption.dataset.id : null;

    if (name && actualPortfolioId) {
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, portfolio_id: actualPortfolioId })
            });
            if (response.ok) {
                const newProject = await response.json();
                if (typeof showToast === 'function') {
                    showToast('Project added successfully!', 'success');
                }
                if (typeof invalidateAllCaches === 'function') {
                    invalidateAllCaches(); // Clear caches since data changed
                }

                // Reload projects for the current portfolio
                if (typeof loadProjectsForPortfolio === 'function') {
                    await loadProjectsForPortfolio(actualPortfolioId);
                }

                // Select the newly created project
                const projectSelect = document.getElementById('projectName');
                if (projectSelect) {
                    const projectValue = name.toLowerCase().replace(/\s+/g, '-');
                    projectSelect.value = projectValue;

                    // Trigger the change event to enable remaining fields
                    const changeEvent = new Event('change', { bubbles: true });
                    projectSelect.dispatchEvent(changeEvent);
                }

                closeModal('addProjectModal');
            } else {
                const error = await response.json();
                if (typeof showToast === 'function') {
                    showToast('Error adding project: ' + (error.error || 'Unknown error'), 'error');
                }
            }
        } catch (error) {
            console.error('Error adding project:', error);
            if (typeof showToast === 'function') {
                showToast('Error adding project', 'error');
            }
        }
    } else {
        if (typeof showToast === 'function') {
            showToast('Please enter a project name and ensure a portfolio is selected.', 'warning');
        }
    }
}

// --- Dynamic Form Sections (Request, Build, Tester) ---
function showRequestModal() { showModal('requestModal'); }
function showBuildModal() { showModal('buildModal'); }
function showTesterModal() {
    if (typeof loadExistingTesters === 'function') {
        loadExistingTesters(); // Load testers when modal opens
    }
    showModal('testerModal');
}

function addRequest() {
    const requestId = document.getElementById('requestId').value.trim();
    const requestUrl = document.getElementById('requestUrl').value.trim();

    if (requestId && requestUrl) {
        window.requestData = window.requestData || [];
        window.requestData.push({ requestId, requestUrl });
        renderRequestList();
        closeModal('requestModal');
        if (typeof showToast === 'function') {
            showToast('Request added successfully!', 'success');
        }
    } else {
        if (typeof showToast === 'function') {
            showToast('Please fill in all fields.', 'warning');
        }
    }
}

function addBuild() {
    const requestId = document.getElementById('buildRequestId').value.trim();
    const requestUrl = document.getElementById('buildRequestUrl').value.trim();
    const environment = document.getElementById('buildEnvironment').value.trim();
    const cycles = document.getElementById('buildCycles').value.trim();

    if (requestId && requestUrl && environment && cycles) {
        window.buildData = window.buildData || [];
        window.buildData.push({ requestId, requestUrl, environment, cycles });
        renderBuildList();
        closeModal('buildModal');
        if (typeof showToast === 'function') {
            showToast('Build added successfully!', 'success');
        }
    } else {
        if (typeof showToast === 'function') {
            showToast('Please fill in all fields.', 'warning');
        }
    }
}

function renderDynamicList(containerId, data, renderItemFn, removeFn) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
    }

    if (data.length === 0) {
        container.innerHTML = '<div class="empty-state">No items added yet.</div>';
    } else {
        container.innerHTML = data.map((item, index) => renderItemFn(item, index, removeFn)).join('');
    }
}

function renderRequestList() {
    renderDynamicList('requestList', window.requestData || [], (item, index) => `
        <div class="dynamic-item">
            <div>
                <strong>Request ID:</strong> ${item.requestId}<br>
                <strong>URL:</strong> <a href="${item.requestUrl}" target="_blank">${item.requestUrl}</a>
            </div>
            <button type="button" class="btn-sm btn-delete" onclick="removeRequest(${index})">Remove</button>
        </div>
    `);
}

function renderBuildList() {
    renderDynamicList('buildList', window.buildData || [], (item, index) => `
        <div class="dynamic-item">
            <div>
                <strong>Request ID:</strong> ${item.requestId}<br>
                <strong>URL:</strong> <a href="${item.requestUrl}" target="_blank">${item.requestUrl}</a><br>
                <strong>Environment:</strong> ${item.environment}<br>
                <strong>Cycles:</strong> ${item.cycles}
            </div>
            <button type="button" class="btn-sm btn-delete" onclick="removeBuild(${index})">Remove</button>
        </div>
    `);
}

function renderTesterList() {
    const container = document.getElementById('testerList');
    if (!container) return;

    const testerData = window.testerData || [];
    if (testerData.length === 0) {
        container.innerHTML = '<div class="empty-state" style="text-align: center; color: #6c757d; padding: 20px 0;">No testers added yet. Click "Add Tester" to get started.</div>';
        return;
    }

    container.innerHTML = testerData.map((tester, index) => {
        const roles = [];
        if (tester.is_automation_engineer) roles.push('Automation Engineer');
        if (tester.is_manual_engineer) roles.push('Manual Engineer');
        const roleText = roles.length > 0 ? roles.join(', ') : 'No roles assigned';

        return `
            <div class="dynamic-item">
                <div>
                    <strong>Name:</strong> ${tester.name}<br>
                    <strong>Roles:</strong> <span class="role-badge">${roleText}</span><br>
                    <strong>Email:</strong> ${tester.email}
                </div>
                <button type="button" class="btn-sm btn-delete" onclick="removeTester(${index})">Remove</button>
            </div>
        `;
    }).join('');
}

function removeRequest(index) {
    window.requestData = window.requestData || [];
    window.requestData.splice(index, 1);
    renderRequestList();
    if (typeof showToast === 'function') {
        showToast('Request removed', 'info');
    }
}

function removeBuild(index) {
    window.buildData = window.buildData || [];
    window.buildData.splice(index, 1);
    renderBuildList();
    if (typeof showToast === 'function') {
        showToast('Build removed', 'info');
    }
}

function removeTester(index) {
    window.testerData = window.testerData || [];
    window.testerData.splice(index, 1);
    renderTesterList();
    if (typeof showToast === 'function') {
        showToast('Tester removed', 'info');
    }
}

// Team Member Management
async function showTeamMemberModal() {
    if (typeof loadExistingTeamMembers === 'function') {
        await loadExistingTeamMembers();
    }
    clearTeamMemberForm();
    showModal('teamMemberModal');
}

async function loadExistingTeamMembers() {
    try {
        const response = await fetch('/api/team-members');
        if (response.ok) {
            const teamMembers = await response.json();
            const select = document.getElementById('existingTeamMemberSelect');

            if (select) {
                select.innerHTML = '<option value="">-- Select from existing team members --</option>';

                teamMembers.forEach(member => {
                    const option = document.createElement('option');
                    option.value = JSON.stringify(member); // Store full object for easy retrieval
                    option.textContent = `${member.name} - ${member.role} (${member.email})`;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading team members:', error);
        if (typeof showToast === 'function') {
            showToast('Error loading team members', 'error');
        }
    }
}

function handleTeamMemberSelection() {
    const select = document.getElementById('existingTeamMemberSelect');
    // Since we simplified the modal to select-only, we don't need to handle role field
    if (!select) {
        console.error('Team member select element not found');
        return;
    }
    // The function is called but doesn't need to do anything since we only have select functionality
}

function clearTeamMemberForm() {
    const existingSelect = document.getElementById('existingTeamMemberSelect');
    // Only clear the select dropdown since we simplified to select-only
    if (existingSelect) {
        existingSelect.value = '';
    }
}

async function addSelectedTeamMember() {
    const existingSelect = document.getElementById('existingTeamMemberSelect');

    if (!existingSelect) {
        console.error('Team member select element not found');
        return;
    }

    if (!existingSelect.value) {
        if (typeof showToast === 'function') {
            showToast('Please select a team member', 'warning');
        }
        return;
    }

    let memberToAdd = null;

    try {
        memberToAdd = JSON.parse(existingSelect.value);
    } catch (error) {
        console.error('Error parsing team member data:', error);
        if (typeof showToast === 'function') {
            showToast('Error parsing team member data', 'error');
        }
        return;
    }

    if (memberToAdd) {
        window.teamMemberData = window.teamMemberData || [];
        const alreadyAdded = window.teamMemberData.some(tm => tm.email === memberToAdd.email);
        if (alreadyAdded) {
            if (typeof showToast === 'function') {
                showToast('This team member is already added to the report', 'warning');
            }
            return;
        }

        window.teamMemberData.push({
            id: memberToAdd.id,
            name: memberToAdd.name,
            email: memberToAdd.email,
            role: memberToAdd.role
        });

        renderTeamMemberList();
        closeModal('teamMemberModal');
        if (typeof showToast === 'function') {
            showToast('Team member added successfully!', 'success');
        }
    }
}

function renderTeamMemberList() {
    const container = document.getElementById('teamMemberList');
    if (!container) return;

    const teamMemberData = window.teamMemberData || [];
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

function removeTeamMember(index) {
    window.teamMemberData = window.teamMemberData || [];
    window.teamMemberData.splice(index, 1);
    renderTeamMemberList();
    if (typeof showToast === 'function') {
        showToast('Team member removed', 'info');
    }
}

// Enhanced tester management functions (complete implementation)
async function loadExistingTesters() {
    try {
        const response = await fetch('/api/testers');
        if (response.ok) {
            const testers = await response.json();
            const select = document.getElementById('existingTesterSelect');

            if (select) {
                select.innerHTML = '<option value="">-- Select from existing testers --</option>';

                testers.forEach(tester => {
                    const option = document.createElement('option');
                    option.value = JSON.stringify(tester); // Store full object for easy retrieval
                    const roles = [];
                    if (tester.is_automation_engineer) roles.push('Automation');
                    if (tester.is_manual_engineer) roles.push('Manual');
                    const roleText = roles.length > 0 ? ` - ${roles.join(', ')}` : '';
                    option.textContent = `${tester.name} (${tester.email})${roleText}`;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading testers:', error);
        if (typeof showToast === 'function') {
            showToast('Error loading testers', 'error');
        }
    }
}

function handleTesterSelection() {
    const select = document.getElementById('existingTesterSelect');
    // Since we simplified the modal to select-only, we don't need to handle add fields
    if (!select) {
        console.error('Tester select element not found');
        return;
    }
    // The function is called but doesn't need to do anything since we only have select functionality
}

function clearTesterForm() {
    const existingTesterSelect = document.getElementById('existingTesterSelect');
    // Only clear the select dropdown since we simplified to select-only
    if (existingTesterSelect) {
        existingTesterSelect.value = '';
    }
}

async function addSelectedTester() {
    const existingTesterSelect = document.getElementById('existingTesterSelect');

    if (!existingTesterSelect) {
        console.error('Tester select element not found');
        return;
    }

    if (!existingTesterSelect.value) {
        if (typeof showToast === 'function') {
            showToast('Please select a tester', 'warning');
        }
        return;
    }

    let testerToAdd = null;

    try {
        testerToAdd = JSON.parse(existingTesterSelect.value);
    } catch (error) {
        console.error('Error parsing tester data:', error);
        if (typeof showToast === 'function') {
            showToast('Error parsing tester data', 'error');
        }
        return;
    }

    if (testerToAdd) {
        window.testerData = window.testerData || [];
        const alreadyAdded = window.testerData.some(t => t.email === testerToAdd.email);
        if (alreadyAdded) {
            if (typeof showToast === 'function') {
                showToast('This tester is already added to the report', 'warning');
            }
            return;
        }

        window.testerData.push({
            id: testerToAdd.id,
            name: testerToAdd.name,
            email: testerToAdd.email,
            is_automation_engineer: testerToAdd.is_automation_engineer || false,
            is_manual_engineer: testerToAdd.is_manual_engineer || false
        });

        renderTesterList();
        closeModal('testerModal');
        if (typeof showToast === 'function') {
            showToast('Tester added successfully!', 'success');
        }
    }
}

// Make functions globally accessible
window.showModal = showModal;
window.closeModal = closeModal;
window.showAddPortfolioModal = showAddPortfolioModal;
window.showAddProjectModal = showAddProjectModal;
window.addPortfolio = addPortfolio;
window.addProject = addProject;
window.showRequestModal = showRequestModal;
window.showBuildModal = showBuildModal;
window.showTesterModal = showTesterModal;
window.addRequest = addRequest;
window.addBuild = addBuild;
window.renderDynamicList = renderDynamicList;
window.renderRequestList = renderRequestList;
window.renderBuildList = renderBuildList;
window.renderTesterList = renderTesterList;
window.removeRequest = removeRequest;
window.removeBuild = removeBuild;
window.removeTester = removeTester;
window.showTeamMemberModal = showTeamMemberModal;
window.loadExistingTeamMembers = loadExistingTeamMembers;
window.handleTeamMemberSelection = handleTeamMemberSelection;
window.clearTeamMemberForm = clearTeamMemberForm;
window.addSelectedTeamMember = addSelectedTeamMember;
window.renderTeamMemberList = renderTeamMemberList;
window.removeTeamMember = removeTeamMember;
window.loadExistingTesters = loadExistingTesters;
window.handleTesterSelection = handleTesterSelection;
window.clearTesterForm = clearTesterForm;
window.addSelectedTester = addSelectedTester;