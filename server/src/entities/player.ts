import { PlayerConfig } from "src/types";
import Entity from "./entity";

/**
 * The server-side representation of an individual player's state, acting as the "source of truth"
 * for each player in the game. 
 */
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
    };
    aimAngle: number;

    private prevX: number = 0;
    private prevY: number = 0;

    /**
     * Builds a player with the specified data
     * @param id the id of the player
     * @param x the (relative/absolute) x coordinate
     * @param y the (relative/absolute) y coordinate
     * @param parent the optional physics parent of this player
     * @param username chosen by the player
     * @param config config data read from entityConfig
     */
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
            right: false

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
            aimAngle: this.aimAngle,
            isUsingCannon: this.isUsingCannon
        }

    }
}