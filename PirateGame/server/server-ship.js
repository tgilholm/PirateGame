import Matter from "matter-js";
const { Bodies, World, Body } = Matter;
import decomp from 'poly-decomp-es';
global.decomp = decomp;

Matter.Common.setDecomp(decomp);


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
        this.body = this.createComplexBody(x, y);
        // Generate a Matter body from the vector of vertices
        //this.body = this.createComplexBody(x, y, this.generateHullVertices().reverse());
        this.inputs = { up: false, down: false, left: false, right: false };

    }

    createComplexBody(x, y, vertices) {
        const Body = Matter.Body;
        const Bodies = Matter.Bodies;

        // Dimensions from your ship
        const sternRadius = this.sternRadius;      // 80
        const middleWidth = this.middleWidth;      // 180
        const middleHeight = this.height;          // 160
        const bowLength = this.bowLength;          // 80

        // create stern as a circle
        const sternBody = Bodies.circle(
            x - (middleWidth / 2), 
            y,
            sternRadius * 0.9,
            {
                label: 'ship-stern',
                friction: 0.5,
                restitution: 0.2,
                mass: 50
            }
        );

        // create the middle as a rectangle
        const middleBody = Bodies.rectangle(
            x,
            y,
            middleWidth,
            middleHeight,
            {
                label: 'ship-middle',
                friction: 0.5,
                restitution: 0.2,
                mass: 100
            }
        );

        // create the bow as a trapezoid
        const bowBody = Bodies.trapezoid(
            x + (middleWidth / 2),
            y,
            bowLength,
            middleHeight,
            0.65,
            {
                label: 'ship-bow',
                friction: 0.5,
                restitution: 0.2,
                mass: 50
            }
        );
        Body.rotate(bowBody, Math.PI / 2);  


        // Create compound body from the three parts
        const body = Body.create({
            parts: [sternBody, middleBody, bowBody],
            frictionAir: 0.05,
            mass: 200,
            label: 'ship',
            restitution: 0.2
        });

        Body.setPosition(body, { x, y });
        console.log('Created compound body with', body.parts.length, 'parts');
        console.log('Bounds:', JSON.stringify(body.bounds));

        return body;
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