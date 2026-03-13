import { WorldMap } from "../types";

/**
 * Gets an array of x, y coordinates extracted from the map data.
 * @param mapData an object read in from the map .json
 * @param layerName the name of the layer to get, e.g. "islands"
 * @returns an array of x and y coordinates for the tiles in that layer
 */
export function getTilesetFromLayer(mapData: WorldMap, layerName: string): Array<{ x: number, y: number }> {
    // Get the requested layer
    const layer = mapData.layers.find((l: any) => l.name === layerName);
    const tileSize = mapData.tilewidth;
    let output: Array<{ x: number, y: number }> = [];

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
            const tileX = index % mapData.width;                  // tile column
            const tileY = Math.floor(index / mapData.width);      // tile row
            output.push({
                x: tileX * tileSize + tileSize / 2,   // centre of tile in world space
                y: tileY * tileSize + tileSize / 2
            });
        }
    });

    // Output the loaded tileset
    console.log(`[Tiles] Loaded ${output.length} tiles from layer: ${layerName}`);
    return output;
}