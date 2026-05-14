//tutorial menu manager
export default class TutorialUI {
	constructor() {
		this.menu = document.getElementById('tutorial-menu');

		const closeButton = document.getElementById('tutorial-close-button');
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
