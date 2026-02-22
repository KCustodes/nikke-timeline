// ===== STATE =====
let mainEntries = [];
let lostRelics = [];
let sideMissions = [];
let secondaryEntries = [];
let allEntries = [];
let allEras = [];
let currentEntryIndex = 0;
let filteredIndices = [];
let bookmarks = JSON.parse(localStorage.getItem('timelineBookmarks') || '[]');
let currentSort = 'default';
let isDown = false;
let startX = 0;
let scrollLeft = 0;

// ===== DOM ELEMENTS =====
const timelinesContainer = document.getElementById('timelinesContainer');
const eraBackgrounds = document.getElementById('eraBackgrounds');
const mainTimeline = document.getElementById('mainTimeline');
const lostRelicsTimeline = document.getElementById('lostRelicsTimeline');
const sideMissionsTimeline = document.getElementById('sideMissionsTimeline');
const secondaryTimeline = document.getElementById('secondaryTimeline');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const searchInput = document.getElementById('searchInput');
const filterType = document.getElementById('filterType');
const filterEra = document.getElementById('filterEra');
const filterCharacter = document.getElementById('filterCharacter');
const filterLocation = document.getElementById('filterLocation');
const eraJump = document.getElementById('eraJump');
const toast = document.getElementById('toast');

// ===== TYPE COLORS =====
const typeColors = {
    main_story: '#ff6b6b',
    event_story: '#4ecdc4',
    side_mission: '#ffe66d',
    side_story: '#a29bfe',
    lost_relic: '#ff9f43'
};

// ===== ERA ORDER (define your era order here) =====
const eraOrder = [
    "Age of Dawn",
    "Era of Conflict",
    "Golden Age",
    "Age of Shadows"
    // Add your eras in order
];

// ===== INITIALIZE =====
function init() {
    separateEntries();
    extractEras();
    populateFilters();
    renderAllTimelines();
    renderEraBackgrounds();
    setupEventListeners();
    setupEraHoverDetection();
    checkURLHash();
}

function separateEntries() {
    mainEntries = [];
    lostRelics = [];
    sideMissions = [];
    secondaryEntries = [];
    allEntries = [...ENTRIES];

    ENTRIES.forEach(entry => {
        if (entry.type === 'lost_relic') {
            lostRelics.push(entry);
        } else if (entry.type === 'side_mission') {
            sideMissions.push(entry);
        } else if (entry.timelinePosition === 'secondary') {
            secondaryEntries.push(entry);
        } else {
            mainEntries.push(entry);
        }
    });
}

function extractEras() {
    allEras = [];
    const eraMap = new Map();

    allEntries.forEach(entry => {
        if (entry.era && !eraMap.has(entry.era)) {
            eraMap.set(entry.era, {
                name: entry.era,
                image: entry.eraImage || entry.image || null,
                startOrder: entry.sortOrder !== undefined ? entry.sortOrder : (entry.year || 0)
            });
        }
    });

    // Sort by defined order or by startOrder
    eraOrder.forEach(eraName => {
        if (eraMap.has(eraName)) {
            allEras.push(eraMap.get(eraName));
        }
    });

    // Add any eras not in the defined order
    eraMap.forEach((era, name) => {
        if (!allEras.find(e => e.name === name)) {
            allEras.push(era);
        }
    });
}

// ===== POPULATE FILTERS =====
function populateFilters() {
    const eras = new Set();
    const characters = new Set();
    const locations = new Set();

    allEntries.forEach(entry => {
        if (entry.era) eras.add(entry.era);
        if (entry.characters) entry.characters.forEach(c => characters.add(c));
        if (entry.locations) entry.locations.forEach(l => locations.add(l));
    });

    filterEra.innerHTML = '<option value="">All Eras</option>';
    eras.forEach(era => {
        filterEra.innerHTML += `<option value="${era}">${era}</option>`;
    });

    filterCharacter.innerHTML = '<option value="">All Characters</option>';
    Array.from(characters).sort().forEach(char => {
        filterCharacter.innerHTML += `<option value="${char}">${char}</option>`;
    });

    filterLocation.innerHTML = '<option value="">All Locations</option>';
    Array.from(locations).sort().forEach(loc => {
        filterLocation.innerHTML += `<option value="${loc}">${loc}</option>`;
    });

    eraJump.innerHTML = '<span>Jump to Era:</span>';
    allEras.forEach(era => {
        eraJump.innerHTML += `<button data-era="${era.name}">${era.name}</button>`;
    });
}

