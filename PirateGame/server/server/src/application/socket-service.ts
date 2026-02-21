import { Server } from "socket.io";
import WorldManager from "./world-manager";

export default class SocketService {
    constructor(private io: Server, private worldManager: WorldManager) { }

    public initialise() {

        // Route the game state from each world to the corresponding room
        this.worldManager.on('worldStateUpdate', (worldId, state) => {

            // Send only to the clients in that "room" or world
            this.io.to(worldId).emit('gameState', state);
        });

        // Send the entire game state when playerSync is received 
        this.worldManager.on('playerSync', (playerId: string, fullState: any) => {
            this.io.to(playerId).emit('initGame', fullState);   // Send initGame with full data

            console.log(`[SocketService] Sent full game state to: ${playerId}`);
        })

        // Handle new clients
        this.io.on('connection', (socket) => {
            console.log(`[SocketService] New player connected: ${socket.id}`);


            // "Welcome packet"- sent when a player sends the "ready" message
            socket.on('player:ready', () => {
                const worldId = this.worldManager.getPlayerWorldId(socket.id);
                if (worldId) {
                    this.worldManager.routeAction(socket.id, 'system:requestSync', {});
                }
            });

            socket.on('player:requestJoin', (worldId) => {
                this.worldManager.joinWorld(socket.id, worldId);
                socket.join(worldId);   // Adds the player to the world "room"
            });

            socket.onAny((event, payload) => {
                // Ignore system messages
                if (event === 'player:requestJoin' || event === 'player:ready') return;

                this.worldManager.routeAction(socket.id, event, payload);
            });

            socket.on('disconnect', () => {
                console.log(`[SocketHandler] Client Disconnected: ${socket.id}`);
                this.worldManager.leaveWorld(socket.id);
            })
        });
    }
}