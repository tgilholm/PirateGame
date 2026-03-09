import CannonModel from "../models/cannon-model.js";
import HelmModel from "../models/helm-model.js";
import LadderModel from "../models/ladder-model.js";
import PlayerModel from "../models/player-model.js";
import ProjectileModel from "../models/projectile-model.js";
import ShipModel from "../models/ship-model.js";
import TreasureModel from "../models/treasure-model.js";

/**
 * Client side factory class for creating models
 */
export default class ModelFactory {

    /**
     * Creates a model factory from a scene and config 
     * @param {Phaser.Scene} scene the phaser scene
     * @param {EntityConfig} config the config for entities
     */
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;
    }

    /**
     * Creates an entity from the data packet, which must contain "type"
     * @param {object} data the data packet 
     * @returns the created entity
     */
    create(data) {
        switch (data.type) {
            case 'ship': return this.createShip(data);
            case 'player': return this.createPlayer(data);
            case 'projectile': return this.createProjectile(data);
            case 'treasure': return this.createTreasure(data);
            default:
                console.warn(`[ModelFactory] Unknown entity type: "${data.type}"`);
                return null;
        }
    }

    /**
     * Creates a Ship entity and the interactables contained in it
     * @param {object} data the data from the server to create the ship from 
     * @returns the ship
     */
    createShip(data) {
        const ship = new ShipModel(this.scene, data.id, data.x, data.y, this.config.ship);

        this.config.ship.interactables.forEach((instance, index) => {
            const item = this.createInteractable(ship, instance, index);
            if (item) ship.interactables.push(item);
        });

        return ship;
    }

    /**
     * Creates a player entity from the provided data
     * @param {object} data the data from the server to create the player from 
     * @returns the player
     */
    createPlayer(data) {
        return new PlayerModel(this.scene, data.id, data.x, data.y);
    }

    /**
     * Creates a projectile from the provided data
     * @param {object} data the data from the server to create the projectile from 
     * @returns the projectile
     */
    createProjectile(data) {
        return new ProjectileModel(this.scene, data.id, data.x, data.y, data.r ?? 0);
    }

    createTreasure(data) {
        return new TreasureModel(
            this.scene,
            data.id,
            data.x,
            data.y,
            data.state ?? "buried",
            data.digProgress ?? 0
        );
    }

    /**
     * Creates an interactable object with an id mirrored by the server. Handles parented (on-ship)
     * interactables, and global ones
     * @param {ShipModel | null} parent the object to create this interactable on, if any
     * @param {InteractableInstance} instance the instance variables for this interactable
     * @param {number} index the index of the item to create
     */
    createInteractable(parent, instance, index) {
        const { type, x, y } = instance;                     // get the requested type
        const prefix = parent ? parent.id : "map";  // parent id or map if null
        const id = `${prefix}_${type}_${index}`;    // e.g. "map_cannon_1" or "ship_1_helm_1"


        let model;
        switch (type) {
            case 'cannon': model = new CannonModel(this.scene, parent, id, x, y); break;
            case 'helm': model = new HelmModel(this.scene, parent, id, x, y); break;
            case 'ladder': model = new LadderModel(this.scene, parent, id, x, y); break;
            default:
                console.warn(`Interactable ${id} is not recognised as an interactable type`);
                return;
        }

        if (!parent) {
            this.scene.add.existing(model);
        }

        return model;
    }
}