import InteractableModel from './interactable-model.js';

export default class CoconutModel extends InteractableModel {
	constructor(scene, id, x, y) {
		super(scene, null, id, 'coconut', x, y, 'coconut', 'Pick up Coconut', '');
		this.sprite.setDisplaySize(32, 32);
	}
}
