import InteractableModel from "./interactable-model.js";

export default class TreasureModel extends InteractableModel
{
    constructor(scene, parent, id, x, y) {
        super(scene, parent, id, 'treasure', x, y, 'treasure', 'Pick up Treasure', 'Drop Treasure');
    }
}