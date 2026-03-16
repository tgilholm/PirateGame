import Projectile from "../entities/projectiles/projectile";
import EntityRegistry from "../engine/entity-registry";
import { BaseSystem } from "./base-system";
import SpatialGrid from "../application/spatial-grid";
import Player from "src/entities/player";
import Ship from "src/entities/ship";
import Entity from "src/entities/entity";
import Shop from "src/entities/shopimport { SplashEvent } from "@shared/socket-protocol";

/**
 * Updates all projectile objects each tick. Handles collisions between
 * projectiles and other objects, destroying the projectile and dealing
 * damage to the struck object
 */
export default class ProjectileSystem implements BaseSystem {

    /** Splash positions queued this tick. Drained by GameWorld each broadcast cycle. */
    public pendingSplashes: SplashEvent[] = [];

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
        const shops = this.entityRegistry.getByType<Shop>('shop');

        projectiles.forEach(projectile => {
            const nearby = this.grid.getNearby(projectile.x, projectile.y);

            this.moveProjectile(projectile, dt);
            if (projectile.ttl <= 0) return;
            this.collidePlayerAndNPC(projectile, nearby);
            if (projectile.ttl <= 0) return;
            this.collideShip(projectile, nearby);
            if (projectile.ttl <= 0) return;
            this.collideShop(projectile, nearby);
            
        });
    }


    moveProjectile(proj: Projectile, dt: number) {

        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;
        proj.ttl -= dt * 1000;

        // Delete expired projectiles
        if (proj.ttl <= 0) {
            if (proj.type === 'cannonball') {
                // Queue a splash event for GameWorld to broadcast this tick
                this.pendingSplashes.push({ x: proj.x, y: proj.y });
            }
            this.destroyEntity(proj);
        }
    }

    collidePlayerAndNPC(proj: Projectile, nearby: Set<string>) {

        let hit = false;

        nearby.forEach(id => {
            const entity = this.entityRegistry.get(id);
            if (!entity || proj.firedBy === entity) return;
            if (!(entity.type === 'player' || entity.type === 'npc')) return;

            const worldPos = entity.parent
                ? (entity.parent as Ship).localToWorld(entity.x, entity.y)
                : { x: entity.x, y: entity.y };

            const dist = Math.hypot(proj.x - worldPos.x, proj.y - worldPos.y);
            if (dist < proj.radius + 25) { // 15 = player radius
                entity.health -= proj.damage;
                entity.markDirty();
                hit = true;
            }

            if (hit) {
                if (proj.type === 'cannonball') this.pendingSplashes.push({ x: proj.x, y: proj.y });
                this.destroyEntity(proj);
            }
        });
    }

    collideShip(proj: Projectile, nearby: Set<string>) {
        let hit = false;

        if (proj.type !== 'cannonball') return; // bullets don't damage ships

        nearby.forEach(id => {
            const entity = this.entityRegistry.get(id);

            if (entity?.type !== 'ship' || proj.firedBy?.parent === entity) return;
            const ship = entity as Ship;

            const local = ship.worldToLocal(proj.x, proj.y);
            if (ship.isInside(local.x, local.y, -proj.radius)) {
                ship.health -= proj.damage;
                ship.markDirty();
                hit = true;
            }

            if (hit) {
                this.pendingSplashes.push({ x: proj.x, y: proj.y });
                this.destroyEntity(proj);
            }
        });
    }

    collideShop(proj: Projectile, nearby: Set<string>) {
        nearby.forEach(id => {
            const entity = this.entityRegistry.get(id);
            if (entity?.type !== 'shop') return;

            const shop = entity as Shop;
            const dist = Math.hypot(proj.x - shop.x, proj.y - shop.y);
            if (dist < proj.radius + shop.radius) {
                this.destroyEntity(proj);
            }
        });
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