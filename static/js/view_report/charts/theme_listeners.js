// Listen for theme changes - both mutation observer and custom event
document.addEventListener('DOMContentLoaded', function() {
    // Watch for theme attribute changes (fallback)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                updateChartsForTheme();
            }
        });
    });
    
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
});

// Listen for custom theme change event (primary method)
window.addEventListener('themeChanged', function(event) {
    updateChartsForTheme();
});