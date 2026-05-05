import InteractableModel from './interactable-model.js';

export default class BandageModel extends InteractableModel {
	constructor(scene, id, x, y) {
		super(scene, null, id, 'bandage', x, y, 'bandage', 'Pick up Bandage', '');
		this.sprite.setDisplaySize(32, 32);
	}
}
