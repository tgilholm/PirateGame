import { ServerEvent } from "shared/built/socket-protocol.js";
import NetworkManager from "./network-manager.js";
import ShipModel from "../models/ship-model.js";
import PlayerModel from "../models/player-model.js";

export default class GameManager {
    /**
     * 
     * @param {NetworkManager} network 
     * @param {Phaser.Scene} scene 
     * @param {import("shared/entity-config.json")} entityConfig
     */
    constructor(network, scene, entityConfig) {
        this.network = network;
        this.scene = scene;
        this.shipConfig = entityConfig.ship;

        this.localPlayer = null;

        this.shipList = {};
        this.playerList = {};
    }

    init() {
        // Init game contains all ships/players, game state contains only those that changed
        this.network.on(ServerEvent.INIT_GAME, (data) => this.onSync(data));
        this.network.on(ServerEvent.GAME_STATE, (data) => this.onSync(data));
    }

    onSync(data) {
        data.ships?.forEach(shipData => {
            // Only create the ship if not already in the list
            if (!this.shipList[shipData.id]) {
                this.shipList[shipData.id] = new ShipModel(
                    this.scene,
                    shipData.id,
                    shipData.x,
                    shipData.y,
                    this.shipConfig
                );
            }
        });

        data.players?.forEach(playerData => {
            let player = this.playerList[playerData.id]

            // Only create the player if not already in the list
            if (!player) {
                this.playerList[playerData.id] = new PlayerModel(
                    this.scene,
                    playerData.id,
                    playerData.x,
                    playerData.y);
            }

            if (player.parentId !== playerData.parentId) {
                const newParentId = playerData.parentId;

                if (newParentId && this.shipList[newParentId]) {
                    this.shipList[newParentId].add(player);
                } else {
                    this.scene.add.existing(player);
                }


                player.x = playerData.x;
                player.y = playerData.y;
                player.parentId = newParentId;
            }

            player.update(playerData);
        });

        // Get the current player
        if (!this.localPlayer && this.playerList[this.network.socket.id]) {
            this.localPlayer = this.playerList[this.network.socket.id];
        }
    }
    
}