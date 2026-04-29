import Interactable from './interactable';

export default class Bandage extends Interactable {
	public static readonly HEAL_PERCENT = 0.2;

	constructor(id: string, x: number, y: number) {
		super(id, x, y, null, 'bandage');
		this.interactRange = 50;
	}
}
