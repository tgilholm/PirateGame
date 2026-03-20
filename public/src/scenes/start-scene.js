/**
 * The "landing page" for users to the game. Features a dynamic background and title
 * and routes users to the main scene.
 */
export class StartScene extends Phaser.Scene {
	constructor() {
		super('Start');
		this.background = null;
	}

	/**
	 * Preload all the assets for the game before the player presses "join".
	 */
	preload() {
		this.load.image('background', 'assets/water.png');
		this.load.image('title', 'assets/title.png');
		//this.load.image('cannonball','assets/cannonball.png') // yoohoooo
		this.load.spritesheet('ship', 'assets/ship.png', { frameWidth: 320, frameHeight: 320 });
		this.load.spritesheet('cannon-water-splash', 'assets/cannon-water-splash.png', {
			frameWidth: 25,
			frameHeight: 25,
		});
		this.load.spritesheet('cannon-dust-splash', 'assets/cannon-dust-splash.png', {
			frameWidth: 25,
			frameHeight: 25,
		});
		this.load.spritesheet('cannon-blood-splash', 'assets/cannon-blood-splash.png', {
			frameWidth: 25,
			frameHeight: 25,
		});
		this.load.spritesheet('bullet-water-splash', 'assets/bullet-water-splash.png', {
			frameWidth: 25,
			frameHeight: 25,
		});
		this.load.spritesheet('bullet-dust-splash', 'assets/bullet-dust-splash.png', {
			frameWidth: 25,
			frameHeight: 25,
		});
		this.load.spritesheet('bullet-blood-splash', 'assets/bullet-blood-splash.png', {
			frameWidth: 25,
			frameHeight: 25,
		});
		this.load.image('tiles', '/assets/terrain-tilesheet.png');
		this.load.image('cannon', '/assets/cannon.png');
		this.load.image('helm', '/assets/helm.png');
		this.load.image('ladder', '/assets/ladder.png');
		this.load.tilemapTiledJSON('map', '/shared/demo-map.json');
		this.load.image('treasure-chest', '/assets/chest.png');
		this.load.image('x-mark', '/assets/redcross.png');
		this.load.image('shovel', '/assets/shovel.png');
		this.load.image('hole', '/assets/hole.png');
		this.load.spritesheet('chest_open', '/assets/chestopen.png', {
			frameWidth: 48,
			frameHeight: 48,
		});
		this.load.image('chest-in-hole', '/assets/chestinhole.png');

		// Resize the game if the window changes size
		window.addEventListener('resize', () => {
			this.scale.resize(window.innerWidth, window.innerHeight);
		});
	}

	/**
	 * Creates the moving background and sets up a listener on the input form
	 */
	create() {
		// width & height are given in game config
		const centerX = this.scale.width / 2;
		const centerY = this.scale.height / 2;

		const gold = document.getElementById('gold-counter');
		if (gold) gold.style.display = 'none';

		// Add the animated background
		this.background = this.add.tileSprite(
			centerX,
			centerY,
			this.scale.width,
			this.scale.height,
			'background'
		);

		const title = this.add.image(centerX, 200, 'title');
		const ship = this.add.sprite(centerX, 700, 'ship');

		// Animate the ship sprite
		this.anims.create({
			key: 'fly',
			frames: this.anims.generateFrameNumbers('ship', { start: 0, end: 2 }),
			frameRate: 8,
			repeat: -1,
		});
		ship.play('fly');

		this.anims.create({
			key: 'chest-open',
			frames: [
				{ key: 'chest_open', frame: 0 },
				{ key: 'chest_open', frame: 1 },
				{ key: 'chest_open', frame: 2 },
				{ key: 'chest_open', frame: 1 },
				{ key: 'chest_open', frame: 2 },
			],
			frameRate: 10,
			repeat: 0,
		});

		// Make the title text "wave" in and out
		this.tweens.add({
			targets: title,
			y: 150,
			duration: 2000,
			ease: 'Sine.inOut',
			yoyo: true,
			loop: -1,
		});

		// Get the username from the textinput
		let startBtn = document.getElementById('start-btn');
		let form = document.getElementById('input-form');
		startBtn.addEventListener('click', () => this.goToMain());
		form.addEventListener('submit', (e) => {
			e.preventDefault();
			this.goToMain();
		});
	}

	goToMain() {
		let inputText = document.getElementById('input-text');
		// @ts-ignore because getElementById returns HTMLElement, not HTMLInputElement- it works regardless
		let username = inputText.value;

		if (username) // not null or empty
		{
			// Hide the form before continuing
			document.getElementById('input-form').style.display = 'none';
			this.scene.start('MainScene', { username }); // Pass the username to the main scene
		}
	}

	/**
	 * Updates the scrolling background
	 */
	update() {
		// Vertically scroll
		if (this.background) {
			this.background.tilePositionY -= 6;
		}
	}
}