// ===== RENDER ERA BACKGROUNDS =====
function renderEraBackgrounds() {
    eraBackgrounds.innerHTML = '';

    if (allEras.length === 0) return;

    // Calculate positions based on sort order
    const allSortedEntries = [...allEntries].sort((a, b) => {
        const orderA = a.sortOrder !== undefined ? a.sortOrder : (a.year || 0);
        const orderB = b.sortOrder !== undefined ? b.sortOrder : (b.year || 0);
        return orderA - orderB;
    });

    // Calculate total width and era positions
    const itemWidth = 170; // Approximate width per item including margin
    const padding = 100;
    const labelWidth = 120;
    
    let currentX = padding + labelWidth;
    let eraPositions = [];

    // Group entries by era and calculate positions
    const eraGroups = {};
    allSortedEntries.forEach(entry => {
        if (!entry.era) return;
        if (!eraGroups[entry.era]) {
            eraGroups[entry.era] = [];
        }
        eraGroups[entry.era].push(entry);
    });

    // Calculate era boundaries
    let eraStartX = currentX;
    let currentEra = null;

    allSortedEntries.forEach((entry, index) => {
        if (entry.era !== currentEra) {
            if (currentEra !== null) {
                eraPositions.push({
                    name: currentEra,
                    startX: eraStartX,
                    endX: currentX - 30
                });
            }
            currentEra = entry.era;
            eraStartX = currentX - 50;
        }
        currentX += itemWidth;
    });

    // Push last era
    if (currentEra !== null) {
        eraPositions.push({
            name: currentEra,
            startX: eraStartX,
            endX: currentX + padding
        });
    }

    // Render era backgrounds
    eraPositions.forEach((era, index) => {
        const eraData = allEras.find(e => e.name === era.name);
        const width = era.endX - era.startX;

        const bgDiv = document.createElement('div');
        bgDiv.className = 'era-bg';
        bgDiv.dataset.era = era.name;
        bgDiv.style.left = `${era.startX}px`;
        bgDiv.style.width = `${width}px`;

        if (eraData && eraData.image) {
            bgDiv.style.backgroundImage = `url('${eraData.image}')`;
        }

        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'era-bg-overlay';
        bgDiv.appendChild(overlay);

        // Era label
        const label = document.createElement('div');
        label.className = 'era-label';
        label.textContent = era.name;
        label.style.left = `${era.startX + width / 2}px`;
        label.onclick = () => jumpToEra(era.name);
        bgDiv.appendChild(label);

        // Era divider (except last)
        if (index < eraPositions.length - 1) {
            const divider = document.createElement('div');
            divider.className = 'era-divider';
            divider.style.left = `${era.endX}px`;
            bgDiv.appendChild(divider);
        }

        eraBackgrounds.appendChild(bgDiv);
    });
}

// ===== ERA HOVER DETECTION =====
function setupEraHoverDetection() {
    const eraBgElements = eraBackgrounds.querySelectorAll('.era-bg');
    
    timelinesContainer.addEventListener('scroll', () => {
        updateActiveEra();
    });

    updateActiveEra();
}

function updateActiveEra() {
    const scrollLeft = timelinesContainer.scrollLeft;
    const containerWidth = timelinesContainer.offsetWidth;
    const centerX = scrollLeft + containerWidth / 2 - 120; // Account for label width

    const eraBgElements = eraBackgrounds.querySelectorAll('.era-bg');
    let activeEra = null;

    eraBgElements.forEach(bg => {
        const left = parseFloat(bg.style.left);
        const width = parseFloat(bg.style.width);
        const right = left + width;

        if (centerX >= left && centerX <= right) {
            activeEra = bg.dataset.era;
        }

        bg.classList.remove('active');
    });

    if (activeEra) {
        eraBackgrounds.querySelector(`.era-bg[data-era="${activeEra}"]`)?.classList.add('active');
    }
}

// ===== RENDER ALL TIMELINES =====
function renderAllTimelines() {
    renderMainTimeline();
    renderLostRelicsTimeline();
    renderSideMissionsTimeline();
    renderSecondaryTimeline();
    updateFilteredIndices();
}

