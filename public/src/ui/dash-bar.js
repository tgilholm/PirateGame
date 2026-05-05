export default class DashCooldown {
	constructor(scene, parent, radius = 22) {
		this.graphics = scene.add.graphics();
		this.radius = radius;
		this.fadeTimer = 0;
		this.wasReady = false;
		parent.add(this.graphics);
	}

	update(dashCooldown, dashCooldownTime, delta) {
		const g = this.graphics;
		g.clear();

		const isReady = dashCooldown <= 0;

		if (isReady) {
			if (!this.wasReady) {
				this.fadeTimer = 600;
				this.wasReady = true;
			}

			if (this.fadeTimer <= 0) return;

			this.fadeTimer -= delta;
			const alpha = Math.max(0, this.fadeTimer / 600) * 0.8;
			g.lineStyle(3, 0x00aaff, alpha);
			g.strokeCircle(0, 0, this.radius);
		} else {
			this.wasReady = false;
			this.fadeTimer = 0;

			const progress = 1 - dashCooldown / dashCooldownTime;
			const endAngle = -Math.PI / 2 + Math.PI * 2 * progress;

			g.lineStyle(3, 0x00aaff, 0.5);
			g.beginPath();
			g.arc(0, 0, this.radius, -Math.PI / 2, endAngle, false);
			g.strokePath();
		}
	}

	destroy() {
		this.graphics.destroy();
	}
}
