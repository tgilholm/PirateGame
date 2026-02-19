import { CONFIG } from "../config";
import EntityRegistry from "./entity-registry";

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
    getStateUpdate() {
        const shipUpdates = [];
        const playerUpdates = [];

        this.entities = getAllShips().for
    }
}