//import Helm from "./helm.js";
import Model from "./model.js";

/**
 * The Ship class provides a moving body on which Interactables and Players can exist.
 * It can move independently and all objects "attached" to it will move with it- players'
 * movement is added on to the ship's movement so that in the world space, players move
 * independently of the ship.
 * 
 */
export default class ShipModel extends Model {
    constructor(scene, x, y, params) {
        super(scene, x, y);
        this.params = params;
        this.hullSprite = null;
        this.drawHull();
        this.setupInteractables()

        this.velocity = { x: 0, y: 0 };
        this.angularVelocity = 0;
        this.lastUpdateTime = 0;
    }

    //draws ship hull based on parameters in params
    drawHull() {
        if (!this.params) return;
        const { height, middleWidth, bowLength, sternRadius } = this.params;
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

        const textureName = `hull_${this.params.id}`;
        graphics.generateTexture(textureName, totalW, totalH);

        // Create sprite and set origin to the relative center
        if (this.hullSprite) this.hullSprite.destroy();
        this.hullSprite = this.scene.add.sprite(0, 0, textureName);

        this.hullSprite.setOrigin(offsetX / totalW, offsetY / totalH);

        this.container.add(this.hullSprite);
        this.container.sendToBack(this.hullSprite);
        this.container.setDepth(10);

        console.log(`Ship drawn at ${this.container.x}, ${this.container.y}`)
    }

    setupInteractables() {
        // Get interactable positions from params and create sprites for them
        const { interactables } = this.params;
        const helm = interactables.helm;
        const cannons = interactables.cannons;
        const ladders = interactables.ladders;


        // HELM
        // move it back by half the middle width, plus a bit of the stern radius
        this.helm = this.scene.add.sprite(helm.x, helm.y, 'helm');
        this.container.add(this.helm);

        // CANNONS
        // Cannon 1
        const cannonPort = this.scene.add.sprite(cannons[0].x, cannons[0].y, 'cannon');
        cannonPort.setRotation(0); // Pointing Outward
        this.container.add(cannonPort);

        // Cannon 2
        const cannonStarboard = this.scene.add.sprite(cannons[1].x, cannons[1].y, 'cannon');
        cannonStarboard.setRotation(Math.PI); // Pointing Outward
        this.container.add(cannonStarboard);

        // LADDER1
        this.ladder = this.scene.add.sprite(ladders[0].x, ladders[0].y, 'ladder');
        this.container.add(this.ladder);

        // LADDER2
        this.ladder2 = this.scene.add.sprite(ladders[1].x, ladders[1].y, 'ladder');
        this.ladder2.setFlipY(true);
        this.container.add(this.ladder2);


        // Ensure all these objects are above the hull sprite
        // (Since hullSprite was sentToBack, new items are naturally on top)


        console.log(`Interactables created ${this.container}`)
    }


    //extrapolation + interpolation to smooth movement client-side
    update() {
        if (!this.target) return;


        // Get the current time
        const now = performance.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000;   //in seconds
        this.lastUpdateTime = now;

        // Extrapolate "expected position" from velocity and time
        const predictedX = this.target.x + this.velocity.x * deltaTime; // where x is in however many milliseconds
        const predictedY = this.target.y + this.velocity.y * deltaTime; // Distance = speed * time

        // Interpolate between the current and predicted positions instead of waiting for the server to update
        this.container.x = Math.round(Phaser.Math.Linear(this.container.x, predictedX, 0.08));
        this.container.y = Math.round(Phaser.Math.Linear(this.container.y, predictedY, 0.08));

        // Predict the rotation
        const predictedRotation = this.target.r + this.angularVelocity * deltaTime;
        let rotDiff = predictedRotation - this.container.rotation;

        // Normalize to shortest path
        while (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
        while (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;

        // Apply same interpolation as position
        this.container.rotation += rotDiff * 0.08;

    }

    /**
* Converts local- (ship-scope) coordinates to absolute (world-scope)
* coordinates using RotateAround
* @param {Number} localX The X coordinate relative to this object
* @param {Number} localY The Y coordinate relative to this object
* @returns a Vector of x and y coordinates
*/
    toWorld(localX, localY) {
        return Phaser.Math.RotateAround(
            {
                x: this.container.x + localX, y: this.container.y + localY
            },
            this.container.x, this.container.y, this.container.rotation
        )
    }

    /**
     * Converts absolute coordinates to coordinates relative to this object
     * @param {Number} worldX 
     * @param {Number} worldY 
     * @returns the x and y coordinates relative to this object
     */
    toLocal(worldX, worldY) {
        const angle = -this.container.rotation;
        const dx = worldX - this.container.x;
        const dy = worldY - this.container.y;

        return {
            x: dx * Math.cos(angle) - dy * Math.sin(angle),
            y: dx * Math.sin(angle) + dy * Math.cos(angle)
        };
    }
}