import Interactable from './interactables/interactable';
import Ship from './ship';

export type TreasureState = 'buried' | 'opening' | 'dugup' | 'carried' | 'loose' | 'hole';

export default class Treasure extends Interactable {
	public goldValue: number;
	public spawnedAt: number;
	public state: TreasureState;
	public digProgress: number;
	public carrierId: string | null;
	public digSpeed: number;
	public successZoneStart: number;
	public successZoneSize: number;
	public carriedByPendingPlayerId: string | null;
	public openedAt: number | null;
	public holeExpiresAt: number | null;

	constructor(
		id: string,
		x: number,
		y: number,
		goldValue: number,
		state: TreasureState = 'buried',
		digProgress: number = 0,
		carrierId: string | null = null,
		digSpeed: number = 1,
		successZoneStart: number = 0.4,
		successZoneSize: number = 0.2
	) {
		super(id, x, y, null, 'treasure');

		this.goldValue = goldValue;
		this.spawnedAt = Date.now();
		this.state = state;
		this.digProgress = digProgress;
		this.carrierId = carrierId;
		this.digSpeed = digSpeed;
		this.successZoneStart = successZoneStart;
		this.successZoneSize = successZoneSize;
		this.openedAt = null;
		this.holeExpiresAt = null;
		this.carriedByPendingPlayerId = null;
	}
	//return position of chest when on ship parent
	public getChestShipPos(): { x: number; y: number } {
		if (this.parent instanceof Ship) {
			return (this.parent as Ship).localToWorld(this.x, this.y);
		}
		return { x: this.x, y: this.y };
	}

	protected override toState(): Record<string, any> {
		const worldPos = this.getChestShipPos();
		return {
			...super.toState(),
			x: worldPos.x,
			y: worldPos.y,
			goldValue: this.goldValue,
			state: this.state,
			digProgress: this.digProgress,
			digSpeed: this.digSpeed,
			successZoneStart: this.successZoneStart,
			successZoneSize: this.successZoneSize,
			openedAt: this.openedAt,
			holeExpiresAt: this.holeExpiresAt,
		};
	}
}
