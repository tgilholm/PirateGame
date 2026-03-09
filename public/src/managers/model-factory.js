import CannonModel from "../models/cannon-model.js";
import HelmModel from "../models/helm-model.js";
import LadderModel from "../models/ladder-model.js";
import PlayerModel from "../models/player-model.js";
import ProjectileModel from "../models/projectile-model.js";
import ShipModel from "../models/ship-model.js";

/**
 * Client side factory class for creating models
 */
export default class ModelFactory {

    /**
     * Creates a model factory from a scene and config 
     * @param {Phaser.Scene} scene the phaser scene
     * @param {EntityConfig} config the config for entities
     * 
     */
    constructor(scene, config, modelLookup) {
        this.scene = scene;
        this.config = config;
        this.modelLookup = modelLookup
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
            case 'bullet':
            case 'cannonball': return this.createProjectile(data);
            case 'cannon':  // all interactables "fall through"
            case 'helm':
            case 'ladder': return this.createInteractable(data);
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
        return new ProjectileModel(this.scene, data.id, data.x, data.y, data.r ?? 0, data.type);
    }

    /**
     */
    createInteractable(data) {
        const parent = data.parentId ? this.modelLookup(data.parentId) : null;

        const prefix = parent ? parent.id : "map";  // parent id or map if null


        let model;
        switch (data.type) {
            case 'cannon': model = new CannonModel(this.scene, parent, data.id, data.x, data.y); break;
            case 'helm': model = new HelmModel(this.scene, parent, data.id, data.x, data.y); break;
            case 'ladder': model = new LadderModel(this.scene, parent, data.id, data.x, data.y); break;
            default:
                console.warn(`Interactable ${data.id} is not recognised as an interactable type`);
                return;
        }

        if (!parent) {
            this.scene.add.existing(model);
        }

        return model;
    }
}