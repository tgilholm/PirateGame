

export default class PlayerModel extends Phaser.GameObjects.Sprite {
    constructor(scene, id, x, y) {
        super(scene, x, y, 'player_circle');
        this.scene.add.existing(this);

        this.target = { x: 0, y: 0 };
        this.isSteering = false;

        this.parentId = null;

        this.nameText = scene.add.text(0, 0, '', {
            fontSize: '12px',
            fontFamily: 'Consolas',
            color: '#ffffff',
            backgroundColor: '#00000088',
            padding: { x: 6, y: 4 }
        }).setOrigin(0.5, 1).setDepth(100);
    }

    update(data) {
        if (data.username) this.nameText.setText(data.username);

        // Snap to ship if just boarded
        if (this.parentId !== data.parentId) {
            this.parentId = data.parentId;
            this.x = data.x;
            this.y = data.y
        }

        // Interp otherwise
        this.target.x = data.x;
        this.target.y = data.y;
    }

    preUpdate(time, delta) {
        if (super.preUpdate) super.preUpdate(time, delta);

        // How fast the client responds to updates
        const responseFactor = 0.15;
        const lerp = 1 - Math.pow(1 - responseFactor, delta / 16.6667); // Aim for 60fps

        // Interpolate
        this.x = Phaser.Math.Linear(this.x, this.target.x, lerp);
        this.y = Phaser.Math.Linear(this.y, this.target.y, lerp);

        // Update name box position
        const matrix = this.getWorldTransformMatrix();
        this.nameText.setPosition(matrix.tx, matrix.ty - 25);   // Slightly above player
    }


    destroy(scene) {
        this.nameText.destroy();

        super.destroy(scene);
    }
}