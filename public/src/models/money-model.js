import InteractableModel from './interactable-model.js';

export default class MoneyModel extends InteractableModel {
	constructor(scene, parent, id, x, y) {
		super(scene, parent, id, 'money', x, y, 'money-stack', 'Pick up Gold');

		this.sprite.setDisplaySize(48, 48);
	}
}
