import { PlayerConfig } from "src/types";
import Entity from "./entity";

export default class Player extends Entity {
    username: string;
    isSteering: boolean;
    isUsingCannon: boolean;
    isCarrying: boolean;
    inputs: {
        up: boolean;
        down: boolean;
        left: boolean;
        right: boolean;

        mouseX: number;
        mouseY: number;
    };
    aimAngle: number;


    constructor(
        id: string,
        x: number,
        y: number,
        parent: Entity | null,
        username: string,
        config: PlayerConfig,
    ) {
        super(id, "player", x, y, config.maxHealth, parent);
        this.username = username || "";     // default to no uname

        // Player-specific detail
        this.isSteering = false;
        this.isUsingCannon = false;
        this.isCarrying = false;

        // Where the player is aiming
        this.aimAngle = 0;

        // Input from the client
        this.inputs = {
            up: false,
            down: false,
            left: false,
            right: false,

            mouseX: 0,
            mouseY: 0

            // Specify any other player inputs here
        }
    }

    /**
     * Override base method appending player-specific data for network transmission
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
            username: this.username,
            aimAngle: this.aimAngle,
            isSteering: this.isSteering,
            isUsingCannon: this.isUsingCannon
        }

    }
}