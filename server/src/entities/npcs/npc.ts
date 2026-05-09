import Entity from '../entity';

export default class NPC extends Entity {
	target: Entity | null = null; // who this npc is currently chasing
	speed: number = 16;
	detectionRadius: number;
	attackTimer: number = 0;
	attackTime: number = 500; // ms
	attackDamage: number = 10; // roughly 10-hit a player
	attackRange: number = 8;
	isAttacking: boolean = false;
	isDying: boolean = false;

	constructor(
		id: string,
		type: string = 'npc',
		x: number,
		y: number,
		parent: Entity | null,
		detectionRadius: number = 96
	) {
		super(id, type, x, y, 75, parent);

		this.detectionRadius = detectionRadius;
	}

	get canAttack(): boolean {
		return this.attackTimer <= 0;
	}

	toState() {
		return {
			...super.toState(),
			isAttacking: this.isAttacking,
			isDying: this.isDying,
		};
	}
}
