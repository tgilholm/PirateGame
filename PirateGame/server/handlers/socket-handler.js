import { Server, Socket } from "node_modules/socket.io/dist/index";
import EntityRegistry from "server/engine/entity-registry";
import GameEngine from "server/engine/game-engine";
import NpcSystem from "server/systems/npc-system";
import PlayerSystem from "server/systems/player-system";
import ShipSystem from "server/systems/ship-system";


const systems = {
    player_event: PlayerSystem.handle,
    ship_event: ShipSystem.handle,
    npc_event: NpcSystem.handle
};

export default class SocketHandler {
    /**
     * 
     * @param {Server} io 
     * @param {GameEngine} gameEngine 
     * @param {EntityRegistry} entityRegistry 
     */
    constructor(io, gameEngine, entityRegistry) {
        this.io = io;
        this.gameEngine = gameEngine;
        this.entities = entityRegistry;
    }

    /**
     * 
     * @param {Socket} socket 
     */
    handleConnect(socket) {
        // For new clients, send the initial data
        const shipData = this.entities.getShipInitData();
        const playerData = this.entities.getPlayerData();
        // get some npc data and send it here

        socket.emit('initGame', { shipData, playerData });
        this.registerHandlers(socket);
    }

    /**
     * 
     * @param {Socket} socket 
     */
    handleDisconnect(socket)
    {
        // If player was steering, release control
        const id = socket.id;
        const pilotedShip = this.entities.getShipPilotedBy(id);
        if (pilotedShip)
        {
            PlayerSystem.handle(playerId, 'player:releaseControl', {
                shipId: pilotedShip.id
            });
        }

        this.entities.removeEntity(id); // Remove from the game
    }

    /**
     * 
     * @param {Socket} socket 
     */
    registerHandlers(socket) {
        // Route to the related system- this calls the "handle" method in each system class
        socket.onAny((eventName, payload) => {
            if (systems[eventName]) {   // defend against "bad payloads" for non-existent systems
                systems[eventName](socket.id, payload);
            }
        });
    }
}