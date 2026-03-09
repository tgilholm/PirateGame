import Entity from "./entity";

export type TreasureState = "buried" | "dugup" | "carried";

export default class Treasure extends Entity {
    public goldValue: number;
    public spawnedAt: number;
    public state: TreasureState;
    public digProgress: number;
    public carrierId: string | null;
    public digSpeed: number;
    public successZoneStart: number;
    public successZoneSize: number;

    constructor(
        id: string,
        x: number,
        y: number,
        goldValue: number,
        state: TreasureState = "buried",
        digProgress: number = 0,
        carrierId: string | null = null,
        digSpeed: number = 1,
        successZoneStart: number = 0.4,
        successZoneSize: number = 0.18

    ) {
        super(id, "treasure", x, y, 1, null);
        this.goldValue = goldValue;
        this.spawnedAt = Date.now();
        this.state = state;
        this.digProgress = digProgress;
        this.carrierId = carrierId;
        this.digSpeed = digSpeed;
        this.successZoneStart = successZoneStart;
        this.successZoneSize = successZoneSize;
    }

    override serialise() {
        return {
            ...super.serialise(),
            goldValue: this.goldValue,
            state: this.state,
            digProgress: this.digProgress,
            carrierId: this.carrierId,
            digSpeed: this.digSpeed,
            successZoneStart: this.successZoneStart,
            successZoneSize: this.successZoneSize,
        };
    }
}