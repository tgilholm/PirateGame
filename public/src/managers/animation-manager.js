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
		this.registerPlayerAnimations();
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

	registerPlayerAnimations() {
		const COLOURS = ['default', 'red', 'blue', 'green', 'yellow', 'white', 'grey'];
		const animDefs = [
			{ suffix: 'idle-down', start: 0, end: 2, repeat: -1 },
			{ suffix: 'idle-up', start: 4, end: 6, repeat: -1 },
			{ suffix: 'idle-right', start: 8, end: 10, repeat: -1 },
			{ suffix: 'idle-left', start: 12, end: 14, repeat: -1 },
			{ suffix: 'walk-down', start: 16, end: 18, repeat: -1 },
			{ suffix: 'walk-up', start: 20, end: 22, repeat: -1 },
			{ suffix: 'walk-right', start: 24, end: 26, repeat: -1 },
			{ suffix: 'walk-left', start: 28, end: 30, repeat: -1 },
			{ suffix: 'death', start: 72, end: 75, repeat: 0 },
			{ suffix: 'swim', start: 76, end: 78, repeat: -1 },
			{ suffix: 'dig-right', start: 64, end: 66, repeat: -1 },
			{ suffix: 'dig-left', start: 68, end: 70, repeat: -1 },
		];

		COLOURS.forEach((colour) => {
			const textureKey = `pirate_${colour}`;
			animDefs.forEach(({ suffix, start, end, repeat }) => {
				const key = `pirate-${colour}-${suffix}`;
				if (!this.scene.anims.exists(key)) {
					this.scene.anims.create({
						key,
						frames: this.scene.anims.generateFrameNumbers(textureKey, { start, end }),
						frameRate: 8,
						repeat,
					});
				}
			});
		});
	}

	registerSkeletonAnimations() {
		const animDefs = [
			{ suffix: 'idle-down', start: 0, end: 2, repeat: -1 },
			{ suffix: 'idle-up', start: 4, end: 6, repeat: -1 },
			{ suffix: 'idle-right', start: 8, end: 10, repeat: -1 },
			{ suffix: 'idle-left', start: 12, end: 14, repeat: -1 },
			{ suffix: 'walk-down', start: 16, end: 18, repeat: -1 },
			{ suffix: 'walk-up', start: 20, end: 22, repeat: -1 },
			{ suffix: 'walk-right', start: 24, end: 26, repeat: -1 },
			{ suffix: 'walk-left', start: 28, end: 30, repeat: -1 },
			{ suffix: 'atk-left', start: 28, end: 30, repeat: -1 },
			{ suffix: 'atk-right', start: 28, end: 30, repeat: -1 },
			{ suffix: 'atk-down', start: 28, end: 30, repeat: -1 },
			{ suffix: 'atk-up', start: 28, end: 30, repeat: -1 },
			{ suffix: 'death', start: 72, end: 75, repeat: 0 },
		];
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
