import Entity from "./entity.js";

// stub
export default class NPC extends Entity {
    constructor(id, name, x, y) {
        super(id, "npc", x, y);

        this.name = name;
    }
}