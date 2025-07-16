/**
 * Centralized Theme Management System
 * Handles light/dark theme switching with localStorage persistence
 */

class ThemeManager {
    constructor() {
        this.THEME_KEY = 'sprint-reports-theme';
        this.DEFAULT_THEME = 'light'; // Changed default to light
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
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: theme } 
        }));
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
            
            Chart.defaults.color = isDark ? '#94a3b8' : '#64748b';
            Chart.defaults.borderColor = isDark ? '#334155' : '#e2e8f0';
            Chart.defaults.backgroundColor = isDark ? '#1e293b' : '#f8fafc';
            
            // Update existing charts
            Object.values(Chart.instances).forEach(chart => {
                if (chart && chart.update) {
                    chart.update('none');
                }
            });
        }
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

// Make functions globally accessible
window.themeManager = themeManager;
window.toggleTheme = toggleTheme;
window.initializeTheme = initializeTheme;
window.updateThemeButton = updateThemeButton;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => themeManager.init());
} else {
    themeManager.init();
}