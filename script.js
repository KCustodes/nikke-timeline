let entries = [...ENTRIES];
const entryPositions = {};

const timeline = document.getElementById('timeline');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const searchInput = document.getElementById('searchInput');
const filterType = document.getElementById('filterType');
const viewport = document.getElementById('viewport');

// Render timeline
function render() {
    // Clear everything including SVG
    timeline.innerHTML = '';
    
    // Add SVG for connections
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'connectionsSvg';
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '1';
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
            div.dataset.id = entry.id || '';
            
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
    
    // Draw connections after elements are rendered
    setTimeout(drawConnections, 100);
}

// Draw connections between entries
function drawConnections() {
    const svg = document.getElementById('connectionsSvg');
    if (!svg) return;
    
    svg.innerHTML = '';
    
    const timelineRect = timeline.getBoundingClientRect();
    
    Object.keys(entryPositions).forEach(entryId => {
        const entryData = entryPositions[entryId];
        const entry = entryData.entry;
        
        if (!entry.connections || entry.connections.length === 0) return;
        
        const entryDot = entryData.element.querySelector('.entry-dot');
        const entryRect = entryDot.getBoundingClientRect();
        
        const startX = entryRect.left + entryRect.width/2 - timelineRect.left;
        const startY = entryRect.top + entryRect.height/2 - timelineRect.top;
        
        entry.connections.forEach(connection => {
            const targetId = typeof connection === 'string' ? connection : connection.target;
            const lineType = typeof connection === 'string' ? 'curved' : (connection.type || 'curved');
            
            if (!entryPositions[targetId]) return;
            
            const targetDot = entryPositions[targetId].element.querySelector('.entry-dot');
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
                const controlOffset = Math.abs(endX - startX) * 0.2;
                
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

// Redraw connections on scroll/resize
viewport.addEventListener('scroll', () => setTimeout(drawConnections, 50));
window.addEventListener('resize', () => setTimeout(drawConnections, 50));

// Add legend
document.body.insertAdjacentHTML('beforeend', `
    <div class="legend">
        <div class="legend-item"><span class="legend-dot" style="background:#ff6b6b"></span> Main Story</div>
        <div class="legend-item"><span class="legend-dot" style="background:#4ecdc4"></span> Event Stories</div>
        <div class="legend-item"><span class="legend-dot" style="background:#ffe66d"></span> Side Missions</div>
        <div class="legend-item"><span class="legend-dot" style="background:#a29bfe"></span> Side Stories</div>
    </div>
`);

// Initial render
render();
