import Interactable from './interactable';

export default class Barrel extends Interactable {
	public hasItem: boolean = true;
	public respawnTimer: number = 0;
	public static readonly RESPAWN_TIME = 30000; // 30s
	public static readonly HIT_HEALTH = 2; // hits to open

	constructor(id: string, x: number, y: number) {
		super(id, x, y, null, 'barrel');
		this._maxHealth = Barrel.HIT_HEALTH;
		this.health = Barrel.HIT_HEALTH;
		this.interactRange = 60;
		this.height = 32;
		this.width = 32;

		this.isDestructible = true;
	}

	toState() {
		return {
			...super.toState(),
			hasItem: this.hasItem,
		};
	}
}
