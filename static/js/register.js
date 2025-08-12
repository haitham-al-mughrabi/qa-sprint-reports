// Toggle password visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('togglePassword');

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
document.getElementById('password').addEventListener('input', function (e) {
    validatePassword(e.target.value);
});

// Handle form submission
document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const registerBtn = document.getElementById('registerBtn');
    const registerBtnText = document.getElementById('registerBtnText');
    const registerSpinner = document.getElementById('registerSpinner');

    // Show loading state
    registerBtn.disabled = true;
    registerBtnText.style.display = 'none';
    registerSpinner.style.display = 'block';
    hideError();

    try {
        const formData = new FormData(this);
        const data = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email'),
            phone_number: formData.get('phone_number'),
            username: formData.get('username'),
            password: formData.get('password')
        };

        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showToast('Registration successful! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = result.redirect || '/login';
            }, 2000);
        } else {
            showError(result.message || 'Registration failed');
        }

    } catch (error) {
        showError('Network error. Please try again.');
    } finally {
        // Reset button state
        registerBtn.disabled = false;
        registerBtnText.style.display = 'block';
        registerSpinner.style.display = 'none';
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
document.addEventListener('DOMContentLoaded', function () {
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
