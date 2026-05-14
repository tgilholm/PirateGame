// tutorial menu manager
const pages = [
	{
		title: 'Movement',
		left: {
			image: 'tutorial-moving',
			desc: 'Use WASD to move on the ship. Interact with the ladders at the side of the ship to enter/exit.',
		},
		right: {
			image: 'tutorial-steering',
			desc: 'Use WASD to steer the ship. Enter or exit the quarterdeck to gain or relinquish control of the ship.',
		},
	},
	{
		title: 'Fighting',
		left: { image: 'tutorial-gun', desc: 'Aim with the mouse and shoot with the left mouse button.' },
		right: { image: 'tutorial-sword', desc: 'Aim with the mouse and swing with the right mouse button.' },
	},
	{
		title: 'Treasure',
		left: {
			image: 'tutorial-digging',
			desc: 'Interact with X mark to use your shovel. Time your dig to land a success in the green zone to uncover treasure.',
		},
		right: { image: 'tutorial-treasure', desc: 'Interact with treasure to pick it up and place it on your ship.' },
	},
	{
		title: 'Shops',
		left: { image: 'tutorial-shop', desc: 'Bring your treasure to the shop to sell it.' },
		right: { image: 'tutorial-upgrades', desc: 'Use your gold to purchase upgrades for your ship.' },
	},
	{
		title: 'Plundering',
		left: {
			image: 'tutorial-boss',
			desc: 'Press space while steering or interact with the cannons to aim manually.',
		},
		right: { image: 'tutorial-plunder', desc: 'Fight the boss and sink their ship to plunder mighty booty.' },
	},
];

export default class TutorialUI {
	constructor() {
		this.menu = document.getElementById('tutorial-menu');
		this.titleEl = document.getElementById('tutorial-title');
		this.bodyEl = document.getElementById('tutorial-body');
		this.indicatorEl = document.getElementById('tutorial-page-indicator');
		this.prevBtn = document.getElementById('tutorial-prev');
		this.nextBtn = document.getElementById('tutorial-next');

		this.currentPage = 0;

		this.prevBtn.addEventListener('click', () => this.goTo(this.currentPage - 1));
		this.nextBtn.addEventListener('click', () => this.goTo(this.currentPage + 1));
		document.getElementById('tutorial-close-button').addEventListener('click', () => this.hide());

		this.render();
	}

	goTo(index) {
		this.currentPage = Math.max(0, Math.min(pages.length - 1, index));
		this.render();
	}

	render() {
		const page = pages[this.currentPage];

		this.titleEl.textContent = page.title;
		this.indicatorEl.textContent = this.currentPage + 1 + ' / ' + pages.length;
		this.prevBtn.disabled = this.currentPage == 0;
		this.nextBtn.disabled = this.currentPage == pages.length - 1;

		// clear previous content
		while (this.bodyEl.firstChild) this.bodyEl.removeChild(this.bodyEl.firstChild);

		this.bodyEl.appendChild(this.makePanel(page.left));

		const divider = document.createElement('div');
		divider.className = 'tutorial-divider';
		this.bodyEl.appendChild(divider);

		this.bodyEl.appendChild(this.makePanel(page.right));
	}

	makePanel(data) {
		const panel = document.createElement('div');
		panel.className = 'tutorial-panel';

		const imageWrap = document.createElement('div');
		imageWrap.className = 'tutorial-image-wrap';

		const img = document.createElement('img');
		img.className = 'tutorial-img';
		img.src = 'assets/' + data.image + '.png';
		img.alt = data.image;

		const placeholder = document.createElement('div');
		placeholder.className = 'tutorial-img-placeholder';
		placeholder.textContent = '[' + data.image + ']';

		img.addEventListener('error', () => {
			img.style.display = 'none';
			placeholder.style.display = 'flex';
		});

		imageWrap.appendChild(img);
		imageWrap.appendChild(placeholder);

		const desc = document.createElement('div');
		desc.className = 'tutorial-desc';
		desc.textContent = data.desc;

		panel.appendChild(imageWrap);
		panel.appendChild(desc);

		return panel;
	}

	get isVisible() {
		return this.menu.style.display !== 'none';
	}

	show() {
		this.menu.style.display = 'flex';
	}

	hide() {
		this.menu.style.display = 'none';
		this.goTo(0);
	}

	toggle() {
		if (this.isVisible) {
			this.hide();
		} else {
			this.show();
		}
	}
}
