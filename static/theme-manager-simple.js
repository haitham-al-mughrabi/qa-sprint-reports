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
    
    // Apply theme attribute
    document.documentElement.setAttribute('data-theme', theme);
    
    // Apply theme class to body
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
    
    // Update global state
    currentTheme = theme;
    
    // Save to localStorage
    localStorage.setItem(THEME_CONFIG.STORAGE_KEY, theme);
    
    // Update theme button
    updateThemeButton(theme);
    
    // Log for debugging
    console.log(`Theme applied: ${theme}`);
    
    // Dispatch theme change event
    window.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { theme: theme } 
    }));
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