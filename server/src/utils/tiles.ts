// Phaser uses flags to denote flipped/rotated tiles. This helps get them all
const FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
const FLIPPED_VERTICALLY_FLAG = 0x40000000;
const FLIPPED_DIAGONALLY_FLAG = 0x20000000;
const ALL_FLIP_FLAGS = FLIPPED_HORIZONTALLY_FLAG | FLIPPED_VERTICALLY_FLAG | FLIPPED_DIAGONALLY_FLAG;

/**
 * Resolves the tileset and local tile ID for a given GID.
 */
function resolveTile(mapData: any, gid: number): { tileset: any; localId: number } | null {
	// Clear the flip/rotation flags to get the actual ID
	const cleanGid = gid & ~ALL_FLIP_FLAGS;
	if (cleanGid === 0) return null;

	const tileset = [...mapData.tilesets].reverse().find((ts: any) => cleanGid >= ts.firstgid);
	if (!tileset) return null;

	return { tileset, localId: cleanGid - tileset.firstgid };
}

/**
 * Looks up a custom boolean property on a tile by its local ID.
 */
function getTileProperty(tileset: any, localId: number, propertyName: string): boolean | undefined {
	const tileDef = tileset.tiles?.find((t: any) => t.id === localId);
	if (!tileDef?.properties) return undefined;

	const prop = tileDef.properties.find((p: any) => p.name === propertyName);
	return prop?.value;
}

function findLayerRecursive(layers: any[], name: string): any | null {
	for (const layer of layers) {
		if (layer.name === name) return layer;
		if (layer.layers) {
			const found = findLayerRecursive(layer.layers, name);
			if (found) return found;
		}
	}
	return null;
}

/**
 * Gets an array of x, y coordinates extracted from the map data.
 * @param mapData       an object read in from the map .json
 * @param layerName     the name of the layer to get, e.g. "islands"
 * @param propertyFilter  optional, only include tiles where this custom boolean property is true
 * @returns an array of x and y coordinates for the tiles in that layer
 */
export function getTilesetFromLayer(
	mapData: any,
	layerName: string,
	propertyFilter?: string
): Array<{ x: number; y: number }> {
	// Search recursively for the layer
	const layer = findLayerRecursive(mapData.layers, layerName);
	const tileSize = mapData.tilewidth;
	const output: Array<{ x: number; y: number }> = [];

	if (!layer || !layer.data) {
		console.warn(`[Tiles] No tilemap layer found with name: ${layerName}`);
		return [];
	}

	// Handle Tiled data
	let tileArray: Uint32Array | number[];
	if (typeof layer.data === 'string') {
		const buffer = Buffer.from(layer.data, 'base64');
		tileArray = new Uint32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
	} else {
		tileArray = layer.data;
	}

	tileArray.forEach((gid, index) => {
		if (gid === 0) return;

		// Mask flags to check properties
		if (propertyFilter !== undefined) {
			const resolved = resolveTile(mapData, gid);
			if (!resolved) return;

			const value = getTileProperty(resolved.tileset, resolved.localId, propertyFilter);
			if (!value) return;
		}

		const tileX = index % layer.width; // Use layer.width for safety in nested layers
		const tileY = Math.floor(index / layer.width);

		output.push({
			x: tileX * tileSize + tileSize / 2,
			y: tileY * tileSize + tileSize / 2,
		});
	});

	console.log(`[Tiles] Loaded ${output.length} tiles from layer: ${layerName}`);
	return output;
}

export function getObjectsFromLayer(
	mapData: any,
	objectLayerName: string
): Array<{ x: number; y: number; type: string; rotation: number }> {
	// all object layers are grouped under "spawns"
	const spawns = mapData.layers.find((l: any) => l.name === 'spawns'); // all spawn layers

	const objectLayer = spawns.layers.find((ol: any) => ol.name === objectLayerName);

	// object layers are uncompressed
	const output = objectLayer.objects.map((object: any) => {
		return { x: object.x, y: object.y, type: object.type, rotation: object.rotation }; // type is present if a class is specified
	});

	console.log(`[Tiles] Loaded ${output.length} tiles from layer: ${objectLayerName}`);
	return output;
}
