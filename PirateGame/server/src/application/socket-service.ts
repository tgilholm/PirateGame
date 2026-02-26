import { Server } from "socket.io";
import { z } from 'zod';    // For frontline validation
import { ActionType, ClientEvent, PlayerAction, ServerEvent } from "../../../shared/socket-protocol";
import WorldManager, { ManagerEvent } from "./world-manager";

const MoveSchema = z.object({
    up: z.boolean(),
    down: z.boolean(),
    left: z.boolean(),
    right: z.boolean()
});

const ActionSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal(ActionType.MOVE), data: MoveSchema }).strict(),
    z.object({ type: z.literal(ActionType.UPGRADE), data: z.object({ itemId: z.string() }) }).strict(),
    z.object({ type: z.literal(ActionType.INTERACT) }).strict(),
    z.object({ type: z.literal(ActionType.MESSAGE), data: z.object({ text: z.string() }) }).strict(),
    z.object({ type: z.literal(ActionType.DIG) }).strict(),
    z.object({ type: z.literal(ActionType.FIRE) }).strict(),
    z.object({ type: z.literal(ActionType.RELEASE)}).strict()
])

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
        this.worldManager.on(ManagerEvent.SYNC, (playerId: string, fullState: any) => {
            this.io.to(playerId).emit(ServerEvent.INIT_GAME, fullState);   // Send initGame with full data

            console.log(`[SocketService] Sent full game state to: ${playerId}`);
        })

        // Handle players being kicked from worlds on crash
        this.worldManager.on(ManagerEvent.KICKED, (playerId: string, reason: string) => {
            this.io.to(playerId).emit(ServerEvent.KICKED, { reason });    // e.g. "world crashed"
        })

        /*
            Client-server events
        */

            // TODO Create a session UUID for new users, save to client via cookies.
            // Re-join should use the same session ID, route back to existing player.
            // Remove players after 5 minutes if they haven't re-joined.

            // Accept socket.id for the initial connection, require the session ID
            // for all further communication afterwards
            // Translate UUID to playerID afterwards

        // Handle new clients
        this.io.on('connection', (socket) => {
            console.log(`[SocketService] New player connected: ${socket.id}`);


            // "Welcome packet"- sent when a player sends the "ready" message
            socket.on(ClientEvent.READY, () => {
                const worldId = this.worldManager.getPlayerWorldId(socket.id);
                if (worldId) {
                    this.worldManager.requestSync(socket.id);
                }
            });

            // Attempt to join the world chosen by the user
            socket.on(ClientEvent.REQUEST_JOIN, (worldId) => {
                const success = this.worldManager.joinWorld(socket.id, worldId);

                if (success) {
                    socket.join(worldId);   // Adds the player to the world "room"
                }
                else {
                    socket.emit(ServerEvent.JOIN_FAILED, { reason: 'World not found' });
                }
            });

            // Route player actions  to the correct world via the manager
            socket.on(ClientEvent.ACTION, (action: PlayerAction) => {
                // Use zod to check for a valid event before dispatch
                const result = ActionSchema.safeParse(action);

                if (!result.success) {
                    console.warn(`[SocketService] Invalid action from ${socket.id}:`, result.error.format());
                    return;
                }

                this.worldManager.routeAction(socket.id, result.data);
            })

            // Remove the player from the world on leaving
            socket.on('disconnect', () => {
                console.log(`[SocketHandler] Client Disconnected: ${socket.id}`);
                this.worldManager.leaveWorld(socket.id);
            })
        });
    }
}