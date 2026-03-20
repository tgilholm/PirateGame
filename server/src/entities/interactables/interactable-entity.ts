import Entity from '../entity';
import Player from '../player';

/**
 * Base class for interactable objects. Use for simple interactables, or extend for more complex ones
 */
export default class InteractableEntity extends Entity {
	user: Player | null;

	constructor(
		id: string,
		x: number,
		y: number,
		parent: Entity | null,
		entityType: string = 'interactable'
	) {
		super(id, entityType, x, y, Infinity, parent);
		this.user = null; // No user to start
		this.supertypes = ['interactable']; // member of that supertype group
	}
}
