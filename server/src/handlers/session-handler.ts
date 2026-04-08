import EntityRegistry from 'src/engine/entity-registry';
import EntityFactory from 'src/entities/entity-factory';
import Ship from 'src/entities/ship';
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
		private spawnSystem: SpawnSystem,
		private addPhysicsBody: (body: Matter.Body) => void,
		private removePhysicsBody: (body: Matter.Body) => void,
		private removeEntity: (id: string) => void
	) {}

	/**
	 * Called by SocketService when a player says they are READY
	 */
	public addPlayer(socketId: string, username: string) {
		const { x, y } = this.spawnSystem.getSpawnPoint();
		const newShip = this.factory.createShip(`ship_${socketId}`, x, y);

		// "hacky" way of adding to the physics world
		this.addPhysicsBody(newShip.body);
		this.factory.createPlayer(socketId, 0, 0, newShip, username);

		// No known entities for new players
		this.sessions.set(socketId, {
			socketId,
			knownEntityIds: new Set(), // empty set to start
		});
	}

	/**d
	 * Called by SocketService on disconnect
	 */
	public removePlayer(socketId: string) {
		// remove the matter body
		const ship = this.registry.get<Ship>(`ship_${socketId}`);
		if (ship) {
			this.removePhysicsBody(ship.body);
			this.removeEntity(ship.id); // remove ship before player
			this.removeEntity(socketId);
		}

		this.sessions.delete(socketId);
	}

	public getSession(socketId: string): ClientSession | undefined {
		return this.sessions.get(socketId);
	}
}
