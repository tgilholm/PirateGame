import { ClientEvent, ServerEvent } from "shared/built/socket-protocol.js";
import NetworkManager from "./network-manager.js";
import PlayerModel from "../models/player-model.js";
import InputManager from "./input-manager.js";
import ModelFactory from "./model-factory.js";
import Model from "../models/model.js";
import { MainScene } from "../scenes/main-scene.js";
import DigMinigame from "../ui/dig-minigame.js";

export default class GameManager extends Phaser.Events.EventEmitter {
    #playerListCache;

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

        this.localPlayer = null;
        this.playerId = null;
        this.playerListDirty = true;

        this.models = new Map();
        this.interactables = [];
        this.closestInteractable = null;

        this.startListeners();
    }

    start(username) {
        this.network.emit(ClientEvent.READY, { username });
    }

    update() {
        if (!this.localPlayer) return;

        const delta = this.scene.game.loop.delta;
        if (this.digMinigame) {
            this.digMinigame.update(delta / 1000);
        }

        const inputs = this.input.getInputs(this.scene, this.localPlayer);
        const pos = this.localPlayer.worldPos;

        this.moveTimer += delta;
        if (this.moveTimer >= 1000 / 20) {
            this.network.sendMove(inputs);
            this.moveTimer = 0;
        }

        this.scene.cameraTarget.x = pos.x;
        this.scene.cameraTarget.y = pos.y;

        const closest = this.getClosestInteractable(this.localPlayer);
        if (closest && closest.dist < 50) {
            if (closest.item.type === "ladder" || this.localPlayer.parentId == closest.item.parentId) {
                this.closestInteractable = closest;
            }
        } else {
            this.closestInteractable = null;
        }

        this.models.forEach((entity) => {
            if (entity === this.localPlayer) {
                entity.target.r = inputs.aimAngle;
            }
            entity.update(delta);
        });

        const now = Date.now();
        this.models.forEach((entity, id) => {
            if (entity.isPredicted && now - entity.spawnTime > 150) {
                entity.destroy();
                this.models.delete(id);
            }
        });
    }

    onFullSync(data) {
        this.models.forEach(e => e.destroy());
        this.models.clear();
        this.interactables = [];
        this.localPlayer = null;
        this.playerListDirty = true;
        this.#playerListCache = null;

        data.entities?.forEach(entityData => this.applyFull(entityData));
        this.resolveLocalPlayer();
        this.refreshInteractables();
    }

    onDeltaSync(data) {
        let needsInteractableRefresh = false;

        const now = Date.now();
        this.models.forEach((entity, id) => {
            if (entity.isPredicted && now - entity.spawnTime > 300) {
                entity.destroy();
                this.models.delete(id);
            }
        });

        data.newEntities?.forEach(entityData => {
            this.applyFull(entityData);
            if (entityData.type === "ship") needsInteractableRefresh = true;
            if (entityData.isInteractable || entityData.type !== undefined) needsInteractableRefresh = true;
            if (["cannon", "helm", "ladder"].includes(entityData.type)) needsInteractableRefresh = true;
            if (entityData.type === "player") {
                this.playerListDirty = true;
                this.#playerListCache = null;
            }
        });

        data.deltaEntities?.forEach(delta => this.applyDelta(delta));

        data.removedIds?.forEach(id => {
            const removed = this.removeEntity(id);
            const removedType = removed?.entityType;
            if (removedType === "player") {
                this.playerListDirty = true;
                this.#playerListCache = null;
            }
            if (removedType === "ship") needsInteractableRefresh = true;
            if (removed?.isInteractable) needsInteractableRefresh = true;
        });

        if (needsInteractableRefresh) this.refreshInteractables();
        this.resolveLocalPlayer();
    }

    applyFull(data) {
        let model = this.models.get(data.id);

        if (!model) {
            if (data.type === "bullet" || data.type === "cannonball" || data.type === "projectile") {
                const predicted = this.findMatchingPrediction(data.x, data.y);
                if (predicted) {
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

        if (data.type === "player") this.handleReparent(model, data);
        model.sync(data);
    }

    findMatchingPrediction(x, y) {
        let closest = null;
        let closestDist = 150;

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

    applyDelta(delta) {
        const model = this.models.get(delta.id);
        if (!model) return;

        if (model.entityType === "player" && delta.parentId !== undefined) {
            this.handleReparent(model, delta);
        }

        model.sync(delta);
    }

    removeEntity(id) {
        const model = this.models.get(id);
        if (!model) {
            console.debug(`[GameManager] removeEntity: "${id}" not found, already removed?`);
            return undefined;
        }

        if (model.entityType === "ship") {
            this.models.forEach(entity => {
                if (entity.entityType === "player" && entity.parentId === id) {
                    model.remove(entity);
                    this.scene.add.existing(entity);
                    entity.parentId = null;
                }
            });
        }

        model.destroy();
        this.models.delete(id);
        return model;
    }

    get playerList() {
        if (!this.#playerListCache) {
            this.#playerListCache = new Map();
            this.models.forEach((entity, id) => {
                if (entity.entityType === "player") this.#playerListCache.set(id, entity);
            });
        }
        return this.#playerListCache;
    }

    startListeners() {
        this.network.on(ServerEvent.INIT_GAME, (data) => {
            this.playerId = data.id;
            this.onFullSync(data);
        });

        this.network.on(ServerEvent.DIG_MINIGAME_START, (payload) => {
            console.log("[Client] DIG_MINIGAME_START received", payload);
            this.digMinigame.start(payload);
        });

        this.network.on(ServerEvent.DIG_MINIGAME_RESULT, ({ success }) => {
            console.log("[Client] DIG_MINIGAME_RESULT received", success);
            this.digMinigame.stop();
        });

        this.network.on(ServerEvent.GAME_STATE, (data) => this.onDeltaSync(data));

        this.input.on("interact", () => {
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

        this.input.on("treasureInteract", () => {
            this.network.sendTreasureInteract();
        });

        this.input.on("dig", () => {
            if (this.digMinigame?.active) {
                this.network.sendDigHit(this.digMinigame.getSliderPosition());
            } else {
                this.network.sendDigStart();
            }
        });

        this.input.on("fire", () => {
            this.network.sendFire();
            this.spawnPredictedProjectile();
        });

        this.input.on("release", () => this.network.sendRelease());
    }

    spawnPredictedProjectile() {
        const player = this.localPlayer;
        if (!player) return;

        const cam = this.scene.cameras.main;
        const mouseWorldX = this.scene.input.mousePointer.x / cam.zoom + cam.scrollX;
        const mouseWorldY = this.scene.input.mousePointer.y / cam.zoom + cam.scrollY;
        const playerPos = player.worldPos;
        const freshAimAngle = Math.atan2(mouseWorldY - playerPos.y, mouseWorldX - playerPos.x);

        let worldAngle, spawnX, spawnY;

        if (player.isUsingCannon) {
            const cannon = [...this.interactables].find(i => i.type === "cannon" && i.userId === player.id);
            if (!cannon || cannon.reloadTimer > 0) return;

            const ship = this.models.get(player.parentId);
            worldAngle = (ship?.target.r ?? 0) + cannon.target.r;

            const pos = cannon.worldPos;
            spawnX = pos.x + Math.cos(worldAngle) * 20;
            spawnY = pos.y + Math.sin(worldAngle) * 20;
        } else {
            if (player.reloadTimer > 0) return;
            worldAngle = freshAimAngle;
            spawnX = player.gun.x;
            spawnY = player.gun.y;
        }

        const speed = 600;
        const model = this.modelFactory.createProjectile({
            id: `predicted_${Date.now()}`,
            x: spawnX,
            y: spawnY,
            r: worldAngle,
            type: player.isUsingCannon ? "cannonball" : "bullet"
        });

        model.velocity.x = Math.cos(worldAngle) * speed;
        model.velocity.y = Math.sin(worldAngle) * speed;

        if (player.isUsingCannon) {
            const ship = this.models.get(player.parentId);
            model.velocity.x += ship?.velocity.x ?? 0;
            model.velocity.y += ship?.velocity.y ?? 0;
        }

        model.isPredicted = true;
        model.initialised = true;
        model.spawnTime = Date.now();
        this.models.set(model.id, model);
    }

    refreshInteractables() {
        this.interactables = [];
        this.models.forEach(entity => {
            if (entity.isInteractable) this.interactables.push(entity);
        });
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

    handleReparent(player, data) {
        if (player.parentId === data.parentId) return;
        this.closestInteractable = null;

        const ship = data.parentId ? this.models.get(data.parentId) : null;

        if (ship) {
            ship.add(player);
        } else {
            this.scene.add.existing(player);
        }

        player.setPosition(data.x ?? player.x, data.y ?? player.y);
        player.parentId = data.parentId ?? null;

        if (data.x !== undefined) player.target.x = data.x;
        if (data.y !== undefined) player.target.y = data.y;
    }

    resolveLocalPlayer() {
        if (this.localPlayer || !this.playerId) return;

        const mine = this.models.get(this.playerId);
        if (mine) {
            this.localPlayer = mine;
            this.emit("localPlayerReady", this.localPlayer);
        }
    }
}