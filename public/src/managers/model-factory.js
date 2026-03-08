import CannonModel from "../models/cannon-model.js";
import HelmModel from "../models/helm-model.js";
import LadderModel from "../models/ladder-model.js";
import PlayerModel from "../models/player-model.js";
import ProjectileModel from "../models/projectile-model.js";
import ShipModel from "../models/ship-model.js";

export default class ModelFactory {


    /**
     * 
     * @param {Phaser.Scene} scene 
     * @param {EntityConfig} config 
     */
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;
    }

    create(data) {
        switch (data.type) {
            case 'ship': return this.createShip(data);
            case 'player': return this.createPlayer(data);
            case 'projectile': return this.createProjectile(data);
            default:
                console.warn(`[ModelFactory] Unknown entity type: "${data.type}"`);
                return null;
        }
    }

    createShip(data) {
        const ship = new ShipModel(this.scene, data.id, data.x, data.y, this.config.ship);

        this.config.ship.interactables.forEach((instance, index) => {
            const item = this.createInteractable(ship, instance, index);
            if (item) ship.interactables.push(item);
        });

        return ship;
    }

    createPlayer(data) {
        return new PlayerModel(this.scene, data.id, data.x, data.y);
    }

    createProjectile(data) {
        return new ProjectileModel(this.scene, data.id, data.x, data.y, data.r ?? 0);
    }

    /**
     * 
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