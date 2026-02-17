/**
 * The "landing page" for users to the game. Features a dynamic background and title
 * and routes users to the main scene.
 */
export class StartScene extends Phaser.Scene {
    constructor() {
        super('Start');
        this.background = null;
    }

    // TODO accept usernames in title screen

    preload() {
        this.load.image('background', 'assets/water.png');
        this.load.image('title', 'assets/title.png');
        this.load.spritesheet('ship', 'assets/ship.png', { frameWidth: 320, frameHeight: 320 });
    }

    create() {
        // width & height are given in game config
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        let textPressed;

        // Add the animated background
        this.background = this.add.tileSprite(centerX, centerY, this.scale.width, this.scale.height, 'background');

        const title = this.add.image(centerX, 200, 'title');
        const ship = this.add.sprite(centerX, 400, 'ship');

        // Animate the ship sprite
        this.anims.create({
            key: 'fly',
            frames: this.anims.generateFrameNumbers('ship', { start: 0, end: 2 }),
            frameRate: 8,
            repeat: -1
        });
        ship.play('fly');

        // Make the title text "wave" in and out
        this.tweens.add({
            targets: title,
            y: 150,
            duration: 2000,
            ease: 'Sine.inOut',
            yoyo: true,
            loop: -1
        });



        // startButtonBg.on('pointerdown', () => {
        //     // Hide the form
        //     document.getElementById('input-form').style.display = 'none';


        //     this.scene.start('MainScene');      // Direct to the main game when pressed
        // });
    }


    update() {
        // Vertically scroll the background image
        if (this.background) {
            this.background.tilePositionY -= 6;
        }
    }
}
