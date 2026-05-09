export default class HealParticles {
	/**
	 * @param {Phaser.Scene} scene
	 */
	constructor(scene) {
		this.scene = scene;
	}

	/**
	 * @param {number} worldX
	 * @param {number} worldY
	 */
	playHeal(worldX, worldY) {
		const COUNT = 5;

		for (let i = 0; i < COUNT; i++) {
			const offsetX = (Math.random() - 0.5) * 80;
			const offsetY = (Math.random() - 0.5) * 40;

			const x = worldX + offsetX;
			const y = worldY + offsetY;

			// Draw a + cross shape using graphics
			const gfx = this.scene.add.graphics();
			gfx.setDepth(200);

			const size = 6 + Math.random() * 4;
			const thickness = 3;

			gfx.fillStyle(0x00ff66, 1);
			// horizontal bar
			gfx.fillRect(-size, -thickness / 2, size * 2, thickness);
			// vertical bar
			gfx.fillRect(-thickness / 2, -size, thickness, size * 2);

			gfx.setPosition(x, y);

			// Float upward and fade out
			this.scene.tweens.add({
				targets: gfx,
				y: y - 60 - Math.random() * 30,
				alpha: 0,
				scaleX: 1.5,
				scaleY: 1.5,
				duration: 1200 + Math.random() * 400,
				ease: 'Sine.Out',
				onComplete: () => gfx.destroy(),
			});
		}

		// Also show a "+100" text
		const text = this.scene.add.text(worldX, worldY - 30, '+100', {
			fontFamily: 'VT323',
			fontSize: '20px',
			color: '#00ff66',
			stroke: '#000000',
			strokeThickness: 3,
		});
		text.setOrigin(0.5);
		text.setDepth(200);

		this.scene.tweens.add({
			targets: text,
			y: text.y - 50,
			alpha: 0,
			duration: 1500,
			ease: 'Cubic.Out',
			onComplete: () => text.destroy(),
		});
	}
}
