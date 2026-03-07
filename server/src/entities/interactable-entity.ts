import Entity from "./entity";
import Player from "./player";

/**
 * Defines the configuration details common to all interactables
 */
export interface InteractableConfig {
    id: string,
    type: string,
    usePrompt: string,
    releasePrompt: string,
    texture: string,
    x: number,
    y: number
}

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
    constructor(config: InteractableConfig, parent: Entity | null) {
        super(config.id, 'interactable', config.x, config.y, 100, parent);
        this.useType = config.type;
        this.user = null;   // No user to start
    }
}