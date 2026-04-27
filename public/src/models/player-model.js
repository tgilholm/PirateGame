/* global Phaser */

import HealthBar from '../ui/health-bar.js';
import Model from './model.js';
import ShipModel from './ship-model.js';
import ReloadIndicator from '../ui/reload-indicator.js';
import RespawnIndicator from '../ui/respawn-indicator.js';
import DashCooldown from '../ui/dash-bar.js';

/**
 * Client-side Player. Owns presentation concerns for player objects
 */
export default class PlayerModel extends Model {
	/**
	 * Constructs a player in the specified scene with the provided id and coordinates
	 * @param {Phaser.Scene} scene the scene to add this player to
	 * @param {string} id the id (usually the socket id) of this player
	 * @param {number} x the start x coordinate (relative/absolute)
	 * @param {number} y the start y coordinate (relative/absolute)
	 */
	constructor(scene, id, x, y) {
		super(scene, id, x, y, 'player', 0, false); // players can move

		this.isSteering = false;
		this.isUsingCannon = false;
		this.aimAngle = 0;
		this.parentId = null;
		this.username = null;
		this.gold = 0;
		this.reloadTime = 0;
		this.reloadTimer = 0;
		this.respawnTimer = 0;
		this.reloadIndicator = new ReloadIndicator(scene, this, 22);
		this.dashCooldown = new DashCooldown(scene, this, 28); // slightly outside reload ring
		this.dashCooldownTime = 3000;
		this.dashCooldownVal = 0;
		this.healthBar = new HealthBar(scene, 40, 20);
		this.respawnIndicator = new RespawnIndicator(scene, 100, 100);

		this.nameText = scene.add
			.text(0, -50, '', {
				fontSize: '16px',
				fontFamily: 'Consolas',
				color: '#ffffff',
				backgroundColor: '#00000088',
				padding: { x: 6, y: 4 },
			})
			.setOrigin(0.5, 1)
			.setDepth(100)
			.setPosition(0, -25);
		this.add(this.nameText);

		this.bodySprite = scene.add.sprite(0, 0, 'player_circle');
		this.add(this.bodySprite);

		this.gun = scene.add.rectangle(x + 15, y, 15, 5, 0x000000).setDepth(100);
		this.add(this.gun);

		this.carrySprite = scene.add.sprite(0, -22, 'treasure-chest');
		this.carrySprite.setDisplaySize(44, 44);
		this.carrySprite.setDepth(101);
		this.carrySprite.setVisible(false);
		this.carrySprite.setRotation(Math.PI / 2);
		this.add(this.carrySprite);
	}

	/**
	 * Extend the base sync() method with generic model data, and provide player-specific data
	 * from the server here.
	 * @param {Object} data the data from the server
	 */
	sync(data) {
		super.sync(data); // Sync generic model data

		if (data.username && this.nameText.text !== data.username) {
			this.nameText.setText(data.username);
			this.username = data.username;
		}

		if (data.gold !== undefined) this.gold = data.gold;
		if (data.isSteering !== undefined) this.isSteering = data.isSteering;
		if (data.isUsingCannon !== undefined) this.isUsingCannon = data.isUsingCannon;
		if (data.reloadTimer !== undefined) this.reloadTimer = data.reloadTimer;
		if (data.reloadTime !== undefined) this.reloadTime = data.reloadTime;
		if (data.dashCooldown !== undefined) this.dashCooldownVal = data.dashCooldown;
		if (data.dashCooldownTime !== undefined) this.dashCooldownTime = data.dashCooldownTime;
		if (data.aimAngle !== undefined) this.target.r = data.aimAngle;
		if (data.gold !== undefined) this.gold = data.gold;
		if (data.shipId !== undefined) this.shipId = data.shipId;
		if (data.respawnTimer !== undefined) this.respawnTimer = data.respawnTimer;
		if (data.activeMinigame !== undefined) this.activeMinigame = data.activeMinigame;
		if (data.isUsingShop !== undefined) this.isUsingShop = data.isUsingShop;

		if ('carryingId' in data) {
			this.carryingId = data.carryingId;
		}
	}

	/**
	 * Override the postUpdate() class to provide functionality specific to this player,
	 * without needing to touch the base update() class
	 * @param {number} delta the difference in time from the last update
	 * @param {number} deltaTime the delta, in seconds
	 * @param {number} lerp the lerp factor, calculated from the delta
	 */
	postUpdate(delta, deltaTime, lerp) {
		const gun = this.gun;
		const pos = this.worldPos;
		const isBusy = this.isSteering || this.isUsingCannon || this.isDead; // busy dyin'
		const showCarry = !!this.carryingId;

		if (this.parentContainer) {
			this.rotation = -this.parentContainer.rotation;
		}

		let bob = 0; // hi bob
		if (this.parentContainer instanceof ShipModel) {
			bob = this.parentContainer.hullSprite.y;
			this.bodySprite.y = bob;
		} else {
			this.bodySprite.y = 0;
		}

		// Gun is drawn at edge of player sprite
		gun.setPosition(Math.cos(this.aimAngle) * 15, Math.sin(this.aimAngle) * 15);
		gun.setRotation(this.aimAngle);
		gun.setVisible(!isBusy && !showCarry);

		this.carrySprite.setPosition(Math.cos(this.aimAngle) * 18, Math.sin(this.aimAngle) * 18 + bob);

		// manually update position for non-container objects
		this.carrySprite.setRotation(this.aimAngle);
		this.respawnIndicator.text.setPosition(pos.x, pos.y);
		this.carrySprite.setVisible(showCarry);
		this.setAlpha(isBusy ? 0.6 : 1.0); // visual feedback if using cannon/helm etc

		this.reloadIndicator.update(this.reloadTimer, this.reloadTime, delta);
		this.dashCooldown.update(this.dashCooldownVal, this.dashCooldownTime, delta);
		this.healthBar.update(pos.x, pos.y, this.health, this.maxHealth);
		this.respawnIndicator.update(this.respawnTimer);

		// Visual feedback for 'dead' players
		this.nameText.setColor(this.isDead ? '#ee0000' : '#ffffff'); // red: dead, white: alive
		this.nameText.setAlpha(this.isDead ? 0.7 : 1);
	}

	/**
	 * Overrides interpRotation because the player's definition of rotation applies
	 * to their gun (for now).
	 * @param {number} deltaTime the difference in time in seconds
	 * @param {number} lerp the interpolation factor
	 */
	interpRotation(deltaTime, lerp) {
		// Rotate the aim angle smoothly
		const aimDiff = Phaser.Math.Angle.Wrap(this.target.r - this.aimAngle);
		this.aimAngle += aimDiff * lerp;
	}

	/**
	 * Removes this player from the game and destroys all connected sprites
	 */
	destroy() {
		if (this.nameText) this.nameText.destroy();
		if (this.gun) this.gun.destroy();
		if (this.carrySprite) this.carrySprite.destroy();
		this.healthBar?.destroy();
		this.reloadIndicator?.destroy();
		this.dashCooldown?.destroy();

		super.destroy();
	}
}
