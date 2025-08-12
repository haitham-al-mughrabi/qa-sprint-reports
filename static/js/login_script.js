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

// Handle form submission
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginSpinner = document.getElementById('loginSpinner');

    // Show loading state
    loginBtn.disabled = true;
    loginBtnText.style.display = 'none';
    loginSpinner.style.display = 'block';
    hideError();

    try {
        const formData = new FormData(this);
        const data = {
            identifier: formData.get('identifier'),
            password: formData.get('password')
        };

        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showToast('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = result.redirect || '/dashboard';
            }, 1000);
        } else {
            showError(result.message || 'Login failed');
        }

    } catch (error) {
        showError('Network error. Please try again.');
    } finally {
        // Reset button state
        loginBtn.disabled = false;
        loginBtnText.style.display = 'block';
        loginSpinner.style.display = 'none';
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