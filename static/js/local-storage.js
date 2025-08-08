// static/js/local-storage.js
// LocalStorage Functions

function saveFormDataToLocalStorage() {
    try {
        const form = document.getElementById('qaReportForm');
        if (!form) {
            console.error('Form not found for localStorage save');
            return;
        }

        const formData = new FormData(form);
        const data = {};

        // Save basic form fields
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Save report type
        data.reportType = window.currentReportType || 'sprint';

        localStorage.setItem(window.FORM_DATA_KEY || 'qaReportFormData', JSON.stringify(data));

        // Save array data separately
        const arrayData = {
            requestData: window.requestData || [],
            buildData: window.buildData || [],
            testerData: window.testerData || [],
            teamMemberData: window.teamMemberData || [],
            qaNoteFieldsData: window.qaNoteFieldsData || [],
            qaNotesData: window.qaNotesData || [],
            evaluationData: window.evaluationData || [],
            bugsData: window.bugsData || [],
            performanceScenarios: window.performanceScenarios || [],
            httpRequestsOverview: window.httpRequestsOverview || [],
            servicesData: window.servicesData || [],
            modulesData: window.modulesData || []
        };

        localStorage.setItem(window.FORM_ARRAYS_KEY || 'qaReportArrayData', JSON.stringify(arrayData));

        console.log('Form data saved to localStorage');
    } catch (error) {
        console.error('Error saving form data to localStorage:', error);
    }
}

function loadFormDataFromLocalStorage() {
    try {
        // Load basic form data
        const savedData = localStorage.getItem(window.FORM_DATA_KEY || 'qaReportFormData');
        if (savedData) {
            const data = JSON.parse(savedData);
            const form = document.getElementById('qaReportForm');
            
            if (form) {
                // Set report type first if available
                if (data.reportType && typeof changeReportType === 'function') {
                    changeReportType(data.reportType);
                }

                // Load form fields
                Object.keys(data).forEach(key => {
                    const field = form.querySelector(`[name="${key}"]`);
                    if (field && data[key]) {
                        field.value = data[key];
                    }
                });
            }
        }

        // Load array data
        const savedArrayData = localStorage.getItem(window.FORM_ARRAYS_KEY || 'qaReportArrayData');
        if (savedArrayData) {
            const arrayObject = JSON.parse(savedArrayData);

            // Restore all arrays
            if (arrayObject.requestData) {
                window.requestData = arrayObject.requestData;
                if (typeof renderRequestList === 'function') renderRequestList();
            }

            if (arrayObject.buildData) {
                window.buildData = arrayObject.buildData;
                if (typeof renderBuildList === 'function') renderBuildList();
            }

            if (arrayObject.testerData) {
                window.testerData = arrayObject.testerData;
                if (typeof renderTesterList === 'function') renderTesterList();
            }

            if (arrayObject.teamMemberData) {
                window.teamMemberData = arrayObject.teamMemberData;
                if (typeof renderTeamMemberList === 'function') renderTeamMemberList();
            }

            if (arrayObject.qaNoteFieldsData) {
                window.qaNoteFieldsData = arrayObject.qaNoteFieldsData;
                if (typeof renderQANoteFieldsList === 'function') renderQANoteFieldsList();
            }

            if (arrayObject.qaNotesData) {
                window.qaNotesData = arrayObject.qaNotesData;
                if (typeof renderQANotesList === 'function') renderQANotesList();
                if (typeof updateQANotesCount === 'function') updateQANotesCount();
            }

            if (arrayObject.evaluationData) {
                window.evaluationData = arrayObject.evaluationData;
                if (typeof loadEvaluationData === 'function') loadEvaluationData(arrayObject.evaluationData);
            }

            if (arrayObject.bugsData) {
                window.bugsData = arrayObject.bugsData;
                if (typeof renderBugsList === 'function') renderBugsList();
            }

            if (arrayObject.performanceScenarios) {
                window.performanceScenarios = arrayObject.performanceScenarios;
                if (typeof renderScenariosList === 'function') renderScenariosList();
            }

            if (arrayObject.httpRequestsOverview) {
                window.httpRequestsOverview = arrayObject.httpRequestsOverview;
                if (typeof renderHttpRequestsTable === 'function') renderHttpRequestsTable();
            }

            if (arrayObject.servicesData) {
                window.servicesData = arrayObject.servicesData;
                if (typeof renderServicesList === 'function') renderServicesList();
            }

            if (arrayObject.modulesData) {
                window.modulesData = arrayObject.modulesData;
                if (typeof renderModulesList === 'function') renderModulesList();
            }
        } else {
            console.log('No saved array data found');
        }

        console.log('Form data loaded from localStorage');
    } catch (error) {
        console.error('Error loading form data from localStorage:', error);
    }
}

