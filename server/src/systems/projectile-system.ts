import Projectile from "src/entities/projectile";
import EntityRegistry from "../engine/entity-registry";
import { BaseSystem } from "./base-system";
import SpatialGrid from "src/application/spatial-grid";

/**
 * Updates all projectile objects each tick. Handles collisions between
 * projectiles and other objects, destroying the projectile and dealing
 * damage to the struck object
 */
export default class ProjectileSystem implements BaseSystem {
    constructor(private entityRegistry: EntityRegistry,
        private grid: SpatialGrid
    ) { }

    /**
     * Updates all the projectiles in the game
     * @param dt the difference in time from the last update
     */
    update(dt: number): void {
        // Get all projectiles
        const projectiles = this.entityRegistry.getByType<Projectile>("projectile");

        for (const proj of projectiles) {
            // Move the projectile
            proj.x += proj.vx * dt;
            proj.y += proj.vy * dt;

            proj.ttl -= dt * 1000;  // reduce lifespan

            if (proj.ttl <= 0) {
                this.entityRegistry.delete(proj.id);
                this.grid.remove(proj.id);
            }
        }

    }
}