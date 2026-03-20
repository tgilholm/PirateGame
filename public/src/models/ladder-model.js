import InteractableModel from './interactable-model.js';

export default class LadderModel extends InteractableModel {
	constructor(scene, parent, id, x, y) {
		super(scene, parent, id, 'ladder', x, y, 'ladder', 'Use Ladder', '');
	}
}
