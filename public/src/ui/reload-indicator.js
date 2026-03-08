export default class ReloadIndicator {
    /**
     * @param {Phaser.Scene} scene
     * @param {Phaser.GameObjects.Container} parent container to add to
     * @param {number} radius
     */
    constructor(scene, parent, radius = 20) {
        this.graphics = scene.add.graphics();
        this.radius = radius;
        this.fadeTimer = 0;
        this.wasReady = false;
        parent.add(this.graphics);
    }

    /**
     * @param {number} reloadTimer ms remaining
     * @param {number} reloadTime ms total
     * @param {number} delta
     */
    update(reloadTimer, reloadTime, delta) {
        const g = this.graphics;
        g.clear();

        const isReady = reloadTimer <= 0;

        if (isReady) {
            // start fade out
            if (!this.wasReady) {
                this.fadeTimer = 600; // ms to fade
                this.wasReady = true;
            }

            if (this.fadeTimer <= 0) return; // fully faded, draw nothing

            this.fadeTimer -= delta;
            const alpha = Math.max(0, this.fadeTimer / 600) * 0.8;
            g.lineStyle(3, 0x00ff88, alpha);
            g.strokeCircle(0, 0, this.radius);

        } else {
            this.wasReady = false;
            this.fadeTimer = 0;

            // proportional to reload progress
            const progress = 1 - (reloadTimer / reloadTime);
            const endAngle = -Math.PI / 2 + (Math.PI * 2 * progress);

            g.lineStyle(3, 0xffffff, 0.5);
            g.beginPath();
            g.arc(0, 0, this.radius, -Math.PI / 2, endAngle, false);
            g.strokePath();
        }
    }

    destroy() {
        this.graphics.destroy();
    }
}