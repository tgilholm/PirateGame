import { Body } from "matter-js";
import EntityRegistry from "../engine/entity-registry";
import TerrainMap from "../engine/terrain-map";
import Player from "../entities/player";
import Ship from "../entities/ship";
import { EntityConfig } from "../types";
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
        if (player.isSteering || player.isUsingCannon) return;

        const parent = player.parent as Ship || null;
        const { up, down, left, right } = player.inputs;
        const playerConfig = this.entityConfig.player;

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

        const speed = (parent ? playerConfig.runSpeed : playerConfig.swimSpeed) * dt * 60;

        if (parent) {
            const cos = Math.cos(-parent.r);
            const sin = Math.sin(-parent.r);
            const localDX = (dx * cos - dy * sin) * speed;
            const localDY = (dx * sin + dy * cos) * speed;
            const nextX = player.x + localDX;
            const nextY = player.y + localDY;

            if (parent.isInside(nextX, nextY, playerConfig.radius)) {
                player.x = nextX;
                player.y = nextY;
            } else if (parent.isInside(nextX, player.y, playerConfig.radius)) {
                player.x = nextX;
            } else if (parent.isInside(player.x, nextY, playerConfig.radius)) {
                player.y = nextY;
            }
        } else {
            player.x += dx * speed;
            player.y += dy * speed;
        }
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