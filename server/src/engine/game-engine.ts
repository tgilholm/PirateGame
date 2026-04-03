import NPCSystem from '../systems/npc-system';
import { BaseSystem } from '../systems/base-system';
import MessageSystem from '../systems/message-system';
import MovementSystem from '../systems/movement-system';
import PhysicsSystem from '../systems/physics-system';
import ProjectileSystem from '../systems/projectile-system';
import TreasureSystem from '../systems/treasure-system';
import SpawnSystem from 'src/systems/spawn-system';

/**
 * Defines the systems that must be provided into GameEngine instances
 */
export interface GameSystems {
	physicsSystem: PhysicsSystem;
	movementSystem: MovementSystem;
	projectileSystem: ProjectileSystem;
	messageSystem: MessageSystem;
	npcSystem: NPCSystem;
	treasureSystem: TreasureSystem;
	spawnSystem: SpawnSystem;
}

/**
 * Abstracts the systems in the game and updates all of them each tick
 */
export default class GameEngine {
	public systems: Map<string, BaseSystem> = new Map(); // must derive from the abstract class
	private systemArray: BaseSystem[];

	/**
	 * Builds a GameEngine from the provided systems
	 * @param systems the game systems to add
	 */
	constructor(systems: GameSystems) {
		this.systems.set('movement', systems.movementSystem);
		this.systems.set('physics', systems.physicsSystem);
		this.systems.set('projectile', systems.projectileSystem);
		this.systems.set('message', systems.messageSystem);
		this.systems.set('npc', systems.npcSystem);
		this.systems.set('treasure', systems.treasureSystem);
		this.systems.set('spawns', systems.spawnSystem);

		this.systemArray = Array.from(this.systems.values()); // cache systems
	}

	/**
	 * Invokes the update() event for all sub-systems
	 * @param dt the difference in time from the last tick
	 */
	public tick(dt: number) {
		// Update all systems
		this.systemArray.forEach((system) => {
			system.update(dt);
		});
	}
}
