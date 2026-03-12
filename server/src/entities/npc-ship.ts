import { ShipConfig } from "../types";
import NPC from "./npc";

export default class NPCShip extends NPC
{

    
    constructor(id: string, x: number, y: number, config: ShipConfig)
    {
        super(id, 'npc-ship', x, y, 1000);  // larger detection radius
    }
}