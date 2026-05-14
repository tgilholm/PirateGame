import Entity from '../entity';
import Player from '../player';

/**
 * Base class for interactable objects. Use for simple interactables, or extend for more complex ones
 */
export default class Interactable extends Entity {
	user: Player | null;
	interactRange: number = 50;
	isDestructible: boolean = false;

	constructor(id: string, x: number, y: number, parent: Entity | null, entityType: string = 'interactable') {
		super(id, entityType, x, y, 999, parent);
		this.user = null; // No user to start
		this.supertypes = ['interactable']; // member of that supertype group
	}

	public canInteract(player: Player) {
		const dx = this.worldPos.x - player.worldPos.x;
		const dy = this.worldPos.y - player.worldPos.y;

		return Math.sqrt(dx * dx + dy * dy) <= this.interactRange;
	}

	toState() {
		return {
			...super.toState(),
			isDestructible: this.isDestructible,
		};
	}
}
