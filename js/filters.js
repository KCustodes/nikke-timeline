// ===== FILTER FUNCTIONS =====

/**
 * Populate all filter dropdowns with available options
 */
function populateFilters() {
    const eras = new Set();
    const characters = new Set();
    const locations = new Set();

    allEntries.forEach(entry => {
        if (entry.era) eras.add(entry.era);
        if (entry.characters) entry.characters.forEach(c => characters.add(c));
        if (entry.locations) entry.locations.forEach(l => locations.add(l));
    });

    // Populate era filter
    elements.filterEra.innerHTML = '<option value="">All Eras</option>';
    eras.forEach(era => {
        elements.filterEra.innerHTML += `<option value="${era}">${era}</option>`;
    });

    // Populate character filter
    elements.filterCharacter.innerHTML = '<option value="">All Characters</option>';
    Array.from(characters).sort().forEach(char => {
        elements.filterCharacter.innerHTML += `<option value="${char}">${char}</option>`;
    });

    // Populate location filter
    elements.filterLocation.innerHTML = '<option value="">All Locations</option>';
    Array.from(locations).sort().forEach(loc => {
        elements.filterLocation.innerHTML += `<option value="${loc}">${loc}</option>`;
    });
}

/**
 * Apply all active filters to the entries list
 */
function applyFilters() {
    const type = elements.filterType.value;
    const era = elements.filterEra.value;
    const character = elements.filterCharacter.value;
    const location = elements.filterLocation.value;
    const search = elements.searchInput.value.toLowerCase();

    entries = allEntries.filter(entry => {
        if (type && entry.type !== type) return false;
        if (era && entry.era !== era) return false;
        if (character && (!entry.characters || !entry.characters.includes(character))) return false;
        if (location && (!entry.locations || !entry.locations.includes(location))) return false;

        if (search) {
            const searchMatch =
                entry.title.toLowerCase().includes(search) ||
                (entry.summary && entry.summary.toLowerCase().includes(search)) ||
                (entry.content && entry.content.toLowerCase().includes(search)) ||
                (entry.characters && entry.characters.some(c => c.toLowerCase().includes(search))) ||
                (entry.locations && entry.locations.some(l => l.toLowerCase().includes(search))) ||
                (entry.tags && entry.tags.some(t => t.toLowerCase().includes(search)));
            if (!searchMatch) return false;
        }
        return true;
    });

    applySort();
    render();
    showToast(`Showing ${entries.length} entries`);
}

/**
 * Apply current sort order to entries
 */
function applySort() {
    switch (currentSort) {
        case 'title':
            entries.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'type':
            entries.sort((a, b) => a.type.localeCompare(b.type));
            break;
        case 'year':
            sortEntries(entries);
            break;
        default:
            break;
    }
}

/**
 * Cycle through sort options
 */
function cycleSort() {
    const sorts = ['default', 'title', 'type', 'year'];
    const currentIndex = sorts.indexOf(currentSort);
    currentSort = sorts[(currentIndex + 1) % sorts.length];

    const sortNames = {
        default: 'Default Order',
        title: 'Title A-Z',
        type: 'By Type',
        year: 'By Year'
    };

    applyFilters();
    showToast(`Sorted: ${sortNames[currentSort]}`);
}

/**
 * Quick filter by tag
 */
function filterByTag(tag) {
    elements.searchInput.value = tag;
    applyFilters();
    closeModal();
}

/**
 * Quick filter by character
 */
function filterByCharacter(character) {
    elements.filterCharacter.value = character;
    applyFilters();
    closeModal();
}

/**
 * Quick filter by location
 */
function filterByLocation(location) {
    elements.filterLocation.value = location;
    applyFilters();
    closeModal();
}
