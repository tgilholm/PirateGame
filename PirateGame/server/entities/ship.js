import Entity from "./entity";

export default class Ship extends Entity {
    constructor(id, x, y) {
        super(id, "ship", x, y);
    }
}