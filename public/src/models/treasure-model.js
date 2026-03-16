/* global Phaser */
import Model from "./model.js";

export default class TreasureModel extends Model {
    constructor(scene, id, x, y, state = "buried", digProgress = 0, goldValue = 0) {
        super(scene, id, x, y, "treasure", 0, false);

        this.state = state;
        this.digProgress = digProgress;
        this.goldValue = goldValue;
        this.carrierId = null;

        this.holeSprite = scene.add.sprite(0, 0, "hole");
        this.holeSprite.setOrigin(0.5, 0.5);
        this.holeSprite.setDisplaySize(56, 56);
        this.holeSprite.setVisible(false);

        this.sprite = scene.add.sprite(0, 0, "x-mark");
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setDisplaySize(48, 48);

        this.add(this.holeSprite);
        this.add(this.sprite);
        this.setDepth(10);

        this.applyVisuals();
    }

    sync(data) {
        const previousState = this.state;

        super.sync(data);

        if (data.state !== undefined) this.state = data.state;
        if (data.digProgress !== undefined) this.digProgress = data.digProgress;
        if (data.carrierId !== undefined) this.carrierId = data.carrierId;
        if (data.goldValue !== undefined) this.goldValue = data.goldValue;

        if (previousState !== this.state) {
            if (this.state === "opening" || (this.state === "dugup" && previousState === "buried")) {
                this.playChestReveal();
            }
        }

        this.applyVisuals();
    }

    applyVisuals() {
        this.sprite.setVisible(false);
        this.holeSprite.setVisible(false);

        if (this.state === "buried") {
            this.sprite.setVisible(true);
            this.sprite.setTexture("x-mark");
            this.sprite.setDisplaySize(48, 48);
        } else if (this.state === "opening") {
            this.sprite.setVisible(true);
            this.sprite.setTexture("chest_open");
            this.sprite.setDisplaySize(80, 80);
        } else if (this.state === "dugup") {
            this.holeSprite.setVisible(true);
            this.sprite.setVisible(true);
            this.sprite.setTexture("chest-in-hole");
            this.sprite.setDisplaySize(80, 80);
        } else if (this.state === "carried") {
            this.sprite.setVisible(false);
            this.holeSprite.setVisible(false);
        } else if (this.state === "loose") {
            this.sprite.setVisible(true);
            this.sprite.setTexture("treasure-chest");
            this.sprite.setDisplaySize(64, 64);
        } else if (this.state === "hole") {
            this.sprite.setVisible(false);
            this.holeSprite.setVisible(true);
        }
    }

    playChestReveal() {
        this.sprite.setVisible(true);
        this.holeSprite.setVisible(false);
        this.sprite.setTexture("chest_open");
        this.sprite.setDisplaySize(80, 80);

        if (this.sprite.anims) {
            this.sprite.play("chest-open");
        }

        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 140,
            yoyo: true,
            ease: "Back.Out"
        });

        const text = this.scene.add.text(this.x, this.y - 40, `+${this.goldValue} gold`, {
            fontFamily: "VT323",
            fontSize: "28px",
            color: "#ffd54a",
            stroke: "#000000",
            strokeThickness: 4
        });

        text.setOrigin(0.5);
        text.setDepth(1000);

        this.scene.tweens.add({
            targets: text,
            y: text.y - 32,
            alpha: 0,
            duration: 950,
            ease: "Cubic.Out",
            onComplete: () => text.destroy()
        });
    }
}