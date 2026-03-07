
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

    // "Dirty"- meaning this entity has changed recently
    public dirty: boolean = true;  // starts dirty so first broadcast always sends
    private lastSent: Record<string, any> = {}; // keep track per-entity

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
     * Set this entity as "dirty" if the properties within it have changed
     * recently- this will force the entity's data to be sent on the next packet
     */
    public markDirty(): void {
        this.dirty = true;
    }

    /**
     * Clear this entity's "dirty" state if it has not changed in a while.
     */
    public clearDirty(): void {
        this.dirty = false;
    }

    /**
     * Full serialisation- used when entities first enter the view range of a client
     */
    serialise(): any {
        const state = {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            av: this.av,
            r: this.r,
            parentId: this.parent?.id,
            health: this.health,
            maxHealth: this.maxHealth // Transmit both maximum and current health for health bars
        }

        this.lastSent = { ...state };    // for computing the next delta
        this.clearDirty();  // client has latest data- don't send again
        return state;
    }

    /**
    * Delta serialisation- only includes fields that have meaningfully changed
    * since the last full serialise() or serialiseDelta() call. The id of this
    * entity is always sent, so the client knows what to update.
    * @returns a record of the changes, or null if nothing has changed.
    */
    serialiseDelta(): Record<string, any> | null {
        const current = this.serialise(); // gets current values, updates lastSent
        const delta: Record<string, any> = { id: this.id }; // always prepend the id
        let hasChanges = false;

        // For each of the parameters sent on the serialise packet, check if they have changed
        for (const key of Object.keys(current)) {
            if (key === 'id') continue; // ignore id

            // Compare the last update to the current one
            const curr = current[key];
            const prev = this.lastSent[key];

            let changed: boolean;
            if (typeof curr === 'number' && typeof prev === 'number') { 
                const threshold = (key === 'r' || key === 'av') ? 0.001 
                    : (key === 'x' || key === 'y') ? 0.5    // Only send if the difference is "enough"
                        : (key === 'vx' || key === 'vy') ? 0.05
                            : 0.001;    // May need to be fine-tuned
                changed = Math.abs(curr - prev) > threshold;
            } else {
                changed = curr !== prev;
            }

            // If something changed "enough", send it
            if (changed) {
                delta[key] = curr;
                this.lastSent[key] = curr;
                hasChanges = true;
            }
        }

        return hasChanges ? delta : null;
    }
}