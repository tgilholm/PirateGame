import fs from 'fs';
import path from 'path';
import { getTilesetFromLayer } from '../utils/tiles';
import { buildPathSpline } from 'src/utils/splines';

/**
 * Breaks down a tilemap into its constituent layers, as well as providing helper methods
 * for the movement system (to account for movement speed) and the physics system to create
 * solid objects and provide a world border. If making changes to the tilemap, make sure
 * to account for any "new" tiles here.
 */
export default class TerrainMap {
    private mapLayers: Map<string, Array<{ x: number, y: number }>> = new Map();
    public npcPath: Array<{x: number, y: number}> = [];
    public readonly tileWidth: number;
    public readonly mapWidth: number;
    public readonly mapHeight: number;

    /**
     * Reads in the tilemap file, breaks it down into its constituent layers, and fills out
     * the islandTiles array with the "solid" island tiles.
     * @param mapFileName the name of the tilemap file to read in
     * @returns 
     */
    constructor(mapFileName: string) {
        const mapPath = path.join(__dirname, '..', mapFileName);
        const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
        this.tileWidth = mapData.tilewidth;
        this.mapHeight = mapData.height;
        this.mapWidth = mapData.width;


        // Add all the layers you need here
        this.mapLayers.set('islands', getTilesetFromLayer(mapData, 'islands') || new Set());
        this.mapLayers.set('npc-spawns', getTilesetFromLayer(mapData, 'npc-spawns') || new Set());
        this.mapLayers.set('player-spawns', getTilesetFromLayer(mapData, 'player-spawns') || new Set());
        this.mapLayers.set('npc-ship-path', getTilesetFromLayer(mapData, 'npc-ship-path') || new Set());
    }

    /**
     * Helper method for determining if a given object is on a "solid" island tile or not
     * @param worldX the absolute x coordinate of that object
     * @param worldY the absolute y coordinate of that object
     * @returns true if on an island, false otherwise
     */
    public isOnIsland(worldX: number, worldY: number): boolean {
        const tileX = Math.floor(worldX / this.tileWidth);
        const tileY = Math.floor(worldY / this.tileWidth);

        const islandTiles = this.mapLayers.get('islands');
        if (!islandTiles) {
            console.warn(`[TerrainMap] isOnIsland check failed`);
            return false;
        }

        return islandTiles.includes({ x: tileX, y: tileY });
    }

    getNPCPathNodes()
    {
        const nodes = this.getTileset('npc-ship-path');
        this.npcPath = buildPathSpline(nodes, 0.5, 25, true);
    }


    /**
     * Gets the array of x and y coordinates for the corresponding layer in the map
     * @param layerName the name of the layer for which to find coordinates
     * @returns an array of x and y coordinates, or an empty array if not found
     */
    public getTileset(layerName: string): Array<{x: number, y: number}> {
        const layer = this.mapLayers.get(layerName);

        if (!layer) {
            console.warn(`[TerrainMap] '${layerName}' is not a recognised layer in the tilemap!`);
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