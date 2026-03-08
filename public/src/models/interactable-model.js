
import Model from "./model.js";
import ShipModel from "./ship-model.js";

/**
 * Client side interactable entity. Contains prompts for user interaction.
 * Can be added to ships by adding to their containers.
 */
export default class InteractableModel extends Model {

    /**
     * Creates an interactable object
     * @param {Phaser.Scene} scene 
     * @param {ShipModel | null} parent 
     * @param {string} id 
     * @param {string} type 
     * @param {number} x 
     * @param {number} y 
     * @param {string} texture 
     * @param {string} usePrompt 
     * @param {string} releasePrompt 
     */
    constructor(scene, parent, id, type, x, y, texture = '', usePrompt = '', releasePrompt = '') {
        super(scene, id, x, y, 0, true);    // is static
        this.type = type;
        this.usePrompt = usePrompt || `Use ${this.type}`;
        this.releasePrompt = releasePrompt || "";
        this.textureKey = texture || 'interactable'; // default

        this.startY = y;
        this.sprite = scene.add.sprite(0, 0, this.textureKey);

        if (parent)
        {
            parent.add(this);
            // don't flip helms
            this.rotation = (y < 0 || type === 'helm') ? 0 : Math.PI;
            this.target.r = this.rotation;
        }
    }
}