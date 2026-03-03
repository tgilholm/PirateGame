import fs from 'fs';
import path from 'path';

export default class TerrainMap {
    private islandTiles: Set<string> = new Set();
    public readonly tileWidth: number;
    public readonly mapWidth: number;
    public readonly mapHeight: number;

    constructor(mapFileName: string) {
        const mapPath = path.join(__dirname, '..', mapFileName);
        const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
        this.tileWidth = mapData.tilewidth;
        this.mapHeight = mapData.height;
        this.mapWidth = mapData.width;

        const islands = mapData.layers.find((l: any) => l.name === 'islands');

        if (!islands?.data) {
            console.warn('[TerrainMap] No island layer found in tilemap');
            return;
        }

        let tileArray: Uint32Array | number[];
        if (typeof islands.data === 'string') {
            const buffer = Buffer.from(islands.data, 'base64');
            tileArray = new Uint32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
        } else {
            tileArray = islands.data;
        }

        tileArray.forEach((tileGid, index) => {
            if (tileGid !== 0) {
                const tileX = index % this.mapWidth;
                const tileY = Math.floor(index / this.mapWidth);
                this.islandTiles.add(`${tileX},${tileY}`);
            }
        });

        console.log(`[TerrainMap] Loaded ${this.islandTiles.size} island tiles`);
    }

    public isOnIsland(worldX: number, worldY: number): boolean {
        const tileX = Math.floor(worldX / this.tileWidth);
        const tileY = Math.floor(worldY / this.tileWidth);
        return this.islandTiles.has(`${tileX},${tileY}`);
    }

    public getIslandTiles(): { worldX: number, worldY: number }[] {
        return Array.from(this.islandTiles).map(key => {
            const [tileX, tileY] = key.split(',').map(Number);
            return {
                worldX: tileX * this.tileWidth + this.tileWidth / 2,
                worldY: tileY * this.tileWidth + this.tileWidth / 2
            };
        });
    }

    public get widthInPixels(): number {
        return this.mapWidth * this.tileWidth;
    }

    public get heightInPixels(): number {
        return this.mapHeight * this.tileWidth;
    }
}