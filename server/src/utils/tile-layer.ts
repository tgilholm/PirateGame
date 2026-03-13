import fs from 'fs'


export function getTilesetFromLayer(mapData: any, layerName: string): Set<string> {
    // Find the layer in the map
    const layer = mapData.layers.find((l: any) => l.name === layerName);
    let tileset: Set<string> = new Set();

    if (!layer?.data) {
        console.warn(`[TerrainMap] No tilemap layer found with name: ${layerName}`);
    }

    // Read into a buffer
    let tileArray: Uint32Array | number[];
    if (typeof layer.data === 'string') {
        const buffer = Buffer.from(layer.data, 'base64');
        tileArray = new Uint32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
    } else {
        tileArray = layer.data;
    }

    // Create the tileset from the buffer
    tileArray.forEach((tileGid, index) => {
        if (tileGid !== 0) {
            const tileX = index % mapWidth;
            const tileY = Math.floor(index / mapWidth);
            tileset.add(`${tileX}, ${tileY}`);
        }
    });

    // Output the loaded tileset
    console.log(`[TerrainMap] Loaded ${tileset.size} tiles from layer: ${layerName}`);
    return tileset;
}