/**
 * Base class for all entity objects in the game. Defines variables common to all entities.
 */
export default abstract class Entity {
	public id: string;
	public type: string;
	public x: number; // x coord
	public y: number; // y coord
	public vx: number; // velocity in x axis
	public vy: number; // velocity in y axis
	public r: number; // rotation
	public av: number; // angular velocity
	public health: number;
	protected _maxHealth: number;
	public parent: Entity | null; // all entities can "technically" have parents
	public supertypes: string[] = []; // all "memberships"

	// "Dirty"- meaning this entity has changed recently
	public dirty: boolean = true; // starts dirty so first broadcast always sends
	private lastSent: Record<string, any> = {}; // keep track per-entity
	public pendingTeleport: boolean = false; // used for respawn

	/**
	 * Builds an entity with the provided data
	 * @param id the (must be unique) id of this entity
	 * @param type the type (e.g. "interactable") of this entity- this allows getByType to work properly
	 * @param x the x coordinate (relative/absolute)
	 * @param y the y coordinate (relative/absolute)
	 * @param maxHealth the starting/max health of this entity
	 * @param parent the physics parent of this entity (e.g. a Ship)
	 */
	constructor(id: string, type: string, x: number, y: number, maxHealth: number, parent: Entity | null) {
		this.id = id;
		this.type = type;
		this.x = x;
		this.y = y;

		// Entity starts off not moving
		this.vx = 0;
		this.vy = 0;
		this.r = 0;
		this.av = 0;

		// All entities have health and can be destroyed
		this.parent = parent;
		this._maxHealth = maxHealth;
		this.health = maxHealth; // Start at maximum
	}

	/**
	 * Set this entity as "dirty" if the properties within it have changed
	 * recently- this will force the entity's data to be sent on the next packet
	 */
	public markDirty(): void {
		this.dirty = true;
	}

	public get maxHealth() {
		return this._maxHealth;
	}

	/**
	 * Clear this entity's "dirty" state if it has not changed in a while.
	 */
	public clearDirty(): void {
		this.dirty = false;
		this.pendingTeleport = false;
	}

	protected toState(): Record<string, any> {
		return {
			id: this.id,
			type: this.type,
			x: this.x,
			y: this.y,
			vx: this.vx,
			vy: this.vy,
			r: this.r,
			av: this.av,
			parentId: this.parent?.id ?? null,
			health: this.health,
			maxHealth: this.maxHealth,
			teleport: this.pendingTeleport,
		};
	}

	public get isDead() {
		return this.health <= 0;
	}

	/**
	 * Full serialisation- used when entities first enter the view range of a client
	 */
	serialise(): any {
		const state = this.toState();
		this.clearDirty();
		this.lastSent = { ...state };
		return state;
	}

	/**
	 * Delta serialisation- only includes fields that have meaningfully changed
	 * since the last full serialise() or serialiseDelta() call. The id of this
	 * entity is always sent, so the client knows what to update.
	 * @returns a record of the changes, or null if nothing has changed.
	 */
	serialiseDelta(): Record<string, any> | null {
		const delta: Record<string, any> = { id: this.id };

		if (this.dirty) {
			const state = this.toState();
			this.clearDirty();
			this.lastSent = { ...state };
			return state; // full state as delta  no double call
		}

		const current = this.toState();
		let hasChanges = false;

		for (const key of Object.keys(current)) {
			if (key === 'id') continue;
			const curr = current[key];
			const old = this.lastSent[key];
			let changed: boolean;
			if (typeof curr === 'number' && typeof old === 'number') {
				const threshold =
					key === 'r' || key === 'av'
						? 0.001
						: key === 'x' || key === 'y'
							? 0.5
							: key === 'vx' || key === 'vy'
								? 0.05
								: 0.001;
				changed = Math.abs(curr - old) > threshold;
			} else {
				changed = curr !== old;
			}
			if (changed) {
				delta[key] = curr;
				hasChanges = true;
			}
		}

		if (hasChanges) {
			this.lastSent = { ...this.lastSent, ...delta };
			return delta;
		}
		return null;
	}
}
