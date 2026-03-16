/** global io */

import { ActionType, ClientEvent, ServerEvent } from "shared/built/socket-protocol.js";

export default class NetworkManager {
    constructor(socket) {
        this.socket = socket;
    }

    on(event, callback) {
        this.socket.on(event, callback);
    }

    emit(event, data) {
        this.socket.emit(event, data);
    }

    sendAction(action) {
        this.socket.emit(ClientEvent.ACTION, action);
    }

    sendMove(inputs) {
        this.sendAction({ type: ActionType.MOVE, data: inputs });
    }

    sendInteract(data) {
        this.sendAction({ type: ActionType.INTERACT, data });
    }

    sendRelease() {
        this.sendAction({ type: ActionType.RELEASE });
    }

    sendFire() {
        this.sendAction({ type: ActionType.FIRE });
    }

    sendTreasureInteract() {
        this.sendAction({ type: ActionType.TREASURE_INTERACT });
    }

    sendMessage(text) {
        this.sendAction({ type: ActionType.MESSAGE, data: { text } });
    }

    sendDigStart() {
        this.sendAction({
            type: ActionType.DIG,
            data: { mode: "start" }
        });
    }

    sendDigHit(sliderPosition) {
        this.sendAction({
            type: ActionType.DIG,
            data: { mode: "hit", sliderPosition }
        });
    }
}