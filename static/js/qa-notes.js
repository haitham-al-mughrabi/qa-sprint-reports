// static/js/qa-notes.js
// QA Notes Management Functions

// QA Notes Management
function showAddQANoteModal() {
    showModal('addQANoteModal');
    const noteTextArea = document.getElementById('newQANoteText');
    if (noteTextArea) {
        noteTextArea.value = '';
    }
}

function addQANote() {
    console.log('addQANote called');
    const noteText = document.getElementById('newQANoteText').value.trim();
    console.log('Note text:', noteText);
    
    if (noteText) {
        window.qaNotesData = window.qaNotesData || [];
        window.qaNotesData.push({ note: noteText });
        console.log('QA notes data after adding:', window.qaNotesData);
        
        renderQANotesList();
        updateQANotesCount();
        
        if (typeof closeModal === 'function') {
            closeModal('addQANoteModal');
        } else {
            console.warn('closeModal function not found');
        }
        
        if (typeof showToast === 'function') {
            showToast('QA note added successfully!', 'success');
        }
    } else {
        if (typeof showToast === 'function') {
            showToast('Please enter a note.', 'warning');
        }
    }
}

function removeQANote(index) {
    window.qaNotesData = window.qaNotesData || [];
    window.qaNotesData.splice(index, 1);
    renderQANotesList();
    updateQANotesCount();
}

function renderQANotesList() {
    const qaNotesData = window.qaNotesData || [];
    console.log('Rendering QA notes list, data:', qaNotesData);
    
    const emptyState = '<div class="empty-state">No QA notes added yet. Click "Add Note" to get started.</div>';
    const notesHTML = qaNotesData.length === 0 ? emptyState : qaNotesData.map((item, index) => `
        <div class="dynamic-item">
            <div>${item.note}</div>
            <button type="button" class="btn-delete" onclick="removeQANote(${index})">Remove</button>
        </div>
    `).join('');

    // Update both QA notes containers
    const containers = ['qaNotesList', 'autoQANotesList'];
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            console.log(`Updating container ${containerId} with:`, notesHTML);
            container.innerHTML = notesHTML;
        } else {
            console.log(`Container ${containerId} not found`);
        }
    });
}

function updateQANotesCount() {
    const countField = document.getElementById('qaNotesMetric');
    if (countField) {
        countField.value = (window.qaNotesData || []).length;
    }
}

// Functions for custom QA Note Fields
function showAddQANoteFieldModal() {
    showModal('addQANoteFieldModal');
    // Clear the form fields when opening the modal
    document.getElementById('qaFieldName').value = '';
    document.getElementById('qaFieldValue').value = '';
}

// This function is a placeholder. In a real scenario, it might populate a dropdown
// with predefined field names or allow editing existing ones.
function updateQAFieldOptions() {
    // For now, this function doesn't do anything as there are no predefined options.
    // It's kept to fulfill the request.
    console.log("updateQAFieldOptions called. No predefined options to update.");
}

function addQANoteField() {
    const fieldName = document.getElementById('qaFieldName').value.trim();
    const fieldValue = document.getElementById('qaFieldValue').value.trim();

    if (fieldName && fieldValue) {
        window.qaNoteFieldsData = window.qaNoteFieldsData || [];
        window.qaNoteFieldsData.push({ name: fieldName, value: fieldValue });
        renderQANoteFieldsList();
        closeModal('addQANoteFieldModal');
        if (typeof showToast === 'function') {
            showToast('QA Note Field added successfully!', 'success');
        }
    } else {
        if (typeof showToast === 'function') {
            showToast('Please enter both a field name and a field value.', 'warning');
        }
    }
}

function renderQANoteFieldsList() {
    const container = document.getElementById('qaNoteFieldsList');
    if (!container) return;

    const qaNoteFieldsData = window.qaNoteFieldsData || [];
    if (qaNoteFieldsData.length === 0) {
        container.innerHTML = '<div class="empty-state" style="text-align: center; color: #6c757d; padding: 20px 0;">No custom QA fields added yet.</div>';
        return;
    }

    container.innerHTML = qaNoteFieldsData.map((field, index) => `
        <div class="dynamic-item">
            <div>
                <strong>${field.name}:</strong> ${field.value}
            </div>
            <button type="button" class="btn-sm btn-delete" onclick="removeQANoteField(${index})">Remove</button>
        </div>
    `).join('');
}

function removeQANoteField(index) {
    window.qaNoteFieldsData = window.qaNoteFieldsData || [];
    window.qaNoteFieldsData.splice(index, 1);
    renderQANoteFieldsList();
    if (typeof showToast === 'function') {
        showToast('QA Note Field removed', 'info');
    }
}

// QA Notes Fields Rendering (for form sections)
function renderQANotesFields() {
    // This function would render dynamic QA note fields in the form
    // Implementation depends on the specific HTML structure
    console.log('renderQANotesFields called - implement based on HTML structure');
}

// Make functions globally accessible
window.showAddQANoteModal = showAddQANoteModal;
window.addQANote = addQANote;
window.removeQANote = removeQANote;
window.renderQANotesList = renderQANotesList;
window.updateQANotesCount = updateQANotesCount;
window.showAddQANoteFieldModal = showAddQANoteFieldModal;
window.updateQAFieldOptions = updateQAFieldOptions;
window.addQANoteField = addQANoteField;
window.renderQANoteFieldsList = renderQANoteFieldsList;
window.removeQANoteField = removeQANoteField;
window.renderQANotesFields = renderQANotesFields;