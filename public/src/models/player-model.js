

export default class PlayerModel extends Phaser.GameObjects.Sprite{
    constructor(scene, id, x, y) {
        super(scene, x, y, 'player_circle');
        this.scene.add.existing(this);

        this.targetX = 0;
        this.targetY = 0;
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

    update(data)
    {
        if (data.username) this.nameText.setText(data.username);

        // Snap to ship if just boarded
        if (this.parentId !== data.parentId)
        {
            this.parentId = data.parentId;
            this.x = data.x;
            this.y = data.y
        }

        // Interp otherwise
        this.targetX = data.x;
        this.targetY = data.y;
    }

    preUpdate(time, delta)
    {
        if (super.preUpdate) super.preUpdate(time, delta);
        const lerp = 0.2;

        // Interpolate
        this.x = Phaser.Math.Linear(this.x, this.targetX, lerp);
        this.y = Phaser.Math.Linear(this.y, this.targetY, lerp);

        // Update name box position
        const matrix = this.getWorldTransformMatrix();
        this.nameText.setPosition(matrix.tx, matrix.ty - 25);   // Slightly above player
    }


    destroy(scene) {
        this.nameText.destroy();

        super.destroy(scene);
    }
}