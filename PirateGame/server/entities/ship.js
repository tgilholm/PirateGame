import { CONFIG } from "../server/src/config.js"
import Entity from "./entity.js";
import Matter from "matter-js";
const { Bodies, Body } = Matter; // destructure

/**
 * Server side ship implementation
 */
export default class Ship extends Entity {
    /**
     * 
     * @param {String} id 
     * @param {Number} x 
     * @param {Number} y 
     */
    constructor(id, x, y) {
        super(id, "ship", x, y);

        this.pilotId = null;
        this.maxHealth = CONFIG.SHIP.MAX_HEALTH;
        this.health = this.maxHealth;

        this.height = CONFIG.SHIP.DIMENSIONS.HEIGHT;
        this.middleWidth = CONFIG.SHIP.DIMENSIONS.MIDDLEWIDTH;
        this.bowLength = CONFIG.SHIP.DIMENSIONS.BOWLENGTH;
        this.sternRadius = CONFIG.SHIP.DIMENSIONS.STERNRADIUS;

        // Input from pilot
        this.inputs = {
            up: false,
            down: false,
            left: false,
            right: false
        };

        // Internal physics body
        this.body = this.createPhysicsBody(x, y);
        this.params = this.generateParams(); // for clients to draw
        this.turnSpeed = CONFIG.SHIP.TURN_SPEED;
        this.thrust = CONFIG.SHIP.THRUST;
    }

    /**
     * 
     * @param {Number} x 
     * @param {Number} y 
     * @returns {Matter.Body}
     */
    createPhysicsBody(x, y) {
        const sternRadius = this.sternRadius;
        const middleWidth = this.middleWidth;
        const middleHeight = this.height;
        const bowLength = this.bowLength;

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

        const body = Body.create({
            parts: [sternBody, middleBody, bowBody],
            frictionAir: 0.05,
            mass: 200,
            label: 'ship',
            restitution: 0.2
        });

        Body.setPosition(body, { x, y });
        return body;
    }

    generateParams() {
        return {
            id: this.id,
            height: this.height,
            middleWidth: this.middleWidth,
            bowLength: this.bowLength,
            sternRadius: this.sternRadius,
            interactables: {
                helm: {
                    x: -this.middleWidth / 2,
                    y: 0
                },
                cannons: [
                    { x: 0, y: -this.height / 4 - 15 },
                    { x: 0, y: this.height / 4 + 15 }
                ],
                ladders: [
                    { x: -this.middleWidth / 2 + 20, y: -this.height / 4 - 35 },
                    { x: -this.middleWidth / 2 + 20, y: this.height / 4 + 35 }
                ]
            }
        };
    }

    syncFromPhysicsBody() {
        if (this.body) {
            this.position = { x: this.body.position.x, y: this.body.position.y };
            this.rotation = this.body.angle;
            this.velocity = { x: this.body.velocity.x, y: this.body.velocity.y };
            this.angularVelocity = this.body.angularVelocity;
        }
    }

    getParams() {
        return this.params;
    }




}