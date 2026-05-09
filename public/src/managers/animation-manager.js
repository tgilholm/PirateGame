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
		this.registerSkeletonAnimations();
		this.playLeafBurst();
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
			{ key: 'leaf-fall', texture: 'leaf-ani', frameCount: 5 },
			{ key: 'barrel-hit', texture: 'barrel-hit', start: 0, end: 1, frameRate: 24, repeat: 0 },
			{ key: 'barrel-break', texture: 'barrel-break', start: 0, end: 10, frameRate: 24, repeat: 0 },
		];

		defs.forEach(({ key, texture, frameCount }) => {
			if (!this.scene.anims.exists(key)) {
				const frames = this.scene.anims.generateFrameNumbers(texture, {
					start: 0,
					end: frameCount ? frameCount - 1 : 7,
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
			{ suffix: 'shoot-down', start: 32, end: 34, repeat: 0 },
			{ suffix: 'shoot-up', start: 36, end: 38, repeat: 0 },
			{ suffix: 'shoot-right', start: 40, end: 42, repeat: 0 },
			{ suffix: 'shoot-left', start: 44, end: 46, repeat: 0 },
			{ suffix: 'atk-down', start: 48, end: 50, repeat: 0 },
			{ suffix: 'atk-up', start: 52, end: 54, repeat: 0 },
			{ suffix: 'atk-right', start: 56, end: 58, repeat: 0 },
			{ suffix: 'atk-left', start: 60, end: 62, repeat: 0 },
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

	/**
	 * Spawns several leaf sprites falling from the tree position
	 * @param {number} x  world x of the palm tree
	 * @param {number} y  world y of the palm tree
	 */
	playLeafBurst(x, y) {
		const COUNT = 6; // how many leaves to scatter
		for (let i = 0; i < COUNT; i++) {
			const offsetX = (Math.random() - 0.5) * 40;
			const sprite = this.scene.add.sprite(x + offsetX, y - 20, 'leaf-ani');
			sprite.setDepth(20);
			sprite.setScale(2 + Math.random()); // slight size variety

			// random rotation for each leaf
			const spin = (Math.random() - 0.5) * 0.1;

			// drift downward using a tween while playing the animation
			this.scene.tweens.add({
				targets: sprite,
				x: sprite.x + (Math.random() - 0.5) * 60,
				y: sprite.y + 80 + Math.random() * 40,
				angle: (Math.random() - 0.5) * 180,
				alpha: 0,
				duration: 800 + Math.random() * 400,
				ease: 'Sine.Out',
				onComplete: () => sprite.destroy(),
			});

			sprite.play('leaf-fall');
		}
	}

	registerSkeletonAnimations() {
		const COLS = 23;

		const rowFrames = (row, startCol, endCol) => {
			const base = row * COLS;
			const out = [];
			for (let c = startCol; c <= endCol; c++) out.push(base + c);
			return out;
		};

		const defs = [
			// down (skellyfront)
			{ key: 'skelly-down-idle', texture: 'skelly_front', frames: rowFrames(0, 0, 4), frameRate: 6, repeat: -1 },
			{ key: 'skelly-down-walk', texture: 'skelly_front', frames: rowFrames(2, 0, 7), frameRate: 8, repeat: -1 },
			{ key: 'skelly-down-hurt', texture: 'skelly_front', frames: rowFrames(3, 0, 4), frameRate: 10, repeat: 0 },
			{
				key: 'skelly-down-attack',
				texture: 'skelly_front',
				frames: rowFrames(6, 0, 12),
				frameRate: 12,
				repeat: 0,
			},
			{
				key: 'skelly-down-death',
				texture: 'skelly_front',
				frames: rowFrames(5, 0, 5),
				frameRate: 12,
				repeat: 0,
			},
			// up (skellyback)
			{ key: 'skelly-up-idle', texture: 'skelly_back', frames: rowFrames(0, 0, 4), frameRate: 6, repeat: -1 },
			{ key: 'skelly-up-walk', texture: 'skelly_back', frames: rowFrames(2, 0, 7), frameRate: 8, repeat: -1 },
			{ key: 'skelly-up-hurt', texture: 'skelly_back', frames: rowFrames(3, 0, 4), frameRate: 10, repeat: 0 },
			{ key: 'skelly-up-attack', texture: 'skelly_back', frames: rowFrames(6, 0, 12), frameRate: 12, repeat: 0 },
			{ key: 'skelly-up-death', texture: 'skelly_back', frames: rowFrames(5, 0, 5), frameRate: 6, repeat: 0 },
			// right (skellyright)
			{ key: 'skelly-right-idle', texture: 'skelly_right', frames: rowFrames(0, 0, 4), frameRate: 6, repeat: -1 },
			{ key: 'skelly-right-walk', texture: 'skelly_right', frames: rowFrames(2, 0, 7), frameRate: 8, repeat: -1 },
			{ key: 'skelly-right-hurt', texture: 'skelly_right', frames: rowFrames(3, 0, 4), frameRate: 10, repeat: 0 },
			{
				key: 'skelly-right-attack',
				texture: 'skelly_right',
				frames: rowFrames(6, 0, 12),
				frameRate: 12,
				repeat: 0,
			},
			{
				key: 'skelly-right-death',
				texture: 'skelly_right',
				frames: rowFrames(5, 0, 5),
				frameRate: 12,
				repeat: 0,
			},
			// left (skellyleft) — right to left
			{ key: 'skelly-left-idle', texture: 'skelly_left', frames: rowFrames(0, 18, 22), frameRate: 6, repeat: -1 },
			{ key: 'skelly-left-walk', texture: 'skelly_left', frames: rowFrames(2, 15, 22), frameRate: 8, repeat: -1 },
			{ key: 'skelly-left-hurt', texture: 'skelly_left', frames: rowFrames(3, 18, 22), frameRate: 10, repeat: 0 },
			{
				key: 'skelly-left-attack',
				texture: 'skelly_left',
				frames: rowFrames(6, 10, 22),
				frameRate: 12,
				repeat: 0,
			},
			{ key: 'skelly-left-death', texture: 'skelly_left', frames: rowFrames(5, 0, 5), frameRate: 12, repeat: 0 },
		];

		for (const def of defs) {
			if (this.scene.anims.exists(def.key)) continue;
			this.scene.anims.create({
				key: def.key,
				frames: def.frames.map((f) => ({ key: def.texture, frame: f })),
				frameRate: def.frameRate,
				repeat: def.repeat,
			});
		}
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
