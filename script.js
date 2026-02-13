let entries = [...ENTRIES];

const timeline = document.getElementById('timeline');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const searchInput = document.getElementById('searchInput');
const filterType = document.getElementById('filterType');
const viewport = document.getElementById('viewport');
const entryPositions = {};

// Render timeline
function render() {
    timeline.innerHTML = '';
    
    // Add SVG for connections
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'connectionsSvg';
    timeline.appendChild(svg);
    
    // Group by era
    const eras = {};
    entries.forEach(e => {
        if (!eras[e.era]) eras[e.era] = [];
        eras[e.era].push(e);
    });
    
    let isBottom = false;
    
    Object.keys(eras).forEach(era => {
        const group = document.createElement('div');
        group.className = 'era-group';
        group.innerHTML = `<span class="era-label">${era}</span>`;
        
        eras[era].sort((a, b) => a.year - b.year).forEach(entry => {
            const div = document.createElement('div');
            div.className = 'entry';
            div.dataset.type = entry.type;
            div.dataset.id = entry.id || '';  // Use the ID for positioning
            
            div.innerHTML = `
                <span class="entry-title ${isBottom ? 'bottom' : ''}">${entry.title}</span>
                <div class="entry-dot"></div>
            `;
            
            div.onclick = () => showModal(entry);
            group.appendChild(div);
            
            // Store position for this entry
            entryPositions[entry.id] = {
                element: div,
                isBottom: isBottom,
                entry: entry
            };
            
            isBottom = !isBottom;
        });
        
        timeline.appendChild(group);
    });
    
    // Draw connections after a delay to ensure positions are calculated
    setTimeout(drawConnections, 100);
}

// Draw connections between entries
function drawConnections() {
    const svg = document.getElementById('connectionsSvg');
    svg.innerHTML = '';  // Clear existing lines
    
    // Get the timeline's position relative to the viewport
    const timelineRect = timeline.getBoundingClientRect();
    
    // Draw connections for each entry
    Object.keys(entryPositions).forEach(entryId => {
        const entryData = entryPositions[entryId];
        const entry = entryData.entry;
        
        if (!entry.connections || entry.connections.length === 0) return;
        
        // Get the position of this entry's dot
        const entryElement = entryData.element;
        const entryDot = entryElement.querySelector('.entry-dot');
        const entryRect = entryDot.getBoundingClientRect();
        
        // Calculate position relative to the SVG
        const startX = entryRect.left + entryRect.width/2 - timelineRect.left;
        const startY = entryRect.top + entryRect.height/2 - timelineRect.top;
        
        // Draw a line to each connected entry
        entry.connections.forEach(connection => {
            // Handle both string and object formats
            const targetId = typeof connection === 'string' ? connection : connection.target;
            const lineType = typeof connection === 'string' ? 'curved' : (connection.type || 'curved');
            
            if (!entryPositions[targetId]) return;
            
            const targetElement = entryPositions[targetId].element;
            const targetDot = targetElement.querySelector('.entry-dot');
            const targetRect = targetDot.getBoundingClientRect();
            
            const endX = targetRect.left + targetRect.width/2 - timelineRect.left;
            const endY = targetRect.top + targetRect.height/2 - timelineRect.top;
            
            if (lineType === 'straight') {
                // Create a straight line
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', startX);
                line.setAttribute('y1', startY);
                line.setAttribute('x2', endX);
                line.setAttribute('y2', endY);
                line.setAttribute('class', 'connection-line straight');
                
                svg.appendChild(line);
            } else {
                // Create a curved path
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                
                // Create a curved path
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;
                const controlOffset = Math.abs(endX - startX) * 0.2;  // Curve amount
                
                let d;
                if (entryData.isBottom === entryPositions[targetId].isBottom) {
                    // Both on same side - create a curved line
                    d = `M ${startX} ${startY} Q ${midX} ${midY - controlOffset} ${endX} ${endY}`;
                } else {
                    // On opposite sides - create a different curve
                    d = `M ${startX} ${startY} Q ${midX - controlOffset} ${midY} ${endX} ${endY}`;
                }
                
                path.setAttribute('d', d);
                path.setAttribute('class', 'connection-line');
                
                svg.appendChild(path);
            }
        });
    });
}

// Redraw connections when scrolling or resizing
viewport.addEventListener('scroll', () => {
    setTimeout(drawConnections, 100);
});

window.addEventListener('resize', () => {
    setTimeout(drawConnections, 100);
});

// Show modal
function showModal(entry) {
    const typeLabel = entry.type.replace('_', ' ').toUpperCase();
    const chapter = entry.chapter ? ` - Chapter ${entry.chapter}` : '';
    
    let html = `
        <div class="modal-type ${entry.type}">${typeLabel}${chapter}</div>
        <h2>${entry.title}</h2>
        <div class="modal-meta">
            ${entry.era}, Year ${entry.year}
            ${entry.characters?.length ? ` | Characters: ${entry.characters.join(', ')}` : ''}
            ${entry.locations?.length ? ` | Locations: ${entry.locations.join(', ')}` : ''}
        </div>
    `;
    
    if (entry.image) {
        html += `<img class="modal-image" src="${entry.image}" alt="${entry.title}">`;
    }
    
    html += `<div class="modal-body">${entry.content}</div>`;
    
    if (entry.youtube) {
        html += `<iframe class="modal-video" src="${entry.youtube}" frameborder="0" allowfullscreen></iframe>`;
    }
    
    modalBody.innerHTML = html;
    modal.classList.add('active');
}

// Close modal
document.getElementById('closeModal').onclick = () => modal.classList.remove('active');
modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };

// Search
searchInput.oninput = () => {
    const q = searchInput.value.toLowerCase();
    entries = ENTRIES.filter(e => 
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        e.characters?.some(c => c.toLowerCase().includes(q)) ||
        e.tags?.some(t => t.toLowerCase().includes(q))
    );
    render();
};

// Filter
filterType.onchange = () => {
    const type = filterType.value;
    entries = type ? ENTRIES.filter(e => e.type === type) : [...ENTRIES];
    render();
};

// Drag to scroll
let isDown = false, startX, scrollLeft;
viewport.onmousedown = (e) => { isDown = true; startX = e.pageX - viewport.offsetLeft; scrollLeft = viewport.scrollLeft; };
viewport.onmouseup = () => isDown = false;
viewport.onmouseleave = () => isDown = false;
viewport.onmousemove = (e) => {
    if (!isDown) return;
    e.preventDefault();
    viewport.scrollLeft = scrollLeft - (e.pageX - viewport.offsetLeft - startX);
};

// Add legend
document.body.insertAdjacentHTML('beforeend', `
    <div class="legend">
        <div class="legend-item"><span class="legend-dot" style="background:#ff6b6b"></span> Main Story</div>
        <div class="legend-item"><span class="legend-dot" style="background:#4ecdc4"></span> Event Stories</div>
        <div class="legend-item"><span class="legend-dot" style="background:#ffe66d"></span> Side Missions</div>
        <div class="legend-item"><span class="legend-dot" style="background:#a29bfe"></span> Side Stories</div>
    </div>
`);

render();
