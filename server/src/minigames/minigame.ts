export default abstract class Minigame {
	public startedAt: number = Date.now();

	constructor(
		public duration: number,
		public type: string
	) {}

	abstract serialise(): any;
}
