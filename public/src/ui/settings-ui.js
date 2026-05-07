import SoundManager from '../managers/sound-manager.js';

//manages settings menu, mostly copy past from shop menu, takes defaults from settings-config, saves user changes to localStorage, and applies to SoundManager
export default class SettingsUI {
	/**
	 * @param {SoundManager} soundManager
	 * @param {object} defaultConfig  — from settings-config.json (sfx: number, music: number)
	 */
	constructor(soundManager, defaultConfig) {
		this.soundManager = soundManager;

		this.menu = document.getElementById('settings-menu');
		this.musicSlider = /** @type {HTMLInputElement} */ (document.getElementById('music-slider'));
		this.sfxSlider = /** @type {HTMLInputElement} */ (document.getElementById('sfx-slider'));
		this.musicValue = document.getElementById('music-value');
		this.sfxValue = document.getElementById('sfx-value');

		//loads from localStorage, fall back to settings-config defaults
		const savedSfx = localStorage.getItem('settings-sfx');
		const savedMusic = localStorage.getItem('settings-music');

		const sfx = savedSfx !== null ? parseFloat(savedSfx) : (defaultConfig?.sfx ?? 1.0);
		const music = savedMusic !== null ? parseFloat(savedMusic) : (defaultConfig?.music ?? 1.0);

		//creates volume sliders
		this.sfxSlider.value = String(Math.round(sfx * 100));
		this.musicSlider.value = String(Math.round(music * 100));
		this.sfxValue.textContent = this.sfxSlider.value + '%';
		this.musicValue.textContent = this.musicSlider.value + '%';

		//applies initial volumes
		this.soundManager.setVolume(sfx, music);

		//event listeners for volume sliders
		this.musicSlider.addEventListener('input', () => {
			const val = parseInt(this.musicSlider.value, 10);
			this.musicValue.textContent = val + '%';
			const normalized = val / 100;
			localStorage.setItem('settings-music', String(normalized));
			this.soundManager.setVolume(parseInt(this.sfxSlider.value, 10) / 100, normalized);
		});

		this.sfxSlider.addEventListener('input', () => {
			const val = parseInt(this.sfxSlider.value, 10);
			this.sfxValue.textContent = val + '%';
			const normalized = val / 100;
			localStorage.setItem('settings-sfx', String(normalized));
			this.soundManager.setVolume(normalized, parseInt(this.musicSlider.value, 10) / 100);
		});

		const closeButton = document.getElementById('settings-close-button');
		closeButton.addEventListener('click', () => this.hide());
	}

	get isVisible() {
		return this.menu.style.display !== 'none';
	}

	show() {
		this.menu.style.display = 'block';
	}

	hide() {
		this.menu.style.display = 'none';
	}

	toggle() {
		if (this.isVisible) {
			this.hide();
		} else {
			this.show();
		}
	}
}
