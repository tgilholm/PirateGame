export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    preload() {
        this.load.image('background', 'assets/water.png');
        this.load.image('title', 'assets/title.png');

        // Load your custom sprite
        this.load.spritesheet('ship', 'assets/ship.png', {
    frameWidth: 320,
    frameHeight: 320
});


    }

    create() {
        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');

        const title = this.add.image(640, 200, 'title');

        const ship = this.add.sprite(640, 400, 'ship');

        // Create animation
        this.anims.create({
            key: 'fly',
            frames: this.anims.generateFrameNumbers('ship', { start: 0, end: 2 }),
            frameRate: 8,
            repeat: -1
        });

        ship.play('fly');

        this.tweens.add({
            targets: title,
            y: 150,
            duration: 2000,
            ease: 'Sine.inOut',
            yoyo: true,
            loop: -1
        });
    }

    update() {
        this.background.tilePositionY -= 2;
    }

}
