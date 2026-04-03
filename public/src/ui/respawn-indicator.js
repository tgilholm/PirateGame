/**
 * Shows the amount of time remaining before a player respawns (on their ship)d
 */
export default class RespawnIndicator {
	/**
	 *
	 * @param {Phaser.Scene} scene
	 * @param {number} width
	 * @param {number} height
	 */
	constructor(scene, width, height) {
		// deliberately not added to the parent
		// containers ignore z-index
		this.text = scene.add
			.text(0, -100, '', {
				fontSize: '36px',
				fontFamily: 'Consolas',
				color: '#ffffff',
				padding: { x: 6, y: 4 },
			})
			.setOrigin(0.5, 1)
			.setDepth(999) // always on top
			.setPosition(0, 0);
		this.counter = 0;
		this.width = width;
		this.height = height;
	}

	update(respawnTimer) {
		// Hide if alive
		if (respawnTimer <= 0) {
			this.text.alpha = 0;
		} else {
			this.text.alpha = 1;
		}

		this.text.setText(`${Math.floor(respawnTimer / 1000)}`);
	}
}
