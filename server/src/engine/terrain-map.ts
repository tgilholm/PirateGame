import fs from 'fs';
import path from 'path';
import { getTilesetFromLayer, getObjectsFromLayer } from '../utils/tiles';
import { buildPathSpline } from '../utils/splines';

/**
 * Breaks down a tilemap into its constituent layers, as well as providing helper methods
 * for the movement system (to account for movement speed) and the physics system to create
 * solid objects and provide a world border. If making changes to the tilemap, make sure
 * to account for any "new" tiles here.
 */
export default class TerrainMap {
	private mapLayers: Map<string, Array<{ x: number; y: number }>> = new Map();
	private objectLayers: Map<string, Array<{ x: number; y: number; type: string }>> = new Map();

	public npcPaths: Map<string, Array<{ x: number; y: number }>> = new Map();
	public readonly tileWidth: number;
	public readonly tileHeight: number;
	public readonly mapWidth: number;
	public readonly mapHeight: number;

	/**
	 * Reads in the tilemap file, breaks it down into its constituent layers, and fills out
	 * the islandTiles array with the "solid" island tiles.
	 * @param mapFileName the name of the tilemap file to read in
	 * @returns
	 */
	constructor(mapFileName: string) {
		const devPath = path.resolve(process.cwd(), 'shared', mapFileName);
		const prodPath = path.join(__dirname, '..', mapFileName);
		const final = fs.existsSync(devPath) ? devPath : prodPath;

		if (!fs.existsSync(final)) {
			throw new Error(`[TerrainMap] Map file not found at ${devPath} or ${prodPath}`);
		}

		const mapData = JSON.parse(fs.readFileSync(final, 'utf-8'));
		this.tileWidth = mapData.tilewidth;
		this.tileHeight = mapData.tileheight ?? mapData.tileHeight;
		this.mapHeight = mapData.height;
		this.mapWidth = mapData.width;

		// Add all the layers you need here
		this.mapLayers.set('islands', getTilesetFromLayer(mapData, 'islands') || new Set());
		this.mapLayers.set('npc-spawns', getTilesetFromLayer(mapData, 'npc-spawns') || new Set());
		this.mapLayers.set('player-spawns', getTilesetFromLayer(mapData, 'player-spawns') || new Set());
		this.mapLayers.set('treasure-spawns', getTilesetFromLayer(mapData, 'treasure-spawns') || new Set());
		this.mapLayers.set('npc-ship-path', getTilesetFromLayer(mapData, 'npc-ship-path') || new Set());
		this.mapLayers.set('shop-spawns', getTilesetFromLayer(mapData, 'shop-spawns') || new Set());
		this.mapLayers.set('palm-trees', getTilesetFromLayer(mapData, 'palm-trees') || new Set());

		this.objectLayers.set('npc-spawns', getObjectsFromLayer(mapData, 'npc-spawns'));
		this.objectLayers.set('player-spawns', getObjectsFromLayer(mapData, 'player-spawns'));
		this.objectLayers.set('treasure-spawns', getObjectsFromLayer(mapData, 'treasure-spawns') || new Set());
		this.objectLayers.set('path-nodes', getObjectsFromLayer(mapData, 'path-nodes') || new Set());
		this.objectLayers.set('shop-spawns', getObjectsFromLayer(mapData, 'shop-spawns') || new Set());

		// Create the patrol paths for NPC ships
		// Separates the data out into the path nodes for each ship
		// Then adds this array to the map with the key of that ship
		const nodes = this.objectLayers.get('path-nodes');
		if (nodes) this.npcPaths = this.getPaths(nodes);

		let total = 0;
		this.npcPaths.forEach((value, key) => {
			const splinedPath = buildPathSpline(value, 0.5, 25, true);

			this.npcPaths.set(key, splinedPath);
			total += splinedPath.length;
		});

		console.log(`[TerrainMap] Loaded ${this.npcPaths.size} ship paths. Total nodes: ${total}`);
	}

	/**
	 * Helper method for determining if a given object is on a "solid" island tile or not
	 * @param worldX the absolute x coordinate of that object
	 * @param worldY the absolute y coordinate of that object
	 * @returns true if on an island, false otherwise
	 */
	public isOnIsland(worldX: number, worldY: number): boolean {
		const islandTiles = this.mapLayers.get('islands');
		if (!islandTiles) {
			console.warn(`[TerrainMap] isOnIsland check failed`);
			return false;
		}

		// Tiles are stored as world-space centres, so round to nearest tile centre
		const tileX = Math.floor(worldX / this.tileWidth) * this.tileWidth + this.tileWidth / 2;
		const tileY = Math.floor(worldY / this.tileHeight) * this.tileHeight + this.tileHeight / 2;

		return islandTiles.some((tile) => tile.x === tileX && tile.y === tileY);
	}

	/**
	 * Takes an array of path nodes with ship identifiers, and returns a map grouping nodes
	 * to ships.
	 * @param nodes an array of objects with x, y and a type e.g. 'ship1', 'ship2'
	 * @returns a map of the aforementioned type to their x, y coordinates.
	 */
	private getPaths(nodes: { x: number; y: number; type: string }[]): Map<string, Array<{ x: number; y: number }>> {
		let npcPaths = new Map();
		nodes?.forEach((node) => {
			// add if not already
			if (!npcPaths.has(node.type)) {
				npcPaths.set(node.type, [{ x: node.x, y: node.y }]);
			} else {
				npcPaths.get(node.type)?.push({ x: node.x, y: node.y });
			}
		});

		return npcPaths;
	}

	/**
	 * Gets the array of x and y coordinates for the corresponding layer in the map
	 * @param layerName the name of the layer for which to find coordinates
	 * @returns an array of x and y coordinates, or an empty array if not found
	 */
	public getTileset(layerName: string): Array<{ x: number; y: number }> {
		const layer = this.mapLayers.get(layerName);

		if (!layer) {
			console.warn(`[TerrainMap] '${layerName}' is not a recognised layer in the tilemap!`);
			return [];
		}

		return layer;
	}

	public getObjectLayer(objectLayerName: string): Array<{ x: number; y: number; type: string }> {
		const layer = this.objectLayers.get(objectLayerName);

		if (!layer) {
			console.warn(`[TerrainMap] '${objectLayerName}' is not a recognised object layer!`);

			return [];
		}

		return layer;
	}

	/**
	 * Get method returning the width in pixels of the map
	 */
	public get widthInPixels(): number {
		return this.mapWidth * this.tileWidth;
	}

	/**
	 * Get method returning the height in pixels of the map
	 */
	public get heightInPixels(): number {
		return this.mapHeight * this.tileWidth;
	}
}
