// ===== UTILITY FUNCTIONS =====

/**
 * Debounce function to limit how often a function is called
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show a toast notification
 */
function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    setTimeout(() => elements.toast.classList.remove('show'), 2000);
}

/**
 * Sort entries by sortOrder or year
 */
function sortEntries(entryList) {
    return entryList.sort((a, b) => {
        const orderA = a.sortOrder !== undefined ? a.sortOrder : (a.year || 0);
        const orderB = b.sortOrder !== undefined ? b.sortOrder : (b.year || 0);
        return orderA - orderB;
    });
}
