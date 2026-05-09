import HealthBar from '../ui/health-bar.js';
import Model from './model.js';

/**
 * Client-side representation of ship data. Extends model, which extends
 * Container, allowing entities to move around with and on this ship.
 */
export default class ShipModel extends Model {
	/**
	 * Creates a ship in the specified scene at the provided coordinates.
	 * @param {Phaser.Scene} scene the scene to add this ship to
	 * @param {string} id the id of the ship
	 * @param {number} x the (absolute) x coordinate to add this ship to
	 * @param {number} y the (absolute) y coordinate to add this ship to
	 * @param {ShipConfig} config the config data specifying the ship's dimensions
	 */
	constructor(scene, id, x, y, config, shipChoice) {
		super(scene, id, x, y, 'ship', 0, false); // not static, 0 rotation
		this.dimensions = config.dimensions; // for the hull dimensions
		this.interactables = [];
		this.pilotId = null;
		this.angularVelocity = 0;
		this.swayTimer = Math.random() * 1000; // For the random sine-wave "bobbing"
		this.shipChoice = null;

		// const textureKey = `hull_${this.dimensions.height}_${this.dimensions.middleWidth}`;
		// this.getHullTexture(textureKey);

		this.hullSprite = scene.add.sprite(0, 0, 'ship-sprites', shipChoice);

		// Calculate the centre offset
		const padding = 5;
		const offsetX = this.dimensions.sternRadius + this.dimensions.middleWidth / 2 + padding;
		const offsetY = this.dimensions.height / 2 + padding;
		const totalW =
			this.dimensions.middleWidth + this.dimensions.bowLength + this.dimensions.sternRadius + padding * 2;
		const totalH = this.dimensions.height + padding * 2;

		// Add the actual sprite
		this.hullSprite.setOrigin(offsetX / totalW, offsetY / totalH);
		this.add(this.hullSprite);
		this.sendToBack(this.hullSprite);

		// scene.anims.create({
		// 	key: 'eee',
		// 	frames: scene.anims.generateFrameNumbers('ship-sprites', {start: 0, end: 2}),
		// 	frameRate: 1,
		// 	repeat: -1,
		// });
		//this.hullSprite.play('eee');

		this.setDepth(10);

		this.healthBar = new HealthBar(scene, 100);
	}

	/**
	 * Overrides the sync method in the base class to provide this model with
	 * ship-specific data from the server.
	 * @param {Object} data the data from the server
	 */
	sync(data) {
		super.sync(data);

		// Snap if distance has changed a lot
		if (!this.initialised || Phaser.Math.Distance.Between(this.x, this.y, data.x, data.y) > 1500) {
			this.x = data.x;
			this.y = data.y;
			this.rotation = data.r;
			this.initialised = true;
		}

		if (data.av !== undefined) this.angularVelocity = data.av;
		if (data.pilotId !== undefined) this.pilotId = data.pilotId;
		if (data.upgrades !== undefined) this.upgrades = data.upgrades;
		if (data.sailState !== undefined) this.sailState = data.sailState;
		if (data.anchored !== undefined) this.anchored = data.anchored;
		if (data.turnAngle !== undefined) this.turnAngle = data.turnAngle;
		if (data.boostCooldown !== undefined) this.boostCooldown = data.boostCooldown;
		if (data.boostCooldownTime !== undefined) this.boostCooldownTime = data.boostCooldownTime;
		if (data.isBoosting !== undefined) this.isBoosting = data.isBoosting;
	}

	/**
	 * Overrides the base interpRotation method to also extrapolate the rotation
	 * of the ship from the angular velocity before interpolating.
	 * @param {number} deltaTime the difference in time in seconds
	 * @param {number} lerp the interpolation factor
	 */
	interpRotation(deltaTime, lerp) {
		const predictedR = this.target.r + this.angularVelocity * deltaTime;
		const diff = Phaser.Math.Angle.Wrap(predictedR - this.rotation);
		this.rotation += diff * lerp;
	}

	/**
	 * Overrides the postUpdate method from the base class to provide
	 * ship-specific updates.
	 * @param {number} delta the difference in time from the last update
	 * @param {number} deltaTime the delta, in seconds
	 * @param {number} lerp the lerp factor, calculated from the delta
	 */
	postUpdate(delta, deltaTime, lerp) {
		// Move the ship up and down slightly to "bob" with the waves
		this.swayTimer += delta;
		const bobAmount = Math.sin(this.swayTimer / 1000) * 1;
		const rockAmount = Math.cos(this.swayTimer / 1500) * 0.02;

		if (this.hullSprite) {
			this.hullSprite.y = bobAmount;
			this.hullSprite.rotation = rockAmount;
		}

		this.interactables.forEach((item) => {
			item.y = item.startY + bobAmount;
		});

		const pos = this.worldPos;
		this.healthBar.update(pos.x, pos.y, this.health, this.maxHealth);
	}

	/**
	 * Destroys this container and the contained interactables.
	 */
	destroy() {
		this.interactables.forEach((item) => {
			item.destroy();
		});

		this.healthBar?.destroy();
		super.destroy();
	}
}
