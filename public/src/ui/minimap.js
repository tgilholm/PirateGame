export default class Minimap {
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

			const layerProcess = layers
				.map((layer) => ({
					data: map.getLayer(layer.name).data,
					colour: layer.colour,
				}))
				.reverse();

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

			rt.snapshot((image) => {
				if (image instanceof HTMLImageElement) {
					const dataUrl = image.src;

					rt.destroy();
					resolve(dataUrl);
				}
			});
		});
	}
}
