import InteractableModel from './interactable-model.js';

export default class BarrelModel extends InteractableModel {
	constructor(scene, id, x, y) {
		super(scene, null, id, 'barrel', x, y, 'barrel', '', '');
		this.sprite.setDisplaySize(48, 48);
		this.isInteractable = false;
		this.hasItem = true;
	}

	sync(data) {
		super.sync(data);
		if (data.hasItem !== undefined) {
			this.hasItem = data.hasItem;
			// Grey out barrel when empty
			this.sprite.setAlpha(data.hasItem ? 1.0 : 0.4);
		}
	}
}
