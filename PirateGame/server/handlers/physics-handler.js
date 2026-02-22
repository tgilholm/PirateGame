import Matter from "matter-js";
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from "url";
import { INIT_CONFIG } from "../config.js";
import EntityRegistry from "../engine/entity-registry.js";
import Player from "../entities/player.js";
import Ship from "../entities/ship.js";

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
        this.lastSpeedLogTime = 0;

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
        Engine.update(this.engine, 1000 / INIT_CONFIG.TICK_RATE);
    }

    /**
     * 
     * @param {Player} player 
     * @param {Ship} ship 
     * @returns 
     */
    updatePlayerPhysics(player, ship) {
        // Destructure inputs
        const { up, down, left, right } = player.inputs;

        //walking vs swimming speed
        const speed = ship ? INIT_CONFIG.PLAYER.SPEED : INIT_CONFIG.PLAYER.SWIM_SPEED;


        if (ship) {// Player is on a ship (local space)
            // Cannot move while steering
            if (player.id === ship.pilotId) return;

            const shipX = ship.position.x;
            const shipY = ship.position.y;
            const r = ship.rotation;

            // Get world position of player
            let worldPos = ship.localToWorld(player.position.x, player.position.y);

            // Apply movement in world space
            if (up) worldPos.y -= speed;
            if (down) worldPos.y += speed;
            if (left) worldPos.x -= speed;
            if (right) worldPos.x += speed;

            //console.log(worldPos.x, worldPos.y);

            // Convert back to local space
            const newLocal = ship.worldToLocal(worldPos.x, worldPos.y);

            // Collision check with ship hull
            const playerRadius = INIT_CONFIG.PLAYER.RADIUS;
            if (ship.isInside(newLocal.x, newLocal.y, playerRadius)) {
                player.position.x = newLocal.x;
                player.position.y = newLocal.y;
            } else {
                // Slide along walls
                if (ship.isInside(newLocal.x, player.position.y, playerRadius)) {
                    player.position.x = newLocal.x;
                } else if (ship.isInside(player.position.x, newLocal.y, playerRadius)) {
                    player.position.y = newLocal.y;
                }
            }
        } else {
            // Player is in world space - move freely
            if (up) player.position.y -= speed;
            if (down) player.position.y += speed;
            if (left) player.position.x -= speed;
            if (right) player.position.x += speed;
        }
    }

    /**
     * 
     * @param {Ship} ship 
     */
    updateShipPhysics(ship) {
        const { up, down, left, right } = ship.inputs || {};
        const body = ship.body;
        const now = Date.now();
        const shouldLogTurn = now - this.lastSpeedLogTime >= 1000;

        if (left) {
            Body.setAngularVelocity(body, -ship.turnSpeed);
            if (shouldLogTurn) {//prevernts excessive logs, only 1 a second when turning
                console.log("left turn max speed:" + ship.turnSpeed);
                this.lastSpeedLogTime = now;
            }
        }

        if (right) {
            Body.setAngularVelocity(body, ship.turnSpeed);
            if (shouldLogTurn) { //prevernts excessive logs, only 1 a second when turning
                console.log("right turn max speed:" + ship.turnSpeed);
                this.lastSpeedLogTime = now;
            }
        }

        if (up) {
            const force = {
                x: Math.cos(body.angle) * ship.thrust,
                y: Math.sin(body.angle) * ship.thrust
            };
            Body.applyForce(body, body.position, force);
            if (shouldLogTurn) {//prevernts excessive logs, only 1 a second when turning
                console.log("forward max speed:" + ship.thrust);
                this.lastSpeedLogTime = now;
            }
        }

        // Sync ship position from matter
        ship.position = { x: body.position.x, y: body.position.y };
        ship.rotation = body.angle;
        ship.velocity = { x: body.velocity.x, y: body.velocity.y };
        ship.angularVelocity = body.angularVelocity;
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