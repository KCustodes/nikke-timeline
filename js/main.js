// ===== MAIN INITIALIZATION =====

/**
 * Initialize the application
 */
function init() {
    populateFilters();
    render();
    setupEventListeners();
    checkURLHash();
    setTimeout(scrollToStartPoint, 300);
}

// Start the application
init();
