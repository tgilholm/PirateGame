import Entity from "../entity";
import InteractableEntity from "./interactable-entity";
import entityConfig from '../../../../shared/entity-config.json';

export default class Cannon extends InteractableEntity {
    targetAngle: number;    // where the cannon is moving to
    reloadTime: number = entityConfig.ship.defaultStats.reloadTime;
    reloadTimer: number = 0;

    constructor(id: string, x: number, y: number, parent: Entity | null) {
        super(id, x, y, parent, 'cannon');

        this.targetAngle = 0;


        if (parent) {
            this.r = (y < 0) ? -Math.PI / 2 : Math.PI / 2;  // always face outward to start
        }
    }

    get isReloaded(): boolean {return this.reloadTimer <= 0;}

    toState() {
        return {
            ...super.toState(),
            reloadTimer: this.reloadTimer,
            reloadTime: this.reloadTime,
            userId: this.user?.id ?? null   // send null if no user - json drops undefined
        }
    }
}