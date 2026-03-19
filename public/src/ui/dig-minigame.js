export default class DigMinigame {
	constructor() {
		this.active = false;
		this.position = 0;
		this.direction = 1;
		this.speed = 1;
		this.successZoneStart = 0.4;
		this.successZoneSize = 0.18;
		this.durationMs = 2500;
		this.elapsedMs = 0;

		this.root = document.getElementById('dig-minigame');
		this.slider = document.getElementById('dig-slider');
		this.zone = document.getElementById('dig-success-zone');
		this.label = document.getElementById('dig-label');
	}

	start(config) {
		this.active = true;
		this.position = 0;
		this.direction = 1;
		this.elapsedMs = 0;

		this.speed = config.digSpeed ?? 1.2;
		this.successZoneStart = config.successZoneStart ?? 0.4;
		this.successZoneSize = config.successZoneSize ?? 0.18;
		this.durationMs = config.durationMs ?? 625;

		this.root.style.display = 'block';
		this.zone.style.left = `${this.successZoneStart * 100}%`;
		this.zone.style.width = `${this.successZoneSize * 100}%`;
		this.label.textContent = 'Press X in the green zone';

		this.render();
	}

	stop() {
		this.active = false;
		this.root.style.display = 'none';
	}

	update(dt) {
		if (!this.active) return;

		this.elapsedMs += dt * 250;

		// bounce left/right across the bar
		this.position += this.direction * this.speed * dt * 0.65;

		if (this.position >= 1) {
			this.position = 1;
			this.direction = -1;
		} else if (this.position <= 0) {
			this.position = 0;
			this.direction = 1;
		}

		if (this.elapsedMs >= this.durationMs) {
			this.stop();
		}

		this.render();
	}

	render() {
		this.slider.style.left = `${this.position * 100}%`;
	}

	getSliderPosition() {
		return this.position;
	}
}
