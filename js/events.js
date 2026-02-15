// ===== EVENT LISTENERS =====

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Search and filters
    elements.searchInput.addEventListener('input', debounce(applyFilters, 300));
    elements.filterType.addEventListener('change', applyFilters);
    elements.filterEra.addEventListener('change', applyFilters);
    elements.filterCharacter.addEventListener('change', applyFilters);
    elements.filterLocation.addEventListener('change', applyFilters);

    // Modal
    elements.closeModal.onclick = closeModal;
    elements.modal.onclick = (e) => { if (e.target === elements.modal) closeModal(); };
    elements.prevEntry.onclick = prevEntry;
    elements.nextEntry.onclick = nextEntry;
    elements.bookmarkBtn.onclick = () => {
        const entryId = filteredIndices[currentEntryIndex]?.id;
        if (entryId) toggleBookmark(entryId);
    };
    elements.copyLinkBtn.onclick = copyLink;

    // Bookmarks panel
    elements.bookmarksBtn.onclick = () => {
        elements.bookmarksPanel.classList.toggle('active');
        if (elements.bookmarksPanel.classList.contains('active')) {
            renderBookmarksPanel();
        }
    };
    elements.closeBookmarks.onclick = () => {
        elements.bookmarksPanel.classList.remove('active');
    };

    // Sort
    elements.sortBtn.onclick = cycleSort;

    // Zoom
    elements.zoomIn.onclick = zoomIn;
    elements.zoomOut.onclick = zoomOut;

    // Era jump
    elements.eraJump.onclick = (e) => {
        if (e.target.dataset.era) {
            jumpToEra(e.target.dataset.era);
        }
    };

    // Keyboard
    document.addEventListener('keydown', handleKeyboard);

    // Drag scroll
    setupDragScroll();

    // Scroll & resize events
    elements.viewport.addEventListener('scroll', () => {
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
    elements.minimap.onclick = (e) => {
        const rect = elements.minimap.getBoundingClientRect();
        const clickPercent = (e.clientX - rect.left) / rect.width;
        elements.viewport.scrollLeft = clickPercent * elements.viewport.scrollWidth;
    };
}

/**
 * Set up drag to scroll functionality
 */
function setupDragScroll() {
    elements.viewport.addEventListener('mousedown', startDrag);
    elements.viewport.addEventListener('mouseup', endDrag);
    elements.viewport.addEventListener('mouseleave', endDrag);
    elements.viewport.addEventListener('mousemove', doDrag);
}

function startDrag(e) {
    isDown = true;
    startX = e.pageX - elements.viewport.offsetLeft;
    scrollLeft = elements.viewport.scrollLeft;
}

function endDrag() {
    isDown = false;
}

function doDrag(e) {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - elements.viewport.offsetLeft;
    elements.viewport.scrollLeft = scrollLeft - (x - startX);
}

/**
 * Zoom controls
 */
function zoomIn() {
    currentZoom = Math.min(currentZoom + 0.1, 2);
    applyZoom();
}

function zoomOut() {
    currentZoom = Math.max(currentZoom - 0.1, 0.5);
    applyZoom();
}

function applyZoom() {
    elements.timeline.style.transform = `scale(${currentZoom})`;
    elements.zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
    setTimeout(drawConnections, 100);
}
