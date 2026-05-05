import Interactable from './interactable';

export default class Coconut extends Interactable {
	public healAmount: number; // calculated from player maxHealth on pickup
	public static readonly HEAL_PERCENT = 0.2;
	public treeId: string; // which tree spawned this

	constructor(id: string, x: number, y: number, treeId: string) {
		super(id, x, y, null, 'coconut');
		this.treeId = treeId;
		this.healAmount = 0; // set on interact using player.maxHealth
		this.interactRange = 50;
	}

	toState() {
		return {
			...super.toState(),
		};
	}
}
