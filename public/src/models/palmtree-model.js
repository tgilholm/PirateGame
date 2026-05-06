import InteractableModel from './interactable-model.js';

export default class PalmTreeModel extends InteractableModel {
	constructor(scene, id, x, y) {
		super(scene, null, id, 'palm-tree', x, y, 'palm-tree', '', '');
		this.isInteractable = false; // trees are hit, not interacted with
	}

	sync(data) {
		super.sync(data);
		if (data.coconuts !== undefined) this.coconuts = data.coconuts;
	}
}
