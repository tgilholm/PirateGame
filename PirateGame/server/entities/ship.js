import { INIT_CONFIG } from "../config.js";
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
        this.maxHealth = INIT_CONFIG.SHIP.MAX_HEALTH;
        this.health = this.maxHealth;

        this.height = INIT_CONFIG.SHIP.DIMENSIONS.HEIGHT;
        this.middleWidth = INIT_CONFIG.SHIP.DIMENSIONS.MIDDLEWIDTH;
        this.bowLength = INIT_CONFIG.SHIP.DIMENSIONS.BOWLENGTH;
        this.sternRadius = INIT_CONFIG.SHIP.DIMENSIONS.STERNRADIUS;

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
        this.turnSpeed = INIT_CONFIG.SHIP.TURN_SPEED;
        this.thrust = INIT_CONFIG.SHIP.THRUST;
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

    isInside(localX, localY, padding = 15) {
        const halfMidWidth = (this.middleWidth / 2) - padding;
        const halfHeight = (this.height / 2) - padding;
        const paddedSternRadius = this.sternRadius - padding;
        const paddedBowLength = this.bowLength - padding;

        if (localX < -halfMidWidth) {
            const dx = localX + halfMidWidth;
            return (dx ** 2 + localY ** 2) <= (paddedSternRadius ** 2);
        } else if (localX > halfMidWidth) {
            const t = (localX - halfMidWidth) / paddedBowLength;
            if (t > 1) return false;
            const hullLimitY = halfHeight * (1 - (t ** 2));
            return Math.abs(localY) <= hullLimitY;
        } else {
            return Math.abs(localY) <= halfHeight;
        }
    }

    toData() {
        return {
            ...super.toData(),  // "spread" the underlying entity data, append ship stuff
            pilotId: this.pilotId,
            health: this.health,
            params: this.params
        };
    }

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

    worldToLocal(worldX, worldY) {
        const dx = worldX - this.position.x;
        const dy = worldY - this.position.y;
        const cos = Math.cos(-this.rotation);
        const sin = Math.sin(-this.rotation);

        return {
            x: dx * cos - dy * sin,
            y: dx * sin + dy * cos
        };
    }
}