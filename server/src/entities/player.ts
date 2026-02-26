import Entity from "./entity";

type PlayerConfig = typeof import("../entity-config.json")["player"];

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
        e: boolean;
        q: boolean;
        space: boolean;
    };


    constructor(
        x: number,
        y: number,
        parent: Entity | null,
        username: string,
        config: PlayerConfig
    ) {
        super("player", x, y, config.maxHealth, parent);
        this.username = username || "";     // default to no uname

        // Player-specific detail
        this.isSteering = false;
        this.isUsingCannon = false;
        this.isCarrying = false;
        this.inputs = {
            up: false,
            down: false,
            left: false,
            right: false,
            e: false,
            q: false,
            space: false

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
            isSteering: this.isSteering,
            isUsingCannon: this.isUsingCannon
        }

    }
}