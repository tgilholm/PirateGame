import ReloadIndicator from "../ui/reload-indicator.js";
import InteractableModel from "./interactable-model.js";

export default class CannonModel extends InteractableModel {
    constructor(scene, parent, id, x, y) {
        super(scene, parent, id, 'cannon', x, y, 'cannon', 'Use Cannon', 'Release Cannon');
        this.isStatic = false;  // cannons can move
        this.reloadTime = 0;
        this.reloadTimer = 0;
        this.userId = null;
        this.reloadIndicator = new ReloadIndicator(scene, this, 28);
    }

    sync(data) {
        super.sync(data);   // Sync generic model data

        if (data.reloadTimer !== undefined) this.reloadTimer = data.reloadTimer;
        if (data.reloadTime !== undefined) this.reloadTime = data.reloadTime;
        if (data.userId !== undefined) this.userId = data.userId;
    }

    postUpdate(delta, deltaTime, lerp) {

        this.reloadIndicator.update(this.reloadTimer, this.reloadTime, delta);
    }

    destroy() {
        this.reloadIndicator?.destroy();
        super.destroy();
    }
}