import Entity from '../entity';
import InteractableEntity from './interactable-entity';

export default class Helm extends InteractableEntity {
	constructor(id: string, x: number, y: number, parent: Entity | null) {
		super(id, x, y, parent, 'helm');
	}
}
