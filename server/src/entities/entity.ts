export default abstract class Entity {
    private static idCounter = 0;   // for unique ids

    public id: string;
    public type: string;
    public x: number;   // x coord
    public y: number;   // y coord
    public vx: number;  // velocity in x axis
    public vy: number;  // velocity in y axis
    public r: number;   // rotation
    public av: number;  // angular velocity
    public health: number;
    public maxHealth: number;
    public parent: Entity | null;

    constructor(type: string, x: number, y: number, maxHealth: number, parent: Entity | null) {
        this.id = `${this.constructor.name}:${++Entity.idCounter}`;  // increment before return
        this.type = type;
        this.x = x;
        this.y = y;

        // Entity starts off not moving
        this.vx = 0;
        this.vy = 0;
        this.r = 0;
        this.av = 0;

        // All entities have health and can be destroyed
        this.parent = parent;
        this.maxHealth = maxHealth;
        this.health = maxHealth;    // Start at maximum
    }

    /**
     * Converts to a serialized object for network transmission
     */
    serialise(): any {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            av: this.av,
            r: this.r,
            parentId: this.parent?.id,

            // Transmit both maximum and current health for health bars
            health: this.health,
            maxHealth: this.maxHealth
        }
    }

}