import { ServerEvent } from "shared/built/socket-protocol.js";
import NetworkManager from "./network-manager.js";
import ShipModel from "../models/ship-model.js";
import PlayerModel from "../models/player-model.js";

export default class GameManager extends Phaser.Events.EventEmitter {
    /**
     * 
     * @param {NetworkManager} network 
     * @param {Phaser.Scene} scene 
     * @param {import("shared/entity-config.json")} entityConfig
     */
    constructor(network, scene, entityConfig) {
        super();
        this.network = network;
        this.scene = scene;
        this.shipConfig = entityConfig.ship;

        this.localPlayer = null;
        this.closestInteractable = null;
        this.playerId = null;

        this.shipList = {};
        this.interactables = [];
        this.playerList = {};

        this.network.on(ServerEvent.INIT_GAME, (data) => {
            this.playerId = data.id;
            this.onSync(data);
        });
        this.network.on(ServerEvent.GAME_STATE, (data) => this.onSync(data));
    }

    refreshInteractables() {
        this.interactables = [];
        Object.values(this.shipList).forEach(ship => {
            this.interactables.push(...ship.interactables);
        })
    }

    getClosestInteractable(player) {
        let closest = null;
        let nearestDist = Infinity;

        const playerMatrix = player.getWorldTransformMatrix();
        const px = playerMatrix.tx;
        const py = playerMatrix.ty;

        this.interactables.forEach(item => {
            const itemMatrix = item.getWorldTransformMatrix();
            const ix = itemMatrix.tx;
            const iy = itemMatrix.ty;

            const dist = Phaser.Math.Distance.Between(px, py, ix, iy);

            if (dist < nearestDist) {
                nearestDist = dist;
                closest = { item, dist };
            }
        });

        return closest;
    }

    update() {
        this.refreshInteractables();
        if (!this.localPlayer) return;

        const matrix = this.localPlayer.getWorldTransformMatrix();

        //@ts-ignore
        this.scene.cameraTarget.x = matrix.tx;
        //@ts-ignore
        this.scene.cameraTarget.y = matrix.ty;

        Object.values(this.shipList).forEach(ship => {
            ship.getWorldTransformMatrix(); 
        });


        const closest = this.getClosestInteractable(this.localPlayer);
        if (closest && closest.dist < 30) {
            this.closestInteractable = closest;
        } else {
            this.closestInteractable = null;
        }


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

            this.shipList[shipData.id].update(shipData, this.scene.game.loop.delta);
        });


        data.players?.forEach(playerData => {
            let player = this.playerList[playerData.id]

            // Only create the player if not already in the list
            if (!player) {
                player = new PlayerModel(
                    this.scene,
                    playerData.id,
                    playerData.x,
                    playerData.y
                );
                this.playerList[playerData.id] = player;
            }

            if (player.parentId !== playerData.parentId) {
                const newParentId = playerData.parentId;

                if (newParentId && this.shipList[newParentId]) {
                    this.shipList[newParentId].add(player);
                    player.setPosition(playerData.x, playerData.y);
                } else {
                    this.scene.add.existing(player);
                    player.setPosition(playerData.x, playerData.y);
                }
                player.parentId = newParentId;
            }

            player.update(playerData);
        });


        if (!this.localPlayer && this.playerId) {
            const mine = this.playerList[this.playerId];
            if (mine) {
                this.localPlayer = mine;
                this.emit('localPlayerReady', this.localPlayer);
            }
        }
    }

}