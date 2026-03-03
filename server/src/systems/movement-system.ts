import { Body } from "matter-js";
import EntityRegistry from "../engine/entity-registry";
import TerrainMap from "../engine/terrain-map";
import Player from "../entities/player";
import Ship from "../entities/ship";
import { EntityConfig } from "../types";
import { BaseSystem } from "./base-system";
import Entity from "src/entities/entity";

export default class MovementSystem implements BaseSystem {
    constructor(private registry: EntityRegistry, private entityConfig: EntityConfig,
        private terrainMap: TerrainMap
    ) {
    }

    update(dt: number): void {
        const players = this.registry.getByType<Player>('player');
        players.forEach(player => this.updatePlayer(player, dt));

        const ships = this.registry.getByType<Ship>('ship');
        ships.forEach(ship => this.updateShip(ship, dt));
    }

    updatePlayer(player: Player, dt: number): void {
        if (player.isSteering || player.isUsingCannon) return;

        const parent = player.parent as Ship || null;
        const { up, down, left, right } = player.inputs;
        const playerConfig = this.entityConfig.player;
        const ships = this.registry.getByType<Ship>('ship');


        if (!parent) {
            for (const ship of ships) {
                const pushPadding = -playerConfig.radius - 2;
                const local = ship.worldToLocal(player.x, player.y);

                if (ship.isInside(local.x, local.y, pushPadding)) {
                    const angleToPlayer = Math.atan2(local.y, local.x);
                    const shoveDistance = 5;

                    local.x += Math.cos(angleToPlayer) * shoveDistance;
                    local.y += Math.sin(angleToPlayer) * shoveDistance;

                    const correctedWorld = ship.localToWorld(local.x, local.y);
                    player.x = correctedWorld.x;
                    player.y = correctedWorld.y;
                }
            }
        }

        let dx = 0;
        let dy = 0;
        if (up) dy -= 1;
        if (down) dy += 1;
        if (left) dx -= 1;
        if (right) dx += 1;
        if (dx === 0 && dy === 0) return;

        // Normalize diagonal movement
        const length = Math.sqrt(dx * dx + dy * dy);
        dx /= length;
        dy /= length;

        const onLand = this.terrainMap.isOnIsland(player.x, player.y);
        const speedMultiplier = (parent || onLand) ? playerConfig.runSpeed : playerConfig.swimSpeed;
        const speed = speedMultiplier * dt * 60;

        if (parent) {
            const cos = Math.cos(-parent.r);
            const sin = Math.sin(-parent.r);
            const localDX = (dx * cos - dy * sin) * speed;
            const localDY = (dx * sin + dy * cos) * speed;

            const nextX = player.x + localDX;
            const nextY = player.y + localDY;

            const padding = playerConfig.radius;

            if (parent.isInside(nextX, nextY, padding)) {
                player.x = nextX;
                player.y = nextY;
            } else if (parent.isInside(nextX, player.y, padding)) {
                player.x = nextX;
            } else if (parent.isInside(player.x, nextY, padding)) {
                player.y = nextY;
            }

        } else {
            const nextWorldX = player.x + dx * speed;
            const nextWorldY = player.y + dy * speed;

            const collisionPadding = -playerConfig.radius;

            const isColliding = (x: number, y: number) =>
                this.checkShipCollisions(x, y, ships, collisionPadding);

            if (!isColliding(nextWorldX, nextWorldY)) {
                player.x = nextWorldX;
                player.y = nextWorldY;
            } else {
                // Slide along the hull
                const canMoveX = !isColliding(nextWorldX, player.y);
                const canMoveY = !isColliding(player.x, nextWorldY);

                if (canMoveX) player.x = nextWorldX;
                else if (canMoveY) player.y = nextWorldY;

            }


            // Keep the player on the map
            this.constrainToWorld(player, playerConfig.radius);
        }

    }


    private constrainToWorld(entity: Entity, padding: number) {
        const minX = padding;
        const minY = padding;
        const maxX = this.terrainMap.widthInPixels - padding;
        const maxY = this.terrainMap.heightInPixels - padding;

        if (entity.x < minX) entity.x = minX;
        if (entity.x > maxX) entity.x = maxX;
        if (entity.y < minY) entity.y = minY;
        if (entity.y > maxY) entity.y = maxY;
    }

    /**
     * Helper to check if a world position is inside any ship
     */
    private checkShipCollisions(x: number, y: number, ships: Ship[], padding: number): boolean {
        for (const ship of ships) {
            const local = ship.worldToLocal(x, y);
            if (ship.isInside(local.x, local.y, padding)) return true;
        }
        return false;
    }


    updateShip(ship: Ship, dt: number) {
        const { up, left, right } = ship.inputs;
        const body = ship.body;
        const { turnSpeed, thrust } = ship.physics;


        if (left) Body.setAngularVelocity(body, -turnSpeed);
        if (right) Body.setAngularVelocity(body, turnSpeed);


        if (up) {
            const force = {
                x: Math.cos(body.angle) * thrust,
                y: Math.sin(body.angle) * thrust
            };

            Body.applyForce(body, body.position, force);
        }
    }

}