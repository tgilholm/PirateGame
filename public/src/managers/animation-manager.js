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
		this.scene.anims.create({
			key: 'pirate-idle-down',
			frames: this.scene.anims.generateFrameNumbers('pirate', { start: 0, end: 2 }),
			frameRate: 8,
			repeat: -1,
		});
		this.scene.anims.create({
			key: 'pirate-idle-up',
			frames: this.scene.anims.generateFrameNumbers('pirate', { start: 4, end: 6 }),
			frameRate: 8,
			repeat: -1,
		});
		this.scene.anims.create({
			key: 'pirate-idle-right',
			frames: this.scene.anims.generateFrameNumbers('pirate', { start: 8, end: 10 }),
			frameRate: 8,
			repeat: -1,
		});
		this.scene.anims.create({
			key: 'pirate-idle-left',
			frames: this.scene.anims.generateFrameNumbers('pirate', { start: 12, end: 14 }),
			frameRate: 8,
			repeat: -1,
		});
		this.scene.anims.create({
			key: 'pirate-walk-down',
			frames: this.scene.anims.generateFrameNumbers('pirate', { start: 16, end: 18 }),
			frameRate: 8,
			repeat: -1,
		});
		this.scene.anims.create({
			key: 'pirate-walk-up',
			frames: this.scene.anims.generateFrameNumbers('pirate', { start: 20, end: 22 }),
			frameRate: 8,
			repeat: -1,
		});
		this.scene.anims.create({
			key: 'pirate-walk-right',
			frames: this.scene.anims.generateFrameNumbers('pirate', { start: 24, end: 26 }),
			frameRate: 8,
			repeat: -1,
		});
		this.scene.anims.create({
			key: 'pirate-walk-left',
			frames: this.scene.anims.generateFrameNumbers('pirate', { start: 28, end: 30 }),
			frameRate: 8,
			repeat: -1,
		});
		this.scene.anims.create({
			key: 'pirate-death',
			frames: this.scene.anims.generateFrameNumbers('pirate', { start: 72, end: 75 }),
			frameRate: 8,
			repeat: -1,
		});
		this.scene.anims.create({
			key: 'pirate-swim',
			frames: this.scene.anims.generateFrameNumbers('pirate', { start: 76, end: 78 }),
			frameRate: 8,
			repeat: -1,
		});
		this.scene.anims.create({
			key: 'pirate-dig-right',
			frames: this.scene.anims.generateFrameNumbers('pirate', { start: 64, end: 66 }),
			frameRate: 8,
			repeat: -1,
		});
		this.scene.anims.create({
			key: 'pirate-dig-left',
			frames: this.scene.anims.generateFrameNumbers('pirate', { start: 68, end: 70 }),
			frameRate: 8,
			repeat: -1,
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
