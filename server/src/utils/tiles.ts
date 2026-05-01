/**
 * Gets an array of x, y coordinates extracted from the map data.
 * @param mapData an object read in from the map .json
 * @param layerName the name of the layer to get, e.g. "islands"
 * @returns an array of x and y coordinates for the tiles in that layer
 */
export function getTilesetFromLayer(mapData: any, layerName: string): Array<{ x: number; y: number }> {
	// Get the requested layer
	const layer = mapData.layers.find((l: any) => l.name === layerName);
	const tileSize = mapData.tilewidth;
	let output: Array<{ x: number; y: number }> = [];

	// No layer found
	if (!layer?.data) {
		console.warn(`[Tiles] No tilemap layer found with name: ${layerName}`);
		return []; // break early
	}

	// Read into a buffer
	let tileArray: Uint32Array | number[];
	const buffer = Buffer.from(layer.data, 'base64');
	tileArray = new Uint32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);

	// Create the tileset from the buffer
	tileArray.forEach((tileGid, index) => {
		if (tileGid !== 0) {
			const tileX = index % mapData.width; // tile column
			const tileY = Math.floor(index / mapData.width); // tile row
			output.push({
				x: tileX * tileSize + tileSize / 2, // centre of tile in world space
				y: tileY * tileSize + tileSize / 2,
			});
		}
	});

	// Output the loaded tileset
	console.log(`[Tiles] Loaded ${output.length} tiles from layer: ${layerName}`);
	return output;
}

export function getObjectsFromLayer(
	mapData: any,
	objectLayerName: string
): Array<{ x: number; y: number; type: string }> {
	// all object layers are grouped under "spawns"
	const spawns = mapData.layers.find((l: any) => l.name === 'spawns'); // all spawn layers
	const objectLayer = spawns.find((ol: any) => ol.name === objectLayerName);

	// object layers are uncompressed
	return objectLayer.objects.map((object: any) => {
		return { x: object.x, y: object.y, type: object.type }; // type is present if a class is specified
	});
}
