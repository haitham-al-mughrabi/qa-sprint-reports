export function showRequestModal() { showModal('requestModal'); }
export function showBuildModal() { showModal('buildModal'); }
export function showTesterModal() {
    loadExistingTesters(); // Load testers when modal opens
    showModal('testerModal');
}

export function addRequest() {
    const requestId = document.getElementById('requestId').value.trim();
    const requestUrl = document.getElementById('requestUrl').value.trim();
    if (requestId && requestUrl) {
        requestData.push({ id: requestId, url: requestUrl });
        renderRequestList();
        closeModal('requestModal');
        showToast('Request added successfully!', 'success');
    } else {
        showToast('Please enter both Request ID and URL.', 'warning');
    }
}

export function addBuild() {
    const requestId = document.getElementById('buildRequestId').value.trim();
    const requestUrl = document.getElementById('buildRequestUrl').value.trim();
    const environment = document.getElementById('buildEnvironment').value.trim();
    const cycles = document.getElementById('buildCycles').value.trim();
    if (requestId && requestUrl && environment && cycles) {
        buildData.push({ requestId, requestUrl, environment, cycles });
        renderBuildList();
        closeModal('buildModal');
        showToast('Build added successfully!', 'success');
    } else {
        showToast('Please fill in all build information fields.', 'warning');
    }
}

// addTester function is replaced by addSelectedTester for consistency with team members
// function addTester() {
//     const testerName = document.getElementById('testerName').value.trim();
//     if (testerName) {
//         testerData.push({ name: testerName });
//         renderTesterList();
//         closeModal('testerModal');
//     }
// }

export function renderDynamicList(containerId, data, renderItemFn, removeFn) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id '${containerId}' not found`);
        return;
    }


    if (data.length === 0) {
        // Check if the container is for team members, as it has a slightly different empty state message
        if (containerId === 'teamMemberList') {
            container.innerHTML = `<div class="empty-state" style="text-align: center; color: #6c757d; padding: 20px 0;">No team members added yet.</div>`;
        } else if (containerId === 'testerList') {
            container.innerHTML = `<div class="empty-state" style="text-align: center; color: #6c757d; padding: 20px 0;">No testers added yet. Click "Add/Select Tester" to get started.</div>`;
        } else {
            container.innerHTML = `<div class="empty-state" style="text-align: center; color: #6c757d; padding: 20px 0;">No items added yet. Click "Add Request" to get started.</div>`;
        }
    } else {
        container.innerHTML = data.map((item, index) => renderItemFn(item, index, removeFn)).join('');
    }
}

export function renderRequestList() {
    renderDynamicList('requestList', requestData, (item, index) => `
        <div class="dynamic-item">
            <div><strong>ID:</strong> ${item.id}<br><strong>URL:</strong> ${item.url}</div>
            <button type="button" class="btn-sm btn-delete" onclick="removeRequest(${index})">Remove</button>
        </div>`, removeRequest);
}

export function renderBuildList() {
    renderDynamicList('buildList', buildData, (item, index) => `
        <div class="dynamic-item">
            <div><strong>Req ID:</strong> ${item.requestId}<br><strong>URL:</strong> ${item.requestUrl}<br><strong>Env:</strong> ${item.environment}<br><strong>Cycles:</strong> ${item.cycles}</div>
            <button type="button" class="btn-sm btn-delete" onclick="removeBuild(${index})">Remove</button>
        </div>`, removeBuild);
}

export function renderTesterList() {
    renderDynamicList('testerList', testerData, (item, index, removeFn) => {
        const roles = [];
        if (item.is_automation_engineer) roles.push('Automation Engineer');
        if (item.is_manual_engineer) roles.push('Manual Engineer');
        const roleText = roles.length > 0 ? `<br><strong>Roles:</strong> ${roles.join(', ')}` : '<br><em style="color: #6c757d;">No roles assigned</em>';

        return `
        <div class="dynamic-item">
            <div><strong>Name:</strong> ${item.name}<br><strong>Email:</strong> ${item.email}${roleText}</div>
            <button type="button" class="btn-sm btn-delete" onclick="removeTester(${index})">Remove</button>
        </div>`;
    }, removeTester);
}

export function removeRequest(index) { requestData.splice(index, 1); renderRequestList(); showToast('Request removed', 'info'); }
export function removeBuild(index) { buildData.splice(index, 1); renderBuildList(); showToast('Build removed', 'info'); }
export function removeTester(index) { testerData.splice(index, 1); renderTesterList(); showToast('Tester removed', 'info'); }

export function clearAllFields() {
    if (confirm('Are you sure you want to clear all fields in the form?')) {
        resetFormData();
        showToast('All fields have been cleared.', 'info');
    }
}

export function clearCurrentSection() {
    if (confirm('Are you sure you want to clear all fields in the current section?')) {
        const section = document.getElementById(`section-${currentSection}`);
        if (section) {
            const inputs = section.querySelectorAll('input:not([readonly]), textarea, select');
            inputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });

            // After clearing, recalculate percentages for relevant sections
            if (section.id === 'section-3') {
                calculatePercentages();
            } else if (section.id === 'section-4') {
                calculateTestCasesPercentages();
            } else if (section.id === 'section-5') {
                calculateIssuesPercentages();
            } else if (section.id === 'section-6') {
                calculateEnhancementsPercentages();
            } else if (section.id === 'section-8') {
                calculateAutomationPercentages();
                calculateAutomationStabilityPercentages();
            }

            showToast('Current section fields have been cleared.', 'info');
        }
    }
}

// --- Page Management & Navigation (Simplified for multi-page app) ---
// The showPage function is no longer needed for navigation between main pages.
// Browser handles page loads.
// function showPage(pageId) { ... }
