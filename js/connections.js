// ===== CONNECTION LINE DRAWING =====

/**
 * Draw all connection lines between entries
 */
function drawConnections() {
    const svg = document.getElementById('connectionsSvg');
    if (!svg) return;

    // Remove existing paths
    svg.querySelectorAll('path').forEach(p => p.remove());

    const timelineRect = elements.timeline.getBoundingClientRect();

    Object.keys(entryPositions).forEach(entryId => {
        const entryData = entryPositions[entryId];
        const entry = entryData.entry;

        if (!entry.connections || entry.connections.length === 0) return;

        const entryDot = entryData.element.querySelector('.entry-dot');
        if (!entryDot) return;

        const entryRect = entryDot.getBoundingClientRect();
        const startX = entryRect.left + entryRect.width / 2 - timelineRect.left;
        const startY = entryRect.top + entryRect.height / 2 - timelineRect.top;

        entry.connections.forEach(connection => {
            const targetId = typeof connection === 'string' ? connection : connection.target;
            const lineType = typeof connection === 'string' ? 'curved' : (connection.type || 'curved');

            if (!entryPositions[targetId]) return;

            const targetDot = entryPositions[targetId].element.querySelector('.entry-dot');
            if (!targetDot) return;

            const targetRect = targetDot.getBoundingClientRect();
            const endX = targetRect.left + targetRect.width / 2 - timelineRect.left;
            const endY = targetRect.top + targetRect.height / 2 - timelineRect.top;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const d = calculatePath(startX, startY, endX, endY, lineType, entryData.isBottom, entryPositions[targetId].isBottom);

            path.setAttribute('d', d);
            path.setAttribute('class', `connection-line ${lineType}`);
            svg.appendChild(path);
        });
    });
}

/**
 * Calculate SVG path for connection line
 */
function calculatePath(startX, startY, endX, endY, lineType, isStartBottom, isEndBottom) {
    if (lineType === 'straight') {
        return `M ${startX} ${startY} L ${endX} ${endY}`;
    }

    // Curved line
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const controlOffset = Math.abs(endX - startX) * 0.3;

    if (isStartBottom === isEndBottom) {
        return `M ${startX} ${startY} Q ${midX} ${midY - controlOffset} ${endX} ${endY}`;
    } else {
        return `M ${startX} ${startY} Q ${midX - controlOffset} ${midY} ${endX} ${endY}`;
    }
}
