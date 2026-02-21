import MovementSystem from "../systems/movement-system";
import PhysicsSystem from "../systems/physics-system";
import ProjectileSystem from "../systems/projectile-system";
import EntityRegistry from "./entity-registry";
import MessageSystem from "./message-system";

/**
 * Specify all systems provided to worlds
 */
export interface WorldSystems {
    physicsSystem: PhysicsSystem,
    movementSystem: MovementSystem,
    projectileSystem: ProjectileSystem,
    messageSystem: MessageSystem
}

export default class World {
    constructor(
        public readonly id: string,
        public readonly entityRegistry: EntityRegistry,
        systems: WorldSystems
    ) {
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
