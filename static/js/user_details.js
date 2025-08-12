let currentUser = null;
let currentUserId = null;

// Initialize theme early to prevent FOUC
(function () {
    const savedTheme = localStorage.getItem('theme') || localStorage.getItem('sprint-reports-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Update theme button if elements exist
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    if (themeIcon && themeText) {
        if (savedTheme === 'light') {
            themeIcon.className = 'fas fa-moon';
            themeText.textContent = 'Dark';
        } else {
            themeIcon.className = 'fas fa-sun';
            themeText.textContent = 'Light';
        }
    }
})();

// Initialize page
document.addEventListener('DOMContentLoaded', function () {
    // Wait a bit for theme manager to load, then initialize
    setTimeout(() => {
        try {
            if (typeof window.themeManager !== 'undefined' && window.themeManager.init) {
                window.themeManager.init();
            } else if (typeof initializeTheme === 'function') {
                initializeTheme();
            }
        } catch (error) {
            console.warn('Theme manager initialization failed:', error);
        }
    }, 100);

    // Get user ID and other parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentUserId = urlParams.get('id');
    const targetTab = urlParams.get('tab');
    const action = urlParams.get('action');

    console.log('URL parameters:', window.location.search);
    console.log('Extracted user ID:', currentUserId);
    console.log('Target tab:', targetTab);
    console.log('Action:', action);

    if (!currentUserId) {
        showError('No user ID provided in URL. Please access this page from the User Management page.');
        return;
    }

    if (isNaN(currentUserId)) {
        showError('Invalid user ID format. Please check the URL.');
        return;
    }

    // Store parameters for later use
    window.targetTab = targetTab;
    window.targetAction = action;

    // Test API accessibility first, then load user data
    testApiAccess().then(() => {
        loadUserData();
    }).catch((error) => {
        console.error('API access test failed:', error);
        loadUserData(); // Try anyway
    });

    // Setup form handlers
    setupFormHandlers();
});

// Test API accessibility
async function testApiAccess() {
    try {
        const response = await fetch('/api/auth/profile');
        if (!response.ok && response.status !== 401) {
            throw new Error('API not accessible');
        }
        console.log('API is accessible');
    } catch (error) {
        console.warn('API access test failed:', error);
        throw error;
    }
}

// Load user data from API
async function loadUserData() {
    try {
        console.log('Loading user data for ID:', currentUserId);
        showLoading();

        // Validate user ID
        if (!currentUserId || isNaN(currentUserId)) {
            throw new Error('Invalid user ID provided');
        }

        const apiUrl = `/api/users/${currentUserId}`;
        console.log('Fetching from:', apiUrl);

        const response = await fetch(apiUrl);
        console.log('Response status:', response.status);

        if (response.status === 404) {
            throw new Error('User not found');
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        if (data.success && data.user) {
            currentUser = data.user;
            console.log('User data loaded:', currentUser);
            populateUserData(currentUser);
            loadActivityLog();
            hideLoading();

            // Handle URL parameters for tab and actions
            handleUrlParameters();
        } else {
            throw new Error(data.message || 'Failed to load user data');
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showError(error.message);
    }
}

// Handle URL parameters for tab switching and actions
function handleUrlParameters() {
    const targetTab = window.targetTab;
    const targetAction = window.targetAction;

    // Switch to the specified tab if provided
    if (targetTab && ['view', 'profile', 'password', 'settings', 'activity'].includes(targetTab)) {
        switchTab(targetTab);
    }

    // Handle specific actions
    if (targetAction) {
        setTimeout(() => {
            switch (targetAction) {
                case 'delete':
                    showDeleteConfirmation();
                    break;
                case 'approve':
                    if (currentUser && !currentUser.is_approved) {
                        document.getElementById('isApproved').checked = true;
                        showMessage('settingsMessage', 'Please save the settings to approve this user.', 'info');
                    }
                    break;
                case 'toggle-admin':
                    if (currentUser) {
                        document.getElementById('isAdmin').checked = !currentUser.is_admin;
                        showMessage('settingsMessage', 'Admin status has been toggled. Please save the settings to apply changes.', 'info');
                    }
                    break;
                case 'toggle-active':
                    if (currentUser) {
                        document.getElementById('isActive').checked = !currentUser.is_active;
                        showMessage('settingsMessage', 'Active status has been toggled. Please save the settings to apply changes.', 'info');
                    }
                    break;
            }
        }, 500); // Small delay to ensure UI is ready
    }
}

// Populate user data in the UI
function populateUserData(user) {
    // Update page title in browser tab
    document.title = `${user.full_name} - User Information - QA Reports System`;

    // Update profile card
    const initials = getInitials(user.first_name, user.last_name);
    document.getElementById('avatarInitials').textContent = initials;
    document.getElementById('userName').textContent = user.full_name;
    document.getElementById('userEmail').textContent = user.email;

    // Update status indicator
    const statusEl = document.getElementById('userStatus');
    statusEl.className = 'avatar-status ' + (user.is_active ? 'active' : 'inactive');

    // Update badges
    const badgesEl = document.getElementById('userBadges');
    badgesEl.innerHTML = '';

    if (user.is_admin) {
        badgesEl.innerHTML += '<span class="badge admin"><i class="fas fa-crown"></i> Admin</span>';
    } else {
        badgesEl.innerHTML += '<span class="badge user"><i class="fas fa-user"></i> User</span>';
    }

    if (user.is_approved) {
        badgesEl.innerHTML += '<span class="badge approved"><i class="fas fa-check"></i> Approved</span>';
    } else {
        badgesEl.innerHTML += '<span class="badge pending"><i class="fas fa-clock"></i> Pending</span>';
    }

    if (!user.is_active) {
        badgesEl.innerHTML += '<span class="badge inactive"><i class="fas fa-ban"></i> Inactive</span>';
    }

    // Update stats
    document.getElementById('totalReports').textContent = '0'; // TODO: Get from API
    document.getElementById('loginCount').textContent = '0'; // TODO: Get from API
    document.getElementById('memberSince').textContent = formatDate(user.created_at);
    document.getElementById('lastLogin').textContent = user.last_login ? formatDate(user.last_login) : 'Never';
    document.getElementById('lastUpdated').textContent = formatDate(user.updated_at);

    // Populate view information tab
    populateViewTab(user);

    // Populate form fields
    document.getElementById('firstName').value = user.first_name || '';
    document.getElementById('lastName').value = user.last_name || '';
    document.getElementById('username').value = user.username || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phoneNumber').value = user.phone_number || '';

    // Populate settings
    document.getElementById('isAdmin').checked = user.is_admin;
    document.getElementById('isApproved').checked = user.is_approved;
    document.getElementById('isActive').checked = user.is_active;
}

// Populate the view information tab
function populateViewTab(user) {
    // Personal Details
    document.getElementById('viewFullName').textContent = user.full_name || '-';
    document.getElementById('viewFirstName').textContent = user.first_name || '-';
    document.getElementById('viewLastName').textContent = user.last_name || '-';

    const usernameEl = document.getElementById('viewUsername');
    if (user.username) {
        usernameEl.textContent = user.username;
        usernameEl.classList.remove('empty');
    } else {
        usernameEl.textContent = 'Not set';
        usernameEl.classList.add('empty');
    }

    // Contact Information
    document.getElementById('viewEmail').textContent = user.email || '-';

    const phoneEl = document.getElementById('viewPhone');
    if (user.phone_number) {
        phoneEl.textContent = user.phone_number;
        phoneEl.classList.remove('empty');
    } else {
        phoneEl.textContent = 'Not provided';
        phoneEl.classList.add('empty');
    }

    // Account Status
    const roleEl = document.getElementById('viewRole');
    roleEl.textContent = user.is_admin ? 'Administrator' : 'User';
    roleEl.className = 'info-value ' + (user.is_admin ? 'role-admin' : 'role-user');

    const statusEl = document.getElementById('viewAccountStatus');
    statusEl.textContent = user.is_active ? 'Active' : 'Inactive';
    statusEl.className = 'info-value ' + (user.is_active ? 'status-active' : 'status-inactive');

    const approvalEl = document.getElementById('viewApprovalStatus');
    approvalEl.textContent = user.is_approved ? 'Approved' : 'Pending Approval';
    approvalEl.className = 'info-value ' + (user.is_approved ? 'status-approved' : 'status-pending');

    // Account Timeline
    document.getElementById('viewUserId').textContent = user.id;
    document.getElementById('viewMemberSince').textContent = formatDate(user.created_at);
    document.getElementById('viewLastLogin').textContent = user.last_login ? formatDate(user.last_login) : 'Never logged in';
    document.getElementById('viewLastUpdated').textContent = formatDate(user.updated_at);
}

// Load activity log
async function loadActivityLog() {
    const activityEl = document.getElementById('activityLog');

    // For now, show placeholder data since we don't have activity tracking
    // TODO: Implement proper activity logging in the backend
    activityEl.innerHTML = `
        <div class="activity-item">
            <div class="activity-icon login">
                <i class="fas fa-sign-in-alt"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">Account Created</div>
                <div class="activity-desc">User account was created</div>
                <div class="activity-time">
                    <i class="fas fa-clock"></i>
                    ${formatDate(currentUser.created_at)}
                </div>
            </div>
        </div>
        ${currentUser.last_login ? `
        <div class="activity-item">
            <div class="activity-icon login">
                <i class="fas fa-sign-in-alt"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">Last Login</div>
                <div class="activity-desc">User logged into the system</div>
                <div class="activity-time">
                    <i class="fas fa-clock"></i>
                    ${formatDate(currentUser.last_login)}
                </div>
            </div>
        </div>
        ` : ''}
        <div class="empty-state">
            <i class="fas fa-history"></i>
            <h3>Activity Tracking Coming Soon</h3>
            <p>Detailed activity logging will be available in a future update.</p>
        </div>
    `;
}

// Setup form handlers
function setupFormHandlers() {
    // Profile form submission
    document.getElementById('profileForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        await updateUserProfile();
    });

    // Password strength checker
    document.getElementById('newPassword').addEventListener('input', function () {
        checkPasswordStrength(this.value);
    });
}

// Update user profile
async function updateUserProfile() {
    const submitBtn = document.querySelector('#profileForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.classList.add('loading');

        const formData = new FormData(document.getElementById('profileForm'));
        const data = {
            first_name: formData.get('firstName').trim(),
            last_name: formData.get('lastName').trim(),
            username: formData.get('username') ? formData.get('username').trim() : null,
            email: formData.get('email').trim().toLowerCase(),
            phone_number: formData.get('phoneNumber') ? formData.get('phoneNumber').trim() : null
        };

        // Basic validation
        if (!data.first_name || !data.last_name || !data.email) {
            throw new Error('First name, last name, and email are required');
        }

        if (!isValidEmail(data.email)) {
            throw new Error('Please enter a valid email address');
        }

        const response = await fetch(`/api/users/${currentUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showMessage('profileMessage', 'Profile updated successfully!', 'success');
            // Reload user data to reflect changes
            await loadUserData();
        } else {
            showMessage('profileMessage', result.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage('profileMessage', error.message || 'An error occurred while updating the profile', 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        submitBtn.classList.remove('loading');
    }
}

// Update user settings (without password)
async function updateUserSettings() {
    const updateBtn = document.querySelector('button[onclick="updateUserSettings()"]');
    const originalText = updateBtn.innerHTML;

    try {
        // Show loading state
        updateBtn.disabled = true;
        updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        updateBtn.classList.add('loading');

        const data = {
            is_admin: document.getElementById('isAdmin').checked,
            is_approved: document.getElementById('isApproved').checked,
            is_active: document.getElementById('isActive').checked
        };

        const response = await fetch(`/api/users/${currentUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showMessage('settingsMessage', 'Settings updated successfully!', 'success');
            // Reload user data to reflect changes
            await loadUserData();
        } else {
            showMessage('settingsMessage', result.message || 'Failed to update settings', 'error');
        }
    } catch (error) {
        console.error('Error updating settings:', error);
        showMessage('settingsMessage', error.message || 'An error occurred while updating settings', 'error');
    } finally {
        // Reset button state
        updateBtn.disabled = false;
        updateBtn.innerHTML = originalText;
        updateBtn.classList.remove('loading');
    }
}

// Change user password (separate function)
async function changeUserPassword() {
    const changeBtn = document.querySelector('button[onclick="changeUserPassword()"]');
    const originalText = changeBtn.innerHTML;

    try {
        // Show loading state
        changeBtn.disabled = true;
        changeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Changing...';
        changeBtn.classList.add('loading');

        const newPassword = document.getElementById('newPassword').value;

        if (!newPassword) {
            throw new Error('Please enter a new password');
        }

        // Validate password strength
        if (newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        const data = {
            password: newPassword
        };

        const response = await fetch(`/api/users/${currentUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showMessage('passwordMessage', 'Password changed successfully!', 'success');
            document.getElementById('newPassword').value = '';
            hidePasswordStrength();
        } else {
            showMessage('passwordMessage', result.message || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showMessage('passwordMessage', error.message || 'An error occurred while changing password', 'error');
    } finally {
        // Reset button state
        changeBtn.disabled = false;
        changeBtn.innerHTML = originalText;
        changeBtn.classList.remove('loading');
    }
}

// Tab switching
function switchTab(tabName) {
    // Remove active class from all tabs and buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to selected tab and button
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');

    // Clear any messages when switching tabs
    const messages = document.querySelectorAll('.message');
    messages.forEach(msg => msg.classList.remove('show'));
}

// Password strength checker
function checkPasswordStrength(password) {
    const strengthEl = document.getElementById('passwordStrength');
    const fillEl = document.getElementById('strengthFill');
    const labelEl = document.getElementById('strengthLabel');
    const percentEl = document.getElementById('strengthPercent');

    if (!password) {
        hidePasswordStrength();
        return;
    }

    strengthEl.style.display = 'block';

    const requirements = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    // Update requirement indicators
    Object.keys(requirements).forEach(req => {
        const reqEl = document.getElementById(`req-${req}`);
        const icon = reqEl.querySelector('i');
        if (requirements[req]) {
            reqEl.classList.add('met');
            icon.className = 'fas fa-check';
        } else {
            reqEl.classList.remove('met');
            icon.className = 'fas fa-times';
        }
    });

    // Calculate strength
    const metCount = Object.values(requirements).filter(Boolean).length;
    const strength = (metCount / 5) * 100;

    fillEl.style.width = `${strength}%`;
    percentEl.textContent = `${Math.round(strength)}%`;

    // Update strength class and label
    fillEl.className = 'strength-fill';
    if (strength < 40) {
        fillEl.classList.add('strength-weak');
        labelEl.textContent = 'Weak';
    } else if (strength < 60) {
        fillEl.classList.add('strength-fair');
        labelEl.textContent = 'Fair';
    } else if (strength < 80) {
        fillEl.classList.add('strength-good');
        labelEl.textContent = 'Good';
    } else {
        fillEl.classList.add('strength-strong');
        labelEl.textContent = 'Strong';
    }
}

function hidePasswordStrength() {
    document.getElementById('passwordStrength').style.display = 'none';
}

// Password toggle
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const icon = field.nextElementSibling.querySelector('i');

    if (field.type === 'password') {
        field.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        field.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Reset form
function resetForm() {
    if (currentUser) {
        populateUserData(currentUser);
    }
}

// Reset password form
function resetPasswordForm() {
    document.getElementById('newPassword').value = '';
    hidePasswordStrength();
}

// Reset settings form
function resetSettingsForm() {
    if (currentUser) {
        document.getElementById('isAdmin').checked = currentUser.is_admin;
        document.getElementById('isApproved').checked = currentUser.is_approved;
        document.getElementById('isActive').checked = currentUser.is_active;
    }
}

// Delete user confirmation
function showDeleteConfirmation() {
    document.getElementById('confirmationDialog').style.display = 'flex';
}

function hideDeleteConfirmation() {
    document.getElementById('confirmationDialog').style.display = 'none';
}

async function deleteUser() {
    try {
        const response = await fetch(`/api/users/${currentUserId}/delete`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            // Redirect to user management page
            window.location.href = '/user-management';
        } else {
            hideDeleteConfirmation();
            showError(result.message || 'Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        hideDeleteConfirmation();
        showError('An error occurred while deleting the user');
    }
}

// Refresh user data
async function refreshUserData() {
    await loadUserData();
}

// Utility functions
function showLoading() {
    document.getElementById('loadingContainer').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('errorContainer').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingContainer').style.display = 'none';
    document.getElementById('mainContent').style.display = 'grid';
    document.getElementById('errorContainer').style.display = 'none';
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('loadingContainer').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('errorContainer').style.display = 'block';
}

function showMessage(containerId, message, type) {
    const messageEl = document.getElementById(containerId);
    messageEl.className = `message message-${type} show`;
    messageEl.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;

    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 5000);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function getInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'U';
}

// Define theme toggle function if not already available
if (typeof window.toggleTheme === 'undefined') {
    window.toggleTheme = function () {
        try {
            if (window.themeManager && typeof window.themeManager.toggleTheme === 'function') {
                window.themeManager.toggleTheme();
            } else {
                // Fallback manual theme toggle
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';

                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                localStorage.setItem('sprint-reports-theme', newTheme);

                const themeIcon = document.getElementById('theme-icon');
                const themeText = document.getElementById('theme-text');

                if (themeIcon && themeText) {
                    if (newTheme === 'light') {
                        themeIcon.className = 'fas fa-moon';
                        themeText.textContent = 'Dark';
                    } else {
                        themeIcon.className = 'fas fa-sun';
                        themeText.textContent = 'Light';
                    }
                }

                console.log('Theme toggled to:', newTheme);
            }
        } catch (error) {
            console.error('Theme toggle failed:', error);
        }
    };
}

// Handle keyboard shortcuts
document.addEventListener('keydown', function (e) {
    // Ctrl/Cmd + S to save based on active tab
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab && activeTab.id === 'profileTab') {
            updateUserProfile();
        } else if (activeTab && activeTab.id === 'passwordTab') {
            changeUserPassword();
        } else if (activeTab && activeTab.id === 'settingsTab') {
            updateUserSettings();
        }
    }

    // Escape to close confirmation dialog
    if (e.key === 'Escape') {
        hideDeleteConfirmation();
    }
});