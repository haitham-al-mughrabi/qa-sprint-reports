document.addEventListener('DOMContentLoaded', async () => {
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
    // Initialize form for new report
    resetFormData();
    loadFormDropdownData();
    initializeCharts(); // Ensure charts are initialized when the form page loads

    // Initialize progress bar and steps
    initializeProgressSteps();
    updateProgressBar();

    // Remove hardcoded width/height from chart canvases after initialization
    document.querySelectorAll('.chart-container canvas').forEach(canvas => {
        canvas.removeAttribute('width');
        canvas.removeAttribute('height');
    });

    // Check if there's a report ID in the URL for editing
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');
    if (reportId) {
        editingReportId = reportId;
        const report = await fetchReport(reportId);
        if (report) {
            loadReportForEditing(report);
            document.getElementById('formTitle').textContent = 'Edit Automation Report';
        } else {
            showToast('Report not found for editing.', 'error');
            editingReportId = null; // Reset if not found
        }
    } else {
        document.getElementById('formTitle').textContent = 'Create Automation Report';

    }
});

// Function to update the report title based on custom name input
function updateReportTitle() {
    const reportNameInput = document.getElementById('reportName');
    const formTitle = document.getElementById('formTitle');
    const customName = reportNameInput.value.trim();

    if (customName) {
        formTitle.textContent = customName;
    } else {
        // Use default based on editing state
        if (editingReportId) {
            formTitle.textContent = 'Edit Automation Report';
        } else {
            formTitle.textContent = 'Create Automation Report';
        }
    }
}

function showAddCoveredServiceModal() {
    showModal('addCoveredServiceModal');
}

function addCoveredService() {
    const text = document.getElementById('newCoveredServiceText').value.trim();
    if (text) {
        const list = document.getElementById('coveredServicesList');
        if (list.querySelector('.empty-state')) {
            list.innerHTML = ''; // Clear the empty state
        }
        const item = document.createElement('div');
        item.className = 'dynamic-list-item';
        item.innerHTML = `<span>${text}</span><button type="button" class="btn-remove" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>`;
        list.appendChild(item);
        closeModal('addCoveredServiceModal');
        document.getElementById('newCoveredServiceText').value = '';
    }
}

function showAddCoveredModuleModal() {
    showModal('addCoveredModuleModal');
}

function addCoveredModule() {
    const text = document.getElementById('newCoveredModuleText').value.trim();
    if (text) {
        const list = document.getElementById('coveredModulesList');
        if (list.querySelector('.empty-state')) {
            list.innerHTML = ''; // Clear the empty state
        }
        const item = document.createElement('div');
        item.className = 'dynamic-list-item';
        item.innerHTML = `<span>${text}</span><button type="button" class="btn-remove" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>`;
        list.appendChild(item);
        closeModal('addCoveredModuleModal');
        document.getElementById('newCoveredModuleText').value = '';
    }
}

function showAddBugModal() {
    showModal('addBugModal');
}

function addBug() {
    const text = document.getElementById('newBugText').value.trim();
    if (text) {
        const list = document.getElementById('bugsList');
        if (list.querySelector('.empty-state')) {
            list.innerHTML = ''; // Clear the empty state
        }
        const item = document.createElement('div');
        item.className = 'dynamic-list-item';
        item.innerHTML = `<span>${text}</span><button type="button" class="btn-remove" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>`;
        list.appendChild(item);
        closeModal('addBugModal');
        document.getElementById('newBugText').value = '';
    }
}

function showAddQANoteModal() {
    showModal('addQANoteModal');
}

function addQANote() {
    const text = document.getElementById('newQANoteText').value.trim();
    if (text) {
        const list = document.getElementById('qaNotesList');
        if (list.querySelector('.empty-state')) {
            list.innerHTML = ''; // Clear the empty state
        }
        const item = document.createElement('div');
        item.className = 'dynamic-list-item';
        item.innerHTML = `<span>${text}</span><button type="button" class="btn-remove" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>`;
        list.appendChild(item);
        closeModal('addQANoteModal');
        document.getElementById('newQANoteText').value = '';
    }
}
