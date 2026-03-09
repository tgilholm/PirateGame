import Entity from "../entity";

/**
 * Base class for all projectiles
 */
export default class Projectile extends Entity {
    public ttl: number;
    public damage: number = 0;
    public radius: number = 4;  // small by default
    public firedBy: string | null = null; // entity id, to avoid self-hits

    constructor(id: string, type: string, x: number, y: number, r: number, speed: number) {
        super(id, type, x, y, 1, null); // no parent, 1 health for insta-destroy
        this.supertypes = ['projectile'];   // easy to get by type

        this.ttl = 2000;    // default
        this.r = r;
        this.vx = Math.cos(r) * speed;
        this.vy = Math.sin(r) * speed;    // calculate velocity from speed scalar
    }
}