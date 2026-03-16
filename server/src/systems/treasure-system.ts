import EntityRegistry from "../engine/entity-registry";
import TerrainMap from "../engine/terrain-map";
import EntityFactory from "../entities/entity-factory";
import Treasure from "../entities/treasure";
import Player from "../entities/player";
import Ship from "../entities/ship";
import { BaseSystem } from "./base-system";
import { EntityConfig } from "../types";

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

type HoleSpawnBlock = {
    x: number;
    y: number;
    expiresAt: number;
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
    holeRespawnBlockMs: number;
    holeRespawnBlockRadius: number;
}

const DEFAULTS: TreasureSystemOptions = {
    spawnIntervalMs: 1000,
    maxTreasures: 50,
    initialSpawnCount: 50,
    pickupRadius: 55,
    digRadius: 55,
    depositRadius: 90,
    gridSize: 128,
    minGold: 10,
    maxGold: 75,
    spawnPadding: 64,
    holeRespawnBlockMs: 2 * 60 * 1000,
    holeRespawnBlockRadius: 64,
};

export default class TreasureSystem implements BaseSystem {
    private readonly options: TreasureSystemOptions;
    private timeSinceSpawnMs = 0;
    private nextTreasureId = 1;
    private activeDigSessions = new Map<string, DigSession>();
    private recentHoleBlocks: HoleSpawnBlock[] = [];

    private onDigMinigameStart?: (
        playerId: string,
        payload: DigUiPayload
    ) => void;

    private onDigMinigameResult?: (
        playerId: string,
        payload: { success: boolean }
    ) => void;

    constructor(
        private registry: EntityRegistry,
        private entityFactory: EntityFactory,
        private terrainMap: TerrainMap,
        private entityConfig: EntityConfig,
        options?: Partial<TreasureSystemOptions>
    ) {
        this.options = { ...DEFAULTS, ...options };
        this.spawnInitialTreasures();
    }

    update(dt: number): void {
        this.timeSinceSpawnMs += dt * 1000;

        this.pruneExpiredHoleBlocks();
        this.pruneExpiredDigSessions();

        if (this.timeSinceSpawnMs >= this.options.spawnIntervalMs) {
            this.timeSinceSpawnMs = 0;
            this.trySpawnTreasure();
        }

        this.resolveOpeningTreasures();
        this.updateCarriedTreasures();
        this.resolveDeposits();
        this.resolveExpiredHoles();
    }

    public bindUiEvents(
        onStart: (playerId: string, payload: DigUiPayload) => void,
        onResult: (playerId: string, payload: { success: boolean }) => void
    ) {
        this.onDigMinigameStart = onStart;
        this.onDigMinigameResult = onResult;
    }

    /**
     * One-button interaction:
     * - carrying chest => drop it
     * - near dug-up chest => pick it up
     * - otherwise => try to dig buried treasure
     */
    public interact(player: Player): boolean {
        if (player.isCarrying) {
            return this.dropTreasure(player);
        }

        if (this.tryPickupTreasure(player)) {
            return true;
        }

        return this.beginDig(player);
    }

