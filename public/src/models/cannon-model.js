import InteractableModel from "./interactable-model.js";

export default class CannonModel extends InteractableModel {
    constructor(scene, parent, id, x, y) {
        super(scene, parent, id, 'cannon', x, y, 'cannon', 'Use Cannon', 'Release Cannon');
        this.isStatic = false;  // cannons can move
    }
}