// ===== RENDER MAIN TIMELINE =====
function renderMainTimeline() {
    mainTimeline.innerHTML = '';

    const grouped = groupBySortOrder(mainEntries);

    Object.keys(grouped).sort((a, b) => a - b).forEach(sortOrder => {
        const entries = grouped[sortOrder];
        
        if (entries.length === 1) {
            const entry = entries[0];
            const item = createMainEntry(entry);
            mainTimeline.appendChild(item);
        } else {
            const group = document.createElement('div');
            group.className = 'timeline-item-group';
            
            entries.forEach(entry => {
                const item = createMainEntry(entry);
                group.appendChild(item);
            });
            
            mainTimeline.appendChild(group);
        }
    });
}

function createMainEntry(entry) {
    const div = document.createElement('div');
    div.className = 'timeline-item main-entry';
    if (entry.important) div.classList.add('important');
    if (entry.isStartPoint) div.classList.add('start-point');
    div.dataset.type = entry.type;
    div.dataset.id = entry.id || '';
    div.dataset.sortOrder = entry.sortOrder || 0;
    div.dataset.era = entry.era || '';

    const imgSrc = entry.image || 'https://via.placeholder.com/140x90/2a2a3e/666?text=No+Image';
    const entryColor = entry.color || typeColors[entry.type] || '#888';

    div.innerHTML = `
        <div class="entry-box">
            <img class="entry-image" src="${imgSrc}" alt="${entry.title}" onerror="this.src='https://via.placeholder.com/140x90/2a2a3e/666?text=No+Image'">
            <div class="entry-type-bar" style="background:${entryColor}"></div>
        </div>
        <span class="entry-title">${entry.title}</span>
    `;

    div.onclick = () => openModal(entry);
    return div;
}

// ===== RENDER LOST RELICS TIMELINE =====
function renderLostRelicsTimeline() {
    lostRelicsTimeline.innerHTML = '';

    const grouped = groupBySortOrder(lostRelics);

    Object.keys(grouped).sort((a, b) => a - b).forEach(sortOrder => {
        const relics = grouped[sortOrder];

        if (relics.length === 1) {
            const item = createLostRelicItem(relics[0]);
            lostRelicsTimeline.appendChild(item);
        } else {
            const group = document.createElement('div');
            group.className = 'timeline-item-group';

            relics.forEach(relic => {
                const item = createLostRelicItem(relic);
                group.appendChild(item);
            });

            lostRelicsTimeline.appendChild(group);
        }
    });
}

function createLostRelicItem(entry) {
    const div = document.createElement('div');
    div.className = 'timeline-item lost-relic-item';
    div.dataset.id = entry.id || '';
    div.dataset.sortOrder = entry.sortOrder || 0;
    div.dataset.era = entry.era || '';

    const shortDesc = entry.summary || entry.content || '';
    const truncatedDesc = shortDesc.length > 60 ? shortDesc.substring(0, 60) + '...' : shortDesc;

    div.innerHTML = `
        <div class="relic-title">${entry.title}</div>
        <div class="relic-desc">${truncatedDesc}</div>
    `;

    div.onclick = () => openModal(entry);
    return div;
}

// ===== RENDER SIDE MISSIONS TIMELINE =====
function renderSideMissionsTimeline() {
    sideMissionsTimeline.innerHTML = '';

    const grouped = groupBySortOrder(sideMissions);

    Object.keys(grouped).sort((a, b) => a - b).forEach(sortOrder => {
        const missions = grouped[sortOrder];

        if (missions.length === 1) {
            const item = createSideMissionItem(missions[0]);
            sideMissionsTimeline.appendChild(item);
        } else {
            const group = document.createElement('div');
            group.className = 'timeline-item-group';

            missions.forEach(mission => {
                const item = createSideMissionItem(mission);
                group.appendChild(item);
            });

            sideMissionsTimeline.appendChild(group);
        }
    });
}

