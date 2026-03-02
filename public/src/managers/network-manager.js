import { ActionType, ClientEvent } from "shared/built/socket-protocol.js";
import { ServerEvent } from "shared/socket-protocol.js";
import { Socket } from "socket.io-client";

/**
 * Owns socket-io logic
 */
export default class NetworkManager {
    /**
     * @param {Socket} socket
     */
    constructor(socket) {
        this.socket = socket;
    }

    /**
     * Sets up a listener on a specific server event
     * @param {ServerEvent} event
     * @param {(...args: any[]) => void} callback
     */
    on(event, callback) {
        this.socket.on(event, callback);
    }

    /**
     * Sends an event to the server
     * @param {string} event  
     * @param {any} data
     */
    emit(event, data) {
        this.socket.emit(event, data);
    }

    /**
     * Sends any event matching PlayerAction to the server
     * @param {import("shared/built/socket-protocol.js").PlayerAction} action
     */
    sendAction(action) {
        this.socket.emit(ClientEvent.ACTION, action);
    }

    /**
     * Sends movement inputs from the client to the server
     * @param {import("shared/socket-protocol.js").MoveData} inputs 
     */
    sendMove(inputs) {
        this.sendAction({ type: ActionType.MOVE, data: inputs });
    }

/**
     * Sends an interaction event to the server
     * @param {import("shared/socket-protocol.js").InteractData} data 
     */
    sendInteract(data) {
        this.sendAction({ 
            type: ActionType.INTERACT, 
            data: data
        });
    }

    /**
     * Sends a "stop interacting" event to the server
     */
    sendRelease() {
        this.sendAction({ type: ActionType.RELEASE });
    }

    /**
     * Sends a "fire" event to the server
     */
    sendFire() {
        this.sendAction({ type: ActionType.FIRE });
    }

    /**
     * Sends a player's message to the server
     * @param {string} text 
     */
    sendMessage(text) {
        this.sendAction({ type: ActionType.MESSAGE, data: { text } });
    }
}