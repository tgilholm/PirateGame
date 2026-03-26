import GameEngine from '../engine/game-engine';
import EntityRegistry from '../engine/entity-registry';
import WorldController from '../controllers/world-controller';
import { PlayerAction, SplashEvent } from '@shared/socket-protocol';
import Player from '../entities/player';
import EntityFactory from '../entities/entity-factory';
import Ship from '../entities/ship';
import { EventEmitter } from 'events';
import { CONFIG } from '../config';
import PhysicsSystem from '../systems/physics-system';
import ProjectileSystem from '../systems/projectile-system';
import SpatialGrid from './spatial-grid';
import TerrainMap from 'src/engine/terrain-map';
import Entity from 'src/entities/entity';

/**
 * Communication contract between this game world and the socket service
 */
export enum WorldEvent {
	GAME_STATE = 'GAME_STATE',
	GAME_STATE_PER_PLAYER = 'GAME_STATE_PER_PLAYER',
}

/**
 * Used to determine whether a full state or delta is required for an entity
 */
interface ClientSession {
	socketId: string;
	knownEntityIds: Set<string>; // the entities this client "knows" about already
}

/**
 * The GameWorld class abstracts the specifics of each game from the server. It emits
 * events listened to by the SocketService to deliver game state to each player.
 */
export default class GameWorld extends EventEmitter {
	private tickRate = CONFIG.TICK_RATE;
	private tickInterval?: NodeJS.Timeout;
	private lastTime: number = 0;
	private sessions: Map<string, ClientSession> = new Map(); // state held by each client

	/**
	 * Creates a game world with the provided dependencies
	 * @param registry all the entities in the game
	 * @param entityFactory to create new entities
	 * @param engine to update each system on a tick
	 * @param controller to route player events to the right place
	 * @param grid to contain entities in a grid
	 */
	constructor(
		private registry: EntityRegistry,
		private entityFactory: EntityFactory,
		private engine: GameEngine,
		private controller: WorldController,
		private grid: SpatialGrid,
		private terrain: TerrainMap
	) {
		super();
	}

	/**
	 * Starts the world at the specified tickrate
	 */
	public start() {
		console.log(`[GameWorld] Starting game at ${this.tickRate} TPS`);
		this.lastTime = Date.now();
		this.tickInterval = setTimeout(() => this.tick(), 1000 / this.tickRate) as any;
		this.createShops();
	}

	/**
	 * Stops the game
	 */
	public stop() {
		if (this.tickInterval) clearTimeout(this.tickInterval);
		console.log(`[GameWorld] Game stopped`);
	}

	/**
	 * Calculates physics, processes movement, and broadcasts state.
	 */
	private tick() {
		const now = Date.now();
		const dt = (now - this.lastTime) / 1000;
		this.lastTime = now;
		this.engine.tick(dt);
		this.broadcastGameState();

		// correct delays instead of using setInterval
		const elapsed = Date.now() - now;
		const delay = Math.max(0, 1000 / this.tickRate - elapsed);
		this.tickInterval = setTimeout(() => this.tick(), delay) as any;
	}

	/**
	 * Called by SocketService when a validated action arrives
	 */
	public handleAction(socketId: string, action: PlayerAction) {
		this.controller.handle(socketId, action);
	}

	/**
	 * Called by SocketService when a player says they are READY
	 */
	public addPlayer(socketId: string, username: string) {
		// Spawn the player on their own ship
		const { x, y } = this.getSpawnPoint();
		const newShip = this.entityFactory.createShip(`ship_${socketId}`, x, y);

		// "hacky" way of adding to the physics world
		const physics = this.engine.systems.get('physics') as PhysicsSystem;
		physics.addBody(newShip.body);

		this.entityFactory.createPlayer(socketId, 0, 0, newShip, username);

		// No known entities for new players
		this.sessions.set(socketId, {
			socketId,
			knownEntityIds: new Set(), // empty set to start
		});
	}

	getSpawnPoint() {
		const spawnPoints = this.terrain.getTileset('player-spawns');

		// let dist = 1000;
		// let spawnPoint = { x: 0, y: 0 };
		// while (dist > 500) {
		//     spawnPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];

		//     // Get distance to players & ships
		//     const ships = this.registry.getByType<Ship>('ship');
		//     const players = this.registry.getByType<Player>('player');

		//     // Calculate the minimum distance
		//     const distances: number[] = [];
		//     ships.forEach(ship => distances.push(Math.hypot(ship.x - spawnPoint.x, ship.y - spawnPoint.y)));
		//     players.forEach(player => {
		//         // Get world coordinates
		//         const worldPos = this.getWorldPosition(player);
		//         distances.push(Math.hypot(worldPos.x - spawnPoint.x, worldPos.y - spawnPoint.y));

		//     });

		//     // If all the distances are far enough away, spawn the player

		//     console.log(dist, spawnPoint);

		//     distances.sort();
		//     dist = distances[0];
		// }
		return spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
	}

	/**
	 * Called by SocketService on disconnect
	 */
	public removePlayer(socketId: string) {
		this.registry.delete(socketId);

		// remove the matter body
		const physics = this.engine.systems.get('physics') as PhysicsSystem;
		const ship = this.registry.get<Ship>(`ship_${socketId}`);

		if (ship) {
			physics.removeBody(ship.body); // remove the ship's physics body
			this.registry.delete(`ship_${socketId}`); // remove their ship
		}

		// Remove them from the spatial grid and the session list
		this.grid.remove(socketId);
		this.grid.remove(`ship_${socketId}`);
		this.sessions.delete(socketId);
	}

