import Entity from "./entity";


export default class NPC extends Entity {
    constructor(id: string, x: number, y: number) {
        super(id, 'npc', x , y , 75, null);
    }
}