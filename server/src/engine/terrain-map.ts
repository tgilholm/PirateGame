import fs from 'fs';
import path from 'path';
import { buildPathSpline, createPlot } from './curve-calc'; // for catmull-rom


/**
 * Breaks down a tilemap into its constituent layers, as well as providing helper methods
 * for the movement system (to account for movement speed) and the physics system to create
 * solid objects and provide a world border. If making changes to the tilemap, make sure
 * to account for any "new" tiles here.
 */
export default class TerrainMap {
    private mapLayers: Map<string, Set<string>> = new Map();
    private pathNodes: Array<number> = [];
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
        this.mapLayers.set('islands', this.getTilesetFromLayer(mapData, 'islands') || new Set());
        this.mapLayers.set('npc-spawns', this.getTilesetFromLayer(mapData, 'npc-spawns') || new Set());
        this.mapLayers.set('player-spawns', this.getTilesetFromLayer(mapData, 'player-spawns') || new Set());
        this.mapLayers.set('npc-ship-path', this.getTilesetFromLayer(mapData, 'npc-ship-path') || new Set());

        this.getPathNodes();
    }

    sortByNearestNeighbour(nodes: { x: number; y: number }[]) {
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

    getPathNodes() {
        // Get from tilemap
        const tiles = this.getTileset('npc-ship-path');   // get in array form
        const nodes = tiles.map((tile) => ({ x: tile.worldX, y: tile.worldY }));

        // First find the centre of all the nodes
        const sorted = this.sortByNearestNeighbour(nodes);
        const splinePath = buildPathSpline(sorted, 0.5, 25, true);

        const bX = nodes.map((n) => n.x);
        const bY = nodes.map((n) => n.y);

        const aX = splinePath.map((n) => n.x);
        const aY = splinePath.map((n) => n.y);

        // Before applying spline algorithm
        createPlot({
            x: bX,
            y: bY,
            title: 'Before',
            output: 'before.png'
        });

        // After
        createPlot({
            x: aX,
            y: aY,
            title: 'After',
            output: 'after.png'
        });
    }


    private getTilesetFromLayer(mapData: any, layerName: string): Set<string> {
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
                const tileX = index % this.mapWidth;
                const tileY = Math.floor(index / this.mapWidth);
                tileset.add(`${tileX}, ${tileY}`);
            }
        });

        // Output the loaded tileset
        console.log(`[TerrainMap] Loaded ${tileset.size} tiles from layer: ${layerName}`);
        return tileset;
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

        return islandTiles.has(`${tileX},${tileY}`);
    }




    public getTileset(layerName: string) {
        const layer = this.mapLayers.get(layerName);

        if (!layer) {
            console.warn(`[TerrainMap] '${layerName}' is not a recognised layer in the tilemap!`);
            return [];
        }

        return Array.from(layer).map(key => {
            const [tileX, tileY] = key.split(',').map(Number);
            return {
                worldX: tileX * this.tileWidth + this.tileWidth / 2,
                worldY: tileY * this.tileWidth + this.tileWidth / 2
            };
        });
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