/**
 * The Ship class provides a moving body on which Interactables and Players can exist.
 * It can move independently and all objects "attached" to it will move with it- players'
 * movement is added on to the ship's movement so that in the world space, players move
 * independently of the ship.
 * 
 */
export default class ShipModel extends Phaser.GameObjects.Container {
    constructor(scene, x, y, dimensions) {
        super(scene, x, y);
        this.dimensions = dimensions;

        this.target = { x: 0, y: 0, r: 0 };
        this.velocity = { x: 0, y: 0 };
        this.pilotId = null;
        this.angularVelocity = 0;


        this.drawHull();
        this.setupInteractables();

        scene.add.existing(this);
    }

    drawHull() {
        if (!this.dimensions) return;
        const { height, middleWidth, bowLength, sternRadius } = this.dimensions;
        const halfH = height / 2;
        const halfW = middleWidth / 2;
        const segments = 12;
        const padding = 5;
        const totalW = middleWidth + bowLength + sternRadius + (padding * 2);
        const totalH = height + (padding * 2);
        const offsetX = sternRadius + halfW + padding;
        const offsetY = halfH + padding;

        const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x5d4037, 1);
        graphics.lineStyle(4, 0xffffff, 1);
        graphics.beginPath();

        // Stern
        for (let i = 0; i <= segments; i++) {
            const theta = (Math.PI / 2) + (i / segments) * Math.PI;
            const px = offsetX + (-halfW + (Math.cos(theta) * sternRadius));
            const py = offsetY + (Math.sin(theta) * sternRadius);
            if (i === 0) graphics.moveTo(px, py);
            else graphics.lineTo(px, py);
        }

        // Bow top
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const px = offsetX + (halfW + (t * bowLength));
            const py = offsetY + (-halfH * (1 - (t * t)));
            graphics.lineTo(px, py);
        }

        // Bow bottom
        for (let i = segments; i >= 0; i--) {
            const t = i / segments;
            const px = offsetX + (halfW + (t * bowLength));
            const py = offsetY + (halfH * (1 - (t * t)));
            graphics.lineTo(px, py);
        }

        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();

        const textureName = 'hull';
        if (!this.scene.textures.exists(textureName)) {
            graphics.generateTexture(textureName, totalW, totalH);
        }


        // Create sprite and set origin to the relative center
        if (this.hullSprite) this.hullSprite.destroy();
        this.hullSprite = this.scene.add.sprite(0, 0, textureName);

        this.hullSprite.setOrigin(offsetX / totalW, offsetY / totalH);

        this.add(this.hullSprite);
        this.sendToBack(this.hullSprite);
        this.setDepth(10);
    }

    setupInteractables() {
        // Get interactable positions from params and create sprites for them
        const { interactables } = this.dimensions;
        const helm = interactables.helm;
        const cannons = interactables.cannons;
        const ladders = interactables.ladders;


        // HELM
        // move it back by half the middle width, plus a bit of the stern radius
        this.helm = this.scene.add.sprite(helm.x, helm.y, 'helm');
        this.add(this.helm);

        // CANNONS
        // Cannons
        const cannonPort = this.scene.add.sprite(cannons[0].x, cannons[0].y, 'cannon');
        cannonPort.setRotation(0); // Pointing Outward
        this.add(cannonPort);

        const cannonStarboard = this.scene.add.sprite(cannons[1].x, cannons[1].y, 'cannon');
        cannonStarboard.setRotation(Math.PI); // Pointing Outward
        this.add(cannonStarboard);

        // Ladders
        this.ladder = this.scene.add.sprite(ladders[0].x, ladders[0].y, 'ladder');
        this.add(this.ladder);

        this.ladder2 = this.scene.add.sprite(ladders[1].x, ladders[1].y, 'ladder');
        this.ladder2.setFlipY(true);
        this.add(this.ladder2);
    }

    update(data, delta) {
        this.syncFromServer(data);

        // Snap if position drifted
        if (Phaser.Math.Distance.Between(this.x, this.y, data.x, data.y) > 150)
        {
            this.x = data.x;
            this.y = data.y;
        }

        const deltaTime = delta / 1000;
        const lerp = 1 - Math.pow(1 - 0.1, delta / 16.67);


        // Extrapolate from velocity and time
        const predictedX = this.target.x + this.velocity.x * deltaTime; // where x is in however many milliseconds
        const predictedY = this.target.y + this.velocity.y * deltaTime; // Distance = speed * time
        const predictedR = this.target.r + this.angularVelocity * deltaTime;

        this.x = Math.round(Phaser.Math.Linear(this.x, predictedX, lerp));
        this.y = Math.round(Phaser.Math.Linear(this.y, predictedY, lerp));

        this.rotation = Phaser.Math.Angle.RotateTo(
            this.rotation,
            predictedR,
            lerp
        );
    }

    syncFromServer(data)
    {
        this.target.x = data.x;
        this.target.y = data.y;
        this.target.r = data.r;

        this.velocity.x = data.vx;
        this.velocity.y = data.vy;
        this.angularVelocity = data.av;
        this.pilotId = data.pilotId;
    }
}