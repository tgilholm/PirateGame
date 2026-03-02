import Entity from "./entity";

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

    constructor(config: InteractableConfig, parent: Entity | null) {
        super(config.id, 'interactable', config.x, config.y, 100, parent);
        this.useType = config.type;
    }
}