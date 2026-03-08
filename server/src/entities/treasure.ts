import Entity from "./entity";

export default class Treasure extends Entity {
    public goldValue: number;
    public spawnedAt: number;

    constructor(id: string, x: number, y: number, goldValue: number) {
        super(id, "treasure", x, y, 1, null);
        this.goldValue = goldValue;
        this.spawnedAt = Date.now();
    }

    serialise() {
        return {
            ...super.serialise(),
            goldValue: this.goldValue,
        };
    }
}