import { ServerEvent } from "shared/built/socket-protocol.js";
import NetworkManager from "./network-manager.js";
import ShipModel from "../models/ship-model.js";
import PlayerModel from "../models/player-model.js";

export default class GameManager {
    /**
     * 
     * @param {NetworkManager} network 
     * @param {Phaser.Scene} scene 
     */
    constructor(network, scene) {
        this.network = network;
        this.scene = scene;

        this.shipList = {};
        this.playerList = {};
    }

    init() {
        this.network.on(ServerEvent.INIT_GAME, (data) => this.onInitGame(data));
        this.network.on(ServerEvent.GAME_STATE, (data) => this.onGameState(data));
    }

    update() {

    }



    onInitGame(data) {
        // Initial "handshake" packet from server

        data.ships?.forEach(shipData => {
            // Only create the ship if not already in the list
            if (!this.shipList[shipData.id]) {
                this.shipList[shipData.id] = new ShipModel(this.scene, shipData.x, shipData.y, shipData.dimensions);
            }
        });

        data.players?.forEach(playerData => {
            // Only create the player if not already in the list
            if (!this.playerList[playerData.id]) {
                this.playerList[playerData.id] = new PlayerModel(this.scene, playerData.id);
            }
            const shipParent = playerData.parentId ? this.shipList[playerData.parentId] : null;
            this.playerList[playerData.id].updateState(playerData, shipParent);
        });
        console.log('[GameManager] Initialised game with data received from server', data);
    }

    onGameState(data) {
        // Regular "choppy" data from server

        data.ships?.forEach(shipData => {
            if (!this.shipList[shipData.id]) {
                this.shipList[shipData.id] = new ShipModel(this.scene, shipData.x, shipData.y, shipData.dimensions);
            }
            
            const ship = this.shipList[shipData.id];
            
        });
    }


}