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
		this.load.spritesheet('pirate_default', 'assets/pirate.png', {
			frameWidth: 16,
			frameHeight: 16,
		});
		this.load.spritesheet('pirate_red', 'assets/pirate-red.png', { frameWidth: 16, frameHeight: 16 });
		this.load.spritesheet('pirate_blue', 'assets/pirate-blue.png', { frameWidth: 16, frameHeight: 16 });
		this.load.spritesheet('pirate_green', 'assets/pirate-green.png', { frameWidth: 16, frameHeight: 16 });
		this.load.spritesheet('pirate_yellow', 'assets/pirate-yellow.png', { frameWidth: 16, frameHeight: 16 });
		this.load.spritesheet('pirate_white', 'assets/pirate-white.png', { frameWidth: 16, frameHeight: 16 });
		this.load.spritesheet('pirate_grey', 'assets/pirate-grey.png', { frameWidth: 16, frameHeight: 16 });

		this.load.image('tiles', '/assets/terrain-tilesheet.png');
		this.load.image('cannon', '/assets/cannon.png');
		this.load.image('helm', '/assets/helm.png');
		this.load.image('ladder', '/assets/ladder.png');
		this.load.tilemapTiledJSON('map', '/shared/demo-map.json');
		this.load.image('treasure-chest', '/assets/chest.png');
		this.load.image('x-mark', '/assets/redcross.png');
		this.load.image('shovel', '/assets/shovel.png');
		this.load.image('hole', '/assets/hole.png');
		this.load.image('money-stack', '/assets/money-stack.png');
		this.load.spritesheet('chest_open', '/assets/chestopen.png', {
			frameWidth: 48,
			frameHeight: 48,
		});
		this.load.image('chest-in-hole', '/assets/chestinhole.png');

		// Placeholder player sprite
		const circle = this.make.graphics();
		circle.fillStyle(0xff0000, 1);
		circle.fillCircle(15, 15, 15);
		circle.generateTexture('player_circle', 30, 30);
		circle.destroy();

		// Placeholder cannonball sprite
		const ball = this.make.graphics();
		ball.fillStyle(0x222222, 1);
		ball.fillCircle(8, 8, 8);
		ball.generateTexture('cannonball', 16, 16);
		ball.destroy();

		const proj = this.make.graphics();
		proj.fillStyle(0x222222, 1);
		proj.fillCircle(4, 4, 4);
		proj.generateTexture('bullet', 8, 8);
		proj.destroy();

		// Placeholder NPC sprite
		const square = this.make.graphics();
		square.fillStyle(0x0000dd);
		square.fillRect(0, 0, 30, 30);
		square.generateTexture('npc_sprite', 30, 30);
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
		const COLOURS = ['default', 'red', 'blue', 'green', 'yellow', 'white', 'grey'];
		this.selectedColour = COLOURS[0];

		const pickerEl = document.getElementById('colour-picker');
		pickerEl.style.display = 'flex';

		COLOURS.forEach((colour) => {
			const btn = document.getElementById(`colour-btn-${colour}`);
			btn.addEventListener('click', () => {
				this.selectedColour = colour;
				document.querySelectorAll('.colour-btn').forEach((b) => b.classList.remove('selected'));
				btn.classList.add('selected');
			});
		});

		document.getElementById('colour-btn-default').classList.add('selected');
	}

	/**
	 * Hides all in-game UI elements and shows the input form. Used when returning to the start scene
	 */
	resetUI() {
		this.ui.style.display = 'none';
		this.form.style.display = 'flex';
		this.logo.style.display = 'flex';
		document.getElementById('colour-picker').style.display = 'none';
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
			this.scene.start('MainScene', { username, pirateColour: this.selectedColour });
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
