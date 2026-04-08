import InteractableModel from './interactable-model.js';

export default class MoneyModel extends InteractableModel {
	/**
	 * @param {Phaser.Scene} scene
	 * @param {string} id
	 * @param {number} x
	 * @param {number} y
	 */
	constructor(scene, parent, id, x, y) {
		super(scene, parent, id, 'money', x, y, 'money-stack', 'Pick up Gold');

		this.sprite.setDisplaySize(48, 48);

		this.valueText = scene.add
			.text(0, -50, '', {
				fontSize: '16px',
				fontFamily: 'Consolas',
				color: '#ffffff',
				backgroundColor: '#00000088',
				padding: { x: 6, y: 4 },
			})
			.setOrigin(0.5, 1)
			.setDepth(100)
			.setPosition(0, -25);
		this.add(this.valueText);
	}

	sync(data) {
		super.sync(data);

		if (data.value !== undefined) this.valueText.setText(`${data.value} Gold`);
	}

	postUpdate(delta, deltaTime, lerp) {
		// counter-rotate so text is always upright
		if (this.parentContainer) {
			this.rotation = -this.parentContainer.rotation;
		}
	}
}
