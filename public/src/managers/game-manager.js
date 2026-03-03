import { ClientEvent, ServerEvent } from "shared/built/socket-protocol.js";
import NetworkManager from "./network-manager.js";
import ShipModel from "../models/ship-model.js";
import PlayerModel from "../models/player-model.js";
import InputManager from "./input-manager.js";

export default class GameManager extends Phaser.Events.EventEmitter {

    /**
     * 
     * @param {Phaser.Scene} scene 
     * @param {import("server/src/types.js").EntityConfig} entityConfig 
     * @param {NetworkManager} network 
     * @param {InputManager} input =
     */
    constructor(scene, entityConfig, network, input) {
        super();
        this.network = network;
        this.scene = scene;
        this.shipConfig = entityConfig.ship;
        this.input = input;

        /** @type {PlayerModel} */
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

        this.input.on('interact', () => {
            const target = this.closestInteractable;
            if (target?.item) {
                const closest = target.item;
                this.network.sendInteract({
                    targetId: closest.id,
                    targetType: closest.type,
                    parentId: closest.parentId
                });
            }
        });

        this.input.on('fire', () => this.network.sendFire());
        this.input.on('release', () => this.network.sendRelease());
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

    start(username) {
        this.network.emit(ClientEvent.READY, { username: username });
    }

    update() {
        const delta = this.scene.game.loop.delta;
        const inputs = this.input.getInputs(this.scene);
        this.network.sendMove(inputs);


        // Tick all ships every frame
        Object.values(this.shipList).forEach(ship => {
            ship.update(null, delta);
        });

        // Tick all players every frame
        Object.values(this.playerList).forEach(/** @type {PlayerModel}*/player => {
            player.update(delta);

            const gun = this.localPlayer.gun;
            const parentRotation = player.parentContainer?.rotation ?? 0;
            const radius = 15;
            gun.x = Math.cos(inputs.aimAngle - parentRotation) * radius;
            gun.y = Math.sin(inputs.aimAngle - parentRotation) * radius;
            gun.setRotation(inputs.aimAngle - parentRotation);

        });

        this.refreshInteractables();
        if (!this.localPlayer) return;

        const matrix = this.localPlayer.getWorldTransformMatrix();

        //@ts-ignore
        this.scene.cameraTarget.x = matrix.tx;
        //@ts-ignore
        this.scene.cameraTarget.y = matrix.ty;

        const closest = this.getClosestInteractable(this.localPlayer);
        if (closest && closest.dist < 50) {
            if (closest.item.type === 'ladder' || this.localPlayer.parentId == closest.item.parentId) {
                this.closestInteractable = closest;
            }
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

            /** @type {ShipModel} */
            let ship = this.shipList[shipData.id];
            ship.syncFromServer(shipData);
        });


        data.players?.forEach(playerData => {
            /** @type {PlayerModel} */
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

                // Snap on re-parent
                player.target.x = playerData.x;
                player.target.y = playerData.y;
            }

            player.syncFromServer(playerData);
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