import EntityRegistry from "../engine/entity-registry";
import TerrainMap from "../engine/terrain-map";
import EntityFactory from "../entities/entity-factory";
import Treasure from "../entities/treasure";
import Player from "../entities/player";
import Ship from "../entities/ship";
import { BaseSystem } from "./base-system";

type WorldPoint = { x: number; y: number };

type DigUiPayload = {
    treasureId: string;
    digSpeed: number;
    successZoneStart: number;
    successZoneSize: number;
    durationMs: number;
};

type DigSession = {
    playerId: string;
    treasureId: string;
    startedAt: number;
    durationMs: number;
};

export interface TreasureSystemOptions {
    spawnIntervalMs: number;
    maxTreasures: number;
    initialSpawnCount: number;
    pickupRadius: number;
    digRadius: number;
    depositRadius: number;
    gridSize: number;
    minGold: number;
    maxGold: number;
    spawnPadding: number;
}

const DEFAULTS: TreasureSystemOptions = {
    spawnIntervalMs: 1000,
    maxTreasures: 50,
    initialSpawnCount: 50,
    pickupRadius: 40,
    digRadius: 55,
    depositRadius: 90,
    gridSize: 128,
    minGold: 10,
    maxGold: 75,
    spawnPadding: 64,
};

export default class TreasureSystem implements BaseSystem {
    private readonly options: TreasureSystemOptions;
    private timeSinceSpawnMs = 0;
    private nextTreasureId = 1;
    private activeDigSessions = new Map<string, DigSession>();
    private onDigMinigameStart?: (playerId: string, payload: DigUiPayload) => void;
    private onDigMinigameResult?: (playerId: string, payload: { success: boolean }) => void;

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

