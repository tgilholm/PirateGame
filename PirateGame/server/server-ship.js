import Matter from "matter-js";
const { Bodies, World, Body } = Matter;

// Static ship variables


const friction = 0.05;
const mass = 150;
const turnSpeed = 0.0003;
const thrust = 0.15;


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


        // Generate a Matter body from the vector of vertices
        const vertices = this.generateHullVertices();
        this.body = Bodies.fromVertices(x, y, [vertices], {
            frictionAir: 0.05,
            mass: mass
        });

        if (!this.body) {
            console.error("Failed to generate ship body from vertices!");
        }
        this.inputs = { up: false, down: false, left: false, right: false };

    }

    generateHullVertices() {
        // Ship parameters

        const points = [];
        const segments = 8; // How often to subdivide the curves
        const halfMidWidth = this.middleWidth / 2;
        const halfHeight = this.height / 2;

        // Generate the vertices for the "stern" hemicircle
        for (let i = 0; i <= segments; i++) {
            const theta = Math.PI / 2 + (i / segments) * Math.PI;
            points.push({
                x: -halfMidWidth + Math.cos(theta) * this.sternRadius,
                y: Math.sin(theta) * this.sternRadius,
            })
        }

        // Generate the vertices for the "bow" quadratic curve
        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const px = halfMidWidth + (t * this.bowLength);
            const py = -halfHeight + (1 - (t ** 2));
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
}