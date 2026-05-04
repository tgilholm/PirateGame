import Entity from '../entity';

export default class NPC extends Entity {
	target: Entity | null = null; // who this npc is currently chasing
	speed: number = 1.5;
	detectionRadius: number;
	attackTimer: number = 0;
	attackTime: number = 500; // ms
	attackDamage: number = 20; // roughly 5-hit a player

	constructor(id: string, type: string = 'npc', x: number, y: number, detectionRadius: number = 64) {
		super(id, type, x, y, 75, null);

		this.detectionRadius = detectionRadius;
	}

	get canAttack(): boolean {
		return this.attackTimer <= 0;
	}
}
