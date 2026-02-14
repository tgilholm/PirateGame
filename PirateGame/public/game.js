class MainScene extends Phaser.Scene {
    constructor() {
        super("MainScene");

        this.player = null;
        this.keys = null;
        this.speed = 200;
    };

    preload() {
        this.load.image("player", "assets/player.png");
    }

    create() {
        this.player = this.physics.add.sprite(400, 300, "player");
        this.keys = this.input.keyboard.addKeys("W,A,S,D");
    }

    update(time, delta) {
        this.player.setVelocity(0);
        if (this.keys.W.isDown) {
            this.player.setVelocityY(-this.speed);
        }
        if (this.keys.A.isDown) {
            this.player.setVelocityX(-this.speed);
        }
        if (this.keys.S.isDown) {
            this.player.setVelocityY(this.speed);
        }
        if (this.keys.D.isDown) {
            this.player.setVelocityX(this.speed);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#2d2d2d",
    physics: {
        default: "arcade",
        arcade: { debug: false }
    },
    scene: [MainScene]
}

new Phaser.Game(config);
