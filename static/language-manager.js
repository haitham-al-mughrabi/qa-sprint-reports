/**
 * Language Manager for multilingual support
 * Handles language switching between English and Arabic
 * Manages RTL/LTR text direction
 * Loads translations from translations.js
 */

class LanguageManager {
    constructor() {
        this.LANG_KEY = 'sprint-reports-language';
        this.DEFAULT_LANG = 'en'; // Default language is English
        this.currentLang = this.DEFAULT_LANG;
        this.translations = {}; // Will hold all translations
        
        // Initialize language settings
        this.init();
    }

    init() {
        // Load saved language or use default
        this.currentLang = localStorage.getItem(this.LANG_KEY) || this.DEFAULT_LANG;
        
        // Load translations
        this.loadTranslations();
        
        // Apply language to document
        this.applyLanguage(this.currentLang);
        
        // Update language button if it exists
        this.updateLanguageButton(this.currentLang);
    }

    loadTranslations() {
        // Check if TRANSLATIONS is defined (from translations.js)
        if (typeof TRANSLATIONS !== 'undefined') {
            this.translations = TRANSLATIONS;
            console.log('Translations loaded from translations.js');
        } else {
            console.warn('TRANSLATIONS not found. Using default minimal translations.');
            // Fallback minimal translations
            this.translations = {
                'language': {
                    'en': 'العربية',
                    'ar': 'English'
                },
                'theme_light': {
                    'en': 'Light',
                    'ar': 'فاتح'
                },
                'theme_dark': {
                    'en': 'Dark',
                    'ar': 'داكن'
                }
            };
        }
    }

    applyLanguage(lang) {
        // Set the current language
        this.currentLang = lang;
        
        // Store language preference
        localStorage.setItem(this.LANG_KEY, lang);
        
        // Set document direction
        document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', lang);
        
        // Add language-specific class to body
        document.body.classList.remove('lang-en', 'lang-ar');
        document.body.classList.add(`lang-${lang}`);
        
        // Translate all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (this.translations[key] && this.translations[key][lang]) {
                element.textContent = this.translations[key][lang];
            }
        });
        
        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (this.translations[key] && this.translations[key][lang]) {
                element.setAttribute('placeholder', this.translations[key][lang]);
            }
        });
        
        // Update theme button text based on current theme and language
        this.updateThemeButtonText();
        
        // Trigger custom event for components that need to react to language changes
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: lang } 
        }));
    }

    toggleLanguage() {
        const newLang = this.currentLang === 'en' ? 'ar' : 'en';
        this.applyLanguage(newLang);
        this.updateLanguageButton(newLang);
    }

    updateLanguageButton(lang) {
        const langButton = document.getElementById('language-toggle');
        if (langButton) {
            langButton.textContent = this.translations['language'][lang];
        }
    }

    updateThemeButtonText() {
        const themeText = document.getElementById('theme-text');
        if (themeText) {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const textKey = currentTheme === 'light' ? 'theme_dark' : 'theme_light';
            if (this.translations[textKey] && this.translations[textKey][this.currentLang]) {
                themeText.textContent = this.translations[textKey][this.currentLang];
            }
        }
    }

    getCurrentLanguage() {
        return this.currentLang;
    }

    isRTL() {
        return this.currentLang === 'ar';
    }

    translate(key) {
        if (this.translations[key] && this.translations[key][this.currentLang]) {
            return this.translations[key][this.currentLang];
        }
        return key; // Return the key if translation not found
    }
}

// Create global language manager instance
const languageManager = new LanguageManager();

// Global functions for language management
function toggleLanguage() {
    languageManager.toggleLanguage();
}

function translate(key) {
    return languageManager.translate(key);
}

// Make functions globally accessible
window.languageManager = languageManager;
window.toggleLanguage = toggleLanguage;
window.translate = translate;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => languageManager.init());
} else {
    languageManager.init();
}