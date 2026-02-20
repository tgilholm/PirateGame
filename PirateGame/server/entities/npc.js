import Entity from "./entity";

// stub
export default class NPC extends Entity {
    constructor(id, name, x, y) {
        super(id, "npc", x, y);

        this.name = name;
    }
}