import Entity from "./entity";


export default class NPC extends Entity {

    target: Entity | null = null;   // who this npc is currently chasing
    speed: number = 4;
    detectionRadius: number;

    constructor(id: string, x: number, y: number, detectionRadius: number = 250) {
        super(id, 'npc', x , y , 75, null);

        this.detectionRadius = detectionRadius;
    }
}