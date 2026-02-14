// ===== STATE =====
let entries = [...ENTRIES];
let allEntries = [...ENTRIES];
let currentEntryIndex = 0;
let filteredIndices = [];
let bookmarks = JSON.parse(localStorage.getItem('timelineBookmarks') || '[]');
let currentZoom = 1;
let currentSort = 'default';
let entryPositions = {};

// ===== DOM ELEMENTS =====
const timeline = document.getElementById('timeline');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const searchInput = document.getElementById('searchInput');
const filterType = document.getElementById('filterType');
const filterEra = document.getElementById('filterEra');
const filterCharacter = document.getElementById('filterCharacter');
const filterLocation = document.getElementById('filterLocation');
const viewport = document.getElementById('viewport');
const minimap = document.getElementById('minimap');
const eraJump = document.getElementById('eraJump');
const toast = document.getElementById('toast');

// ===== INITIALIZE =====
function init() {
    populateFilters();
    render();
    setupEventListeners();
    checkURLHash();
    
    // Scroll to start point (Chapter 1) after render
    setTimeout(scrollToStartPoint, 300);
}

function scrollToStartPoint() {
    // Check if URL has a specific entry first
    if (window.location.hash) return;
    
    // Find the start point entry
    const startEntry = allEntries.find(e => e.isStartPoint);
    if (!startEntry) return;
    
    // Find the entry element
    const entryEl = document.querySelector(`.entry[data-id="${startEntry.id}"]`);
    if (entryEl) {
        entryEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'center' });
    }
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
    
    // Populate era filter
    filterEra.innerHTML = '<option value="">All Eras</option>';
    eras.forEach(era => {
        filterEra.innerHTML += `<option value="${era}">${era}</option>`;
    });
    
    // Populate character filter
    filterCharacter.innerHTML = '<option value="">All Characters</option>';
    Array.from(characters).sort().forEach(char => {
        filterCharacter.innerHTML += `<option value="${char}">${char}</option>`;
    });
    
    // Populate location filter
    filterLocation.innerHTML = '<option value="">All Locations</option>';
    Array.from(locations).sort().forEach(loc => {
        filterLocation.innerHTML += `<option value="${loc}">${loc}</option>`;
    });
}

// ===== RENDER TIMELINE =====
function render() {
    timeline.innerHTML = '';
    entryPositions = {};
    
    // Create SVG for connections
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'connectionsSvg';
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;';
    timeline.appendChild(svg);
    
    // Group by era
    const eras = {};
    entries.forEach(e => {
        if (!eras[e.era]) eras[e.era] = [];
        eras[e.era].push(e);
    });
    
    let isBottom = false;
    let eraIndex = 0;
    
    // Render era jump buttons
    eraJump.innerHTML = '<span>Jump to Era:</span>';
    
    Object.keys(eras).forEach(era => {
        // Add era jump button
        eraJump.innerHTML += `<button data-era="${era}">${era}</button>`;
        
        // Create era group
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
        
        // Sort entries by sortOrder
        const sortedEntries = [...eras[era]].sort((a, b) => {
            const orderA = a.sortOrder !== undefined ? a.sortOrder : (a.year || 0);
            const orderB = b.sortOrder !== undefined ? b.sortOrder : (b.year || 0);
            return orderA - orderB;
        });
        
        // Render entries
        sortedEntries.forEach(entry => {
            const div = document.createElement('div');
            div.className = 'entry';
            if (entry.important) div.classList.add('important');
            if (entry.isStartPoint) div.classList.add('start-point');
            div.dataset.type = entry.type;
            div.dataset.id = entry.id || '';
            
            // Thumbnail on hover
            const thumbnail = entry.image ? `<img class="entry-thumbnail" src="${entry.image}" alt="">` : '';
            
            div.innerHTML = `
                <span class="entry-title ${isBottom ? 'bottom' : ''}">${entry.title}</span>
                ${thumbnail}
                <div class="entry-dot"></div>
            `;
            
            div.onclick = () => openModal(entry);
            group.appendChild(div);
            
            // Store position
            if (entry.id) {
                entryPositions[entry.id] = {
                    element: div,
                    isBottom: isBottom,
                    entry: entry
                };
            }
            
            isBottom = !isBottom;
        });
        
        timeline.appendChild(group);
        eraIndex++;
    });
    
    // Draw connections
    setTimeout(drawConnections, 100);
    
    // Update minimap
    renderMinimap();
    
    // Update filtered indices
    updateFilteredIndices();
}

