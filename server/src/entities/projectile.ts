import Entity from "./entity";

/**
 * Base class for all projectiles
 */
export default class Projectile extends Entity {
    public ttl: number = 2000;  // ms until expiry
    constructor(id: string, x: number, y: number, r: number, speed: number) {
        super(id, "projectile", x, y, 1, null); // no parent, 1 health for insta-destroy

        this.r = r;
        this.vx = Math.cos(r) * speed;
        this.vy = Math.sin(r) * speed;    // calculate velocity from speed scalar
    }
}