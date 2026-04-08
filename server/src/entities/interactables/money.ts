import Entity from '../entity';
import Interactable from './interactable';

export default class Money extends Interactable {
	public value: number = 0;

	constructor(id: string, x: number, y: number, parent: Entity | null) {
		super(id, x, y, parent, 'money');
	}

	toState() {
		return {
			...super.toState(),
			value: this.value,
		};
	}
}
