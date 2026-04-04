import Entity from '../entity';
import Interactable from './interactable';

export default class Helm extends Interactable {
	constructor(id: string, x: number, y: number, parent: Entity | null) {
		super(id, x, y, parent, 'helm');
	}
}
