
/**
 * Base class for all entity objects in the game. Defines variables common to all entities.
 */
export default abstract class Entity {

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
    public parent: Entity | null;   // all entities can "technically" have parents

    /**
     * Builds an entity with the provided data
     * @param id the (must be unique) id of this entity
     * @param type the type (e.g. "interactable") of this entity- this allows getByType to work properly
     * @param x the x coordinate (relative/absolute)
     * @param y the y coordinate (relative/absolute)
     * @param maxHealth the starting/max health of this entity
     * @param parent the physics parent of this entity (e.g. a Ship)
     */
    constructor(id: string, type: string, x: number, y: number, maxHealth: number, parent: Entity | null) {
        this.id = id;
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