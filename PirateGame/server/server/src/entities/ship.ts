import { ShipConfig } from "../types";
import Entity from "./entity";




export default class Ship extends Entity {
    pilotId: string | null;
    dimensions: any;
    physics: any;
    inputs: any;

    constructor(
        x: number,
        y: number,
        config: ShipConfig
    ) {
        super("ship", x, y, config.maxHealth, null);    // ships have no parents

        this.pilotId = null;    // Nobody piloting at startup
        this.parent = null;
        this.dimensions = config.dimensions;
        this.physics = config.physics;
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
            dimensions: this.dimensions // For client side drawing
        }
    }
}