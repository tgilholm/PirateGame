import PhysicsHandler from "server/handlers/physics-handler.js";
import { CONFIG } from "../config.js";
import EntityRegistry from "./entity-registry.js";

/**
 * 
 */
export default class GameEngine {
    /**
     * 
     * @param {EntityRegistry} entityRegistry 
     */
    constructor(entityRegistry) {

        // Functionality is delegated to handlers for each domain
        this.entities = entityRegistry;
        this.physicsHandler = new PhysicsHandler();

        // Used for only updating clients with deltas instead of re-sending the entire game state
        this.lastBroadcast = {
            ships: {},
            players: {}
        }

        console.log('[GameEngine] Initialised game engine');
    }

    /**
     * 
     */
    update() {
        // Update physics for all entities inside entityRegistry
        this.updateAllEntities();
        this.physicsHandler.update();
        this.syncShips();   // not sink ships, SYNC ships!
    }

    /**
     * 
     */
    updateAllEntities() {
        const deltaTime = 1 / CONFIG.TICK_RATE;

        this.entities.getAllEntities().forEach(entity => {
            // gracefully handles disparate physics implementations
            entity.updatePhysics(deltaTime);
        });
    }

    /**
     * 
     */
    syncShips() {
        this.entities.getShips().forEach(ship => {
            ship.syncFromPhysicsBody();
        });
    }


    /**
     * 
     */
    getRecentUpdates() {
        const shipUpdates = [];
        const playerUpdates = [];

        // Check ships for changes
        this.entities.getShips().forEach(ship => {
            const current = {
                id: ship.id,
                x: Math.round(ship.position.x),
                y: Math.round(ship.position.y),
                r: ship.rotation,
                vx: ship.velocity.x,
                vy: ship.velocity.y,
                av: ship.angularVelocity,
                pilotId: ship.pilotId,
                health: ship.health
            };

            const last = this.lastBroadcast.ships[ship.id];

            // Only send updates if the data changed enough
            if (!last ||
                Math.abs(current.x - last.x) > 1 ||
                Math.abs(current.y - last.y) > 1 ||
                Math.abs(current.r - last.r) > 0.05 ||
                current.pilotId !== last.pilotId ||
                current.health !== last.health) {

                this.lastBroadcast.ships[ship.id] = current;
                shipUpdates.push(current);
            }
        });

        // Check players for changes
        this.entities.getPlayers().forEach(player => {
            const current = {
                id: player.id,
                x: Math.round(player.position.x),
                y: Math.round(player.position.y),
                r: player.rotation,
                vx: 0,  // Players don't use velocity
                vy: 0,
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

        /*
            Future entity updates can be aggregated here
        */

        // Connect all updates in a single object
        return {
            ships: shipUpdates,
            players: playerUpdates
        }
    }

    /**
     * 
     */
    getGameState() {
        return {
            // Extract all entity data
            entities: this.entities.getStats(),
            ships: this.entities.getShips().map(ship => ({
                id: ship.id,
                position: ship.position,
                health: ship.health,
                pilotId: ship.pilotId
            })),
            players: this.entities.getPlayers().map(p => ({
                id: p.id,
                username: p.username,
                position: p.position,
                parentId: p.parentId
            }))
        };
    }
}