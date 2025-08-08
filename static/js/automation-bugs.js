// static/js/automation-bugs.js
// Bug Management Functions (for Automation Reports)

function showBugModal() {
    showModal('bugModal');
    // Clear the form fields when opening the modal
    document.getElementById('bugTitle').value = '';
    document.getElementById('bugDescription').value = '';
    document.getElementById('bugUrl').value = '';
    document.getElementById('bugSeverity').value = 'Medium';
    document.getElementById('bugStatus').value = 'Open';
}

function addBug() {
    const title = document.getElementById('bugTitle').value.trim();
    const description = document.getElementById('bugDescription').value.trim();
    const url = document.getElementById('bugUrl').value.trim();
    const severity = document.getElementById('bugSeverity').value;
    const status = document.getElementById('bugStatus').value;

    if (title && description) {
        const bug = {
            id: 'bug_' + Date.now(),
            title: title,
            description: description,
            url: url,
            severity: severity,
            status: status,
            createdAt: new Date().toISOString()
        };

        window.bugsData = window.bugsData || [];
        window.bugsData.push(bug);
        renderBugsList();
        closeModal('bugModal');
        if (typeof showToast === 'function') {
            showToast('Bug added successfully!', 'success');
        }
    } else {
        if (typeof showToast === 'function') {
            showToast('Please enter both title and description.', 'warning');
        }
    }
}

function renderBugsList() {
    const container = document.getElementById('autoBugsList');
    if (!container) return;

    const bugsData = window.bugsData || [];
    if (bugsData.length === 0) {
        container.innerHTML = '<div class="empty-state">No bugs added yet. Click "Add Bug" to get started.</div>';
        return;
    }

    let html = '';
    bugsData.forEach((bug, index) => {
        const severityClass = bug.severity.toLowerCase();
        const statusClass = bug.status.toLowerCase().replace(' ', '-');

        html += `
            <div class="list-item bug-item">
                <div class="item-header">
                    <div class="item-title">
                        <i class="fas fa-bug"></i>
                        <strong>${bug.title}</strong>
                    </div>
                    <div class="item-actions">
                        <span class="severity-badge ${severityClass}">${bug.severity}</span>
                        <span class="status-badge ${statusClass}">${bug.status}</span>
                        <button class="delete-btn" onclick="removeBug(${index})" title="Remove Bug">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="item-content">
                    <p>${bug.description}</p>
                    ${bug.url ? `<p><strong>URL:</strong> <a href="${bug.url}" target="_blank">${bug.url}</a></p>` : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Update bugs count metric
    if (typeof updateBugsCount === 'function') {
        updateBugsCount();
    }
}

function removeBug(index) {
    if (confirm('Are you sure you want to remove this bug?')) {
        window.bugsData = window.bugsData || [];
        window.bugsData.splice(index, 1);
        renderBugsList();
        if (typeof updateBugsCount === 'function') {
            updateBugsCount();
        }
        if (typeof showToast === 'function') {
            showToast('Bug removed successfully!', 'success');
        }
    }
}

// Make functions globally accessible
window.showBugModal = showBugModal;
window.addBug = addBug;
window.renderBugsList = renderBugsList;
window.removeBug = removeBug;