import fs from 'fs';

export default class TerrainMap {
    private islandTiles: Set<string> = new Set();
    public readonly tileWidth: number;

    constructor(mapPath: string) {
        const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
        this.tileWidth = mapData.tilewidth;
        const mapWidth: number = mapData.width;
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
                const tileX = index % mapWidth;
                const tileY = Math.floor(index / mapWidth);
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
}