import Matter from "matter-js";
const { Bodies, World, Body } = Matter;


/**
 * The server-side Ship class contains the static variables for the ships' bounding boxes,
 * width and height, etc, meaning that clients need only draw the ships from the provided
 * dimensions without being concerned with collision physics
 */
export default class ServerShip {
    /**
     * Creates a new ServerShip at the specified coordinates
     * @param {String} id the unique ID of the ship
     * @param {Number} x  the global X coordinate
     * @param {Number} y  the global Y coordinate
     */
    constructor(id, x, y) {
        this.id = id;
        this.height = 160; // height of the entire ship
        this.middleWidth = 200; // width of rectangle
        this.bowLength = 100; // width of frontal curve
        this.sternRadius = 80; // radius of rear hemisphere

        this.turnSpeed = 0.0003;
        this.thrust = 0.15;


        // Generate a Matter body from the vector of vertices
        const vertices = this.generateHullVertices();
        this.body = Bodies.fromVertices(x, y, [vertices], {
            frictionAir: 0.05,
            mass: 150
        });

        if (!this.body) {
            console.error("Failed to generate ship body from vertices!");
        }
        this.inputs = { up: false, down: false, left: false, right: false };

    }

    /**
     * Generates a vector containing the vertices of the "hull" shape- a hemispherical
     * "stern", rectangular hull and a curved "bow" generated with a quadratic curve
     * @returns {Matter.Vector[]}
     */
    generateHullVertices() {
        const points = [];
        const segments = 12;
        const halfMidWidth = this.middleWidth / 2;
        const halfHeight = this.height / 2;

        // "Stern" hemisphere
        for (let i = 0; i <= segments; i++) {
            const theta = (Math.PI / 2) + (i / segments) * Math.PI;
            points.push({
                x: -halfMidWidth + (Math.cos(theta) * this.sternRadius),
                y: Math.sin(theta) * this.sternRadius,
            });
        }

        // Bow curve
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const px = halfMidWidth + (t * this.bowLength);
            const py = -halfHeight * (1 - (t ** 2));
            points.push({ x: px, y: py });
        }

        // Close the bow curve- exact mirror of the above
        for (let i = segments; i >= 0; i--) {
            const t = i / segments;
            const px = halfMidWidth + (t * this.bowLength);
            const py = halfHeight * (1 - (t ** 2));
            points.push({ x: px, y: py });
        }

        return points;
    }

    getParams() {
        return {
            id: this.id,
            height: this.height,
            middleWidth: this.middleWidth,
            bowLength: this.bowLength,
            sternRadius: this.sternRadius
        }
    }


    isInside(localX, localY, padding = 15) {
        // pad the hitbox by 15 to stop the player getting stuck
        const halfMidWidth = (this.middleWidth / 2) - padding;
        const halfHeight = (this.height / 2) - padding;
        const paddedSternRadius = this.sternRadius - padding;
        const paddedBowLength = this.bowLength - padding;

        // Check if inside hemisphere
        if (localX < -halfMidWidth) {
            const dx = localX + halfMidWidth;
            return (dx ** 2 + localY ** 2) <= (paddedSternRadius ** 2);
        }

        // Check if inside quadratic curve
        else if (localX > halfMidWidth) {
            const t = (localX - halfMidWidth) / paddedBowLength;
            if (t > 1) return false; // object is completely outside the bow

            const hullLimitY = halfHeight * (1 - (t ** 2));
            return Math.abs(localY) <= hullLimitY;
        }

        // Inside the rectangle
        else {
            return Math.abs(localY) <= halfHeight;
        }
    }
}