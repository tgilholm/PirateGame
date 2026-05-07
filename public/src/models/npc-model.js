import HealthBar from '../ui/health-bar.js';
import Model from './model.js';

export default class NPCModel extends Model {
	constructor(scene, id, x, y) {
		super(scene, id, x, y, 'npc', 0, false);

		this.bodySprite = scene.add.sprite(0, 0, 'skelly_front');
		this.bodySprite.setDisplaySize(48, 48);
		this.add(this.bodySprite);
		this.healthBar = new HealthBar(scene, 40, 20);

		this.lastAnim = '';
		this.lastDirection = 'down';
		this.prevX = x;
		this.prevY = y;
	}

	postUpdate(delta, deltaTime, lerp) {
		this.updateAnimations();
		const pos = this.worldPos;
		this.healthBar.update(pos.x, pos.y, this.health, this.maxHealth);
	}

	sync(data) {
		super.sync(data);
		if (data.isAttacking !== undefined) this.isAttacking = data.isAttacking;
		if (data.isDying !== undefined) this.isDying = data.isDying;
	}

	updateAnimations() {
		const dx = this.x - this.prevX;
		const dy = this.y - this.prevY;
		this.prevX = this.x;
		this.prevY = this.y;
		const speed = Math.sqrt(dx * dx + dy * dy);

		// Death takes priority and locks all other animations
		if (this.isDying || this.isDead) {
			const deathKey = `skelly-${this.lastDirection}-death`;
			if (this.lastAnim !== deathKey) {
				this.playAnim(`skelly-${this.lastDirection}-death`);
			}
			return; // nothing overrides death
		}

		if (this.isAttacking) {
			this.playAnim(`skelly-${this.lastDirection}-attack`);
			return;
		}

		if (speed < 0.1) {
			this.playAnim(`skelly-${this.lastDirection}-idle`);
			return;
		}

		if (Math.abs(dx) > Math.abs(dy)) {
			this.lastDirection = dx > 0 ? 'right' : 'left';
		} else {
			this.lastDirection = dy > 0 ? 'down' : 'up';
		}

		this.playAnim(`skelly-${this.lastDirection}-walk`);
	}

	playAnim(key) {
		if (this.lastAnim === key) return;
		this.lastAnim = key;
		this.bodySprite.play(key, true);
	}

	playHurt() {
		const hurtKey = `skelly-${this.lastDirection}-hurt`;
		this.bodySprite.play(hurtKey, true);
		this.lastAnim = ''; // allow next updateAnimations call to resume normally
	}

	destroy() {
		this.healthBar?.destroy();
		super.destroy();
	}
}
