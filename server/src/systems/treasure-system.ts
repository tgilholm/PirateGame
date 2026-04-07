import EntityRegistry from '../engine/entity-registry';
import TerrainMap from '../engine/terrain-map';
import EntityFactory from '../entities/entity-factory';
import Treasure from '../entities/interactables/treasure';
import Player from '../entities/player';
import Ship from '../entities/ship';
import { BaseSystem } from './base-system';
import Shop from '../entities/shop';
import { TreasureState } from '@shared/socket-protocol';
import Entity from '../entities/entity';
import SpatialGrid from '../application/spatial-grid';
import DigMinigame from '../minigames/dig-minigame';

export default class TreasureSystem implements BaseSystem {
	private spawnTime = 5000; // spawn treasure every 5s
	private spawnTimer = 0;
	private nextTreasureId = 1;
	private onResult?: (player: Player, payload: { success: boolean }) => void;
	private onRemove?: (entity: Entity) => void;

	private minGold: number = 10;
	private maxGold: number = 75;
	private maxTreasures: number = 1;

	// maps dig events to players via their id
	private digSessions = new Map<string, DigMinigame>();
	private holes: Treasure[] = [];

	constructor(
		private registry: EntityRegistry,
		private entityFactory: EntityFactory,
		private terrainMap: TerrainMap,
		private grid: SpatialGrid,
		onMinigameResult: (player: Player, result: { success: boolean }) => void,
		onEntityRemoved: (entity: Entity) => void
	) {
		this.onResult = onMinigameResult;
		this.onRemove = onEntityRemoved;
	}

	update(dt: number): void {
		this.spawnTimer += dt * 1000;

		this.pruneExpired();
		this.spawnTreasure();
		this.updateMinigames(dt);
		this.resolveOpeningTreasures();
		this.updateCarriedTreasures();
		this.resolveDeposits();

		const treasures = this.registry.getByType<Treasure>('treasure');

		treasures.forEach((treasure) => {
			console.log(`Treasure: ${treasure.id}, x: ${treasure.x}, y: ${treasure.y}, parent: ${treasure.parent}`);
		});
	}

	public createSession(player: Player, treasure: Treasure) {
		// Only allow if non-existent
		if (!this.digSessions.has(player.id)) {
			const size = 0.4;
			const max = 1.0 - size; // don't go off the side

			const randomStart = Math.random() * max;
			const initialPos = Math.random();

			this.digSessions.set(player.id, new DigMinigame(3000, treasure, size, randomStart, initialPos));
			treasure.state = TreasureState.DIGGING;
			player.isDigging = true;
		}
	}

	public deleteSession(player: Player) {
		if (this.digSessions.has(player.id)) {
			this.digSessions.delete(player.id);
		}
	}

	public hit(player: Player) {
		const session = this.digSessions.get(player.id);
		if (!session) return; // must be actively digging

		const { sliderPosition, successZoneSize, successZoneStart } = session;

		player.activeMinigame = null;
		player.markDirty();

		if (sliderPosition >= successZoneStart && sliderPosition <= successZoneStart + successZoneSize) {
			this.onResult?.(player, { success: true });

			session.treasure.state = TreasureState.OPENING;
			session.treasure.openedAt = Date.now();
			session.treasure.markDirty();
		} else {
			this.onResult?.(player, { success: false });
			session.treasure.state = TreasureState.BURIED;
		}

		this.digSessions.delete(player.id);
		player.isDigging = false;
		session.treasure.user = null;
	}

	public createHole(treasure: Treasure) {
		const now = Date.now();

		// Treasure has just been collected
		const hole = this.entityFactory.createTreasure(`treasure_hole_${now}`, treasure.x, treasure.y, 0);

		// Manually set state
		hole.state = TreasureState.HOLE;
		hole.expiresAt = now + 60 * 1000; // 1 minute from now
		this.holes.push(hole);
		treasure.pendingTeleport = true;
		hole.markDirty();
	}

	private spawnTreasure() {
		const treasureCount = this.registry.getByType('treasure').length;

		// only check if timer expired
		if (this.spawnTimer < this.spawnTime) return;
		this.spawnTimer = 0;

		if (treasureCount < this.maxTreasures) {
			const point = this.findSpawnPoint();
			const max = this.maxGold;
			const min = this.minGold;
			const value = Math.floor(Math.random() * (max - min + 1)) + min;
			const id = `treasure_${this.nextTreasureId++}`;

			if (!point) return;
			this.entityFactory.createTreasure(id, point.x, point.y, value);
		}
	}

