import EntityRegistry from "../engine/entity-registry";
import { BaseSystem } from "./base-system";

/**
 * Updates all projectile objects each tick. Handles collisions between
 * projectiles and other objects, destroying the projectile and dealing
 * damage to the struck object
 */
export default class ProjectileSystem implements BaseSystem {
    /**
     * Creates a projectile system
     * @param entityRegistry to update all the projectiles
     */
    constructor(entityRegistry: EntityRegistry) {

    }

    /**
     * Updates all the projectiles in the game
     * @param dt the difference in time from the last update
     */
    update(dt: number): void {
        // Updates all projectiles in the simulation
        
    }
}