// ===== RENDER MINIMAP =====
function renderMinimap() {
    const minimapContent = document.createElement('div');
    minimapContent.className = 'minimap-content';
    
    entries.forEach(entry => {
        const dot = document.createElement('div');
        dot.className = 'minimap-dot';
        dot.dataset.type = entry.type;
        
        // Color by type
        const colors = {
            main_story: '#ff6b6b',
            event_story: '#4ecdc4',
            side_mission: '#ffe66d',
            side_story: '#a29bfe'
        };
        dot.style.background = colors[entry.type] || '#888';
        
        minimapContent.appendChild(dot);
    });
    
    minimap.innerHTML = '';
    minimap.appendChild(minimapContent);
    
    // Add viewport indicator
    const viewportIndicator = document.createElement('div');
    viewportIndicator.className = 'minimap-viewport';
    viewportIndicator.id = 'minimapViewport';
    minimap.appendChild(viewportIndicator);
    
    updateMinimapViewport();
}

// ===== UPDATE MINIMAP VIEWPORT =====
function updateMinimapViewport() {
    const viewportIndicator = document.getElementById('minimapViewport');
    if (!viewportIndicator || entries.length === 0) return;
    
    const scrollPercent = viewport.scrollLeft / (viewport.scrollWidth - viewport.clientWidth);
    const viewportPercent = viewport.clientWidth / viewport.scrollWidth;
    
    viewportIndicator.style.left = `${scrollPercent * 100}%`;
    viewportIndicator.style.width = `${Math.max(viewportPercent * 100, 5)}%`;
}

// ===== DRAW CONNECTIONS =====
function drawConnections() {
    const svg = document.getElementById('connectionsSvg');
    if (!svg) return;
    
    // Keep SVG, remove paths
    const paths = svg.querySelectorAll('path');
    paths.forEach(p => p.remove());
    
    const timelineRect = timeline.getBoundingClientRect();
    
    Object.keys(entryPositions).forEach(entryId => {
        const entryData = entryPositions[entryId];
        const entry = entryData.entry;
        
        if (!entry.connections || entry.connections.length === 0) return;
        
        const entryDot = entryData.element.querySelector('.entry-dot');
        if (!entryDot) return;
        
        const entryRect = entryDot.getBoundingClientRect();
        const startX = entryRect.left + entryRect.width/2 - timelineRect.left;
        const startY = entryRect.top + entryRect.height/2 - timelineRect.top;
        
        entry.connections.forEach(connection => {
            const targetId = typeof connection === 'string' ? connection : connection.target;
            const lineType = typeof connection === 'string' ? 'curved' : (connection.type || 'curved');
            
            if (!entryPositions[targetId]) return;
            
            const targetDot = entryPositions[targetId].element.querySelector('.entry-dot');
            if (!targetDot) return;
            
            const targetRect = targetDot.getBoundingClientRect();
            const endX = targetRect.left + targetRect.width/2 - timelineRect.left;
            const endY = targetRect.top + targetRect.height/2 - timelineRect.top;
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            let d;
            if (lineType === 'straight') {
                d = `M ${startX} ${startY} L ${endX} ${endY}`;
            } else {
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;
                const controlOffset = Math.abs(endX - startX) * 0.3;
                
                if (entryData.isBottom === entryPositions[targetId].isBottom) {
                    d = `M ${startX} ${startY} Q ${midX} ${midY - controlOffset} ${endX} ${endY}`;
                } else {
                    d = `M ${startX} ${startY} Q ${midX - controlOffset} ${midY} ${endX} ${endY}`;
                }
            }
            
            path.setAttribute('d', d);
            path.setAttribute('class', `connection-line ${lineType}`);
            svg.appendChild(path);
        });
    });
}

// ===== UPDATE FILTERED INDICES =====
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

// ===== OPEN MODAL =====
function openModal(entry) {
    // Find index
    currentEntryIndex = filteredIndices.findIndex(f => f.id === entry.id);
    if (currentEntryIndex === -1) currentEntryIndex = 0;
    
    renderModalContent(entry);
    modal.classList.add('active');
    
    // Update URL
    if (entry.id) {
        history.pushState(null, '', `#entry-${entry.id}`);
    }
}

