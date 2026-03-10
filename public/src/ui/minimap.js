import DomFactory from "./dom-factory.js";
import uiConfig from "./ui-config.json" with { type: "json" };

//Minimap — builds and manages the minimap and minimap marker

export default class Minimap {

    /**
     * @param {HTMLElement} containerEl - The #minimap-container element to populate
     */
    constructor(containerEl) {
        this.container = containerEl;
        this.mapWidth = 0;
        this.mapHeight = 0;
        this.mapTileWidth = 0;
        this.mapTileHeight = 0;
        this.createMinimap();
    }

    /**
     * sets minimap container, and adds the image, dictated by ui-config
     * @param {string} [imgSrc]
     * @param {number} [size]
     */
    createMinimap(
        imgSrc = uiConfig.Minimap.ImgSrc,
        size = uiConfig.Minimap.Size
    ) {
        this.container.style.width = size + "px";
        this.container.style.height = size + "px";

        const { img, canvas } = DomFactory.createMinimapContent(this.container, imgSrc);
        canvas.width = size;
        canvas.height = size;
        this.img = img;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
    }

    /**
     * sets minimap to visible and draws marker at players spawn position
     * @param {number} spawnX - Initial world X position of the player.
     * @param {number} spawnY - Initial world Y position of the player.
     * @param {number} mapWidth - pixel width of the game world.
     * @param {number} mapHeight - pixel height of the game world.
     */
    placeMarker(spawnX, spawnY, mapWidth, mapHeight) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.container.style.display = "block";
        this.drawMarker(spawnX, spawnY);
    }

    /**
     * every frame, clears canvas and redraws marker at the players position
     * @param {number} playerX - Current world X position of the player.
     * @param {number} playerY - Current world Y position of the player.
     */
    updateMarker(playerX, playerY) {
        const { canvas, ctx } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.drawShops();
        this.drawMarker(playerX, playerY);
    }

    /**
     * draws marker, conditions from ui-config
     * @param {number} x - World X position.
     * @param {number} y - World Y position.
     */
    drawMarker(x, y) {
        const { canvas, ctx } = this;
        const markerX = (x / this.mapWidth) * canvas.width;
        const markerY = (y / this.mapHeight) * canvas.height;

        ctx.beginPath();
        ctx.arc(markerX, markerY, uiConfig.Minimap.PlayerMarker.Radius, 0, Math.PI * 2);
        ctx.fillStyle = uiConfig.Minimap.PlayerMarker.Fill;
        ctx.fill();
        ctx.strokeStyle = uiConfig.Minimap.PlayerMarker.Stroke;
        ctx.lineWidth = uiConfig.Minimap.PlayerMarker.LineWidth;
        ctx.stroke();
    }

    //draws shop icons on minimap canvas, called after mapTileWidth/Height are set
    placeShops(mapTileWidth, mapTileHeight, spawns) {
        this.mapTileWidth = mapTileWidth;
        this.mapTileHeight = mapTileHeight;
        this.shops = spawns;
        this.drawShops();
    }

    //draws icon for shops
    drawShops() {
        if (!this.shops) return;
        const { canvas, ctx } = this;
        const { Size, Fill, Stroke, LineWidth } = uiConfig.Minimap.ShopMarker;
        const half = Size / 2;

        for (const shop of this.shops) {
            const sx = (shop.X / this.mapTileWidth) * canvas.width;
            const sy = (shop.Y / this.mapTileHeight) * canvas.height;

            ctx.beginPath();
            ctx.rect(sx - half, sy - half, Size, Size);
            ctx.fillStyle = Fill;
            ctx.fill();
            ctx.strokeStyle = Stroke;
            ctx.lineWidth = LineWidth;
            ctx.stroke();
        }
    }

}
