export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
        this.background = null;
    }

    preload() {
        this.load.image('background', 'assets/water.png');
        this.load.image('title', 'assets/title.png');
        this.load.spritesheet('ship', 'assets/ship.png', { frameWidth: 320, frameHeight: 320 });
    }

    create() {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        this.background = this.add.tileSprite(centerX, centerY, this.scale.width, this.scale.height, 'background');

        const title = this.add.image(centerX, 200, 'title');

        const ship = this.add.sprite(centerX, 400, 'ship');
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

        const startButtonBg = this.add.rectangle(centerX, 520, 260, 80, 0x0d2f4f, 0.9)
            .setStrokeStyle(4, 0xffffff, 1)
            .setInteractive({ useHandCursor: true });
        const startButtonText = this.add.text(centerX, 520, 'Start Game', {
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        startButtonBg.on('pointerover', () => {
            startButtonBg.setScale(1.08);
            startButtonText.setScale(1.08);
            startButtonBg.setAlpha(0.85);
        });

        startButtonBg.on('pointerout', () => {
            startButtonBg.setScale(1);
            startButtonText.setScale(1);
            startButtonBg.setAlpha(1);
        });

        startButtonBg.on('pointerdown', () => {
            this.scene.start('MainScene');
        });
    }

    update() {
        if (this.background) {
            this.background.tilePositionY -= 6;
        }
    }
}