function createSideMissionItem(entry) {
    const div = document.createElement('div');
    div.className = 'timeline-item side-mission-item';
    div.dataset.id = entry.id || '';
    div.dataset.sortOrder = entry.sortOrder || 0;
    div.dataset.era = entry.era || '';

    const youtubeLink = entry.youtube ? entry.youtube : '#';
    const linkText = entry.youtube ? 'Watch Video' : 'No Video';

    div.innerHTML = `
        <div class="mission-title">${entry.title}</div>
        <a class="mission-link" href="${youtubeLink}" target="_blank" rel="noopener noreferrer">${linkText}</a>
    `;

    div.onclick = (e) => {
        if (!e.target.classList.contains('mission-link')) {
            openModal(entry);
        }
    };

    return div;
}

// ===== RENDER SECONDARY TIMELINE =====
function renderSecondaryTimeline() {
    secondaryTimeline.innerHTML = '';

    const grouped = groupBySortOrder(secondaryEntries);

    Object.keys(grouped).sort((a, b) => a - b).forEach(sortOrder => {
        const entries = grouped[sortOrder];

        if (entries.length === 1) {
            const item = createSecondaryEntry(entries[0]);
            secondaryTimeline.appendChild(item);
        } else {
            const group = document.createElement('div');
            group.className = 'timeline-item-group';

            entries.forEach(entry => {
                const item = createSecondaryEntry(entry);
                group.appendChild(item);
            });

            secondaryTimeline.appendChild(group);
        }
    });
}

function createSecondaryEntry(entry) {
    const div = document.createElement('div');
    div.className = 'timeline-item secondary-entry';
    div.dataset.type = entry.type;
    div.dataset.id = entry.id || '';
    div.dataset.sortOrder = entry.sortOrder || 0;
    div.dataset.era = entry.era || '';

    const imgSrc = entry.image || 'https://via.placeholder.com/120x75/2a2a3e/666?text=No+Image';
    const entryColor = entry.color || typeColors[entry.type] || '#888';

    div.innerHTML = `
        <div class="entry-box">
            <img class="entry-image" src="${imgSrc}" alt="${entry.title}" onerror="this.src='https://via.placeholder.com/120x75/2a2a3e/666?text=No+Image'">
            <div class="entry-type-bar" style="background:${entryColor}"></div>
        </div>
        <span class="entry-title">${entry.title}</span>
    `;

    div.onclick = () => openModal(entry);
    return div;
}

// ===== HELPER: GROUP BY SORT ORDER =====
function groupBySortOrder(entries) {
    const grouped = {};
    entries.forEach(entry => {
        const order = entry.sortOrder !== undefined ? entry.sortOrder : (entry.year || 0);
        if (!grouped[order]) grouped[order] = [];
        grouped[order].push(entry);
    });
    return grouped;
}

// ===== UPDATE FILTERED INDICES =====
function updateFilteredIndices() {
    filteredIndices = [];
    allEntries.forEach((entry, index) => {
        if (entry.id) {
            filteredIndices.push({
                id: entry.id,
                index: index,
                entry: entry
            });
        }
    });
}

// ===== OPEN MODAL =====
function openModal(entry) {
    currentEntryIndex = filteredIndices.findIndex(f => f.id === entry.id);
    if (currentEntryIndex === -1) currentEntryIndex = 0;

    renderModalContent(entry);
    modal.classList.add('active');

    if (entry.id) {
        history.pushState(null, '', `#entry-${entry.id}`);
    }
}

// ===== CLOSE MODAL =====
function closeModal() {
    modal.classList.remove('active');
    history.pushState(null, '', window.location.pathname);
}