// ===== RENDER MODAL CONTENT =====
function renderModalContent(entry) {
    const typeLabel = entry.type.replace('_', ' ').toUpperCase();
    const chapter = entry.chapter ? ` - Chapter ${entry.chapter}` : '';
    
    // Update counter
    document.getElementById('entryCounter').textContent = 
        `${currentEntryIndex + 1} of ${filteredIndices.length}`;
    
    // Update nav buttons
    document.getElementById('prevEntry').disabled = currentEntryIndex === 0;
    document.getElementById('nextEntry').disabled = currentEntryIndex >= filteredIndices.length - 1;
    
    // Update bookmark button
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    const isBookmarked = bookmarks.includes(entry.id);
    bookmarkBtn.textContent = isBookmarked ? '★ Bookmarked' : '☆ Add to Bookmarks';
    bookmarkBtn.classList.toggle('bookmarked', isBookmarked);
    
    let html = `
        <div class="modal-type ${entry.type}">${typeLabel}${chapter}</div>
        <h2>${entry.title}</h2>
        <div class="modal-meta">
        html += `<span>📅 ${entry.era}`;
        if (entry.timeline) {
            html += ` | ${entry.timeline}`;
        } else if (entry.year !== undefined) {
            html += ` | Year ${entry.year}`;
        }
        html += `</span>`;
    `;
    
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
    
    // Image
    if (entry.image) {
        html += `<img class="modal-image" src="${entry.image}" alt="${entry.title}">`;
    }
    
    // Tags
    if (entry.tags && entry.tags.length) {
        html += `<div class="modal-tags">`;
        entry.tags.forEach(tag => {
            html += `<span class="tag" data-tag="${tag}">${tag}</span>`;
        });
        html += `</div>`;
    }
    
    // Content
    html += `<div class="modal-body">${entry.content || entry.summary}</div>`;
    
    // YouTube
    if (entry.youtube) {
        html += `<iframe class="modal-video" src="${entry.youtube}" frameborder="0" allowfullscreen></iframe>`;
    }
    
    // Related entries
    const relatedEntries = findRelatedEntries(entry);
    if (relatedEntries.length > 0) {
        html += `
            <div class="related-entries">
                <h4>Related Entries</h4>
                <div class="related-list">
        `;
        relatedEntries.slice(0, 5).forEach(rel => {
            html += `<div class="related-item" data-id="${rel.id}">${rel.title}</div>`;
        });
        html += `</div></div>`;
    }
    
    modalBody.innerHTML = html;
    
    // Add click handlers for tags, characters, locations
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
        
        // Same era
        if (e.era === entry.era) score += 1;
        
        // Shared characters
        if (entry.characters && e.characters) {
            const sharedChars = entry.characters.filter(c => e.characters.includes(c));
            score += sharedChars.length * 2;
        }
        
        // Shared locations
        if (entry.locations && e.locations) {
            const sharedLocs = entry.locations.filter(l => e.locations.includes(l));
            score += sharedLocs.length;
        }
        
        // Shared tags
        if (entry.tags && e.tags) {
            const sharedTags = entry.tags.filter(t => e.tags.includes(t));
            score += sharedTags.length;
        }
        
        // Connected entries
        if (entry.connections && entry.connections.some(c => {
            const targetId = typeof c === 'string' ? c : c.target;
            return targetId === e.id;
        })) {
            score += 5;
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
    
    // Apply sort
    applySort();
    
    render();
    showToast(`Showing ${entries.length} entries`);
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
    switch (currentSort) {
        case 'title':
            entries.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'type':
            entries.sort((a, b) => a.type.localeCompare(b.type));
            break;
        case 'year':
            entries.sort((a, b) => {
                const orderA = a.sortOrder !== undefined ? a.sortOrder : (a.year || 0);
                const orderB = b.sortOrder !== undefined ? b.sortOrder : (b.year || 0);
                return orderA - orderB;
            });
            break;
        default:
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
    // Remove previous highlights
    document.querySelectorAll('.entry.highlighted').forEach(e => {
        e.classList.remove('highlighted');
    });
    
    // Add highlight
    const entryEl = document.querySelector(`.entry[data-id="${entryId}"]`);
    if (entryEl) {
        entryEl.classList.add('highlighted');
        
        // Scroll into view
        entryEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'center' });
        
        // Remove highlight after animation
        setTimeout(() => entryEl.classList.remove('highlighted'), 2000);
    }
}

