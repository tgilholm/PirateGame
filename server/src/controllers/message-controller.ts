import Player from "../entities/player";

/**
 * Handles message events. Adds the message to a queue to be handled by the messageSystem.
 */
export default class MessageController {
    handleMessage(player: Player, data: { text: string; } | undefined) {
        throw new Error("Method not implemented.");
    }
}