import Projectile from "../entities/projectiles/projectile";
import EntityRegistry from "../engine/entity-registry";
import { BaseSystem } from "./base-system";
import SpatialGrid from "../application/spatial-grid";
import Player from "src/entities/player";
import Ship from "src/entities/ship";

/**
 * Updates all projectile objects each tick. Handles collisions between
 * projectiles and other objects, destroying the projectile and dealing
 * damage to the struck object
 */
export default class ProjectileSystem implements BaseSystem {
    /**
     * Fallback method if not provided in composition root
     * @param id the id to delete
     */
    public destroyEntity: (id: string) => void = (id) => {
        this.entityRegistry.delete(id);
        this.grid.remove(id);
    };

        constructor(private entityRegistry: EntityRegistry,
            private grid: SpatialGrid,
    ) { }

        /**
         * Updates all the projectiles in the game
         * @param dt the difference in time from the last update
         */
        update(dt: number): void {
            const projectiles = this.entityRegistry.getByType<Projectile>('projectile');
            const players = this.entityRegistry.getByType<Player>('player');
            const ships = this.entityRegistry.getByType<Ship>('ship');

            for(const proj of projectiles) {
                proj.x += proj.vx * dt;
                proj.y += proj.vy * dt;
                proj.ttl -= dt * 1000;

                if (proj.ttl <= 0) {
                    this.entityRegistry.delete(proj.id);
                    this.grid.remove(proj.id);
                    continue;
                }

                let hit = false;

                // All projectiles can hit players
                for (const player of players) {
                    if (player.id === proj.firedBy) continue; // no self-hits
                    const worldPos = player.parent
                        ? (player.parent as Ship).localToWorld(player.x, player.y)
                        : { x: player.x, y: player.y };

                    const dist = Math.hypot(proj.x - worldPos.x, proj.y - worldPos.y);
                    if (dist < proj.radius + 15) { // 15 = player radius
                        player.health -= proj.damage;
                        player.markDirty();
                        hit = true;
                        break;
                    }
                }

                if (hit) {
                    this.entityRegistry.delete(proj.id);
                    this.grid.remove(proj.id);
                    continue;
                }

                // Only cannonballs hit ships
                if (proj.type === 'cannonball') {
                    for (const ship of ships) {
                        const local = ship.worldToLocal(proj.x, proj.y);
                        if (ship.isInside(local.x, local.y, -proj.radius)) {
                            ship.health -= proj.damage;
                            ship.markDirty();
                            hit = true;
                            break;
                        }
                    }

                    if (hit) {
                        this.entityRegistry.delete(proj.id);
                        this.grid.remove(proj.id);
                    }
                }
            }
        }
    }