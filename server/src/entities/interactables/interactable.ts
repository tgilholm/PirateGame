import Entity from '../entity';
import Player from '../player';

/**
 * Base class for interactable objects. Use for simple interactables, or extend for more complex ones
 */
export default class Interactable extends Entity {
	user: Player | null;
	interactRange: number = 50;

	constructor(id: string, x: number, y: number, parent: Entity | null, entityType: string = 'interactable') {
		super(id, entityType, x, y, Infinity, parent);
		this.user = null; // No user to start
		this.supertypes = ['interactable']; // member of that supertype group
	}

	public canInteract(player: Player) {
		if (player.parent !== this.parent) return; // must be on same body

		const dx = this.x - player.x;
		const dy = this.y - player.y;

		return Math.sqrt(dx * dx + dy * dy) <= this.interactRange;
	}
}
