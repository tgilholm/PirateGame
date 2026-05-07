import InteractableModel from './interactable-model.js';

export default class BarrelModel extends InteractableModel {
	constructor(scene, id, x, y) {
		super(scene, null, id, 'barrel', x, y, 'barrel', '', '');
		this.isInteractable = false;
		this.hasItem = true;
		this.health = 2;
	}

	sync(data) {
		const prevHealth = this.health;
		super.sync(data);

		if (data.hasItem !== undefined) {
			if (!data.hasItem) {
				this.sprite.play('barrel-break');
			} else {
				// idle is a plain image, just set the texture
				this.sprite.setTexture('barrel');
			}
		}

		if (data.health !== undefined && data.health < prevHealth && data.hasItem) {
			this.sprite.play('barrel-hit');
		}
	}
}
