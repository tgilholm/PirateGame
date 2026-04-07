/**
 * DomFactory — generic static DOM factory.
 * Provides reusable helpers for building UI elements.
 * Any UI class (DebugMenu, ShopUI, Minimap, etc.) can call these methods
 * instead of manually constructing DOM nodes.
 */
export default class DomFactory {
	/**
	 * Creates a DOM element with HTML attributes.
	 * @param {string} tag - element tag name (div, button, span)
	 * @param {string[]} [classes] - CSS class names to add
	 * @param {Object} [attrs] - (key / value) pairs set as HTML attributes
	 * @returns {HTMLElement}
	 */
	static createElement(tag, classes = [], attrs = {}) {
		const el = document.createElement(tag);
		if (classes.length) el.classList.add(...classes);
		for (const [key, val] of Object.entries(attrs)) {
			el.setAttribute(key, val);
		}
		return el;
	}

	/**
	 * Creates styled button element
	 * @param {string} label - Button text content
	 * @param {PointerEvent} onClick - Click event handler
	 * @param {string[]} [extraClasses] - Additional CSS classes to add
	 * @returns {HTMLButtonElement}
	 */
	static createButton(label, onClick, extraClasses = []) {
		const btn = /** @type {HTMLButtonElement} */ (DomFactory.createElement('button', extraClasses));
		btn.textContent = label;
		btn.addEventListener('click', onClick);
		return btn;
	}

	/**
	 * Creates a shop item card
	 * e.g.
	 *   <div class="shop-card">
	 *     <span class="shop-card-name">Name</span>
	 *     <p class="shop-card-description">Description</p>
	 *     <button class="shop-card-buy">Buy</button>
	 *   </div>
	 *
	 * @param {string} name - Item name
	 * @param {string} description - Short item description
	 * @param {Function} onBuy - Called when the buy button is clicked
	 * @returns {HTMLElement}
	 */
	static createCard(name, description, onBuy) {
		const card = DomFactory.createElement('div', ['shop-card']);

		const nameEl = DomFactory.createElement('span', ['shop-card-name']);
		nameEl.textContent = name;
		card.appendChild(nameEl);

		const descEl = DomFactory.createElement('p', ['shop-card-description']);
		descEl.textContent = description;
		card.appendChild(descEl);

		card.appendChild(DomFactory.createButton('Buy', onBuy, ['shop-card-buy']));

		return card;
	}

	/**
	 * Creates a labelled section with a row of buttons
	 * e.g.
	 *   <div class="debug-section" data-component-key="">
	 *     <span class="debug-label">Label</span>
	 *     <div class="debug-buttons">...buttons...</div>
	 *   </div>
	 *
	 * @param {string} labelText
	 * @param {{ label: string, onClick: Function }[]} buttons
	 * @returns {HTMLElement}
	 */
	static createSection(labelText, buttons) {
		const section = DomFactory.createElement('div', ['debug-section']);

		const label = DomFactory.createElement('span', ['debug-label']);
		label.textContent = labelText;
		section.appendChild(label);

		const btnContainer = DomFactory.createElement('div', ['debug-buttons']);
		for (const { label: btnLabel, onClick } of buttons) {
			btnContainer.appendChild(DomFactory.createButton(btnLabel, onClick));
		}
		section.appendChild(btnContainer);

		return section;
	}

	/**
	 * Builds and appends the debug menu DOM to the container.
	 * @param {HTMLElement} [container=document.body]
	 * @returns {{ menu, statsSection, statsBtn, statsOverlay, statsContent }}
	 */
	static createDebugMenuDOM(container = document.body) {
		const menu = DomFactory.createElement('div', [], { id: 'debug-menu' });
		menu.style.display = 'none';

		const heading = DomFactory.createElement('h3');
		heading.textContent = 'Debug Menu';
		menu.appendChild(heading);

		const statsSection = DomFactory.createElement('div', ['debug-section']);
		statsSection.style.marginTop = '8px';

		const statsBtn = /** @type {HTMLButtonElement} */ (
			DomFactory.createElement('button', [], { id: 'printStatsButton' })
		);
		statsBtn.textContent = 'Print Ship Stats';
		statsSection.appendChild(statsBtn);
		menu.appendChild(statsSection);

		const statsOverlay = DomFactory.createElement('div', [], { id: 'stats-overlay' });
		const overlayHeading = DomFactory.createElement('h3');
		overlayHeading.textContent = 'Ship Stats';
		statsOverlay.appendChild(overlayHeading);

		const statsContent = DomFactory.createElement('div', [], { id: 'stats-content' });
		statsOverlay.appendChild(statsContent);

		container.appendChild(menu);
		container.appendChild(statsOverlay);

		return { menu, statsSection, statsBtn, statsOverlay, statsContent };
	}
}
