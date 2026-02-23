import Entity from "./entity";

/**
 * Defines the contract by which ship physics body parameters
 * are provided to this ship object
 */
export interface IShipBodyParameters {
    height: number;
    middleWidth: number;
    bowLength: number;
    sternRadius: number;
}


/**
 * Defines the contract by which physics parameters, such as turn speed,
 * thrust, mass, friction and restitution factor are provided to this ship
 */
export interface IShipPhysicsParameters
{
    turnSpeed: number,
    thrust: number,
    frictionAir: number,
    mass: number,
    label: number,
    restitution: number
}

export default class Ship extends Entity {

    pilotId: string | null;
    bodyParameters: IShipBodyParameters;
    physicsParameters: IShipPhysicsParameters;
    inputs: any;

    constructor(
        id: string,
        x: number,
        y: number,
        maxHealth: number,
        bodyParameters: IShipBodyParameters,
        physicsParameters: IShipPhysicsParameters
    ) {
        super(id, "ship", x, y, maxHealth);

        this.pilotId = null;    // Nobody piloting at startup
        this.bodyParameters = bodyParameters;
        this.physicsParameters = physicsParameters;
        this.inputs = {
            up: false,
            down: false,
            left: false,
            right: false
        }
    }

    /**
     * Overrides base method appending ship-specific data for network transmission
     */
    serialise(): any {
        /*
            ... - spread operator. Prepends all base entity data:
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            r: this.r,
            health: this.health,
            maxHealth: this.maxHealth
        */

        // Send everything the client needs to display the player
        return {
            ...super.serialise(),
            pilotId: this.pilotId,  // For client side messages
            bodyParameters: this.bodyParameters // For client side drawing
        }
    }
}