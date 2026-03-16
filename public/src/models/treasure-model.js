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
        this.holeSprite.setDepth(1);

        this.sprite = scene.add.sprite(0, 0, "x-mark");
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setDisplaySize(48, 48);
        this.sprite.setDepth(20);

        this.add(this.holeSprite);
        this.add(this.sprite);
        this.setDepth(10);
    }

    sync(data) {

        const previousState = this.state;

        const isDropping =
            previousState === "carried" &&
            data.state === "loose" &&
            data.x !== undefined &&
            data.y !== undefined;

        super.sync(data);

        if (isDropping) {
            this.x = this.target.x;
            this.y = this.target.y;
        }

        if (data.state !== undefined) this.state = data.state;
        if (data.digProgress !== undefined) this.digProgress = data.digProgress;
        if (data.carrierId !== undefined) this.carrierId = data.carrierId;
        if (data.goldValue !== undefined) this.goldValue = data.goldValue;

        if (previousState !== this.state && this.state === "opening") {
            this.playChestReveal();
        }

        if (this.state === "buried") {
            this.holeSprite.setVisible(false);
            this.sprite.setVisible(true);
            this.sprite.setTexture("x-mark");
            this.sprite.setDisplaySize(48, 48);

        } else if (this.state === "opening") {
            this.holeSprite.setVisible(false);
            this.sprite.setVisible(true);
            this.sprite.setTexture("chest_open");
            this.sprite.setDisplaySize(80, 80);

        } else if (this.state === "dugup") {
            this.holeSprite.setVisible(true);
            this.sprite.setVisible(true);
            this.sprite.setTexture("chest-in-hole");
            this.sprite.setDisplaySize(80, 80);
            this.sprite.setDepth(20);

        } else if (this.state === "carried") {
            this.sprite.setVisible(false);
            this.holeSprite.setVisible(false);

        } else if (this.state === "loose") {
            this.holeSprite.setVisible(false);
            this.sprite.setVisible(true);
            this.sprite.setTexture("treasure-chest");
            this.sprite.setDisplaySize(64, 64);
            this.sprite.setDepth(20);

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

        // chest pop
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 140,
            yoyo: true,
            ease: "Back.Out"
        });

        // floating gold text
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

        // little dust burst / sparkle stand-in
        for (let i = 0; i < 6; i++) {
            const puff = this.scene.add.circle(this.x, this.y, 3, 0xd8c38a, 0.8);
            puff.setDepth(999);

            const angle = (Math.PI * 2 * i) / 6;
            const dx = Math.cos(angle) * 24;
            const dy = Math.sin(angle) * 14;

            this.scene.tweens.add({
                targets: puff,
                x: this.x + dx,
                y: this.y + dy,
                alpha: 0,
                scaleX: 0.2,
                scaleY: 0.2,
                duration: 500,
                ease: "Quad.Out",
                onComplete: () => puff.destroy()
            });
        }

        // small camera shake
        this.scene.cameras.main.shake(120, 0.0025);
    }
}