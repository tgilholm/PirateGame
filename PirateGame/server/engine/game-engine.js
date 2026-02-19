import EntityRegistry from "./entity-registry";

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
    }

    update() {
        // For each player, update the player physics relative to ship or world
        this.playerHandler.updateAllPlayers((player) => {
            // Pass the ship directly to the physicsHandler- if not found, ship is null
            const ship = this.shipManager.getShip(player.parentId);
            this.physicsHandler.updatePlayerPhysics(player, ship);
        });

        // Update the physics of all ships
        this.shipHandler.updateAllShips((ship) => {
            ship.updateShipPhysics();
        })

        // Send the update to the handler
        this.physicsHandler.update();
    }

    getStateUpdate() {

    }
}