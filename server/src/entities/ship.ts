import { Bodies, Body } from "matter-js";
import { ShipConfig } from "../types";
import Entity from "./entity";
import InteractableEntity from "./interactable-entity";
import Player from "./player";


/**
 * The server-side representation of an individual ship's state, acting as the "source of truth"
 * for each ship in the game. Ships are "physics parents", meaning that other entities (players,
 * cannons, etc) can be "parented" to a ship and move with it. They are also designed to operate
 * in matter-js physics- this class provides the hitbox roughly matching the outline of each ship.
 */
export default class Ship extends Entity {
    pilot: Player | null;
    dimensions: ShipConfig["dimensions"];
    physics: ShipConfig["physics"];
    interactables: InteractableEntity[]
    body: Matter.Body
    inputs: any;

    /**
     * Creates a ship with the provided data
     * @param id the id of the ship
     * @param x the (always absolute) x coordinate
     * @param y the (always absolute) y coordinate
     * @param config the ship's dimensions/physics/interactables from entityConfig
     */
    constructor(
        id: string,
        x: number,
        y: number,
        config: ShipConfig
    ) {
        super(id, "ship", x, y, config.maxHealth, null);    // ships have no parents

        this.pilot = null;    // Nobody piloting at startup
        this.dimensions = config.dimensions;
        this.physics = config.physics;
        this.interactables = [];
        this.inputs = {
            up: false,
            down: false,
            left: false,
            right: false
        }

        // Allow for ships with no interactables 
        let result = this.createInteractables(config.interactables);
        if (result) {
            this.interactables = result;
        }

        // For adding to the matter-js world
        this.body = this.createPhysicsBody(x, y);
    }

    /**
     * Creates the interactable objects specified by the entityConfig injected into this file.
     * Each interactable is given an id based on the ship's id- i.e. "ship_1:ladder_1"
     * @param interactables the object containing the ship's interactables
     * @returns a list of interactable entities
     */
    createInteractables(interactables: ShipConfig['interactables']): InteractableEntity[] {
        if (!interactables) return [];

        let result: InteractableEntity[] = [];

        for (let i = 0; i < interactables.length; i++) {
            const uniqueId = `${this.id}_${interactables[i].id}`;

            const configWithUniqueId = { ...interactables[i], id: uniqueId };

            const interactable = new InteractableEntity(
                configWithUniqueId,
                this
            );

            result.push(interactable);
        }

        return result;
    }

    /**
     * Overrides base method appending ship-specific data for network transmission
     */
    serialise(): any {
        /*
            ... - spread operator. Prepends all base entity data:
            id: this.id
            type: this.type,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            av: this.av,
            r: this.r,
            health: this.health,
            maxHealth: this.maxHealth
        */

        // Send everything the client needs to display the player
        return {
            ...super.serialise(),
            pilotId: this.pilot?.id,  // For client side messages
        }
    }


    /**
     * Helper method to convert the position of this object from local scope (on this ship) 
     * to world scope (absolute coordinates)
     * @param localX the local x coordinate of the object to convert
     * @param localY the local y coordinate of the object to convert
     * @returns the global x and y coordinates of the provided object
     */
    localToWorld(localX: number, localY: number) {
        const cos = Math.cos(this.r);
        const sin = Math.sin(this.r);

        const rotatedX = localX * cos - localY * sin;
        const rotatedY = localX * sin + localY * cos;

        return {
            x: this.x + rotatedX,
            y: this.y + rotatedY
        };
    }

    /**
    * Helper method to convert the position of this object from global scope (absolute coordinates) 
    * to local scope (on this ship)
    * @param worldX the global x coordinate of the object to convert
    * @param worldY the global y coordinate of the object to convert
    * @returns the local x and y coordinates of the provided object
    */
    worldToLocal(worldX: number, worldY: number) {
        const dx = worldX - this.x;
        const dy = worldY - this.y;
        const cos = Math.cos(-this.r);
        const sin = Math.sin(-this.r);

        return {
            x: dx * cos - dy * sin,
            y: dx * sin + dy * cos
        };
    }

    /**
     * Determines whether a given set of coordinates, padded by a certain amount,
     * fits within the bounds of this ship's hull.
     * @param localX the x coordinate of the object to compare
     * @param localY the y coordinate of the object to compare
     * @param padding a padding (e.g. a player's radius)
     * @returns true if inside, false otherwise
     */
    isInside(localX: number, localY: number, padding = 0) {
        const { middleWidth, height, sternRadius, bowLength } = this.dimensions;
        const halfMidWidth = middleWidth / 2;
        const halfHeight = height / 2;

        if (localX < -halfMidWidth) {
            const dx = localX + halfMidWidth;
            const currentSternRadius = sternRadius - padding;
            return (dx ** 2 + localY ** 2) <= (currentSternRadius ** 2);
        }

        else if (localX > halfMidWidth) {
            const t = (localX - halfMidWidth) / bowLength;

            if (localX > halfMidWidth + bowLength - padding) return false;
            const hullLimitY = halfHeight * (1 - (t * t));
            return Math.abs(localY) <= (hullLimitY - padding);
        }
        else {
            return Math.abs(localY) <= (halfHeight - padding);
        }
    }

    /**
     * Creates a Matter-JS physics body for this ship based on the dimensions provided
     * in the entity config
     * @param x the absolute x coordinate at which to create this ship 
     * @param y the absolute y coordinate at which to create this ship 
     * @returns a Matter-JS physics body
     */
    createPhysicsBody(x: number, y: number) {
        const sternRadius = this.dimensions.sternRadius;
        const middleWidth = this.dimensions.middleWidth;
        const middleHeight = this.dimensions.height;
        const bowLength = this.dimensions.bowLength;

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
        Body.setAngle(body, 0);
        return body;
    }
}