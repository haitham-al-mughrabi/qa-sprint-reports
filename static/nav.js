/**
 * Navigation functionality for QA Reports System
 */

// Navigation state
let mobileMenuOpen = false;
let userDropdownOpen = false;

// Initialize navigation
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeUserDropdown();
    initializeMobileMenu();
    updateActiveNavLink();
    loadUserInfo();
});

/**
 * Initialize navigation functionality
 */
function initializeNavigation() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        const userDropdown = document.querySelector('.nav-dropdown');
        const mobileMenu = document.querySelector('.nav-links');
        
        // Close user dropdown if clicking outside
        if (userDropdown && !userDropdown.contains(event.target)) {
            closeUserDropdown();
        }
        
        // Close mobile menu if clicking outside
        if (mobileMenu && !mobileMenu.contains(event.target) && 
            !event.target.closest('.mobile-menu-toggle')) {
            closeMobileMenu();
        }
    });

    // Handle escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeUserDropdown();
            closeMobileMenu();
        }
    });
}

/**
 * Initialize user dropdown functionality
 */
function initializeUserDropdown() {
    const dropdownBtn = document.querySelector('.nav-dropdown-btn');
    if (dropdownBtn) {
        dropdownBtn.addEventListener('click', function(event) {
            event.stopPropagation();
            toggleUserDropdown();
        });
    }
}

/**
 * Initialize mobile menu functionality
 */
function initializeMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function(event) {
            event.stopPropagation();
            toggleMobileMenu();
        });
    }
}

/**
 * Toggle user dropdown
 */
function toggleUserDropdown() {
    const dropdown = document.querySelector('.nav-dropdown');
    if (dropdown) {
        if (userDropdownOpen) {
            closeUserDropdown();
        } else {
            openUserDropdown();
        }
    }
}

/**
 * Open user dropdown
 */
function openUserDropdown() {
    const dropdown = document.querySelector('.nav-dropdown');
    if (dropdown) {
        dropdown.classList.add('active');
        userDropdownOpen = true;
        
        // Close mobile menu if open
        closeMobileMenu();
    }
}

/**
 * Close user dropdown
 */
function closeUserDropdown() {
    const dropdown = document.querySelector('.nav-dropdown');
    if (dropdown) {
        dropdown.classList.remove('active');
        userDropdownOpen = false;
    }
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
    if (mobileMenuOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

/**
 * Open mobile menu
 */
function openMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    if (navLinks) {
        navLinks.classList.add('active');
        mobileMenuOpen = true;
        
        // Update toggle icon
        if (toggle) {
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-times';
            }
        }
        
        // Close user dropdown if open
        closeUserDropdown();
    }
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    if (navLinks) {
        navLinks.classList.remove('active');
        mobileMenuOpen = false;
        
        // Update toggle icon
        if (toggle) {
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-bars';
            }
        }
    }
}

/**
 * Update active navigation link based on current page
 */
function updateActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        const href = link.getAttribute('href');
        if (href && (currentPath === href || 
            (href !== '/' && currentPath.startsWith(href)))) {
            link.classList.add('active');
        }
    });
}

/**
 * Show/hide admin-only elements based on user role
 */
function updateAdminElements(isAdmin) {
    const adminElements = document.querySelectorAll('.admin-only');
    const navContainer = document.querySelector('.nav-container');
    
    if (isAdmin) {
        adminElements.forEach(el => el.style.display = 'flex');
        if (navContainer) {
            navContainer.classList.add('user-admin');
        }
    } else {
        adminElements.forEach(el => el.style.display = 'none');
        if (navContainer) {
            navContainer.classList.remove('user-admin');
        }
    }
}

/**
 * Update user information in navigation
 */
function updateUserInfo(user) {
    const userNameElements = document.querySelectorAll('.user-name');
    const userEmailElements = document.querySelectorAll('.user-email');
    
    if (user) {
        userNameElements.forEach(el => {
            el.textContent = user.first_name || user.full_name || 'User';
        });
        
        userEmailElements.forEach(el => {
            el.textContent = user.email || '';
        });
        
        // Update admin elements
        updateAdminElements(user.is_admin);
    }
}

/**
 * Theme toggle functionality (if not already defined)
 */
if (typeof toggleTheme === 'undefined') {
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
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
    }
}

/**
 * Load user information for navigation
 */
async function loadUserInfo() {
    try {
        const response = await fetch('/api/auth/profile');
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.user) {
                updateUserInfo(result.user);
            }
        }
    } catch (error) {
        console.error('Failed to load user info:', error);
        // Fallback to default values
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            el.textContent = 'User';
        });
    }
}

/**
 * Initialize theme on page load (if not already defined)
 */
if (typeof initializeTheme === 'undefined') {
    function initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
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
    }
    
    // Initialize theme on load
    document.addEventListener('DOMContentLoaded', initializeTheme);
}

// Export functions for use in other scripts
window.NavigationManager = {
    updateUserInfo,
    updateAdminElements,
    toggleUserDropdown,
    toggleMobileMenu,
    updateActiveNavLink,
    loadUserInfo
};