function clearFormDataFromLocalStorage() {
    try {
        localStorage.removeItem(window.FORM_DATA_KEY || 'qaReportFormData');
        localStorage.removeItem(window.FORM_ARRAYS_KEY || 'qaReportArrayData');
        console.log('Form data cleared from localStorage');
    } catch (error) {
        console.error('Error clearing form data from localStorage:', error);
    }
}

function autoSaveFormData() {
    if (window.autoSaveTimeout) {
        clearTimeout(window.autoSaveTimeout);
    }
    window.autoSaveTimeout = setTimeout(() => {
        console.log('Auto-saving form data...');
        saveFormDataToLocalStorage();
    }, 1000); // Save after 1 second of inactivity
}

// Add event listeners for auto-save
function setupAutoSave() {
    const form = document.getElementById('qaReportForm');
    if (form) {
        console.log('Setting up autosave on form');
        form.addEventListener('input', autoSaveFormData);
        form.addEventListener('change', autoSaveFormData);
    } else {
        console.error('qaReportForm not found - autosave not set up');
    }
}

// Clear localStorage when form is submitted
function clearFormDataOnSubmit() {
    try {
        // Clear form data from localStorage
        clearFormDataFromLocalStorage();

        // Reset all form arrays for all report types
        window.requestData = [];
        window.buildData = [];
        window.testerData = [];
        window.teamMemberData = [];
        window.qaNoteFieldsData = [];
        window.qaNotesData = [];
        window.evaluationData = [];
        window.bugsData = [];
        window.performanceScenarios = [];
        window.httpRequestsOverview = [];
        window.servicesData = [];
        window.modulesData = [];

        // Reset form fields
        const form = document.getElementById('qaReportForm');
        if (form) {
            form.reset();
        }

        // Reset charts and calculations if they exist
        if (typeof resetAllCharts === 'function') {
            resetAllCharts();
        }
        if (typeof resetAllCalculations === 'function') {
            resetAllCalculations();
        }

        // Reset current section to the first one
        window.currentSection = 0;
        if (typeof updateNavigationButtons === 'function') {
            updateNavigationButtons();
        }

        console.log('Form data cleared after successful submission');
    } catch (error) {
        console.error('Error clearing form data after submission:', error);
    }
}

// Override the existing arrays when they're modified
function setupAutoSaveOverrides() {
    const originalAddRequest = window.addRequest;
    const originalAddBuild = window.addBuild;
    const originalAddSelectedTester = window.addSelectedTester;
    const originalAddSelectedTeamMember = window.addSelectedTeamMember;

    if (typeof originalAddRequest === 'function') {
        window.addRequest = function (...args) {
            const result = originalAddRequest.apply(this, args);
            autoSaveFormData();
            return result;
        };
    }

    if (typeof originalAddBuild === 'function') {
        window.addBuild = function (...args) {
            const result = originalAddBuild.apply(this, args);
            autoSaveFormData();
            return result;
        };
    }

    if (typeof originalAddSelectedTester === 'function') {
        window.addSelectedTester = function (...args) {
            const result = originalAddSelectedTester.apply(this, args);
            autoSaveFormData();
            return result;
        };
    }

    if (typeof originalAddSelectedTeamMember === 'function') {
        window.addSelectedTeamMember = function (...args) {
            const result = originalAddSelectedTeamMember.apply(this, args);
            autoSaveFormData();
            return result;
        };
    }
}

// Make functions globally accessible
window.saveFormDataToLocalStorage = saveFormDataToLocalStorage;
window.loadFormDataFromLocalStorage = loadFormDataFromLocalStorage;
window.clearFormDataFromLocalStorage = clearFormDataFromLocalStorage;
window.autoSaveFormData = autoSaveFormData;
window.setupAutoSave = setupAutoSave;
window.clearFormDataOnSubmit = clearFormDataOnSubmit;
window.setupAutoSaveOverrides = setupAutoSaveOverrides;