/**
 * manages simple animations (e.g. cannonball splashes), Sprite-sheet layout, 6-frame horizontal strip, 64 × 64 pixles per frame
 */
export default class AnimationManager {

    /**
     * @param {Phaser.Scene} scene
     */
    constructor(scene) {
        this.scene = scene;
        this.registerAnimations();
    }

    /**
     * registers all animation definitions to phaser
     */
    registerAnimations() {
        const defs = [
            { key: "water-splash", texture: "water-splash" },
            { key: "dust-splash",  texture: "dust-splash"  },
            { key: "blood-splash", texture: "blood-splash" },
        ];

        defs.forEach(({ key, texture }) => {
            if (!this.scene.anims.exists(key)) {
                this.scene.anims.create({
                    key,
                    frames: this.scene.anims.generateFrameNumbers(texture, { start: 0, end: 5 }),
                    frameRate: 12, // plays in ~0.5 s
                    repeat: 0 // one-time
                });
            }
        });
    }

    /**
     * plays splash animation at the given coordinates and destroys sprite once the animation is complete
     *
     * @param {number} x  world x
     * @param {number} y  world y
     * @param {"water" | "land" | "blood"} splashType  which animation to play
     */
    playSplash(x, y, splashType = "water") {
        const keyMap = {
            water: "water-splash",
            land: "dust-splash",
            blood: "blood-splash",
        };

        const animKey = keyMap[splashType] ?? "water-splash";
        const sprite = this.scene.add.sprite(x, y, animKey);
        sprite.setDepth(10); // above water, below UI Z-level
        sprite.play(animKey);

        //destroy when the animation finishes
        sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            sprite.destroy();
        });
    }

    /**
     * selects correct splash animation
     *
     * @param {Array<{x: number, y: number, splashType: "water"|"land"|"blood"}>} splashEvents
     */
    handleSplashEvents(splashEvents) {
        if (!splashEvents?.length) return;
        splashEvents.forEach(({ x, y, splashType }) => this.playSplash(x, y, splashType));
    }
}
