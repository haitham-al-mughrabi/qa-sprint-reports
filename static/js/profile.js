// Show/hide tabs
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.profile-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Clear any messages when switching tabs
    hideMessages('info');
    hideMessages('password');
}

// Toggle password visibility
function togglePasswordVisibility(inputId, iconId) {
    const passwordInput = document.getElementById(inputId);
    const toggleIcon = document.getElementById(iconId);
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Show/hide messages
function showMessage(type, message, tabPrefix = '') {
    const errorDiv = document.getElementById(tabPrefix + 'ErrorMessage');
    const successDiv = document.getElementById(tabPrefix + 'SuccessMessage');
    
    if (type === 'error') {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        successDiv.style.display = 'none';
    } else {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        errorDiv.style.display = 'none';
    }
}

function hideMessages(tabPrefix = '') {
    const errorDiv = document.getElementById(tabPrefix + 'ErrorMessage');
    const successDiv = document.getElementById(tabPrefix + 'SuccessMessage');
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
}

// Show toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <div class="toast-icon"></div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Validate password requirements
function validatePassword(password) {
    const requirements = {
        'req-length': password.length >= 8,
        'req-uppercase': /[A-Z]/.test(password),
        'req-lowercase': /[a-z]/.test(password),
        'req-number': /\d/.test(password),
        'req-special': /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    Object.keys(requirements).forEach(reqId => {
        const element = document.getElementById(reqId);
        if (element) {
            if (requirements[reqId]) {
                element.classList.add('valid');
            } else {
                element.classList.remove('valid');
            }
        }
    });

    return Object.values(requirements).every(req => req);
}

// Reset forms
function resetInfoForm() {
    document.getElementById('infoForm').reset();
    hideMessages('info');
}

function resetPasswordForm() {
    document.getElementById('passwordForm').reset();
    hideMessages('password');
    // Reset password requirements
    document.querySelectorAll('#passwordRequirements li').forEach(li => {
        li.classList.remove('valid');
    });
}

// Handle information form submission
document.getElementById('infoForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('infoSubmitBtn');
    const submitText = document.getElementById('infoSubmitText');
    const spinner = document.getElementById('infoSpinner');
    
    submitBtn.disabled = true;
    submitText.style.display = 'none';
    spinner.style.display = 'block';
    hideMessages('info');
    
    try {
        const formData = new FormData(this);
        const data = {
            action: 'update_info',
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            phone_number: formData.get('phone_number'),
            username: formData.get('username')
        };
        
        const response = await fetch('/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('success', result.message, 'info');
            showToast('Profile updated successfully!', 'success');
            
            // Update header display
            const firstName = formData.get('first_name');
            const lastName = formData.get('last_name');
            document.getElementById('profileName').textContent = `${firstName} ${lastName}`;
            document.getElementById('navUserName').textContent = firstName;
        } else {
            showMessage('error', result.message, 'info');
        }
        
    } catch (error) {
        showMessage('error', 'Network error. Please try again.', 'info');
    } finally {
        submitBtn.disabled = false;
        submitText.style.display = 'block';
        spinner.style.display = 'none';
    }
});

// Handle password form submission
document.getElementById('passwordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('passwordSubmitBtn');
    const submitText = document.getElementById('passwordSubmitText');
    const spinner = document.getElementById('passwordSpinner');
    
    submitBtn.disabled = true;
    submitText.style.display = 'none';
    spinner.style.display = 'block';
    hideMessages('password');
    
    try {
        const formData = new FormData(this);
        const newPassword = formData.get('new_password');
        const confirmPassword = formData.get('confirm_password');
        
        // Client-side validation
        if (newPassword !== confirmPassword) {
            showMessage('error', 'New passwords do not match', 'password');
            return;
        }
        
        if (!validatePassword(newPassword)) {
            showMessage('error', 'Password does not meet security requirements', 'password');
            return;
        }
        
        const data = {
            action: 'change_password',
            old_password: formData.get('old_password'),
            new_password: newPassword,
            confirm_password: confirmPassword
        };
        
        const response = await fetch('/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('success', result.message, 'password');
            showToast('Password changed successfully!', 'success');
            this.reset();
            // Reset password requirements
            document.querySelectorAll('#passwordRequirements li').forEach(li => {
                li.classList.remove('valid');
            });
        } else {
            showMessage('error', result.message, 'password');
        }
        
    } catch (error) {
        showMessage('error', 'Network error. Please try again.', 'password');
    } finally {
        submitBtn.disabled = false;
        submitText.style.display = 'block';
        spinner.style.display = 'none';
    }
});

// Password input event listener
document.getElementById('new_password').addEventListener('input', function(e) {
    validatePassword(e.target.value);
});

// Theme toggle function
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    if (newTheme === 'light') {
        themeIcon.className = 'fas fa-moon';
        themeText.textContent = 'Dark';
    } else {
        themeIcon.className = 'fas fa-sun';
        themeText.textContent = 'Light';
    }
}

// Initialize theme and check admin status
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    if (savedTheme === 'light') {
        themeIcon.className = 'fas fa-moon';
        themeText.textContent = 'Dark';
    } else {
        themeIcon.className = 'fas fa-sun';
        themeText.textContent = 'Light';
    }

    // Check admin status from HTML attribute
    const isAdmin = document.body.dataset.isAdmin === 'true';
    if (window.isAdmin) {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'block';
        });
    }    
});

