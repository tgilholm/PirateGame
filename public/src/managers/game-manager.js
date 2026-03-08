import { ClientEvent, ServerEvent } from "shared/built/socket-protocol.js";
import NetworkManager from "./network-manager.js";
import PlayerModel from "../models/player-model.js";
import InputManager from "./input-manager.js";
import ModelFactory from "./model-factory.js";
import Model from "../models/model.js";
import { MainScene } from "../scenes/main-scene.js";

/**
 * Client side state manager. Keeps track of players in game, handles
 * events for the current player and updates all entities.
 */
export default class GameManager extends Phaser.Events.EventEmitter {

    #playerListCache;

    /**
     * Abstracts game state from the phaser scene
     * @param {MainScene} scene the main scene 
     * @param {NetworkManager} network abstracts io events
     * @param {InputManager} input abstracts key inputs
     * @param {ModelFactory} modelFactory to create client-side models
     */
    constructor(scene, network, input, modelFactory) {
        super();
        this.network = network;
        this.scene = scene;
        this.input = input;
        this.modelFactory = modelFactory;
        this.#playerListCache = null;

        this.moveTimer = 0;

        /** @type {PlayerModel} */
        this.localPlayer = null;
        this.playerId = null;
        this.playerListDirty = true;

        /** @type {Map<string, Model>} */
        this.entities = new Map();  // generic entity list

        this.interactables = [];
        this.closestInteractable = null;


        this.startListeners();
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
        const pos = this.localPlayer.worldPos;

        // Send packets at the server tick rate instead of spamming 60 times a second
        this.moveTimer = (this.moveTimer) + delta;
        if (this.moveTimer >= 1000 / 20) {  // match server tick rate
            this.network.sendMove(inputs);
            this.moveTimer = 0;
        }

        // Move the invisible camera target to the local player's current position
        this.scene.cameraTarget.x = pos.x;
        this.scene.cameraTarget.y = pos.y;

        // Ladders are accessible both off and on ships
        const closest = this.getClosestInteractable(this.localPlayer);
        if (closest && closest.dist < 50) {
            if (closest.item.type === 'ladder' || this.localPlayer.parentId == closest.item.parentId) { // handles both === null
                this.closestInteractable = closest;
            }
        } else {
            this.closestInteractable = null;
        }

        // Update all entities at once
        this.entities.forEach((entity) => {
            if (entity === this.localPlayer) {
                entity.target.r = inputs.aimAngle;  // shortcut the aim angle for local player
            }
            entity.update(delta);
        })
    }

    onFullSync(data) {
        // Reset the map to 0
        this.entities.forEach(e => e.destroy());
        this.entities.clear();
        this.interactables = [];
        this.localPlayer = null;    // clear local
        this.playerListDirty = true;
        this.#playerListCache = null; // invalidate cache

        // Start fresh with new entity data
        data.entities?.forEach(entityData => this.applyFull(entityData));
        this.resolveLocalPlayer();
        this.refreshInteractables();
    }

    onDeltaSync(data) {
        let shipsChanged = false;

        // Keep track of changes to ships to regenerate interactables
        data.newEntities?.forEach(entityData => {
            this.applyFull(entityData);
            if (entityData.type === 'ship') shipsChanged = true;
            if (entityData.type === 'player') this.playerListDirty = true; this.#playerListCache = null;
        });

        // Apply changes
        data.deltaEntities?.forEach(delta => this.applyDelta(delta));

        // Apply removals
        data.removedIds?.forEach(id => {
            const removedType = this.removeEntity(id)?.entityType;
            if (removedType === 'player') this.playerListDirty = true; this.#playerListCache = null;
            if (removedType === 'ship') shipsChanged = true;
        });

        if (shipsChanged) this.refreshInteractables(); // regenerate the list
        this.resolveLocalPlayer();
    }

    applyFull(data) {
        let model = this.entities.get(data.id);

        if (!model) {
            model = this.modelFactory.create(data); // create the entity if it doesn't exist

            if (!model) return; // factory failed to create
            this.entities.set(data.id, model);  // add to map
        }

        // @ts-ignore reparent the player if they left a ship
        if (data.type === 'player') this.handleReparent(model, data);

        model.sync(data);
    }

    applyDelta(delta) {
        const model = this.entities.get(delta.id);
        if (!model) return;

        if (model.entityType === 'player' && delta.parentId !== undefined) {
            // @ts-ignore
            this.handleReparent(model, delta);
        }

        model.sync(delta);
    }

    removeEntity(id) {
        const model = this.entities.get(id);
        if (!model) {
            console.debug(`[GameManager] removeEntity: "${id}" not found, already removed?`);
            return undefined;
        }

        // Remove players from ship before deleting it
        if (model.entityType === 'ship') {
            this.entities.forEach(entity => {
                // @ts-ignore
                if (entity.entityType === 'player' && entity.parentId === id) {
                    model.remove(entity);               // detach from container
                    this.scene.add.existing(entity);    // re-anchor to scene root
                    // @ts-ignore
                    entity.parentId = null;
                }
            });
        }

        model.destroy();
        this.entities.delete(id);
        return model;
    }

    /** @returns {Map<string, import("../models/player-model.js").default>} */
    get playerList() {
        if (!this.#playerListCache) {
            this.#playerListCache = new Map();
            this.entities.forEach((entity, id) => {
                if (entity.entityType === 'player') this.#playerListCache.set(id, entity);
            });
        }
        return this.#playerListCache;
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

        // Send the one-off events directly to the server
        this.input.on('fire', () => this.network.sendFire());
        this.input.on('release', () => this.network.sendRelease());
    }

    /**
     * Helper method to add all existing interactables to the internal list
     */
    refreshInteractables() {
        this.interactables = [];
        this.entities.forEach(entity => {
            if (entity.entityType === 'ship') {
                //@ts-ignore
                this.interactables.push(...entity.interactables);
            }
        });
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
     * Handle moving a player into a ship object and vice versa
     * @param {PlayerModel} player the player for which reparenting is handled
     * @param {Object} data the data from the server
     */
    handleReparent(player, data) {
        if (player.parentId === data.parentId) return;
        this.closestInteractable = null;    // reset closest interactable

        const ship = data.parentId ? this.entities.get(data.parentId) : null;

        if (ship) {
            ship.add(player);
        } else {
            this.scene.add.existing(player);
        }

        player.setPosition(data.x ?? player.x, data.y ?? player.y);
        player.parentId = data.parentId ?? null;

        // Snap interpolation targets so movement feels instant on reparent
        if (data.x !== undefined) player.target.x = data.x;
        if (data.y !== undefined) player.target.y = data.y;
    }

    /**
    * Finds and assigns the local player when they have joined
    */
    resolveLocalPlayer() {
        if (this.localPlayer || !this.playerId) return;

        const mine = this.entities.get(this.playerId);
        if (mine) {
            // @ts-ignore
            this.localPlayer = mine;
            this.emit('localPlayerReady', this.localPlayer);
        }
    }
}