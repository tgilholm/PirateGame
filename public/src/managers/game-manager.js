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
        // Full state packet: replace all entity data
        this.network.on(ServerEvent.INIT_GAME, (data) => {
            this.playerId = data.id;
            this.onFullSync(data); // get everything
        });

        // Delta packet: full for new entities and known entities that have changed
        this.network.on(ServerEvent.GAME_STATE, (data) => this.onDeltaSync(data));

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

        // Send packets at the server tick rate instead of spamming 60 times a second
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
            
            console.log(`Player: ${player.id}, x: ${player.x}, y:${player.y}`);

        });


    }

    /**
     * Handles the init game packet by creating all entities
     * provided with their full data
     * @param {Object} data the data from the server
     */
    onFullSync(data) {
        // Process all ships and players as full state
        data.ships?.forEach(shipData => this.applyFullShip(shipData));
        data.players?.forEach(playerData => this.applyFullPlayer(playerData));
        this.resolveLocalPlayer();

        this.shipArray = Object.values(this.shipList);
        this.playerArray = Object.values(this.playerList);
    }

    /**
    * Handles the game state packet by using the full state for entities entering
    * the view range, and the partial state for known entities that have changed
    * @param {Object} data the data from the server
    */
    onDeltaSync(data) {
        // Full state for newly visible entities
        data.newShips?.forEach(shipData => this.applyFullShip(shipData));
        data.newPlayers?.forEach(playerData => this.applyFullPlayer(playerData));

        // Delta updates for known entities: only update fields present in packet
        data.deltaShips?.forEach(delta => this.applyDeltaShip(delta));
        data.deltaPlayers?.forEach(delta => this.applyDeltaPlayer(delta));

        // Remove out-of-range entities
        if (data.removedIds) {
            data.removedIds.forEach(id => {
                // Players
                if (this.playerList[id]) {
                    this.playerList[id].destroy();
                    delete this.playerList[id];
                }
                // Ships
                if (this.shipList[id]) {
                    this.shipList[id].destroy();
                    delete this.shipList[id];
                    this.refreshInteractables();
                }
            });
        }

        this.resolveLocalPlayer();  // get the local player

        this.shipArray = Object.values(this.shipList);
        this.playerArray = Object.values(this.playerList);
    }

    /**
     * Creates or fully updates a ship from a complete data object.
     * @param {Object} shipData the data about a specific ship
    */
    applyFullShip(shipData) {
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
        this.shipList[shipData.id].syncFromServer(shipData);
    }

    /**
    * Creates or fully updates a player from a complete data object.
    * @param {Object} playerData the data about a specific player
    */
    applyFullPlayer(playerData) {
        let player = this.playerList[playerData.id];

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

        this.handleReparent(player, playerData); // if leaving/joining a ship
        player.syncFromServer(playerData); // full update
    }

    /**
     * Applies a delta (partial change) to a ship
     * @param {Object} delta the changes from the server 
     */
    applyDeltaShip(delta) {
        const ship = this.shipList[delta.id];
        if (!ship) return; // shouldn't happen but guard anyway
        ship.syncDelta(delta);
    }

    /**
     * Applies a delta (partial change) to a palyer
     * @param {Object} delta the changes from the server 
     */
    applyDeltaPlayer(delta) {
        const player = this.playerList[delta.id];
        if (!player) return;

        // reparent if the id changed
        if (delta.parentId !== undefined) {
            this.handleReparent(player, delta);
        }

        player.syncDelta(delta);
    }

    /**
     * Handle moving a player into a ship object and vice versa
     * @param {PlayerModel} player the player for which reparenting is handled
     * @param {Object} playerData the data from the server
     */
    handleReparent(player, playerData) {
        if (player.parentId === playerData.parentId) return;

        const newParentId = playerData.parentId;

        if (newParentId && this.shipList[newParentId]) {
            this.shipList[newParentId].add(player);
            player.setPosition(playerData.x ?? player.x, playerData.y ?? player.y);
        } else {
            this.scene.add.existing(player);
            player.setPosition(playerData.x ?? player.x, playerData.y ?? player.y);
        }

        player.parentId = newParentId;

        // Snap interpolation targets on reparent
        if (playerData.x !== undefined) player.target.x = playerData.x;
        if (playerData.y !== undefined) player.target.y = playerData.y;
    }

    /**
    * Finds and assigns the local player when they have joined
    */
    resolveLocalPlayer() {
        if (!this.localPlayer && this.playerId) {
            const mine = this.playerList[this.playerId];
            if (mine) {
                this.localPlayer = mine;
                this.emit('localPlayerReady', this.localPlayer);
            }
        }
    }
}