import Model from "./model.js";

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
    constructor(scene, id, x, y, r, type) {
        super(scene, id, x, y, 'projectile', r, false);
        const texture = type === 'cannonball' ? 'cannonball' : 'bullet';
        this.sprite = scene.add.sprite(0, 0, texture);
        this.add(this.sprite);
        this.setDepth(90);
    }

    postUpdate(delta, deltaTime, lerp) {
        // Disable interp for projectiles
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
    }
}