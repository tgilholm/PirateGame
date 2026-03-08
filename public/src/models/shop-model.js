import InteractableModel from "./interactable-model";

export default class ShopModel extends InteractableModel {
    constructor(scene, parent, id, x, y) {
        super(scene, parent, id, 'shop', x, y, 'shop', 'Enter Shop', '');
    }
}