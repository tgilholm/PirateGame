import InteractableModel from './interactable-model.js';

/**
 * Client-side representation of a shop. Static interactable point that players
 * approach to buy upgrades. Draws itself as a gold circle with a label.
 */
export default class ShopModel extends InteractableModel {
	/**
	 * @param {Phaser.Scene} scene
	 * @param {string} id
	 * @param {number} x
	 * @param {number} y
	 */
	constructor(scene, id, x, y) {
		super(scene, null, id, 'shop', x, y, 'shop', 'Use Shop', '');
		this.isInteractable = true;
		this.type = 'shop';
		this.interactRange = 100;
		const radius = 50;

		// Generates temp shop body texture and reuses across all shops
		const textureKey = 'shop_' + radius;
		if (!scene.textures.exists(textureKey)) {
			const padding = 4;
			const size = (radius + padding) * 2;
			const cx = size / 2;
			const cy = size / 2;

			const gfx = scene.make.graphics({ x: 0, y: 0 }, false);

			// Filled gold body
			gfx.fillStyle(0xf5c542, 1);
			gfx.fillCircle(cx, cy, radius);

			// Dark-gold border
			gfx.lineStyle(3, 0x8b6914, 1);
			gfx.strokeCircle(cx, cy, radius);

			gfx.generateTexture(textureKey, size, size);
			gfx.destroy();
		}

		// Shop body sprite
		this.bodySprite = scene.add.sprite(0, 0, textureKey);
		this.bodySprite.setDepth(999);
		this.add(this.bodySprite);

		// Floating label above the circle
		this.label = scene.add
			.text(0, -radius - 6, 'Shop', {
				fontSize: '16px',
				fontFamily: 'Arial',
				color: '#ffffff',
				stroke: '#000000',
				strokeThickness: 3,
			})
			.setOrigin(0.5, 1);
		this.add(this.label);

		this.setDepth(5);
	}

	destroy() {
		this.label?.destroy();
		super.destroy();
	}
}
