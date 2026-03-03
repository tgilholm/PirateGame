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
        this.target = { x: 0, y: 0 };
        this.isSteering = false;
        this.isUsingCannon = false;
        this.aimAngle = 0;
        this.parentId = null;

        // Create the children of the player container
        this.nameText = scene.add.text(0, -50, '', {
            fontSize: '12px',
            fontFamily: 'Consolas',
            color: '#ffffff',
            backgroundColor: '#00000088',
            padding: { x: 6, y: 4 }
        }).setOrigin(0.5, 1).setDepth(100);
        this.add(this.nameText);

        this.bodySprite = scene.add.sprite(x, y, 'player_circle');
        this.add(this.bodySprite);

        this.gun = scene.add.rectangle(5, 0, 15, 5, 0x000000).setOrigin(0, 0.5);
        this.add(this.gun);
    }

    update(data, delta) {
        if (data.username && this.nameText.text !== data.username) {
            this.nameText.setText(data.username);
        }

        const responseFactor = 0.15;
        const lerp = 1 - Math.pow(1 - responseFactor, delta / 16.6667); // Aim for 60fps

        // Interpolate
        this.x = Phaser.Math.Linear(this.x, this.target.x, lerp);
        this.y = Phaser.Math.Linear(this.y, this.target.y, lerp);

        if (this.parentContainer instanceof ShipModel) {
            const bob = this.parentContainer.hullSprite.y;
            this.y += bob;
        }



        this.setAlpha(this.isSteering || this.isUsingCannon ? 0.6 : 1.0);

        // Update name box position
        const matrix = this.getWorldTransformMatrix();
        this.nameText.setPosition(matrix.tx, matrix.ty - 25);

        // Hide name if off-screen
        const cam = this.scene.cameras.main;
        this.nameText.setVisible(cam.worldView.contains(matrix.tx, matrix.ty));


        // Interp otherwise
        this.target.x = data.x;
        this.target.y = data.y;
        this.gun.setRotation(data.aimAngle);

        this.isSteering = data.isSteering;
        this.isUsingCannon = data.isUsingCannon;
    }



    destroy(scene) {
        if (this.nameText) this.nameText.destroy();

        super.destroy(scene);
    }
}