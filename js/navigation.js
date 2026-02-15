// ===== NAVIGATION FUNCTIONS =====

/**
 * Open modal for a specific entry
 */
function openModal(entry) {
    currentEntryIndex = filteredIndices.findIndex(f => f.id === entry.id);
    if (currentEntryIndex === -1) currentEntryIndex = 0;

    renderModalContent(entry);
    elements.modal.classList.add('active');

    if (entry.id) {
        history.pushState(null, '', `#entry-${entry.id}`);
    }
}

/**
 * Close the modal
 */
function closeModal() {
    elements.modal.classList.remove('active');
    history.pushState(null, '', window.location.pathname);
}

/**
 * Go to previous entry
 */
function prevEntry() {
    if (currentEntryIndex > 0) {
        currentEntryIndex--;
        const entry = filteredIndices[currentEntryIndex].entry;
        renderModalContent(entry);
        highlightEntry(entry.id);
    }
}

/**
 * Go to next entry
 */
function nextEntry() {
    if (currentEntryIndex < filteredIndices.length - 1) {
        currentEntryIndex++;
        const entry = filteredIndices[currentEntryIndex].entry;
        renderModalContent(entry);
        highlightEntry(entry.id);
    }
}

/**
 * Render modal content for an entry
 */
function renderModalContent(entry) {
    const typeLabel = entry.type.replace('_', ' ').toUpperCase();
    const chapter = entry.chapter ? ` - Chapter ${entry.chapter}` : '';

    // Update counter
    elements.entryCounter.textContent = `${currentEntryIndex + 1} of ${filteredIndices.length}`;

    // Update nav buttons
    elements.prevEntry.disabled = currentEntryIndex === 0;
    elements.nextEntry.disabled = currentEntryIndex >= filteredIndices.length - 1;

    // Update bookmark button
    updateBookmarkButton(entry.id);

    // Build HTML
    let html = buildModalHtml(entry, typeLabel, chapter);
    elements.modalBody.innerHTML = html;

    // Attach click handlers
    attachModalClickHandlers();
}

/**
 * Build modal HTML content
 */
function buildModalHtml(entry, typeLabel, chapter) {
    let html = `
        <div class="modal-type ${entry.type}">${typeLabel}${chapter}</div>
        <h2>${entry.title}</h2>
        <div class="modal-meta">
    `;

    // Timeline info
    html += `<span>📅 ${entry.era}`;
    if (entry.timeline) {
        html += ` | ${entry.timeline}`;
    } else if (entry.year !== undefined) {
        html += ` | Year ${entry.year}`;
    }
    html += `</span>`;

    // Characters
    if (entry.characters && entry.characters.length) {
        html += `<span>👥 `;
        entry.characters.forEach((char, i) => {
            html += `<a class="character-link" data-character="${char}">${char}</a>`;
            if (i < entry.characters.length - 1) html += ', ';
        });
        html += `</span>`;
    }

    // Locations
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
    const related = findRelatedEntries(entry);
    if (related.length > 0) {
        html += `<div class="related-entries"><h4>Related Entries</h4><div class="related-list">`;
        related.slice(0, 5).forEach(rel => {
            html += `<div class="related-item" data-id="${rel.id}">${rel.title}</div>`;
        });
        html += `</div></div>`;
    }

    return html;
}

/**
 * Attach click handlers to modal elements
 */
function attachModalClickHandlers() {
    elements.modalBody.querySelectorAll('.tag').forEach(tag => {
        tag.onclick = () => filterByTag(tag.dataset.tag);
    });

    elements.modalBody.querySelectorAll('.character-link').forEach(link => {
        link.onclick = () => filterByCharacter(link.dataset.character);
    });

    elements.modalBody.querySelectorAll('.location-link').forEach(link => {
        link.onclick = () => filterByLocation(link.dataset.location);
    });

    elements.modalBody.querySelectorAll('.related-item').forEach(item => {
        item.onclick = () => {
            const relatedEntry = allEntries.find(e => e.id === item.dataset.id);
            if (relatedEntry) openModal(relatedEntry);
        };
    });
}

/**
 * Find related entries based on shared attributes
 */
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

/**
 * Copy shareable link to clipboard
 */
function copyLink() {
    const entryId = filteredIndices[currentEntryIndex]?.id;
    if (!entryId) return;

    const url = `${window.location.origin}${window.location.pathname}#entry-${entryId}`;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard');
    });
}

/**
 * Check URL hash and open corresponding entry
 */
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

/**
 * Scroll to the designated start point entry
 */
function scrollToStartPoint() {
    if (window.location.hash) return;

    const startEntry = allEntries.find(e => e.isStartPoint);
    if (!startEntry) return;

    const entryEl = document.querySelector(`.entry[data-id="${startEntry.id}"]`);
    if (entryEl) {
        entryEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'center' });
    }
}

/**
 * Jump to a specific era
 */
function jumpToEra(era) {
    const eraGroup = document.getElementById(`era-${era.replace(/\s+/g, '-').toLowerCase()}`);
    if (eraGroup) {
        eraGroup.scrollIntoView({ behavior: 'smooth', inline: 'start' });
    }
}

/**
 * Handle keyboard navigation
 */
function handleKeyboard(e) {
    if (elements.modal.classList.contains('active')) {
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
                elements.viewport.scrollBy({ left: -200, behavior: 'smooth' });
                break;
            case 'ArrowRight':
                elements.viewport.scrollBy({ left: 200, behavior: 'smooth' });
                break;
        }
    }
}
