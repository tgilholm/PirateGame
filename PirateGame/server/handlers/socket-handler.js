import EntityRegistry from "../engine/entity-registry.js";
import GameEngine from "../engine/game-engine.js";
import NpcSystem from "../systems/npc-system.js"
import PlayerSystem from "../systems/player-system.js"
import ShipSystem from "../systems/ship-system.js"


const systems = {
    player_event: PlayerSystem.handle,
    ship_event: ShipSystem.handle
    //npc_event: NpcSystem.handle
};

export default class SocketHandler {
    /**
     * 
     * @param {GameEngine} gameEngine 
     */
    constructor(io, gameEngine) {
        this.io = io;
        this.gameEngine = gameEngine;
    }

    /**
     * 
     */
    handleConnect(socket) {
        // For new clients, send the initial data
        const shipData = EntityRegistry.getShipData()
        const playerData = EntityRegistry.getPlayerData();
        // get some npc data and send it here

        socket.emit('initGame', { shipData, playerData });
        this.registerHandlers(socket);
    }

    /**
     * 
     */
    handleDisconnect(socket) {
        const playerId = socket.id;

        // If player was steering, release control
        const pilotedShip = EntityRegistry.getShipPilotedBy(playerId);
        if (pilotedShip) {
            PlayerSystem.handle(playerId, 'player:releaseControl', {
                shipId: pilotedShip.id
            });
        }

        EntityRegistry.removeEntity(playerId); // Remove from the game
    }

    /**
     * 
     */
    registerHandlers(socket) {
        // Route to the related system- this calls the "handle" method in each system class
        socket.onAny((eventName, payload) => {
            const [namespace, action] = eventName.split(':');

            if (!namespace || !action) {
                console.warn(`Invalid event format: ${eventName}`);
                return; // break early before anything bad happens
            }

            const system = systems[namespace];   // Get the relevant system (player, npc etc)
            if (!system) {
                console.warn(`Invalid namespace: ${eventName}`);
                return;
            }

            // Call system handler
            const result = system.handle(socket.id, eventName, payload || {});

            // Send response
            if (result && !result.success) {
                console.warn(`${eventName}:error`, { reason: result.reason })
                //socket.emit(`${eventName}:error`, { reason: result.reason });
            } else if (result && result.data) {
                //socket.emit(`${eventName}:success`, result.data);
            }
        });
    }
}