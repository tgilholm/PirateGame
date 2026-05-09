import InteractableModel from './interactable-model.js';

export default class PalmTreeModel extends InteractableModel {
	constructor(scene, id, x, y) {
		super(scene, null, id, 'palm-tree', x, y, 'palm-tree', '', '');
		this.isInteractable = false;
		this.setDepth(15);
		this.coconuts = 0;
	}

	sync(data) {
		super.sync(data);
		if (data.coconuts !== undefined) this.coconuts = data.coconuts;
		if (data.hitCount !== undefined) this.hitCount = data.hitCount;
	}

	shake() {
		this.scene.tweens.add({
			targets: this,
			x: this.x + 3,
			duration: 60,
			yoyo: true,
			repeat: 3,
			ease: 'Sine.InOut',
		});
	}

	destroy() {
		super.destroy();
	}
}