	private pruneExpired() {
		const now = Date.now();

		for (const [id, session] of this.digSessions) {
			if (now - session.startedAt >= session.duration) {
				this.digSessions.delete(id);

				const player = this.registry.get<Player>(id);

				if (player) {
					this.onResult?.(player, { success: false });
					player.activeMinigame = null;
				}
			}
		}

		const expired = this.holes.filter((hole) => hole.expiresAt <= now);
		expired.forEach((hole) => this.onRemove?.(hole));
		this.holes = this.holes.filter((hole) => hole.expiresAt > now); // remove also from spatial grid via callback
	}

	private updateMinigames(dt: number) {
		for (const [playerId, session] of this.digSessions) {
			session.update(dt);

			const player = this.registry.get<Player>(playerId);

			if (player) {
				// Add to the player's "personalised packet"
				player.activeMinigame = session;
				player.markDirty();
			}
		}
	}

	private resolveOpeningTreasures(): void {
		const treasures = this.registry.getByType('treasure') as Treasure[];

		for (const treasure of treasures) {
			if (treasure.state !== TreasureState.OPENING) continue;
			if (!treasure.openedAt) continue;
			if (Date.now() - treasure.openedAt < 1200) continue;

			treasure.state = TreasureState.DUGUP;
			treasure.openedAt = null;
			treasure.user = null;
			treasure.markDirty();

			// Shove any player standing on the hole outward
			const playerIds = this.grid.getNearby(treasure.x, treasure.y);
			const shoveRadius = 35;

			for (const id of playerIds) {
				const player = this.registry.get<Player>(id);
				if (!player) continue;

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
		const treasures = this.registry.getByType('treasure') as Treasure[];

		for (const treasure of treasures) {
			if (treasure.state !== TreasureState.CARRIED || !treasure.user) continue;

			const player = treasure.user;
			if (!player) {
				treasure.state = TreasureState.DROPPED;
				treasure.user = null;
				treasure.markDirty();
				continue;
			}

			const pos = this.getWorldPosition(player);
			const angle = typeof player.aimAngle === 'number' ? player.aimAngle : 0;
			const carryDistance = 24;

			const newX = pos.x + Math.cos(angle) * carryDistance;
			const newY = pos.y + Math.sin(angle) * carryDistance;

			if (treasure.x !== newX || treasure.y !== newY) {
				treasure.x = newX;
				treasure.y = newY;
				treasure.parent = null;
				treasure.markDirty();
			}
		}
	}

	private resolveDeposits(): void {
		const players = this.registry.getByType('player') as Player[];
		const shops = this.registry.getByType('shop') as Shop[];

		for (const player of players) {
			if (!player.carrying) continue;
			const canDeposit = shops.some((shop) => shop.canInteract(player));
			if (!canDeposit) continue;

			const treasure = this.registry.get(player.carrying.id) as Treasure | null;

			if (!treasure) {
				player.carrying = null;
				player.markDirty();
				continue;
			}

			if (treasure.state !== TreasureState.CARRIED) {
				player.carrying = null;
				player.markDirty();
				continue;
			}

			player.gold += treasure.goldValue;
			player.carrying = null;
			player.markDirty();

			this.registry.delete(treasure.id);
		}
	}

	private findSpawnPoint(): { x: number; y: number } | undefined {
		const spawnTiles = this.terrainMap.getTileset('treasure-spawns');

		if (spawnTiles.length === 0) {
			console.warn('[TreasureSystem] No treasure-spawns tiles found in tilemap!');
			return undefined;
		}

		// Shuffle attempts to avoid always picking the same tiles
		const shuffled = [...spawnTiles].sort(() => Math.random() - 0.5);

		for (const tile of shuffled) {
			const point = { x: tile.x, y: tile.y };

			if (this.isBlockedByRecentHole(point)) continue;

			return point;
		}

		return undefined;
	}

	private isBlockedByRecentHole(point: { x: number; y: number }): boolean {
		const radius = 50;

		for (const hole of this.holes) {
			const dx = point.x - hole.x;
			const dy = point.y - hole.y;

			if (dx * dx + dy * dy < radius * radius) {
				return true;
			}
		}

		return false;
	}

	private getWorldPosition(player: Player): { x: number; y: number } {
		if (!player.parent) {
			return { x: player.x, y: player.y };
		}

		const ship = player.parent as Ship;
		return ship.localToWorld(player.x, player.y);
	}
}
