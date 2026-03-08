import Model from "./model";

/**
 * Client-side projectile representation.
 */
export default class ProjectileModel extends Model {
    /**
     * Constructs a client-side projectile
     * @param {Phaser.Scene} scene 
     * @param {string} id 
     * @param {number} x 
     * @param {number} y 
     * @param {number} r 
     */
    constructor(scene, id, x, y, r) {
        super(scene, id, x, y, r, false);

        this.sprite = scene.add.sprite(0, 0, 'cannonball');
        this.add(this.sprite);
        this.setDepth(90);
    }
}