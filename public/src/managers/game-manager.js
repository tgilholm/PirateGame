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
        this.interactableDefaults = entityConfig.defaults?.interactable ?? {};

        this.localPlayer = null;
        this.closestInteractable = null;
        this.playerId = null;
        this.wasNearShop = false;

        this.shipList = {};
        this.interactables = [];
        this.playerList = {};

        this.network.on(ServerEvent.INIT_GAME, (data) => {
            this.playerId = data.id;
            this.onSync(data);
        });
        this.network.on(ServerEvent.GAME_STATE, (data) => this.onSync(data));
    }

    //called after DrawShops, is constructed in main-scene
    setShops(drawShops) {
        this._shopInteractables = drawShops.shops;
    }

    refreshInteractables() {
        this.interactables = [];
        Object.values(this.shipList).forEach(ship => {
            this.interactables.push(...ship.interactables);
        });
        //static interactables for UIManager
        if (this._shopInteractables) {
            this.interactables.push(...this._shopInteractables);
        }
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
        this.closestInteractable = null;

        if (closest) {
            const item = closest.item;
            const range = item.interactRange ?? this.interactableDefaults.interactRange;

            if (item.parentContainer) {
                //interactable is mounted on a ship
                if (item.type === 'ladder') {
                    //player vs ladder world coordinates world position
                    const { x: lx, y: ly } = item.getWorldPosition();
                    const pm = this.localPlayer.getWorldTransformMatrix();
                    if (Phaser.Math.Distance.Between(pm.tx, pm.ty, lx, ly) <= range) {
                        this.closestInteractable = closest;
                    }
                } else if (closest.dist <= range) {
                    this.closestInteractable = closest;
                }
            } else if (closest.dist <= range && !this.localPlayer.parentId) {
                this.closestInteractable = closest;
            }
        }

        const isNearShop = this.closestInteractable?.item?.type === 'shop';
        if (this.wasNearShop && !isNearShop) {
            this.emit('shopClose');
        }
        this.wasNearShop = isNearShop;


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
                    this.shipConfig,
                    this.interactableDefaults
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

    //returns component variants for players ship. null if unavailable
    getLocalShipComponents() {
        if (!this.playerId) return null;
        const ship = this.shipList["ship_" + this.playerId];
        return ship ? ship.components : null;
    }

}