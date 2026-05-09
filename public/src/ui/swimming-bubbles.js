export default class SwimmingBubbles {
	constructor(scene, parent) {
		this.scene = scene;
		this.parent = parent;
		this.bubbles = [];
		this.container = scene.add.container(0, -30);
		parent.add(this.container);

		// Create 4 bubble sprites
		for (let i = 0; i < 4; i++) {
			const bubble = scene.add.circle(i * 12 - 18, 0, 4, 0x87ceeb, 1);
			bubble.setStrokeStyle(1, 0xffffff);
			this.bubbles.push(bubble);
			this.container.add(bubble);
		}

		this.container.setVisible(false); // Hidden by default
	}

	update(bubblesRemaining, isSwimming) {
		// Only show bubbles when swimming
		this.container.setVisible(isSwimming);

		if (!isSwimming) return;

		// Pop bubbles from right to left
		for (let i = 0; i < 4; i++) {
			if (i < bubblesRemaining) {
				this.bubbles[i].setVisible(true);
				this.bubbles[i].setAlpha(1);
			} else {
				this.bubbles[i].setVisible(false);
			}
		}
	}

	destroy() {
		this.container.destroy();
	}
}
