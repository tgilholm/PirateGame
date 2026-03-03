import Entity from "./entity";
import Player from "./player";

export interface InteractableConfig {
    id: string,
    type: string,
    usePrompt: string,
    releasePrompt: string,
    texture: string,
    x: number,
    y: number
}

export default class InteractableEntity extends Entity {
    useType: string;
    user: Player | null;

    constructor(config: InteractableConfig, parent: Entity | null) {
        super(config.id, 'interactable', config.x, config.y, 100, parent);
        this.useType = config.type;
        this.user = null;   // No user to start
    }
}