// ===== RENDER MODAL CONTENT =====
function renderModalContent(entry) {
    const typeLabel = entry.type.replace('_', ' ').toUpperCase();
    const chapter = entry.chapter ? ` - Chapter ${entry.chapter}` : '';

    document.getElementById('entryCounter').textContent = `${currentEntryIndex + 1} of ${filteredIndices.length}`;

    document.getElementById('prevEntry').disabled = currentEntryIndex === 0;
    document.getElementById('nextEntry').disabled = currentEntryIndex >= filteredIndices.length - 1;

    const bookmarkBtn = document.getElementById('bookmarkBtn');
    const isBookmarked = bookmarks.includes(entry.id);
    bookmarkBtn.textContent = isBookmarked ? '★ Bookmarked' : '☆ Add to Bookmarks';
    bookmarkBtn.classList.toggle('bookmarked', isBookmarked);

    const entryColor = entry.color || typeColors[entry.type] || '#888';

    let html = `
        <div class="modal-type ${entry.type}" style="background: ${entryColor}22; color: ${entryColor};">${typeLabel}${chapter}</div>
        <h2>${entry.title}</h2>
        <div class="modal-meta">
    `;

    html += `<span>📅 ${entry.era || 'Unknown Era'}`;
    if (entry.timeline) {
        html += ` | ${entry.timeline}`;
    } else if (entry.year !== undefined) {
        html += ` | Year ${entry.year}`;
    }
    html += `</span>`;

    if (entry.characters && entry.characters.length) {
        html += `<span>👥 `;
        entry.characters.forEach((char, i) => {
            html += `<a class="character-link" data-character="${char}">${char}</a>`;
            if (i < entry.characters.length - 1) html += ', ';
        });
        html += `</span>`;
    }

    if (entry.locations && entry.locations.length) {
        html += `<span>📍 `;
        entry.locations.forEach((loc, i) => {
            html += `<a class="location-link" data-location="${loc}">${loc}</a>`;
            if (i < entry.locations.length - 1) html += ', ';
        });
        html += `</span>`;
    }

    html += `</div>`;

    if (entry.image) {
        html += `<img class="modal-image" src="${entry.image}" alt="${entry.title}">`;
    }

    if (entry.tags && entry.tags.length) {
        html += `<div class="modal-tags">`;
        entry.tags.forEach(tag => {
            html += `<span class="tag" data-tag="${tag}">${tag}</span>`;
        });
        html += `</div>`;
    }

    html += `<div class="modal-body">${entry.content || entry.summary || ''}</div>`;

    if (entry.youtube) {
        html += `<iframe class="modal-video" src="${entry.youtube}" frameborder="0" allowfullscreen></iframe>`;
    }

    const relatedEntries = findRelatedEntries(entry);
    if (relatedEntries.length > 0) {
        html += `<div class="related-entries"><h4>Related Entries</h4><div class="related-list">`;
        relatedEntries.slice(0, 5).forEach(rel => {
            html += `<div class="related-item" data-id="${rel.id}">${rel.title}</div>`;
        });
        html += `</div></div>`;
    }

    modalBody.innerHTML = html;

    modalBody.querySelectorAll('.tag').forEach(tag => {
        tag.onclick = () => filterByTag(tag.dataset.tag);
    });

    modalBody.querySelectorAll('.character-link').forEach(link => {
        link.onclick = () => filterByCharacter(link.dataset.character);
    });

    modalBody.querySelectorAll('.location-link').forEach(link => {
        link.onclick = () => filterByLocation(link.dataset.location);
    });

    modalBody.querySelectorAll('.related-item').forEach(item => {
        item.onclick = () => {
            const relatedEntry = allEntries.find(e => e.id === item.dataset.id);
            if (relatedEntry) openModal(relatedEntry);
        };
    });
}

// ===== FIND RELATED ENTRIES =====
function findRelatedEntries(entry) {
    const related = [];

    allEntries.forEach(e => {
        if (e.id === entry.id) return;

        let score = 0;

        if (e.era === entry.era) score += 1;

        if (entry.characters && e.characters) {
            const sharedChars = entry.characters.filter(c => e.characters.includes(c));
            score += sharedChars.length * 2;
        }

        if (entry.locations && e.locations) {
            const sharedLocs = entry.locations.filter(l => e.locations.includes(l));
            score += sharedLocs.length;
        }

        if (entry.tags && e.tags) {
            const sharedTags = entry.tags.filter(t => e.tags.includes(t));
            score += sharedTags.length;
        }

        if (score > 0) {
            related.push({ ...e, score });
        }
    });

    return related.sort((a, b) => b.score - a.score);
}

