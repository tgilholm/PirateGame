import Entity from '../entity';
import Interactable from './interactable';
import Ship from '../ship';

export default class Cannon extends Interactable {
	targetAngle: number; // where the cannon is moving to
	#baseReloadTime: number = 3000;
	#baseCannonDamage: number = 100;
	#baseCannonballSpeed: number = 300;

	reloadTimer: number = 0;

	constructor(id: string, x: number, y: number, parent: Entity | null) {
		super(id, x, y, parent, 'cannon');

		this.targetAngle = 0;

		if (parent) {
			this.r = y < 0 ? -Math.PI / 2 : Math.PI / 2; // always face outward to start
		}
	}

	get reloadTime(): number {
		if (this.parent && this.parent instanceof Ship) {
			const multiplier = this.parent.getMultiplier('reloadTime');
			return this.#baseReloadTime * multiplier;
		}

		// for non-parented cannons
		return this.#baseReloadTime;
	}

	get cannonDamage(): number {
		if (this.parent && this.parent instanceof Ship) {
			const multiplier = this.parent.getMultiplier('cannonDamage');
			return this.#baseCannonDamage * multiplier;
		}

		// for non-parented cannons
		return this.#baseCannonDamage;
	}

	get cannonballSpeed(): number {
		if (this.parent && this.parent instanceof Ship) {
			const multiplier = this.parent.getMultiplier('cannonballSpeed');
			return this.#baseCannonballSpeed * multiplier;
		}

		// for non-parented cannons
		return this.#baseCannonballSpeed;
	}

	get isReloaded(): boolean {
		return this.reloadTimer <= 0;
	}

	toState() {
		return {
			...super.toState(),
			reloadTimer: this.reloadTimer,
			reloadTime: this.reloadTime,
			userId: this.user?.id ?? null, // send null if no user - json drops undefined
		};
	}
}
