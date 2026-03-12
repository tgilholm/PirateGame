import HealthBar from "../ui/health-bar.js";
import Model from "./model.js";

export default class NPCModel extends Model {
    /**
     * 
     * @param {Phaser.Scene} scene 
     * @param {string} id 
     * @param {number} x 
     * @param {number} y 
     */
    constructor(scene, id, x, y
    )
    {
        super(scene, id, x, y, 'npc', 0, false);

        // Add the sprite
        this.bodySprite = scene.add.sprite(0, 0, 'npc_sprite');
        this.add(this.bodySprite);
        this.healthBar = new HealthBar(scene, 40, 20);
    }

    postUpdate(delta, deltaTime, lerp)
    {
        const pos = this.worldPos;
        this.healthBar.update(pos.x, pos.y, this.health, this.maxHealth);
    }

    destroy()
    {
        
        this.healthBar?.destroy();
        super.destroy();
    }
}