// ===== CLOSE MODAL =====
function closeModal() {
    modal.classList.remove('active');
    history.pushState(null, '', window.location.pathname);
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
    
    // Update button
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    const isBookmarked = bookmarks.includes(entryId);
    bookmarkBtn.textContent = isBookmarked ? '★ Bookmarked' : '☆ Add to Bookmarks';
    bookmarkBtn.classList.toggle('bookmarked', isBookmarked);
    
    // Update panel if open
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

// ===== ZOOM =====
function zoomIn() {
    currentZoom = Math.min(currentZoom + 0.1, 2);
    applyZoom();
}

function zoomOut() {
    currentZoom = Math.max(currentZoom - 0.1, 0.5);
    applyZoom();
}

function applyZoom() {
    timeline.style.transform = `scale(${currentZoom})`;
    document.getElementById('zoomLevel').textContent = `${Math.round(currentZoom * 100)}%`;
    setTimeout(drawConnections, 100);
}

// ===== ERA JUMP =====
function jumpToEra(era) {
    const eraGroup = document.getElementById(`era-${era.replace(/\s+/g, '-').toLowerCase()}`);
    if (eraGroup) {
        eraGroup.scrollIntoView({ behavior: 'smooth', inline: 'start' });
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
                viewport.scrollBy({ left: -200, behavior: 'smooth' });
                break;
            case 'ArrowRight':
                viewport.scrollBy({ left: 200, behavior: 'smooth' });
                break;
        }
    }
}

// ===== DRAG TO SCROLL =====
let isDown = false, startX, scrollLeft;

function startDrag(e) {
    isDown = true;
    startX = e.pageX - viewport.offsetLeft;
    scrollLeft = viewport.scrollLeft;
}

function endDrag() {
    isDown = false;
}

function doDrag(e) {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - viewport.offsetLeft;
    viewport.scrollLeft = scrollLeft - (x - startX);
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Search and filters
    searchInput.addEventListener('input', debounce(applyFilters, 300));
    filterType.addEventListener('change', applyFilters);
    filterEra.addEventListener('change', applyFilters);
    filterCharacter.addEventListener('change', applyFilters);
    filterLocation.addEventListener('change', applyFilters);
    
    // Modal
    document.getElementById('closeModal').onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    document.getElementById('prevEntry').onclick = prevEntry;
    document.getElementById('nextEntry').onclick = nextEntry;
    document.getElementById('bookmarkBtn').onclick = () => {
        const entryId = filteredIndices[currentEntryIndex]?.id;
        if (entryId) toggleBookmark(entryId);
    };
    document.getElementById('copyLinkBtn').onclick = copyLink;
    
    // Bookmarks panel
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
    
    // Sort
    document.getElementById('sortBtn').onclick = cycleSort;
    
    // Zoom
    document.getElementById('zoomIn').onclick = zoomIn;
    document.getElementById('zoomOut').onclick = zoomOut;
    
    // Era jump
    eraJump.onclick = (e) => {
        if (e.target.dataset.era) {
            jumpToEra(e.target.dataset.era);
        }
    };
    
    // Keyboard
    document.addEventListener('keydown', handleKeyboard);
    
    // Drag scroll
    viewport.addEventListener('mousedown', startDrag);
    viewport.addEventListener('mouseup', endDrag);
    viewport.addEventListener('mouseleave', endDrag);
    viewport.addEventListener('mousemove', doDrag);
    
    // Scroll events
    viewport.addEventListener('scroll', () => {
        updateMinimapViewport();
        setTimeout(drawConnections, 50);
    });
    
    window.addEventListener('resize', () => {
        updateMinimapViewport();
        setTimeout(drawConnections, 100);
    });
    
    // Hash change
    window.addEventListener('hashchange', checkURLHash);
    
    // Minimap click
    minimap.onclick = (e) => {
        const rect = minimap.getBoundingClientRect();
        const clickPercent = (e.clientX - rect.left) / rect.width;
        viewport.scrollLeft = clickPercent * viewport.scrollWidth;
    };
}

// ===== UTILITY =====
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

// ===== START =====
init();
// Initial render
render();
