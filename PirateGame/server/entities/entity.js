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