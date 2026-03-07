import { ClientEvent, ServerEvent } from "shared/built/socket-protocol.js";
import NetworkManager from "./network-manager.js";
import ShipModel from "../models/ship-model.js";
import PlayerModel from "../models/player-model.js";
import InputManager from "./input-manager.js";

/**
 * Client side state manager. Keeps track of players in game, handles
 * events for the current player and updates all entities.
 */
export default class GameManager extends Phaser.Events.EventEmitter {

    /**
     * Abstracts game state from the phaser scene
     * @param {Phaser.Scene} scene the Phaser scene to control
     * @param {import("../../../shared/browser/entity-config.json")} entityConfig
     * @param {NetworkManager} network abstracts io events
     * @param {InputManager} input abstracts key inputs
     */
    constructor(scene, entityConfig, network, input) {
        super();
        this.network = network;
        this.scene = scene;
        this.shipConfig = entityConfig.ship;
        this.input = input;
        this.moveTimer = 0;

        /** @type {PlayerModel} */
        this.localPlayer = null;
        this.closestInteractable = null;
        this.playerListDirty = false;
        this.playerId = null;

        this.shipList = {};
        this.playerList = {};
        this.interactables = [];

        this.playerArray = [];
        this.shipArray = [];


        this.startListeners();
    }

    /**
     *  Sets up the NetworkManager listeners to respond to updates from
     * the server and routes input events from the InputManager
     */
    startListeners() {
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

    /**
     * Helper method to add all existing interactables to the internal list
     */
    refreshInteractables() {
        this.interactables = [];
        Object.values(this.shipList).forEach(ship => {
            this.interactables.push(...ship.interactables);
        })
    }

    /**
     * Helper method to find the closest interactable object to the player,
     * using the world coordinates of both
     * @param {PlayerModel} player 
     * @returns {Object} the closest interactable
     */
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

    /**
     * Sends the READY event to the server, indicating the client has 
     * fully loaded in and is ready to receive the INIT_GAME packet. This step
     * prevents the client from missing the setup data.
     * @param {string} username 
     */
    start(username) {
        this.network.emit(ClientEvent.READY, { username: username });
    }

    /**
     * Refreshes all client-side objects.
     */
    update() {
        if (!this.localPlayer) return;  // dont do anything until the player has joined

        const delta = this.scene.game.loop.delta;
        const inputs = this.input.getInputs(this.scene, this.localPlayer);
        const matrix = this.localPlayer.getWorldTransformMatrix();

        this.moveTimer = (this.moveTimer || 0) + delta;
        if (this.moveTimer >= 1000 / 20) {  // match server tick rate
            this.network.sendMove(inputs);
            this.moveTimer = 0;
        }

        // Move the invisible camera target to the local player's current position
        //@ts-ignore
        this.scene.cameraTarget.x = matrix.tx;
        //@ts-ignore
        this.scene.cameraTarget.y = matrix.ty;

        // Ladders are accessible both off and on ships
        const closest = this.getClosestInteractable(this.localPlayer);
        if (closest && closest.dist < 50) {
            if (closest.item.type === 'ladder' || this.localPlayer.parentId == closest.item.parentId) {
                this.closestInteractable = closest;
            }
        } else {
            this.closestInteractable = null;
        }

        this.shipArray.forEach(ship => ship.update(delta));
        this.playerArray.forEach((player) => {
            if (player === this.localPlayer) {
                player.target.aimAngle = inputs.aimAngle; // update target first
            }
            player.update(delta);
        });
    }



    /**
     * Updates the client-side model of the game from the data provided
     * from the server
     * @param {Object} data the data received from the server
     */
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
                this.refreshInteractables();
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
                this.playerListDirty = true;
            }

            /*
            If the player has just entered or left a ship, add/remove them to/from
            that ship's Phaser container, and snap their position immediately instead
            of interpolating
            */
            if (player.parentId !== playerData.parentId) {
                const newParentId = playerData.parentId;

                if (newParentId && this.shipList[newParentId]) {
                    // Add to the ship
                    this.shipList[newParentId].add(player);
                    player.setPosition(playerData.x, playerData.y);
                } else {
                    // Add back to the world
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

        // Finds the current player from the list of incoming ones
        if (!this.localPlayer && this.playerId) {
            const mine = this.playerList[this.playerId];
            if (mine) {
                this.localPlayer = mine;
                this.emit('localPlayerReady', this.localPlayer);
            }
        }

        this.shipArray = Object.values(this.shipList); // rebuild only in onSync
        this.playerArray = Object.values(this.playerList);
    }
}