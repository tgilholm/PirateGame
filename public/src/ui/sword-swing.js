export default class SwordSwing {
	constructor(scene, parent) {
		this.graphics = scene.add.graphics();
		this.graphics.setDepth(110);
		this.swingTimer = 0;
		this.swingDuration = 300;
		this.active = false;
		parent.add(this.graphics);
	}

	trigger() {
		this.swingTimer = this.swingDuration;
		this.active = true;
	}

	update(aimAngle, delta) {
		const g = this.graphics;
		g.clear();

		if (!this.active) return;

		this.swingTimer = Math.max(0, this.swingTimer - delta);
		if (this.swingTimer <= 0) {
			this.active = false;
			return;
		}

		const progress = 1 - this.swingTimer / this.swingDuration;
		const arc = Math.PI * 0.75;
		const range = 40;

		// Sweep the arc as progress goes 0->1
		const startAngle = aimAngle - arc / 2;
		const endAngle = startAngle + arc * progress;

		const alpha = 0.6 * (1 - progress); // fade out
		g.lineStyle(6, 0xffffff, alpha);
		g.beginPath();
		g.arc(0, 0, range, startAngle, endAngle, false);
		g.strokePath();

		// Draw sword line
		g.lineStyle(3, 0xcccccc, alpha);
		g.beginPath();
		g.moveTo(0, 0);
		g.lineTo(Math.cos(endAngle) * range, Math.sin(endAngle) * range);
		g.strokePath();
	}

	destroy() {
		this.graphics.destroy();
	}
}
