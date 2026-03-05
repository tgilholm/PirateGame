import Entity from "./entity";
import Player from "./player";

export interface InteractableConfig {
    id: string,
    type: string,
    usePrompt: string,
    releasePrompt: string,
    texture: string,
    x: number,
    y: number,
    interactRange: number
}

export default class InteractableEntity extends Entity {
    useType: string;

    constructor(config: InteractableConfig, parent: Entity | null) {
        super(config.id, 'interactable', config.x, config.y, 100, parent);
        this.useType = config.type;
    }


    //returns if player is can interact with shop, server-side mirrors client-side interation checks
        canInteract(player: Player, entityConfig: InteractableConfig): boolean {
            if (player.parent) return false; //must be on foot
    
            const dx = this.x - player.x;
            const dy = this.y - player.y;
            return Math.sqrt(dx * dx + dy * dy) <= entityConfig.interactRange; //pythagorean pixel distance must be < or = interactRange
        }
}