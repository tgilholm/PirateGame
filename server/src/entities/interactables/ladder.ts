import Entity from '../entity';
import Interactable from './interactable';

export default class Ladder extends Interactable {
	constructor(id: string, x: number, y: number, parent: Entity | null) {
		super(id, x, y, parent, 'ladder');

		if (parent) {
			this.r = y < 0 ? 0 : Math.PI;
		}
	}
}
