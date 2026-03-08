import Entity from "./entity";
import Player from "./player";


/**
 * Base class for interactable objects. Use for simple interactables, or extend for more complex ones
 */
export default class InteractableEntity extends Entity {
    useType: string;
    user: Player | null;

    /**
     * Creates an interactable entity with the provided config and an optional parent
     * @param config the configuration data for this entity
     * @param parent a physics parent, if one was specified
     */
    constructor(id: string, type: string, x: number, y: number, parent: Entity | null) {
        super(id, 'interactable', x, y, 100, parent);
        this.useType = type;
        this.user = null;   // No user to start
    }

    serialise() {
        return {
            ...super.serialise(),
            useType: this.useType
        }
    }
}