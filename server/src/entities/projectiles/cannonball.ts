import Projectile from './projectile';

export default class Cannonball extends Projectile {
	constructor(id: string, x: number, y: number, r: number, speed: number, damage: number) {
		super(id, 'cannonball', x, y, r, speed);
		this.ttl = 1500;
		this.damage = damage;
		this.radius = 8; // larger
	}
}
