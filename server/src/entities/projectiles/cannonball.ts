import Projectile from './projectile';
import entityConfig from '../../../../shared/entity-config.json';

export default class Cannonball extends Projectile {
	constructor(
		id: string,
		x: number,
		y: number,
		r: number,
		speed: number = entityConfig.ship.defaultStats.cannonBallSpeed
	) {
		super(id, 'cannonball', x, y, r, speed);
		this.ttl = entityConfig.ship.defaultStats.cannonRange;
		this.damage = entityConfig.ship.defaultStats.cannonDamage;
		this.radius = 8; // larger
	}
}
