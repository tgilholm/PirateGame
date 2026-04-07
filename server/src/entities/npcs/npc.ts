import Entity from '../entity';

export default class NPC extends Entity {
	target: Entity | null = null; // who this npc is currently chasing
	speed: number = 4;
	detectionRadius: number;
	attackDamage: number = 1;

	constructor(id: string, type: string = 'npc', x: number, y: number, detectionRadius: number = 250) {
		super(id, type, x, y, 75, null);

		this.detectionRadius = detectionRadius;
	}
}
