import InteractableModel from './interactable-model.js';

export default class BarrelModel extends InteractableModel {
	constructor(scene, id, x, y) {
		super(scene, null, id, 'barrel', x, y, 'barrel', 'Hit barrel', '');
		this.isInteractable = false;
		this.hasItem = true;
		this.health = 2;
		// Explicitly size the sprite to match the 32x32 source texture
		this.sprite.setDisplaySize(32, 32);
	}

	sync(data) {
		const prevHealth = this.health;
		super.sync(data);

		if (data.hasItem !== undefined) {
			this.hasItem = data.hasItem;
			if (!data.hasItem) {
				this.sprite.play('barrel-break');
				// Once the break animation finishes, hide the sprite so
				// there's no leftover frame sitting on screen
				this.sprite.once('animationcomplete', () => {
					this.sprite.setVisible(false);
				});
			} else {
				// Barrel has respawned — restore texture and show it
				this.sprite.stop();
				this.sprite.setTexture('barrel');
				this.sprite.setVisible(true);
			}
		}

		if (data.health !== undefined && data.health < prevHealth && this.hasItem) {
			this.sprite.play('barrel-hit');
		}
	}
}
