let entries = [...ENTRIES];

const timeline = document.getElementById('timeline');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const searchInput = document.getElementById('searchInput');
const filterType = document.getElementById('filterType');
const viewport = document.getElementById('viewport');

// Render timeline
function render() {
    timeline.innerHTML = '';
    
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
            div.innerHTML = `
                <span class="entry-title ${isBottom ? 'bottom' : ''}">${entry.title}</span>
                <div class="entry-dot"></div>
            `;
            div.onclick = () => showModal(entry);
            group.appendChild(div);
            isBottom = !isBottom;
        });
        
        timeline.appendChild(group);
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
