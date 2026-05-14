import Interactable from './interactable';
import { TreasureState } from '@shared/socket-protocol';
import Ship from '../ship';

export default class Treasure extends Interactable {
	public goldValue: number;
	public spawnedAt: number;
	public state: TreasureState = TreasureState.BURIED;
	public carried: boolean = false;
	public openedAt: number | null;
	public expiresAt: number = 0;

	constructor(id: string, x: number, y: number, goldValue: number) {
		super(id, x, y, null, 'treasure');

		this.goldValue = goldValue;
		this.spawnedAt = Date.now();
		this.openedAt = null;
	}

	//return position of chest when on ship parent
	public getChestShipPos(): { x: number; y: number } {
		if (this.parent instanceof Ship) {
			return (this.parent as Ship).localToWorld(this.x, this.y);
		}
		return { x: this.x, y: this.y };
	}

	toState() {
		return {
			...super.toState(),
			x: this.x,
			y: this.y,
			goldValue: this.goldValue,
			state: this.state,
			openedAt: this.openedAt,
		};
	}
}
