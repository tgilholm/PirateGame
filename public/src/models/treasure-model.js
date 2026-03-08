import Model from "./model.js";

export default class TreasureModel extends Model {
    constructor(scene, id, x, y, goldValue = 0) {
        super(scene, id, x, y, 'treasure', 0, true); // static object
        this.goldValue = goldValue;

        this.sprite = scene.add.sprite(0, 0, 'treasure-chest');
        this.sprite.setScale(2);
        this.sprite.setOrigin(0.5, 0.5);
        this.add(this.sprite);
        this.setDepth(20);
    }

    sync(data) {
        super.sync(data);
        if (data.goldValue !== undefined) {
            this.goldValue = data.goldValue;
        }
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
        super.destroy();
    }
}