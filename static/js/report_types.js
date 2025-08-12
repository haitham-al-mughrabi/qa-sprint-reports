
// Check if Font Awesome is loaded and force reload if needed
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        // Check if Font Awesome icons are loaded by testing a known icon
        const testIcon = document.createElement('i');
        testIcon.className = 'fas fa-info-circle';
        testIcon.style.position = 'absolute';
        testIcon.style.left = '-9999px';
        document.body.appendChild(testIcon);

        const computedStyle = window.getComputedStyle(testIcon, ':before');
        const content = computedStyle.getPropertyValue('content');

        // If Font Awesome isn't loaded, the content will be 'none' or empty
        if (!content || content === 'none' || content === '""') {
            console.warn('Font Awesome icons not loaded, attempting to reload...');

            // Try to reload Font Awesome
            const faLink = document.createElement('link');
            faLink.rel = 'stylesheet';
            faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            faLink.crossOrigin = 'anonymous';
            document.head.appendChild(faLink);
        }

        document.body.removeChild(testIcon);
    }, 1000);
});

// Global theme toggle function for compatibility
function toggleTheme() {
    if (window.themeManager && typeof window.themeManager.toggleTheme === 'function') {
        window.themeManager.toggleTheme();
    } else {
        // Fallback theme toggle implementation
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        // Update button text and icon
        const themeIcon = document.getElementById('theme-icon');
        const themeText = document.getElementById('theme-text');
        if (themeIcon && themeText) {
            if (newTheme === 'dark') {
                themeIcon.className = 'fas fa-moon';
                themeText.textContent = 'Dark';
            } else {
                themeIcon.className = 'fas fa-sun';
                themeText.textContent = 'Light';
            }
        }
    }
}

// Initialize theme when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme - try theme manager first, fallback to manual
    if (window.themeManager && typeof window.themeManager.init === 'function') {
        window.themeManager.init();
    } else {
        // Fallback theme initialization
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);

        // Update button to match current theme
        const themeIcon = document.getElementById('theme-icon');
        const themeText = document.getElementById('theme-text');
        if (themeIcon && themeText) {
            if (savedTheme === 'dark') {
                themeIcon.className = 'fas fa-moon';
                themeText.textContent = 'Dark';
            } else {
                themeIcon.className = 'fas fa-sun';
                themeText.textContent = 'Light';
            }
        }
    }

    // Set active class for navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === window.location.pathname) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// Report type selection function
function selectReportType(type) {
    console.log(`Selected report type: ${type}`);

    // Add visual feedback
    const card = event.currentTarget;
    card.style.transform = 'scale(0.98)';

    setTimeout(() => {
        card.style.transform = '';

        // Here you would typically redirect to the appropriate form
        // For now, we'll just show an alert
        switch (type) {
            case 'sprint':
                window.location.href = '/sprint-report';
                break;
            case 'manual':
                window.location.href = '/manual-report';
                break;
            case 'automation':
                alert('Automation Report form coming soon...');
                // window.location.href = '/create-report?type=automation';
                break;
            case 'performance':
                alert('Performance Report form coming soon...');
                // window.location.href = '/create-report?type=performance';
                break;
            default:
                alert('Unknown report type');
        }
    }, 150);
}
