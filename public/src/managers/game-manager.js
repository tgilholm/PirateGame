import { ServerEvent } from "shared/built/socket-protocol.js";
import NetworkManager from "./network-manager.js";
import ShipModel from "../models/ship-model.js";

export default class GameManager {
    /**
     * 
     * @param {NetworkManager} network 
     * @param {Phaser.Scene} scene 
     */
    constructor(network, scene) {
        this.network = network;
        this.scene = scene;

        this.ships = {};
        this.players = {};
    }

    init() {
        this.network.on(ServerEvent.INIT_GAME, (data) => this.onInitGame(data));
        this.network.on(ServerEvent.GAME_STATE, (data) => this.onGameState(data));
    }

    update() {

    }



    onInitGame(data) {

        data.ships?.forEach(ship => {
            if (!this.ships[ship.id]) {
                this.ships[ship.id] = new ShipModel(this.scene, ship.x, ship.y, ship.params);
            }
        });

        data.playerData?.forEach(playerData => {
            if (!this.players[playerData.id]) {
                this.players[playerData.id] = new Player(this.scene, playerData.id);
            }
            const shipParent = playerData.parentId ? this.ships[playerData.parentId] : null;
            this.players[playerData.id].updateState(playerData, shipParent);
        });

        // Create all entities from server data
        if (!data) return;

        data.ships.forEach(ship => {

        });


        if (data.shipData && Array.isArray(data.shipData)) {
            data.shipData.forEach(shipData => {
                if (!ships[shipData.id]) {
                    console.log(`[Client] Creating ship: ${shipData.id}`);
                    ships[shipData.id] = new Ship(this, shipData.x, shipData.y, shipData.params);
                }
            });
        }
        console.log('[GameManager] Initialised game with data received from server', data);
    }

    onGameState(data) {

    }


}