import Parent from "./parent.js";

export default class Player {
    constructor(scene, id) {
        this.scene = scene;
        this.id = id;
        this.sprite = scene.add.circle(0, 0, 15, 0xff0000); // update to pirate sprite
        this.parentId = null; // parent is null by default
        this.target = { x: 0, y: 0 }
    }

    /**
     * 
     * @param {*} data 
     * @param {Parent} parentObject 
     */
    updateState(data, parentObject) {
        if (this.parentId !== data.parentId) {
            this.parentId = data.parentId; // re-parenting

            if (parentObject) {
                // Add to the parent's container
                parentObject.container.add(this.sprite);
            } else {
                // return to the absolute scope
                this.scene.add.existing(this.sprite);
            }
        }

        this.target.x = data.x;
        this.target.y = data.y;
    }

    update(lInterp = 0.2) {
        this.sprite.x = Phaser.Math.Linear(this.sprite.x, this.target.x, lInterp);
        this.sprite.y = Phaser.Math.Linear(this.sprite.y, this.target.y, lInterp);
    }

    
}



