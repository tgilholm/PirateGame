export default class Minimap {
	/**
	 *
	 * @param {Phaser.Tilemaps.Tilemap} map
	 * @param {HTMLCanvasElement} canvas
	 */
	constructor(map, canvas) {
		this.map = map;
		this.width = map.width;
		this.height = map.height;
		this.canvas = canvas;

		if (this.canvas) {
			this.canvas.width = this.width;
			this.canvas.height = this.height;
		}
		this.context = this.canvas.getContext('2d');
	}

	clear() {
		if (this.context) {
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		}
	}

	/**
	 * @param {number} worldX
	 * @param {number} worldY
	 * @param {string} colour
	 */
	drawCircle(worldX, worldY, colour = 'red', radius = 1.5) {
		if (!this.context) return;

		const startAngle = 0;
		const endAngle = Math.PI * 2;

		// convert to canvas context
		const { x, y } = this.getCanvasPos(worldX, worldY);

		this.context.fillStyle = colour;
		this.context.beginPath();

		this.context.arc(x, y, radius, startAngle, endAngle); // a circle
		this.context.fill();
	}

	/**
	 * Draws the local player's marker with a circle and text
	 * @param {number} worldX the position of the player in the x axis
	 * @param {number} worldY the position of the player in the y axis
	 * @returns nothing
	 */
	drawLocalPlayerMarker(worldX, worldY) {
		if (!this.context) return;

		const colour = 'purple';
		const { x, y } = this.getCanvasPos(worldX, worldY);
		const radius = 10; // slightly larger than other icons

		const startAngle = 0;
		const endAngle = Math.PI * 2;

		// convert to canvas context
		this.context.fillStyle = colour;
		this.context.beginPath();

		this.context.arc(x, y, radius, startAngle, endAngle); // a circle
		this.context.fill();

		this.context.restore();

		// Draw "you" text level (not rotated)
		this.context.save();
		this.context.translate(x, y);
		this.context.fillStyle = 'purple';
		this.context.font = '32px Arial';
		this.context.textAlign = 'center';
		this.context.fillText('YOU', 0, -radius - 3);

		this.context.restore();
	}

	drawRect(worldX, worldY, worldWidth, worldHeight, colour = 'red') {
		if (!this.context) return;
		const tileSize = this.map.tileHeight;

		const { x, y } = this.getCanvasPos(worldX, worldY);
		const width = worldWidth / tileSize;
		const height = worldHeight / tileSize;

		this.context.fillStyle = colour;
		this.context.beginPath();
		this.context.fillRect(x, y, width, height);
	}

	drawAngledRect(worldX, worldY, worldWidth, worldHeight, angle, colour = 'red') {
		if (!this.context) return;
		const tileSize = this.map.tileHeight;

		const { x, y } = this.getCanvasPos(worldX, worldY);
		const width = worldWidth / tileSize;
		const height = worldHeight / tileSize;

		this.context.save();
		this.context.translate(x, y); // move rotation origin point
		this.context.rotate(angle);
		this.context.fillStyle = colour;
		this.context.fillRect(-width / 2, -height / 2, width, height); // midpoint of rect

		// reset for next item
		this.context.restore();
	}

	/**
	 *
	 * @param {Phaser.Tilemaps.Tilemap} map
	 * @param {Phaser.Scene} scene
	 * @param {{name: string, colour: number}[]} layers
	 * @returns {Promise<string>} a url to the image
	 */
	async createMinimapImage(map, scene, layers) {
		return new Promise((resolve) => {
			const mapW = map.width;
			const mapH = map.height;

			const rt = scene.add.renderTexture(0, 0, mapW, mapH).setVisible(false);
			const g = scene.add.graphics();

			// Get the x, y for each tile
			const layerProcess = layers
				.map((layer) => ({
					data: map.getLayer(layer.name).data,
					colour: layer.colour,
				}))
				.reverse();

			// draw a 1x1 pixel of the specified colour for each layer
			for (let y = 0; y < mapH; y++) {
				for (let x = 0; x < mapW; x++) {
					let colour = null;

					for (const layer of layerProcess) {
						const tile = layer.data[y][x];
						if (tile && tile.index !== -1) {
							colour = layer.colour;
							break;
						}
					}

					if (colour !== null) {
						g.fillStyle(colour, 1);
						g.fillRect(x, y, 1, 1);
					}
				}
			}

			rt.draw(g);
			g.destroy();

			// Return a promise for the url to the image
			rt.snapshot((image) => {
				if (image instanceof HTMLImageElement) {
					const dataUrl = image.src;

					rt.destroy();
					resolve(dataUrl);
				}
			});
		});
	}

	getCanvasPos(worldX, worldY, tileSize = 16) {
		return { x: worldX / tileSize, y: worldY / tileSize };
	}
}
