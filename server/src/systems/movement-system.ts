import { Body } from "matter-js";
import EntityRegistry from "../engine/entity-registry";
import TerrainMap from "../engine/terrain-map";
import Player from "../entities/player";
import Ship from "../entities/ship";
import { EntityConfig } from "../../types";
import { BaseSystem } from "./base-system";

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

        // Only move if not bound to something
        if (player.isSteering || player.isUsingCannon || player.isCarrying) {
            return;
        }

        const playerConfig = this.entityConfig.player;
        const parent = player.parent as Ship || null;

        // If not on land or a ship, lower movement speed
        const onLand = !parent && this.terrainMap.isOnIsland(player.x, player.y);
        const speed = onLand ? playerConfig.runSpeed : playerConfig.swimSpeed;
        const { up, down, left, right } = player.inputs;

        // If on ship, move relative to ship
        if (parent) {
            const worldPos = parent.localToWorld(player.x, player.y);

            // Apply absolute movement
            if (up) worldPos.y -= speed * dt;
            if (down) worldPos.y += speed * dt;
            if (left) worldPos.x -= speed * dt;
            if (right) worldPos.x += speed * dt;

            // Convert back to local
            const newLocal = parent.worldToLocal(worldPos.x, worldPos.y);

            // Check collision with parent
            if (parent.isInside(newLocal.x, newLocal.y, playerConfig.radius)) {
                player.x = newLocal.x;
                player.y = newLocal.y;
            } else {
                // Slide along walls
                if (parent.isInside(newLocal.x, player.y, playerConfig.radius)) {
                    player.x = newLocal.x;
                } else if (parent.isInside(player.x, newLocal.y, playerConfig.radius)) {
                    player.y = newLocal.y;
                }
            }

            // If not on ship, move relative to world
        } else {
            if (up) player.y -= speed * dt;
            if (down) player.y += speed * dt;
            if (left) player.x -= speed * dt;
            if (right) player.x += speed * dt;
        }
    }


    updateShip(ship: Ship, dt: number) {
        const {up, left, right} = ship.inputs;
        const body = ship.body;
        const {turnSpeed, thrust} = ship.physics;
        
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