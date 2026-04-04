import SpatialGrid from 'src/application/spatial-grid';
import EntityRegistry from 'src/engine/entity-registry';
import GameEngine from 'src/engine/game-engine';
import EntityFactory from 'src/entities/entity-factory';
import Ship from 'src/entities/ship';
import PhysicsSystem from 'src/systems/physics-system';
import SpawnSystem from 'src/systems/spawn-system';

/**
 * Used to determine whether a full state or delta is required for an entity
 */
interface ClientSession {
	socketId: string;
	knownEntityIds: Set<string>; // the entities this client "knows" about already
}

export default class SessionHandler {
	private sessions: Map<string, ClientSession> = new Map(); // state held by each client

	constructor(
		private registry: EntityRegistry,
		private factory: EntityFactory,
		private engine: GameEngine,
		private grid: SpatialGrid
	) {}

	/**
	 * Called by SocketService when a player says they are READY
	 */
	public addPlayer(socketId: string, username: string) {
		// Spawn the player on their own ship
		const spawnSystem = this.engine.systems.get('spawns') as SpawnSystem;

		const { x, y } = spawnSystem.getSpawnPoint();
		const newShip = this.factory.createShip(`ship_${socketId}`, x, y);

		// "hacky" way of adding to the physics world
		const physics = this.engine.systems.get('physics') as PhysicsSystem;
		physics.addBody(newShip.body);

		this.factory.createPlayer(socketId, 0, 0, newShip, username);

		// No known entities for new players
		this.sessions.set(socketId, {
			socketId,
			knownEntityIds: new Set(), // empty set to start
		});
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

	public getSession(socketId: string): ClientSession | undefined {
		return this.sessions.get(socketId);
	}
}
