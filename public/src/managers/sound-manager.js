/**
 * manager for sound effects and music, sounds preloaded in start-scene
 */
export default class SoundManager {
	/**
	 * @param {Phaser.Scene} scene
	 */
	constructor(scene) {
		this.scene = scene;

		/** @type {Phaser.Sound.BaseSound | null} */
		this.currentMusic = null;

		this.sfxVolume = 1;
		this.musicVolume = 0.5;
		this.muted = false;

		/** @type {Map<string, Phaser.Sound.BaseSound>} */
		this.sounds = new Map();

		this.registerSounds();
	}

	/**
	 * all sounds
	 */
	registerSounds() {
		const soundList = [{ key: 'sound-cannon' }, { key: 'sound-gun' }];

		const musicList = [{ key: 'music-start' }, { key: 'music-main' }];

		soundList.forEach(({ key }) => {
			if (this.scene.cache.audio.has(key)) {
				this.sounds.set(key, this.scene.sound.add(key, { volume: this.sfxVolume }));
			}
		});

		musicList.forEach(({ key }) => {
			if (this.scene.cache.audio.has(key)) {
				this.sounds.set(key, this.scene.sound.add(key, { volume: this.musicVolume, loop: true }));
			}
		});
	}

	/**
	 * plays sound effect
	 * @param {string} key sfx key
	 * @param {number} [volumeScale=1] optional scale
	 */
	playSfx(key, volumeScale = 1) {
		if (this.muted) return;

		const sound = this.sounds.get(key);
		if (!sound) {
			console.log('sfx: ' + key + ' — not loaded');
			return;
		}

		//set volume
		/** @type {any} */ (sound).setVolume(this.sfxVolume * volumeScale);
		console.log('sfx: ' + key + ' (volume: ' + (this.sfxVolume * volumeScale).toFixed(2) + ')');
		sound.play();
	}

	/**
	 * loops music
	 * @param {string} key  music key (e.g. 'music-main')
	 */
	playMusic(key) {
		if (this.currentMusic?.isPlaying) {
			this.currentMusic.stop();
		}

		const music = this.sounds.get(key);
		if (!music) {
			console.log('music: ' + key + ' — not loaded');
			return;
		}

		/** @type {any} */ (music).setVolume(this.muted ? 0 : this.musicVolume);
		console.log('music: ' + key + ' (volume: ' + this.musicVolume.toFixed(2) + ')');
		music.play();
		this.currentMusic = music;
	}

	/**
	 * stops music
	 */
	stopMusic() {
		if (this.currentMusic?.isPlaying) {
			this.currentMusic.stop();
		}
		this.currentMusic = null;
	}

	/**
	 * @param {number} sfx 0–1
	 * @param {number} music 0–1
	 */
	setVolume(sfx, music) {
		this.sfxVolume = sfx;
		this.musicVolume = music;

		this.sounds.forEach((sound, key) => {
			const isMusicTrack = key.startsWith('music-');
			/** @type {any} */ (sound).setVolume(isMusicTrack ? music : sfx);
		});
	}

	/**
	 * mutes all audio
	 */
	mute() {
		this.muted = true;
		this.scene.sound.setMute(true);
	}

	/**
	 * unmutes all audio
	 */
	unmute() {
		this.muted = false;
		this.scene.sound.setMute(false);
	}
}
