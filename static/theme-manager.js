/**
 * Centralized Theme Management System
 * Handles light/dark theme switching with localStorage persistence
 */

class ThemeManager {
    constructor() {
        this.THEME_KEY = 'sprint-reports-theme';
        this.DEFAULT_THEME = 'light'; // Default theme
        this.currentTheme = this.DEFAULT_THEME;
        
        // Initialize theme on creation
        this.init();
    }

    init() {
        // Load saved theme or use default
        this.currentTheme = localStorage.getItem(this.THEME_KEY) || this.DEFAULT_THEME;
        
        // Apply theme to document
        this.applyTheme(this.currentTheme);
        
        // Update theme button if it exists
        this.updateThemeButton(this.currentTheme);
        
        // Apply theme to dynamically created elements
        this.observeNewElements();
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        
        // Apply theme to body classes for additional styling
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${theme}`);
        
        // Trigger custom event for components that need to react to theme changes
        // Add a longer delay to ensure CSS variables have fully updated
        setTimeout(() => {
            console.log('Firing themeChanged event for theme:', theme);
            window.dispatchEvent(new CustomEvent('themeChanged', { 
                detail: { theme: theme } 
            }));
        }, 200);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        if (theme !== 'light' && theme !== 'dark') {
            console.warn('Invalid theme:', theme, 'Using default:', this.DEFAULT_THEME);
            theme = this.DEFAULT_THEME;
        }

        this.applyTheme(theme);
        localStorage.setItem(this.THEME_KEY, theme);
        this.updateThemeButton(theme);
        
        // Update charts if they exist
        this.updateChartsTheme(theme);
    }

    updateThemeButton(theme) {
        const themeIcon = document.getElementById('theme-icon');
        const themeText = document.getElementById('theme-text');
        
        if (themeIcon && themeText) {
            if (theme === 'light') {
                themeIcon.className = 'fas fa-moon';
                // Use language manager if available
                if (window.languageManager) {
                    themeText.textContent = window.languageManager.translate('theme_dark');
                } else {
                    themeText.textContent = 'Dark';
                }
            } else {
                themeIcon.className = 'fas fa-sun';
                // Use language manager if available
                if (window.languageManager) {
                    themeText.textContent = window.languageManager.translate('theme_light');
                } else {
                    themeText.textContent = 'Light';
                }
            }
        }
    }

    updateChartsTheme(theme) {
        // Update Chart.js default colors based on theme
        if (typeof Chart !== 'undefined') {
            const isDark = theme === 'dark';
            
            // Set Chart.js global defaults
            Chart.defaults.color = isDark ? '#f1f5f9' : '#1e293b';
            Chart.defaults.borderColor = isDark ? '#334155' : '#e2e8f0';
            Chart.defaults.backgroundColor = isDark ? '#1e293b' : '#ffffff';
            
            // Set plugin defaults
            if (Chart.defaults.plugins) {
                if (Chart.defaults.plugins.legend) {
                    Chart.defaults.plugins.legend.labels = Chart.defaults.plugins.legend.labels || {};
                    Chart.defaults.plugins.legend.labels.color = isDark ? '#f1f5f9' : '#1e293b';
                }
                if (Chart.defaults.plugins.tooltip) {
                    Chart.defaults.plugins.tooltip.titleColor = isDark ? '#f1f5f9' : '#1e293b';
                    Chart.defaults.plugins.tooltip.bodyColor = isDark ? '#f1f5f9' : '#1e293b';
                    Chart.defaults.plugins.tooltip.backgroundColor = isDark ? '#334155' : '#ffffff';
                    Chart.defaults.plugins.tooltip.borderColor = isDark ? '#334155' : '#e2e8f0';
                }
            }
            
            // Set scale defaults
            if (Chart.defaults.scales) {
                ['x', 'y', 'r'].forEach(scaleType => {
                    if (Chart.defaults.scales[scaleType]) {
                        Chart.defaults.scales[scaleType].ticks = Chart.defaults.scales[scaleType].ticks || {};
                        Chart.defaults.scales[scaleType].ticks.color = isDark ? '#f1f5f9' : '#1e293b';
                        Chart.defaults.scales[scaleType].grid = Chart.defaults.scales[scaleType].grid || {};
                        Chart.defaults.scales[scaleType].grid.color = isDark ? '#334155' : '#e2e8f0';
                    }
                });
            }
            
            console.log('Chart.js defaults updated for theme:', theme);
            
            // Force update all existing charts with new theme
            this.forceUpdateAllCharts(isDark);
        }
    }

    forceUpdateAllCharts(isDark) {
        // Update existing charts with aggressive refresh
        Object.values(Chart.instances).forEach(chart => {
            if (chart && chart.update) {
                // Update chart border colors for doughnut charts
                if (chart.data && chart.data.datasets) {
                    chart.data.datasets.forEach(dataset => {
                        if (dataset.borderColor === '#fff' || dataset.borderColor === '#ffffff' || dataset.borderColor === '#1e293b') {
                            dataset.borderColor = isDark ? '#1e293b' : '#ffffff';
                        }
                    });
                }
                
                // Force a complete chart redraw
                chart.update('active');
                
                // Additional force refresh after a short delay
                setTimeout(() => {
                    if (chart && chart.update) {
                        chart.update('resize');
                    }
                }, 100);
            }
        });
    }

    observeNewElements() {
        // Observer for dynamically added elements that need theme styling
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.applyThemeToElement(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    applyThemeToElement(element) {
        // Apply theme-specific classes to dynamically created elements
        if (element.classList) {
            // Add theme-aware classes for modals, toasts, etc.
            if (element.classList.contains('modal')) {
                element.classList.add(`modal-${this.currentTheme}`);
            }
            if (element.classList.contains('toast')) {
                element.classList.add(`toast-${this.currentTheme}`);
            }
            if (element.classList.contains('dropdown-content')) {
                element.classList.add(`dropdown-${this.currentTheme}`);
            }
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    isLightTheme() {
        return this.currentTheme === 'light';
    }

    isDarkTheme() {
        return this.currentTheme === 'dark';
    }
}

// Create global theme manager instance
const themeManager = new ThemeManager();

// Global functions for backward compatibility
function toggleTheme() {
    themeManager.toggleTheme();
}

function initializeTheme() {
    themeManager.init();
}

function updateThemeButton(theme) {
    themeManager.updateThemeButton(theme);
}

// Utility function for robust theme detection
function getCurrentTheme() {
    // Try multiple ways to detect current theme
    if (window.themeManager && typeof window.themeManager.getCurrentTheme === 'function') {
        return window.themeManager.getCurrentTheme();
    } else if (document.documentElement.getAttribute('data-theme')) {
        return document.documentElement.getAttribute('data-theme');
    } else if (document.body.classList.contains('theme-dark')) {
        return 'dark';
    } else if (document.body.classList.contains('theme-light')) {
        return 'light';
    } else {
        return localStorage.getItem('sprint-reports-theme') || 'light';
    }
}

// Utility function to check if current theme is light
function isCurrentThemeLight() {
    return getCurrentTheme() === 'light';
}

// Force refresh all charts with current theme colors
function forceRefreshAllCharts() {
    console.log('Force refreshing all charts with current theme...');
    
    // Update Chart.js defaults first
    if (window.themeManager) {
        window.themeManager.updateChartsTheme(getCurrentTheme());
    }
    
    // Trigger theme change event to recreate all charts
    window.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { theme: getCurrentTheme() } 
    }));
}

// Force recreate all charts (more aggressive)
function forceRecreateAllCharts() {
    console.log('Force recreating all charts...');
    
    // Destroy all Chart.js instances
    if (typeof Chart !== 'undefined' && Chart.instances) {
        Object.values(Chart.instances).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
    }
    
    // Wait a bit then trigger theme change to recreate
    setTimeout(() => {
        forceRefreshAllCharts();
    }, 200);
}

// Make functions globally accessible
window.themeManager = themeManager;
window.toggleTheme = toggleTheme;
window.initializeTheme = initializeTheme;
window.updateThemeButton = updateThemeButton;
window.getCurrentTheme = getCurrentTheme;
window.isCurrentThemeLight = isCurrentThemeLight;
window.forceRefreshAllCharts = forceRefreshAllCharts;
window.forceRecreateAllCharts = forceRecreateAllCharts;

// Apply theme as early as possible to prevent FOUC
function applyEarlyTheme() {
    const savedTheme = localStorage.getItem('sprint-reports-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.body.classList.add(`theme-${savedTheme}`);
    
    // Set Chart.js defaults early if available
    if (typeof Chart !== 'undefined') {
        const isDark = savedTheme === 'dark';
        Chart.defaults.color = isDark ? '#f1f5f9' : '#1e293b';
        Chart.defaults.borderColor = isDark ? '#334155' : '#e2e8f0';
        Chart.defaults.backgroundColor = isDark ? '#1e293b' : '#ffffff';
    }
    
    console.log('Early theme applied:', savedTheme);
}

// Apply theme immediately
applyEarlyTheme();

// Full initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        themeManager.init();
        console.log('Theme manager initialized after DOM load');
    });
} else {
    themeManager.init();
    console.log('Theme manager initialized (DOM already loaded)');
}

// Listen for theme changes from other tabs
window.addEventListener('storage', (event) => {
    if (event.key === 'sprint-reports-theme') {
        themeManager.setTheme(event.newValue || 'light');
    }
});