/* global Phaser */

import HealthBar from '../ui/health-bar.js';
import Model from './model.js';
import ShipModel from './ship-model.js';
import ReloadIndicator from '../ui/reload-indicator.js';
import RespawnIndicator from '../ui/respawn-indicator.js';
import DashCooldown from '../ui/dash-bar.js';
import SwordSwing from '../ui/sword-swing.js';
import SwimmingBubbles from '../ui/swimming-bubbles.js';

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
		this.dashCooldown = new DashCooldown(scene, this, 16); // slightly outside reload ring
		this.dashCooldownTime = 3000;
		this.dashCooldownVal = 0;
		this.reloadIndicator = new ReloadIndicator(scene, this, 12);
		this.healthBar = new HealthBar(scene, 40, 20);
		this.respawnIndicator = new RespawnIndicator(scene, 100, 100);
		this.swordSwing = new SwordSwing(scene, this);
		this.swingCooldown = 0;
		this.swingCooldownTime = 600;
		this.wasSwinging = false;
		this.isSwimming = false;
		this.shootTimer = 0;
		this.shootDuration = 200; //  how long the shoot anim plays
		this.swimmingBubbles = new SwimmingBubbles(scene, this);
		this.swimmingTimer = 0;
		this.bubblesRemaining = 4;
		this.swingAnimTimer = 0;
		this.swingAnimDuration = 300;
		this.setDepth(10);

		this.nameText = scene.add
			.text(0, -16, '', {
				fontSize: '12px',
				fontFamily: 'Consolas',
				color: '#ffffff',
				backgroundColor: '#00000088',
				padding: { x: 3, y: 1 },
			})
			.setOrigin(0.5, 1)
			.setDepth(100)
			.setPosition(0, -8);
		this.add(this.nameText);

		this.shadowSprite = scene.add.ellipse(0, 8, 12, 4, 0x22222, 0.3);
		this.add(this.shadowSprite);

		this.bodySprite = scene.add.sprite(0, 0, 'pirate_default');
		this.add(this.bodySprite);

		this.carrySprite = scene.add.sprite(0, -22, 'treasure-chest');
		this.carrySprite.setDepth(101);
		this.carrySprite.setVisible(false);
		this.carrySprite.setRotation(Math.PI / 2);
		this.add(this.carrySprite);

		//for player animations
		this.lastAnim = '';
		this.lastDirection = 'down';

		this.prevX = x;
		this.prevY = y;
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
		if (data.isSwimming !== undefined) this.isSwimming = data.isSwimming;
		if (data.gold !== undefined) this.gold = data.gold;
		if (data.isSteering !== undefined) this.isSteering = data.isSteering;
		if (data.isUsingCannon !== undefined) this.isUsingCannon = data.isUsingCannon;
		if (data.reloadTimer !== undefined) {
			if (data.reloadTimer > this.reloadTimer) {
				this.shootTimer = this.shootDuration;
			}
			this.reloadTimer = data.reloadTimer;
		}
		if (data.reloadTime !== undefined) this.reloadTime = data.reloadTime;
		if (data.dashCooldown !== undefined) this.dashCooldownVal = data.dashCooldown;
		if (data.dashCooldownTime !== undefined) this.dashCooldownTime = data.dashCooldownTime;
		if (data.aimAngle !== undefined) this.target.r = data.aimAngle;
		if (data.gold !== undefined) this.gold = data.gold;
		if (data.shipId !== undefined) this.shipId = data.shipId;
		if (data.respawnTimer !== undefined) this.respawnTimer = data.respawnTimer;
		if (data.activeMinigame !== undefined) this.activeMinigame = data.activeMinigame;
		if (data.isUsingShop !== undefined) this.isUsingShop = data.isUsingShop;
		if (data.pirateColour !== undefined) {
			const newKey = `pirate_${data.pirateColour}`;
			if (this.bodySprite.texture.key !== newKey) {
				this.bodySprite.setTexture(newKey);
			}
			this.pirateColour = data.pirateColour;
		}
		if (data.swingCooldown !== undefined) this.swingCooldown = data.swingCooldown;
		if (data.swingCooldownTime !== undefined) this.swingCooldownTime = data.swingCooldownTime;
		if (data.isSwinging !== undefined) {
			if (data.isSwinging && !this.wasSwinging) {
				this.swordSwing.trigger();
				this.swingAnimTimer = this.swingAnimDuration;
				const colour = this.pirateColour ?? 'default';
				const angle = this.aimAngle;
				let atkDir;
				if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
					atkDir = angle > -Math.PI / 2 && angle < Math.PI / 2 ? 'right' : 'left';
				} else {
					atkDir = angle > 0 ? 'down' : 'up';
				}
				this.bodySprite.play(`pirate-${colour}-atk-${atkDir}`, true);
				this.lastAnim = '';
			}
			this.wasSwinging = data.isSwinging;
		}
		if (data.swimmingTimer !== undefined) this.swimmingTimer = data.swimmingTimer;
		if (data.swimmingBubbles !== undefined) this.bubblesRemaining = data.swimmingBubbles;

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
		this.updateAnimations();
		const pos = this.worldPos;
		const isBusy = this.isSteering || this.isUsingCannon || this.isDead; // busy dyin'
		const showCarry = !!this.carryingId;

		if (this.shootTimer > 0) this.shootTimer = Math.max(0, this.shootTimer - delta);
		if (this.swingAnimTimer > 0) this.swingAnimTimer = Math.max(0, this.swingAnimTimer - delta);
		if (this.shootTimer > 0) this.shootTimer = Math.max(0, this.shootTimer - delta);

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

		this.carrySprite.setPosition(Math.cos(this.aimAngle) * 18, Math.sin(this.aimAngle) * 18 + bob);

		// manually update position for non-container objects
		this.carrySprite.setRotation(this.aimAngle);
		this.respawnIndicator.text.setPosition(pos.x, pos.y);
		this.carrySprite.setVisible(showCarry);
		this.setAlpha(isBusy ? 0.6 : 1.0); // visual feedback if using cannon/helm etc

		this.reloadIndicator.update(this.reloadTimer, this.reloadTime, delta);
		this.swordSwing.update(this.aimAngle, delta);
		this.dashCooldown.update(this.dashCooldownVal, this.dashCooldownTime, delta);
		this.healthBar.update(pos.x, pos.y, this.health, this.maxHealth);
		this.respawnIndicator.update(this.respawnTimer);
		this.swimmingBubbles.update(this.bubblesRemaining, this.isSwimming);

		this.shadowSprite.setVisible(!this.isSwimming);

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
	 * Handles player animations
	 */
	updateAnimations() {
		const dx = this.x - this.prevX;
		const dy = this.y - this.prevY;
		this.prevX = this.x;
		this.prevY = this.y;
		const speed = Math.sqrt(dx * dx + dy * dy);

		if (this.isDead) {
			this.playAnim('pirate-death');
			return;
		}

		if (this.swingAnimTimer > 0) return;

		if (this.shootTimer > 0) {
			let shootDir;
			if (Math.abs(Math.cos(this.aimAngle)) > Math.abs(Math.sin(this.aimAngle))) {
				shootDir = this.aimAngle > -Math.PI / 2 && this.aimAngle < Math.PI / 2 ? 'right' : 'left';
			} else {
				shootDir = this.aimAngle > 0 ? 'down' : 'up';
			}
			this.playAnim(`pirate-shoot-${shootDir}`);
			return;
		}

		if (this.activeMinigame) {
			const digDir = Math.abs(Math.cos(this.aimAngle)) > Math.abs(Math.sin(this.aimAngle)) ? 'right' : 'left';
			this.playAnim(`pirate-dig-${digDir}`);
			return;
		}

		if (this.isSteering || this.isUsingCannon) {
			this.playAnim('pirate-idle-down');
			return;
		}
		if (speed < 0.1) {
			if (this.isSwimming) {
				this.playAnim('pirate-swim');
			} else {
				this.playAnim(`pirate-idle-${this.lastDirection}`);
			}
			return;
		}
		// Swimming idle is handled above via pirate-idle-* — only override movement anims
		if (this.isSwimming) {
			this.playAnim('pirate-swim');
			return;
		}
		if (Math.abs(dx) > Math.abs(dy)) {
			if (dx > 0) {
				this.lastDirection = 'right';
				this.playAnim('pirate-walk-right');
			} else {
				this.lastDirection = 'left';
				this.playAnim('pirate-walk-left');
			}
		} else {
			if (dy > 0) {
				this.lastDirection = 'down';
				this.playAnim('pirate-walk-down');
			} else {
				this.lastDirection = 'up';
				this.playAnim('pirate-walk-up');
			}
		}
	}

	playAnim(key) {
		// key arrives as e.g. 'pirate-idle-down'; inject colour
		const colour = this.pirateColour ?? 'default';
		const colouredKey = key.replace('pirate-', `pirate-${colour}-`);
		if (this.lastAnim === colouredKey) return;
		this.lastAnim = colouredKey;
		this.bodySprite.play(colouredKey, true);
	}

	/**
	 * Removes this player from the game and destroys all connected sprites
	 */
	destroy() {
		if (this.nameText) this.nameText.destroy();
		if (this.carrySprite) this.carrySprite.destroy();
		this.healthBar?.destroy();
		this.reloadIndicator?.destroy();
		this.swordSwing?.destroy();
		this.dashCooldown?.destroy();
		this.swimmingBubbles?.destroy();
		super.destroy();
	}
}
