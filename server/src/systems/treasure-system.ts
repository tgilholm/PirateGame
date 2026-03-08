import EntityRegistry from "../engine/entity-registry";
import TerrainMap from "../engine/terrain-map";
import EntityFactory from "../entities/entity-factory";
import Treasure from "../entities/treasure";
import Player from "../entities/player";
import Ship from "../entities/ship";
import { BaseSystem } from "./base-system";

type WorldPoint = { x: number; y: number };

export interface TreasureSystemOptions {
    spawnIntervalMs: number;
    maxTreasures: number;
    initialSpawnCount: number;
    pickupRadius: number;
    gridSize: number;
    minGold: number;
    maxGold: number;
    spawnPadding: number;
}

const DEFAULTS: TreasureSystemOptions = {
    spawnIntervalMs: 5000,
    maxTreasures: 500,
    initialSpawnCount: 500,
    pickupRadius: 40,
    gridSize: 128,
    minGold: 10,
    maxGold: 75,
    spawnPadding: 64,
};

export default class TreasureSystem implements BaseSystem {
    private readonly options: TreasureSystemOptions;
    private timeSinceSpawnMs = 0;
    private nextTreasureId = 1;

    constructor(
        private registry: EntityRegistry,
        private entityFactory: EntityFactory,
        private terrainMap: TerrainMap,
        options?: Partial<TreasureSystemOptions>,
    ) {
        this.options = { ...DEFAULTS, ...options };

        this.spawnInitialTreasures();
    }

    update(dt: number): void {
        this.timeSinceSpawnMs += dt * 1000;

        if (this.timeSinceSpawnMs >= this.options.spawnIntervalMs) {
            this.timeSinceSpawnMs = 0;
            this.trySpawnTreasure();
        }

        this.resolvePickups();
    }

    private spawnInitialTreasures(): void {
        let spawned = 0;
        const target = Math.min(this.options.initialSpawnCount, this.options.maxTreasures);

        for (let i = 0; i < target; i++) {
            const success = this.spawnOneTreasure();
            if (!success) {
                console.warn(
                    `[TreasureSystem] Only spawned ${spawned}/${target} initial treasures. No more valid spawn positions found.`
                );
                break;
            }
            spawned++;
        }

        console.log(`[TreasureSystem] Spawned ${spawned} initial treasures`);
    }

    private trySpawnTreasure(): void {
        const activeTreasures = this.registry.getByType<Treasure>("treasure");
        if (activeTreasures.length >= this.options.maxTreasures) return;

        this.spawnOneTreasure();
    }

    private spawnOneTreasure(): boolean {
        const point = this.findSpawnPoint();
        if (!point) return false;

        const goldValue = this.randomInt(this.options.minGold, this.options.maxGold);
        const id = `treasure_${this.nextTreasureId++}`;

        this.entityFactory.createTreasure(id, point.x, point.y, goldValue);
        return true;
    }

    private resolvePickups(): void {
        const treasures = this.registry.getByType<Treasure>("treasure");
        const players = this.registry.getByType<Player>("player");

        for (const treasure of treasures) {
            for (const player of players) {
                const playerPos = this.getWorldPosition(player);
                const dx = playerPos.x - treasure.x;
                const dy = playerPos.y - treasure.y;
                const distSq = dx * dx + dy * dy;

                if (distSq <= this.options.pickupRadius * this.options.pickupRadius) {
                    player.gold += treasure.goldValue;
                    player.markDirty();
                    this.registry.delete(treasure.id);
                    break;
                }
            }
        }
    }

    private findSpawnPoint(): WorldPoint | null {
        for (let attempt = 0; attempt < 100; attempt++) {
            const point = this.randomGridPoint();

            if (!this.isInsideBounds(point)) continue;
            if (!this.isValidTerrain(point)) continue;
            if (this.isInsideShip(point)) continue;
            if (this.isTooCloseToTreasure(point)) continue;

            return point;
        }

        return null;
    }

    private randomGridPoint(): WorldPoint {
        const { gridSize } = this.options;
        const cols = Math.floor(this.terrainMap.widthInPixels / gridSize);
        const rows = Math.floor(this.terrainMap.heightInPixels / gridSize);

        const cellX = this.randomInt(0, Math.max(0, cols - 1));
        const cellY = this.randomInt(0, Math.max(0, rows - 1));

        return {
            x: cellX * gridSize + gridSize / 2,
            y: cellY * gridSize + gridSize / 2,
        };
    }

    private isInsideBounds(point: WorldPoint): boolean {
        const { spawnPadding } = this.options;
        return (
            point.x >= spawnPadding &&
            point.y >= spawnPadding &&
            point.x <= this.terrainMap.widthInPixels - spawnPadding &&
            point.y <= this.terrainMap.heightInPixels - spawnPadding
        );
    }

    private isValidTerrain(point: WorldPoint): boolean {
        return this.terrainMap.isOnIsland(point.x, point.y);
    }

    private isInsideShip(point: WorldPoint): boolean {
        const ships = this.registry.getByType<Ship>("ship");
        for (const ship of ships) {
            const local = ship.worldToLocal(point.x, point.y);
            if (ship.isInside(local.x, local.y, 0)) {
                return true;
            }
        }
        return false;
    }

    private isTooCloseToTreasure(point: WorldPoint): boolean {
        const treasures = this.registry.getByType<Treasure>("treasure");
        const minDistance = this.options.gridSize * 0.75;

        for (const treasure of treasures) {
            const dx = point.x - treasure.x;
            const dy = point.y - treasure.y;
            if ((dx * dx + dy * dy) < minDistance * minDistance) {
                return true;
            }
        }

        return false;
    }

    private getWorldPosition(player: Player): WorldPoint {
        if (!player.parent) {
            return { x: player.x, y: player.y };
        }

        const ship = player.parent as Ship;
        return ship.localToWorld(player.x, player.y);
    }

    private randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}