// ===== FILTER FUNCTIONS =====
function applyFilters() {
    const type = filterType.value;
    const era = filterEra.value;
    const character = filterCharacter.value;
    const location = filterLocation.value;
    const search = searchInput.value.toLowerCase();

    mainEntries = ENTRIES.filter(e => {
        if (e.type === 'lost_relic' || e.type === 'side_mission' || e.timelinePosition === 'secondary') return false;
        return matchesFilter(e, type, era, character, location, search);
    });

    lostRelics = ENTRIES.filter(e => {
        if (e.type !== 'lost_relic') return false;
        return matchesFilter(e, '', era, character, location, search);
    });

    sideMissions = ENTRIES.filter(e => {
        if (e.type !== 'side_mission') return false;
        return matchesFilter(e, '', era, character, location, search);
    });

    secondaryEntries = ENTRIES.filter(e => {
        if (e.timelinePosition !== 'secondary') return false;
        return matchesFilter(e, type, era, character, location, search);
    });

    applySort();
    renderAllTimelines();
    renderEraBackgrounds();
    showToast(`Showing ${mainEntries.length + lostRelics.length + sideMissions.length + secondaryEntries.length} entries`);
}

function matchesFilter(entry, type, era, character, location, search) {
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
}

function filterByTag(tag) {
    searchInput.value = tag;
    applyFilters();
    closeModal();
}

function filterByCharacter(character) {
    filterCharacter.value = character;
    applyFilters();
    closeModal();
}

function filterByLocation(location) {
    filterLocation.value = location;
    applyFilters();
    closeModal();
}

// ===== SORTING =====
function applySort() {
    const sortFn = (a, b) => {
        const orderA = a.sortOrder !== undefined ? a.sortOrder : (a.year || 0);
        const orderB = b.sortOrder !== undefined ? b.sortOrder : (b.year || 0);
        return orderA - orderB;
    };

    switch (currentSort) {
        case 'title':
            const titleSort = (a, b) => a.title.localeCompare(b.title);
            mainEntries.sort(titleSort);
            lostRelics.sort(titleSort);
            sideMissions.sort(titleSort);
            secondaryEntries.sort(titleSort);
            break;
        case 'type':
            const typeSort = (a, b) => a.type.localeCompare(b.type);
            mainEntries.sort(typeSort);
            lostRelics.sort(typeSort);
            sideMissions.sort(typeSort);
            secondaryEntries.sort(typeSort);
            break;
        case 'year':
        default:
            mainEntries.sort(sortFn);
            lostRelics.sort(sortFn);
            sideMissions.sort(sortFn);
            secondaryEntries.sort(sortFn);
            break;
    }
}

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

// ===== MODAL NAVIGATION =====
function prevEntry() {
    if (currentEntryIndex > 0) {
        currentEntryIndex--;
        const entry = filteredIndices[currentEntryIndex].entry;
        renderModalContent(entry);
        highlightEntry(entry.id);
    }
}

function nextEntry() {
    if (currentEntryIndex < filteredIndices.length - 1) {
        currentEntryIndex++;
        const entry = filteredIndices[currentEntryIndex].entry;
        renderModalContent(entry);
        highlightEntry(entry.id);
    }
}

function highlightEntry(entryId) {
    document.querySelectorAll('.highlighted').forEach(e => {
        e.classList.remove('highlighted');
    });

    const entryEl = document.querySelector(`[data-id="${entryId}"]`);
    if (entryEl) {
        entryEl.classList.add('highlighted');
        entryEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'center' });
        setTimeout(() => entryEl.classList.remove('highlighted'), 2000);
    }
}

// ===== BOOKMARKS =====
function toggleBookmark(entryId) {
    const index = bookmarks.indexOf(entryId);

    if (index === -1) {
        bookmarks.push(entryId);
        showToast('Added to bookmarks');
    } else {
        bookmarks.splice(index, 1);
        showToast('Removed from bookmarks');
    }

    localStorage.setItem('timelineBookmarks', JSON.stringify(bookmarks));

    const bookmarkBtn = document.getElementById('bookmarkBtn');
    const isBookmarked = bookmarks.includes(entryId);
    bookmarkBtn.textContent = isBookmarked ? '★ Bookmarked' : '☆ Add to Bookmarks';
    bookmarkBtn.classList.toggle('bookmarked', isBookmarked);

    if (document.getElementById('bookmarksPanel').classList.contains('active')) {
        renderBookmarksPanel();
    }
}

