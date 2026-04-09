import EntityFactory from 'src/entities/entity-factory';
import Cannon from 'src/entities/interactables/cannon';
import Ship from 'src/entities/ship';

export default class CombatHandler {
	constructor(private factory: EntityFactory) {}

	handleCannonFire(cannon: Cannon, ship: Ship | null = null) {
		if (!cannon || !cannon.isReloaded) return;

		cannon.reloadTimer = cannon.reloadTime;
		const cannonEndOffset = 20;
		const worldAngle = ship ? cannon.r + ship.r : cannon.r;

		const worldPos = cannon.worldPos;
		const spawnPos = {
			x: worldPos.x + Math.cos(worldAngle) * cannonEndOffset,
			y: worldPos.y + Math.sin(worldAngle) * cannonEndOffset,
		};

		const worldVel = ship ? { x: ship.vx, y: ship.vx } : { x: 0, y: 0 };
		this.factory.createCannonball(
			spawnPos.x,
			spawnPos.y,
			worldAngle,
			cannon.cannonballSpeed,
			cannon.cannonDamage,
			worldVel,
			cannon
		);
	}
}
