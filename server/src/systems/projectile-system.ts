import Projectile from "../entities/projectiles/projectile";
import EntityRegistry from "../engine/entity-registry";
import { BaseSystem } from "./base-system";
import SpatialGrid from "../application/spatial-grid";
import Player from "src/entities/player";
import Ship from "src/entities/ship";
import Entity from "src/entities/entity";

/**
 * Updates all projectile objects each tick. Handles collisions between
 * projectiles and other objects, destroying the projectile and dealing
 * damage to the struck object
 */
export default class ProjectileSystem implements BaseSystem {


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

        projectiles.forEach(projectile => {
            this.moveProjectile(projectile, dt);
            this.collidePlayer(projectile, players);
            this.collideShip(projectile, ships);
        });

        players.forEach

    }


    moveProjectile(proj: Projectile, dt: number) {

        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;
        proj.ttl -= dt * 1000;

        // Delete expired projectiles
        if (proj.ttl <= 0) {
            this.destroyEntity(proj);
        }
    }

    collidePlayer(proj: Projectile, players: Player[]) {
        let hit = false;

        // All projectiles can hit players
        for (const player of players) {
            if (player === proj.firedBy) continue; // no self-hits
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
            this.destroyEntity(proj);
        }
    }

    collideShip(proj: Projectile, ships: Ship[]) {
        let hit = false;

        // Only cannonballs hit ships
        if (proj.type === 'cannonball') {
            for (const ship of ships) {
                // Prevent self-hits
                if (proj.firedBy?.parent === ship) return;

                const local = ship.worldToLocal(proj.x, proj.y);
                if (ship.isInside(local.x, local.y, -proj.radius)) {
                    ship.health -= proj.damage;
                    ship.markDirty();
                    hit = true;
                    break;
                }
            }

            if (hit) {
                this.destroyEntity(proj);
            }
        }
    }

    /**
     * Removes a projectile
     * @param id the id to delete
     */
    public destroyEntity(entity: Entity) {
        this.entityRegistry.delete(entity.id);
        this.grid.remove(entity.id);
    };
}