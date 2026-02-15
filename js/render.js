// ===== RENDERING FUNCTIONS =====

/**
 * Main render function for the timeline
 */
function render() {
    elements.timeline.innerHTML = '';
    entryPositions = {};

    // Create SVG for connections
    createConnectionsSvg();

    // Group entries by era
    const eras = groupEntriesByEra();

    let isBottom = false;
    let eraIndex = 0;

    // Render era jump buttons
    elements.eraJump.innerHTML = '<span>Jump to Era:</span>';

    Object.keys(eras).forEach(era => {
        renderEraJumpButton(era);
        renderEraGroup(era, eras[era], eraIndex, isBottom);
        eraIndex++;
        isBottom = !isBottom && eras[era].length % 2 === 0 ? isBottom : !isBottom;
    });

    setTimeout(drawConnections, 100);
    renderMinimap();
    updateFilteredIndices();
}

/**
 * Create SVG element for connection lines
 */
function createConnectionsSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'connectionsSvg';
    svg.style.cssText = 'position:absolute;top:-200px;left:-100px;width:calc(100% + 200px);height:500px;pointer-events:none;z-index:1;overflow:visible;';
    timeline.appendChild(svg);
}

/**
 * Group entries by their era
 */
function groupEntriesByEra() {
    const eras = {};
    entries.forEach(e => {
        if (!eras[e.era]) eras[e.era] = [];
        eras[e.era].push(e);
    });
    return eras;
}

/**
 * Render era jump button
 */
function renderEraJumpButton(era) {
    elements.eraJump.innerHTML += `<button data-era="${era}">${era}</button>`;
}

/**
 * Render a single era group
 */
function renderEraGroup(era, eraEntries, eraIndex, isBottom) {
    const group = document.createElement('div');
    group.className = 'era-group';
    group.dataset.era = era;
    group.dataset.eraIndex = eraIndex;
    group.id = `era-${era.replace(/\s+/g, '-').toLowerCase()}`;

    // Era label
    const label = document.createElement('span');
    label.className = 'era-label';
    label.textContent = era;
    group.appendChild(label);

    // Sort and render entries
    const sortedEntries = sortEntries([...eraEntries]);
    let currentIsBottom = isBottom;

    sortedEntries.forEach(entry => {
        const entryEl = createEntryElement(entry, currentIsBottom);
        group.appendChild(entryEl);

        if (entry.id) {
            entryPositions[entry.id] = {
                element: entryEl,
                isBottom: currentIsBottom,
                entry: entry
            };
        }
        currentIsBottom = !currentIsBottom;
    });

    elements.timeline.appendChild(group);
}

/**
 * Create a single entry element
 */
function createEntryElement(entry, isBottom) {
    const div = document.createElement('div');
    div.className = 'entry';
    if (entry.important) div.classList.add('important');
    if (entry.isStartPoint) div.classList.add('start-point');
    div.dataset.type = entry.type;
    div.dataset.id = entry.id || '';

    const thumbnail = entry.image ? `<img class="entry-thumbnail" src="${entry.image}" alt="">` : '';

    div.innerHTML = `
        <span class="entry-title ${isBottom ? 'bottom' : ''}">${entry.title}</span>
        ${thumbnail}
        <div class="entry-dot"></div>
    `;

    div.onclick = () => openModal(entry);
    return div;
}

/**
 * Update filtered indices for navigation
 */
function updateFilteredIndices() {
    filteredIndices = [];
    entries.forEach((entry, index) => {
        if (entry.id) {
            filteredIndices.push({
                id: entry.id,
                index: index,
                entry: entry
            });
        }
    });
}

/**
 * Render the minimap
 */
function renderMinimap() {
    const minimapContent = document.createElement('div');
    minimapContent.className = 'minimap-content';

    const colors = {
        main_story: '#ff6b6b',
        event_story: '#4ecdc4',
        side_mission: '#ffe66d',
        side_story: '#a29bfe'
    };

    entries.forEach(entry => {
        const dot = document.createElement('div');
        dot.className = 'minimap-dot';
        dot.style.background = colors[entry.type] || '#888';
        minimapContent.appendChild(dot);
    });

    elements.minimap.innerHTML = '';
    elements.minimap.appendChild(minimapContent);

    const viewportIndicator = document.createElement('div');
    viewportIndicator.className = 'minimap-viewport';
    viewportIndicator.id = 'minimapViewport';
    elements.minimap.appendChild(viewportIndicator);

    updateMinimapViewport();
}

/**
 * Update minimap viewport indicator
 */
function updateMinimapViewport() {
    const viewportIndicator = document.getElementById('minimapViewport');
    if (!viewportIndicator || entries.length === 0) return;

    const scrollPercent = elements.viewport.scrollLeft / (elements.viewport.scrollWidth - elements.viewport.clientWidth);
    const viewportPercent = elements.viewport.clientWidth / elements.viewport.scrollWidth;

    viewportIndicator.style.left = `${scrollPercent * 100}%`;
    viewportIndicator.style.width = `${Math.max(viewportPercent * 100, 5)}%`;
}

/**
 * Highlight an entry on the timeline
 */
function highlightEntry(entryId) {
    document.querySelectorAll('.entry.highlighted').forEach(e => {
        e.classList.remove('highlighted');
    });

    const entryEl = document.querySelector(`.entry[data-id="${entryId}"]`);
    if (entryEl) {
        entryEl.classList.add('highlighted');
        entryEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'center' });
        setTimeout(() => entryEl.classList.remove('highlighted'), 2000);
    }
}
