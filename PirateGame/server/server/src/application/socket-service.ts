import { Server } from "socket.io";
import { ClientEvent, ServerEvent } from "../shared/socket-protocol";
import WorldManager from "./world-manager";

export enum ManagerEvent {
    WORLD_STATE_UPDATE = "WORLD_STATE_UPDATE",
    PLAYER_SYNC = "PLAYER_SYNC",
    PLAYER_KICKED = 'PLAYER_KICKED',
}

export default class SocketService {
    constructor(private io: Server, private worldManager: WorldManager) { }

    public initialise() {

        /*
            Manager Events
        */

        // Route the game state from each world to the corresponding room
        this.worldManager.on(ManagerEvent.WORLD_STATE_UPDATE, (worldId, state) => {

            // Send only to the clients in that "room" or world
            this.io.to(worldId).emit(ServerEvent.GAME_STATE, state);
        });

        // Send the entire game state when playerSync is received 
        this.worldManager.on(ManagerEvent.PLAYER_SYNC, (playerId: string, fullState: any) => {
            this.io.to(playerId).emit(ServerEvent.INIT_GAME, fullState);   // Send initGame with full data

            console.log(`[SocketService] Sent full game state to: ${playerId}`);
        })

        // Handle players being kicked from worlds on crash
        this.worldManager.on(ManagerEvent.PLAYER_KICKED, (playerId: string, reason: string) => {
            this.io.to(playerId).emit(ServerEvent.KICKED, { reason });    // e.g. "world crashed"
        })

        /*
            Client-server events
        */

        // Handle new clients
        this.io.on('connection', (socket) => {
            console.log(`[SocketService] New player connected: ${socket.id}`);


            // "Welcome packet"- sent when a player sends the "ready" message
            socket.on(ClientEvent.PLAYER_READY, () => {
                const worldId = this.worldManager.getPlayerWorldId(socket.id);
                if (worldId) {
                    this.worldManager.routeAction(socket.id, ClientEvent.PLAYER_REQUEST_SYNC, {});
                }
            });

            // Attempt to join the world chosen by the user
            socket.on(ClientEvent.PLAYER_REQUEST_JOIN, (worldId) => {
                const success = this.worldManager.joinWorld(socket.id, worldId);

                if (success) {
                    socket.join(worldId);   // Adds the player to the world "room"
                }
                else {
                    socket.emit(ServerEvent.JOIN_FAILED, {reason: 'World not found'});
                }
            });

            // Route player actions  to the correct world via the manager
            socket.on(ClientEvent.PLAYER_ACTION, (event, payload) => {
                this.worldManager.routeAction(socket.id, event, payload);
            })

            // Remove the player from the world on leaving
            socket.on('disconnect', () => {
                console.log(`[SocketHandler] Client Disconnected: ${socket.id}`);
                this.worldManager.leaveWorld(socket.id);
            })
        });
    }
}