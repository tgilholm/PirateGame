import Parent from "./parent.js";

export default class Player {
    constructor(scene, id) {
        this.scene = scene;
        this.id = id;

        this.sprite = scene.add.circle(0, 0, 15, 0xff0000); // update to pirate sprite
        this.parentId = null; // parent is null by default
        this.parent = null;
        this.target = { x: 0, y: 0 }
        this.isSteering = false;

        this.nameText = scene.add.text(0, 0, '', {
            fontSize: '12px',
            fontFamily: 'Consolas',
            color: '#ffffff',
            backgroundColor: '#00000088',
            padding: { x: 6, y: 4 }
        });
        this.nameText.setOrigin(0.5, 1);
        this.nameText.setDepth(100);

        console.log(`Player drawn at ${this.sprite.x}, ${this.sprite.y}`);
    }

    /**
     * 
     * @param {*} data 
     * @param {Parent} parentObject 
     */
    updateState(data, parentObject) {
        console.log(`Player updateState called with x: ${data.x}, y: ${data.y}, parentId: ${data.parentId}`);

        // if username provided and not already set
        if (data.username && this.nameText.text !== data.username) {
            this.nameText.setText(data.username);
        }

        if (this.parentId !== data.parentId) {
            // Remove sprite from old container before re-parenting
            if (this.parent && this.parent.container) {
                this.parent.container.remove(this.sprite);
                this.scene.add.existing(this.sprite);
            }

            this.parentId = data.parentId;
            this.parent = parentObject;

            if (parentObject) {
                parentObject.container.add(this.sprite);
            }

            //re-position immediately on ship enter
            this.sprite.x = data.x;
            this.sprite.y = data.y;
        }

        // Always keep parent reference in sync
        this.parent = parentObject;

        this.target.x = data.x;
        this.target.y = data.y;
    }

    update(lInterp = 0.2) {
        this.sprite.x = Math.round(Phaser.Math.Linear(this.sprite.x, this.target.x, lInterp));
        this.sprite.y = Math.round(Phaser.Math.Linear(this.sprite.y, this.target.y, lInterp));

        // Display name above player in absolute scope
        let worldX = this.sprite.x;
        let worldY = this.sprite.y;

        if (this.parentId && this.parent) {
            const shipContainer = this.parent.container;
            const rotatedPos = Phaser.Math.RotateAround(
                { x: this.sprite.x, y: this.sprite.y }, 0, 0, shipContainer.rotation
            );
            worldX = shipContainer.x + rotatedPos.x;
            worldY = shipContainer.y + rotatedPos.y
        }

        this.nameText.x = worldX;
        this.nameText.y = worldY - 20;
    }

    //cleanup when player leaves
    destroy() {
        this.sprite.destroy();
        this.nameText.destroy();
    }
}