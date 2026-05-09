import Interactable from './interactable';

export default class PalmTree extends Interactable {
	public maxCoconuts: number;
	public coconuts: number;
	public readonly treeHealth: number = 3; // hits to break coconuts loose
	public hitCount: number = 0;
	public readonly baseRadius: number = 50; // Increased to match tree sprite size

	constructor(id: string, x: number, y: number) {
		super(id, x, y, null, 'palm-tree');
		this.maxCoconuts = Math.floor(Math.random() * 4) + 1; // 1-4
		this.coconuts = this.maxCoconuts;
		this._maxHealth = Infinity; // trees dont die, just get hit
		this.health = Infinity;
		this.interactRange = 80;
		this.width = 63;
		this.height = 68;
	}

	toState() {
		return {
			...super.toState(),
			coconuts: this.coconuts,
			hitCount: this.hitCount,
		};
	}
}
