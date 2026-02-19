import { CONFIG } from "../config.js";
import Entity from "./entity.js";

export default class Player extends Entity {
    /**
     * 
     * @param {String} id 
     * @param {Number} x 
     * @param {Number} y 
     * @param {String} parentId 
     * @param {String} username 
     */
    constructor(id, x, y, parentId = null, username = "") {
        super(id, "player", x, y);  // All players have type "player"

        this.username = username;
        this.maxHealth = CONFIG.PLAYER.MAX_HEALTH
        this.health = CONFIG.PLAYER.MAX_HEALTH; // max health for new players
        this.inventory = [];    // empty inventory to start
        this.parentId = parentId;

        this.isSteering = false;    // is the player steering a ship
        this.inputs = {
            up: false,
            down: false,
            left: false,
            right: false,
            e: false,
            q: false,
            space: false
        };
    }

    updatePhysics(deltaTime) {
        const {up, down, left, right} = this.inputs;
    }
}