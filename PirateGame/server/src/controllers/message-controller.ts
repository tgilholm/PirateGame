import Player from "../entities/player";

export default class MessageController {
    handleMessage(player: Player, data: { text: string; } | undefined) {
        throw new Error("Method not implemented.");
    }
}