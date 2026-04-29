import { ClientEvent, ServerEvent } from 'shared/built/socket-protocol.js';
import NetworkManager from './network-manager.js';
import PlayerModel from '../models/player-model.js';
import InputManager from './input-manager.js';
import ModelFactory from './model-factory.js';
import Model from '../models/model.js';
import { MainScene } from '../scenes/main-scene.js';
import InteractableModel from '../models/interactable-model.js';
import DigMinigame from '../ui/dig-minigame.js';
import ShipModel from '../models/ship-model.js';

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
		this.digMinigame = new DigMinigame();
		this.moveTimer = 0;
		this.playerListDirty = true;
		/** @type {PlayerModel} */
		this.localPlayer = null;
		this.playerId = null;
		this.interactables = new Set();

		/** @type {Map<string, Model>} */
		this.models = new Map(); // generic entity list

		this.closestInteractable = null;

		this.minimalPlayers = [];
		this.minimalNPCs = [];
		this.minimalShips = [];
		this.minimalInteractables = [];

		this.startListeners();
	}

	/**
	 * Sends the READY event to the server, indicating the client has
	 * fully loaded in and is ready to receive the INIT_GAME packet. This step
	 * prevents the client from missing the setup data.
	 * @param {string} username
	 */
	start(username, pirateColour = 'default') {
		this.pirateColour = pirateColour;
		this.network.emit(ClientEvent.READY, { username, pirateColour });
	}
	/**
	 * Refreshes all client-side objects.
	 */
	update() {
		if (!this.localPlayer) return; // dont do anything until the player has joined

		const delta = this.scene.game.loop.delta;

		//send dig game packets to server
		if (this.digMinigame) {
			this.digMinigame.update(delta / 1000);
		}
		const inputs = this.input.getInputs(this.scene, this.localPlayer);
		const pos = this.localPlayer.worldPos;

		// Send packets at the server tick rate instead of spamming 60 times a second
		this.moveTimer += delta;
		if (this.moveTimer >= 1000 / 20) {
			this.network.sendMove(inputs);
			this.moveTimer = 0;
		}

		// Move the invisible camera target to the local player's current position
		this.scene.cameraTarget.x = pos.x;
		this.scene.cameraTarget.y = pos.y;

		// Ladders are accessible both off and on ships

		/** @type {Object} */
		let closest = null;
		let nearestDist = Infinity;
		this.models.forEach((entity, id) => {
			if (entity === this.localPlayer && entity instanceof PlayerModel) {
				this.localPlayer.aimAngle = inputs.aimAngle; // shortcut the aim angle for local player
			}

			// This replaces the getClosestInteractable function, avoiding another for loop
			if (entity instanceof InteractableModel) {
				const dist = this.getDistanceToInteractable(this.localPlayer, entity);
				if (dist < nearestDist) {
					if (entity.id !== this.localPlayer.carryingId) {
						nearestDist = dist;
						closest = { entity, dist };
					}
				}

				this.interactables.add(entity);
			}

			entity.update(delta);
		});

		// Determine if the player "should" send the interact packet
		if (closest && closest.dist < 75) {
			if (closest.entity.type === 'ladder' || this.localPlayer.parentId == closest.entity.parentId) {
				// handles both === null
				this.closestInteractable = closest;
			}
		} else {
			this.closestInteractable = null;
		}
	}

	/**
	 * Convenience method for determining the distance of an interactable object to the player
	 * @param {PlayerModel} player
	 * @param {InteractableModel} item
	 */
	getDistanceToInteractable(player, item) {
		const itemPos = item.worldPos;
		const ix = itemPos.x;
		const iy = itemPos.y;

		const playerPos = player.worldPos;
		const px = playerPos.x;
		const py = playerPos.y;

		return Phaser.Math.Distance.Between(px, py, ix, iy);
	}

	/**
	 * Removes and creates all models from the full server sync- this is invoked
	 * on the INIT_GAME packet and should not be used thereafter
	 * @param {Object} data the data from the server
	 */
	onFullSync(data) {
		this.models.forEach((e) => e.destroy());
		this.models.clear();
		this.localPlayer = null; // clear local
		this.playerListDirty = true;
		this.#playerListCache = null; // invalidate cache

		// Start fresh with new entity data
		data.entities?.forEach((entityData) => this.applyFull(entityData));
		this.resolveLocalPlayer();
	}

	/**
	 * Updates only the models that have changed since the last game state packet from the server,
	 * or those that have come into the view distance of the player
	 * @param {Object} data the data from the server
	 */
	onDeltaSync(data) {
		if (data.minimalPlayers) {
			this.minimalPlayers = data.minimalPlayers;
			this.playerListDirty = true;
		}

		if (data.minimalShips) this.minimalShips = data.minimalShips;
		if (data.minimalNPCs) this.minimalNPCs = data.minimalNPCs;
		if (data.minimalInteractables) this.minimalInteractables = data.minimalInteractables;

		data.newEntities?.forEach((entityData) => {
			this.applyFull(entityData);
			if (entityData.type === 'player') {
				this.playerListDirty = true;
				this.#playerListCache = null;
			}
		});

		data.deltaEntities?.forEach((delta) => this.applyDelta(delta));

		data.removedIds?.forEach((id) => {
			const removed = this.removeEntity(id);
			const removedType = removed?.entityType;
			if (removedType === 'player') {
				this.playerListDirty = true;
				this.#playerListCache = null;
			}
		});

		this.resolveLocalPlayer();

		// Forward cannonball splash effects to the AnimationManager
		if (data.splashEvents?.length) {
			this.scene.animationManager?.handleSplashEvents(data.splashEvents);
		}
	}

	/**
	 * Applies a full sync to the model specified in the data from the server. Handles
	 * creating new models and re-parenting existing ones.
	 * @param {Object} data the data from the server
	 */
	applyFull(data) {
		let model = this.models.get(data.id);

		if (!model) {
			model = this.modelFactory.create(data);
			if (!model) return;
			this.models.set(data.id, model);
		}
		// @ts-ignore reparent the player if they left a ship
		if (data.type === 'player') this.handleReparent(model, data);
		if (data.type === 'treasure') this.handleTreasureReparent(model, data);
		model.sync(data);
	}

	/**
	 * Applies a delta sync to the model specified in the data from the server.
	 * @param {Object} delta the data from the server
	 */
	applyDelta(delta) {
		const model = this.models.get(delta.id);
		if (!model) return;
		// @ts-ignore
		if (model instanceof PlayerModel && delta.parentId !== undefined) {
			this.handleReparent(model, delta);
		}

		if (model.entityType === 'treasure' && delta.parentId !== undefined) {
			this.handleTreasureReparent(model, delta); // <--
		}

		model.sync(delta);

		if (delta.id === this.playerId && delta.activeMinigame !== undefined) {
			this.digMinigame.sync(delta.activeMinigame);
		}

		if (delta.upgrades !== undefined && delta.id === this.localPlayer.shipId) {
			this.emit('localShipUpdated');
		}
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
			this.models.forEach((entity) => {
				// @ts-ignore
				if (entity.entityType === 'player' && entity.parentId === id) {
					model.remove(entity); // detach from container
					this.scene.add.existing(entity); // re-anchor to scene root
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
			this.allPlayers = data.allPlayers ?? [];
			this.mapWidth = data.mapWidth;
			this.mapHeight = data.mapHeight;
			this.shopSpawns = data.shopSpawns ?? [];
			this.onFullSync(data); // get everything
		});

		this.network.on(ServerEvent.DIG_MINIGAME_RESULT, () => {
			this.digMinigame.stop();
		});

		// Delta packet: full for new models and known models that have changed
		this.network.on(ServerEvent.GAME_STATE, (data) => this.onDeltaSync(data));

		this.network.on(ServerEvent.SUNK, (id) => {
			if (id === this.localPlayer.id) {
				this.emit('shipSunk'); // for displaying respawn dialog
			}
		});

		this.input.on('swing', () => {
			this.network.sendSwing();
		});

		this.input.on('dash', () => {
			if (this.localPlayer?.isSteering) {
				this.network.sendBoost();
			} else {
				this.network.sendDash();
			}
		});

		this.input.on('interact', () => {
			const target = this.closestInteractable;
			if (target?.entity) {
				const closest = target.entity;

				// Shortcut interact, just open shop if close enough
				// only upgrade packets are checked authoritatively
				if (closest.type === 'shop') {
					this.emit('openShop');
				}

				this.network.sendInteract({
					targetId: closest.id,
					targetType: closest.type,
					parentId: closest.parentId,
				});
			}
		});

		this.input.on('fire', () => {
			this.network.sendFire();
		});

		this.input.on('release', () => this.network.sendRelease());

		this.input.on('respawn', () => this.network.sendRespawn());

		this.input.on('quit', () => {
			this.network.sendQuit();
			this.scene.goToStart();
		});
	}

	/**
	 * Handle moving a player into a ship object and vice versa
	 * @param {PlayerModel} player the player for which reparenting is handled
	 * @param {Object} data the data from the server
	 */
	handleReparent(player, data) {
		if (player.parentId === data.parentId) return;
		this.closestInteractable = null; // reset closest interactable

		const ship = data.parentId ? this.models.get(data.parentId) : null;

		if (ship) {
			ship.add(player);
		} else {
			this.scene.add.existing(player);
		}

		player.setPosition(data.x ?? player.x, data.y ?? player.y);
		player.parentId = data.parentId ?? null;
		player.rotation = 0;

		// Snap interpolation targets so movement feels instant on reparent
		if (data.x !== undefined) player.target.x = data.x;
		if (data.y !== undefined) player.target.y = data.y;
	}

	handleTreasureReparent(treasure, data) {
		const newParentId = data.parentId ?? null;
		if (treasure.parentId === newParentId) return;

		const ship = newParentId ? this.models.get(newParentId) : null;

		if (ship) {
			ship.add(treasure); // local coords
		} else {
			this.scene.add.existing(treasure); // back to world space
		}

		treasure.parentId = newParentId;
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

	// destroy game manager
	destroy() {
		this.network.off(ServerEvent.INIT_GAME);
		this.network.off(ServerEvent.GAME_STATE);
		this.models.forEach((e) => e.destroy());
		this.models.clear();
		this.localPlayer = null;
	}

	buyUpgrade(name) {
		this.network.sendUpgrade(name);
	}

	/**
	 *
	 * @returns {Record<string, number> | null}
	 */
	getLocalShipUpgrades() {
		if (!this.localPlayer) return null;
		const ship = this.models.get(this.localPlayer.shipId);

		if (!(ship instanceof ShipModel)) return null;
		return ship?.upgrades ?? null;
	}
}
