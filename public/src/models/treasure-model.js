/* global Phaser */
import { TreasureState } from 'shared/built/socket-protocol.js';
import InteractableModel from './interactable-model.js';

export default class TreasureModel extends InteractableModel {
	constructor(scene, id, x, y, state = TreasureState.BURIED) {
		super(scene, null, id, 'treasure', x, y, 'x-mark', 'Dig up treasure');

		this.state = state;
		this.add(this.sprite);
		this.setDepth(15);

		this.applyVisuals();
	}

	sync(data) {
		const previousState = this.state;
		super.sync(data);

		if (data.x !== undefined || data.y !== undefined) {
			this.x = this.target.x;
			this.y = this.target.y;
		}

		if (data.state !== undefined) this.state = data.state;
		if (data.carrierId !== undefined) this.carrierId = data.carrierId;
		if (data.goldValue !== undefined) this.goldValue = data.goldValue;

		if (previousState !== this.state) {
			if (
				this.state === TreasureState.OPENING ||
				(this.state === TreasureState.DUGUP && previousState === TreasureState.BURIED)
			) {
				this.playChestReveal();
			}
		}

		this.applyVisuals();
	}

	applyVisuals() {
		if (this.state === TreasureState.BURIED) {
			this.sprite.setTexture('x-mark');
			this.isInteractable = true;
		} else if (this.state === TreasureState.OPENING) {
			this.sprite.setTexture('chest_open');
			this.isInteractable = false;
		} else if (this.state === TreasureState.DUGUP) {
			this.usePrompt = 'Pick up treasure';
			this.sprite.setTexture('chest-in-hole');
			this.isInteractable = true;
		} else if (this.state === TreasureState.CARRIED) {
			this.sprite.setVisible(false);
			this.isInteractable = false;
		} else if (this.state === TreasureState.DROPPED) {
			this.sprite.setVisible(true);
			this.usePrompt = 'Pick up treasure';
			this.sprite.setTexture('treasure-chest');
			this.isInteractable = true;
		} else if (this.state === TreasureState.HOLE) {
			this.sprite.setTexture('hole');
			this.isInteractable = false;
		}

		// Go underneath ships when dropped off them
		this.parentId ? this.setDepth(15) : this.setDepth(1); // underneath the ship
	}

	playChestReveal() {
		this.sprite.setVisible(true);
		this.sprite.setTexture('chest_open');

		if (this.sprite.anims) {
			this.sprite.play('chest-open');
		}

		this.scene.tweens.add({
			targets: this.sprite,
			scaleX: 1.15,
			scaleY: 1.15,
			duration: 140,
			yoyo: true,
			ease: 'Back.Out',
		});

		const text = this.scene.add.text(this.x, this.y - 40, `+${this.goldValue} gold`, {
			fontFamily: 'VT323',
			fontSize: '12px',
			color: '#ffd54a',
			stroke: '#000000',
			strokeThickness: 2,
		});

		text.setOrigin(0.5);
		text.setDepth(1000);

		this.scene.tweens.add({
			targets: text,
			y: text.y - 32,
			alpha: 0,
			duration: 950,
			ease: 'Cubic.Out',
			onComplete: () => text.destroy(),
		});
	}
}
