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

    constructor(systems: GameSystems) {
        this.physicsSystem = systems.physicsSystem;
        this.movementSystem = systems.movementSystem;
        this.projectileSystem = systems.projectileSystem;
        this.messageSystem = systems.messageSystem;
    }


    physicsSystem: PhysicsSystem;
    movementSystem: MovementSystem;
    projectileSystem: ProjectileSystem;
    messageSystem: MessageSystem;
}