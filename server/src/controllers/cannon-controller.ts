import Cannon from '../entities/interactables/cannon';
import EntityRegistry from '../engine/entity-registry';
import { MoveData } from '@shared/socket-protocol';
import Ship from '../entities/ship';
import CombatHandler from '../handlers/combat-handler';

export default class CannonController {
	constructor(
		private entityRegistry: EntityRegistry,
		private combatHandler: CombatHandler
	) {}

	handleMove(cannon: Cannon, data: MoveData): void {
		if (!cannon) return;
		cannon.targetAngle = data.aimAngle;
	}

	handleFire(cannon: Cannon, lastActionTime: number): void {
		if (!cannon || !cannon.isReloaded) return;
		cannon.reloadTimer = cannon.reloadTime; // reset the reload timer
		const ship = cannon.parent as Ship | null;

		this.combatHandler.handleCannonFire(cannon, ship);
	}
}
