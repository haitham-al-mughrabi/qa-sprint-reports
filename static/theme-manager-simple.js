/**
 * Simple and Robust Theme Management System
 * Handles light/dark theme switching with localStorage persistence
 */

// Theme configuration
const THEME_CONFIG = {
    STORAGE_KEY: 'sprint-reports-theme',
    DEFAULT_THEME: 'light',
    THEMES: ['light', 'dark']
};

// Global theme state
let currentTheme = THEME_CONFIG.DEFAULT_THEME;

/**
 * Apply theme to the document
 */
function applyTheme(theme) {
    // Validate theme
    if (!THEME_CONFIG.THEMES.includes(theme)) {
        console.warn(`Invalid theme: ${theme}. Using default: ${THEME_CONFIG.DEFAULT_THEME}`);
        theme = THEME_CONFIG.DEFAULT_THEME;
    }
    
    // Apply theme attribute to html and body
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    
    // Apply theme class to body
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
    
    // Force apply theme colors to body
    const computedStyle = getComputedStyle(document.documentElement);
    const bgColor = computedStyle.getPropertyValue('--background').trim();
    const textColor = computedStyle.getPropertyValue('--text-primary').trim();
    
    if (bgColor) {
        document.body.style.backgroundColor = bgColor;
        document.body.style.color = textColor;
    }
    
    // Update global state
    currentTheme = theme;
    
    // Save to localStorage
    localStorage.setItem(THEME_CONFIG.STORAGE_KEY, theme);
    
    // Update theme button
    updateThemeButton(theme);
    
    // Force update all elements with theme classes
    forceUpdateThemeElements(theme);
    
    // Log for debugging
    console.log(`Theme applied: ${theme}`);
    
    // Dispatch theme change event
    window.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { theme: theme } 
    }));
}

/**
 * Force update theme on all elements
 */
function forceUpdateThemeElements(theme) {
    // Update main containers
    const containers = document.querySelectorAll('.page, .container, .main-content, .dashboard-container, .main-wrapper');
    containers.forEach(el => {
        el.setAttribute('data-theme', theme);
    });
    
    // Update cards
    const cards = document.querySelectorAll('.card, .stat-card, .metric-card, .project-metric-card');
    cards.forEach(el => {
        el.setAttribute('data-theme', theme);
    });
    
    // Update navigation
    const navs = document.querySelectorAll('.main-nav, .nav-container');
    navs.forEach(el => {
        el.setAttribute('data-theme', theme);
    });
}

/**
 * Update theme toggle button
 */
function updateThemeButton(theme) {
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    if (themeIcon && themeText) {
        if (theme === 'light') {
            themeIcon.className = 'fas fa-moon';
            themeText.textContent = 'Dark';
        } else {
            themeIcon.className = 'fas fa-sun';
            themeText.textContent = 'Light';
        }
    }
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
}

/**
 * Set specific theme
 */
function setTheme(theme) {
    applyTheme(theme);
}

/**
 * Get current theme
 */
function getCurrentTheme() {
    return currentTheme;
}

/**
 * Initialize theme system
 */
function initializeTheme() {
    // Get saved theme or use default
    const savedTheme = localStorage.getItem(THEME_CONFIG.STORAGE_KEY) || THEME_CONFIG.DEFAULT_THEME;
    
    // Apply the theme
    applyTheme(savedTheme);
    
    console.log('Theme system initialized');
}

/**
 * Apply theme immediately (before DOM is ready)
 */
function applyThemeEarly() {
    const savedTheme = localStorage.getItem(THEME_CONFIG.STORAGE_KEY) || THEME_CONFIG.DEFAULT_THEME;
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.body.classList.add(`theme-${savedTheme}`);
    currentTheme = savedTheme;
}

// Apply theme immediately to prevent flash
applyThemeEarly();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTheme);
} else {
    initializeTheme();
}

// Make functions globally available
window.toggleTheme = toggleTheme;
window.setTheme = setTheme;
window.getCurrentTheme = getCurrentTheme;
window.initializeTheme = initializeTheme;
window.applyTheme = applyTheme;

// Listen for storage changes (theme changes in other tabs)
window.addEventListener('storage', function(event) {
    if (event.key === THEME_CONFIG.STORAGE_KEY && event.newValue) {
        applyTheme(event.newValue);
    }
});

console.log('Simple theme manager loaded');