function renderBookmarksPanel() {
    const list = document.getElementById('bookmarksList');
    list.innerHTML = '';

    if (bookmarks.length === 0) {
        list.innerHTML = '<p style="color:#666;padding:20px;">No bookmarks yet</p>';
        return;
    }

    bookmarks.forEach(id => {
        const entry = allEntries.find(e => e.id === id);
        if (!entry) return;

        const item = document.createElement('div');
        item.className = 'bookmark-item';
        item.innerHTML = `
            <span>${entry.title}</span>
            <button class="remove-btn" data-id="${id}">×</button>
        `;

        item.querySelector('span').onclick = () => {
            openModal(entry);
            document.getElementById('bookmarksPanel').classList.remove('active');
        };

        item.querySelector('.remove-btn').onclick = (e) => {
            e.stopPropagation();
            toggleBookmark(id);
        };

        list.appendChild(item);
    });
}

// ===== COPY LINK =====
function copyLink() {
    const entryId = filteredIndices[currentEntryIndex]?.id;
    if (!entryId) return;

    const url = `${window.location.origin}${window.location.pathname}#entry-${entryId}`;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard');
    });
}

// ===== URL HASH =====
function checkURLHash() {
    const hash = window.location.hash;
    if (hash.startsWith('#entry-')) {
        const entryId = hash.replace('#entry-', '');
        const entry = allEntries.find(e => e.id === entryId);
        if (entry) {
            setTimeout(() => openModal(entry), 500);
        }
    }
}

// ===== ERA JUMP =====
function jumpToEra(era) {
    const firstEntry = allEntries.find(e => e.era === era);
    if (firstEntry) {
        const entryEl = document.querySelector(`[data-id="${firstEntry.id}"]`);
        if (entryEl) {
            entryEl.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
    }
}

// ===== TOAST =====
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// ===== KEYBOARD NAVIGATION =====
function handleKeyboard(e) {
    if (modal.classList.contains('active')) {
        switch (e.key) {
            case 'Escape':
                closeModal();
                break;
            case 'ArrowLeft':
                prevEntry();
                break;
            case 'ArrowRight':
                nextEntry();
                break;
        }
    } else {
        switch (e.key) {
            case 'ArrowLeft':
                timelinesContainer.scrollBy({ left: -200, behavior: 'smooth' });
                break;
            case 'ArrowRight':
                timelinesContainer.scrollBy({ left: 200, behavior: 'smooth' });
                break;
        }
    }
}

// ===== DRAG TO SCROLL =====
function startDrag(e) {
    isDown = true;
    startX = e.pageX - timelinesContainer.offsetLeft;
    scrollLeft = timelinesContainer.scrollLeft;
}

function endDrag() {
    isDown = false;
}

function doDrag(e) {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - timelinesContainer.offsetLeft;
    timelinesContainer.scrollLeft = scrollLeft - (x - startX);
}

// ===== DEBOUNCE =====
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

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    searchInput.addEventListener('input', debounce(applyFilters, 300));
    filterType.addEventListener('change', applyFilters);
    filterEra.addEventListener('change', applyFilters);
    filterCharacter.addEventListener('change', applyFilters);
    filterLocation.addEventListener('change', applyFilters);

    document.getElementById('closeModal').onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    document.getElementById('prevEntry').onclick = prevEntry;
    document.getElementById('nextEntry').onclick = nextEntry;
    document.getElementById('bookmarkBtn').onclick = () => {
        const entryId = filteredIndices[currentEntryIndex]?.id;
        if (entryId) toggleBookmark(entryId);
    };
    document.getElementById('copyLinkBtn').onclick = copyLink;

    document.getElementById('bookmarksBtn').onclick = () => {
        const panel = document.getElementById('bookmarksPanel');
        panel.classList.toggle('active');
        if (panel.classList.contains('active')) {
            renderBookmarksPanel();
        }
    };
    document.getElementById('closeBookmarks').onclick = () => {
        document.getElementById('bookmarksPanel').classList.remove('active');
    };

    document.getElementById('sortBtn').onclick = cycleSort;

    eraJump.onclick = (e) => {
        if (e.target.dataset.era) {
            jumpToEra(e.target.dataset.era);
        }
    };

    document.addEventListener('keydown', handleKeyboard);

    timelinesContainer.addEventListener('mousedown', startDrag);
    timelinesContainer.addEventListener('mouseup', endDrag);
    timelinesContainer.addEventListener('mouseleave', endDrag);
    timelinesContainer.addEventListener('mousemove', doDrag);

    window.addEventListener('hashchange', checkURLHash);
}

// ===== START =====
init();
