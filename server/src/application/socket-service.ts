
// The socketService is dependent upon the compiled (.js) socket-protocol in shared. Run in dev if making changes

import { Server, Socket } from "socket.io";
import { z } from 'zod';    // For frontline validation
import { ActionType, ClientEvent, MoveData, PlayerAction, ServerEvent } from "@shared/socket-protocol";
import GameWorld, { WorldEvent } from "./game-world";

/**
 * Carries out move validation bypassing Zod for the most frequent action- movement
 * @param data the move data from the client
 * @returns true if the move matches the schema, false otherwise
 */
function isValidMove(data: MoveData): boolean {
    return data &&
        typeof data.up === 'boolean' &&
        typeof data.down === 'boolean' &&
        typeof data.left === 'boolean' &&
        typeof data.right === 'boolean' &&
        typeof data.aimAngle === 'number' &&
        isFinite(data.aimAngle);
}


// Defines the allowed interaction data
const InteractSchema = z.object({
    targetId: z.string(),
    targetType: z.string(),
    parentId: z.string().nullable().optional()
});

// Uses zod to require data/no data for each action type
const ActionSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal(ActionType.UPGRADE), data: z.object({ itemId: z.string() }) }).strict(),
    z.object({ type: z.literal(ActionType.INTERACT), data: InteractSchema }).strict(),
    z.object({ type: z.literal(ActionType.MESSAGE), data: z.object({ text: z.string() }) }).strict(),
    z.object({ type: z.literal(ActionType.DIG) }).strict(),
    z.object({ type: z.literal(ActionType.FIRE) }).strict(),
    z.object({ type: z.literal(ActionType.RELEASE) }).strict()
])

/**
 * Abstracts socket-io events from the server. Exists in a pub/sub
 * relationship with a GameWorld to dispatch actions to it and receive updates
 * from it
 */
export default class SocketService {
    constructor(private io: Server, private world: GameWorld) { }

    /**
     * Starts the listeners
     */
    public initialise() {

        this.world.on(WorldEvent.GAME_STATE, (data) => {
            this.io.emit(ServerEvent.GAME_STATE, data);
        });

        // Handle new clients
        this.io.on('connection', (socket: Socket) => {
            console.log(`[SocketService] Client connected: ${socket.id}`);

            // Client has fully loaded in- send them the full sync
            socket.on(ClientEvent.READY, (data) => {

                this.world.addPlayer(socket.id, data.username);
                socket.emit(ServerEvent.INIT_GAME, { ...this.world.getFullState(), id: socket.id });
            });

            // Client actions
            socket.on(ClientEvent.ACTION, (action: PlayerAction) => {

                // dont route movement via zod
                if (action?.type === ActionType.MOVE) {
                    if (!isValidMove(action.data)) return;
                    this.world.handleAction(socket.id, action);
                    return;
                }

                // zod validation for all other action types
                const result = ActionSchema.safeParse(action);
                if (!result.success) {
                    console.warn(`[SocketService] Invalid action from ${socket.id}:`, z.treeifyError(result.error));
                    return;
                }
                this.world.handleAction(socket.id, result.data);
            });

            socket.on('disconnect', () => {
                console.log(`[SocketService] Client disconnected`);
                this.world.removePlayer(socket.id);
            })
        });
    }
}