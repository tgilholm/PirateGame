import { ClientEvent, ServerEvent } from "shared/built/socket-protocol.js";
import NetworkManager from "./network-manager.js";
import PlayerModel from "../models/player-model.js";
import InputManager from "./input-manager.js";
import ModelFactory from "./model-factory.js";
import Model from "../models/model.js";
import { MainScene } from "../scenes/main-scene.js";
import CannonModel from "../models/cannon-model.js";
import ShipModel from "../models/ship-model.js";

/**
 * Client side state manager. Keeps track of players in game, handles
 * events for the current player and updates all models.
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
        this.projectiles = [];
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
        this.models = new Map();  // generic entity list

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

        // Update all models at once
        this.models.forEach((entity) => {
            if (entity === this.localPlayer) {
                entity.target.r = inputs.aimAngle;  // shortcut the aim angle for local player
            }
            entity.update(delta);
        });

        const now = Date.now();
        this.models.forEach((entity, id) => {
            if (entity.isPredicted && now - entity.spawnTime > 500) {
                entity.destroy();
                this.models.delete(id);
            }
        });

    }

    /**
     * Removes and creates all models from the full server sync- this is invoked
     * on the INIT_GAME packet and should not be used thereafter
     * @param {Object} data the data from the server
     */
    onFullSync(data) {
        // Reset the map to 0
        this.models.forEach(e => e.destroy());
        this.models.clear();
        this.interactables = [];
        this.localPlayer = null;    // clear local
        this.playerListDirty = true;
        this.#playerListCache = null; // invalidate cache

        // Start fresh with new entity data
        data.entities?.forEach(entityData => this.applyFull(entityData));
        this.resolveLocalPlayer();
        this.refreshInteractables();
    }

    /**
     * Updates only the models that have changed since the last game state packet from the server,
     * or those that have come into the view distance of the player
     * @param {Object} data the data from the server
     */
    onDeltaSync(data) {
        let needsInteractableRefresh = false;

        data.newEntities?.forEach(entityData => {
            this.applyFull(entityData);
            if (entityData.type === 'ship') needsInteractableRefresh = true;
            if (entityData.isInteractable || entityData.type !== undefined) needsInteractableRefresh = true;
            if (entityData.type === 'player') { this.playerListDirty = true; this.#playerListCache = null; }
        });

        data.deltaEntities?.forEach(delta => this.applyDelta(delta));

        data.removedIds?.forEach(id => {
            const removed = this.removeEntity(id);
            const removedType = removed?.entityType;
            if (removedType === 'player') { this.playerListDirty = true; this.#playerListCache = null; }
            if (removedType === 'ship') needsInteractableRefresh = true;
            if (removed?.isInteractable) needsInteractableRefresh = true;
        });

        if (needsInteractableRefresh) this.refreshInteractables();
        this.resolveLocalPlayer();
    }

    /**
     * Applies a full sync to the model specified in the data from the server. Handles
     * creating new models and re-parenting existing ones.
     * @param {Object} data the data from the server
     */
    applyFull(data) {
        let model = this.models.get(data.id);

        if (!model) {
            // Before creating, check if there's a predicted projectile nearby to replace
            if (data.type === 'projectile') {
                const predicted = this.findMatchingPrediction(data.x, data.y);
                if (predicted) {
                    // Remap the real id onto the predicted model so it syncs correctly
                    this.models.delete(predicted.id);
                    predicted.id = data.id;
                    predicted.isPredicted = false;
                    this.models.set(data.id, predicted);
                    predicted.sync(data);
                    return;
                }
            }

            model = this.modelFactory.create(data);
            if (!model) return;
            this.models.set(data.id, model);
        }

        // @ts-ignore reparent the player if they left a ship
        if (data.type === 'player') this.handleReparent(model, data);

        model.sync(data);
    }

    findMatchingPrediction(x, y) {
        let closest = null;
        let closestDist = 150; // max snap distance in pixels — tune this

        this.models.forEach(model => {
            if (!model.isPredicted) return;
            const dist = Phaser.Math.Distance.Between(model.x, model.y, x, y);
            if (dist < closestDist) {
                closestDist = dist;
                closest = model;
            }
        });

        return closest;
    }

    /**
     * Applies a delta sync to the model specified in the data from the server. 
     * @param {Object} delta the data from the server
     */
    applyDelta(delta) {
        const model = this.models.get(delta.id);
        if (!model) return;

        if (model.entityType === 'player' && delta.parentId !== undefined) {
            // @ts-ignore
            this.handleReparent(model, delta);
        }

        model.sync(delta);
    }

    /**
     * Deletes a model from the internal map, removing any child models before themselves
     * @param {string} id the id of the model to delete 
     * @returns the deleted model 
     */
    removeEntity(id) {
        const model = this.models.get(id);
        if (!model) {
            console.debug(`[GameManager] removeEntity: "${id}" not found, already removed?`);
            return undefined;
        }

        // Remove players from ship before deleting it
        if (model.entityType === 'ship') {
            this.models.forEach(entity => {
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
        this.models.delete(id);
        return model;
    }

    /** @returns {Map<string, import("../models/player-model.js").default>} */
    get playerList() {
        if (!this.#playerListCache) {
            this.#playerListCache = new Map();
            this.models.forEach((entity, id) => {
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

        // Delta packet: full for new models and known models that have changed
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

        this.input.on('dig', () => {
            this.network.sendDig();
        });

        // Send the one-off events directly to the server
        this.input.on('fire', () => {
            this.network.sendFire();
            this.spawnPredictedProjectile();
        });
        this.input.on('release', () => this.network.sendRelease());
    }

    spawnPredictedProjectile() {
        const player = this.localPlayer;
        if (!player) return;

        // Compute fresh aim angle directly from mouse position
        const cam = this.scene.cameras.main;
        const mouseWorldX = this.scene.input.mousePointer.x / cam.zoom + cam.scrollX;
        const mouseWorldY = this.scene.input.mousePointer.y / cam.zoom + cam.scrollY;
        const playerPos = player.worldPos;
        const freshAimAngle = Math.atan2(mouseWorldY - playerPos.y, mouseWorldX - playerPos.x);

        let worldAngle, spawnX, spawnY;

        if (player.isUsingCannon) {
            const cannon = [...this.interactables].find(i => i.type === 'cannon' && i.userId === player.id);
            if (!cannon || cannon.reloadTimer > 0) return;

            const ship = this.models.get(player.parentId);
            worldAngle = (ship?.target.r ?? 0) + cannon.target.r;

            const pos = cannon.worldPos;
            spawnX = pos.x + Math.cos(worldAngle) * 20;
            spawnY = pos.y + Math.sin(worldAngle) * 20;
        } else {
            if (player.reloadTimer > 0) return;
            worldAngle = freshAimAngle; // fresh, not interpolated
            spawnX = player.gun.x;
            spawnY = player.gun.y;
        }


        const speed = 600;
        const model = this.modelFactory.createProjectile({
            id: `predicted_${Date.now()}`,
            x: spawnX,
            y: spawnY,
            r: worldAngle
        });
        model.velocity.x = Math.cos(worldAngle) * speed;
        model.velocity.y = Math.sin(worldAngle) * speed;
        model.isPredicted = true;
        model.initialised = true; // already positioned correctly, don't snap on server confirmation
        model.spawnTime = Date.now();
        this.models.set(model.id, model);
    }

    /**
     * Helper method to add all existing interactables to the internal list
     */
    refreshInteractables() {
        this.interactables = [];
        this.models.forEach(entity => {
            if (entity.isInteractable) this.interactables.push(entity);
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

        const ship = data.parentId ? this.models.get(data.parentId) : null;

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

        const mine = this.models.get(this.playerId);
        if (mine) {
            // @ts-ignore
            this.localPlayer = mine;
            this.emit('localPlayerReady', this.localPlayer);
        }
    }
}