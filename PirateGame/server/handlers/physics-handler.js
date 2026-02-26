import Matter from "matter-js";
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from "url";
import { CONFIG } from "../server/src/config.js";
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

        // Update all ships
        EntityRegistry.getShips().forEach(ship => {
            this.updateShipPhysics(ship);
        });
        Engine.update(this.engine, 1000 / CONFIG.TICK_RATE);
    }


    updateShipPhysics(ship) {
        const { up, down, left, right } = ship.inputs;
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