import Treasure from '../entities/interactables/treasure';
import Minigame from './minigame';

export default class DigMinigame extends Minigame {
	public speed: number = 1.2;
	public direction: number = 1;

	constructor(
		public duration: number,
		public treasure: Treasure,
		public successZoneSize: number,
		public successZoneStart: number,
		public sliderPosition: number
	) {
		super(duration, 'dig');
	}

	update(dt: number) {
		this.sliderPosition += this.direction * this.speed * dt;

		if (this.sliderPosition >= 1) {
			this.sliderPosition = 1 - (this.sliderPosition - 1);
			this.direction = -1;
		} else if (this.sliderPosition <= 0) {
			this.sliderPosition = Math.abs(this.sliderPosition);
			this.direction = 1;
		}
	}

	serialise() {
		return {
			type: this.type,
			size: this.successZoneSize,
			start: this.successZoneStart,
			pos: this.sliderPosition,
			speed: this.speed,
			dir: this.direction,
		};
	}
}
