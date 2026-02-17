import Parent from "./parent.js";


/**
 * The base class for all interactable objects within the game- such as ship
 * helms, cannons, crates etc. Can be connected to a parent in order to move
 * along with it. Each interactable object has a sprite, an "interact" message
 * and related onInteract method to be overriden by subclasses, and an update method
 * to recalculate the world coordinates and show the prompt
 */
export default class Interactable {

    /**
     * Creates a new Interactable object with the specified parent, coordinates and prompt text.
     * As the "parent" parameter is optional, this means that x, y have different values depending on
     * whether it is present or not. If a parent is specified, these are relative coordinates. If not, they
     * are absolute coordinates.
     * @param {Parent} parent The parent object for this interactable. Null by default
     * @param {Number} x The absolute/relative (depending on parent) x coordinate of this Interactable
     * @param {Number} y The absolute/relative (depending on parent) y coordinate of this Interactable
     * @param {String} label The "interact" text to display above this object
     * @param {Phaser.Scene} scene The scene this interactable is a part of 
     */
    constructor(scene, parent = null, x, y, label) {
        this.scene = scene
        this.parent = parent;
        this.x = x;
        this.y = y;
        this.scene = scene

        // Create text prompt for interactable object
        this.prompt = this.scene.add.text(0, 0, `[E] ${label}`, {
            fontSize: '14px',
            backgroundColor: '#000000cc',
            padding: { x: 8, y: 4 },
            fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(1000).setVisible(false); // Initially invisible
    }

    /**
     * Calculates "world" (absolute) coordinates for this object depending on
     * whether this object has a parent. If so, the provided coordinates were already
     * absolute and they are returned. Otherwise, delegates to the parent class
     * to calculate the absolute coordinates
     * @returns a Vector2 object with absolute x and y coordinates
     */
    getWorldPos() {
        // If a parent was specified
        if (this.parent) {
            const pos = this.parent.toWorld(this.x, this.y);
            return new Phaser.Math.Vector2(pos.x, pos.y);
        }

        // If not, world coords were already given
        return new Phaser.Math.Vector2(this.x, this. y);
    }


    /**
     * Updates this interactable object. If the player is close enough to the object,
     * the prompt text is displayed. This is done client-side to prevent latency issues
     */
    update() {
        const worldPos = this.getWorldPos();

        // Set the prompt text above the absolute position of this object
        // Only shown if visible
        this.prompt.setPosition(worldPos.x, worldPos.y - 50); // 50px above
    }

    /**
     * Compares the absolute coordinates of this Interactable to the absolute coordinates
     * of the player object. If close enough, displays the prompt text.
     * @param {Phaser.Math.Vector2} playerWorldPos The vector containing the absolute x and y coordinates of the player
     * @returns True if the player is within 60px, false otherwise
     */
    checkProximity(playerWorldPos) {
        const worldPos = this.getWorldPos();

        // Both sets of coords are vectors- get distance between the two
        const dist = playerWorldPos.distance(worldPos);

        // If the player is close enough, show the prompt
        const isNear = dist < 60;
        this.prompt.setVisible(isNear);

        return isNear;
    }


    /**
     * The behaviour this Interactable will execute when interacted with
     * by a player. Overriden by subclasses.
     */
    onInteract() {
        console.warn("Base class: onInteract() not implemented");
    }

    /**
     * Assigns a new Parent to this interactable. Set null for no parent.
     * @param {Parent} newParent 
     */
    setParent(newParent) {
        this.parent = newParent;
    }
}