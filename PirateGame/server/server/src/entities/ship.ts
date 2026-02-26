import { ShipConfig } from "../types";
import Entity from "./entity";




export default class Ship extends Entity {
    pilotId: string | null;
    dimensions: ShipConfig["dimensions"];
    physics: ShipConfig["physics"];
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
            id: this.id
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


    isInside(localX: number, localY: number, padding = 15) {
        const halfMidWidth = (this.dimensions.middleWidth / 2) - padding;
        const halfHeight = (this.dimensions.height / 2) - padding;
        const paddedSternRadius = this.dimensions.sternRadius - padding;
        const paddedBowLength = this.dimensions.bowLength - padding;

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
}