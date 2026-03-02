
// The socketService is dependent upon the compiled (.js) socket-protocol in shared. Run in dev if making changes

import { Server, Socket } from "socket.io";
import { z } from 'zod';    // For frontline validation
import { ActionType, ClientEvent, PlayerAction, ServerEvent } from "@shared/socket-protocol";
import GameWorld, { WorldEvent } from "./game-world";



const MoveSchema = z.object({
    up: z.boolean(),
    down: z.boolean(),
    left: z.boolean(),
    right: z.boolean(),

    mouseX: z.number(),
    mouseY: z.number()
});

const InteractSchema = z.object({
    targetId: z.string(),
    targetType: z.string(),
    parentId: z.string().nullable().optional()
});

const ActionSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal(ActionType.MOVE), data: MoveSchema }).strict(),
    z.object({ type: z.literal(ActionType.UPGRADE), data: z.object({ itemId: z.string() }) }).strict(),
    z.object({ type: z.literal(ActionType.INTERACT), data: InteractSchema }).strict(),
    z.object({ type: z.literal(ActionType.MESSAGE), data: z.object({ text: z.string() }) }).strict(),
    z.object({ type: z.literal(ActionType.DIG) }).strict(),
    z.object({ type: z.literal(ActionType.FIRE) }).strict(),
    z.object({ type: z.literal(ActionType.RELEASE) }).strict()
])

export default class SocketService {
    constructor(private io: Server, private world: GameWorld) { }

    public initialise() {

        this.world.on(WorldEvent.GAME_STATE, (data) => {
            this.io.emit(ServerEvent.GAME_STATE, data);
        });

        // Handle new clients
        this.io.on('connection', (socket: Socket) => {
            console.log(`[SocketService] Client connected: ${socket.id}`);
            socket.on(ClientEvent.READY, (data) => {

                this.world.addPlayer(socket.id, data.username);
                socket.emit(ServerEvent.INIT_GAME, { ...this.world.getFullState(), id: socket.id });
            });

            socket.on(ClientEvent.ACTION, (action: PlayerAction) => {
                // Use zod to check for a valid event before dispatch
                const result = ActionSchema.safeParse(action);

                if (!result.success) {
                    console.warn(`[SocketService] Invalid action from ${socket.id}:`, result.error.format());
                    return;
                }

                // Send the action to the controller
                this.world.handleAction(socket.id, result.data);
            });

            socket.on('disconnect', () => {
                console.log(`[SocketService] Client disconnected`);
                this.world.removePlayer(socket.id);
            })
        });

    }
}