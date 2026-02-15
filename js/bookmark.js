// ===== BOOKMARK FUNCTIONS =====

/**
 * Toggle bookmark status for an entry
 */
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
    updateBookmarkButton(entryId);

    if (elements.bookmarksPanel.classList.contains('active')) {
        renderBookmarksPanel();
    }
}

/**
 * Update bookmark button state
 */
function updateBookmarkButton(entryId) {
    const isBookmarked = bookmarks.includes(entryId);
    elements.bookmarkBtn.textContent = isBookmarked ? '★ Bookmarked' : '☆ Add to Bookmarks';
    elements.bookmarkBtn.classList.toggle('bookmarked', isBookmarked);
}

/**
 * Render the bookmarks panel
 */
function renderBookmarksPanel() {
    elements.bookmarksList.innerHTML = '';

    if (bookmarks.length === 0) {
        elements.bookmarksList.innerHTML = '<p style="color:#666;padding:20px;">No bookmarks yet</p>';
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
            elements.bookmarksPanel.classList.remove('active');
        };

        item.querySelector('.remove-btn').onclick = (e) => {
            e.stopPropagation();
            toggleBookmark(id);
        };

        elements.bookmarksList.appendChild(item);
    });
}
