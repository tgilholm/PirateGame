import Matter from "matter-js";
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from "url";
import { CONFIG } from "../config.js";
import EntityRegistry from "../engine/entity-registry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body;

export default class PhysicsHandler {
    /**
     * 
     * @param {Matter.Engine} matterEngine 
     */
    constructor(matterEngine) {
        this.engine = matterEngine;
        this.world = this.engine.world;
        this.lastUpdateTime = 0;

        // Load the tilemap
        this.initialiseTilemapCollisions();
    }

    initialiseTilemapCollisions() {
        const rootDir = path.join(__dirname, '../..');
        const mapPath = path.join(rootDir, 'public', 'assets', 'demo-map.json');

        try {
            const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
            const tileWidth = mapData.tilewidth;
            const mapWidth = mapData.width;
            const islands = mapData.layers.find(layer => layer.name === "islands");

            if (islands && islands.data) {
                let tileArray;
                if (typeof islands.data === 'string') {
                    const buffer = Buffer.from(islands.data, 'base64');
                    tileArray = new Uint32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
                } else {
                    tileArray = islands.data;
                }

                tileArray.forEach((tileGid, index) => {
                    if (tileGid !== 0) {
                        const x = (index % mapWidth) * tileWidth + (tileWidth / 2);
                        const y = Math.floor(index / mapWidth) * tileWidth + (tileWidth / 2);
                        const part = Bodies.rectangle(x, y, tileWidth, tileWidth, { isStatic: true });
                        World.add(this.world, part);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load tilemap collisions:', error);
        }
    }

    update() {
        EntityRegistry.getPlayers().forEach(player => {
            const ship = player.parentId ? EntityRegistry.getShip(player.parentId) : null;
            this.updatePlayerPhysics(player, ship);
        });

        // Update all ships
        EntityRegistry.getShips().forEach(ship => {
            this.updateShipPhysics(ship);
        });
        Engine.update(this.engine, 1000 / CONFIG.TICK_RATE);
    }

    updatePlayerPhysics(player, ship) {
        // Destructure inputs
        const { up, down, left, right } = player.inputs;

        if (ship) {
            // Player is on a ship (local space)

            // Cannot move while steering
            if (player.id === ship.pilotId) return;

            const shipX = ship.position.x;
            const shipY = ship.position.y;
            const r = ship.rotation;

            // Get world position of player
            let worldPos = this.localToWorld(shipX, shipY, r, player.x, player.y);

            // Apply movement in world space
            if (up) worldPos.y -= player.speed;
            if (down) worldPos.y += player.speed;
            if (left) worldPos.x -= player.speed;
            if (right) worldPos.x += player.speed;

            // Convert back to local space
            const newLocal = this.worldToLocal(shipX, shipY, r, worldPos.x, worldPos.y);

            // Collision check with ship hull
            const playerRadius = CONFIG.PLAYER.RADIUS;
            if (ship.isInside(newLocal.x, newLocal.y, playerRadius)) {
                player.x = newLocal.x;
                player.y = newLocal.y;
            } else {
                // Slide along walls
                if (ship.isInside(newLocal.x, player.y, playerRadius)) {
                    player.x = newLocal.x;
                } else if (ship.isInside(player.x, newLocal.y, playerRadius)) {
                    player.y = newLocal.y;
                }
            }
        } else {
            // Player is in world space - move freely
            if (up) player.y -= player.speed;
            if (down) player.y += player.speed;
            if (left) player.x -= player.speed;
            if (right) player.x += player.speed;
        }
    }

    updateShipPhysics(ship) {
        const { up, down, left, right } = ship.inputs;
        const body = ship.body;

        if (left) Body.setAngularVelocity(body, -ship.turnSpeed * 20);
        if (right) Body.setAngularVelocity(body, ship.turnSpeed * 20);

        if (up) {
            const force = {
                x: Math.cos(body.angle) * ship.thrust,
                y: Math.sin(body.angle) * ship.thrust
            };
            Body.applyForce(body, body.position, force);
        }

        // Sync ship position from matter
        ship.position = { x: body.position.x, y: body.position.y };
        ship.rotation = body.angle;
        ship.velocity = { x: body.velocity.x, y: body.velocity.y };
        ship.angularVelocity = body.angularVelocity;
    }



    worldToLocal(parentX, parentY, parentRotation, worldX, worldY) {
        const dx = worldX - parentX;
        const dy = worldY - parentY;
        const cos = Math.cos(-parentRotation);
        const sin = Math.sin(-parentRotation);

        return {
            x: dx * cos - dy * sin,
            y: dx * sin + dy * cos
        };
    }


    localToWorld(parentX, parentY, parentRotation, localX, localY) {
        const cos = Math.cos(parentRotation);
        const sin = Math.sin(parentRotation);

        const rotatedX = localX * cos - localY * sin;
        const rotatedY = localX * sin + localY * cos;

        return {
            x: parentX + rotatedX,
            y: parentY + rotatedY
        };
    }

    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    addShipBody(body) {
        World.add(this.world, body);
    }
}