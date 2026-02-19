/**
 * Base class from which all server-side entities inherit (ships, npcs etc).
 */
export default class Entity {
    /**
     * Creates a new entity with the specified id, type and coordinates
     * @param {String} id the unique id of this entity
     * @param {String} type the type of this entity, e.g. "ship"
     * @param {Number} x the x coordinate of this entity
     * @param {Number} y the y coordinate of this entity
     */
    constructor(id, type, x, y) {
        this.id = id;
        this.type = type;

        // Position is abstracted to a single object "position"
        this.position = { x, y };
        this.rotation = 0;
        this.velocity = { x: 0, y: 0 };
        this.angularVelocity = 0;

        this.parentId = null;
        this.inputs = {};
    }

    /**
     * Recalculates the location, velocity etc for this entity. Note that
     * this base class provides no implementation- subclasses must provide
     * their own implementation
     * @param {Number} deltaTime a time value for client-side extrapolation 
     */
    updatePhysics(deltaTime) {
        //updatePhysics method must be overriden by subclass
    }

    /**
     * Converts the relative (to a parent) coordinates of this object to
     * absolute coordinates (relative to the world) using the rotation.
     * @param {Number} localX the x coordinate relative to the parent's origin
     * @param {Number} localY the y coordinate relative to the parent's origin
     * @returns the absolute (world) coordinates of this entity
     */
    localToWorld(localX, localY) {
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        const rotatedX = localX * cos - localY * sin;
        const rotatedY = localX * sin + localY * cos;
        return {
            x: this.position.x + rotatedX,
            y: this.position.y + rotatedY
        };
    }

    /**
     * Converts the absolute coordinates (relative to the world) of this object to
     * relative (to a parent) coordinates using the rotation.
     * @param {Number} worldX the absolute x coordinate of this entity
     * @param {Number} worldY the absolute y coordinate of this entity
     * @returns the coordinates of this entity relative to the parent's origin
     */
    worldToLocal(worldX, worldY) {
        const angle = -this.rotation;
        const dx = worldX - this.position.x;
        const dy = worldY - this.position.y;
        return {
            x: dx * Math.cos(angle) - dy * Math.sin(angle),
            y: dx * Math.sin(angle) + dy * Math.cos(angle)
        };
    }

    /**
     * Calculates the distance between this entity and another- note that this
     * does not take into account absolute/relative coordinates; these must
     * be converted beforehand to achieve an accurate measure.
     * @param {Entity} otherEntity the other entity from which to measure the distance 
     * @returns {Number} the distance between this entity and the other
     */
    distanceTo(otherEntity) {
        const dx = otherEntity.position.x - this.position.x;
        const dy = otherEntity.position.y - this.position.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Checks if this entity has the provided type
     * @param {String} type the type of the entity 
     * @returns true if the entity matches, false otherwise
     */
    isType(type) {
        return this.type === type;
    }

    /**
     * Converts this entity to a serialized object
     * @returns {Object} the entity data in serialized form.
     */
    toData() {
        return {
            id: this.id,
            type: this.type,
            x: this.position.x,
            y: this.position.y,
            r: this.rotation,
            vx: this.velocity.x,
            vy: this.velocity.y,
            av: this.angularVelocity,
            parentId: this.parentId
        };
    }
}