/**
 * 
 */
export default class Entity {
    /**
     * 
     * @param {String} id 
     * @param {String} type 
     * @param {Number} x 
     * @param {Number} y 
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
     * 
     * @param {Number} deltaTime a time value for client-side extrapolation 
     */
    updatePhysics(deltaTime)
    {
        throw new Error("updatePhysics method must be overriden by subclass");
    }
}