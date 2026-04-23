/**
 * Rotates a given point about a given centre by a given angle. Note that this is a pure function and
 * does not modify the original coordinates
 * @param point the x and y coordinates of the object
 * @param centre the x and y coordinates of the centre of rotation
 * @param angle the angle by which to rotate the point
 * @returns the new coordinates of the objects
 */
function rotate(
	point: { x: number; y: number },
	centre: { x: number; y: number },
	angle: number
): { x: number; y: number } {
	const cos = Math.cos(-angle),
		sin = Math.sin(-angle);
	const dx = point.x - centre.x;
	const dy = point.y - centre.y;

	return {
		x: centre.x + cos * dx - sin * dy,
		y: centre.y + sin * dx + cos * dy,
	};
}

/**
 * Determines the point of intersection between a line and a rectangle,
 * using the Liang-Barsky algorithm.
 * @param p0 Start point of the line, in vector form
 * @param p1 End point of the line, in vector form
 * @param rect The coordinates of each corner of the rectangle. minX, minY is the top left-hand corner of the rectangle, maxX, maxY is the bottom-right.
 */
export function lineIntersectsRect(
	p0: { x: number; y: number },
	p1: { x: number; y: number },
	rect: { minX: number; minY: number; maxX: number; maxY: number }
): { x: number; y: number } | null {
	// dist
	const dx = p1.x - p0.x;
	const dy = p1.y - p0.y;

	// t is the percentage value along the line segment
	// t = 0 is p0, t = 1 is p1
	let minT = 0,
		maxT = 1;

	// check each side of the rectangle
	const checks = [
		[-dx, p0.x - rect.minX],
		[dx, rect.maxX - p0.x],
		[-dy, p0.y - rect.minY],
		[dy, rect.maxY - p0.y],
	];

	for (const [p, q] of checks) {
		if (p === 0) {
			if (q < 0) return null; // no intersect
			continue; // next check
		}
		const t = q / p; // percentage along line
		if (p < 0) minT = Math.max(minT, t);
		else maxT = Math.min(maxT, t);
		if (minT > maxT) return null; // no intersect
	}

	// returns the point where the line intersects
	return {
		x: p0.x + minT * dx,
		y: p0.y + minT * dy,
	};
}

/**
 * Determines the point of intersection between a line defined in
 * parametric notation (p0, p1) and a rectangle with a given centre
 * and rotation
 * @param p0
 * @param p1
 * @param rect
 * @returns
 */
export function lineIntersectsRotatedRect(
	p0: { x: number; y: number },
	p1: { x: number; y: number },
	rect: {
		minX: number;
		minY: number;
		maxX: number;
		maxY: number;
		angle: number;
	}
): { x: number; y: number } | null {
	const dx = rect.maxX - rect.minX;
	const dy = rect.maxY - rect.minY;

	const centre = {
		x: rect.minX + dx / 2,
		y: rect.minY + dy / 2,
	};

	// rotate to rectangle coordinate space first, then
	// carry out the check
	const localP0 = rotate(p0, centre, rect.angle);
	const localP1 = rotate(p1, centre, rect.angle);

	return lineIntersectsRect(localP0, localP1, rect);
}
