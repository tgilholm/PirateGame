export function sortByNearestNeighbour(nodes: { x: number; y: number }[]) {
    const remaining = [...nodes];
    const sorted = [remaining.splice(0, 1)[0]]; // start from first point

    while (remaining.length > 0) {
        const last = sorted[sorted.length - 1];

        // Find closest unvisited node
        let nearestIdx = 0;
        let nearestDist = Infinity;
        for (let i = 0; i < remaining.length; i++) {
            const dx = remaining[i].x - last.x;
            const dy = remaining[i].y - last.y;
            const dist = dx * dx + dy * dy; // no need for sqrt
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestIdx = i;
            }
        }

        sorted.push(remaining.splice(nearestIdx, 1)[0]);
    }

    return sorted;
}