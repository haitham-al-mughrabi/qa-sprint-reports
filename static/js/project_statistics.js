
function waitForChart() {
    return new Promise((resolve) => {
        if (window.Chart) {
            resolve();
        } else {
            const checkChart = () => {
                if (window.Chart) {
                    resolve();
                } else {
                    setTimeout(checkChart, 100);
                }
            };
            checkChart();
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Load user info first
    await loadUserInfo();

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

    // Wait for Chart.js to load
    await waitForChart();
});

// Authentication functions
async function loadUserInfo() {
    try {
        const response = await fetch('/api/auth/profile');
        if (response.ok) {
            const user = await response.json();
            document.getElementById('userDisplayName').textContent = user.first_name;

            // Show admin links if user is admin
            if (user.role === 'admin') {
                document.getElementById('adminLinks').style.display = 'block';
            }
        } else {
            // User not authenticated, redirect to login
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Failed to load user info:', error);
        window.location.href = '/login';
    }
}

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    } catch (error) {
        window.location.href = '/login';
    }
}

function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('mobile-active');
}
