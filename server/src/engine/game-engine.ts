import { BaseSystem } from "../systems/base-system";
import MessageSystem from "../systems/message-system";
import MovementSystem from "../systems/movement-system";
import PhysicsSystem from "../systems/physics-system";
import ProjectileSystem from "../systems/projectile-system";

/**
 * Specify all the systems needed to make the game run here.This separates the game engine
    * from its specific systems.
 */
export interface GameSystems {
    physicsSystem: PhysicsSystem,
    movementSystem: MovementSystem,
    projectileSystem: ProjectileSystem,
    messageSystem: MessageSystem
}

export default class GameEngine {
    private systems: Map<string, BaseSystem> = new Map();

    constructor(systems: GameSystems) {
        this.systems.set('physics', systems.physicsSystem);
        this.systems.set('movement', systems.movementSystem);
        this.systems.set('projectile', systems.projectileSystem);
        this.systems.set('message', systems.messageSystem);
    }

    public tick(dt: number) {
        const systemArray = Array.from(this.systems.values());

        // Update all systems
        systemArray.forEach((system) => {
            system.update(dt);
        })
    }
}