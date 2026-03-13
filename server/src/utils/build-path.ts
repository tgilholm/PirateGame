
/**
 * Uses the Catmull-Rom algorithm to calculate an array
 * containing points of a cardinal spline through a given
 * set of nodes- i.e. for use in pathing algorithms
 * @param nodes array of x, y objects to build from
 * @param tension how "tight" the spline is in relation to the original geometry
 * @param segments how many nodes to introduce between the initial nodes
 * @param closeLoop builds a closed path if true
 */
export function buildPathSpline(
    nodes: { x: number, y: number }[],
    tension: number = 0.5,
    segments: number = 25,
    closeLoop: true): { x: number, y: number }[] {

    if (nodes.length < 2) return nodes;


    // Convert to [x0, y0, ..., xn, yn];
    const pts: number[] = nodes.flatMap(n => [n.x, n.y]);
    const l = pts.length;

    // If closed, connect endpoints
    const closed = closeLoop
        ? [pts[l - 2], pts[l - 1], ...pts, pts[0], pts[1], pts[2], pts[3]] // wrap TWO nodes at end
        : [pts[0], pts[1], ...pts, pts[l - 2], pts[l - 1]];

    const result: { x: number; y: number }[] = [];

    for (let i = 2; i < closed.length - 4; i += 2) {
        // Keep track of neighbours to calculate tangeant
        const p0x = closed[i - 2], p0y = closed[i - 1];
        const p1x = closed[i], p1y = closed[i + 1];
        const p2x = closed[i + 2], p2y = closed[i + 3];
        const p3x = closed[i + 4], p3y = closed[i + 5];

        // Apply requisite kinkiness to the curve 
        const t1x = (p2x - p0x) * tension;
        const t1y = (p2y - p0y) * tension;
        const t2x = (p3x - p1x) * tension;
        const t2y = (p3y - p1y) * tension;

        // Generate the number of "in-between" nodes
        for (let seg = 0; seg < segments; seg++) {
            const t = seg / segments;
            const t2 = t * t;
            const t3 = t2 * t;

            // hermite basis functions
            const c1 = 2 * t3 - 3 * t2 + 1;
            const c2 = -2 * t3 + 3 * t2;
            const c3 = t3 - 2 * t2 + t;
            const c4 = t3 - t2;

            // Weighted sum of all four functions
            // blends the position together depending on the distance to the next node
            result.push({
                x: c1 * p1x + c2 * p2x + c3 * t1x + c4 * t2x,
                y: c1 * p1y + c2 * p2y + c3 * t1y + c4 * t2y
            });
        }
    }

    // Append the final node for open loops
    if (!closeLoop) result.push(nodes[nodes.length - 1]);

    return result;
}