        this.updateCarriedTreasures();
        this.resolvePickups();
        this.resolveDeposits();
    }

    public bindUiEvents(
        onStart: (playerId: string, payload: DigUiPayload) => void,
        onResult: (playerId: string, payload: { success: boolean }) => void
    ) {
        this.onDigMinigameStart = onStart;
        this.onDigMinigameResult = onResult;
    }

    public beginDig(player: Player): boolean {
        if (player.isCarrying) return false;
        if (this.activeDigSessions.has(player.id)) return false;

        const playerPos = this.getWorldPosition(player);
        const treasures = this.registry.getByType<Treasure>("treasure");

        let nearest: Treasure | null = null;
        let nearestDistSq = this.options.digRadius * this.options.digRadius;

        for (const treasure of treasures) {
            if (treasure.state !== "buried") continue;

            const dx = playerPos.x - treasure.x;
            const dy = playerPos.y - treasure.y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= nearestDistSq) {
                nearest = treasure;
                nearestDistSq = distSq;
            }
        }

        if (!nearest) return false;

        const durationMs = 2500;

        this.activeDigSessions.set(player.id, {
            playerId: player.id,
            treasureId: nearest.id,
            startedAt: Date.now(),
            durationMs
        });

        const minGold = this.options.minGold;
        const maxGold = this.options.maxGold;
        const normalized = (nearest.goldValue - minGold) / Math.max(1, maxGold - minGold);

        const digSpeed = 0.8 + normalized * 2.0;
        const successZoneSize = 0.24 - normalized * 0.10;
        const successZoneStart = Math.random() * (1 - successZoneSize);

        this.onDigMinigameStart?.(player.id, {
            treasureId: nearest.id,
            digSpeed,
            successZoneStart,
            successZoneSize,
            durationMs
        });

        // stash on entity for validation
        (nearest as any).digSpeed = digSpeed;
        (nearest as any).successZoneStart = successZoneStart;
        (nearest as any).successZoneSize = successZoneSize;

        nearest.markDirty();
        return true;
    }

    public submitDigHit(player: Player, sliderPosition: number): boolean {
        const session = this.activeDigSessions.get(player.id);
        if (!session) return false;

        this.activeDigSessions.delete(player.id);

        const treasure = this.registry.get<Treasure>(session.treasureId);
        if (!treasure || treasure.state !== "buried") {
            this.onDigMinigameResult?.(player.id, { success: false });
            return false;
        }

        const playerPos = this.getWorldPosition(player);
        const dx = playerPos.x - treasure.x;
        const dy = playerPos.y - treasure.y;
        const distSq = dx * dx + dy * dy;

        if (distSq > this.options.digRadius * this.options.digRadius) {
            this.onDigMinigameResult?.(player.id, { success: false });
            return false;
        }

        const zoneStart = (treasure as any).successZoneStart ?? 0.4;
        const zoneSize = (treasure as any).successZoneSize ?? 0.2;
        const zoneEnd = zoneStart + zoneSize;

        const success = sliderPosition >= zoneStart && sliderPosition <= zoneEnd;

        if (success) {
            treasure.state = "dugup";
            treasure.digProgress = 3;
            treasure.markDirty();
        }

        this.onDigMinigameResult?.(player.id, { success });
        return success;
    }

    private spawnInitialTreasures(): void {
        const target = this.options.initialSpawnCount || 100;
        let spawned = 0;

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

        const normalized = (goldValue - this.options.minGold) / Math.max(1, (this.options.maxGold - this.options.minGold));

        const digSpeed = 0.8 + normalized * 2.2;        // higher gold = faster
        const successZoneSize = 0.22 - normalized * 0.10; // higher gold = smaller zone
        const successZoneStart = Math.random() * (1 - successZoneSize);

        this.entityFactory.createTreasure(
            id,
            point.x,
            point.y,
            goldValue,
            "buried",
            0,
            null,
            digSpeed,
            successZoneStart,
            successZoneSize
        );
        type DigSession = {
            playerId: string;
            treasureId: string;
            startedAt: number;
            durationMs: number;
        };

        return true;
    }

    private resolvePickups(): void {
        const treasures = this.registry.getByType<Treasure>("treasure");
        const players = this.registry.getByType<Player>("player");

        for (const treasure of treasures) {
            if (treasure.state !== "dugup") continue;

            for (const player of players) {
                if (player.isCarrying) continue;

                const playerPos = this.getWorldPosition(player);
                const dx = playerPos.x - treasure.x;
                const dy = playerPos.y - treasure.y;
                const distSq = dx * dx + dy * dy;

                if (distSq <= this.options.pickupRadius * this.options.pickupRadius) {
                    treasure.state = "carried";
                    treasure.carrierId = player.id;
                    treasure.markDirty();

                    player.isCarrying = true;
                    player.carryingTreasureId = treasure.id;
                    player.markDirty();
                    break;
                }
            }
        }
    }

    private updateCarriedTreasures(): void {
        const treasures = this.registry.getByType<Treasure>("treasure");

        for (const treasure of treasures) {
            if (treasure.state !== "carried" || !treasure.carrierId) continue;

            const player = this.registry.get<Player>(treasure.carrierId);
            if (!player) {
                treasure.state = "dugup";
                treasure.carrierId = null;
                treasure.markDirty();
                continue;
            }

            const pos = this.getWorldPosition(player);
            treasure.x = pos.x;
            treasure.y = pos.y - 28;
            treasure.markDirty();
        }
    }

    private resolveDeposits(): void {
        const players = this.registry.getByType<Player>("player");

        for (const player of players) {
            if (!player.isCarrying || !player.carryingTreasureId) continue;
            if (!(player.parent instanceof Ship)) continue;

            const treasure = this.registry.get<Treasure>(player.carryingTreasureId);
            if (!treasure) {
                player.isCarrying = false;
                player.carryingTreasureId = null;
                player.markDirty();
                continue;
            }

            player.gold += treasure.goldValue;
            player.isCarrying = false;
            player.carryingTreasureId = null;
            player.markDirty();

            this.registry.delete(treasure.id);
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
        const minDistance = this.options.gridSize * 0.25;

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