/**
 * manages simple animations (e.g. cannonball splashes), Sprite-sheet layout, 8-frame grid (3 cols × 3 rows, last cell empty), 25 × 25 pixels per frame, sheet 75 × 75
 */
export default class AnimationManager {
	/**
	 * @param {Phaser.Scene} scene
	 */
	constructor(scene) {
		this.scene = scene;
		this.registerAnimations();
	}

	/**
	 * registers all animation definitions to phaser
	 */
	registerAnimations() {
		const defs = [
			{ key: 'cannon-water-splash', texture: 'cannon-water-splash' },
			{ key: 'cannon-dust-splash', texture: 'cannon-dust-splash' },
			{ key: 'cannon-blood-splash', texture: 'cannon-blood-splash' },
			{ key: 'bullet-water-splash', texture: 'bullet-water-splash' },
			{ key: 'bullet-dust-splash', texture: 'bullet-dust-splash' },
			{ key: 'bullet-blood-splash', texture: 'bullet-blood-splash' },
		];

		defs.forEach(({ key, texture }) => {
			if (!this.scene.anims.exists(key)) {
				const frames = this.scene.anims.generateFrameNumbers(texture, {
					start: 0,
					end: 7,
				});

				this.scene.anims.create({
					key: key,
					frames: frames,
					frameRate: 12,
					repeat: 0,
				});
			}
		});
	}

	/**
	 * plays splash animation at the given coordinates and destroys sprite once the animation is complete
	 *
	 * @param {number} x  world x
	 * @param {number} y  world y
	 * @param {"cannon-water" | "cannon-land" | "cannon-blood" | "bullet-water" | "bullet-land" | "bullet-blood"} splashType  which animation to play
	 */
	playSplash(x, y, splashType = 'cannon-water') {
		const keyMap = {
			'cannon-water': 'cannon-water-splash',
			'cannon-land': 'cannon-dust-splash',
			'cannon-blood': 'cannon-blood-splash',
			'bullet-water': 'bullet-water-splash',
			'bullet-land': 'bullet-dust-splash',
			'bullet-blood': 'bullet-blood-splash',
		};

		const animKey = keyMap[splashType] ?? 'cannon-water-splash';

		const sprite = this.scene.add.sprite(x, y + 6, animKey);

		sprite.setOrigin(0.5, 0.8);
		sprite.setDepth(10);
		sprite.setScale(4);
		sprite.setBlendMode(Phaser.BlendModes.ADD);
		sprite.play(animKey);
		sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
			sprite.destroy();
		});
	}

	/**
	 * @param {Array<{x: number, y: number, splashType: "cannon-water"|"cannon-land"|"cannon-blood"|"bullet-water"|"bullet-land"|"bullet-blood"}>} splashEvents
	 */
	handleSplashEvents(splashEvents) {
		if (!splashEvents?.length) return;
		splashEvents.forEach(({ x, y, splashType }) => this.playSplash(x, y, splashType));
	}
}
