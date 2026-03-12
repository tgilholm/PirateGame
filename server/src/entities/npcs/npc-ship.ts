import { NPCShipConfig } from "../../types";
import Entity from "../entity";
import Ship from "../ship";


export default class NPCShip extends Ship
{
    detectionRadius: number = 1000;
    target: Entity | null = null;

    constructor(id: string, x: number, y: number, config: NPCShipConfig)
    {
        super(id, 'npc-ship', x, y, config);  // larger detection radius
        this.supertypes = ['ship', 'npc'];  // fits into both
    }
}