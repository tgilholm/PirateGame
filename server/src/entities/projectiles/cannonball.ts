import Projectile from "./projectile";

export default class Cannonball extends Projectile {
    constructor(id: string, x: number, y: number, r: number)
    {
        super(id, 'cannonball', x, y, r, 400);
        this.ttl = 3000; // long range
        this.damage = 80; // high damage
        this.radius = 8; // larger
    }
}