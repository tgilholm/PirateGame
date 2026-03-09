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

        this.root = document.getElementById("dig-minigame");
        this.slider = document.getElementById("dig-slider");
        this.zone = document.getElementById("dig-success-zone");
        this.label = document.getElementById("dig-label");
    }

    start(config) {
        this.active = true;
        this.position = 0;
        this.direction = 1;
        this.elapsedMs = 0;

        this.speed = config.digSpeed;
        this.successZoneStart = config.successZoneStart;
        this.successZoneSize = config.successZoneSize;
        this.durationMs = config.durationMs;

        this.root.style.display = "block";
        this.zone.style.left = `${this.successZoneStart * 100}%`;
        this.zone.style.width = `${this.successZoneSize * 100}%`;
        this.label.textContent = "Press X in the green zone";

        this.render();
    }

    stop(message = "") {
        this.active = false;
        this.root.style.display = "none";
        if (message) {
            this.label.textContent = message;
        }
    }

    update(dt) {
        if (!this.active) return;

        this.elapsedMs += dt * 1000;
        this.position += this.direction * this.speed * dt * 0.7;

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