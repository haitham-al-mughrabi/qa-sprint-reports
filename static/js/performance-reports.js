// static/js/performance-reports.js
// Performance Report Management Functions

function showScenarioModal() {
    showModal('scenarioModal');
    // Clear the form fields when opening the modal
    document.getElementById('scenarioName').value = '';
    document.getElementById('scenarioUsers').value = '';
    document.getElementById('scenarioSteps').value = '';
}

function addScenario() {
    const name = document.getElementById('scenarioName').value.trim();
    const users = document.getElementById('scenarioUsers').value.trim();
    const steps = document.getElementById('scenarioSteps').value.trim();

    if (name && users && steps) {
        const scenario = {
            id: 'scenario_' + Date.now(),
            scenario_name: name,
            users: users,
            steps: steps,
            createdAt: new Date().toISOString()
        };

        window.performanceScenarios = window.performanceScenarios || [];
        window.performanceScenarios.push(scenario);
        renderScenariosList();
        closeModal('scenarioModal');
        if (typeof showToast === 'function') {
            showToast('Performance scenario added successfully!', 'success');
        }
    } else {
        if (typeof showToast === 'function') {
            showToast('Please fill in all fields.', 'warning');
        }
    }
}

function renderScenariosList() {
    const container = document.getElementById('scenariosList');
    if (!container) return;

    const performanceScenarios = window.performanceScenarios || [];
    if (performanceScenarios.length === 0) {
        container.innerHTML = '<div class="empty-state">No scenarios added yet. Click "Add Scenario" to get started.</div>';
        return;
    }

    let html = '';
    performanceScenarios.forEach((scenario, index) => {
        html += `
            <div class="list-item scenario-item">
                <div class="item-header">
                    <div class="item-title">
                        <i class="fas fa-play-circle"></i>
                        <strong>${scenario.scenario_name}</strong>
                    </div>
                    <div class="item-actions">
                        <span class="users-badge">${scenario.users} users</span>
                        <button class="delete-btn" onclick="removeScenario(${index})" title="Remove Scenario">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="item-content">
                    <p><strong>Steps:</strong></p>
                    <p>${scenario.steps}</p>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Update scenarios count metric
    if (typeof updateScenariosCount === 'function') {
        updateScenariosCount();
    }
}

function removeScenario(index) {
    if (confirm('Are you sure you want to remove this scenario?')) {
        window.performanceScenarios = window.performanceScenarios || [];
        window.performanceScenarios.splice(index, 1);
        renderScenariosList();
        if (typeof updateScenariosCount === 'function') {
            updateScenariosCount();
        }
        if (typeof showToast === 'function') {
            showToast('Scenario removed successfully!', 'success');
        }
    }
}

function showHttpRequestModal() {
    showModal('httpRequestModal');
    // Clear the form fields when opening the modal
    document.getElementById('requestEndpoint').value = '';
    document.getElementById('requestStatus').value = '';
    document.getElementById('requestCount').value = '';
    document.getElementById('requestAvgTime').value = '';
}

function addHttpRequest() {
    const endpoint = document.getElementById('requestEndpoint').value.trim();
    const status = document.getElementById('requestStatus').value.trim();
    const count = document.getElementById('requestCount').value.trim();
    const avgTime = document.getElementById('requestAvgTime').value.trim();

    if (endpoint && status && count && avgTime) {
        const request = {
            id: 'request_' + Date.now(),
            request_endpoint: endpoint,
            status: status,
            count: count,
            avg_time: avgTime,
            createdAt: new Date().toISOString()
        };

        window.httpRequestsOverview = window.httpRequestsOverview || [];
        window.httpRequestsOverview.push(request);
        renderHttpRequestsTable();
        closeModal('httpRequestModal');
        if (typeof showToast === 'function') {
            showToast('HTTP request added successfully!', 'success');
        }
    } else {
        if (typeof showToast === 'function') {
            showToast('Please fill in all fields.', 'warning');
        }
    }
}

function renderHttpRequestsTable() {
    const tbody = document.getElementById('httpRequestsTableBody');
    if (!tbody) return;

    const httpRequestsOverview = window.httpRequestsOverview || [];
    if (httpRequestsOverview.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="5" class="empty-state">No HTTP requests added yet. Click "Add Request" to get started.</td></tr>';
        return;
    }

    let html = '';
    httpRequestsOverview.forEach((request, index) => {
        const statusClass = getStatusClass(request.status);
        html += `
            <tr>
                <td><code>${request.request_endpoint}</code></td>
                <td><span class="status-badge ${statusClass}">${request.status}</span></td>
                <td>${request.count}</td>
                <td>${request.avg_time}</td>
                <td>
                    <button class="delete-btn" onclick="removeHttpRequest(${index})" title="Remove Request">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;

    // Update HTTP requests count metric
    if (typeof updateHttpRequestsCount === 'function') {
        updateHttpRequestsCount();
    }
}

function removeHttpRequest(index) {
    if (confirm('Are you sure you want to remove this HTTP request?')) {
        window.httpRequestsOverview = window.httpRequestsOverview || [];
        window.httpRequestsOverview.splice(index, 1);
        renderHttpRequestsTable();
        if (typeof updateHttpRequestsCount === 'function') {
            updateHttpRequestsCount();
        }
        if (typeof showToast === 'function') {
            showToast('HTTP request removed successfully!', 'success');
        }
    }
}

// Make functions globally accessible
window.showScenarioModal = showScenarioModal;
window.addScenario = addScenario;
window.renderScenariosList = renderScenariosList;
window.removeScenario = removeScenario;
window.showHttpRequestModal = showHttpRequestModal;
window.addHttpRequest = addHttpRequest;
window.renderHttpRequestsTable = renderHttpRequestsTable;
window.removeHttpRequest = removeHttpRequest;