import InteractableModel from "./interactable-model";

export default class TreasureModel extends InteractableModel
{
    constructor(scene, parent, id, x, y) {
        super(scene, parent, id, 'treasure', x, y, 'treasure', 'Pick up Treasure', 'Drop Treasure');
    }
}