import SoundManager from '../managers/sound-manager.js';
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
		this.track = document.getElementById('spTrack');
		this.current = 0;
		this.shipChoices = 5;

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
			this.handleResize();
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

		// Tilesheets
		this.load.image('island-tiles', '/assets/island-tiles.png');
		this.load.image('fort-tiles', '/assets/fort-tiles.png');
		this.load.image('water-tiles', '/assets/water-tiles.png');
		this.load.image('ship-tiles', '/assets/ship-tiles.png');

		this.load.spritesheet('ship-sprites', '/assets/ship-sprites.png', {
			frameWidth: 128,
			frameHeight: 46,
			spacing: 1,
		});

		this.load.spritesheet('cannon-sprites', '/assets/cannon-sprites.png', {
			frameWidth: 12,
			frameHeight: 10,
		});

		this.load.spritesheet('leaf-ani', 'assets/leaf-ani.png', {
			frameWidth: 16,
			frameHeight: 16,
		});

		this.load.spritesheet('skelly_front', '/assets/skellyfront.png', { frameWidth: 48, frameHeight: 48 });
		this.load.spritesheet('skelly_back', '/assets/skellyback.png', { frameWidth: 48, frameHeight: 48 });
		this.load.spritesheet('skelly_right', '/assets/skellyright.png', { frameWidth: 48, frameHeight: 48 });
		this.load.spritesheet('skelly_left', '/assets/skellyleft.png', { frameWidth: 48, frameHeight: 48 });

		this.load.image('helm', '/assets/helm.png');
		this.load.image('ladder', '/assets/ladder.png');
		this.load.tilemapTiledJSON('map', '/shared/map.json');
		this.load.image('treasure-chest', '/assets/chest.png');
		this.load.image('x-mark', '/assets/redcross.png');
		this.load.image('hole', '/assets/hole.png');
		this.load.image('money-stack', '/assets/money-stack.png');
		this.load.spritesheet('chest_open', '/assets/chestopen.png', {
			frameWidth: 64,
			frameHeight: 64,
		});
		this.load.image('chest-in-hole', '/assets/chestinhole.png');
		this.load.image('coconut', '/assets/coconut.png');
		this.load.image('bandage', '/assets/bandage.png');
		this.load.image('palm-tree', '/assets/palm-tree-pix.png');
		this.load.image('barrel', '/assets/barrel-idle.png');
		this.load.spritesheet('barrel-hit', '/assets/barrel-hit.png', { frameWidth: 32, frameHeight: 32 });
		this.load.spritesheet('barrel-break', '/assets/barrel-break.png', { frameWidth: 32, frameHeight: 32 });

		//audio placeholders
		this.load.audio('music-start', 'assets/music-start.mp3');
		this.load.audio('music-main', 'assets/music-main.mp3');
		this.load.audio('music-waves', 'assets/music-waves.mp3');
		this.load.audio('sound-cannon', 'assets/sound-cannon.mp3');
		this.load.audio('sound-gun', 'assets/sound-gun.mp3');
		this.load.audio('sound-dig', 'assets/sound-dig.mp3');
		this.load.audio('sound-climb', 'assets/sound-climb.mp3');
		this.load.audio('sound-yell', 'assets/sound-yell.mp3');
		this.load.audio('sound-sword', 'assets/sound-sword.mp3');
		this.load.audio('sound-sword-hit', 'assets/sound-sword-hit.mp3');
		this.load.audio('sound-pickup-money', 'assets/sound-pickup-money.mp3');
		this.load.json('volume-config', 'src/managers/volume-config.json');
		this.load.json('settings-config', 'src/managers/settings-config.json');

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

		this.soundManager = new SoundManager(this);
		this.soundManager.playMusic('music-start');

		// To shortcut the start scene, uncomment the below text
		// let inputText = document.getElementById('input-text');
		// // @ts-ignore
		// inputText.value = 'abc';
		// this.goToMain();

		const gold = document.getElementById('gold-counter');
		if (gold) gold.style.display = 'none';

		const settingsBtn = document.getElementById('settings-button');
		if (settingsBtn) settingsBtn.style.display = 'none';

		this.background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'background');
		this.background.setOrigin(0, 0);

		this.titleImage = this.add.image(0, 0, 'title');
		this.ship = this.add.sprite(0, 0, 'ship');
		this.ship2 = this.add.sprite(0, 0, 'ship');

		// Animate the ship sprite
		this.anims.create({
			key: 'fly',
			frames: this.anims.generateFrameNumbers('ship', { start: 0, end: 2 }),
			frameRate: 8,
			repeat: -1,
		});
		this.ship.play('fly');
		this.ship2.play('fly');

		this.anims.create({
			key: 'chest-open',
			frames: [
				{ key: 'chest_open', frame: 0 },
				{ key: 'chest_open', frame: 0 },
				{ key: 'chest_open', frame: 1 },
				{ key: 'chest_open', frame: 2 },
				{ key: 'chest_open', frame: 1 },
				{ key: 'chest_open', frame: 2 },
			],
			frameRate: 10,
			repeat: 0,
		});

		this.titleTween = null;

		this.handleResize();

		const COLOURS = ['default', 'red', 'blue', 'green', 'yellow', 'white', 'grey'];
		this.selectedColour = COLOURS[0];

		const pickerEl = document.getElementById('colour-picker');
		pickerEl.style.display = 'flex';

		COLOURS.forEach((colour) => {
			const btn = document.getElementById(`colour-btn-${colour}`);
			btn.addEventListener('click', (e) => {
				e.preventDefault();
				this.selectedColour = colour;
				document.querySelectorAll('.colour-btn').forEach((b) => b.classList.remove('selected'));
				btn.classList.add('selected');
			});
		});

		document.getElementById('colour-btn-default').classList.add('selected');

		const prev = document.getElementById('spPrev');
		const next = document.getElementById('spNext');

		prev.addEventListener('click', (e) => {
			e.preventDefault();
			this.goTo(this.current - 1);
		});

		next.addEventListener('click', (e) => {
			e.preventDefault();
			this.goTo(this.current + 1);
		});
	}

	handleResize() {
		const w = this.scale.width;
		const h = this.scale.height;

		const centerX = w / 2;
		const centerY = h / 2;
		const leftX = w / 4;
		const rightX = centerX + leftX;

		if (this.background) {
			this.background.setSize(w, h);
		}

		if (this.titleImage) {
			this.titleImage.setPosition(centerX, h * 0.2);
		}

		const shipY = h * 0.75;
		if (this.ship) this.ship.setPosition(leftX, shipY);
		if (this.ship2) this.ship2.setPosition(rightX, shipY);

		if (this.titleTween) {
			this.titleTween.stop();
			this.titleTween.remove();
		}
		if (this.titleImage) {
			const baseY = h * 0.2;
			this.titleImage.y = baseY;
			this.titleTween = this.tweens.add({
				targets: this.titleImage,
				y: baseY - 25,
				duration: 2000,
				ease: 'Sine.inOut',
				yoyo: true,
				loop: -1,
			});
		}
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
			this.soundManager.stopMusic();

			// Hide the form before continuing
			this.form.style.display = 'none';
			this.logo.style.display = 'none';
			this.ui.style.display = 'flex';
			this.scene.start('MainScene', { username, pirateColour: this.selectedColour, shipChoice: this.current });
		}
	}

	goTo(index) {
		this.current = (index + this.shipChoices) % this.shipChoices; // wraparound
		this.track.style.transform = `translateX(-${this.current * 256}px)`;
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
