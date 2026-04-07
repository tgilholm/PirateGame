/**
 * Client-side representation of dig minigame
 */
export default class DigMinigame {
	constructor() {
		this.active = false;
		this.currentPos = 0;
		this.targetPos = 0;

		this.root = document.getElementById('dig-minigame');
		this.slider = document.getElementById('dig-slider');
		this.zone = document.getElementById('dig-success-zone');
		this.label = document.getElementById('dig-label');
	}

	sync(data) {
		if (!data) {
			if (this.active) this.stop();
			return; // server not sending updates, game over
		}

		// server sent an update, wake up the minigame
		if (!this.active) this.active = true;

		this.root.style.display = 'block';
		this.zone.style.left = `${data.start * 100}%`; // css minigame is cursed
		this.zone.style.width = `${data.size * 100}%`;
		this.targetPos = data.pos; // for interp
		this.direction = data.dir; // for extrap
		this.speed = data.speed;

		// snap on first packet
		if (Math.abs(this.currentPos - this.targetPos) > 0.2) {
			this.currentPos = this.targetPos;
		}
	}

	stop() {
		this.active = false;
		this.root.style.display = 'none';
	}

	update(dt) {
		if (!this.active) return;

		// Extrapolate based on server data
		this.currentPos += this.direction * this.speed * dt;
		const syncError = this.targetPos - this.currentPos;
		this.currentPos += syncError * 0.1;

		// bounce off walls
		if (this.currentPos >= 1) {
			this.currentPos = 1;
			this.direction = -1;
		} else if (this.currentPos <= 0) {
			this.currentPos = 0;
			this.direction = 1;
		}

		this.render();
	}

	render() {
		this.slider.style.left = `${this.currentPos * 100}%`;
	}
}
