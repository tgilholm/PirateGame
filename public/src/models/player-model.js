/* global Phaser */

import ShipModel from "./ship-model.js";



export default class PlayerModel extends Phaser.GameObjects.Container {

    /**
     * 
     * @param {Phaser.Scene} scene 
     * @param {string} id 
     * @param {number} x 
     * @param {number} y 
     */
    constructor(scene, id, x, y) {
        super(scene, x, y);

        this.scene.add.existing(this);

        this.id = id;
        this.target = { x: 0, y: 0, aimAngle: 0 };
        this.isSteering = false;
        this.isUsingCannon = false;
        this.aimAngle = 0;
        this.parentId = null;

        // Name text is not a child of the container- avoids counter-rotation logic
        this.nameText = scene.add.text(0, -50, '', {
            fontSize: '12px',
            fontFamily: 'Consolas',
            color: '#ffffff',
            backgroundColor: '#00000088',
            padding: { x: 6, y: 4 }
        }).setOrigin(0.5, 1).setDepth(100).setPosition(0, -25);

        this.bodySprite = scene.add.sprite(x, y, 'player_circle');
        this.add(this.bodySprite);

        this.gun = scene.add.rectangle(15, 0, 15, 5, 0x000000)
        this.add(this.gun);
    }


    syncFromServer(data) {
        if (data.username && this.nameText.text !== data.username) {
            this.nameText.setText(data.username);
        }
        this.target.x = data.x;
        this.target.y = data.y;
        this.target.aimAngle = data.aimAngle;


        this.isSteering = data.isSteering;
        this.isUsingCannon = data.isUsingCannon;
    }

    setGunRotation(angle) {
        const gun = this.gun;
        const parentRotation = this.parentContainer?.rotation | 0;

        gun.x = Math.cos(angle - parentRotation) * 15;  // radius
        gun.y = Math.sin(angle - parentRotation) * 15;
        gun.setRotation(angle - parentRotation);
    }

    update(delta) {
        const responseFactor = 0.15;
        const lerp = 1 - Math.pow(1 - responseFactor, delta / 16.6667);

        this.x = Phaser.Math.Linear(this.x, this.target.x, lerp);
        this.y = Phaser.Math.Linear(this.y, this.target.y, lerp);

        this.aimAngle = Phaser.Math.Angle.RotateTo(
            this.aimAngle,
            this.target.aimAngle,
            lerp
        );

        this.setGunRotation(this.aimAngle);

        if (this.parentContainer instanceof ShipModel) {
            const bob = this.parentContainer.hullSprite.y;
            this.y += bob; // hi bob
        }

        const worldPos = this.getWorldTransformMatrix();
        this.nameText.setPosition(worldPos.tx, worldPos.ty - 25);

        const isBusy = this.isSteering || this.isUsingCannon;

        // Hide the player's gun and make them slightly transparent when interacting
        this.gun.setVisible(isBusy ? false : true);
        this.setAlpha(isBusy ? 0.6 : 1.0);
    }



    destroy(scene) {
        if (this.nameText) this.nameText.destroy();

        super.destroy(scene);
    }
}