	private buildEntityData(): Map<string, { full: any; delta: any }> {
		const entityData = new Map<string, { full: any; delta: any }>();

		this.registry.getAll().forEach((e) => {
			// Use the parent coordinates if the entity has a parent
			const wx = e.parent ? e.parent.x : e.x;
			const wy = e.parent ? e.parent.y : e.y;
			this.grid.update(e.id, wx, wy); // update the spatial grid

			const delta = e.serialiseDelta();

			// Set the data to be broadcast
			entityData.set(e.id, {
				full: e.serialise(),
				delta: delta,
			});
		});

		return entityData;
	}

	/**
	 * Creates a "personalised" update packet for each player, containing only
	 * the entities that have changed recently and are within a reasonable distance of them.
	 * Entities that are new to the client will be sent with a full state. Entities close to the client
	 * receive a delta (what changed since the last broadcast), and entities that leave the view
	 * range of the client are "invisible" to it and are not sent.
	 */
	private broadcastGameState() {
		const entityData = this.buildEntityData();
		const projectileSystem = this.engine.systems.get('projectile') as ProjectileSystem;
		const splashes: SplashEvent[] = projectileSystem.pendingSplashes;

		this.emit(WorldEvent.GAME_STATE_PER_PLAYER, (socketId: string) => {
			const session = this.sessions.get(socketId); // access that player's "known data"
			const player = this.registry.get<Player>(socketId);

			if (!session || !player) return null; // break early

			// World coords- generalise to parent if on ship
			const wx = player.parent ? player.parent.x : player.x;
			const wy = player.parent ? player.parent.y : player.y;
			const nearbyIds = this.grid.getNearby(wx, wy); // everything near the player

			const newEntities: any[] = [];
			const deltaEntities: any[] = [];
			const removedIds: string[] = [];

			const selfData = entityData.get(socketId);
			if (selfData) {
				deltaEntities.push(selfData.full);
				session.knownEntityIds.add(socketId);
			}

			// Always send the player's own ship delta if it changed (even if out of spatial range)
			const ownShipId = 'ship_' + socketId;
			const ownShipData = entityData.get(ownShipId);
			if (ownShipData?.delta && session.knownEntityIds.has(ownShipId)) {
				deltaEntities.push(ownShipData.delta);
			}

			// New/updated entities
			nearbyIds.forEach((id) => {
				const data = entityData.get(id);
				if (!data) return;

				// If client doesn't know about it, add it
				if (!session.knownEntityIds.has(id)) {
					newEntities.push(data.full); // full sync
					session.knownEntityIds.add(id); // so we don't add it next time
				} else if (data.delta) {
					deltaEntities.push(data.delta); // if client knows about it, and it changed
				}
			});

			// Out-of-range entities — never evict the player's own ship
			session.knownEntityIds.forEach((id) => {
				if (!nearbyIds.has(id) && id !== ownShipId) {
					session.knownEntityIds.delete(id);
					removedIds.push(id);
				}
			});

			// Only send splashes that are within this player's view distance
			const splashEvents = splashes.filter(
				(s) => Math.hypot(s.x - wx, s.y - wy) <= this.grid['viewDistance']
			);
			const allPlayers = this.registry.getByType<Player>('player').map((p) => ({
				id: p.id,
				username: p.username,
			}));

			// If nothing has changed, skip it altogether
			if (
				!newEntities.length &&
				!deltaEntities.length &&
				!removedIds.length &&
				!splashEvents.length
			) {
				return null;
			}
			// Send to client via socket service
			return { newEntities, deltaEntities, removedIds, splashEvents, allPlayers };
		});

		// Drain splashes — they have been broadcast this tick
		projectileSystem.pendingSplashes = [];
	}

	/**
	 * Provides the initial (non-delta-encoded) state to players who have just joined.
	 * After this point, clients receive updates only for objects that have changed.
	 */
	public getFullState() {
		return {
			entities: this.registry.getAll().map((e) => e.serialise()),
			mapWidth: this.terrain.widthInPixels,
			mapHeight: this.terrain.heightInPixels,
			shopSpawns: this.registry.getByType<Entity>('shop').map((s) => ({ X: s.x, Y: s.y })),
			allPlayers: this.registry
				.getByType<Player>('player')
				.map((p) => ({ id: p.id, username: p.username })),
		};
	}

	private getWorldPosition(entity: Entity) {
		if (!entity.parent) {
			// If the entity has no parent, its coordinates are already in world space
			return { x: entity.x, y: entity.y };
		}

		const parent = this.registry.get<Ship>(entity.parent.id);

		// If the parent is a ship, use its localToWorld method
		if (parent) {
			const ship = parent as Ship;
			return ship.localToWorld(entity.x, entity.y);
		}

		// If the parent is not a ship, return the entity's local position
		return { x: entity.x, y: entity.y };
	}

	/**
	 *
	 */
	private createShops() {
		const shops = this.terrain.getTileset('shop-spawns');
		shops.forEach((shop, index) => {
			this.entityFactory.createShop(`shop_${index}`, shop.x, shop.y);
		});
	}
}