    public beginDig(player: Player): boolean {
        if (player.isCarrying) return false;
        if (this.activeDigSessions.has(player.id)) return false;

        const playerPos = this.getWorldPosition(player);
        const treasures = this.registry.getByType("treasure") as Treasure[];

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
            durationMs,
        });

        const normalized =
            (nearest.goldValue - this.options.minGold) /
            Math.max(1, this.options.maxGold - this.options.minGold);

        const digSpeed = 0.9 + normalized * 2.2;
        const successZoneSize = 0.24 - normalized * 0.1;
        const successZoneStart = Math.random() * (1 - successZoneSize);

        this.onDigMinigameStart?.(player.id, {
            treasureId: nearest.id,
            digSpeed,
            successZoneStart,
            successZoneSize,
            durationMs,
        });

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

        const treasure = this.registry.get(session.treasureId) as Treasure | null;
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

        const success =
            sliderPosition >= zoneStart && sliderPosition <= zoneEnd;

        if (success) {
            treasure.state = "opening";
            treasure.openedAt = Date.now();
            treasure.carriedByPendingPlayerId = player.id;
            treasure.markDirty();

            this.onDigMinigameResult?.(player.id, { success: true });
            return true;
        }

        this.onDigMinigameResult?.(player.id, { success: false });
        return false;
    }

    public tryPickupTreasure(player: Player): boolean {
        if (player.isCarrying) return false;

        const playerPos = this.getWorldPosition(player);
        const treasures = this.registry.getByType("treasure") as Treasure[];

        let nearest: Treasure | null = null;
        let nearestDistSq = this.options.pickupRadius * this.options.pickupRadius;

        for (const treasure of treasures) {
            if (treasure.state !== "dugup" && treasure.state !== "loose") continue;

            const dx = playerPos.x - treasure.x;
            const dy = playerPos.y - treasure.y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= nearestDistSq) {
                nearest = treasure;
                nearestDistSq = distSq;
            }
        }

        if (!nearest) return false;

        if (nearest.state === "dugup") {
            const holeId = `treasure_hole_${this.nextTreasureId++}`;
            this.entityFactory.createTreasure(
                holeId,
                nearest.x,
                nearest.y,
                0,
                "hole",
                0,
                null,
                0,
                0,
                0
            );
            const hole = this.registry.get(holeId) as Treasure | null;
            if (hole) {
                hole.holeExpiresAt = Date.now() + 5 * 60 * 1000;
                hole.markDirty();
            }
        }
        nearest.state = "carried";
        nearest.carrierId = player.id;
        nearest.carriedByPendingPlayerId = null;
        nearest.openedAt = null;
        nearest.markDirty();
        player.isCarrying = true;
        player.carryingTreasureId = nearest.id;
        player.markDirty();
        return true;
    }

    public dropTreasure(player: Player): boolean {
        if (!player.isCarrying || !player.carryingTreasureId) return false;

        const treasure = this.registry.get(player.carryingTreasureId) as Treasure | null;
        if (!treasure) {
            player.isCarrying = false;
            player.carryingTreasureId = null;
            player.markDirty();
            return false;
        }

        const pos = this.getWorldPosition(player);
        const angle = typeof player.aimAngle === "number" ? player.aimAngle : 0;
        const dropDistance = 24;

        treasure.state = "loose";
        treasure.carrierId = null;
        treasure.carriedByPendingPlayerId = null;
        treasure.openedAt = null;
        treasure.x = pos.x + Math.cos(angle) * dropDistance;
        treasure.y = pos.y + Math.sin(angle) * dropDistance;
        treasure.markDirty();

        player.isCarrying = false;
        player.carryingTreasureId = null;
        player.markDirty();

        return true;
    }

    public dropTreasureOnDeath(player: Player): boolean {
        return this.dropTreasure(player);
    }

    private spawnInitialTreasures(): void {
        const target = this.options.initialSpawnCount || 100;
        let spawned = 0;

        for (let i = 0; i < target; i++) {
            const success = this.spawnOneTreasure();
            if (!success) {
                console.warn(
                    `[TreasureSystem] Only spawned ${spawned}/${target} initial treasures.\nNo more valid spawn positions found.`
                );
                break;
            }
            spawned++;
        }

        console.log(`[TreasureSystem] Spawned ${spawned} initial treasures`);
    }

    private trySpawnTreasure(): void {
        const activeTreasures = this.registry.getByType("treasure");
        if (activeTreasures.length >= this.options.maxTreasures) return;

        this.spawnOneTreasure();
    }

    private pruneExpiredDigSessions(): void {
        const now = Date.now();

        for (const [playerId, session] of this.activeDigSessions) {
            if (now - session.startedAt >= session.durationMs) {
                this.activeDigSessions.delete(playerId);
                this.onDigMinigameResult?.(playerId, { success: false });
            }
        }
    }

    private spawnOneTreasure(): boolean {
        const point = this.findSpawnPoint();
        if (!point) return false;

        const goldValue = this.randomInt(this.options.minGold, this.options.maxGold);
        const id = `treasure_${this.nextTreasureId++}`;

        const normalized =
            (goldValue - this.options.minGold) /
            Math.max(1, this.options.maxGold - this.options.minGold);

        const digSpeed = 0.8 + normalized * 2.2;
        const successZoneSize = 0.22 - normalized * 0.1;
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

        return true;
    }

    private resolveOpeningTreasures(): void {
        const treasures = this.registry.getByType("treasure") as Treasure[];

        for (const treasure of treasures) {
            if (treasure.state !== "opening") continue;
            if (!treasure.openedAt) continue;
            if (Date.now() - treasure.openedAt < 1200) continue;

            treasure.state = "dugup";
            treasure.openedAt = null;
            treasure.carrierId = null;
            treasure.carriedByPendingPlayerId = null;
            treasure.markDirty();

            // Shove any player standing on the hole outward, same as ship spawning does
            const players = this.registry.getByType("player") as Player[];
            const shoveRadius = 35;

            for (const player of players) {
                const pos = this.getWorldPosition(player);
                const dx = pos.x - treasure.x;
                const dy = pos.y - treasure.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < shoveRadius * shoveRadius) {
                    const dist = Math.sqrt(distSq) || 1;
                    const pushOut = shoveRadius - dist + 1;
                    player.x += (dx / dist) * pushOut;
                    player.y += (dy / dist) * pushOut;
                    player.markDirty();
                }
            }
        }
    }

    private updateCarriedTreasures(): void {
        const treasures = this.registry.getByType("treasure") as Treasure[];

        for (const treasure of treasures) {
            if (treasure.state !== "carried" || !treasure.carrierId) continue;

            const player = this.registry.get(treasure.carrierId) as Player | null;
            if (!player) {
                treasure.state = "loose";
                treasure.carrierId = null;
                treasure.markDirty();
                continue;
            }

        }
    }

    private resolveDeposits(): void {
        const players = this.registry.getByType("player") as Player[];

        for (const player of players) {
            if (!player.isCarrying || !player.carryingTreasureId) continue;
            if (!(player.parent instanceof Ship)) continue;

            const treasure = this.registry.get(player.carryingTreasureId) as Treasure | null;

            if (!treasure) {
                player.isCarrying = false;
                player.carryingTreasureId = null;
                player.markDirty();
                continue;
            }

            if (treasure.state !== "carried") {
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
        const spawnTiles = this.terrainMap.getTileset('treasure-spawns');

        if (spawnTiles.length === 0) {
            console.warn('[TreasureSystem] No treasure-spawns tiles found in tilemap!');
            return null;
        }

        // Shuffle attempts to avoid always picking the same tiles
        const shuffled = [...spawnTiles].sort(() => Math.random() - 0.5);

        for (const tile of shuffled) {
            const point: WorldPoint = { x: tile.worldX, y: tile.worldY };

            if (this.isInsideShip(point)) continue;
            if (this.isTooCloseToTreasure(point)) continue;
            if (this.isBlockedByRecentHole(point)) continue;

            return point;
        }

        return null;
    }

    private isInsideShip(point: WorldPoint): boolean {
        const ships = this.registry.getByType("ship") as Ship[];

        for (const ship of ships) {
            const local = ship.worldToLocal(point.x, point.y);
            if (ship.isInside(local.x, local.y, 0)) {
                return true;
            }
        }

        return false;
    }

    private isTooCloseToTreasure(point: WorldPoint): boolean {
        const treasures = this.registry.getByType("treasure") as Treasure[];
        const minDistance = this.options.gridSize * 0.25;

        for (const treasure of treasures) {
            const dx = point.x - treasure.x;
            const dy = point.y - treasure.y;

            if (dx * dx + dy * dy < minDistance * minDistance) {
                return true;
            }
        }

        return false;
    }

    private isBlockedByRecentHole(point: WorldPoint): boolean {
        const radiusSq =
            this.options.holeRespawnBlockRadius * this.options.holeRespawnBlockRadius;

        for (const block of this.recentHoleBlocks) {
            const dx = point.x - block.x;
            const dy = point.y - block.y;

            if (dx * dx + dy * dy < radiusSq) {
                return true;
            }
        }

        return false;
    }

    private pruneExpiredHoleBlocks(): void {
        const now = Date.now();
        this.recentHoleBlocks = this.recentHoleBlocks.filter(
            (block) => block.expiresAt > now
        );
    }

    private resolveExpiredHoles(): void {
        const treasures = this.registry.getByType("treasure") as Treasure[];
        const now = Date.now();

        for (const treasure of treasures) {
            if (treasure.state !== "hole") continue;
            if (!treasure.holeExpiresAt) continue;

            if (now >= treasure.holeExpiresAt) {
                this.recentHoleBlocks.push({
                    x: treasure.x,
                    y: treasure.y,
                    expiresAt: now + this.options.holeRespawnBlockMs,
                });

                this.registry.delete(treasure.id);
            }
        }
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