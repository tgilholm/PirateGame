import Entity from "../entity";
import InteractableEntity from "./interactable-entity";

export default class Ladder extends InteractableEntity {

    constructor(id: string, x: number, y: number, parent: Entity | null) {
        super(id, x, y, parent, 'ladder');


        if (parent) {
            this.r = (y < 0) ? 0 : Math.PI;
        }
    }
}