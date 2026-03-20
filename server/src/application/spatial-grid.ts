/**
 * Divides the game world up into a series of connected grids. Each grid has a list of entities
 * contained within it, and their movement between the grids is handled in update(). This allows
 * for sending only the information to players about entities close to their current position,
 * thereby reducing bandwith and improving performance on the client side.
 */
export default class SpatialGrid {
	private cells: Map<number, Set<string>> = new Map();
	private entityCell: Map<string, number> = new Map(); // converts an entity id to cell

	constructor(
		private cellSize: number,
		private viewDistance: number
	) {}

	/**
	 * Converts a cell's x and y coordinate into a key for use in the map
	 * @param x the x coord
	 * @param y the y coord
	 * @returns a 32 bit number containing the cell coordinates
	 */
	private cellKey(cx: number, cy: number): number {
		return ((cx & 0xffff) << 16) | (cy & 0xffff); // avoid garbage collection, use 16 bit numbers
	}

	/**
	 * Updates entities' positions in the grid. Handles entities moving from one grid
	 * to another.
	 * @param entityId the id of the entity to update
	 * @param x the x coordinate of the entity
	 * @param y the y coordinate of the entity
	 */
	public update(entityId: string, x: number, y: number): void {
		const newKey = this.cellKey(Math.floor(x / this.cellSize), Math.floor(y / this.cellSize));
		const oldKey = this.entityCell.get(entityId);
		// If the entity has not changed cells
		if (oldKey === newKey) return;

		// Otherwise remove from old cell and add to new one
		if (oldKey !== undefined) this.cells.get(oldKey)?.delete(entityId);

		// If the entity doesn't exist there
		if (!this.cells.has(newKey)) this.cells.set(newKey, new Set());
		this.cells.get(newKey)!.add(entityId);
		this.entityCell.set(entityId, newKey); // add to new cell
	}

	/**
	 * Removes an entity from the grid
	 * @param entityId the id of the entity
	 */
	public remove(entityId: string): void {
		const key = this.entityCell.get(entityId);
		if (key) {
			this.cells.get(key)?.delete(entityId);
			this.entityCell.delete(entityId);
		}
	}

	/**
	 * Gets the set of all entity ids where those entities are within
	 * the given viewDistance of the given object.
	 * @param x the x coordinate of the object
	 * @param y the y coordinate of the object
	 * @returns the set of entity ids within the view distance
	 */
	public getNearby(x: number, y: number): Set<string> {
		const result = new Set<string>();
		const range = Math.ceil(this.viewDistance / this.cellSize);
		const cx = Math.floor(x / this.cellSize);
		const cy = Math.floor(y / this.cellSize);

		// Iterate through x up to view distance
		for (let dx = -range; dx <= range; dx++) {
			for (let dy = -range; dy <= range; dy++) {
				// then y, up to the view distance
				const cell = this.cells.get(this.cellKey(cx + dx, cy + dy)); // add all cells within view distance
				if (cell) cell.forEach((id) => result.add(id)); // add the contents of those cells
			}
		}
		return result;
	}
}
