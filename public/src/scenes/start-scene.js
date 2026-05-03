/**
 * The "landing page" for users to the game. Features a dynamic background and title
 * and routes users to the main scene.
 */
export class StartScene extends Phaser.Scene {
	constructor() {
		super('StartScene');
		this.background = null;
		this.ui = document.getElementById('ui-container');
		this.form = document.getElementById('input-form');
		this.logo = document.getElementById('repo-link');

		// Get the username from the textinput
		let startBtn = document.getElementById('start-btn');

		startBtn.addEventListener('click', () => this.goToMain());
		this.form.addEventListener('submit', (e) => {
			e.preventDefault();
			this.goToMain();
		});

		// Resize the game if the window changes size
		window.addEventListener('resize', () => {
			this.scale.resize(window.innerWidth, window.innerHeight);
		});
	}

	/**
	 * Preload all the assets for the game before the player presses "join".
	 */
	preload() {
		const bar = document.getElementById('loading-bar');
		const text = document.getElementById('loading-text');

		this.load.on('progress', (progress) => {
			bar.style.width = `${Math.round(progress * 100)}%`;
			text.textContent = `Loading... ${Math.round(progress * 100)}%`;
		});

		this.load.on('complete', () => {
			document.getElementById('loading-screen').style.display = 'none';
			this.form.style.display = 'flex';
		});

		this.load.image('background', 'assets/water.png');
		this.load.image('title', 'assets/title.png');
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

		// Tilesheets
		this.load.image('island-tiles', '/assets/island-tiles.png');
		this.load.image('fort-tiles', '/assets/fort-tiles.png');
		this.load.image('water-tiles', '/assets/water-tiles.png');
		this.load.image('ship-tiles', '/assets/ship-tiles.png');

		this.load.spritesheet('ship-sprites', '/assets/ship-sprites.png', {
			frameWidth: 128,
			frameHeight: 48,
			spacing: 2,
		});

		this.load.spritesheet('cannon-sprites', '/assets/cannon-sprites.png', {
			frameWidth: 12,
			frameHeight: 10,
		});

		this.load.spritesheet('player-sprites', '/assets/pirate-sprites.png', {
			frameWidth: 12,
			frameHeight: 14,
			margin: 3,
			spacing: 4,
		});

		this.load.image('helm', '/assets/helm.png');
		this.load.image('ladder', '/assets/ladder.png');
		this.load.tilemapTiledJSON('map', '/shared/map.json');
		this.load.image('treasure-chest', '/assets/chest.png');
		this.load.image('x-mark', '/assets/redcross.png');
		this.load.image('hole', '/assets/hole.png');
		this.load.image('money-stack', '/assets/money-stack.png');
		this.load.spritesheet('chest_open', '/assets/chestopen.png', {
			frameWidth: 48,
			frameHeight: 48,
		});
		this.load.image('chest-in-hole', '/assets/chestinhole.png');

		// Placeholder cannonball sprite
		const ball = this.make.graphics();
		ball.fillStyle(0x222222, 1);
		ball.fillCircle(4, 4, 4);
		ball.generateTexture('cannonball', 8, 8);
		ball.destroy();

		const proj = this.make.graphics();
		proj.fillStyle(0x222222, 1);
		proj.fillCircle(2, 2, 2);
		proj.generateTexture('bullet', 4, 4);
		proj.destroy();

		// Placeholder NPC sprite
		const square = this.make.graphics();
		square.fillStyle(0x0000dd);
		square.fillRect(0, 0, 12, 12);
		square.generateTexture('npc_sprite', 12, 12);
		square.destroy();
	}

	/**
	 * Creates the moving background and sets up a listener on the input form
	 */
	create() {
		this.resetUI();
		this.input.keyboard.disableGlobalCapture(); // stop key events going to the game instead of the form

		// To shortcut the start scene, uncomment the below text
		// let inputText = document.getElementById('input-text');
		// // @ts-ignore
		// inputText.value = 'abc';
		// this.goToMain();

		// width & height are given in game config
		const centerX = this.scale.width / 2;
		const centerY = this.scale.height / 2;

		const gold = document.getElementById('gold-counter');
		if (gold) gold.style.display = 'none';

		// Add the animated background
		this.background = this.add.tileSprite(centerX, centerY, this.scale.width, this.scale.height, 'background');

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
	}

	/**
	 * Hides all in-game UI elements and shows the input form. Used when returning to the start scene
	 */
	resetUI() {
		this.ui.style.display = 'none';
		this.form.style.display = 'flex';
		this.logo.style.display = 'flex';
	}

	goToMain() {
		let inputText = document.getElementById('input-text');
		// @ts-ignore because getElementById returns HTMLElement, not HTMLInputElement- it works regardless
		let username = inputText.value;
		if (username) // not null or empty
		{
			// Hide the form before continuing
			this.form.style.display = 'none';
			this.logo.style.display = 'none';
			this.ui.style.display = 'flex';
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
