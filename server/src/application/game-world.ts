import GameEngine from '../engine/game-engine';
import EntityRegistry from '../engine/entity-registry';
import WorldController from '../controllers/world-controller';
import { PlayerAction, SplashEvent } from '@shared/socket-protocol';
import Player from '../entities/player';
import EntityFactory from '../entities/entity-factory';
import { EventEmitter } from 'events';
import { CONFIG } from '../config';
import ProjectileSystem from '../systems/projectile-system';
import SpatialGrid from './spatial-grid';
import TerrainMap from '../engine/terrain-map';
import Entity from '../entities/entity';
import SessionHandler from '../handlers/session-handler';
import NPC from '../entities/npcs/npc';
import NPCShip from '../entities/npcs/npc-ship';

/**
 * Communication contract between this game world and the socket service
 */
export enum WorldEvent {
	GAME_STATE = 'GAME_STATE',
	GAME_STATE_PER_PLAYER = 'GAME_STATE_PER_PLAYER',
	PLAYER_DIED = 'PLAYER_DIED',
	SHIP_SUNK = 'SHIP_SUNK',
}

/**
 * The GameWorld class abstracts the specifics of each game from the server. It emits
 * events listened to by the SocketService to deliver game state to each player.
 */
export default class GameWorld extends EventEmitter {
	private tickRate = CONFIG.TICK_RATE;
	private tickInterval?: NodeJS.Timeout;
	private lastTime: number = 0;

	private minimalPlayers: any[] = [];
	private minimalShips: any[] = [];
	private minimalNPCs: any[] = [];
	private minimalInteractables: any[] = [];

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
		private terrain: TerrainMap,
		private sessionHandler: SessionHandler
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
		this.updateMinimalLists();

		// correct delays instead of using setInterval
		const elapsed = Date.now() - now;
		const delay = Math.max(0, 1000 / this.tickRate - elapsed);
		this.tickInterval = setTimeout(() => this.tick(), delay) as any;
	}

	private updateMinimalLists() {
		// Recalculate lightweight entity lists once per tick

		// minimal entity lists for minimaps
		this.minimalPlayers = this.registry.getByType<Player>('player').map((p) => ({
			id: p.id,
			username: p.username,
			x: p.worldPos.x,
			y: p.worldPos.y,
		}));

		this.minimalShips = this.registry.getByType('ship').map((s) => ({
			x: s.x,
			y: s.y,
			r: s.r, // todo width/height
		}));

		// npc ships are included in minimal ships- no need to send them twice
		this.minimalNPCs = this.registry
			.getByType<NPC>('npc')
			.filter((n) => !(n instanceof NPCShip))
			.map((n) => ({
				x: n.x,
				y: n.y,
			}));

		this.minimalInteractables = []; //todo
	}

	/**
	 * Called by SocketService when a validated action arrives
	 */
	public handleAction(socketId: string, action: PlayerAction) {
		this.controller.handle(socketId, action);
	}

	public addPlayer(socketId: string, username: string) {
		this.sessionHandler.addPlayer(socketId, username);
	}

	public removePlayer(socketId: string) {
		this.sessionHandler.removePlayer(socketId);
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

		const players = this.registry.getByType<Player>('player');
		players.forEach((player) => {
			// Tell the player to respawn
			if (player.isDead && !player.deathNotified) {
				console.log(`[GameWorld] Player Died: ${player.id}`);
				this.emit(WorldEvent.PLAYER_DIED, player.id);
				player.deathNotified = true; // avoid event spam
			}

			// Tell the player their ship has sunk
			const ship = player.ship;
			if (ship.isDead && !ship.sunkNotified) {
				console.log(`[GameWorld] Player Ship Sunk: ${ship.id}`);
				this.emit(WorldEvent.SHIP_SUNK, player.id);
				ship.sunkNotified = true;
			}
		});

		this.emit(WorldEvent.GAME_STATE_PER_PLAYER, (socketId: string) => {
			const session = this.sessionHandler.getSession(socketId); // access that player's "known data"
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
			const splashEvents = splashes.filter((s) => Math.hypot(s.x - wx, s.y - wy) <= this.grid['viewDistance']);

			// If nothing has changed, skip it altogether
			if (!newEntities.length && !deltaEntities.length && !removedIds.length && !splashEvents.length) {
				return null;
			}
			// Send to client via socket service
			return {
				newEntities,
				deltaEntities,
				removedIds,
				splashEvents,
				minimalPlayers: this.minimalPlayers,
				minimalInteractables: this.minimalInteractables,
				minimalShips: this.minimalShips,
				minimalNPCs: this.minimalNPCs,
			};
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
			minimalPlayers: this.minimalPlayers,
			minimalInteractables: this.minimalInteractables,
			minimalShips: this.minimalShips,
			minimalNPCs: this.minimalNPCs,
		};
	}

	/**
	 *
	 */
	private createShops() {
		const shops = this.terrain.getTileset('shop-spawns');
		shops.forEach((shop, index) => {
			this.entityFactory.createInteractable(null, { type: 'shop', x: shop.x, y: shop.y }, index);
		});
	}
}
