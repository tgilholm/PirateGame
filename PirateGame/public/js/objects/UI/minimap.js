import DomFactory from "./domFactory.js";
import UI_CONFIG from "./UIConfig.json" with { type: "json" };

/**
 * Minimap — owns all minimap DOM elements and marker-drawing logic.
 *
 * Uses DomFactory.createMinimapContent() to inject the <img> and <canvas>
 * into the #minimap-container placeholder, keeping index.html clean.
 */
export default class Minimap {

    /**
     * @param {HTMLElement} containerEl - The #minimap-container element to populate.
     * @param {string}      [imgSrc]    - URL of the map background image. Defaults to UIConfig value.
     * @param {number}      [size]      - Width and height of the minimap in pixels. Defaults to UIConfig value.
     */
    constructor(containerEl,
                imgSrc = UI_CONFIG.MINIMAP.IMG_SRC,
                size   = UI_CONFIG.MINIMAP.SIZE) {
        this.container = containerEl;

        // Apply dimensions — size is owned here, not in CSS
        containerEl.style.width  = `${size}px`;
        containerEl.style.height = `${size}px`;

        // Build inner elements via CreateUI
        const { img, canvas } = DomFactory.createMinimapContent(containerEl, imgSrc);
        this.img    = img;
        this.canvas = canvas;
        this.ctx    = canvas.getContext("2d");

        // Sync canvas resolution to container size
        this._syncSize();

        // Map world dimensions – set when initializeMarker() is first called
        this.mapWidth  = 0;
        this.mapHeight = 0;
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /**
     * Shows the minimap and draws the initial player marker.
     * Call once when the game world is ready (e.g. inside the initGame socket event).
     * @param {number} spawnX     - Initial world X position of the player.
     * @param {number} spawnY     - Initial world Y position of the player.
     * @param {number} mapWidth   - Full pixel width of the game world.
     * @param {number} mapHeight  - Full pixel height of the game world.
     */
    initializeMarker(spawnX, spawnY, mapWidth, mapHeight) {
        this.mapWidth  = mapWidth;
        this.mapHeight = mapHeight;
        this.container.style.display = "block";
        this.updatePlayerMarker(spawnX, spawnY, mapWidth, mapHeight);
    }

    /**
     * Redraws the player dot at the given world position.
     * Call every frame.
     * @param {number} playerX    - Current world X position of the player.
     * @param {number} playerY    - Current world Y position of the player.
     * @param {number} mapWidth   - Full pixel width of the game world.
     * @param {number} mapHeight  - Full pixel height of the game world.
     */
    updatePlayerMarker(playerX, playerY, mapWidth, mapHeight) {
        this._syncSize();

        const { canvas, ctx } = this;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const markerX = (playerX / mapWidth) * canvas.width;
        const markerY = (playerY / mapHeight) * canvas.height;

        ctx.beginPath();
        ctx.arc(markerX, markerY, UI_CONFIG.MINIMAP.MARKER.RADIUS, 0, Math.PI * 2);
        ctx.fillStyle   = UI_CONFIG.MINIMAP.MARKER.FILL;
        ctx.fill();
        ctx.strokeStyle = UI_CONFIG.MINIMAP.MARKER.STROKE;
        ctx.lineWidth   = UI_CONFIG.MINIMAP.MARKER.LINE_WIDTH;
        ctx.stroke();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    /** Keeps canvas pixel dimensions in sync with the container's display size. */
    _syncSize() {
        if (this.canvas.width !== this.container.offsetWidth) {
            this.canvas.width  = this.container.offsetWidth;
            this.canvas.height = this.container.offsetHeight;
        }
    }
}
