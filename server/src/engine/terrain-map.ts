import fs from 'fs';
import path from 'path';

/**
 * Breaks down a tilemap into its constituent layers, as well as providing helper methods
 * for the movement system (to account for movement speed) and the physics system to create
 * solid objects and provide a world border. If making changes to the tilemap, make sure
 * to account for any "new" tiles here.
 */
export default class TerrainMap {
    private islandTiles: Set<string> = new Set();
    private spawnTiles: Set<string> = new Set();
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

        // Find the solid island layer
        const islands = mapData.layers.find((l: any) => l.name === 'islands');
        const spawns = mapData.layers.find((l: any) => l.name === 'spawns');

        if (!islands?.data) {
            console.warn('[TerrainMap] No island layer found in tilemap');
            return;
        }

        if (!spawns?.data) {
            console.warn('[TerrainMap] No spawns layer found in tilemap');
        }

        // Read all the island tiles
        let tileArray: Uint32Array | number[];
        if (typeof islands.data === 'string') {
            const buffer = Buffer.from(islands.data, 'base64');
            tileArray = new Uint32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
        } else {
            tileArray = islands.data;
        }

        // For each tile in tile array, create an island tile with the width and height
        tileArray.forEach((tileGid, index) => {
            if (tileGid !== 0) {
                const tileX = index % this.mapWidth;
                const tileY = Math.floor(index / this.mapWidth);
                this.islandTiles.add(`${tileX},${tileY}`);
            }
        });

        console.log(`[TerrainMap] Loaded ${this.islandTiles.size} island tiles`);

        // Load all of the spawns
        let spawnArray: Uint32Array | number[];
        if (typeof spawns.data === 'string') {
            const buffer = Buffer.from(spawns.data, 'base64');
            spawnArray = new Uint32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
        } else {
            spawnArray = spawns.data;
        }

        spawnArray.forEach((tileGid, index) => {
            if (tileGid !== 0) {
                const tileX = index % this.mapWidth;
                const tileY = Math.floor(index / this.mapWidth);
                this.spawnTiles.add(`${tileX},${tileY}`);

            }
        });
    

        console.log(`[TerrainMap] Loaded ${this.spawnTiles.size} spawn tiles`);
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
        return this.islandTiles.has(`${tileX},${tileY}`);
    }

    /**
     * Converts the island tiles list to an array of worldX and worldY coords
     * @returns 
     */
    public getIslandTiles(): { worldX: number, worldY: number }[] {
        return Array.from(this.islandTiles).map(key => {
            const [tileX, tileY] = key.split(',').map(Number);
            return {
                worldX: tileX * this.tileWidth + this.tileWidth / 2,
                worldY: tileY * this.tileWidth + this.tileWidth / 2
            };
        });
    }

    /**
     * Converts the spawn tiles list to an array of worldX and worldY coords
     * @returns 
     */
    public getSpawnTiles(): { worldX: number, worldY: number}[] {
        return Array.from(this.spawnTiles).map(key => {
            const [tileX, tileY] = key.split(',').map(Number);
            return {
                worldX: tileX * this.tileWidth + this.tileWidth / 2,
                worldY: tileY * this.tileWidth + this.tileWidth / 2
            }
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