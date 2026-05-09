export default class HealthBar {
	constructor(scene, width = 40, offset = 40) {
		this.offset = offset;
		this.width = width;
		this.graphics = scene.add.graphics();
		this.graphics.setDepth(100);
	}

	/**
	 * @param {number} x world x
	 * @param {number} y world y
	 * @param {number} health
	 * @param {number} maxHealth
	 */
	update(x, y, health, maxHealth) {
		/** @type {Phaser.GameObjects.Graphics} */
		const g = this.graphics;
		g.clear();

		if (maxHealth <= 0 || health >= maxHealth) return;

		const ratio = Math.max(0, health / maxHealth);
		const w = this.width;
		const h = 4;
		const bx = x - w / 2;
		const by = y - this.offset; // above the player/ship

		g.fillStyle(0x000000, 0.5);
		g.fillRect(bx, by, w, h);

		const color = ratio > 0.5 ? 0x44ff44 : ratio > 0.25 ? 0xffaa00 : 0xff3333;
		g.fillStyle(color, 0.9);
		g.fillRect(bx, by, w * ratio, h);

		health <= 0 ? g.setVisible(false) : g.setVisible(true);
	}

	destroy() {
		this.graphics.destroy();
	}
}
