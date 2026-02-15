// ===== STATE & CONFIGURATION =====

// Entry data
let entries = [...ENTRIES];
let allEntries = [...ENTRIES];

// Navigation state
let currentEntryIndex = 0;
let filteredIndices = [];

// User preferences (persisted)
let bookmarks = JSON.parse(localStorage.getItem('timelineBookmarks') || '[]');

// View state
let currentZoom = 1;
let currentSort = 'default';

// Position cache for connection lines
let entryPositions = {};

// Drag state
let isDown = false;
let startX = 0;
let scrollLeft = 0;
