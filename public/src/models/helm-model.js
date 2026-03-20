import InteractableModel from './interactable-model.js';

export default class HelmModel extends InteractableModel {
	constructor(scene, parent, id, x, y) {
		super(scene, parent, id, 'helm', x, y, 'helm', 'Use Helm', 'Release Helm');
	}
}
