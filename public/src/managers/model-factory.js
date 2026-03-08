import CannonModel from "../models/cannon-model";
import HelmModel from "../models/helm-model";
import InteractableModel from "../models/interactable-model";
import Model from "../models/model";
import ShipModel from "../models/ship-model";

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

    createShip(data)
    {
        const ship = new ShipModel(this.scene, data.id, data.x, data.y, this.config.ship);

        this.config.ship.interactables.forEach((instance, index) => {
            const item = this.createInteractable(ship, instance, index);
            ship.interactables.push(item);
        });

        return ship;
    }

    createPlayer(data)
    {
        
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
            default:
                console.warn(`Interactable ${id} is not recognised as an interactable type`);
        }

        if (parent) {
            parent.add(model);
            parent.interactables.push(model);
        }
        else {
            this.scene.add.existing(model);
        }

        return model;
    }
}