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

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Hide error message
function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.style.display = 'none';
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
    
    // Auto remove after 5 seconds
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
        if (requirements[reqId]) {
            element.classList.add('valid');
        } else {
            element.classList.remove('valid');
        }
    });

    return Object.values(requirements).every(req => req);
}

// Password input event listener
document.getElementById('new_password').addEventListener('input', function(e) {
    validatePassword(e.target.value);
});

// Handle form submission
document.getElementById('resetPasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    const resetPasswordBtnText = document.getElementById('resetPasswordBtnText');
    const resetPasswordSpinner = document.getElementById('resetPasswordSpinner');
    
    // Show loading state
    resetPasswordBtn.disabled = true;
    resetPasswordBtnText.style.display = 'none';
    resetPasswordSpinner.style.display = 'block';
    hideError();
    
    try {
        const formData = new FormData(this);
        const newPassword = formData.get('new_password');
        const confirmPassword = formData.get('confirm_password');
        
        // Client-side validation
        if (newPassword !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        if (!validatePassword(newPassword)) {
            showError('Password does not meet security requirements');
            return;
        }
        
        const data = {
            new_password: newPassword,
            confirm_password: confirmPassword
        };
        
        const response = await fetch('/reset-password-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Password updated successfully! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = result.redirect || '/login';
            }, 2000);
        } else {
            showError(result.message || 'Password update failed');
        }
        
    } catch (error) {
        showError('Network error. Please try again.');
    } finally {
        // Reset button state
        resetPasswordBtn.disabled = false;
        resetPasswordBtnText.style.display = 'block';
        resetPasswordSpinner.style.display = 'none';
    }
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

// Initialize theme
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
});
