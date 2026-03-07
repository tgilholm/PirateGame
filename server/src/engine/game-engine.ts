import { BaseSystem } from "../systems/base-system";
import MessageSystem from "../systems/message-system";
import MovementSystem from "../systems/movement-system";
import PhysicsSystem from "../systems/physics-system";
import ProjectileSystem from "../systems/projectile-system";

/**
 * Abstracts the systems in the game and updates all of them each tick
 */
export interface GameSystems {
    physicsSystem: PhysicsSystem,
    movementSystem: MovementSystem,
    projectileSystem: ProjectileSystem,
    messageSystem: MessageSystem
}

export default class GameEngine {
    private systems: Map<string, BaseSystem> = new Map();   // must derive from the abstract class
    private systemArray: BaseSystem[];

    constructor(systems: GameSystems) {
        this.systems.set('movement', systems.movementSystem);
        this.systems.set('physics', systems.physicsSystem);
        this.systems.set('projectile', systems.projectileSystem);
        this.systems.set('message', systems.messageSystem);


        this.systemArray = Array.from(this.systems.values());   // cache systems
    }

    public tick(dt: number) {
        // Update all systems
        this.systemArray.forEach((system) => {
            system.update(dt);
        })
    }
}