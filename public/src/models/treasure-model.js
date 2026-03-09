/* global Phaser */
import Model from "./model.js";

export default class TreasureModel extends Model {
    constructor(scene, id, x, y, state = "buried", digProgress = 0) {
        super(scene, id, x, y, "treasure", 0, true);

        this.state = state;
        this.digProgress = digProgress;
        this.carrierId = null;

        this.sprite = scene.add.sprite(0, 0, "treasure-x");
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setDisplaySize(64, 64);

        this.add(this.sprite);
        this.setDepth(20);
    }

    sync(data) {
        super.sync(data);

        if (data.state !== undefined) this.state = data.state;
        if (data.digProgress !== undefined) this.digProgress = data.digProgress;
        if (data.carrierId !== undefined) this.carrierId = data.carrierId;

        if (this.state === "buried") {
            this.sprite.setTexture("x-mark");
            this.sprite.setDisplaySize(48, 48);
        } else {
            this.sprite.setTexture("treasure-chest");
            this.sprite.setDisplaySize(80, 80);
        }
    }
}