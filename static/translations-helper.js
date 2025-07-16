/**
 * Helper functions for translating dynamically loaded content
 */

// Apply translations to dynamically added elements
function translateDynamicContent(element) {
    if (!element) return;
    
    // Translate elements with data-i18n attribute
    const elementsWithI18n = element.querySelectorAll('[data-i18n]');
    elementsWithI18n.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (window.languageManager && window.languageManager.translations[key]) {
            const lang = window.languageManager.getCurrentLanguage();
            if (window.languageManager.translations[key][lang]) {
                el.textContent = window.languageManager.translations[key][lang];
            }
        }
    });
    
    // Translate placeholders
    const elementsWithPlaceholder = element.querySelectorAll('[data-i18n-placeholder]');
    elementsWithPlaceholder.forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (window.languageManager && window.languageManager.translations[key]) {
            const lang = window.languageManager.getCurrentLanguage();
            if (window.languageManager.translations[key][lang]) {
                el.setAttribute('placeholder', window.languageManager.translations[key][lang]);
            }
        }
    });
}

// Add translation attributes to dynamic content
function addTranslationAttributes(element, textMap) {
    if (!element || !textMap) return;
    
    for (const [selector, key] of Object.entries(textMap)) {
        const elements = element.querySelectorAll(selector);
        elements.forEach(el => {
            el.setAttribute('data-i18n', key);
            // Store original text as a data attribute for reference
            if (!el.hasAttribute('data-original-text')) {
                el.setAttribute('data-original-text', el.textContent);
            }
        });
    }
    
    // Apply translations immediately
    translateDynamicContent(element);
}

// Translate a specific text using the language manager
function translateText(key, defaultText) {
    if (window.languageManager) {
        return window.languageManager.translate(key) || defaultText;
    }
    return defaultText;
}

// Observer to automatically translate dynamically added content
function setupTranslationObserver() {
    if (!window.MutationObserver) return;
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    translateDynamicContent(node);
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    return observer;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setupTranslationObserver();
    
    // Listen for language changes
    window.addEventListener('languageChanged', () => {
        // Translate all dynamic content when language changes
        translateDynamicContent(document.body);
    });
});

// Make functions globally accessible
window.translateDynamicContent = translateDynamicContent;
window.addTranslationAttributes = addTranslationAttributes;
window.translateText = translateText;