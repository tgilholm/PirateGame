import Entity from "./entity";
import InteractableEntity from "./interactable-entity";

export default class Cannon extends InteractableEntity
{
    targetAngle: number;    // where the cannon is moving to

    constructor(id: string, x: number, y: number, parent: Entity | null)
    {
        super(id, 'cannon', x, y, parent);

        this.targetAngle = 0;

        console.log(y);
        if (parent)
        {
            this.r = (y < 0) ? 0 : Math.PI;
        }
    }
}