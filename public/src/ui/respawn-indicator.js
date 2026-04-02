import Model from '../models/model.js';

/**
 * Shows the amount of time remaining before a player respawns (on their ship)d
 */
export default class RespawnIndicator {
	/**
	 *
	 * @param {Phaser.Scene} scene
	 * @param {Model} parent
	 * @param {number} width
	 * @param {number} height
	 */
	constructor(scene, parent, width, height) {
		this.text = scene.add
			.text(0, -100, '', {
				fontSize: '24px',
				fontFamily: 'Consolas',
				color: '#ffffff',
				backgroundColor: '#00000055',
				padding: { x: 6, y: 4 },
			})
			.setOrigin(0.5, 1)
			.setDepth(200)
			.setPosition(0, -50);

		parent.add(this.text);
		this.counter = 0;
		this.width = width;
		this.height = height;
	}

	update(respawnTimer) {
		this.text.setText(`${Math.floor(respawnTimer / 1000)}`);
	}
}
