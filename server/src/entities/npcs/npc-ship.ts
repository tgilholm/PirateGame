import { NPCShipConfig, UpgradeConfig } from '../../types';
import Entity from '../entity';
import Ship from '../ship';

export default class NPCShip extends Ship {
	pathIndex: number = 0; // how far along the path
	patrolSpeed: number = 75; // how fast it moves when circling
	detectionRadius: number = 1000;
	target: Entity | null = null;
	segmentT: number = 0;

	constructor(id: string, x: number, y: number, config: NPCShipConfig, upgradeConfig: UpgradeConfig) {
		super(id, 'npc-ship', x, y, config, upgradeConfig); // larger detection radius
		this.supertypes = ['ship', 'npc']; // fits into both
	}
}
