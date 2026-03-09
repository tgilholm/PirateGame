import Projectile from "./projectile";

export default class Bullet extends Projectile
{
    constructor(id: string, x: number, y: number, r: number)
    {
        super(id, 'bullet', x, y, r, 800);
        this.ttl = 1500;    // short range
        this.damage = 10;
    }
}