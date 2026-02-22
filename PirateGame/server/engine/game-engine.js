// @ts-nocheck
import PhysicsHandler from "../handlers/physics-handler.js"
import { INIT_CONFIG } from "../config.js";
import EntityRegistry from "./entity-registry.js";
import Matter from "matter-js";

/**
 * 
 */
export default class GameEngine {
    constructor() {

        // Functionality is delegated to handlers for each domain
        const matterEngine = Matter.Engine.create({ gravity: { x: 0, y: 0 } });
        this.physicsHandler = new PhysicsHandler(matterEngine);

        // Used for only updating clients with deltas instead of re-sending the entire game state
        this.lastBroadcast = {
            ships: {},
            players: {},
            npcs: {}
        }

        console.log('[GameEngine] Initialised game engine');
    }

    /**
     * 
     */
    update() {
        // Update physics for all entities inside entityRegistry
        this.physicsHandler.update()
    }

    createShip(id, x, y) {
        const ship = EntityRegistry.createShip(id, 2500, 5000);
        this.physicsHandler.addShipBody(ship.body);
        return ship;
    }

    getRecentUpdates() {
        const shipUpdates = [];
        const playerUpdates = [];
        const npcUpdates = [];

        // Check ships
        EntityRegistry.getShips().forEach(ship => {
            const current = {
                id: ship.id,
                x: Math.round(ship.position.x),
                y: Math.round(ship.position.y),
                r: ship.rotation,
                vx: ship.velocity.x,
                vy: ship.velocity.y,
                av: ship.angularVelocity
            };

            const last = this.lastBroadcast.ships[ship.id];

            // If 'last' is undefined, this is the first time this specific broadcast loop has seen this ship.
            if (!last) {
                console.log(`[GameEngine] Broadcasting new ship to clients: ${ship.id}`);

                // Attach the full params so the client can actually construct the object
                current.params = ship.params;

                this.lastBroadcast.ships[ship.id] = current;
                shipUpdates.push(current);
            }
            // Otherwise, only send if it has moved significantly
            else if (
                Math.abs(current.x - last.x) > 1 ||
                Math.abs(current.y - last.y) > 1 ||
                Math.abs(current.r - last.r) > 0.01
            ) {
                this.lastBroadcast.ships[ship.id] = current;
                shipUpdates.push(current);
            }
        });

        // Check players
        EntityRegistry.getPlayers().forEach(player => {
            const current = {
                id: player.id,
                x: Math.round(player.position.x),
                y: Math.round(player.position.y),
                parentId: player.parentId,
                username: player.username,
                health: player.health,
                isSteering: player.isSteering
            };

            const last = this.lastBroadcast.players[player.id];
            if (!last ||
                current.parentId !== last.parentId ||
                current.health !== last.health ||
                current.isSteering !== last.isSteering ||
                Math.abs(current.x - last.x) > 1 ||
                Math.abs(current.y - last.y) > 1) {

                this.lastBroadcast.players[player.id] = current;
                playerUpdates.push(current);
            }
        });

        // Check NPCs
        EntityRegistry.getNPCs().forEach(npc => {
            const current = {
                id: npc.id,
                x: Math.round(npc.position.x),
                y: Math.round(npc.position.y),
                r: npc.rotation
            };

            const last = this.lastBroadcast.npcs[npc.id];
            if (!last ||
                Math.abs(current.x - last.x) > 2 ||
                Math.abs(current.y - last.y) > 2) {

                this.lastBroadcast.npcs[npc.id] = current;
                npcUpdates.push(current);
            }
        });

        return { ships: shipUpdates, players: playerUpdates, npcs: npcUpdates };
    }

    /**
     * 
     */
    getGameState() {
        return {
            // Extract all entity data
            entities: EntityRegistry.getStats(),
            ships: EntityRegistry.getShips().map(ship => ({
                id: ship.id,
                position: ship.position,
                health: ship.health,
                pilotId: ship.pilotId
            })),
            players: EntityRegistry.getPlayers().map(p => ({
                id: p.id,
                username: p.username,
                position: p.position,
                parentId: p.parentId
            }))
        };
    }
}